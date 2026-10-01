import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") ? requestedNext : "/admin";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && await getAdminAccess()) return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL("/admin?error=access_denied", url.origin));
}
