-- ── Kits follow the account: unlocked kits are merged across devices, and every device wears the account's kit ──
-- lg_me now returns the profile's kit and kits.
create or replace function public.lg_me()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); prof json; lgs json;
begin
  select json_build_object('nickname', nickname, 'news_opt_out', news_opt_out, 'kit', coalesce(kit, 'classic'), 'kits', kits) into prof
    from player_profiles where user_id = uid;
  select coalesce(json_agg(json_build_object(
           'id', l.id, 'code', l.code, 'name', l.name, 'is_owner', l.owner = uid,
           'members', (select count(*) from league_members x where x.league_id = l.id))
           order by m.joined_at), '[]'::json) into lgs
    from league_members m join leagues l on l.id = m.league_id where m.user_id = uid;
  return json_build_object('profile', prof, 'leagues', lgs, 'today', lg_today());
end $$;

-- lg_set_look: kits are added to what the account already has (never removed); streak and games keep the highest;
-- p_kit = null keeps the kit being worn, 'classic' takes it off.
create or replace function public.lg_set_look(p_kit text, p_kits text[] default '{}', p_streak integer default 0, p_games integer default 0)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid();
        known text[] := array['stripes','hoops','ref','candy','sash','keeper','halves','night','pin','fire','quarters','checks','hat3','dots',
                              'toxic','ice','perfect','leopard','zebra','shadow','galaxy','ocean','sunset','camo','lava','chrome','rainbow','tiedye','gold'];
        ks text[] := coalesce(p_kits, '{}');
        cur text[];
begin
  if coalesce(array_length(ks, 1), 0) > 40 or not (ks <@ known) then raise exception 'Unknown kit'; end if;
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
