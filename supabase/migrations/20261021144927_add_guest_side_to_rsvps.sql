alter table public.rsvps
  add column guest_side text;

alter table public.rsvps
  add constraint rsvps_guest_side_check
  check (guest_side in ('bride', 'groom'));
