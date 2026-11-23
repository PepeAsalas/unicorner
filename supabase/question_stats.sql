-- Per-question score averages for the Daily 5, so the daily routine can pick questions that hit a target daily average.
-- A trigger tallies each question_result event; the backfill below rebuilds history from public.events.
-- Aggregates only: no visitor ids, no answers typed.

create table if not exists public.question_stats (
  question_id text not null,
  day date not null,
  n bigint not null default 0,        -- players who reached this question
  pts bigint not null default 0,      -- points scored on it, summed
  misses bigint not null default 0,   -- players who scored 0 on it
  primary key (question_id, day));
alter table public.question_stats enable row level security;

create or replace function public.question_stats_tally() returns trigger
language plpgsql security definer set search_path = public as $$
declare d date; p bigint := 0;
begin
  if new.name <> 'question_result' or coalesce(new.data->>'mode', '') = 'infinity' or new.data->>'question_id' is null then return new; end if;
  if new.game_day is not null and new.game_day::text ~ '^\d{4}-\d{2}-\d{2}' then d := left(new.game_day::text, 10)::date;
  else d := (coalesce(new.created_at, now()) at time zone 'Europe/Amsterdam')::date; end if;
  if new.data->>'points' ~ '^\d+$' then p := (new.data->>'points')::bigint; end if;
  insert into question_stats values (new.data->>'question_id', d, 1, p, case when p = 0 then 1 else 0 end)
  on conflict (question_id, day) do update set n = question_stats.n + 1, pts = question_stats.pts + excluded.pts, misses = question_stats.misses + excluded.misses;
  return new;
exception when others then return new;
end $$;

drop trigger if exists question_stats_tally on public.events;
create trigger question_stats_tally after insert on public.events
  for each row when (new.name = 'question_result') execute function public.question_stats_tally();

create or replace function public.question_stats_all()
returns table(question_id text, day text, n bigint, avg_pts numeric, miss_rate numeric)
language sql stable security definer set search_path = public as $$
  select question_id, day::text, n, round(pts::numeric / nullif(n, 0), 1), round(misses::numeric / nullif(n, 0), 3)
  from question_stats where n >= 20 order by day, question_id
$$;
revoke all on function public.question_stats_all() from public;
grant execute on function public.question_stats_all() to anon, authenticated;

-- Backfill from history (safe to re-run).
delete from public.question_stats;
insert into public.question_stats
  select data->>'question_id',
    case when game_day::text ~ '^\d{4}-\d{2}-\d{2}' then left(game_day::text, 10)::date else (created_at at time zone 'Europe/Amsterdam')::date end,
    count(*),
    coalesce(sum(case when data->>'points' ~ '^\d+$' then (data->>'points')::bigint end), 0),
    count(*) filter (where coalesce(data->>'points', '0') in ('0', ''))
  from public.events
  where name = 'question_result' and coalesce(data->>'mode', '') <> 'infinity' and data->>'question_id' is not null
  group by 1, 2;

select count(*) as question_days from public.question_stats;
