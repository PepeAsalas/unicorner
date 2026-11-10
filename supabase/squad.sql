-- Unicorner Squad: friends, friend requests, invite links, and one ranking for every daily game.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- Run after leagues.sql, rosco_results.sql and millon.sql (they already exist on the live database).
--
-- Adds two tables (friendships, friend_requests), a friend_code column on player_profiles, and these functions:
--   sq_board(game, scope, filter)  the full ranking for 'daily' | 'rosco' | 'millon', 'day' | 'week',
--                                  filtered to 'all' | 'friends' | a league id. Anyone can read 'all' (like the
--                                  boards on the home page); 'friends' and leagues need you signed in.
--   sq_home()                      my invite code, my friends with today's results, requests in and out
--   sq_add_by_code(code)           someone opened my invite link: we become friends straight away
--   sq_request(nickname)           send a request (if they already asked me, we just become friends)
--   sq_respond(nickname, accept)   accept or decline a request I received
--   sq_remove(nickname)            unfriend, or cancel a request I sent
-- Nobody can read the tables directly: only these functions, and only about the signed-in player.

create table if not exists public.friendships (
  user_a     uuid not null references auth.users(id) on delete cascade,
  user_b     uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)                 -- one row per pair, smallest id first
);
create index if not exists friendships_b on public.friendships (user_b);

create table if not exists public.friend_requests (
  from_user  uuid not null references auth.users(id) on delete cascade,
  to_user    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);
create index if not exists friend_requests_to on public.friend_requests (to_user);

alter table public.friendships     enable row level security;
alter table public.friend_requests enable row level security;
revoke all on public.friendships, public.friend_requests from anon, authenticated;

alter table public.player_profiles add column if not exists friend_code text;
create unique index if not exists player_profiles_friend_code on public.player_profiles (friend_code) where friend_code is not null;

-- ── helpers ──
create or replace function public.sq_are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from friendships where user_a = least(a, b) and user_b = greatest(a, b))
$$;

create or replace function public.sq_befriend(a uuid, b uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if a = b then return; end if;
  if (select count(*) from friendships where user_a = a or user_b = a) >= 200 then raise exception 'You already have 200 friends'; end if;
  insert into friendships (user_a, user_b) values (least(a, b), greatest(a, b)) on conflict do nothing;
  delete from friend_requests where (from_user = a and to_user = b) or (from_user = b and to_user = a);
end $$;

create or replace function public.sq_user(p_nick text)
returns uuid language sql stable security definer set search_path = public as $$
  select user_id from player_profiles where lower(nickname) = lower(trim(coalesce(p_nick, ''))) limit 1
$$;

create or replace function public.sq_need_profile()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from player_profiles where user_id = uid) then raise exception 'Pick a nickname first'; end if;
  return uid;
end $$;

revoke all on function public.sq_are_friends(uuid, uuid), public.sq_befriend(uuid, uuid), public.sq_user(text), public.sq_need_profile()
  from public, anon, authenticated;

-- ── the ranking: one function for every game, scope and filter ──
create or replace function public.sq_board(p_game text default 'daily', p_scope text default 'day', p_filter text default 'all')
returns json language plpgsql stable security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  t   date := (now() at time zone 'Europe/Amsterdam')::date;
  d0  date := case when p_scope = 'week' then date_trunc('week', t)::date else t end;
  g   text := case when p_game in ('rosco', 'millon') then p_game else 'daily' end;
  f   text := coalesce(nullif(p_filter, ''), 'all');
  lg  uuid;
  out json; n int; mine json;
begin
  if f not in ('all', 'friends') then
    begin lg := f::uuid; exception when others then raise exception 'Unknown filter'; end;
    if uid is null or not exists (select 1 from league_members where league_id = lg and user_id = uid) then
      raise exception 'You are not in this league';
    end if;
  elsif f = 'friends' and uid is null then
    raise exception 'Sign in to see your friends';
  end if;

  with x as (
    select s.user_id, s.score::bigint as score, 0 as tb, s.created_at as at
      from player_scores s where g = 'daily' and s.day between d0 and t and not s.removed
    union all
    select r.user_id, r.score, coalesce((r.state->>'left')::int, 0), r.updated_at
      from rosco_results r where g = 'rosco' and r.day between d0 and t and r.done and r.score between 0 and coalesce(r.total, 26)
    union all
    select m.user_id, m.score, 0, m.updated_at
      from millon_results m where g = 'millon' and m.day between d0 and t),
  b as (select user_id, sum(score)::bigint as score, sum(tb)::int as tb, count(*)::int as played, max(at) as at from x group by user_id),
  k as (
    select b.* from b
     where f = 'all'
        or b.user_id = uid
        or (f = 'friends' and sq_are_friends(uid, b.user_id))
        or (lg is not null and exists (select 1 from league_members m where m.league_id = lg and m.user_id = b.user_id))),
  r as (
    select k.*, p.nickname, p.kit, p.kits, p.best_streak, p.games,
           (uid is not null and sq_are_friends(uid, k.user_id)) as friend,
           row_number() over (order by k.score desc, k.tb desc, k.played desc, k.at) as rk
      from k join player_profiles p on p.user_id = k.user_id)
  select coalesce(json_agg(json_build_object('rank', rk, 'nickname', nickname, 'score', score, 'played', played,
                                             'me', user_id = uid, 'friend', friend, 'kit', kit, 'kits', kits,
                                             'streak', best_streak, 'games', games) order by rk) filter (where rk <= 500), '[]'::json),
         count(*)::int,
         (select json_build_object('rank', y.rk, 'score', y.score) from r y where y.user_id = uid)
    into out, n, mine from r;

  return json_build_object('game', g, 'scope', case when p_scope = 'week' then 'week' else 'day' end, 'filter', f,
                           'today', t, 'from', d0, 'players', n, 'me', mine, 'rows', out);
