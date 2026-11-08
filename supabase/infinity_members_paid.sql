-- Fix: the ∞ badge on the leaderboards missed people who bought Infinity as a one-time purchase (status 'paid').
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.
create or replace function public.infinity_members(p_nicks text[])
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(p.nickname), '{}')
  from player_profiles p
  join infinity_subs s on s.user_id = p.user_id
  where lower(p.nickname) in (select lower(x) from unnest(p_nicks[1:200]) as x)
    and (s.status = 'paid'
         or (s.status in ('active', 'trialing', 'on_trial', 'past_due', 'cancelled')
             and coalesce(s.period_end, now()) > now() - interval '1 day'));
$$;
revoke all on function public.infinity_members(text[]) from public;
grant execute on function public.infinity_members(text[]) to anon, authenticated;
