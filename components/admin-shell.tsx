"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, ExternalLink, LockKeyhole, LogOut, Plus, RotateCcw, Search, ShieldCheck, Trash2, Users, X } from "lucide-react";
import type { AdminRole, AdminUserRecord, RsvpRecord, RsvpStatus } from "@/lib/types";
import { whatsappHref } from "@/lib/phone";

function Login({ title = "Private access", onSuccess }: { title?: string; onSuccess?: () => void }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const values = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: values.get("email"), password: values.get("password") }) });
    const data = await response.json();
    setPending(false);
    if (!response.ok) return setError(data.error || "Sign-in failed.");
    if (onSuccess) onSuccess();
    else window.location.reload();
  }
  return <div className="admin-login"><div className="login-card"><span className="admin-mark">J <i>&amp;</i> D</span><LockKeyhole className="login-lock" /><h1>{title}</h1><p>Sign in with the email address and password issued by the wedding owner.</p><form onSubmit={submit}><label htmlFor="admin-email">Email address</label><input id="admin-email" name="email" type="email" autoComplete="email" required autoFocus /><label htmlFor="admin-password">Password</label><input id="admin-password" name="password" type="password" autoComplete="current-password" required />{error && <p className="admin-error">{error}</p>}<button className="admin-button" type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button></form></div></div>;
}

type Access = { id: string; email: string; fullName: string; role: AdminRole };

function AdminUsers({ currentId }: { currentId: string }) {
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    if (response.ok) setAdmins((await response.json()).admins);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = event.currentTarget; const values = new FormData(form);
    const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: values.get("fullName"), email: values.get("email"), role: values.get("role"), password: values.get("password") }) });
    const data = await response.json();
    if (!response.ok) return setError(data.error);
    setAdmins(rows => [...rows, data.admin]); form.reset();
  }

  async function update(id: string, patch: { role?: AdminRole; active?: boolean }) {
    setError("");
    const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
    const data = await response.json();
    if (!response.ok) return setError(data.error);
    setAdmins(rows => rows.map(row => row.id === id ? data.admin : row));
  }

  return <section className="admin-users-panel"><div className="admin-users-heading"><div><p className="admin-eyebrow">Owner controls</p><h2>Administrator access</h2></div><p>Create a private account and choose exactly what that person can do.</p></div><form className="admin-user-form" onSubmit={add}><input name="fullName" aria-label="Administrator name" placeholder="Full name" required /><input name="email" aria-label="Administrator email" type="email" placeholder="Email address" required /><input name="password" aria-label="Initial password" type="password" minLength={12} autoComplete="new-password" placeholder="Initial password (12+ characters)" required /><select name="role" aria-label="Administrator role" defaultValue="admin"><option value="owner">Owner</option><option value="admin">Admin</option><option value="check_in">Check-in only</option></select><button type="submit"><Plus size={16} /> Create account</button></form>{error && <p className="admin-error admin-users-error">{error}</p>}<div className="admin-user-list">{admins.map(admin => <article key={admin.id} className={!admin.active ? "inactive" : ""}><div><strong>{admin.full_name}</strong><span>{admin.email}</span><small>{admin.user_id ? "Account ready" : "Password setup required"}</small></div><select aria-label={`Role for ${admin.full_name}`} value={admin.role} disabled={admin.id === currentId} onChange={event => update(admin.id, { role: event.target.value as AdminRole })}><option value="owner">Owner</option><option value="admin">Admin</option><option value="check_in">Check-in only</option></select><button disabled={admin.id === currentId} onClick={() => update(admin.id, { active: !admin.active })}>{admin.active ? "Disable" : "Enable"}</button></article>)}</div></section>;
}

function confirmationMessage(guest: RsvpRecord) {
  return `James & Diana — Wedding Confirmation 💍\n\nDear ${guest.full_name},\n\nWe’re delighted to confirm your attendance at James Konkola & Diana Mazonga's wedding on 21 November 2026\n\n🪪 Unique Guest reference: *${guest.guest_reference}*\n👤 Guest allocation: *${guest.allocation === 2 ? "Couple" : "Individual"}*\n\nPlease keep this reference safe and present it at the entrance.\nWe look forward to celebrating with you.\nQueries +260 972281240\n\nWith love,\nJames & Diana`;
}

