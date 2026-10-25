-- Unicorner Football Tycoon demo: the feedback form on the 10-minute wall.
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once. Adds one table and one function.
-- The email is only for "tell me when the full game is ready" (no newsletter).

create table if not exists public.tycoon_feedback (
  id         bigserial primary key,
  created_at timestamptz not null default now(),
  rating     smallint not null check (rating between 1 and 10),
  comment    text check (char_length(comment) <= 1000),
  email      text check (char_length(email) <= 200),
  visitor    text check (char_length(visitor) <= 64),
  seconds    integer,
  earned     bigint
);
alter table public.tycoon_feedback enable row level security;
-- no policies: nobody can read it from the site; only the function below can add rows

create or replace function public.tycoon_feedback_submit(p_rating int, p_comment text, p_email text, p_visitor text, p_seconds int, p_earned bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_rating is null or p_rating < 1 or p_rating > 10 then raise exception 'rating must be 1-10'; end if;
  if p_email is not null and p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then p_email := null; end if;
  -- one answer per device: a second send replaces nothing and is ignored
  if p_visitor is not null and exists (select 1 from tycoon_feedback where visitor = left(p_visitor, 64)) then return; end if;
  insert into tycoon_feedback (rating, comment, email, visitor, seconds, earned)
  values (p_rating, nullif(left(btrim(coalesce(p_comment, '')), 1000), ''), lower(left(btrim(p_email), 200)), left(p_visitor, 64),
          greatest(0, least(p_seconds, 100000)), greatest(0, least(p_earned, 9000000000000000000)));
end $$;

revoke all on function public.tycoon_feedback_submit(int, text, text, text, int, bigint) from public;
grant execute on function public.tycoon_feedback_submit(int, text, text, text, int, bigint) to anon, authenticated;

-- To read the feedback: select * from public.tycoon_feedback order by created_at desc;
-- Emails to notify at launch: select distinct email from public.tycoon_feedback where email is not null;
