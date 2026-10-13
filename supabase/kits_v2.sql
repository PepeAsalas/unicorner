-- ── New kits (mud, bee, tartan, retro, straw, aurora, matrix, glitch, royal) and the mythic Cosmic GOAT ──
-- lg_me also returns "wins": the number of finished days the player ended 1st on the global ranking.
-- lg_set_look accepts the new kit ids; "goat" is only accepted for players with at least one win.
create or replace function public.lg_wins(p_user uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from (
    select s.user_id, row_number() over (partition by s.day order by s.score desc, s.created_at) as rk
    from player_scores s join player_profiles p on p.user_id = s.user_id
    where not s.removed and s.day < lg_today()) x
  where x.rk = 1 and x.user_id = p_user;
$$;
revoke all on function public.lg_wins(uuid) from public, anon, authenticated;

create or replace function public.lg_me()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); prof json; lgs json;
begin
  select json_build_object('nickname', nickname, 'news_opt_out', news_opt_out, 'kit', coalesce(kit, 'classic'), 'kits', kits, 'wins', lg_wins(uid)) into prof
    from player_profiles where user_id = uid;
  select coalesce(json_agg(json_build_object(
           'id', l.id, 'code', l.code, 'name', l.name, 'is_owner', l.owner = uid,
           'members', (select count(*) from league_members x where x.league_id = l.id))
           order by m.joined_at), '[]'::json) into lgs
    from league_members m join leagues l on l.id = m.league_id where m.user_id = uid;
  return json_build_object('profile', prof, 'leagues', lgs, 'today', lg_today());
end $$;

create or replace function public.lg_set_look(p_kit text, p_kits text[] default '{}', p_streak integer default 0, p_games integer default 0)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid();
        known text[] := array['stripes','hoops','ref','candy','sash','keeper','halves','night','pin','fire','quarters','checks','hat3','dots',
                              'toxic','ice','perfect','leopard','zebra','shadow','galaxy','ocean','sunset','camo','lava','chrome','rainbow','tiedye','gold',
                              'mud','bee','tartan','retro','straw','aurora','matrix','glitch','royal','goat'];
        ks text[] := coalesce(p_kits, '{}');
        cur text[];
begin
  if coalesce(array_length(ks, 1), 0) > 60 or not (ks <@ known) then raise exception 'Unknown kit'; end if;
  if 'goat' = any(ks) and lg_wins(uid) < 1 then ks := array_remove(ks, 'goat'); end if;
  select coalesce(kits, '{}') into cur from player_profiles where user_id = uid;
  ks := coalesce((select array_agg(distinct x order by x) from unnest(cur || ks) x), '{}');
  if p_kit is not null and p_kit <> 'classic' and not (p_kit = any(ks)) then raise exception 'That kit is not unlocked'; end if;
  update player_profiles
     set kit = case when p_kit is null then kit else nullif(p_kit, 'classic') end,
         kits = ks,
         best_streak = greatest(best_streak, least(greatest(coalesce(p_streak, 0), 0), 5000)),
         games = greatest(games, least(greatest(coalesce(p_games, 0), 0), 5000))
   where user_id = uid;
end $$;
revoke all on function public.lg_set_look(text, text[], integer, integer) from public, anon;
grant execute on function public.lg_set_look(text, text[], integer, integer) to authenticated;
revoke all on function public.lg_me() from public, anon;
grant execute on function public.lg_me() to authenticated;
