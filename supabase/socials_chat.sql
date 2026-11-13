-- Socials: friend request notifications + the global chat (with moderation).
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.
-- Needs squad.sql (friends), leagues.sql (player_profiles) and crew_kit.sql (the crew list, who are also the chat moderators).
--
-- Chat rules (enforced here, not in the browser):
--   * reading is open to everyone; writing needs a signed-in player with a nickname
--   * no word filter; 1-280 characters; one message every 3 seconds; the same text twice in 30 seconds is refused
--   * Report: 3 different players reporting a message hides it for everyone (a moderator's report hides it at once)
--   * Block: you stop seeing that player's messages
--   * moderators (anyone on the crew list) can delete any message and mute a player for some hours or for good
--   * everyone can delete their own messages; messages older than 30 days are cleaned up

-- ── friend requests ──
alter table public.friend_requests add column if not exists push_sent_at timestamptz;

-- requests waiting for me, newest first, with who sent them (for the pop-up and the badge)
create or replace function public.sq_inbox()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then '[]'::jsonb else coalesce((
    select jsonb_agg(jsonb_build_object('nick', p.nickname, 'kit', coalesce(p.kit, 'classic'), 'at', r.created_at) order by r.created_at desc)
      from friend_requests r join player_profiles p on p.user_id = r.from_user
     where r.to_user = auth.uid()), '[]'::jsonb) end
$$;
revoke all on function public.sq_inbox() from public, anon;
grant execute on function public.sq_inbox() to authenticated;

-- ── chat tables ──
create table if not exists public.chat_messages (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now(),
  hidden     boolean not null default false,
  hidden_by  text,
  hidden_at  timestamptz
);
create index if not exists chat_messages_user on public.chat_messages (user_id, created_at desc);
create index if not exists chat_messages_hidden_at on public.chat_messages (hidden_at) where hidden;

create table if not exists public.chat_reports (
  message_id bigint not null references public.chat_messages(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
create table if not exists public.chat_blocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked uuid not null references auth.users(id) on delete cascade,
  primary key (user_id, blocked)
);
create table if not exists public.chat_bans (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  until      timestamptz not null,
  by_user    uuid,
  created_at timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
alter table public.chat_reports  enable row level security;
alter table public.chat_blocks   enable row level security;
alter table public.chat_bans     enable row level security;
revoke all on public.chat_messages, public.chat_reports, public.chat_blocks, public.chat_bans from anon, authenticated;

create or replace function public.chat_is_mod(u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select u is not null and coalesce(lg_is_crew(u), false)
$$;
revoke all on function public.chat_is_mod(uuid) from public, anon, authenticated;

-- one message as the browser sees it
create or replace function public.chat_row(m public.chat_messages, viewer uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', m.id, 'nick', p.nickname, 'kit', coalesce(p.kit, 'classic'), 'body', m.body, 'at', m.created_at,
                            'mine', viewer is not null and m.user_id = viewer, 'mod', chat_is_mod(m.user_id))
    from player_profiles p where p.user_id = m.user_id
$$;
revoke all on function public.chat_row(public.chat_messages, uuid) from public, anon, authenticated;

-- the last 60 messages (or 60 before p_before), oldest first, plus who I am in the chat
create or replace function public.chat_recent(p_before bigint default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(r order by (r->>'id')::bigint) from (
        select chat_row(m, auth.uid()) r from chat_messages m
         where not m.hidden and (p_before is null or m.id < p_before)
           and not exists (select 1 from chat_blocks b where b.user_id = auth.uid() and b.blocked = m.user_id)
         order by m.id desc limit 60) x where r is not null), '[]'::jsonb),
    'me', case when auth.uid() is null then null else jsonb_build_object(
        'nick', (select nickname from player_profiles where user_id = auth.uid()),
        'mod', chat_is_mod(auth.uid()),
        'muted_until', (select until from chat_bans where user_id = auth.uid() and until > now())) end)
$$;

-- what's new since message p_after, and which messages were taken down in the last 10 minutes
create or replace function public.chat_since(p_after bigint)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(r order by (r->>'id')::bigint) from (
        select chat_row(m, auth.uid()) r from chat_messages m
         where m.id > coalesce(p_after, 0) and not m.hidden
           and not exists (select 1 from chat_blocks b where b.user_id = auth.uid() and b.blocked = m.user_id)
         order by m.id limit 100) x where r is not null), '[]'::jsonb),
    'gone', coalesce((select jsonb_agg(id) from chat_messages where hidden and hidden_at > now() - interval '10 minutes'), '[]'::jsonb))
