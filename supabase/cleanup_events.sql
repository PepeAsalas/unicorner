-- Free up database space: delete the noisy events the site no longer logs (nothing reads them).
-- Paste into Supabase -> SQL Editor. Run STEP 1, then STEP 2 on its own (VACUUM can't run together with other statements).

-- STEP 1: delete them (can take a minute on a big table)
delete from public.events
where name in ('answer_attempt','question_view','leave','banner_view','awards_view','crowd_share_shown','howto_step','rosco_answer','rosco_pass');

-- STEP 2: give the space back to the disk (run this line alone; the events table is locked for a few seconds while it runs)
-- vacuum full public.events;

-- Check: size of the events table afterwards
-- select pg_size_pretty(pg_total_relation_size('public.events'));
