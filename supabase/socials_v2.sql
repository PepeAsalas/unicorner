-- Socials v2: managing leagues, and the friend-request count for the home page.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Run after squad.sql. Changes no tables; adds these functions (all check who is calling):
--   sq_league(league)              members of a league I'm in (nickname, kit, who owns it, who is me)
--   sq_league_rename(league, name) owner only, 2-30 characters
--   sq_league_kick(league, nick)   owner only, can't remove themselves
--   sq_league_delete(league)       owner only, removes the league for everyone
--   sq_league_leave(league)        anyone; if the owner leaves, the longest-standing member becomes owner;
--                                  the last one out deletes the league
--   sq_badge()                     how many friend requests are waiting for me (for the red dot on the home page)

create or replace function public.sq_league(p_league uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); l leagues;
begin
  if uid is null or not exists (select 1 from league_members where league_id = p_league and user_id = uid) then
    raise exception 'You are not in this league';
  end if;
  select * into l from leagues where id = p_league;
  return json_build_object('id', l.id, 'name', l.name, 'code', l.code, 'is_owner', l.owner = uid,
    'members', coalesce((
      select json_agg(json_build_object('nickname', p.nickname, 'kit', coalesce(p.kit, 'classic'), 'owner', m.user_id = l.owner,
                                        'me', m.user_id = uid, 'friend', sq_are_friends(uid, m.user_id))
                      order by m.user_id = l.owner desc, m.joined_at)
        from league_members m join player_profiles p on p.user_id = m.user_id
       where m.league_id = p_league), '[]'::json));
end $$;

create or replace function public.sq_league_rename(p_league uuid, p_name text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); nm text := lg_clean(p_name);
begin
  if not exists (select 1 from leagues where id = p_league and owner = uid) then raise exception 'Only the league owner can do that'; end if;
  if char_length(nm) < 2 or char_length(nm) > 30 then raise exception 'League name must be 2–30 characters'; end if;
  update leagues set name = nm where id = p_league;
  return json_build_object('id', p_league, 'name', nm);
end $$;

create or replace function public.sq_league_kick(p_league uuid, p_nick text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); them uuid := sq_user(p_nick);
begin
  if not exists (select 1 from leagues where id = p_league and owner = uid) then raise exception 'Only the league owner can do that'; end if;
  if them is null or them = uid then raise exception 'You can''t remove that player'; end if;
  delete from league_members where league_id = p_league and user_id = them;
  return 'removed';
end $$;

create or replace function public.sq_league_delete(p_league uuid)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if not exists (select 1 from leagues where id = p_league and owner = uid) then raise exception 'Only the league owner can do that'; end if;
  delete from league_members where league_id = p_league;
  delete from leagues where id = p_league;
  return 'deleted';
end $$;

create or replace function public.sq_league_leave(p_league uuid)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); was_owner boolean;
begin
  if uid is null or not exists (select 1 from league_members where league_id = p_league and user_id = uid) then
    raise exception 'You are not in this league';
  end if;
  select owner = uid into was_owner from leagues where id = p_league;
  delete from league_members where league_id = p_league and user_id = uid;
  if not exists (select 1 from league_members where league_id = p_league) then
    delete from leagues where id = p_league; return 'deleted';
  end if;
  if was_owner then
    update leagues set owner = (select user_id from league_members where league_id = p_league order by joined_at limit 1) where id = p_league;
  end if;
  return 'left';
end $$;

create or replace function public.sq_badge()
returns int language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then 0 else (select count(*)::int from friend_requests where to_user = auth.uid()) end
$$;

revoke all on function public.sq_league(uuid), public.sq_league_rename(uuid, text), public.sq_league_kick(uuid, text),
  public.sq_league_delete(uuid), public.sq_league_leave(uuid), public.sq_badge() from public, anon;
grant execute on function public.sq_league(uuid), public.sq_league_rename(uuid, text), public.sq_league_kick(uuid, text),
  public.sq_league_delete(uuid), public.sq_league_leave(uuid), public.sq_badge() to authenticated;
