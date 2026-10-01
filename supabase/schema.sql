create extension if not exists pgcrypto;

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  whatsapp text not null unique,
  attendance text not null check (attendance in ('accepts', 'declines')),
  submitted_at timestamptz not null default now(),
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Declined', 'Checked In')),
  allocation integer not null default 1 check (allocation in (1, 2)),
  guest_reference text unique check (guest_reference is null or guest_reference ~ '^JD-[A-Z0-9]{5}$'),
  checked_in_at timestamptz,
  confirmation_sent_at timestamptz,
  admin_notes text not null default ''
);

alter table public.rsvps enable row level security;

revoke all on table public.rsvps from anon, authenticated;
grant select, insert, update, delete on table public.rsvps to service_role;

-- The app talks to Supabase only from server routes. This explicit deny policy
-- keeps browser clients locked out even if table grants are changed later.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rsvps'
      and policyname = 'Server-only RSVP access'
  ) then
    execute 'create policy "Server-only RSVP access" on public.rsvps for all to anon, authenticated using (false) with check (false)';
  end if;
end
$$;

create index if not exists rsvps_status_idx on public.rsvps(status);
create index if not exists rsvps_name_idx on public.rsvps(full_name);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  email text not null unique check (email = lower(email)),
  full_name text not null check (char_length(full_name) between 2 and 120),
  role text not null check (role in ('owner', 'admin', 'check_in')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select, insert, update on table public.admin_users to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_users'
      and policyname = 'Server-only administrator access'
  ) then
    execute 'create policy "Server-only administrator access" on public.admin_users for all to anon, authenticated using (false) with check (false)';
  end if;
end
$$;
