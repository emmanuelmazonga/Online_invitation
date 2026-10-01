import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/auth";

export async function GET() {
  const access = await getAdminAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ access });
}
