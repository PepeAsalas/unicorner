-- Kits v3: one kit per account, the same on every device, on Socials and on every ranking.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Run it after profile_v2.sql (it uses lg_stats_from_scores from there).
--
-- What was wrong: lg_set_look checked every kit against a fixed list that missed 'og' (Classic) and the six Halloween
-- kits. Anyone owning one of those had every save rejected, so the account kept an old kit (what Socials shows) and
-- each device kept its own.
-- Now:
--   * any kit id the game sends is accepted (lowercase letters, digits and dashes), except the two earned on the
--     server: 'goat' (needs a daily win) and 'boardroom' (crew only). Nothing is ever rejected as a whole.
--   * every kit change carries the time it was made (p_kit_at, milliseconds). The account keeps the newest one, so
--     the kit you picked last wins on every device, and an older unsaved change on another phone can't overwrite it.
--   * lg_set_look returns the account's kit, and lg_me includes kit_at, so devices can follow the account.

alter table public.player_profiles add column if not exists kit_at timestamptz;

drop function if exists public.lg_set_look(text, text[], integer, integer);
drop function if exists public.lg_set_look(text, text[], integer, integer, bigint);

create function public.lg_set_look(p_kit text, p_kits text[] default '{}', p_streak integer default 0,
                                   p_games integer default 0, p_kit_at bigint default null)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid();
        crew boolean := lg_is_crew(uid);
        ks text[];
        cur text[];
        cur_at timestamptz;
        want text;
        at timestamptz;
        r record;
begin
  -- kits unlocked on this device: keep the ones that look like kit ids, at most 80
  select coalesce(array_agg(distinct x order by x), '{}') into ks
    from (select x from unnest(coalesce(p_kits, '{}')) x
           where x ~ '^[a-z0-9-]{1,24}$' and x not in ('classic', 'og') limit 80) y;
  if 'goat' = any(ks) and lg_wins(uid) < 1 then ks := array_remove(ks, 'goat'); end if;
  if not crew then ks := array_remove(ks, 'boardroom'); end if;

  select coalesce(kits, '{}'), kit_at into cur, cur_at from player_profiles where user_id = uid;
  if not found then raise exception 'Pick a nickname first'; end if;
  if not crew then cur := array_remove(cur, 'boardroom'); end if;
  ks := coalesce((select array_agg(distinct x order by x) from unnest(cur || ks) x), '{}');

  update player_profiles
     set kits = ks,
         kit = case when kit = 'boardroom' and not crew then null else kit end
   where user_id = uid;
  -- games played and best streak are counted by the database from every day played (profile_v2.sql), not taken from a device
  perform lg_stats_from_scores(uid);

  -- the kit itself: only a change newer than the one the account has (an old app sends no time: it only fills an empty account)
  if p_kit is not null and p_kit ~ '^[a-z0-9-]{1,24}$' then
    want := nullif(p_kit, 'classic');
    at := least(to_timestamp(greatest(coalesce(p_kit_at, 1), 1) / 1000.0), now() + interval '1 day');
    if (want is null or want = 'og' or want = any(ks)) and (cur_at is null or at > cur_at) then
      update player_profiles set kit = want, kit_at = at where user_id = uid;
    end if;
  end if;

  select coalesce(kit, 'classic') as kit, kit_at, kits into r from player_profiles where user_id = uid;
  return json_build_object('kit', r.kit, 'kit_at', floor(extract(epoch from r.kit_at) * 1000)::bigint, 'kits', r.kits);
end $$;
revoke all on function public.lg_set_look(text, text[], integer, integer, bigint) from public, anon;
grant execute on function public.lg_set_look(text, text[], integer, integer, bigint) to authenticated;

-- lg_me: the same as before, plus kit_at
create or replace function public.lg_me()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); prof json; lgs json;
begin
  select json_build_object('nickname', nickname, 'news_opt_out', news_opt_out, 'kit', coalesce(kit, 'classic'), 'kits', kits,
                           'kit_at', floor(extract(epoch from kit_at) * 1000)::bigint,
                           'wins', lg_wins(uid), 'favs', fav_kits) into prof
    from player_profiles where user_id = uid;
  select coalesce(json_agg(json_build_object(
           'id', l.id, 'code', l.code, 'name', l.name, 'is_owner', l.owner = uid,
           'members', (select count(*) from league_members x where x.league_id = l.id))
           order by m.joined_at), '[]'::json) into lgs
    from league_members m join leagues l on l.id = m.league_id where m.user_id = uid;
  return json_build_object('profile', prof, 'leagues', lgs, 'today', lg_today(), 'crew', lg_is_crew(uid));
end $$;
revoke all on function public.lg_me() from public, anon;
grant execute on function public.lg_me() to authenticated;
