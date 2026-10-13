-- ── Favourite kits follow the account ──
alter table public.player_profiles add column if not exists fav_kits text[] not null default '{}';

create or replace function public.lg_set_favs(p_favs text[] default '{}')
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid();
        known text[] := array['classic','stripes','hoops','ref','candy','sash','keeper','halves','night','pin','fire','quarters','checks','hat3','dots',
                              'toxic','ice','perfect','leopard','zebra','shadow','galaxy','ocean','sunset','camo','lava','chrome','rainbow','tiedye','gold',
                              'mud','bee','tartan','retro','straw','aurora','matrix','glitch','royal','goat'];
        fs text[] := coalesce(p_favs, '{}');
begin
  if coalesce(array_length(fs, 1), 0) > 60 or not (fs <@ known) then raise exception 'Unknown kit'; end if;
  -- keep the order they were starred in, without repeats
  update player_profiles set fav_kits = coalesce((select array_agg(x order by i) from (select distinct on (x) x, i from unnest(fs) with ordinality u(x, i) order by x, i) d), '{}')
   where user_id = uid;
end $$;
revoke all on function public.lg_set_favs(text[]) from public, anon;
grant execute on function public.lg_set_favs(text[]) to authenticated;

create or replace function public.lg_me()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); prof json; lgs json;
begin
  select json_build_object('nickname', nickname, 'news_opt_out', news_opt_out, 'kit', coalesce(kit, 'classic'), 'kits', kits,
                           'wins', lg_wins(uid), 'favs', fav_kits) into prof
    from player_profiles where user_id = uid;
  select coalesce(json_agg(json_build_object(
           'id', l.id, 'code', l.code, 'name', l.name, 'is_owner', l.owner = uid,
           'members', (select count(*) from league_members x where x.league_id = l.id))
           order by m.joined_at), '[]'::json) into lgs
    from league_members m join leagues l on l.id = m.league_id where m.user_id = uid;
  return json_build_object('profile', prof, 'leagues', lgs, 'today', lg_today());
end $$;
revoke all on function public.lg_me() from public, anon;
grant execute on function public.lg_me() to authenticated;
