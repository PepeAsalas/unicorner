-- Changing your nickname: allowed once every 7 days (changing only capital letters is always fine).
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once. Needs leagues.sql.

alter table public.player_profiles add column if not exists nick_changed_at timestamptz;

-- the same checks as when you first pick a nickname
create or replace function public.lg_nick_check(nick text, uid uuid)
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if char_length(nick) < 2 or char_length(nick) > 16 then raise exception 'Nickname must be 2–16 characters'; end if;
  if nick !~ '^[[:alnum:] _.''-]+$' then raise exception 'Nickname can only use letters, numbers, spaces and . _ -'; end if;
  if lower(regexp_replace(nick, '[^[:alnum:]]', '', 'g')) ~ '(fuck|shit|cunt|nigg|fagg|hitler|nazi|rape|whore|slut|retard|pedo|kkk)' then
    raise exception 'Pick a different nickname';
  end if;
  if exists (select 1 from player_profiles where lower(nickname) = lower(nick) and user_id <> uid) then
    raise exception 'That nickname is taken' using errcode = '23505';
  end if;
end $$;
revoke all on function public.lg_nick_check(text, uuid) from public, anon, authenticated;

-- when may this player change again (null = now)
create or replace function public.lg_nick_next(uid uuid)
returns timestamptz language sql stable security definer set search_path = public as $$
  select case when nick_changed_at > now() - interval '7 days' then nick_changed_at + interval '7 days' end
    from player_profiles where user_id = uid
$$;
revoke all on function public.lg_nick_next(uuid) from public, anon, authenticated;

create or replace function public.lg_nick_status()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('nickname', nickname, 'next_change', lg_nick_next(user_id)) from player_profiles where user_id = auth.uid()
$$;

-- change only the nickname (the newsletter choice and everything else stay as they are)
create or replace function public.lg_rename(p_nickname text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); nick text := lg_clean(p_nickname); old text; nxt timestamptz;
begin
  select nickname into old from player_profiles where user_id = uid;
  if old is null then raise exception 'Pick a nickname first'; end if;
  perform lg_nick_check(nick, uid);
  if nick = old then return json_build_object('nickname', nick, 'next_change', lg_nick_next(uid)); end if;
  if lower(nick) <> lower(old) then
    nxt := lg_nick_next(uid);
    if nxt is not null then raise exception 'You can change your nickname again on %', to_char(nxt at time zone 'Europe/Amsterdam', 'DD Mon'); end if;
    update player_profiles set nickname = nick, nick_changed_at = now(), updated_at = now() where user_id = uid;
  else
    update player_profiles set nickname = nick, updated_at = now() where user_id = uid;   -- only capitals changed
  end if;
  return json_build_object('nickname', nick, 'next_change', lg_nick_next(uid));
end $$;

-- the old profile form follows the same 7-day rule
create or replace function public.lg_save_profile(p_nickname text, p_news_opt_out boolean)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); nick text := lg_clean(p_nickname); old text; nxt timestamptz;
begin
  perform lg_nick_check(nick, uid);
  select nickname into old from player_profiles where user_id = uid;
  if old is not null and lower(old) <> lower(nick) then
    nxt := lg_nick_next(uid);
    if nxt is not null then raise exception 'You can change your nickname again on %', to_char(nxt at time zone 'Europe/Amsterdam', 'DD Mon'); end if;
  end if;
  insert into player_profiles (user_id, nickname, email, news_opt_out)
  values (uid, nick, auth.jwt() ->> 'email', coalesce(p_news_opt_out, false))
  on conflict (user_id) do update
    set nickname = excluded.nickname, news_opt_out = excluded.news_opt_out,
        email = coalesce(excluded.email, player_profiles.email), updated_at = now(),
        nick_changed_at = case when lower(player_profiles.nickname) <> lower(excluded.nickname) then now() else player_profiles.nick_changed_at end;
  return json_build_object('nickname', nick, 'news_opt_out', coalesce(p_news_opt_out, false));
end $$;

revoke all on function public.lg_nick_status(), public.lg_rename(text) from public, anon;
grant execute on function public.lg_nick_status(), public.lg_rename(text), public.lg_save_profile(text, boolean) to authenticated;
