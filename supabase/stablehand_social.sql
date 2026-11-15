-- Stable Hand in the rankings: today's table on the game's results screen (sh_board), players and average (sh_day_stats),
-- and Stable Hand in Socials (sq_board 'stablehand', friends' today line in sq_home, the player card in sq_profile).
-- Run after stablehand.sql, squad.sql and profile_v2.sql. Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.
--
-- Ranking score: your total if you stayed at or under the target (a Full House scores the target itself), 0 if you bust.
-- Everyone has the same target on a day, so a higher score is simply closer. Ties: fewer cards, then who finished first.

alter table public.stablehand_results add column if not exists target int;
alter table public.stablehand_results add column if not exists score int;
alter table public.stablehand_results add column if not exists cards int;
create index if not exists stablehand_results_day on public.stablehand_results (day) where done;

create or replace function public.sh_save(p_day text, p_state jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare uid uuid := auth.uid(); pr int := sh_progress(p_state);
        hand jsonb := case when jsonb_typeof(p_state->'hand') = 'array' then p_state->'hand' else '[]'::jsonb end;
        tot int; tg int; dn boolean := coalesce((p_state->>'done')::boolean, false);
begin
  if uid is null then raise exception 'sign in first'; end if;
  if p_day::date not between (now() at time zone 'Europe/Amsterdam')::date - 1 and (now() at time zone 'Europe/Amsterdam')::date + 1 then
    raise exception 'not today''s game';
  end if;
  if octet_length(p_state::text) > 20000 then raise exception 'too big'; end if;
  select coalesce(sum(least(greatest(coalesce((c->>'p')::int, 0), 0), 100)), 0) into tot from jsonb_array_elements(hand) c;
  tg := case when (p_state->>'t') ~ '^\d+$' then least((p_state->>'t')::int, 1000) end;
  insert into stablehand_results as r (user_id, day, state, progress, done, total, target, score, cards)
  values (uid, p_day::date, p_state, pr, dn, tot, tg, case when tg is not null and tot <= tg then tot else 0 end, jsonb_array_length(hand))
  on conflict (user_id, day) do update
    set state = excluded.state, progress = excluded.progress, done = excluded.done, total = excluded.total,
        target = excluded.target, score = excluded.score, cards = excluded.cards, updated_at = now()
    where r.progress <= excluded.progress and not r.done;
  return (select state from stablehand_results where user_id = uid and day = p_day::date);
end $$;
revoke all on function public.sh_save(text, jsonb) from public, anon;
grant execute on function public.sh_save(text, jsonb) to authenticated;
-- fill the new columns for games saved before this file
update public.stablehand_results set
  total = (select coalesce(sum(least(greatest(coalesce((c->>'p')::int, 0), 0), 100)), 0) from jsonb_array_elements(case when jsonb_typeof(state->'hand') = 'array' then state->'hand' else '[]'::jsonb end) c),
  target = case when (state->>'t') ~ '^\d+$' then (state->>'t')::int end,
  cards = jsonb_array_length(case when jsonb_typeof(state->'hand') = 'array' then state->'hand' else '[]'::jsonb end)
 where target is null;
update public.stablehand_results set score = case when target is not null and total <= target then total else 0 end where score is null;

-- today's table (top 10, you, how many finished) and yesterday's winner
create or replace function public.sh_board(p_day text)
returns json language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); d date := p_day::date; td json; tn int; tme json; yj json;
begin
  if d not between (now() at time zone 'Europe/Amsterdam')::date - 1 and (now() at time zone 'Europe/Amsterdam')::date + 1 then
    raise exception 'not a Stable Hand day';
  end if;
  select json_build_object('nickname', p.nickname, 'score', r.score, 'target', r.target, 'kit', p.kit, 'kits', p.kits, 'streak', p.best_streak, 'games', p.games,
           'players', (select count(*) from stablehand_results r2 where r2.day = d - 1 and r2.done)) into yj
    from stablehand_results r join player_profiles p on p.user_id = r.user_id
    where r.day = d - 1 and r.done order by r.score desc, r.cards, r.updated_at limit 1;
  with r as (
    select r.user_id, p.nickname, r.score, r.total, r.target, r.cards, p.kit, p.kits, p.best_streak, p.games,
           row_number() over (order by r.score desc, r.cards, r.updated_at) as rk
    from stablehand_results r join player_profiles p on p.user_id = r.user_id where r.day = d and r.done)
  select coalesce(json_agg(json_build_object('nickname', nickname, 'score', score, 'total', total, 'target', target, 'rank', rk, 'me', user_id = uid,
                                             'kit', kit, 'kits', kits, 'streak', best_streak, 'games', games) order by rk) filter (where rk <= 10), '[]'::json),
         count(*), (select json_build_object('rank', x.rk, 'score', x.score, 'total', x.total) from r x where x.user_id = uid)
    into td, tn, tme from r;
  return json_build_object('day', d, 'yesterday', yj, 'rows', td, 'players', tn, 'me', tme);
end $$;

-- everyone who finished today (signed in or not, from the stablehand_finish events): how many, the average, how many beat the house
create index if not exists events_stablehand_finish on public.events (game_day) where name = 'stablehand_finish';
create or replace function public.sh_day_stats(p_day text)
returns jsonb language sql stable security definer set search_path = public as $$
  with f as (
    select distinct on (visitor) (data->>'total')::int as total, data->>'result' as res from events
    where name = 'stablehand_finish' and game_day = p_day::date and (data->>'total') ~ '^\d+$'
    order by visitor, created_at)
  select jsonb_build_object('players', count(*), 'avg', round(avg(total))::int,
                            'beat', count(*) filter (where res in ('win', 'full')), 'full', count(*) filter (where res = 'full')) from f
$$;
revoke all on function public.sh_board(text), public.sh_day_stats(text) from public;
grant execute on function public.sh_board(text), public.sh_day_stats(text) to anon, authenticated;

-- Socials: Stable Hand as a ranking game, and in friends' "today" lines and player cards
create or replace function public.sq_board(p_game text default 'daily', p_scope text default 'day', p_filter text default 'all')
returns json language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t   date := (now() at time zone 'Europe/Amsterdam')::date;
  d0  date := case when p_scope = 'week' then date_trunc('week', t)::date else t end;
  g   text := case when p_game in ('rosco', 'millon', 'stablehand') then p_game else 'daily' end;
  f   text := coalesce(nullif(p_filter, ''), 'all');
  lg  uuid;
  out json; n int; mine json;
begin
  if f not in ('all', 'friends') then
    begin lg := f::uuid; exception when others then raise exception 'Unknown filter'; end;
    if uid is null or not exists (select 1 from league_members where league_id = lg and user_id = uid) then
      raise exception 'You are not in this league';
    end if;
  elsif f = 'friends' and uid is null then
    raise exception 'Sign in to see your friends';
  end if;

  with x as (
    select s.user_id, s.score::bigint as score, 0 as tb, s.created_at as at
      from player_scores s where g = 'daily' and s.day between d0 and t and not s.removed
    union all
    select r.user_id, r.score, coalesce((r.state->>'left')::int, 0), r.updated_at
      from rosco_results r where g = 'rosco' and r.day between d0 and t and r.done and r.score between 0 and coalesce(r.total, 26)
    union all
    select m.user_id, m.score, 0, m.updated_at
      from millon_results m where g = 'millon' and m.day between d0 and t
    union all
    select h.user_id, h.score, 0, h.updated_at
      from stablehand_results h where g = 'stablehand' and h.day between d0 and t and h.done),
  b as (select user_id, sum(score)::bigint as score, sum(tb)::int as tb, count(*)::int as played, max(at) as at from x group by user_id),
  k as (
    select b.* from b
     where f = 'all'
        or b.user_id = uid
        or (f = 'friends' and sq_are_friends(uid, b.user_id))
        or (lg is not null and exists (select 1 from league_members m where m.league_id = lg and m.user_id = b.user_id))),
  r as (
    select k.*, p.nickname, p.kit, p.kits, p.best_streak, p.games,
           (uid is not null and sq_are_friends(uid, k.user_id)) as friend,
           row_number() over (order by k.score desc, k.tb desc, k.played desc, k.at) as rk
      from k join player_profiles p on p.user_id = k.user_id)
  select coalesce(json_agg(json_build_object('rank', rk, 'nickname', nickname, 'score', score, 'played', played,
                                             'me', user_id = uid, 'friend', friend, 'kit', kit, 'kits', kits,
                                             'streak', best_streak, 'games', games) order by rk) filter (where rk <= 500), '[]'::json),
         count(*)::int,
         (select json_build_object('rank', y.rk, 'score', y.score) from r y where y.user_id = uid)
    into out, n, mine from r;

  return json_build_object('game', g, 'scope', case when p_scope = 'week' then 'week' else 'day' end, 'filter', f,
                           'today', t, 'from', d0, 'players', n, 'me', mine, 'rows', out);
end $$;

create or replace function public.sq_home()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := sq_need_profile(); t date := (now() at time zone 'Europe/Amsterdam')::date; wk date := date_trunc('week', t)::date; code text;
begin
  select friend_code into code from player_profiles where user_id = uid;
  while code is null loop
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      update player_profiles set friend_code = code where user_id = uid;
    exception when unique_violation then code := null;
    end;
  end loop;

  return json_build_object(
    'code', code,
    'friends', coalesce((
      select json_agg(json_build_object(
               'nickname', p.nickname, 'me', p.user_id = uid, 'kit', p.kit, 'kits', p.kits, 'streak', p.best_streak, 'games', p.games,
               'daily', (select s.score from player_scores s where s.user_id = p.user_id and s.day = t and not s.removed),
               'week', (select coalesce(sum(s.score), 0) from player_scores s where s.user_id = p.user_id and s.day between wk and t and not s.removed),
               'rosco', (select r.score from rosco_results r where r.user_id = p.user_id and r.day = t and r.done),
               'rosco_total', (select r.total from rosco_results r where r.user_id = p.user_id and r.day = t and r.done),
               'millon', (select m.score from millon_results m where m.user_id = p.user_id and m.day = t),
               'stablehand', (select h.total from stablehand_results h where h.user_id = p.user_id and h.day = t and h.done),
               'stablehand_target', (select h.target from stablehand_results h where h.user_id = p.user_id and h.day = t and h.done))
             order by p.user_id = uid desc, p.nickname)
        from player_profiles p
       where p.user_id = uid or sq_are_friends(uid, p.user_id)), '[]'::json),
    'incoming', coalesce((
      select json_agg(json_build_object('nickname', p.nickname, 'kit', p.kit, 'kits', p.kits, 'games', p.games) order by q.created_at desc)
        from friend_requests q join player_profiles p on p.user_id = q.from_user where q.to_user = uid), '[]'::json),
    'outgoing', coalesce((
      select json_agg(p.nickname order by q.created_at desc)
        from friend_requests q join player_profiles p on p.user_id = q.to_user where q.from_user = uid), '[]'::json));
end $$;

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
      'millon', (select m.score from millon_results m where m.user_id = them and m.day = t),
      'stablehand', (select h.total from stablehand_results h where h.user_id = them and h.day = t and h.done),
      'stablehand_target', (select h.target from stablehand_results h where h.user_id = them and h.day = t and h.done)),
    'relation', rel);
end $$;
