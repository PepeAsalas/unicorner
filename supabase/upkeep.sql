-- Read-only summaries for the upkeep automations (.github/workflows/upkeep-*.yml).
-- They return aggregates only: no visitor ids, sessions or emails.

-- Answers players typed in the DAILY game (and Infinity) that were not accepted,
-- grouped per question. Duel events (they carry a duel code) are left out.
create or replace function public.upkeep_daily_rejections(days int default 7)
returns table(question_id text, prompt text, input text, outcome text, trap text, n int, last_day text)
language sql stable security definer set search_path = public as $$
  select e.data->>'question_id', max(e.data->>'prompt'),
         lower(btrim(e.data->>'input')), max(e.data->>'outcome'), max(e.data->>'trap'),
         count(*)::int, max(e.game_day::text)
  from public.events e
  where e.name = 'rejected'
    and e.data->>'code' is null
    and coalesce(btrim(e.data->>'input'), '') <> ''
    and e.created_at >= now() - make_interval(days => least(greatest(days, 1), 31))
  group by 1, 3
  order by 6 desc, 1
  limit 2000
$$;

-- Daily player numbers for the weekly report.
create or replace function public.upkeep_weekly_stats(days int default 7)
returns table(day text, visitors int, players int, games int, avg_score int, infinity_runs int, duel_rounds int, reddit_joins int, waitlist int)
language sql stable security definer set search_path = public as $$
  select e.game_day::text,
         count(distinct coalesce(e.visitor, e.session))::int,
         count(distinct coalesce(e.visitor, e.session)) filter (where e.name = 'game_finish' and coalesce(e.data->>'mode','') <> 'infinity')::int,
         count(*) filter (where e.name = 'game_finish' and coalesce(e.data->>'mode','') <> 'infinity')::int,
         round(avg((e.data->>'score')::numeric) filter (where e.name = 'game_finish' and coalesce(e.data->>'mode','') <> 'infinity' and e.data->>'score' ~ '^[0-9]+$'))::int,
         count(*) filter (where e.name = 'infinity_finish')::int,
         count(*) filter (where e.name = 'question_result' and e.data->>'code' is not null)::int,
         count(*) filter (where e.name = 'reddit_promo' and e.data->>'action' = 'join')::int,
         count(*) filter (where e.name in ('infinity_notify', 'infinity_buy_paused', 'infinite_waitlist'))::int
  from public.events e
  where e.created_at >= now() - make_interval(days => least(greatest(days, 1), 31))
    and e.game_day is not null
  group by 1
  order by 1
$$;

revoke all on function public.upkeep_daily_rejections(int) from public;
revoke all on function public.upkeep_weekly_stats(int) from public;
grant execute on function public.upkeep_daily_rejections(int) to anon, authenticated;
grant execute on function public.upkeep_weekly_stats(int) to anon, authenticated;
