import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAccess } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  fullName: z.string().trim().min(2).max(120),
  role: z.enum(["owner", "admin", "check_in"]),
  password: z.string().min(12).max(128),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["owner", "admin", "check_in"]).optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  if (!(await getAdminAccess(["owner"]))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await createSupabaseAdminClient()
    .from("admin_users")
    .select("id,email,full_name,role,active,user_id,created_at,updated_at")
    .order("created_at");
  if (error) return NextResponse.json({ error: "Administrators could not be loaded." }, { status: 500 });
  return NextResponse.json({ admins: data });
}

export async function POST(request: Request) {
  if (!(await getAdminAccess(["owner"]))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a name, valid email, and role." }, { status: 400 });

  const adminClient = createSupabaseAdminClient();
  const { data: created, error: authError } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (authError || !created.user) {
    const duplicate = authError?.message.toLowerCase().includes("already") ?? false;
    return NextResponse.json({ error: duplicate ? "An authentication account already exists for that email." : "The administrator account could not be created." }, { status: duplicate ? 409 : 500 });
  }

  const { data, error } = await adminClient
    .from("admin_users")
    .insert({ email: parsed.data.email, full_name: parsed.data.fullName, role: parsed.data.role, user_id: created.user.id })
    .select("id,email,full_name,role,active,user_id,created_at,updated_at")
    .single();
  if (error) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    const duplicate = error.code === "23505";
    return NextResponse.json({ error: duplicate ? "That email is already on the admin list." : "The administrator could not be added." }, { status: duplicate ? 409 : 500 });
  }
  return NextResponse.json({ admin: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const owner = await getAdminAccess(["owner"]);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.role === undefined && parsed.data.active === undefined)) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }
  if (parsed.data.id === owner.id && (parsed.data.active === false || (parsed.data.role && parsed.data.role !== "owner"))) {
    return NextResponse.json({ error: "You cannot remove your own owner access." }, { status: 400 });
  }

  const patch = {
    ...(parsed.data.role ? { role: parsed.data.role } : {}),
    ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await createSupabaseAdminClient()
    .from("admin_users")
    .update(patch)
    .eq("id", parsed.data.id)
    .select("id,email,full_name,role,active,user_id,created_at,updated_at")
    .single();
  if (error) return NextResponse.json({ error: "The administrator could not be updated." }, { status: 500 });
  return NextResponse.json({ admin: data });
}
