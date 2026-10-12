You have access to my Supabase project for Unicorner (project ref yujhjepukzdahsppntua). The game changed its points per answer level from 10/25/40/70/100 to 10/30/60/85/100, starting with today's game (2026-10-12). A few players already played today on the old points, so their saved scores for today need re-scoring. Please do exactly these steps and nothing else.

1. First show me what will change (read only):

select s.user_id, p.nickname, s.score as old_score,
       (select coalesce(sum(case (x->>2)::int when 25 then 30 when 40 then 60 when 70 then 85 else coalesce((x->>2)::int,0) end),0)
          from jsonb_array_elements(s.picks) x) as new_score,
       s.picks
from public.player_scores s left join public.player_profiles p on p.user_id = s.user_id
where s.day = '2026-10-12' and not s.removed
order by s.score desc;

Each entry in "picks" is [question_number, answer_name, points]. Points 25, 40 and 70 become 30, 60 and 85; 10, 100 and 0 stay the same.

2. Then run this update as one migration:

update public.player_scores s
set score = least(500, (select coalesce(sum(case (x->>2)::int when 25 then 30 when 40 then 60 when 70 then 85 else coalesce((x->>2)::int,0) end),0)
                        from jsonb_array_elements(s.picks) x))
where s.day = '2026-10-12'
  and s.picks is not null and jsonb_typeof(s.picks) = 'array'
  and exists (select 1 from jsonb_array_elements(s.picks) x where (x->>2)::int in (25,40,70));

3. Report back:
- the table from step 1 (nickname, old_score, new_score)
- how many rows the update changed
- any of today's rows where picks is null (those can't be re-scored automatically; just list them, don't change them)
Tell me if anything errors, and paste the exact error message.
