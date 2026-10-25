import { NextResponse } from "next/server";
import { z } from "zod";
import { createRsvp, findByPhone } from "@/lib/rsvp-store";
import { normalizeZambianPhone } from "@/lib/phone";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  plusOneName: z.string().trim().max(120).optional().default(""),
  partyType: z.enum(["individual", "plus_one", "couple"]),
  whatsapp: z.string().trim().min(9).max(24),
  attendance: z.enum(["accepts", "declines"]),
  guestSide: z.enum(["bride_guest", "groom_guest", "bride_family", "groom_family"]),
  allocationAccepted: z.literal(true),
  whatsappConsent: z.literal(true),
  website: z.string().max(0),
});

const validatedSchema = schema.superRefine((data, context) => {
  if (data.partyType === "plus_one" && data.plusOneName.length < 2) {
    context.addIssue({ code: "custom", path: ["plusOneName"], message: "Enter your plus one's full name." });
  }
  if (data.partyType !== "plus_one" && data.plusOneName) {
    context.addIssue({ code: "custom", path: ["plusOneName"], message: "A plus-one name is only used for Individual + one." });
  }
});

const attempts = new Map<string, { count: number; reset: number }>();

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.reset > now && entry.count >= 5) {
    return NextResponse.json({ error: "Please wait a little before trying again." }, { status: 429 });
  }
  attempts.set(ip, entry && entry.reset > now ? { ...entry, count: entry.count + 1 } : { count: 1, reset: now + 60_000 });

  const parsed = validatedSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  const phone = normalizeZambianPhone(parsed.data.whatsapp);
  if (!phone) return NextResponse.json({ error: "Enter a valid Zambian WhatsApp number." }, { status: 400 });
  if (await findByPhone(phone)) {
    return NextResponse.json({ error: "It looks like an RSVP has already been submitted using this WhatsApp number." }, { status: 409 });
  }

  try {
    const record = await createRsvp({
      full_name: parsed.data.fullName,
      plus_one_name: parsed.data.partyType === "plus_one" ? parsed.data.plusOneName : null,
      party_type: parsed.data.partyType,
      whatsapp: phone,
      attendance: parsed.data.attendance,
      guest_side: parsed.data.guestSide,
    });
    return NextResponse.json({ firstName: record.full_name.split(/\s+/)[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === "DUPLICATE" || error.message.includes("duplicate"))) {
      return NextResponse.json({ error: "It looks like an RSVP has already been submitted using this WhatsApp number." }, { status: 409 });
    }
    return NextResponse.json({ error: "We could not receive your RSVP. Please try again." }, { status: 500 });
  }
}
