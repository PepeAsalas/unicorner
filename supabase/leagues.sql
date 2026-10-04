-- Unicorner leagues: player profiles, private friend leagues and daily scores.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.
--
-- Security model: the tables below are NOT readable or writable from the browser at all
-- (row level security on, no policies, privileges revoked). Signed-in players can only use
-- the functions at the bottom, and every function checks auth.uid() itself.

-- ── Tables ────────────────────────────────────────────────────────────────────
create table if not exists public.player_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  nickname     text not null check (char_length(nickname) between 2 and 16),
  email        text,
  news_opt_out boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists player_profiles_nickname_key on public.player_profiles (lower(nickname));

create table if not exists public.leagues (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  name       text not null check (char_length(name) between 2 and 30),
  owner      uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);
create index if not exists league_members_user_idx on public.league_members (user_id);

create table if not exists public.player_scores (
  user_id    uuid not null references auth.users(id) on delete cascade,
  day        date not null,
  score      integer not null check (score between 0 and 500),
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.player_profiles enable row level security;
alter table public.leagues        enable row level security;
alter table public.league_members enable row level security;
alter table public.player_scores  enable row level security;
revoke all on public.player_profiles, public.leagues, public.league_members, public.player_scores from anon, authenticated;

-- ── Helpers ───────────────────────────────────────────────────────────────────
create or replace function public.lg_today() returns date
language sql stable set search_path = public as
$$ select (now() at time zone 'Europe/Amsterdam')::date $$;

create or replace function public.lg_uid() returns uuid
language plpgsql stable set search_path = public as
$$ begin
  if auth.uid() is null then raise exception 'Please sign in' using errcode = '28000'; end if;
  return auth.uid();
end $$;

create or replace function public.lg_clean(t text) returns text
language sql immutable set search_path = public as
$$ select regexp_replace(btrim(coalesce(t, '')), '\s+', ' ', 'g') $$;

-- How many leagues one player may be in. Beta: 1 — more come with Infinity mode.
create or replace function public.lg_max_leagues() returns int
language sql immutable set search_path = public as
$$ select 1 $$;

-- ── Player functions (all SECURITY DEFINER, all check the caller) ─────────────
create or replace function public.lg_save_profile(p_nickname text, p_news_opt_out boolean)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); nick text := lg_clean(p_nickname);
begin
  if char_length(nick) < 2 or char_length(nick) > 16 then raise exception 'Nickname must be 2–16 characters'; end if;
  if nick !~ '^[[:alnum:] _.''-]+$' then raise exception 'Nickname can only use letters, numbers, spaces and . _ -'; end if;
  if exists (select 1 from player_profiles where lower(nickname) = lower(nick) and user_id <> uid) then
    raise exception 'That nickname is taken' using errcode = '23505';
  end if;
  insert into player_profiles (user_id, nickname, email, news_opt_out)
  values (uid, nick, auth.jwt() ->> 'email', coalesce(p_news_opt_out, false))
  on conflict (user_id) do update
    set nickname = excluded.nickname, news_opt_out = excluded.news_opt_out,
        email = coalesce(excluded.email, player_profiles.email), updated_at = now();
  return json_build_object('nickname', nick, 'news_opt_out', coalesce(p_news_opt_out, false));
end $$;

create or replace function public.lg_me()
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); prof json; lgs json;
begin
  select json_build_object('nickname', nickname, 'news_opt_out', news_opt_out) into prof
    from player_profiles where user_id = uid;
  select coalesce(json_agg(json_build_object(
           'id', l.id, 'code', l.code, 'name', l.name, 'is_owner', l.owner = uid,
           'members', (select count(*) from league_members x where x.league_id = l.id))
           order by m.joined_at), '[]'::json) into lgs
    from league_members m join leagues l on l.id = m.league_id where m.user_id = uid;
  return json_build_object('profile', prof, 'leagues', lgs, 'today', lg_today());
end $$;

create or replace function public.lg_create_league(p_name text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); nm text := lg_clean(p_name); new_code text; new_id uuid;
        alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea; i int;
