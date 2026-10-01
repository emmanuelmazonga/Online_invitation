import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  try {
    const adminClient = createSupabaseAdminClient();
    const { data: approved } = await adminClient
      .from("admin_users")
      .select("id")
      .eq("email", parsed.data.email)
      .eq("active", true)
      .maybeSingle();

    if (!approved) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const sessionClient = await createSupabaseServerClient();
    const { error } = await sessionClient.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Sign-in is unavailable right now. Try again shortly." }, { status: 500 });
  }
}
