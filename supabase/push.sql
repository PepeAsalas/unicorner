-- Streak reminders by browser notification (web push). Run once. Safe to run more than once.
-- A player who taps "Remind me" on the results screen saves their browser's push address here, with their streak
-- and the last day they played. Every evening scripts/send_streak_push.py (GitHub Actions, service role key) sends
-- "your streak ends at midnight" to those who played yesterday but not yet today. No email, no account needed.

create table if not exists public.push_subs (
  endpoint   text primary key,             -- the browser's push address (unique per browser)
  sub        jsonb not null,               -- full subscription: endpoint + keys
  visitor    text,
  lang       text not null default 'en',
  streak     integer not null default 0,
  last_day   text,                         -- last Amsterdam day this browser finished the Daily 5 (YYYY-MM-DD)
  last_sent  text,                         -- last day a reminder went out, so it is never sent twice
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
-- no policies: only the functions below (and the service role) touch the table

-- turn reminders on (or refresh them) for this browser
create or replace function public.push_save(p_sub jsonb, p_visitor text, p_lang text, p_streak integer, p_day text)
returns void language plpgsql security definer set search_path = public as $$
declare ep text := p_sub->>'endpoint';
begin
  if ep is null or ep !~ '^https://' or length(ep) > 1000 or length(p_sub::text) > 4000 then raise exception 'bad subscription'; end if;
  insert into push_subs (endpoint, sub, visitor, lang, streak, last_day)
  values (ep, p_sub, left(p_visitor, 80), case when p_lang = 'es' then 'es' else 'en' end, least(greatest(coalesce(p_streak, 0), 0), 5000),
          case when p_day ~ '^\d{4}-\d{2}-\d{2}$' then p_day end)
  on conflict (endpoint) do update set sub = excluded.sub, visitor = excluded.visitor, lang = excluded.lang,
     streak = excluded.streak, last_day = coalesce(excluded.last_day, push_subs.last_day), updated_at = now();
end $$;

-- after each finished Daily 5: today's date and the new streak
create or replace function public.push_played(p_endpoint text, p_streak integer, p_day text)
returns void language sql security definer set search_path = public as $$
  update push_subs set streak = least(greatest(coalesce(p_streak, 0), 0), 5000), last_day = p_day, updated_at = now()
   where endpoint = p_endpoint and p_day ~ '^\d{4}-\d{2}-\d{2}$'
$$;

-- turn reminders off for this browser
create or replace function public.push_remove(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from push_subs where endpoint = p_endpoint
$$;

revoke all on function public.push_save(jsonb, text, text, integer, text) from public;
revoke all on function public.push_played(text, integer, text) from public;
revoke all on function public.push_remove(text) from public;
grant execute on function public.push_save(jsonb, text, text, integer, text) to anon, authenticated;
grant execute on function public.push_played(text, integer, text) to anon, authenticated;
grant execute on function public.push_remove(text) to anon, authenticated;
