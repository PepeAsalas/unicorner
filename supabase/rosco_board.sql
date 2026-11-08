-- Rosco leaderboard: today's signed-in players ranked by letters right (more time left breaks ties), your own place,
-- and yesterday's winner. Reads rosco_results (supabase/rosco_results.sql) and player_profiles (nicknames, kits).
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.

create index if not exists rosco_results_day on public.rosco_results (day) where done;

create or replace function public.rosco_board(p_day text)
returns json language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); d date := p_day::date; td json; tn int; tme json; yj json;
begin
  if d not between (now() at time zone 'Europe/Amsterdam')::date - 1 and (now() at time zone 'Europe/Amsterdam')::date + 1 then
    raise exception 'not a Rosco day';
  end if;

  -- yesterday's winner; "players" counts everyone who finished (anonymous players too, from the events log)
  select json_build_object('nickname', p.nickname, 'score', r.score, 'kit', p.kit, 'kits', p.kits, 'streak', p.best_streak, 'games', p.games,
           'players', greatest(
             (select count(distinct coalesce(e.visitor, e.session)) from events e
               where e.name = 'rosco_finish' and e.game_day = d - 1),
             (select count(*) from rosco_results r2 where r2.day = d - 1 and r2.done))) into yj
    from rosco_results r join player_profiles p on p.user_id = r.user_id
    where r.day = d - 1 and r.done and r.score between 0 and coalesce(r.total, 26)
    order by r.score desc, coalesce((r.state->>'left')::int, 0) desc, r.updated_at limit 1;

  with r as (
    select r.user_id, p.nickname, r.score, coalesce((r.state->>'left')::int, 0) as secs_left, p.kit, p.kits, p.best_streak, p.games,
           row_number() over (order by r.score desc, coalesce((r.state->>'left')::int, 0) desc, r.updated_at) as rk
    from rosco_results r join player_profiles p on p.user_id = r.user_id
    where r.day = d and r.done and r.score between 0 and coalesce(r.total, 26))
  select coalesce(json_agg(json_build_object('nickname', nickname, 'score', score, 'left', secs_left, 'rank', rk, 'me', user_id = uid,
                                             'kit', kit, 'kits', kits, 'streak', best_streak, 'games', games)
                           order by rk) filter (where rk <= 10), '[]'::json),
         count(*),
         (select json_build_object('rank', x.rk, 'score', x.score) from r x where x.user_id = uid)
    into td, tn, tme from r;

  return json_build_object('day', d, 'yesterday', yj, 'rows', td, 'players', tn, 'me', tme);
end $$;

revoke all on function public.rosco_board(text) from public;
grant execute on function public.rosco_board(text) to anon, authenticated;
