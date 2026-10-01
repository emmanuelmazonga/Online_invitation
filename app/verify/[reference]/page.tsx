import type { Metadata } from "next";
import Link from "next/link";
import { findByReference } from "@/lib/rsvp-store";

export const metadata: Metadata = { title: "Invitation Verification | James & Diana", robots: { index: false, follow: false } };
export default async function VerifyPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const guest = await findByReference(reference.toUpperCase());
  const valid = guest && ["Approved", "Checked In"].includes(guest.status);
  return <main className="public-verify"><div><span className="admin-mark">J <i>&amp;</i> D</span><p className="admin-eyebrow">Invitation verification</p><h1>{valid ? (guest.status === "Checked In" ? "Already checked in" : "Valid invitation") : "Reference not found"}</h1>{valid ? <><strong className="verify-code">{guest.guest_reference}</strong><p>Allocation: {guest.allocation === 2 ? "Couple" : "1 Person"}</p><p>Event staff must complete admission through the private check-in page.</p></> : <p>Please confirm the guest reference and try again.</p>}<Link href="/">Return to invitation</Link></div></main>;
}
