-- 17 Nov 2026: today's question f100 changed from Peter Odemwingie to David Beckham.
-- Answers already given keep their points; the club is renamed to a Beckham club in the same tier.
-- Safe to run more than once.
with m(old, new) as (values
  ('West Bromwich Albion','Manchester United'),
  ('Lokomotiv Moscow','LA Galaxy'), ('Stoke City','LA Galaxy'),
  ('Lille','AC Milan'), ('Cardiff City','AC Milan'),
  ('Bristol City','Paris Saint-Germain'), ('Rotherham United','Paris Saint-Germain'),
  ('RAAL La Louvière','Preston North End'), ('Bendel Insurance','Preston North End'), ('Madura United','Preston North End'))
update public.player_scores s set picks = (
  select jsonb_agg(case when (e->>3 = 'f100' or (e->>3 is null and e->>0 = '4')) and m.new is not null
                        then jsonb_set(e, '{1}', to_jsonb(m.new)) else e end order by t.ord)
  from jsonb_array_elements(s.picks) with ordinality t(e, ord)
  left join m on m.old = t.e->>1)
where s.day = '2026-11-17' and s.picks is not null and jsonb_typeof(s.picks) = 'array';

-- the answer counts behind "x% of players said this"
with m(old, new) as (values
  ('West Bromwich Albion','Manchester United'),
  ('Lokomotiv Moscow','LA Galaxy'), ('Stoke City','LA Galaxy'),
  ('Lille','AC Milan'), ('Cardiff City','AC Milan'),
  ('Bristol City','Paris Saint-Germain'), ('Rotherham United','Paris Saint-Germain'),
  ('RAAL La Louvière','Preston North End'), ('Bendel Insurance','Preston North End'), ('Madura United','Preston North End'))
update public.events e set data = jsonb_set(e.data, '{answer}', to_jsonb(m.new))
from m
where e.name = 'question_result' and e.game_day::text = '2026-11-17'
  and e.data->>'question_id' = 'f100' and e.data->>'answer' = m.old;
