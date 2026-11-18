-- Bring a mate: an invite-only kit for the inviter (Frostbite) and one for the friend who joins (Inferno).
-- A friend counts when they open someone's link, sign in, and have played: within 7 days of their first game.
-- Paste into Supabase -> SQL Editor -> Run (after supabase/kit_rules.sql). Safe to run more than once.

create table if not exists public.referrals (
  invitee    uuid primary key references auth.users(id) on delete cascade,
  inviter    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (invitee <> inviter)
);
create index if not exists referrals_inviter_idx on public.referrals (inviter);
alter table public.referrals enable row level security;   -- only the functions below touch it

-- called by the friend's browser once they are signed in and have played
create or replace function public.ref_claim(p_inviter text)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); inv uuid; first_day date;
begin
  if me is null then return 'signin'; end if;
  select user_id into inv from player_profiles where lower(nickname) = lower(trim(p_inviter));
  if inv is null then return 'unknown'; end if;
  if inv = me then return 'self'; end if;
  if exists (select 1 from referrals where invitee = me) then return 'already'; end if;
  select min(day) into first_day from lg_days_of(me);
  if first_day is null then return 'notyet'; end if;
  if first_day < (now() at time zone 'Europe/Amsterdam')::date - 7 then return 'old'; end if;
  insert into referrals (invitee, inviter) values (me, inv) on conflict do nothing;
  return 'ok';
end $$;
revoke all on function public.ref_claim(text) from public, anon;
grant execute on function public.ref_claim(text) to authenticated;

-- how many friends someone brought (for the Socials progress line)
create or replace function public.ref_count()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from referrals where inviter = auth.uid()
$$;
revoke all on function public.ref_count() from public, anon;
grant execute on function public.ref_count() to authenticated;
