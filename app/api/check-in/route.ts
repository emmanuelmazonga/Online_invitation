import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAccess } from "@/lib/auth";
import { findByReference, updateRsvp } from "@/lib/rsvp-store";

const schema = z.object({ reference: z.string().trim().toUpperCase().regex(/^JD-[A-Z0-9]{5}$/), checkIn: z.boolean().optional() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "REFERENCE NOT FOUND" }, { status: 404 });

  const access = await getAdminAccess(["owner", "admin", "check_in"]);
  if (parsed.data.checkIn && !access) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });

  let guest = await findByReference(parsed.data.reference);
  if (!guest || (guest.status !== "Approved" && guest.status !== "Checked In")) {
    return NextResponse.json({ error: "REFERENCE NOT FOUND" }, { status: 404 });
  }
  if (parsed.data.checkIn && guest.status !== "Checked In") {
    guest = await updateRsvp(guest.id, { status: "Checked In", checked_in_at: new Date().toISOString() });
  }
  return NextResponse.json({
    canEdit: Boolean(access),
    guest: {
      id: guest.id,
      full_name: guest.full_name,
      guest_reference: guest.guest_reference,
      allocation: guest.allocation,
      status: guest.status,
      checked_in_at: guest.checked_in_at,
    },
  });
}
