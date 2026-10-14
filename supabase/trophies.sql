-- Unicorner: "how many players gave your answer" + weekly trophies.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Nothing here changes existing tables; it adds two tables and four functions.

-- 1. How many players gave the same answer as you (shown on the results screen).
-- Counts come from the question_result events the game already sends. Anyone can call it, but it only
-- answers for today and yesterday, only for the answers you send, and only returns counts.
create or replace function public.uc_pick_share(p_day date, p_picks jsonb)
returns json language plpgsql stable security definer set search_path = public as $$
declare t date := (now() at time zone 'Europe/Amsterdam')::date;
begin
  if p_day is null or p_day < t - 1 or p_day > t then raise exception 'Wrong day'; end if;
  if p_picks is null or jsonb_typeof(p_picks) <> 'array' or jsonb_array_length(p_picks) > 10 then raise exception 'Invalid answers'; end if;
  return coalesce((
    select json_agg(json_build_object('q', x.q, 'n', x.n, 'k', x.k))
    from (
      select pk->>'q' as q,
             (select count(distinct coalesce(e.visitor, e.session)) from events e
               where e.name = 'question_result' and e.game_day::text = p_day::text
                 and e.created_at >= (p_day - 1)::timestamptz and e.created_at < (p_day + 2)::timestamptz
                 and coalesce(e.data->>'mode', '') <> 'infinity'
                 and e.data->>'question_id' = pk->>'q') as n,
             (select count(distinct coalesce(e.visitor, e.session)) from events e
               where e.name = 'question_result' and e.game_day::text = p_day::text
                 and e.created_at >= (p_day - 1)::timestamptz and e.created_at < (p_day + 2)::timestamptz
                 and coalesce(e.data->>'mode', '') <> 'infinity'
                 and e.data->>'question_id' = pk->>'q' and e.data->>'answer' = pk->>'a') as k
      from jsonb_array_elements(p_picks) pk
      where pk ? 'q' and pk ? 'a'
    ) x), '[]'::json);
end $$;
revoke all on function public.uc_pick_share(date, jsonb) from public;
grant execute on function public.uc_pick_share(date, jsonb) to anon, authenticated;

-- 2. Weekly trophies (weeks run Monday to Sunday, Amsterdam time; only players with a nickname take part).
create table if not exists public.weekly_awards (
  week    date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  trophy  text not null,
  detail  jsonb not null default '{}'::jsonb,
  primary key (week, user_id, trophy)
);
create table if not exists public.weekly_awards_done (
  week        date primary key,
  computed_at timestamptz not null default now(),
  final       boolean not null default false
);
alter table public.weekly_awards      enable row level security;
alter table public.weekly_awards_done enable row level security;
revoke all on public.weekly_awards, public.weekly_awards_done from anon, authenticated;

-- Works out the trophies for one finished week and stores them.
-- Sunday scores can still arrive on Monday, so a week is worked out again until Tuesday, then frozen.
create or replace function public.lg_compute_week(p_week date)
returns void language plpgsql security definer set search_path = public as $$
declare t date := (now() at time zone 'Europe/Amsterdam')::date; we date := p_week + 6;
begin
  if p_week is null or p_week <> date_trunc('week', p_week)::date or we >= t then return; end if;
  perform pg_advisory_xact_lock(hashtext('uc-week-' || p_week::text));
  if exists (select 1 from weekly_awards_done where week = p_week and final) then return; end if;
  delete from weekly_awards where week = p_week;

  drop table if exists pg_temp.wk;
  create temp table wk on commit drop as
    select s.user_id,
           sum(s.score)::int as total,
           count(*)::int as days,
           sum((select count(*) from jsonb_array_elements(coalesce(s.picks, '[]'::jsonb)) x
                 where jsonb_typeof(x) = 'array' and x->>2 = '100'))::int as screamers,
           bool_and(s.picks is not null and (select count(*) from jsonb_array_elements(s.picks) x
                 where jsonb_typeof(x) = 'array' and x->>1 is not null) >= 5) as all_hits
    from player_scores s join player_profiles p on p.user_id = s.user_id
    where s.day between p_week and we and not s.removed
    group by s.user_id;

  -- Champion: most points
  insert into weekly_awards (week, user_id, trophy, detail)
    select p_week, user_id, 'champion', jsonb_build_object('total', total, 'players', (select count(*) from wk))
    from wk where total > 0 and total = (select max(total) from wk);
  -- Golden Boot: most Screamers
  insert into weekly_awards (week, user_id, trophy, detail)
    select p_week, user_id, 'boot', jsonb_build_object('screamers', screamers)
    from wk where screamers > 0 and screamers = (select max(screamers) from wk);
  -- Clean Sheet: no misses, at least 5 days
  insert into weekly_awards (week, user_id, trophy, detail)
    select p_week, user_id, 'clean', jsonb_build_object('days', days) from wk where days >= 5 and all_hits;
  -- Ever-present: all 7 days
  insert into weekly_awards (week, user_id, trophy, detail)
    select p_week, user_id, 'ever', jsonb_build_object('days', days) from wk where days = 7;
  -- Top 10
  insert into weekly_awards (week, user_id, trophy, detail)
    select p_week, user_id, 'top10', jsonb_build_object('rank', rk, 'players', (select count(*) from wk))
    from (select user_id, total, rank() over (order by total desc) rk from wk) r where total > 0 and rk <= 10;
  -- Most Improved: biggest jump on the week before (at least 4 days played in both weeks)
  insert into weekly_awards (week, user_id, trophy, detail)
    select p_week, user_id, 'improve', jsonb_build_object('up', up, 'total', total)
    from (select w.user_id, w.total, w.total - pw.total as up
            from wk w join (select s.user_id, sum(s.score)::int total, count(*) days from player_scores s
                             where s.day between p_week - 7 and p_week - 1 and not s.removed group by s.user_id) pw
              on pw.user_id = w.user_id
           where w.days >= 4 and pw.days >= 4) i
    where up > 0 and up = (select max(w.total - pw.total) from wk w join (select s.user_id, sum(s.score)::int total, count(*) days from player_scores s
                             where s.day between p_week - 7 and p_week - 1 and not s.removed group by s.user_id) pw
              on pw.user_id = w.user_id where w.days >= 4 and pw.days >= 4);
  -- Deep Cut: rarest correct answers (lowest average share of players who said the same thing), at least 8 correct answers
  insert into weekly_awards (week, user_id, trophy, detail)
    with picks as (
      select s.user_id, s.day, x->>3 as qid, x->>1 as ans
      from player_scores s join wk on wk.user_id = s.user_id, jsonb_array_elements(coalesce(s.picks, '[]'::jsonb)) x
      where s.day between p_week and we and not s.removed and jsonb_typeof(x) = 'array' and x->>1 is not null and x->>3 is not null),
    ev as (
      select e.game_day::text as d, e.data->>'question_id' as qid, e.data->>'answer' as ans, coalesce(e.visitor, e.session) as who
      from events e
      where e.name = 'question_result' and e.created_at >= (p_week - 1)::timestamptz and e.created_at < (we + 2)::timestamptz
        and e.game_day::text between p_week::text and we::text and coalesce(e.data->>'mode', '') <> 'infinity'),
    tot as (select d, qid, count(distinct who) n from ev group by d, qid),
    same as (select d, qid, ans, count(distinct who) k from ev where ans is not null group by d, qid, ans),
    shares as (
      select p.user_id, avg(sm.k::numeric / nullif(tt.n, 0)) share, count(*) cnt
      from picks p join tot tt on tt.d = p.day::text and tt.qid = p.qid
                   join same sm on sm.d = p.day::text and sm.qid = p.qid and sm.ans = p.ans
      group by p.user_id having count(*) >= 8)
    select p_week, user_id, 'deepcut', jsonb_build_object('share', round(share * 100, 1), 'answers', cnt)
    from shares where share = (select min(share) from shares);

  insert into weekly_awards_done (week, computed_at, final) values (p_week, now(), t >= we + 2)
  on conflict (week) do update set computed_at = now(), final = excluded.final;
