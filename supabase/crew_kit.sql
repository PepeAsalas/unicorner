-- Crew kit (Boardroom): only people on this private email list get it.
-- The list lives in its own table that players can't read; the server checks it when someone saves their kits.

create table if not exists public.crew_emails (email text primary key);
alter table public.crew_emails enable row level security;
revoke all on table public.crew_emails from public, anon, authenticated;

-- The email list itself is added straight into the database (not stored in this public repo):
--   insert into public.crew_emails (email) values ('someone@example.com') on conflict (email) do nothing;

-- true when the signed-in user's email is on the crew list
create or replace function public.lg_is_crew(p_user uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from auth.users u join public.crew_emails c on c.email = lower(trim(u.email))
    where u.id = p_user);
$$;
revoke all on function public.lg_is_crew(uuid) from public, anon, authenticated;

-- lg_me: also says whether this account is crew
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
  return json_build_object('profile', prof, 'leagues', lgs, 'today', lg_today(), 'crew', lg_is_crew(uid));
end $$;

-- lg_set_look: knows the Boardroom kit, and only keeps it for crew accounts
create or replace function public.lg_set_look(p_kit text, p_kits text[] default '{}', p_streak integer default 0, p_games integer default 0)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid();
        known text[] := array['stripes','hoops','ref','candy','sash','keeper','halves','night','pin','fire','quarters','checks','hat3','dots',
                              'toxic','ice','perfect','leopard','zebra','shadow','galaxy','ocean','sunset','camo','lava','chrome','rainbow','tiedye','gold',
                              'mud','bee','tartan','retro','straw','aurora','matrix','glitch','royal','goat','boardroom'];
        ks text[] := coalesce(p_kits, '{}');
        cur text[];
        crew boolean := lg_is_crew(uid);
begin
  if coalesce(array_length(ks, 1), 0) > 60 or not (ks <@ known) then raise exception 'Unknown kit'; end if;
  if 'goat' = any(ks) and lg_wins(uid) < 1 then ks := array_remove(ks, 'goat'); end if;
  if not crew then ks := array_remove(ks, 'boardroom'); end if;
  select coalesce(kits, '{}') into cur from player_profiles where user_id = uid;
  if not crew then cur := array_remove(cur, 'boardroom'); end if;
  ks := coalesce((select array_agg(distinct x order by x) from unnest(cur || ks) x), '{}');
  if p_kit is not null and p_kit <> 'classic' and not (p_kit = any(ks)) then raise exception 'That kit is not unlocked'; end if;
  update player_profiles
     set kit = case when p_kit is null then (case when kit = 'boardroom' and not crew then null else kit end) else nullif(p_kit, 'classic') end,
         kits = ks,
         best_streak = greatest(best_streak, least(greatest(coalesce(p_streak, 0), 0), 5000)),
         games = greatest(games, least(greatest(coalesce(p_games, 0), 0), 5000))
   where user_id = uid;
end $$;
