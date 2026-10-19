-- 24-hour clock for duels:
--  * a duel nobody accepted closes after 24 hours (links too, not only challenges)
--  * once both are in, whoever owes a round has 24 hours to play it, or loses; if both owe and neither plays, HP decides
-- duel_outcome is the one place that decides whether a duel is over and who lost; everything else asks it.

-- returns null while the duel is still on, else {"loser": 1|2|0 (0 = draw), "how": "ko"|"gave_up"|"timeout"}
create or replace function public.duel_outcome(p_sur smallint, pa jsonb, ra timestamptz, ja timestamptz, pb jsonb, rb timestamptz, jb timestamptz)
returns jsonb language plpgsql stable set search_path = public as $$
declare n int; h int[]; na int; nb int;
begin
  if pb is null then return null; end if;
  if p_sur is not null then return jsonb_build_object('loser', p_sur, 'how', 'gave_up'); end if;
  na := jsonb_array_length(pa); nb := jsonb_array_length(pb); n := least(na, nb);
  h := duel_hp(pa, pb, n);
  if duel_over(h, n) then
    return jsonb_build_object('loser', case when h[1] > h[2] then 2 when h[1] < h[2] then 1 else 0 end, 'how', 'ko');
  end if;
  if now() < greatest(ra, rb, ja, jb) + interval '24 hours' then return null; end if;
  if na > nb then return jsonb_build_object('loser', 2, 'how', 'timeout'); end if;
  if nb > na then return jsonb_build_object('loser', 1, 'how', 'timeout'); end if;
  return jsonb_build_object('loser', case when h[1] > h[2] then 2 when h[1] < h[2] then 1 else 0 end, 'how', 'timeout');
end $$;

-- no more rounds once the duel is decided (gave up or out of time)
create or replace function public.duel_no_play_after_surrender()
returns trigger language plpgsql as $$
declare a record; b record; s smallint;
begin
  if new.picks is distinct from old.picks then
    select surrendered into s from duels where id = new.duel_id;
    select picks, rounds_at, joined_at into a from duel_players where duel_id = new.duel_id and slot = 1;
    select picks, rounds_at, joined_at into b from duel_players where duel_id = new.duel_id and slot = 2;
    if b.picks is not null and duel_outcome(s, a.picks, a.rounds_at, a.joined_at, b.picks, b.rounds_at, b.joined_at) is not null then
      raise exception 'duel is over';
    end if;
  end if;
  return new;
end $$;

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
       and (b.duel_id is null and d.created_at > now() - interval '24 hours'
            or b.duel_id is not null and duel_outcome(d.surrendered, a.picks, a.rounds_at, a.joined_at, b.picks, b.rounds_at, b.joined_at) is null))
  then raise exception 'you already have a duel with this player'; end if;
  v_code := duel_create(p_token, p_name, p_kit, p_qset);
  update duels set challenged_user = v_them where code = v_code;
  return v_code;
end $$;

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
  end if;
  if v_at < now() - interval '24 hours' then raise exception 'duel expired'; end if;
  insert into duel_players (duel_id, slot, token_hash, name, kit, picks, user_id)
    values (v_id, 2, md5(p_token), left(coalesce(nullif(trim(p_name), ''), 'Player 2'), 16), left(p_kit, 24), '[]', auth.uid());
  return 2;
end $$;

