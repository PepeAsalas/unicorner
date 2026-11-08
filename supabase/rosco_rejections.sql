-- Read-only: every wrong Rosco answer typed by signed-in players (saved in their Rosco), most common first.
-- From 4 Nov on, wrong answers are also logged for everyone as 'rosco_reject' events (second query).
-- Paste into Supabase -> SQL Editor -> Run, then copy the result (both tables) back to Claude.
select r.day, t.key as letter, lower(trim(t.value)) as typed, count(*) as times
from rosco_results r, jsonb_each_text(r.state->'typed') t
where r.state->'res'->>t.key = 'no' and r.day >= '2026-10-30'
group by 1, 2, 3 order by r.day desc, times desc, letter;

select game_day as day, data->>'letter' as letter, lower(trim(data->>'typed')) as typed, count(*) as times
from events where name = 'rosco_reject'
group by 1, 2, 3 order by day desc, times desc, letter;
