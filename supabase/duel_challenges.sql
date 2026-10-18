-- Duel challenges + inbox. Run once, after duels.sql and duels_accounts.sql. Safe to run more than once.
-- A signed-in player can challenge another leaderboard player by nickname. The challenge waits in the other
-- player's inbox; they accept (and play) or decline. Challenges not accepted within 3 days expire.
-- Players can switch challenges off. No emails: everything shows on the site.

alter table public.duels add column if not exists challenged_user uuid;
alter table public.duels add column if not exists declined_at timestamptz;
alter table public.player_profiles add column if not exists duel_challenges_off boolean not null default false;
create index if not exists duels_challenged_idx on public.duels (challenged_user);

-- challenge a player by nickname: returns the duel code
create or replace function public.duel_challenge(p_token text, p_name text, p_kit text, p_qset jsonb, p_nick text)
returns text language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_them uuid; v_off boolean; v_code text; v_id uuid;
begin
  if v_me is null then raise exception 'sign in to challenge players'; end if;
  select user_id, duel_challenges_off into v_them, v_off from player_profiles where lower(nickname) = lower(trim(p_nick));
  if v_them is null then raise exception 'player not found'; end if;
  if v_them = v_me then raise exception 'you cannot duel yourself'; end if;
  if v_off then raise exception 'this player is not taking challenges'; end if;
  -- one open duel per pair: a pending challenge, or a duel nobody has won yet
  if exists (
    select 1 from duels d
      join duel_players a on a.duel_id = d.id and a.slot = 1
      left join duel_players b on b.duel_id = d.id and b.slot = 2
     where d.declined_at is null
       and ((a.user_id = v_me and (b.user_id = v_them or d.challenged_user = v_them))
         or (a.user_id = v_them and (b.user_id = v_me or d.challenged_user = v_me)))
       and (b.duel_id is null and d.created_at > now() - interval '3 days'
            or b.duel_id is not null and not duel_over(duel_hp(a.picks, b.picks, least(jsonb_array_length(a.picks), jsonb_array_length(b.picks))),
                                                         least(jsonb_array_length(a.picks), jsonb_array_length(b.picks)))))
  then raise exception 'you already have a duel with this player'; end if;
  v_code := duel_create(p_token, p_name, p_kit, p_qset);
  update duels set challenged_user = v_them where code = v_code;
  return v_code;
end $$;

-- joining: a challenge can only be accepted by the player it was sent to, within 3 days
create or replace function public.duel_join(p_code text, p_token text, p_name text, p_kit text)
returns smallint language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_slot smallint; v_to uuid; v_at timestamptz; v_dec timestamptz;
begin
  if length(coalesce(p_token, '')) < 16 then raise exception 'bad token'; end if;
  select id, challenged_user, created_at, declined_at into v_id, v_to, v_at, v_dec from duels where code = upper(p_code);
  if v_id is null then raise exception 'duel not found'; end if;
  select slot into v_slot from duel_players where duel_id = v_id and token_hash = md5(p_token);
  if v_slot is not null then return v_slot; end if;
  if exists (select 1 from duel_players where duel_id = v_id and slot = 2) then raise exception 'duel is full'; end if;
  if auth.uid() is not null and exists (select 1 from duel_players where duel_id = v_id and user_id = auth.uid()) then raise exception 'you cannot duel yourself'; end if;
  if v_to is not null then
    if auth.uid() is distinct from v_to then raise exception 'this challenge is for someone else'; end if;
    if v_dec is not null then raise exception 'challenge declined'; end if;
    if v_at < now() - interval '3 days' then raise exception 'challenge expired'; end if;
  end if;
  insert into duel_players (duel_id, slot, token_hash, name, kit, picks, user_id)
    values (v_id, 2, md5(p_token), left(coalesce(nullif(trim(p_name), ''), 'Player 2'), 16), left(p_kit, 24), '[]', auth.uid());
  return 2;
end $$;