create or replace function public.duel_inbox()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_me uuid := auth.uid(); r record; out jsonb := '[]'; st text; n int; h int[]; mine int; theirs int; ma jsonb; mb jsonb; ms int; opp text; fresh boolean; oc jsonb; dl timestamptz; owes smallint;
begin
  if v_me is null then return jsonb_build_object('items', '[]'::jsonb, 'off', false); end if;
  for r in
    select d.id, d.code, d.created_at, d.challenged_user, d.declined_at, d.surrendered,
           a.user_id ua, a.name na, a.picks pa, a.result_seen sa, a.rounds_at ra, a.joined_at ja, b.user_id ub, b.name nb, b.picks pb, b.result_seen sb, b.rounds_at rb, b.joined_at jb, (b.duel_id is not null) joined,
           greatest(d.created_at, a.rounds_at, b.rounds_at) touched
      from duels d
      join duel_players a on a.duel_id = d.id and a.slot = 1
      left join duel_players b on b.duel_id = d.id and b.slot = 2
     where (a.user_id = v_me or b.user_id = v_me or d.challenged_user = v_me)
       and d.created_at > now() - interval '30 days'
       and not exists (select 1 from duel_hidden x where x.user_id = v_me and x.duel_id = d.id)
     order by greatest(d.created_at, a.rounds_at, b.rounds_at) desc
     limit 40
  loop
    if r.ua = v_me then ms := 1; ma := r.pa; mb := r.pb; opp := coalesce(r.nb, (select nickname from player_profiles where user_id = r.challenged_user));
    else ms := 2; ma := r.pb; mb := r.pa; opp := r.na; end if;
    fresh := false; oc := null; dl := null;
    if not r.joined then
      st := case when r.declined_at is not null then 'declined'
                 when r.created_at < now() - interval '24 hours' then 'expired'
                 when ms = 1 then 'sent' else 'challenge' end;
    else
      oc := duel_outcome(r.surrendered, r.pa, r.ra, r.ja, r.pb, r.rb, r.jb);
      if oc is not null then
        st := case when (oc->>'loser')::int = 0 then 'draw' when (oc->>'loser')::int = ms then 'lost' else 'won' end;
        fresh := not coalesce(case when ms = 1 then r.sa else r.sb end, true);
      else
        dl := greatest(r.ra, r.rb, r.ja, r.jb) + interval '24 hours';
        owes := case when jsonb_array_length(r.pa) > jsonb_array_length(r.pb) then 2 when jsonb_array_length(r.pb) > jsonb_array_length(r.pa) then 1 else 0 end;
        st := case when owes = 0 or owes = ms then 'your_turn' else 'their_turn' end;
      end if;
    end if;
    out := out || jsonb_build_object('code', r.code, 'opp', coalesce(opp, 'A mate'), 'state', st, 'at', r.touched,
                                     'played', coalesce(jsonb_array_length(ma), 0),
                                     'fresh', fresh,
                                     'gave_up', case when r.surrendered is null then null when r.surrendered = ms then 'you' else 'them' end,
                                     'how', oc->>'how', 'deadline', dl);
  end loop;
  return jsonb_build_object('items', out, 'off', coalesce((select duel_challenges_off from player_profiles where user_id = v_me), false));
end $$;

