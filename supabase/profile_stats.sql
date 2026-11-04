-- Player cards showed "0 games, 0 best streak" for players who clearly play (e.g. jshkrk: 2 games this week).
-- Games and best streak were only ever sent by the player's own device (lg_set_look), so if that never happened
-- (played before signing in, another phone, an old version) the account stayed at 0.
-- Fix: the database also counts them from player_scores, and every new score updates them. The device's numbers
-- still count when they're higher (games played before signing in are only known to the device).
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.

create or replace function public.lg_stats_from_scores(u uuid)
returns void language sql volatile security definer set search_path = public as $$
  with d as (select distinct day from player_scores where user_id = u and not removed),
       g as (select day, day - (row_number() over (order by day))::int as grp from d),
       runs as (select count(*) as n from g group by grp)
  update player_profiles p
     set games = greatest(p.games, (select count(*) from d)::int),
         best_streak = greatest(p.best_streak, coalesce((select max(n) from runs), 0)::int)
   where p.user_id = u
$$;
revoke all on function public.lg_stats_from_scores(uuid) from public, anon, authenticated;

-- every saved score keeps the account's numbers up to date
create or replace function public.tg_scores_stats()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform lg_stats_from_scores(new.user_id);
  return new;
end $$;
drop trigger if exists scores_stats on public.player_scores;
create trigger scores_stats after insert or update on public.player_scores
  for each row execute function public.tg_scores_stats();

-- fix everyone now
select count(*) as players_updated from (select lg_stats_from_scores(user_id) from (select distinct user_id from player_scores) x) y;
