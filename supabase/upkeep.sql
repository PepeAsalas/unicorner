-- Small running tallies for the upkeep automations (.github/workflows/upkeep.yml).
-- Scanning public.events for a week is too slow for the 3-second public timeout, so a
-- trigger adds each relevant event to these tables as it arrives and the two report
-- functions read only them. They return aggregates only: no visitor ids or emails.

create table if not exists public.upkeep_day (
  day date not null, metric text not null, n bigint not null default 0, total bigint not null default 0,
  primary key (day, metric));
create table if not exists public.upkeep_seen (
  day date not null, kind text not null, who text not null,
  primary key (day, kind, who));
create table if not exists public.upkeep_rejections (
  day date not null, question_id text not null, input text not null,
  prompt text, outcome text, trap text, n int not null default 0,
  primary key (day, question_id, input));
alter table public.upkeep_day enable row level security;
alter table public.upkeep_seen enable row level security;
alter table public.upkeep_rejections enable row level security;

create or replace function public.upkeep_tally() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  d date;
  who text := coalesce(new.visitor, new.session);
  inf boolean := coalesce(new.data->>'mode', '') = 'infinity';
  m text;
  v bigint := 0;
begin
  if new.game_day is null or new.game_day::text !~ '^\d{4}-\d{2}-\d{2}$' then return new; end if;
  d := new.game_day::text::date;
  if who is not null then
    insert into upkeep_seen values (d, 'visitor', who) on conflict do nothing;
    if found then insert into upkeep_day values (d, 'visitors', 1, 0) on conflict (day, metric) do update set n = upkeep_day.n + 1; end if;
  end if;
  m := case
    when new.name = 'game_finish' and not inf then 'games'
    when new.name = 'infinity_finish' then 'infinity_runs'
    when new.name = 'duel_round' then 'duel_answers'
    when new.name = 'reddit_promo' and new.data->>'action' = 'join' then 'reddit_joins'
    when new.name in ('infinity_notify', 'infinity_buy_paused', 'infinite_waitlist') then 'waitlist'
  end;
  if m is not null then
    if m = 'games' and new.data->>'score' ~ '^\d+$' then v := (new.data->>'score')::bigint; end if;
    insert into upkeep_day values (d, m, 1, v) on conflict (day, metric) do update set n = upkeep_day.n + 1, total = upkeep_day.total + excluded.total;
    if m = 'games' and who is not null then
      insert into upkeep_seen values (d, 'player', who) on conflict do nothing;
      if found then insert into upkeep_day values (d, 'players', 1, 0) on conflict (day, metric) do update set n = upkeep_day.n + 1; end if;
    end if;
  end if;
  if new.name = 'rejected' and new.data->>'code' is null and coalesce(btrim(new.data->>'input'), '') <> '' and new.data->>'question_id' is not null then
    insert into upkeep_rejections values (d, new.data->>'question_id', left(lower(btrim(new.data->>'input')), 120),
      left(new.data->>'prompt', 200), new.data->>'outcome', new.data->>'trap', 1)
    on conflict (day, question_id, input) do update set n = upkeep_rejections.n + 1;
  end if;
  return new;
exception when others then
  return new; -- never let the tally block an event from being saved
end $$;

drop trigger if exists upkeep_tally on public.events;
create trigger upkeep_tally after insert on public.events for each row execute function public.upkeep_tally();

create or replace function public.upkeep_daily_rejections(days int default 7)
returns table(question_id text, prompt text, input text, outcome text, trap text, n int, last_day text)
language sql stable security definer set search_path = public as $$
  select r.question_id, max(r.prompt), r.input, max(r.outcome), max(r.trap), sum(r.n)::int, max(r.day)::text
  from upkeep_rejections r
  where r.day > (now() at time zone 'Europe/Amsterdam')::date - least(greatest(days, 1), 31)
  group by r.question_id, r.input
  order by 6 desc, 1
  limit 2000
