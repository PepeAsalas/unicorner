-- Millions: signed-in players' daily results (one per account per day, the first finish wins), today's ranking with
-- yesterday's winner, and today's average for everyone (from the millon_finish events).
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.

create table if not exists public.millon_results (
  user_id    uuid not null references auth.users(id) on delete cascade,
  day        date not null,
  score      int  not null check (score between 0 and 1000000),
  hist       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.millon_results enable row level security;
revoke all on public.millon_results from anon, authenticated;
create index if not exists millon_results_day on public.millon_results (day);

create or replace function public.millon_mine(p_day text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('score', r.score, 'hist', r.hist) from millon_results r where r.user_id = auth.uid() and r.day = p_day::date
$$;

create or replace function public.millon_save(p_day text, p_score int, p_hist text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'sign in first'; end if;
  if p_day::date not between (now() at time zone 'Europe/Amsterdam')::date - 1 and (now() at time zone 'Europe/Amsterdam')::date + 1 then
    raise exception 'not today''s game';
  end if;
  insert into millon_results (user_id, day, score, hist) values (uid, p_day::date, p_score, left(coalesce(p_hist, ''), 40))
  on conflict (user_id, day) do nothing;
  return (select jsonb_build_object('score', score, 'hist', hist) from millon_results where user_id = uid and day = p_day::date);
end $$;

create or replace function public.millon_board(p_day text)
returns json language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); d date := p_day::date; td json; tn int; tme json; yj json;
begin
  if d not between (now() at time zone 'Europe/Amsterdam')::date - 1 and (now() at time zone 'Europe/Amsterdam')::date + 1 then
    raise exception 'not a Millions day';
  end if;
  select json_build_object('nickname', p.nickname, 'score', r.score, 'kit', p.kit, 'kits', p.kits, 'streak', p.best_streak, 'games', p.games,
           'players', (select count(*) from millon_results r2 where r2.day = d - 1)) into yj
    from millon_results r join player_profiles p on p.user_id = r.user_id
    where r.day = d - 1 order by r.score desc, r.updated_at limit 1;
  with r as (
    select r.user_id, p.nickname, r.score, p.kit, p.kits, p.best_streak, p.games,
           row_number() over (order by r.score desc, r.updated_at) as rk
    from millon_results r join player_profiles p on p.user_id = r.user_id where r.day = d)
  select coalesce(json_agg(json_build_object('nickname', nickname, 'score', score, 'rank', rk, 'me', user_id = uid,
                                             'kit', kit, 'kits', kits, 'streak', best_streak, 'games', games) order by rk) filter (where rk <= 10), '[]'::json),
         count(*), (select json_build_object('rank', x.rk, 'score', x.score) from r x where x.user_id = uid)
    into td, tn, tme from r;
  return json_build_object('day', d, 'yesterday', yj, 'rows', td, 'players', tn, 'me', tme);
end $$;

create index if not exists events_millon_finish on public.events (game_day) where name = 'millon_finish';
create or replace function public.millon_day_stats(p_day text)
returns jsonb language sql stable security definer set search_path = public as $$
  with f as (
    select distinct on (visitor) (data->>'score')::int as score from events
    where name = 'millon_finish' and game_day = p_day::date and (data->>'score') ~ '^\d+$'
    order by visitor, created_at)
  select jsonb_build_object('players', count(*), 'avg', round(avg(score))::int) from f
$$;

revoke all on function public.millon_mine(text) from public, anon;
revoke all on function public.millon_save(text, int, text) from public, anon;
revoke all on function public.millon_board(text) from public;
revoke all on function public.millon_day_stats(text) from public;
grant execute on function public.millon_mine(text) to authenticated;
grant execute on function public.millon_save(text, int, text) to authenticated;
grant execute on function public.millon_board(text) to anon, authenticated;
grant execute on function public.millon_day_stats(text) to anon, authenticated;