$$;
revoke all on function public.chat_recent(bigint), public.chat_since(bigint) from public;
grant execute on function public.chat_recent(bigint), public.chat_since(bigint) to anon, authenticated;

create or replace function public.chat_send(p_body text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare uid uuid := sq_need_profile(); b text := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g')); m chat_messages; mu timestamptz;
begin
  select until into mu from chat_bans where user_id = uid and until > now();
  if mu is not null then raise exception 'You are muted in the chat until %', to_char(mu at time zone 'Europe/Amsterdam', 'DD Mon HH24:MI'); end if;
  if char_length(b) < 1 then raise exception 'Write something first'; end if;
  if char_length(b) > 280 then raise exception 'Keep it under 280 characters'; end if;
  if exists (select 1 from chat_messages where user_id = uid and created_at > now() - interval '3 seconds') then
    raise exception 'Slow down a little'; end if;
  if exists (select 1 from chat_messages where user_id = uid and body = b and created_at > now() - interval '30 seconds') then
    raise exception 'You just sent that'; end if;
  insert into chat_messages (user_id, body) values (uid, b) returning * into m;
  if m.id % 200 = 0 then delete from chat_messages where created_at < now() - interval '30 days'; end if;
  return chat_row(m, uid);
end $$;

create or replace function public.chat_report(p_id bigint)
returns text language plpgsql volatile security definer set search_path = public as $$
declare uid uuid := sq_need_profile(); owner uuid; n int;
begin
  select user_id into owner from chat_messages where id = p_id and not hidden;
  if owner is null then return 'gone'; end if;
  if owner = uid then raise exception 'That is your own message'; end if;
  insert into chat_reports (message_id, user_id) values (p_id, uid) on conflict do nothing;
  select count(*) into n from chat_reports where message_id = p_id;
  if n >= 3 or chat_is_mod(uid) then
    update chat_messages set hidden = true, hidden_by = case when chat_is_mod(uid) then 'mod' else 'reports' end, hidden_at = now() where id = p_id;
    return 'hidden';
  end if;
  return 'reported';
end $$;

-- delete: your own message, or any message if you're a moderator
create or replace function public.chat_delete(p_id bigint)
returns text language plpgsql volatile security definer set search_path = public as $$
declare uid uuid := sq_need_profile(); owner uuid;
begin
  select user_id into owner from chat_messages where id = p_id;
  if owner is null then return 'gone'; end if;
  if owner <> uid and not chat_is_mod(uid) then raise exception 'Only moderators can delete other messages'; end if;
  update chat_messages set hidden = true, hidden_by = case when owner = uid then 'author' else 'mod' end, hidden_at = now() where id = p_id;
  return 'deleted';
end $$;

create or replace function public.chat_block(p_nick text, p_on boolean default true)
returns text language plpgsql volatile security definer set search_path = public as $$
declare uid uuid := sq_need_profile(); them uuid := sq_user(p_nick);
begin
  if them is null then raise exception 'Player not found'; end if;
  if them = uid then raise exception 'That is you'; end if;
  if p_on then insert into chat_blocks (user_id, blocked) values (uid, them) on conflict do nothing; return 'blocked'; end if;
  delete from chat_blocks where user_id = uid and blocked = them; return 'unblocked';
end $$;

-- moderators: mute a player for p_hours (0 = lift it, 9999 = for good) and take down their last day of messages
create or replace function public.chat_mute(p_nick text, p_hours int)
returns text language plpgsql volatile security definer set search_path = public as $$
declare uid uuid := sq_need_profile(); them uuid := sq_user(p_nick);
begin
  if not chat_is_mod(uid) then raise exception 'Only moderators can do that'; end if;
  if them is null then raise exception 'Player not found'; end if;
  if chat_is_mod(them) then raise exception 'Moderators cannot be muted'; end if;
  if coalesce(p_hours, 0) <= 0 then delete from chat_bans where user_id = them; return 'unmuted'; end if;
  insert into chat_bans (user_id, until, by_user) values (them, now() + make_interval(hours => least(p_hours, 87600)), uid)
    on conflict (user_id) do update set until = excluded.until, by_user = excluded.by_user, created_at = now();
  update chat_messages set hidden = true, hidden_by = 'mod', hidden_at = now()
   where user_id = them and not hidden and created_at > now() - interval '1 day';
  return 'muted';
end $$;

revoke all on function public.chat_send(text), public.chat_report(bigint), public.chat_delete(bigint),
  public.chat_block(text, boolean), public.chat_mute(text, int) from public, anon;
grant execute on function public.chat_send(text), public.chat_report(bigint), public.chat_delete(bigint),
  public.chat_block(text, boolean), public.chat_mute(text, int) to authenticated;