end $$;

-- ── my friends page: code, friends with today's results, requests ──
create or replace function public.sq_home()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := sq_need_profile(); t date := (now() at time zone 'Europe/Amsterdam')::date; wk date := date_trunc('week', t)::date; code text;
begin
  select friend_code into code from player_profiles where user_id = uid;
  while code is null loop
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      update player_profiles set friend_code = code where user_id = uid;
    exception when unique_violation then code := null;
    end;
  end loop;

  return json_build_object(
    'code', code,
    'friends', coalesce((
      select json_agg(json_build_object(
               'nickname', p.nickname, 'me', p.user_id = uid, 'kit', p.kit, 'kits', p.kits, 'streak', p.best_streak, 'games', p.games,
               'daily', (select s.score from player_scores s where s.user_id = p.user_id and s.day = t and not s.removed),
               'week', (select coalesce(sum(s.score), 0) from player_scores s where s.user_id = p.user_id and s.day between wk and t and not s.removed),
               'rosco', (select r.score from rosco_results r where r.user_id = p.user_id and r.day = t and r.done),
               'rosco_total', (select r.total from rosco_results r where r.user_id = p.user_id and r.day = t and r.done),
               'millon', (select m.score from millon_results m where m.user_id = p.user_id and m.day = t))
             order by p.user_id = uid desc, p.nickname)
        from player_profiles p
       where p.user_id = uid or sq_are_friends(uid, p.user_id)), '[]'::json),
    'incoming', coalesce((
      select json_agg(json_build_object('nickname', p.nickname, 'kit', p.kit, 'kits', p.kits, 'games', p.games) order by q.created_at desc)
        from friend_requests q join player_profiles p on p.user_id = q.from_user where q.to_user = uid), '[]'::json),
    'outgoing', coalesce((
      select json_agg(p.nickname order by q.created_at desc)
        from friend_requests q join player_profiles p on p.user_id = q.to_user where q.from_user = uid), '[]'::json));
end $$;

-- someone opened my invite link (unicornergame.lol/squad.html?add=CODE) and signed in
create or replace function public.sq_add_by_code(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := sq_need_profile(); them uuid; nick text;
begin
  select user_id, nickname into them, nick from player_profiles where friend_code = upper(trim(coalesce(p_code, '')));
  if them is null then raise exception 'That invite link is not valid'; end if;
  if them = uid then raise exception 'That is your own invite link'; end if;
  perform sq_befriend(uid, them);
  return nick;
end $$;

create or replace function public.sq_request(p_nick text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := sq_need_profile(); them uuid := sq_user(p_nick);
begin
  if them is null then raise exception 'Player not found'; end if;
  if them = uid then raise exception 'That is you'; end if;
  if sq_are_friends(uid, them) then return 'friends'; end if;
  if exists (select 1 from friend_requests where from_user = them and to_user = uid) then
    perform sq_befriend(uid, them); return 'friends';
  end if;
  if (select count(*) from friend_requests where from_user = uid) >= 50 then raise exception 'Too many requests waiting. Try again later'; end if;
  insert into friend_requests (from_user, to_user) values (uid, them) on conflict do nothing;
  return 'sent';
end $$;

create or replace function public.sq_respond(p_nick text, p_accept boolean)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := sq_need_profile(); them uuid := sq_user(p_nick);
begin
  if them is null or not exists (select 1 from friend_requests where from_user = them and to_user = uid) then
    raise exception 'No request from that player';
  end if;
  if p_accept then perform sq_befriend(uid, them); return 'friends'; end if;
  delete from friend_requests where from_user = them and to_user = uid;
  return 'declined';
end $$;

create or replace function public.sq_remove(p_nick text)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := sq_need_profile(); them uuid := sq_user(p_nick);
begin
  if them is null then raise exception 'Player not found'; end if;
  delete from friendships where user_a = least(uid, them) and user_b = greatest(uid, them);
  delete from friend_requests where from_user = uid and to_user = them;
  return 'removed';
end $$;

revoke all on function public.sq_board(text, text, text), public.sq_home(), public.sq_add_by_code(text),
  public.sq_request(text), public.sq_respond(text, boolean), public.sq_remove(text) from public;
grant execute on function public.sq_board(text, text, text) to anon, authenticated;
grant execute on function public.sq_home(), public.sq_add_by_code(text), public.sq_request(text),
  public.sq_respond(text, boolean), public.sq_remove(text) to authenticated;