begin
  if not exists (select 1 from player_profiles where user_id = uid) then raise exception 'Pick a nickname first'; end if;
  if char_length(nm) < 2 or char_length(nm) > 30 then raise exception 'League name must be 2–30 characters'; end if;
  if (select count(*) from league_members where user_id = uid) >= lg_max_leagues() then
    raise exception 'For now you can be in one league — more are coming with Infinity mode';
  end if;
  if (select count(*) from leagues where owner = uid and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Too many new leagues today — try again tomorrow';
  end if;
  loop
    b := uuid_send(gen_random_uuid()); new_code := '';
    for i in 0..7 loop new_code := new_code || substr(alphabet, (get_byte(b, i) % 32) + 1, 1); end loop;
    exit when not exists (select 1 from leagues where code = new_code);
  end loop;
  insert into leagues (code, name, owner) values (new_code, nm, uid) returning id into new_id;
  insert into league_members (league_id, user_id) values (new_id, uid);
  return json_build_object('id', new_id, 'code', new_code, 'name', nm);
end $$;

create or replace function public.lg_league_preview(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); l leagues;
begin
  select * into l from leagues where code = upper(btrim(p_code));
  if not found then raise exception 'That league link is not valid'; end if;
  return json_build_object('id', l.id, 'name', l.name, 'code', l.code,
    'members', (select count(*) from league_members where league_id = l.id),
    'already_member', exists (select 1 from league_members where league_id = l.id and user_id = uid));
end $$;

create or replace function public.lg_join_league(p_code text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); l leagues;
begin
  if not exists (select 1 from player_profiles where user_id = uid) then raise exception 'Pick a nickname first'; end if;
  select * into l from leagues where code = upper(btrim(p_code));
  if not found then raise exception 'That league link is not valid'; end if;
  if exists (select 1 from league_members where league_id = l.id and user_id = uid) then
    return json_build_object('id', l.id, 'code', l.code, 'name', l.name);
  end if;
  if (select count(*) from league_members where user_id = uid) >= lg_max_leagues() then
    raise exception 'For now you can be in one league — more are coming with Infinity mode';
  end if;
  if (select count(*) from league_members where league_id = l.id) >= 50 then raise exception 'This league is full (50 players)'; end if;
  insert into league_members (league_id, user_id) values (l.id, uid);
  return json_build_object('id', l.id, 'code', l.code, 'name', l.name);
end $$;

create or replace function public.lg_leave_league(p_league uuid)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid();
begin
  delete from league_members where league_id = p_league and user_id = uid;
  delete from leagues l where l.id = p_league and not exists (select 1 from league_members m where m.league_id = l.id);
end $$;

create or replace function public.lg_submit_score(p_day date, p_score integer)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid();
begin
  if p_day is null or p_day < lg_today() - 1 or p_day > lg_today() then raise exception 'Score is for the wrong day'; end if;
  if p_score is null or p_score < 0 or p_score > 500 then raise exception 'Invalid score'; end if;
  insert into player_scores (user_id, day, score) values (uid, p_day, p_score)
  on conflict (user_id, day) do nothing;   -- first score of the day counts, no re-submits
end $$;

create or replace function public.lg_league_board(p_league uuid)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); t date := lg_today(); wk date := date_trunc('week', lg_today())::date; l leagues; rows json;
begin
  if not exists (select 1 from league_members where league_id = p_league and user_id = uid) then
    raise exception 'You are not in this league';
  end if;
  select * into l from leagues where id = p_league;
  select coalesce(json_agg(r order by r.today_score desc nulls last, r.week_total desc, r.nickname), '[]'::json) into rows from (
    select p.nickname, (m.user_id = uid) as me,
           (select s.score from player_scores s where s.user_id = m.user_id and s.day = t) as today_score,
           coalesce((select sum(s.score) from player_scores s where s.user_id = m.user_id and s.day between wk and t), 0) as week_total,
           (select count(*) from player_scores s where s.user_id = m.user_id and s.day between wk and t) as week_played
    from league_members m join player_profiles p on p.user_id = m.user_id
    where m.league_id = p_league) r;
  return json_build_object('id', l.id, 'name', l.name, 'code', l.code, 'today', t, 'week_start', wk, 'rows', rows);
end $$;

-- ── Permissions: only signed-in players may call the functions ────────────────
do $$ declare f text; begin
  foreach f in array array[
    'lg_today()', 'lg_uid()', 'lg_clean(text)', 'lg_max_leagues()',
    'lg_save_profile(text, boolean)', 'lg_me()', 'lg_create_league(text)', 'lg_league_preview(text)',
    'lg_join_league(text)', 'lg_leave_league(uuid)', 'lg_submit_score(date, integer)', 'lg_league_board(uuid)']
  loop execute format('revoke all on function public.%s from public, anon', f); end loop;
  foreach f in array array[
    'lg_save_profile(text, boolean)', 'lg_me()', 'lg_create_league(text)', 'lg_league_preview(text)',
    'lg_join_league(text)', 'lg_leave_league(uuid)', 'lg_submit_score(date, integer)', 'lg_league_board(uuid)']
  loop execute format('grant execute on function public.%s to authenticated', f); end loop;
end $$;
