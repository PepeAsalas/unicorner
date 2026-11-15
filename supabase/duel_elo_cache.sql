-- Duel ratings were recomputed from every duel ever played on each lobby visit, result screen and player card.
-- With enough duels that replay runs past the API time limit, so ratings came back empty ("Not rated yet").
-- Fix: the replay runs once a minute in the background (pg_cron) and is saved; every reader uses the saved copy.
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.

-- 1) keep the existing replay, under a new name (only the first time this file runs)
do $$ begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                 where n.nspname = 'public' and p.proname = 'duel_elo_compute') then
    alter function public.duel_elo_state() rename to duel_elo_compute;
  end if;
end $$;
revoke all on function public.duel_elo_compute() from public, anon, authenticated;

-- 2) the saved result
create table if not exists public.duel_elo_cache (
  id  int primary key default 1 check (id = 1),
  st  jsonb not null,
  at  timestamptz not null default now()
);
alter table public.duel_elo_cache enable row level security;
revoke all on public.duel_elo_cache from anon, authenticated;

create or replace function public.duel_elo_refresh()
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  insert into duel_elo_cache (id, st, at) values (1, duel_elo_compute(), now())
  on conflict (id) do update set st = excluded.st, at = excluded.at;
end $$;
revoke all on function public.duel_elo_refresh() from public, anon, authenticated;

-- 3) every existing caller (duel_season, duel_elo_duel, duel_elo_nick, quick match) keeps calling duel_elo_state(),
--    which now just reads the saved copy
create or replace function public.duel_elo_state()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select st from duel_elo_cache where id = 1),
                  jsonb_build_object('cur', to_char(now() at time zone 'Europe/Amsterdam', 'YYYY-MM'), 'p', '{}'::jsonb, 'past', '{}'::jsonb, 'duels', '{}'::jsonb))
$$;
revoke all on function public.duel_elo_state() from public, anon, authenticated;

-- 4) fill it now, then keep it fresh every minute
select public.duel_elo_refresh();

create extension if not exists pg_cron;
do $$ begin
  perform cron.unschedule('duel-elo-refresh') where exists (select 1 from cron.job where jobname = 'duel-elo-refresh');
  perform cron.schedule('duel-elo-refresh', '* * * * *', 'select public.duel_elo_refresh()');
end $$;
