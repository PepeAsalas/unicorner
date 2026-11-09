-- Find a player by nickname to challenge them to a duel. Run once, after duel_challenges.sql. Safe to run more than once.
-- Signed-in players only. Returns up to 8 nicknames: names starting with the search first, then names containing it.
-- Players who switched challenges off, and you yourself, are left out. Only public info: nickname, kit, games played.

create extension if not exists pg_trgm;
create index if not exists player_profiles_nick_trgm on public.player_profiles using gin (lower(nickname) gin_trgm_ops);

create or replace function public.player_search(p_q text)
returns table (nick text, kit text, games int)
language sql stable security definer set search_path = public as $$
  with q as (select lower(trim(coalesce(p_q, ''))) s)
  select p.nickname, p.kit, p.games
    from player_profiles p, q
   where auth.uid() is not null
     and char_length(q.s) >= 2
     and p.user_id <> auth.uid()
     and not p.duel_challenges_off
     and lower(p.nickname) like '%' || replace(replace(q.s, '%', ''), '_', '\_') || '%'
   order by (lower(p.nickname) = q.s) desc, (lower(p.nickname) like q.s || '%') desc, p.games desc, p.nickname
   limit 8
$$;

revoke execute on function public.player_search(text) from public, anon;
grant execute on function public.player_search(text) to authenticated;
