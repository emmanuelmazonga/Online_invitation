export type RsvpStatus = "Pending" | "Approved" | "Declined" | "Checked In";
export type Attendance = "accepts" | "declines";
export type PartyType = "individual" | "plus_one" | "couple";
export type GuestSide = "bride_guest" | "groom_guest" | "bride_family" | "groom_family" | "bride" | "groom";

export interface RsvpRecord {
  id: string;
  full_name: string;
  whatsapp: string;
  attendance: Attendance;
  guest_side: GuestSide | null;
  party_type?: PartyType;
  plus_one_name?: string | null;
  submitted_at: string;
  status: RsvpStatus;
  allocation: 1 | 2;
  guest_reference: string | null;
  checked_in_at: string | null;
  confirmation_sent_at: string | null;
  admin_notes: string;
}

export type RsvpInput = Pick<RsvpRecord, "full_name" | "whatsapp" | "attendance" | "guest_side"> & {
  party_type: PartyType;
  plus_one_name: string | null;
};

export type AdminRole = "owner" | "admin" | "check_in";

export interface AdminUserRecord {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  active: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}
