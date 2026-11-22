-- Rejected answers from every game (not only the daily game), for the daily feedback routine.
-- Run once in the Supabase SQL editor. Safe to run again.

create or replace function public.upkeep_tally() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  d date;
  who text := coalesce(new.visitor, new.session);
  inf boolean := coalesce(new.data->>'mode', '') = 'infinity';
  m text;
  v bigint := 0;
begin
  if new.game_day is not null and new.game_day::text ~ '^\d{4}-\d{2}-\d{2}' then d := left(new.game_day::text, 10)::date;
  else d := (coalesce(new.created_at, now()) at time zone 'Europe/Amsterdam')::date; end if;
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
  -- answers players typed that did not count, from every game: the daily game ('rejected' without a code),
  -- duels ('rejected' with a code), the Rosco ('rosco_reject') and Stable Hand ('stablehand_reject').
  -- outcome says which game for everything but the daily game.
  if new.name = 'rejected' and coalesce(btrim(new.data->>'input'), '') <> '' and new.data->>'question_id' is not null then
    insert into upkeep_rejections values (d, new.data->>'question_id', left(lower(btrim(new.data->>'input')), 120),
      left(new.data->>'prompt', 200), case when new.data->>'code' is null then new.data->>'outcome' else 'duel' end, new.data->>'trap', 1)
    on conflict (day, question_id, input) do update set n = upkeep_rejections.n + 1;
  elsif new.name = 'rosco_reject' and coalesce(btrim(new.data->>'typed'), '') <> '' and coalesce(new.data->>'letter', '') <> '' then
    insert into upkeep_rejections values (d, 'rosco-' || d::text || '-' || (new.data->>'letter'), left(lower(btrim(new.data->>'typed')), 120),
      left(new.data->>'prompt', 200), 'rosco', null, 1)
    on conflict (day, question_id, input) do update set n = upkeep_rejections.n + 1;
  elsif new.name = 'stablehand_reject' and coalesce(btrim(new.data->>'input'), '') <> '' and new.data->>'question_id' is not null then
    insert into upkeep_rejections values (d, new.data->>'question_id', left(lower(btrim(new.data->>'input')), 120),
      left(new.data->>'prompt', 200), 'stablehand', new.data->>'trap', 1)
    on conflict (day, question_id, input) do update set n = upkeep_rejections.n + 1;
  end if;
  return new;
exception when others then
  return new; -- never let the tally block an event from being saved
end $$;


-- the last 7 days of Rosco and duel rejections, which the tally used to skip (Stable Hand starts logging now)
insert into public.upkeep_rejections
select d, qid, inp, max(prompt), max(outcome), null, count(*)::int from (
  select left(e.game_day::text, 10)::date d, 'rosco-' || left(e.game_day::text, 10) || '-' || (e.data->>'letter') qid,
         left(lower(btrim(e.data->>'typed')), 120) inp, left(e.data->>'prompt', 200) prompt, 'rosco' outcome
  from public.events e
  where e.name = 'rosco_reject' and e.game_day::text ~ '^\d{4}-\d{2}-\d{2}' and coalesce(btrim(e.data->>'typed'), '') <> ''
    and e.created_at > now() - interval '7 days'
  union all
  select (e.created_at at time zone 'Europe/Amsterdam')::date, e.data->>'question_id', left(lower(btrim(e.data->>'input')), 120),
         left(e.data->>'prompt', 200), 'duel'
  from public.events e
  where e.name = 'rejected' and e.data->>'code' is not null and e.data->>'question_id' is not null
    and coalesce(btrim(e.data->>'input'), '') <> '' and e.created_at > now() - interval '7 days'
) x group by d, qid, inp
on conflict (day, question_id, input) do nothing;
