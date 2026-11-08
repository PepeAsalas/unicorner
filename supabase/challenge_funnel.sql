-- Friend challenge funnel (read-only): per day and game (daily = the Daily 5, rosco, millon), how many challenges were
-- sent, opened by someone else, played, won, and challenged back. Paste into Supabase -> SQL Editor -> Run. Changes nothing.
with ev as (select name, game_day, visitor, coalesce(data->>'game', 'daily') as game, data from events
            where name in ('challenge_sent', 'challenge_open', 'challenge_finish')),
     s as (select distinct data->>'cid' cid, game, game_day from ev where name = 'challenge_sent'),
     o as (select distinct data->>'cid' cid, visitor from ev where name = 'challenge_open'),
     f as (select distinct data->>'cid' cid, visitor, (data->>'won')::boolean won from ev where name = 'challenge_finish')
select s.game_day as day, s.game,
       count(distinct s.cid)                          as challenges_sent,
       count(distinct o.visitor)                      as friends_opened,
       count(distinct f.visitor)                      as friends_finished,
       count(distinct f.visitor) filter (where f.won) as friends_won,
       (select count(*) from ev e where e.name = 'challenge_sent' and e.game = s.game and e.game_day = s.game_day
          and e.data->>'parent' is not null)          as challenged_back
from s left join o on o.cid = s.cid left join f on f.cid = s.cid
group by s.game_day, s.game order by s.game_day desc, s.game;
