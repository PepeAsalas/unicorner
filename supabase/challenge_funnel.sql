-- Friend challenge funnel (read-only): per day, how many challenges were sent, opened by someone else, played, and won.
-- Paste into Supabase -> SQL Editor -> Run. Changes nothing.
with s as (select data->>'cid' cid, game_day from events where name = 'challenge_sent'),
     o as (select distinct data->>'cid' cid, visitor from events where name = 'challenge_open'),
     f as (select distinct data->>'cid' cid, visitor, (data->>'won')::boolean won from events where name = 'challenge_finish'),
     n as (select distinct data->>'cid' cid from events where name = 'challenge_sent' and data->>'parent' is not null)
select s.game_day as day,
       count(distinct s.cid)                                   as challenges_sent,
       count(distinct o.visitor)                               as friends_opened,
       count(distinct f.visitor)                               as friends_finished,
       count(distinct f.visitor) filter (where f.won)          as friends_won,
       (select count(*) from events e where e.name = 'challenge_sent' and e.game_day = s.game_day and e.data->>'parent' is not null) as challenged_back
from s left join o on o.cid = s.cid left join f on f.cid = s.cid
group by s.game_day order by s.game_day desc;
