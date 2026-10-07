import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAccess } from "@/lib/auth";
import { deleteRsvp, listRsvps, restoreDeclinedRsvp, uniqueReference, updateRsvp } from "@/lib/rsvp-store";

export async function GET() {
  const access = await getAdminAccess(["owner", "admin"]);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ guests: await listRsvps(), access });
}

const actionSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject", "check-in", "mark-sent", "restore-pending", "update"]),
  allocation: z.union([z.literal(1), z.literal(2)]).optional(),
  notes: z.string().max(1000).optional(),
});

export async function PATCH(request: Request) {
  const access = await getAdminAccess(["owner", "admin"]);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { id, action, allocation, notes } = parsed.data;
  if (action === "restore-pending" && access.role !== "owner") {
    return NextResponse.json({ error: "Only an owner can return a declined guest to pending." }, { status: 403 });
  }

  try {
    let guest;
    if (action === "approve") guest = await updateRsvp(id, { status: "Approved", guest_reference: await uniqueReference(), allocation: allocation ?? 1 });
    else if (action === "reject") guest = await updateRsvp(id, { status: "Declined" });
    else if (action === "check-in") guest = await updateRsvp(id, { status: "Checked In", checked_in_at: new Date().toISOString() });
    else if (action === "mark-sent") guest = await updateRsvp(id, { confirmation_sent_at: new Date().toISOString() });
    else if (action === "restore-pending") guest = await restoreDeclinedRsvp(id);
    else guest = await updateRsvp(id, { ...(allocation ? { allocation } : {}), ...(notes !== undefined ? { admin_notes: notes } : {}) });
    return NextResponse.json({ guest });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_DECLINED") {
      return NextResponse.json({ error: "Only a declined guest can be returned to pending." }, { status: 409 });
    }
    return NextResponse.json({ error: "The guest record could not be updated." }, { status: 500 });
  }
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function DELETE(request: Request) {
  if (!(await getAdminAccess(["owner"]))) return NextResponse.json({ error: "Only an owner can delete a guest." }, { status: 403 });
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    await deleteRsvp(parsed.data.id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ error: "Guest not found." }, { status: 404 });
    return NextResponse.json({ error: "The guest record could not be deleted." }, { status: 500 });
  }
}
