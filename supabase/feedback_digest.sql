-- Weekly feedback for the feedback routine: one read-only function that returns the last N days of player feedback,
-- with emails and names removed. It only answers with the secret feedback key (stored here as a hash, never in the repo).
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.
--
-- Then set the key once (pick a long random password, keep it in your password manager):
--   insert into public.feedback_keys(hash) values (md5('YOUR-LONG-RANDOM-KEY'));
-- and add the same key to the Claude environment as FEEDBACK_KEY (never in the repo or the chat).

create table if not exists public.feedback_keys (hash text primary key, created_at timestamptz not null default now());
alter table public.feedback_keys enable row level security;
revoke all on public.feedback_keys from anon, authenticated;

-- the weekly read filters events by name and date
create index if not exists events_name_created on public.events (name, created_at);

-- strips anything that looks like an email address from free text
create or replace function public.feedback_scrub(t text)
returns text language sql immutable as $$
  select regexp_replace(coalesce(t, ''), '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[email]', 'g')
$$;

create or replace function public.feedback_digest(p_key text, p_days int default 7)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(days => least(greatest(coalesce(p_days, 7), 1), 31));
begin
  if p_key is null or not exists (select 1 from feedback_keys where hash = md5(p_key)) then
    raise exception 'not allowed';
  end if;
  return jsonb_build_object(
    'since', since,
    -- "Problem with a question", submitted questions and contact messages, without email, name or newsletter fields
    'forms', coalesce((
      select jsonb_agg(jsonb_build_object('kind', s.kind, 'sent', s.payload->>'sentAt',
               'fields', (select coalesce(jsonb_object_agg(k, feedback_scrub(v)), '{}'::jsonb)
                          from jsonb_each_text(s.payload) as f(k, v)
                          where k not in ('email', 'name', '_replyto', 'newsletter', 'newsletterConsentAt', 'privacyNoticeVersion', 'sentAt', '_honey')))
             order by s.payload->>'sentAt')
      from submissions s
      where s.kind in ('report', 'question', 'contact') and (s.payload->>'sentAt')::timestamptz >= since), '[]'::jsonb),
    -- feedback boxes in the games (Rosco, Millions, Stable Hand, Duels)
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('name', e.name, 'at', e.created_at,
               'rating', e.data->>'rating', 'score', e.data->>'score', 'text', feedback_scrub(e.data->>'text'), 'language', e.data->>'language')
             order by e.created_at)
      from events e
      where e.name in ('rosco_feedback', 'millon_feedback', 'stablehand_feedback', 'duel_feedback', 'duel_feedback_text') and e.created_at >= since), '[]'::jsonb),
    -- Chairman's 1-10 rating and comment (the email column is never returned)
    'chairman', coalesce((
      select jsonb_agg(jsonb_build_object('at', t.created_at, 'rating', t.rating, 'comment', feedback_scrub(t.comment)) order by t.created_at)
      from tycoon_feedback t where t.created_at >= since), '[]'::jsonb));
end $$;

revoke all on function public.feedback_digest(text, int) from public;
grant execute on function public.feedback_digest(text, int) to anon, authenticated;
