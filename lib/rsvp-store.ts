import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { RsvpInput, RsvpRecord } from "@/lib/types";

const localFile = path.join(process.cwd(), "data", "guests.local.json");

function hasSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function readLocal(): Promise<RsvpRecord[]> {
  try {
    return JSON.parse(await fs.readFile(localFile, "utf8"));
  } catch {
    return [];
  }
}

async function writeLocal(rows: RsvpRecord[]) {
  await fs.mkdir(path.dirname(localFile), { recursive: true });
  await fs.writeFile(localFile, JSON.stringify(rows, null, 2), "utf8");
}

export async function listRsvps(): Promise<RsvpRecord[]> {
  if (hasSupabase()) {
    const { data, error } = await supabase().from("rsvps").select("*").order("submitted_at", { ascending: false });
    if (error) throw error;
    return data as RsvpRecord[];
  }
  return (await readLocal()).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
}

export async function createRsvp(input: RsvpInput): Promise<RsvpRecord> {
  const record: RsvpRecord = {
    id: crypto.randomUUID(),
    ...input,
    submitted_at: new Date().toISOString(),
    status: "Pending",
    allocation: 1,
    guest_reference: null,
    checked_in_at: null,
    confirmation_sent_at: null,
    admin_notes: "",
  };

  if (hasSupabase()) {
    const { data, error } = await supabase().from("rsvps").insert(record).select().single();
    if (error) throw error;
    return data as RsvpRecord;
  }

  const rows = await readLocal();
  if (rows.some((row) => row.whatsapp === record.whatsapp)) throw new Error("DUPLICATE");
  rows.push(record);
  await writeLocal(rows);
  return record;
}

export async function findByPhone(phone: string) {
  if (hasSupabase()) {
    const { data } = await supabase().from("rsvps").select("id").eq("whatsapp", phone).maybeSingle();
    return Boolean(data);
  }
  return (await readLocal()).some((row) => row.whatsapp === phone);
}

export async function findByReference(reference: string): Promise<RsvpRecord | null> {
  if (hasSupabase()) {
    const { data } = await supabase().from("rsvps").select("*").eq("guest_reference", reference).maybeSingle();
    return (data as RsvpRecord | null) ?? null;
  }
  return (await readLocal()).find((row) => row.guest_reference === reference) ?? null;
}

export async function updateRsvp(id: string, patch: Partial<RsvpRecord>): Promise<RsvpRecord> {
  if (hasSupabase()) {
    const { data, error } = await supabase().from("rsvps").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data as RsvpRecord;
  }
  const rows = await readLocal();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) throw new Error("NOT_FOUND");
  rows[index] = { ...rows[index], ...patch };
  await writeLocal(rows);
  return rows[index];
}

export async function deleteRsvp(id: string): Promise<void> {
  if (hasSupabase()) {
    const { data, error } = await supabase().from("rsvps").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("NOT_FOUND");
    return;
  }
  const rows = await readLocal();
  if (!rows.some((row) => row.id === id)) throw new Error("NOT_FOUND");
  await writeLocal(rows.filter((row) => row.id !== id));
}

export async function uniqueReference() {
  if (hasSupabase()) {
    const { data, error } = await supabase().rpc("next_guest_reference");
    if (error) throw error;
    if (typeof data !== "string" || !/^JD-\d{5}$/.test(data)) throw new Error("REFERENCE_GENERATION_FAILED");
    return data;
  }

  const rows = await readLocal();
  const highest = rows.reduce((maximum, row) => {
    const match = row.guest_reference?.match(/^JD-(\d{5})$/);
    return match ? Math.max(maximum, Number(match[1])) : maximum;
  }, 0);
  const next = highest + 1;
  if (next > 99_999) throw new Error("REFERENCE_GENERATION_FAILED");
  return `JD-${String(next).padStart(5, "0")}`;
}
