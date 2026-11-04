-- Results screen: "N players today" and the score chart. Fetching every score hit the database's 1000-row limit
-- (so it said 1000 players); this returns one row per score with how many got it.
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.
create index if not exists scores_day on public.scores (day);
create or replace function public.day_score_counts(p_day text)
returns table(score int, n bigint) language sql stable security definer set search_path = public as $$
  select s.score::int, count(*) from scores s where s.day::text = p_day group by s.score
$$;
revoke all on function public.day_score_counts(text) from public;
grant execute on function public.day_score_counts(text) to anon, authenticated;