$$;

create or replace function public.upkeep_weekly_stats(days int default 7)
returns table(day text, visitors int, players int, games int, avg_score int, infinity_runs int, duel_rounds int, reddit_joins int, waitlist int)
language sql stable security definer set search_path = public as $$
  select u.day::text,
    coalesce(max(u.n) filter (where u.metric = 'visitors'), 0)::int,
    coalesce(max(u.n) filter (where u.metric = 'players'), 0)::int,
    coalesce(max(u.n) filter (where u.metric = 'games'), 0)::int,
    round(max(u.total) filter (where u.metric = 'games')::numeric / nullif(max(u.n) filter (where u.metric = 'games'), 0))::int,
    coalesce(max(u.n) filter (where u.metric = 'infinity_runs'), 0)::int,
    coalesce(max(u.n) filter (where u.metric = 'duel_answers'), 0)::int,
    coalesce(max(u.n) filter (where u.metric = 'reddit_joins'), 0)::int,
    coalesce(max(u.n) filter (where u.metric = 'waitlist'), 0)::int
  from upkeep_day u
  where u.day > (now() at time zone 'Europe/Amsterdam')::date - least(greatest(days, 1), 31)
  group by u.day
  order by u.day
$$;

revoke all on function public.upkeep_daily_rejections(int) from public;
revoke all on function public.upkeep_weekly_stats(int) from public;
grant execute on function public.upkeep_daily_rejections(int) to anon, authenticated;
grant execute on function public.upkeep_weekly_stats(int) to anon, authenticated;

-- One-time backfill of the last 8 days (the trigger counts everything after this).
-- Safe to re-run: it rebuilds those days from public.events.
do $$
declare since date := (now() at time zone 'Europe/Amsterdam')::date - 8;
begin
  delete from upkeep_day where day >= since;
  delete from upkeep_seen where day >= since;
  delete from upkeep_rejections where day >= since;
  create temp table ev on commit drop as
    select name, coalesce(visitor, session) who, game_day::text::date d, data
    from public.events
    where created_at >= now() - interval '9 days' and game_day::text ~ '^\d{4}-\d{2}-\d{2}$';
  delete from ev where d < since;
  insert into upkeep_seen select distinct d, 'visitor', who from ev where who is not null on conflict do nothing;
  insert into upkeep_seen select distinct d, 'player', who from ev where who is not null and name = 'game_finish' and coalesce(data->>'mode','') <> 'infinity' on conflict do nothing;
  insert into upkeep_day select day, kind || 's', count(*), 0 from upkeep_seen where day >= since group by day, kind on conflict (day, metric) do update set n = excluded.n;
  insert into upkeep_day
    select d, m, count(*), coalesce(sum(case when m = 'games' and data->>'score' ~ '^\d+$' then (data->>'score')::bigint end), 0)
    from (select d, data, case
        when name = 'game_finish' and coalesce(data->>'mode','') <> 'infinity' then 'games'
        when name = 'infinity_finish' then 'infinity_runs'
        when name = 'duel_round' then 'duel_answers'
        when name = 'reddit_promo' and data->>'action' = 'join' then 'reddit_joins'
        when name in ('infinity_notify', 'infinity_buy_paused', 'infinite_waitlist') then 'waitlist' end m from ev) x
    where m is not null group by d, m
  on conflict (day, metric) do update set n = excluded.n, total = excluded.total;
  insert into upkeep_rejections
    select d, data->>'question_id', left(lower(btrim(data->>'input')), 120), max(left(data->>'prompt', 200)), max(data->>'outcome'), max(data->>'trap'), count(*)
    from ev where name = 'rejected' and data->>'code' is null and coalesce(btrim(data->>'input'), '') <> '' and data->>'question_id' is not null
    group by 1, 2, 3
  on conflict (day, question_id, input) do update set n = excluded.n;
end $$;
