-- The Rosco on every device: a signed-in player's Rosco for the day is saved to their account, so another device
-- picks it up (the same clock if it's still running, the result screen if it's finished). One Rosco per account per day.
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.

create table if not exists public.rosco_results (
  user_id    uuid not null references auth.users(id) on delete cascade,
  day        date not null,
  started_at timestamptz not null default now(),
  done       boolean not null default false,
  score      int,
  total      int,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.rosco_results enable row level security;
revoke all on public.rosco_results from anon, authenticated;

-- my Rosco for a day (null if I haven't started it)
create or replace function public.rosco_mine(p_day text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('started_at', r.started_at, 'done', r.done, 'score', r.score, 'state', r.state)
  from rosco_results r where r.user_id = auth.uid() and r.day = p_day::date
$$;

-- save my Rosco. The first start time always wins (switching devices can't reset the clock),
-- and once a Rosco is finished it can't be overwritten (no second go on another device).
create or replace function public.rosco_save(p_day text, p_state jsonb, p_done boolean, p_score int, p_total int)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare uid uuid := auth.uid(); r rosco_results;
begin
  if uid is null then raise exception 'sign in first'; end if;
  if p_day::date not between (now() at time zone 'Europe/Amsterdam')::date - 1 and (now() at time zone 'Europe/Amsterdam')::date + 1 then
    raise exception 'not today''s Rosco';
  end if;
  insert into rosco_results as x (user_id, day, done, score, total, state)
  values (uid, p_day::date, coalesce(p_done, false), p_score, p_total, coalesce(p_state, '{}'::jsonb))
  on conflict (user_id, day) do update
    set state = excluded.state, done = excluded.done, score = excluded.score, total = excluded.total, updated_at = now()
    where not x.done
  returning * into r;
  if r is null then select * into r from rosco_results where user_id = uid and day = p_day::date; end if;
  return jsonb_build_object('started_at', r.started_at, 'done', r.done, 'score', r.score, 'state', r.state);
end $$;

revoke all on function public.rosco_mine(text) from public, anon;
revoke all on function public.rosco_save(text, jsonb, boolean, int, int) from public, anon;
grant execute on function public.rosco_mine(text) to authenticated;
grant execute on function public.rosco_save(text, jsonb, boolean, int, int) to authenticated;
