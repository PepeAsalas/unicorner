-- The Rosco's "today's average": players and average score for one day, from the rosco_finish events.
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.
create index if not exists events_rosco_finish on public.events ((game_day::text)) where name = 'rosco_finish';

create or replace function public.rosco_day_stats(p_day text)
returns jsonb language sql stable security definer set search_path = public as $$
  -- one finish per visitor counts (their first), so replays and reloads don't skew it
  with f as (
    select distinct on (visitor) (data->>'score')::int as score
    from events
    where name = 'rosco_finish' and game_day::text = p_day and (data->>'score') ~ '^\d+$'
    order by visitor, created_at)
  select jsonb_build_object('players', count(*), 'avg', round(avg(score)::numeric, 1)) from f
$$;
revoke all on function public.rosco_day_stats(text) from public;
grant execute on function public.rosco_day_stats(text) to anon, authenticated;
