alter table public.rsvps
  add column party_type text not null default 'individual'
    check (party_type in ('individual', 'plus_one', 'couple')),
  add column plus_one_name text;

update public.rsvps
set party_type = case when allocation = 2 then 'couple' else 'individual' end;

alter table public.rsvps
  drop constraint if exists rsvps_guest_side_check;

update public.rsvps
set guest_side = case guest_side
  when 'bride' then 'bride_guest'
  when 'groom' then 'groom_guest'
  else guest_side
end;

alter table public.rsvps
  add constraint rsvps_guest_side_check
  check (guest_side in ('bride_guest', 'groom_guest', 'bride_family', 'groom_family'));
