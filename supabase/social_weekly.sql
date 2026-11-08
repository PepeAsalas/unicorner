-- Unicorner: everything Laken needs for the Monday Instagram post, for one finished week.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Read-only: it adds one function and changes no tables. Only the service role (the Monday GitHub job) can call it.
--
-- social_weekly(p_week) -> json for the week starting Monday p_week (default: last week, Amsterdam time):
--   top3      : nickname, total points, days played and the kit they wear (signed-in players with a nickname)
--   screamer  : the rarest 100-point answer of the week (at least 20 players answered that question)
--   numbers   : games played, average score, Screamers found, and the hardest question with its % right
create or replace function public.social_weekly(p_week date default null)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  t  date := (now() at time zone 'Europe/Amsterdam')::date;
  w0 date := coalesce(p_week, date_trunc('week', t)::date - 7);
  w1 date := w0 + 6;
begin
  return json_build_object(
    'week_start', w0,
    'week_end', w1,
    'week_number', extract(week from w0)::int,

    'top3', coalesce((
      select json_agg(x order by x.points desc, x.days desc, x.nickname)
      from (
        select p.nickname, sum(s.score)::int as points, count(*)::int as days, coalesce(p.kit, 'classic') as kit
        from player_scores s join player_profiles p on p.user_id = s.user_id
        where s.day between w0 and w1 and not s.removed
        group by p.user_id, p.nickname, p.kit
        order by sum(s.score) desc, count(*) desc, p.nickname
        limit 3) x), '[]'::json),

    'screamer', (
      with qr as (
        select e.game_day::date as day, e.data->>'question_id' as qid, e.data->>'prompt' as prompt,
               (e.data->>'position')::int as pos, e.data->>'answer' as answer,
               coalesce((e.data->>'points')::int, 0) as pts, coalesce(e.visitor, e.session) as who
        from events e
        where e.name = 'question_result' and e.game_day::text between w0::text and w1::text
          and e.created_at >= (w0 - 1)::timestamptz and e.created_at < (w1 + 2)::timestamptz
          and coalesce(e.data->>'mode', '') <> 'infinity'),
      tot as (select day, qid, count(distinct who) as n from qr group by day, qid),
      ans as (select day, qid, max(prompt) as prompt, answer, count(distinct who) as k
              from qr where pts = 100 and answer is not null group by day, qid, answer)
      select json_build_object('day', a.day, 'question', a.prompt, 'answer', a.answer,
                               'said_it', a.k, 'answered', t.n, 'one_in', round(t.n::numeric / a.k)::int)
      from ans a join tot t using (day, qid)
      where t.n >= 20
      order by a.k::numeric / t.n, t.n desc
      limit 1),

    'numbers', (
      with gf as (
        select distinct on (coalesce(e.visitor, e.session), e.game_day)
               coalesce((e.data->>'score')::int, 0) as score, coalesce((e.data->>'screamers')::int, 0) as scr
        from events e
        where e.name = 'game_finish' and e.game_day::text between w0::text and w1::text
          and e.created_at >= (w0 - 1)::timestamptz and e.created_at < (w1 + 2)::timestamptz
          and coalesce(e.data->>'mode', '') <> 'infinity'
        order by coalesce(e.visitor, e.session), e.game_day, e.created_at),
      qr as (
        select e.game_day::date as day, e.data->>'question_id' as qid, max(e.data->>'prompt') as prompt,
               max((e.data->>'position')::int) as pos,
               count(distinct coalesce(e.visitor, e.session)) as n,
               count(distinct coalesce(e.visitor, e.session)) filter (where coalesce((e.data->>'points')::int, 0) > 0) as ok
        from events e
        where e.name = 'question_result' and e.game_day::text between w0::text and w1::text
          and e.created_at >= (w0 - 1)::timestamptz and e.created_at < (w1 + 2)::timestamptz
          and coalesce(e.data->>'mode', '') <> 'infinity'
        group by 1, 2)
      select json_build_object(
        'games', (select count(*) from gf),
        'average_score', (select round(avg(score))::int from gf),
        'screamers', (select coalesce(sum(scr), 0)::int from gf),
        'hardest', (select json_build_object('day', day, 'weekday', trim(to_char(day, 'Day')), 'position', pos,
                                             'question', prompt, 'pct_right', round(100.0 * ok / n)::int)
                    from qr where n >= 20 order by ok::numeric / n, n desc limit 1)))
  );
end $$;
revoke all on function public.social_weekly(date) from public, anon, authenticated;
grant execute on function public.social_weekly(date) to service_role;