end $$;
revoke all on function public.lg_compute_week(date) from public, anon, authenticated;

-- Last week's awards for the landing page: the podium for everyone, plus your own trophies if signed in.
create or replace function public.lg_awards()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t date := (now() at time zone 'Europe/Amsterdam')::date;
        lw date := date_trunc('week', t)::date - 7;
begin
  if not exists (select 1 from weekly_awards_done where week = lw and (final or computed_at > now() - interval '10 minutes')) then
    perform lg_compute_week(lw);
  end if;
  return json_build_object(
    'week', lw, 'week_no', to_char(lw, 'IW')::int,
    'players', (select count(distinct s.user_id) from player_scores s join player_profiles p on p.user_id = s.user_id
                 where s.day between lw and lw + 6 and not s.removed),
    'podium', coalesce((select json_agg(r order by r.total desc, r.nickname) from (
       select p.nickname, p.kit, sum(s.score)::int as total
       from player_scores s join player_profiles p on p.user_id = s.user_id
       where s.day between lw and lw + 6 and not s.removed
       group by p.user_id, p.nickname, p.kit order by total desc, p.nickname limit 3) r), '[]'::json),
    'mine', case when uid is null then null else coalesce((select json_agg(json_build_object('trophy', a.trophy, 'detail', a.detail))
       from weekly_awards a where a.week = lw and a.user_id = uid), '[]'::json) end);
end $$;
revoke all on function public.lg_awards() from public;
grant execute on function public.lg_awards() to anon, authenticated;

-- Your trophy cabinet: every trophy you have won, plus how this week is going.
create or replace function public.lg_my_trophies()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); t date := (now() at time zone 'Europe/Amsterdam')::date;
        wk date := date_trunc('week', t)::date;
begin
  if not exists (select 1 from weekly_awards_done where week = wk - 7 and (final or computed_at > now() - interval '10 minutes')) then
    perform lg_compute_week(wk - 7);
  end if;
  return json_build_object(
    'trophies', coalesce((select json_agg(json_build_object('week', a.week, 'week_no', to_char(a.week, 'IW')::int, 'trophy', a.trophy, 'detail', a.detail) order by a.week desc)
                 from weekly_awards a where a.user_id = uid), '[]'::json),
    'week', (select json_build_object('start', wk, 'total', coalesce(me.total, 0), 'days', coalesce(me.days, 0), 'screamers', coalesce(me.scr, 0),
                     'rank', (select count(*) + 1 from (select s.user_id, sum(s.score) tot from player_scores s join player_profiles p on p.user_id = s.user_id
                                where s.day between wk and t and not s.removed group by s.user_id) o where o.tot > coalesce(me.total, 0)),
                     'players', (select count(distinct s.user_id) from player_scores s join player_profiles p on p.user_id = s.user_id
                                  where s.day between wk and t and not s.removed))
             from (select sum(s.score)::int total, count(*)::int days,
                          sum((select count(*) from jsonb_array_elements(coalesce(s.picks, '[]'::jsonb)) x where jsonb_typeof(x) = 'array' and x->>2 = '100'))::int scr
                     from player_scores s where s.user_id = uid and s.day between wk and t and not s.removed) me));
end $$;
revoke all on function public.lg_my_trophies() from public, anon;
grant execute on function public.lg_my_trophies() to authenticated;