create or replace function public.duel_decline(p_code text)
returns void language sql security definer set search_path = public as $$
  update duels d set declined_at = now()
   where d.code = upper(p_code) and d.challenged_user = auth.uid() and d.declined_at is null
     and not exists (select 1 from duel_players where duel_id = d.id and slot = 2)
$$;

create or replace function public.duel_challenges_set(p_off boolean)
returns void language sql security definer set search_path = public as $$
  update player_profiles set duel_challenges_off = p_off where user_id = auth.uid()
$$;

-- the inbox: every duel you're in (or were challenged to) in the last 30 days, newest first
-- state: challenge (sent to you) | sent (waiting for them to accept) | your_turn | their_turn | won | lost | draw | declined | expired
create or replace function public.duel_inbox()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_me uuid := auth.uid(); r record; out jsonb := '[]'; st text; n int; h int[]; mine int; theirs int; ma jsonb; mb jsonb; ms int; opp text;
begin
  if v_me is null then return jsonb_build_object('items', '[]'::jsonb, 'off', false); end if;
  for r in
    select d.id, d.code, d.created_at, d.challenged_user, d.declined_at,
           a.user_id ua, a.name na, a.picks pa, b.user_id ub, b.name nb, b.picks pb, (b.duel_id is not null) joined,
           greatest(d.created_at, a.rounds_at, b.rounds_at) touched
      from duels d
      join duel_players a on a.duel_id = d.id and a.slot = 1
      left join duel_players b on b.duel_id = d.id and b.slot = 2
     where (a.user_id = v_me or b.user_id = v_me or d.challenged_user = v_me)
       and d.created_at > now() - interval '30 days'
     order by greatest(d.created_at, a.rounds_at, b.rounds_at) desc
     limit 40
  loop
    if r.ua = v_me then ms := 1; ma := r.pa; mb := r.pb; opp := coalesce(r.nb, (select nickname from player_profiles where user_id = r.challenged_user));
    else ms := 2; ma := r.pb; mb := r.pa; opp := r.na; end if;
    if not r.joined then
      st := case when r.declined_at is not null then 'declined'
                 when r.created_at < now() - interval '3 days' then 'expired'
                 when ms = 1 then 'sent' else 'challenge' end;
      if ms = 1 and r.challenged_user is null then continue; end if;   -- link duel nobody joined yet: not inbox material
    else
      n := least(jsonb_array_length(r.pa), jsonb_array_length(r.pb));
      h := duel_hp(r.pa, r.pb, n);
      if duel_over(h, n) then
        mine := h[ms]; theirs := h[3 - ms];
        st := case when mine > theirs then 'won' when mine = theirs then 'draw' else 'lost' end;
      elsif jsonb_array_length(ma) > jsonb_array_length(mb) then st := 'their_turn';
      else st := 'your_turn'; end if;
    end if;
    out := out || jsonb_build_object('code', r.code, 'opp', coalesce(opp, 'A mate'), 'state', st, 'at', r.touched,
                                     'played', coalesce(jsonb_array_length(ma), 0));
  end loop;
  return jsonb_build_object('items', out, 'off', coalesce((select duel_challenges_off from player_profiles where user_id = v_me), false));
end $$;

