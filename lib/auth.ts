import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const adminRoles = ["owner", "admin", "check_in"] as const;
export type AdminRole = (typeof adminRoles)[number];

export interface AdminAccess {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

type AdminRow = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string;
  role: AdminRole;
  active: boolean;
};

export async function getAdminAccess(allowedRoles: readonly AdminRole[] = adminRoles): Promise<AdminAccess | null> {
  try {
    const sessionClient = await createSupabaseServerClient();
    const { data: { user }, error } = await sessionClient.auth.getUser();
    const email = user?.email?.trim().toLowerCase();
    if (error || !user || !email) return null;

    const adminClient = createSupabaseAdminClient();
    let { data } = await adminClient
      .from("admin_users")
      .select("id,user_id,email,full_name,role,active")
      .eq("user_id", user.id)
      .maybeSingle<AdminRow>();

    if (!data) {
      const byEmail = await adminClient
        .from("admin_users")
        .select("id,user_id,email,full_name,role,active")
        .eq("email", email)
        .maybeSingle<AdminRow>();
      data = byEmail.data;

      if (data && !data.user_id) {
        const bound = await adminClient
          .from("admin_users")
          .update({ user_id: user.id, updated_at: new Date().toISOString() })
          .eq("id", data.id)
          .is("user_id", null)
          .select("id,user_id,email,full_name,role,active")
          .single<AdminRow>();
        data = bound.data;
      }
    }

    if (!data?.active || data.user_id !== user.id || !allowedRoles.includes(data.role)) return null;
    return { id: data.id, userId: user.id, email: data.email, fullName: data.full_name, role: data.role };
  } catch {
    return null;
  }
}
