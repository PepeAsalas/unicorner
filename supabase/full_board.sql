-- ── Full ranking: everyone on today's or this week's global ranking (not just the top 10) ──
-- Public like lg_global_board. p_scope is 'day' or 'week'. Capped at 2000 rows.
create or replace function public.lg_full_board(p_scope text default 'day')
returns json language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); t date := lg_today(); wk date := date_trunc('week', lg_today())::date; rows json;
begin
  if p_scope = 'week' then
    with w as (
      select s.user_id, p.nickname, p.kit, p.kits, p.best_streak, p.games,
             sum(s.score)::int as total, count(*)::int as played, max(s.created_at) as last_at
      from player_scores s join player_profiles p on p.user_id = s.user_id
      where s.day between wk and t and not s.removed
      group by s.user_id, p.nickname, p.kit, p.kits, p.best_streak, p.games),
    r as (select w.*, row_number() over (order by total desc, played desc, last_at) as rk from w)
    select coalesce(json_agg(json_build_object('nickname', nickname, 'score', total, 'rank', rk, 'me', user_id = uid,
             'kit', kit, 'kits', kits, 'streak', best_streak, 'games', games) order by rk), '[]'::json)
      into rows from r where rk <= 2000;
  else
    with r as (
      select s.user_id, p.nickname, s.score, p.kit, p.kits, p.best_streak, p.games,
             row_number() over (order by s.score desc, s.created_at) as rk
      from player_scores s join player_profiles p on p.user_id = s.user_id
      where s.day = t and not s.removed)
    select coalesce(json_agg(json_build_object('nickname', nickname, 'score', score, 'rank', rk, 'me', user_id = uid,
             'kit', kit, 'kits', kits, 'streak', best_streak, 'games', games) order by rk), '[]'::json)
      into rows from r where rk <= 2000;
  end if;
  return json_build_object('scope', case when p_scope = 'week' then 'week' else 'day' end, 'today', t, 'week_start', wk, 'rows', rows);
end $$;
revoke all on function public.lg_full_board(text) from public;
grant execute on function public.lg_full_board(text) to anon, authenticated;