create or replace function public.duel_get(p_code text, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_q jsonb; v_me smallint; a jsonb; b jsonb; v_shared int; v_hp int[]; v_to uuid; v_dec timestamptz; v_at timestamptz; v_sur smallint; oc jsonb; ra timestamptz; ja timestamptz; rb timestamptz; jb timestamptz;
begin
  select id, qset, challenged_user, declined_at, created_at, surrendered into v_id, v_q, v_to, v_dec, v_at, v_sur from duels where code = upper(p_code);
  if v_id is null then return null; end if;
  select slot into v_me from duel_players where duel_id = v_id and token_hash = md5(coalesce(p_token, ''));
  if v_me is null and auth.uid() is not null then
    select slot into v_me from duel_players where duel_id = v_id and user_id = auth.uid();   -- same account, another device
  end if;
  if v_me is not null and auth.uid() is not null then
    update duel_players set user_id = auth.uid() where duel_id = v_id and slot = v_me and user_id is null;
  end if;
  select picks, rounds_at, joined_at into a, ra, ja from duel_players where duel_id = v_id and slot = 1;
  select picks, rounds_at, joined_at into b, rb, jb from duel_players where duel_id = v_id and slot = 2;
  oc := case when b is null then null else duel_outcome(v_sur, a, ra, ja, b, rb, jb) end;
  v_shared := least(jsonb_array_length(a), coalesce(jsonb_array_length(b), 0));
  v_hp := duel_hp(a, coalesce(b, '[]'), v_shared);
  return jsonb_build_object(
    'code', upper(p_code), 'qset', v_q, 'me', v_me, 'shared', v_shared,
    'hp', to_jsonb(v_hp), 'over', oc is not null, 'surrendered', v_sur, 'outcome', oc,
    'deadline', case when b is not null and oc is null then greatest(ra, rb, ja, jb) + interval '24 hours' end,
    'challenge', v_to is not null, 'for_me', v_to is not null and v_to = auth.uid(),
    'for_nick', (select nickname from player_profiles where user_id = v_to),
    'declined', v_dec is not null, 'expired', b is null and v_at < now() - interval '24 hours',
    'players', (select coalesce(jsonb_agg(jsonb_build_object(
        'slot', slot, 'name', name, 'kit', kit, 'played', jsonb_array_length(picks),
        'rec', case when user_id is not null then duel_record_k(user_id, null) else duel_record_k(null, token_hash) end,
        'picks', case when slot = v_me then picks
                      else (select coalesce(jsonb_agg(e order by i), '[]') from jsonb_array_elements(picks) with ordinality t(e, i) where i <= v_shared) end
        ) order by slot), '[]'::jsonb)
      from duel_players where duel_id = v_id));
end $$;

create or replace function public.duel_record_k(p_user uuid, p_hash text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r record; v_w int := 0; v_d int := 0; v_l int := 0;
begin
  for r in select distinct on (me.duel_id) me.slot, duel_outcome(d.surrendered, a.picks, a.rounds_at, a.joined_at, b.picks, b.rounds_at, b.joined_at) oc from duel_players me
             join duels d on d.id = me.duel_id
             join duel_players a on a.duel_id = me.duel_id and a.slot = 1
             join duel_players b on b.duel_id = me.duel_id and b.slot = 2
            where (p_user is not null and me.user_id = p_user) or (p_hash is not null and me.token_hash = p_hash)
            order by me.duel_id loop
    continue when r.oc is null;
    if (r.oc->>'loser')::int = 0 then v_d := v_d + 1; elsif (r.oc->>'loser')::int = r.slot then v_l := v_l + 1; else v_w := v_w + 1; end if;
  end loop;
  return jsonb_build_object('w', v_w, 'd', v_d, 'l', v_l);
end $$;

create or replace function public.duel_remove(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_id uuid; v_to uuid; v_sur smallint; v_slot smallint; a jsonb; b jsonb; ra timestamptz; ja timestamptz; rb timestamptz; jb timestamptz; did text := 'hidden';
begin
  if v_me is null then raise exception 'sign in first'; end if;
  select id, challenged_user, surrendered into v_id, v_to, v_sur from duels where code = upper(p_code) for update;
  if v_id is null then raise exception 'duel not found'; end if;
  select slot into v_slot from duel_players where duel_id = v_id and user_id = v_me;
  if v_slot is null and v_to is distinct from v_me then raise exception 'not your duel'; end if;
  select picks, rounds_at, joined_at into a, ra, ja from duel_players where duel_id = v_id and slot = 1;
  select picks, rounds_at, joined_at into b, rb, jb from duel_players where duel_id = v_id and slot = 2;
  if v_slot is not null and b is not null and v_sur is null then
    if duel_outcome(null, a, ra, ja, b, rb, jb) is null then
      update duels set surrendered = v_slot where id = v_id; did := 'surrendered';
    end if;
  elsif v_slot is null and b is null then
    update duels set declined_at = coalesce(declined_at, now()) where id = v_id; did := 'declined';
  end if;
  insert into duel_hidden (user_id, duel_id) values (v_me, v_id) on conflict do nothing;
  return did;
end $$;

revoke all on function public.duel_outcome(smallint, jsonb, timestamptz, timestamptz, jsonb, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.duel_no_play_after_surrender() from public, anon, authenticated;
revoke all on function public.duel_record_k(uuid, text) from public, anon, authenticated;
revoke all on function public.duel_challenge(text, text, text, jsonb, text) from public, anon;
grant execute on function public.duel_challenge(text, text, text, jsonb, text) to authenticated;
revoke all on function public.duel_remove(text) from public, anon;
grant execute on function public.duel_remove(text) to authenticated;
grant execute on function public.duel_join(text, text, text, text) to anon, authenticated;
grant execute on function public.duel_get(text, text) to anon, authenticated;
grant execute on function public.duel_inbox() to anon, authenticated;
