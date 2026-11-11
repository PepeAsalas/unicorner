-- Stable Hand: a signed-in player's game for the day, saved on the account so it continues on any device.
-- The whole game state (the hand, the question deck, the pending question and its deadline) is stored as JSON.
-- A save only replaces what's stored when it is at least as far along (more cards played, or finished), so an older
-- device can never roll a game back. Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.

create table if not exists public.stablehand_results (
  user_id    uuid not null references auth.users(id) on delete cascade,
  day        date not null,
  state      jsonb not null,
  progress   int  not null default 0,
  done       boolean not null default false,
  total      int,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.stablehand_results enable row level security;
revoke all on public.stablehand_results from anon, authenticated;

-- how far along a game is: finished beats everything, then cards played, then questions used (passes count)
create or replace function public.sh_progress(s jsonb)
returns int language sql immutable as $$
  select (case when coalesce((s->>'done')::boolean, false) then 1000 else 0 end)
       + coalesce(jsonb_array_length(case when jsonb_typeof(s->'hand') = 'array' then s->'hand' end), 0) * 10
       + least(coalesce((s->>'qi')::int, 0), 9)
$$;

create or replace function public.sh_mine(p_day text)
returns jsonb language sql stable security definer set search_path = public as $$
  select r.state from stablehand_results r where r.user_id = auth.uid() and r.day = p_day::date
$$;

create or replace function public.sh_save(p_day text, p_state jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare uid uuid := auth.uid(); pr int := sh_progress(p_state);
begin
  if uid is null then raise exception 'sign in first'; end if;
  if p_day::date not between (now() at time zone 'Europe/Amsterdam')::date - 1 and (now() at time zone 'Europe/Amsterdam')::date + 1 then
    raise exception 'not today''s game';
  end if;
  if octet_length(p_state::text) > 20000 then raise exception 'too big'; end if;
  insert into stablehand_results as r (user_id, day, state, progress, done, total)
  values (uid, p_day::date, p_state, pr, coalesce((p_state->>'done')::boolean, false),
          (select coalesce(sum((c->>'p')::int), 0) from jsonb_array_elements(case when jsonb_typeof(p_state->'hand') = 'array' then p_state->'hand' else '[]'::jsonb end) c))
  on conflict (user_id, day) do update
    set state = excluded.state, progress = excluded.progress, done = excluded.done, total = excluded.total, updated_at = now()
    where r.progress <= excluded.progress and not r.done;
  return (select state from stablehand_results where user_id = uid and day = p_day::date);
end $$;

revoke all on function public.sh_mine(text), public.sh_save(text, jsonb) from public, anon;
grant execute on function public.sh_mine(text), public.sh_save(text, jsonb) to authenticated;
