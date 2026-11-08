-- Duel notifications. Run once, after push.sql and duel_challenges.sql. Safe to run more than once.
-- Links each browser's push subscription to the signed-in account, so "X challenged you to a duel" reaches
-- every phone and computer where that player turned notifications on. The sending is done by the Supabase
-- function duel-push (supabase/functions/duel-push), which the game calls right after a challenge is sent.

alter table public.push_subs add column if not exists user_id uuid;
create index if not exists push_subs_user_idx on public.push_subs (user_id);
alter table public.duels add column if not exists push_sent_at timestamptz;

-- tie this browser's subscription to the signed-in player (called after turning notifications on, and on each visit)
create or replace function public.push_link(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  update push_subs set user_id = auth.uid(), updated_at = now()
   where auth.uid() is not null and endpoint = p_endpoint and user_id is distinct from auth.uid()
$$;
revoke all on function public.push_link(text) from public;
grant execute on function public.push_link(text) to authenticated;