-- duel_get also says who a challenge is for, so the page can explain it
create or replace function public.duel_get(p_code text, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_q jsonb; v_me smallint; a jsonb; b jsonb; v_shared int; v_hp int[]; v_to uuid; v_dec timestamptz; v_at timestamptz;
begin
  select id, qset, challenged_user, declined_at, created_at into v_id, v_q, v_to, v_dec, v_at from duels where code = upper(p_code);
  if v_id is null then return null; end if;
  select slot into v_me from duel_players where duel_id = v_id and token_hash = md5(coalesce(p_token, ''));
  if v_me is null and auth.uid() is not null then
    select slot into v_me from duel_players where duel_id = v_id and user_id = auth.uid();   -- same account, another device
  end if;
  if v_me is not null and auth.uid() is not null then
    update duel_players set user_id = auth.uid() where duel_id = v_id and slot = v_me and user_id is null;
  end if;
  select picks into a from duel_players where duel_id = v_id and slot = 1;
  select picks into b from duel_players where duel_id = v_id and slot = 2;
  v_shared := least(jsonb_array_length(a), coalesce(jsonb_array_length(b), 0));
  v_hp := duel_hp(a, coalesce(b, '[]'), v_shared);
  return jsonb_build_object(
    'code', upper(p_code), 'qset', v_q, 'me', v_me, 'shared', v_shared,
    'hp', to_jsonb(v_hp), 'over', b is not null and duel_over(v_hp, v_shared),
    'challenge', v_to is not null, 'for_me', v_to is not null and v_to = auth.uid(),
    'for_nick', (select nickname from player_profiles where user_id = v_to),
    'declined', v_dec is not null, 'expired', v_to is not null and b is null and v_at < now() - interval '3 days',
    'players', (select coalesce(jsonb_agg(jsonb_build_object(
        'slot', slot, 'name', name, 'kit', kit, 'played', jsonb_array_length(picks),
        'rec', case when user_id is not null then duel_record_k(user_id, null) else duel_record_k(null, token_hash) end,
        'picks', case when slot = v_me then picks
                      else (select coalesce(jsonb_agg(e order by i), '[]') from jsonb_array_elements(picks) with ordinality t(e, i) where i <= v_shared) end
        ) order by slot), '[]'::jsonb)
      from duel_players where duel_id = v_id));
end $$;

-- submitting works from any device you're signed in on
create or replace function public.duel_submit(p_code text, p_token text, p_picks jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_slot smallint; v_mine jsonb; v_rival jsonb; n_me int; n_rv int; v_need int; v_shared int; x jsonb; v_score int := 0;
begin
  select id into v_id from duels where code = upper(p_code);
  if v_id is null then raise exception 'duel not found'; end if;
  select slot, picks into v_slot, v_mine from duel_players where duel_id = v_id
     and (token_hash = md5(p_token) or (auth.uid() is not null and user_id = auth.uid())) order by (token_hash = md5(p_token)) desc limit 1 for update;
  if v_slot is null then raise exception 'not in this duel'; end if;
  select picks into v_rival from duel_players where duel_id = v_id and slot <> v_slot;
  n_me := jsonb_array_length(v_mine); n_rv := coalesce(jsonb_array_length(v_rival), 0);
  if n_me > n_rv then raise exception 'already played this round'; end if;
  v_shared := least(n_me, n_rv);
  if v_rival is not null and duel_over(duel_hp(v_mine, v_rival, v_shared), v_shared) then raise exception 'duel is over'; end if;
  v_need := case when n_me < 15 then 5 else 1 end;
  if jsonb_typeof(p_picks) <> 'array' or jsonb_array_length(p_picks) <> v_need then raise exception 'need % picks', v_need; end if;
  for x in select * from jsonb_array_elements(p_picks) loop
    if (x->>1)::int not in (0, 10, 30, 60, 85, 100) then raise exception 'bad points'; end if;
  end loop;
  v_mine := v_mine || p_picks;
  select coalesce(sum((e->>1)::int), 0) into v_score from jsonb_array_elements(v_mine) e;
  update duel_players set picks = v_mine, score = v_score, rounds_at = now() where duel_id = v_id and slot = v_slot;
end $$;

grant execute on function public.duel_challenge(text, text, text, jsonb, text) to authenticated;
grant execute on function public.duel_decline(text) to authenticated;
grant execute on function public.duel_challenges_set(boolean) to authenticated;
grant execute on function public.duel_inbox() to anon, authenticated;
grant execute on function public.duel_join(text, text, text, text) to anon, authenticated;
grant execute on function public.duel_get(text, text) to anon, authenticated;
