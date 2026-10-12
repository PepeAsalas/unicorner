You have access to my Supabase project for Unicorner (project ref yujhjepukzdahsppntua). Please run the SQL below on it, exactly as written, as one migration. Do not change, shorten or "improve" it.

What it does: it replaces public.lg_global_board() with a version where yesterday's "players" number counts everyone who finished yesterday's game, including players without an account. Those anonymous games are only in public.events (rows with name = 'game_finish'), so the function now counts distinct visitors there. Infinity-mode games (data->>'mode' = 'infinity') are left out. Nothing else changes, and the existing grants (anon and authenticated can execute it) must stay.

Before running, please check that public.events has these columns: name, visitor, session, game_day, data, created_at. If any is missing or named differently, stop and tell me instead of running.

After running it, please report back:
- select public.lg_global_board()->'yesterday';  -> paste the result; "players" should now be the full number of people who played yesterday
- select count(distinct coalesce(visitor, session)) from public.events where name = 'game_finish' and game_day::text = to_char((now() at time zone 'Europe/Amsterdam')::date - 1, 'YYYY-MM-DD') and coalesce(data->>'mode','') <> 'infinity';  -> should match "players" (or be close, if the day just changed)
- select has_function_privilege('anon','public.lg_global_board()','execute');  -> should be true
Tell me if anything errors, and paste the exact error message.

SQL:

create or replace function public.lg_global_board()
returns json language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); t date := lg_today(); wk date := date_trunc('week', lg_today())::date;
        td json; tn int; tme json; wkj json; wn int; wme json; yj json;
begin
  select json_build_object('nickname', p.nickname, 'score', s.score, 'kit', p.kit, 'kits', p.kits, 'streak', p.best_streak, 'games', p.games,
           'players', greatest(
             -- everyone who finished yesterday's game, signed up or not (anonymous players are only in the events log)
             (select count(distinct coalesce(e.visitor, e.session)) from events e
               where e.name = 'game_finish' and e.game_day::text = to_char(t - 1, 'YYYY-MM-DD')
                 and e.created_at >= (t - 2)::timestamptz and e.created_at < (t + 1)::timestamptz
                 and coalesce(e.data->>'mode', '') <> 'infinity'),
             (select count(*) from player_scores s2 join player_profiles p2 on p2.user_id = s2.user_id where s2.day = t - 1 and not s2.removed))) into yj
    from player_scores s join player_profiles p on p.user_id = s.user_id
    where s.day = t - 1 and not s.removed order by s.score desc, s.created_at limit 1;

  with r as (
    select s.user_id, p.nickname, s.score, p.kit, p.kits, p.best_streak, p.games,
           row_number() over (order by s.score desc, s.created_at) as rk
    from player_scores s join player_profiles p on p.user_id = s.user_id
    where s.day = t and not s.removed)
  select coalesce(json_agg(json_build_object('nickname', nickname, 'score', score, 'rank', rk, 'me', user_id = uid,
                                             'kit', kit, 'kits', kits, 'streak', best_streak, 'games', games)
                           order by rk) filter (where rk <= 10), '[]'::json),
         count(*),
         (select json_build_object('rank', x.rk, 'score', x.score) from r x where x.user_id = uid)
    into td, tn, tme from r;

  with w as (
    select s.user_id, p.nickname, p.kit, p.kits, p.best_streak, p.games,
           sum(s.score)::int as total, count(*)::int as played, max(s.created_at) as last_at
    from player_scores s join player_profiles p on p.user_id = s.user_id
    where s.day between wk and t and not s.removed
    group by s.user_id, p.nickname, p.kit, p.kits, p.best_streak, p.games),
  r as (select w.*, row_number() over (order by total desc, played desc, last_at) as rk from w)
  select coalesce(json_agg(json_build_object('nickname', nickname, 'score', total, 'played', played, 'rank', rk, 'me', user_id = uid,
                                             'kit', kit, 'kits', kits, 'streak', best_streak, 'games', games)
                           order by rk) filter (where rk <= 10), '[]'::json),
         count(*),
         (select json_build_object('rank', x.rk, 'score', x.total) from r x where x.user_id = uid)
    into wkj, wn, wme from r;

  return json_build_object('today', t, 'week_start', wk, 'yesterday', yj,
    'day', json_build_object('rows', td, 'players', tn, 'me', tme),
    'week', json_build_object('rows', wkj, 'players', wn, 'me', wme));
end $$;
