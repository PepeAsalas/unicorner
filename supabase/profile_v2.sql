-- Profiles v2: correct "games played" and streaks, and one function for the player card.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once. Run after squad.sql
-- (and after kit_rules.sql, so the recount at the end also fills in kits).
--
-- What was wrong: an account's "games played" (and best streak) was the highest number any ONE device had sent, or the
-- days scored while signed in. Someone who plays on a phone and a laptop never had one device that knew all their
-- days, so the number was too low (e.g. 42 instead of 50+).
-- The database already keeps every day a player has played on any device (player_days, filled by lg_sync_days) plus
-- every signed-in score (player_scores). Now games and best streak are counted from both together, every time either
-- changes, and everyone is recounted once at the end of this file.
-- sq_profile(nickname) gives the player card everything fresh from the database.

-- kits the database can see were earned (empty until kit_rules.sql has been run)
create or replace function public.lg_server_kits_safe(u uuid)
returns text[] language plpgsql stable security definer set search_path = public as $$
declare k text[] := '{}';
begin
  if to_regprocedure('public.lg_server_kits(uuid)') is not null then execute 'select public.lg_server_kits($1)' into k using u; end if;
  return coalesce(k, '{}');
end $$;
revoke all on function public.lg_server_kits_safe(uuid) from public, anon, authenticated;

-- all days a player has played the Daily 5, on any device
create or replace function public.lg_days_of(u uuid)
returns table (day date) language sql stable security definer set search_path = public as $$
  select pd.day from player_days pd where pd.user_id = u
  union
  select ps.day from player_scores ps where ps.user_id = u and not ps.removed
$$;

-- recount games and best streak from every day played: exactly that, so a wrong number (too low or too high) is corrected;
-- and add every kit the database can see was earned (kit_rules.sql), so an account never shows fewer kits than it has
create or replace function public.lg_stats_from_scores(u uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
declare extra text[] := lg_server_kits_safe(u);
begin
  with d as (select day from lg_days_of(u)),
       g as (select day, day - (row_number() over (order by day))::int as grp from d),
       runs as (select count(*) as n from g group by grp)
  update player_profiles p
     set games = (select count(*) from d)::int,
         best_streak = coalesce((select max(n) from runs), 0)::int,
         kits = coalesce((select array_agg(distinct x order by x) from unnest(coalesce(p.kits, '{}') || coalesce(extra, '{}')) x), '{}')
   where p.user_id = u;
end $$;
revoke all on function public.lg_days_of(uuid), public.lg_stats_from_scores(uuid) from public, anon, authenticated;

-- days synced from a device (including days played before signing in) recount too (same function as before, plus the recount)
create or replace function public.lg_sync_days(p_days date[] default '{}')
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid();
begin
  if coalesce(array_length(p_days, 1), 0) > 800 then raise exception 'Too many days'; end if;
  insert into player_days (user_id, day)
    select uid, d from unnest(coalesce(p_days, '{}')) d where d between lg_today() - 800 and lg_today()
  on conflict do nothing;
  perform lg_stats_from_scores(uid);
  return json_build_object('days', coalesce((select json_agg(x.day order by x.day) from lg_days_of(uid) x), '[]'::json));
end $$;
revoke all on function public.lg_sync_days(date[]) from public, anon;
grant execute on function public.lg_sync_days(date[]) to authenticated;

-- the player card: one player's public numbers, fresh
create or replace function public.sq_profile(p_nick text)
returns json language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); them uuid := sq_user(p_nick); p player_profiles; t date := (now() at time zone 'Europe/Amsterdam')::date;
        days int; best int; cur int; rel text := 'none';
begin
  if them is null then raise exception 'Player not found'; end if;
  select * into p from player_profiles where user_id = them;
  with d as (select day from lg_days_of(them)),
       g as (select day, day - (row_number() over (order by day))::int as grp from d),
       runs as (select grp, count(*) as n, max(day) as last from g group by grp)
  select (select count(*) from d)::int, coalesce((select max(n) from runs), 0)::int,
         coalesce((select n from runs where last >= t - 1 order by last desc limit 1), 0)::int
    into days, best, cur;
  if uid is not null then
    rel := case when uid = them then 'me'
                when sq_are_friends(uid, them) then 'friend'
                when exists (select 1 from friend_requests where from_user = uid and to_user = them) then 'sent'
                when exists (select 1 from friend_requests where from_user = them and to_user = uid) then 'incoming'
                else 'none' end;
  end if;
  return json_build_object(
    'nickname', p.nickname, 'kit', coalesce(p.kit, 'classic'),
    'kits', coalesce((select array_agg(distinct x order by x) from unnest(coalesce(p.kits, '{}') || coalesce(lg_server_kits_safe(them), '{}')) x), '{}'),
    'games', days, 'best_streak', best, 'streak', cur,
    'wins', lg_wins(them),
    'trophies', (select count(*) from weekly_awards w where w.user_id = them),
    'since', (select min(day) from lg_days_of(them)),
    'today', json_build_object(
      'daily', (select s.score from player_scores s where s.user_id = them and s.day = t and not s.removed),
      'rosco', (select r.score from rosco_results r where r.user_id = them and r.day = t and r.done),
      'rosco_total', (select r.total from rosco_results r where r.user_id = them and r.day = t and r.done),
      'millon', (select m.score from millon_results m where m.user_id = them and m.day = t)),
    'relation', rel);
end $$;
revoke all on function public.sq_profile(text) from public;
grant execute on function public.sq_profile(text) to anon, authenticated;

-- recount everyone now
select count(*) as players_recounted from (
  select lg_stats_from_scores(user_id) from (select user_id from player_days union select user_id from player_scores) x) y;