export function AdminShell() {
  const [guests, setGuests] = useState<RsvpRecord[]>([]);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | RsvpStatus>("All");
  const [selected, setSelected] = useState<RsvpRecord | null>(null);
  const [qr, setQr] = useState("");
  const [drawerNotice, setDrawerNotice] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/guests", { cache: "no-store" });
    if (response.status === 401) return setAuthorized(false);
    const data = await response.json();
    setGuests(data.guests); setAccess(data.access); setAuthorized(true);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!selected?.guest_reference) return setQr("");
    QRCode.toDataURL(`${window.location.origin}/verify/${selected.guest_reference}`, { width: 220, margin: 1, color: { dark: "#28352B", light: "#FAF7F0" } }).then(setQr);
  }, [selected]);

  const counts = useMemo(() => ({
    total: guests.length,
    pending: guests.filter(g => g.status === "Pending").length,
    approved: guests.filter(g => g.status === "Approved").length,
    declined: guests.filter(g => g.status === "Declined").length,
    checked: guests.filter(g => g.status === "Checked In").length,
  }), [guests]);
  const visible = guests.filter((guest) => {
    const haystack = `${guest.full_name} ${guest.whatsapp} ${guest.guest_reference || ""}`.toLowerCase();
    return (filter === "All" || guest.status === filter) && haystack.includes(query.toLowerCase());
  });

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setDrawerNotice("");
    const response = await fetch("/api/admin/guests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, ...extra }) });
    const data = await response.json();
    if (!response.ok) { setDrawerNotice(data.error || "The guest could not be updated."); return; }
    setGuests(rows => rows.map(row => row.id === id ? data.guest : row));
    setSelected(current => current?.id === id ? data.guest : current);
    if (action === "mark-sent") setDrawerNotice("Confirmation marked as sent.");
    if (action === "restore-pending") setDrawerNotice("Guest returned to pending for review.");
  }

  async function copyConfirmation(guest: RsvpRecord) {
    try {
      await navigator.clipboard.writeText(confirmationMessage(guest));
      setDrawerNotice("Confirmation copied. You can now paste it into WhatsApp.");
    } catch {
      setDrawerNotice("Copy failed. Please open the message in WhatsApp instead.");
    }
  }

  async function deleteGuest(guest: RsvpRecord) {
    if (!window.confirm(`Permanently delete ${guest.full_name}'s RSVP? This cannot be undone.`)) return;
    setDrawerNotice("");
    const response = await fetch("/api/admin/guests", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: guest.id }) });
    const data = await response.json();
    if (!response.ok) { setDrawerNotice(data.error || "The guest could not be deleted."); return; }
    setGuests(rows => rows.filter(row => row.id !== guest.id));
    setSelected(null);
  }

  async function downloadGuestList() {
    if (!guests.length || exportingPdf) return;
    setExportingPdf(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const forest: [number, number, number] = [40, 53, 43];
      const sage: [number, number, number] = [103, 122, 102];
      const gold: [number, number, number] = [184, 148, 83];
      const ivory: [number, number, number] = [250, 247, 240];
      const generatedAt = new Date();
      const sortedGuests = [...guests].sort((a, b) => {
        if (a.guest_reference && b.guest_reference) return a.guest_reference.localeCompare(b.guest_reference, undefined, { numeric: true });
        if (a.guest_reference) return -1;
        if (b.guest_reference) return 1;
        return a.full_name.localeCompare(b.full_name);
      });

      doc.setFillColor(...forest);
      doc.rect(0, 0, 297, 38, "F");
      doc.setTextColor(...gold);
      doc.setFont("times", "normal");
      doc.setFontSize(15);
      doc.text("J  &  D", 14, 14);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(23);
      doc.text("Wedding Guest List", 14, 27);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("James Konkola & Diana Mazonga  |  21 November 2026", 283, 14, { align: "right" });
      doc.setTextColor(221, 226, 221);
      doc.text(`Generated ${generatedAt.toLocaleString("en-ZM", { dateStyle: "medium", timeStyle: "short" })}`, 283, 26, { align: "right" });

      const summaries = [
        ["TOTAL RSVPS", counts.total],
        ["PENDING", counts.pending],
        ["APPROVED", counts.approved],
        ["DECLINED", counts.declined],
        ["CHECKED IN", counts.checked],
      ] as const;
      summaries.forEach(([label, value], index) => {
        const x = 14 + index * 54;
        doc.setFillColor(...ivory);
        doc.roundedRect(x, 43, 49, 18, 1.5, 1.5, "F");
        doc.setTextColor(...sage);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        doc.text(label, x + 4, 49);
        doc.setTextColor(...forest);
        doc.setFont("times", "normal");
        doc.setFontSize(14);
        doc.text(String(value), x + 4, 57);
      });

      autoTable(doc, {
        startY: 67,
        margin: { left: 14, right: 14, bottom: 15 },
        head: [["#", "Guest", "WhatsApp", "Attendance", "Allocation", "Status", "Reference", "Submitted"]],
        body: sortedGuests.map((guest, index) => [
          index + 1,
          guest.full_name,
          guest.whatsapp,
          guest.attendance === "accepts" ? "Accepts" : "Declines",
          guest.allocation === 2 ? "Couple" : "Individual",
          guest.status,
          guest.guest_reference || "-",
          new Date(guest.submitted_at).toLocaleDateString("en-ZM", { day: "2-digit", month: "short", year: "numeric" }),
        ]),
        theme: "grid",
        styles: { font: "helvetica", fontSize: 7.2, cellPadding: 2, lineColor: [224, 220, 211], lineWidth: 0.15, textColor: forest, valign: "middle" },
        headStyles: { fillColor: forest, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 6.8, cellPadding: 2.3 },
        alternateRowStyles: { fillColor: ivory },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 57 },
          2: { cellWidth: 38 },
          3: { cellWidth: 32 },
          4: { cellWidth: 29 },
          5: { cellWidth: 32 },
          6: { cellWidth: 34, fontStyle: "bold" },
          7: { cellWidth: 37 },
        },
        didDrawPage: ({ pageNumber }) => {
          const pageHeight = doc.internal.pageSize.getHeight();
          doc.setDrawColor(...gold);
          doc.line(14, pageHeight - 10, 283, pageHeight - 10);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...sage);
          doc.text("Private wedding administration record", 14, pageHeight - 5.5);
          doc.text(`Page ${pageNumber}`, 283, pageHeight - 5.5, { align: "right" });
        },
      });

      const dateStamp = generatedAt.toISOString().slice(0, 10);
      doc.save(`james-diana-guest-list-${dateStamp}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  }

  if (authorized === null) return <div className="admin-loading">Opening guest list…</div>;
  if (!authorized) return <Login title="Wedding administration" />;

  return <div className="admin-page">
    <header className="admin-header"><div><span className="admin-mark">J <i>&amp;</i> D</span><div><p>{access?.fullName || "Wedding administration"} · {access?.role.replace("_", " ")}</p><strong>21 November 2026</strong></div></div><nav><a href="/check-in"><ShieldCheck size={17} /> Check-in</a><button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); setAuthorized(false); setAccess(null); }}><LogOut size={17} /> Sign out</button></nav></header>
    <main className="admin-main">
      <div className="admin-title"><div><p className="admin-eyebrow">Guest management</p><h1>RSVP overview</h1></div><p>Approve invitations, control allocations, and prepare confirmations.</p></div>
      <section className="stat-grid" aria-label="RSVP totals">
        <article><span>Total RSVPs</span><strong>{counts.total}</strong><Users /></article><article><span>Pending</span><strong>{counts.pending}</strong></article><article><span>Approved</span><strong>{counts.approved}</strong></article><article><span>Declined</span><strong>{counts.declined}</strong></article><article><span>Checked in</span><strong>{counts.checked}</strong></article>
      </section>
      <section className="guest-panel">
        <div className="table-tools"><label><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, phone or reference" /></label><div className="filters">{(["All", "Pending", "Approved", "Declined", "Checked In"] as const).map(item => <button className={filter === item ? "active" : ""} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div></div>
        <div className="table-wrap"><table><thead><tr><th>Guest</th><th>Attendance</th><th>Allocation</th><th>Status</th><th>Reference</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>
          {visible.map(guest => <tr key={guest.id}><td><strong>{guest.full_name}</strong><span>{guest.whatsapp}</span></td><td>{guest.attendance === "accepts" ? "Joyfully accepts" : "Regretfully declines"}</td><td><select aria-label={`Allocation for ${guest.full_name}`} value={guest.allocation} onChange={e => act(guest.id, "update", { allocation: Number(e.target.value) })}><option value={1}>Individual</option><option value={2}>Couple</option></select></td><td><span className={`status status-${guest.status.toLowerCase().replace(" ", "-")}`}>{guest.status}</span></td><td className="reference">{guest.guest_reference || "—"}</td><td>{new Date(guest.submitted_at).toLocaleDateString("en-ZM", { day: "2-digit", month: "short", year: "numeric" })}</td><td><div className="row-actions">{guest.status === "Pending" && <><button className="approve" onClick={() => act(guest.id, "approve", { allocation: guest.allocation })}><Check size={15} /> Approve</button><button onClick={() => act(guest.id, "reject")}><X size={15} /> Reject</button></>}<button onClick={() => { setDrawerNotice(""); setSelected(guest); }}>View</button></div></td></tr>)}
          {!visible.length && <tr><td colSpan={7} className="empty-row">No guests match this view.</td></tr>}
        </tbody></table></div>
      </section>
      {access?.role === "owner" && <AdminUsers currentId={access.id} />}
      <div className="pdf-export-action">
        <button type="button" onClick={downloadGuestList} disabled={!guests.length || exportingPdf}><Download size={18} /> {exportingPdf ? "Preparing PDF..." : "Download guest list PDF"}</button>
      </div>
    </main>
    {selected && <div className="drawer-backdrop" onMouseDown={() => setSelected(null)}><aside className="guest-drawer" onMouseDown={e => e.stopPropagation()}><button className="drawer-close" aria-label="Close guest details" onClick={() => setSelected(null)}><X /></button><p className="admin-eyebrow">Guest details</p><h2>{selected.full_name}</h2><dl><div><dt>WhatsApp</dt><dd>{selected.whatsapp}</dd></div><div><dt>Attendance</dt><dd>{selected.attendance === "accepts" ? "Joyfully accepts" : "Regretfully declines"}</dd></div><div><dt>Allocation</dt><dd>{selected.allocation === 2 ? "Couple" : "1 Person"}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div><div><dt>Reference</dt><dd>{selected.guest_reference || "Generated after approval"}</dd></div></dl>
      {selected.guest_reference && <div className="qr-card">{qr && <img src={qr} alt={`QR code for ${selected.guest_reference}`} />}<strong>{selected.guest_reference}</strong></div>}
      <label className="notes-label">Admin notes<textarea defaultValue={selected.admin_notes} onBlur={e => act(selected.id, "update", { notes: e.target.value })} placeholder="Private notes about this guest" /></label>
      {selected.status === "Approved" && <div className="confirmation-actions"><a className="whatsapp-button" href={whatsappHref(selected.whatsapp, confirmationMessage(selected))} target="_blank" rel="noreferrer">Open in WhatsApp <ExternalLink size={16} /></a><button className="admin-button secondary" onClick={() => copyConfirmation(selected)}><Copy size={16} /> Copy confirmation</button><button className="admin-button secondary" onClick={() => act(selected.id, "mark-sent")}><Check size={16} /> Mark as sent</button><button className="admin-button secondary" onClick={() => act(selected.id, "check-in")}>Check in guest</button></div>}
      {selected.confirmation_sent_at && <p className="sent-note">Confirmation marked sent {new Date(selected.confirmation_sent_at).toLocaleString("en-ZM")}</p>}
      {drawerNotice && <p className="drawer-notice" role="status">{drawerNotice}</p>}
      {access?.role === "owner" && selected.status === "Declined" && <div className="owner-recovery-zone"><p>Owner correction</p><span>Use this if a guest was declined by mistake.</span><button onClick={() => act(selected.id, "restore-pending")}><RotateCcw size={16} /> Return to pending</button></div>}
      {access?.role === "owner" && <div className="owner-danger-zone"><p>Owner only</p><button onClick={() => deleteGuest(selected)}><Trash2 size={16} /> Delete guest permanently</button></div>}
    </aside></div>}
  </div>;
}

export function CheckInShell() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [reference, setReference] = useState("");
  const [guest, setGuest] = useState<Pick<RsvpRecord, "id" | "full_name" | "guest_reference" | "allocation" | "status" | "checked_in_at"> | null>(null);
  const [error, setError] = useState("");
  async function verify(checkIn = false) {
    setError("");
    const response = await fetch("/api/check-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: reference.trim().toUpperCase(), checkIn }) });
    if (response.status === 401) { setAuthorized(false); setError("Admin sign-in is required to check in a guest."); return; }
    const data = await response.json();
    if (!response.ok) { setGuest(null); setError(data.error); return; }
    setAuthorized(Boolean(data.canEdit));
    setGuest(data.guest);
  }
  useEffect(() => { fetch("/api/auth/session", { cache: "no-store" }).then(r => setAuthorized(r.ok)); }, []);
  if (authorized === null) return <div className="admin-loading">Opening verification…</div>;
  if (showLogin) return <><Login title="Check-in administration" onSuccess={() => { setAuthorized(true); setShowLogin(false); }} /><button className="login-back" onClick={() => setShowLogin(false)}>Back to guest verification</button></>;
  return <main className="checkin-page"><header><a href="/">J <i>&amp;</i> D</a><span>Event entrance · Ndola</span>{authorized ? <a className="checkin-admin-link" href="/admin">Administration</a> : <button className="checkin-admin-link" onClick={() => setShowLogin(true)}>Admin sign in</button>}</header><section className="checkin-card"><ShieldCheck size={35} /><p className="admin-eyebrow">21 November 2026</p><h1>Guest Verification</h1><p>Anyone can verify a guest reference. Only signed-in administrators can complete check-in.</p><form onSubmit={e => { e.preventDefault(); verify(); }}><label htmlFor="reference">Enter guest reference</label><input id="reference" value={reference} onChange={e => setReference(e.target.value.toUpperCase())} placeholder="JD-7K4P2" maxLength={8} autoCapitalize="characters" autoFocus /><button type="submit">Verify guest</button></form>
      {error && <div className="verify-result invalid"><strong>{error.startsWith("Admin") ? "ADMIN SIGN-IN REQUIRED" : "REFERENCE NOT FOUND"}</strong><span>{error.startsWith("Admin") ? error : "Please confirm the reference number and try again."}</span></div>}
      {guest && <div className={`verify-result ${guest.status === "Checked In" ? "already" : "valid"}`}><strong>{guest.status === "Checked In" ? "ALREADY CHECKED IN" : "✓ APPROVED GUEST"}</strong><dl><div><dt>Guest</dt><dd>{guest.full_name}</dd></div><div><dt>Reference</dt><dd>{guest.guest_reference}</dd></div><div><dt>Allocation</dt><dd>{guest.allocation === 2 ? "Couple" : "1 Person"}</dd></div><div><dt>Status</dt><dd>{guest.status === "Checked In" ? `Checked in ${new Date(guest.checked_in_at!).toLocaleString("en-ZM")}` : "Not checked in"}</dd></div></dl>{guest.status !== "Checked In" && (authorized ? <button className="checkin-action" onClick={() => verify(true)}>Check in guest</button> : <p className="checkin-readonly">Verification only · An administrator must sign in to check in this guest.</p>)}</div>}
    </section></main>;
}
