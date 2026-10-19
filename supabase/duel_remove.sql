-- duels you can remove from your inbox (surrender if it's still going) + finished ones counted when someone gives up
alter table duels add column if not exists surrendered smallint;   -- slot that gave up

create table if not exists duel_hidden (
  user_id uuid not null,
  duel_id uuid not null references duels(id) on delete cascade,
  primary key (user_id, duel_id)
);
alter table duel_hidden enable row level security;   -- only reached through the functions below

-- no more rounds once someone gave up
create or replace function public.duel_no_play_after_surrender()
returns trigger language plpgsql as $$
begin
  if new.picks is distinct from old.picks and exists (select 1 from duels where id = new.duel_id and surrendered is not null) then
    raise exception 'duel is over';
  end if;
  return new;
end $$;
drop trigger if exists duel_no_play_after_surrender on duel_players;
create trigger duel_no_play_after_surrender before update on duel_players
  for each row execute function public.duel_no_play_after_surrender();

-- remove a duel from your inbox: gives up if it's still going, says no if it's a challenge to you
create or replace function public.duel_remove(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_id uuid; v_to uuid; v_sur smallint; v_slot smallint; a jsonb; b jsonb; n int; did text := 'hidden';
begin
  if v_me is null then raise exception 'sign in first'; end if;
  select id, challenged_user, surrendered into v_id, v_to, v_sur from duels where code = upper(p_code) for update;
  if v_id is null then raise exception 'duel not found'; end if;
  select slot into v_slot from duel_players where duel_id = v_id and user_id = v_me;
  if v_slot is null and v_to is distinct from v_me then raise exception 'not your duel'; end if;
  select picks into a from duel_players where duel_id = v_id and slot = 1;
  select picks into b from duel_players where duel_id = v_id and slot = 2;
  if v_slot is not null and b is not null and v_sur is null then
    n := least(jsonb_array_length(a), jsonb_array_length(b));
    if not duel_over(duel_hp(a, b, n), n) then
      update duels set surrendered = v_slot where id = v_id; did := 'surrendered';
    end if;
  elsif v_slot is null and b is null then
    update duels set declined_at = coalesce(declined_at, now()) where id = v_id; did := 'declined';
  end if;
  insert into duel_hidden (user_id, duel_id) values (v_me, v_id) on conflict do nothing;
  return did;
end $$;

-- records count a surrender as a win / loss
create or replace function public.duel_record_k(p_user uuid, p_hash text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r record; v_w int := 0; v_d int := 0; v_l int := 0; n int; h int[]; mine int; theirs int;
begin
  for r in select distinct on (me.duel_id) a.picks pa, b.picks pb, me.slot, d.surrendered from duel_players me
             join duels d on d.id = me.duel_id
             join duel_players a on a.duel_id = me.duel_id and a.slot = 1
             join duel_players b on b.duel_id = me.duel_id and b.slot = 2
            where (p_user is not null and me.user_id = p_user) or (p_hash is not null and me.token_hash = p_hash)
            order by me.duel_id loop
    if r.surrendered is not null then
      if r.surrendered = r.slot then v_l := v_l + 1; else v_w := v_w + 1; end if;
      continue;
    end if;
    n := least(jsonb_array_length(r.pa), jsonb_array_length(r.pb));
    h := duel_hp(r.pa, r.pb, n);
    continue when not duel_over(h, n);
    mine := h[r.slot]; theirs := h[3 - r.slot];
    if mine > theirs then v_w := v_w + 1; elsif mine = theirs then v_d := v_d + 1; else v_l := v_l + 1; end if;
  end loop;
  return jsonb_build_object('w', v_w, 'd', v_d, 'l', v_l);
end $$;

create or replace function public.duel_inbox()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_me uuid := auth.uid(); r record; out jsonb := '[]'; st text; n int; h int[]; mine int; theirs int; ma jsonb; mb jsonb; ms int; opp text;
begin
  if v_me is null then return jsonb_build_object('items', '[]'::jsonb, 'off', false); end if;
  for r in
    select d.id, d.code, d.created_at, d.challenged_user, d.declined_at, d.surrendered,
           a.user_id ua, a.name na, a.picks pa, b.user_id ub, b.name nb, b.picks pb, (b.duel_id is not null) joined,
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
    if not r.joined then
      st := case when r.declined_at is not null then 'declined'
                 when r.created_at < now() - interval '3 days' then 'expired'
                 when ms = 1 then 'sent' else 'challenge' end;
    elsif r.surrendered is not null then
      st := case when r.surrendered = ms then 'lost' else 'won' end;
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
                                     'played', coalesce(jsonb_array_length(ma), 0),
                                     'gave_up', case when r.surrendered is null then null when r.surrendered = ms then 'you' else 'them' end);
  end loop;
  return jsonb_build_object('items', out, 'off', coalesce((select duel_challenges_off from player_profiles where user_id = v_me), false));
end $$;

create or replace function public.duel_get(p_code text, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_q jsonb; v_me smallint; a jsonb; b jsonb; v_shared int; v_hp int[]; v_to uuid; v_dec timestamptz; v_at timestamptz; v_sur smallint;
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
  select picks into a from duel_players where duel_id = v_id and slot = 1;
  select picks into b from duel_players where duel_id = v_id and slot = 2;
  v_shared := least(jsonb_array_length(a), coalesce(jsonb_array_length(b), 0));
  v_hp := duel_hp(a, coalesce(b, '[]'), v_shared);
  return jsonb_build_object(
    'code', upper(p_code), 'qset', v_q, 'me', v_me, 'shared', v_shared,
    'hp', to_jsonb(v_hp), 'over', v_sur is not null or (b is not null and duel_over(v_hp, v_shared)), 'surrendered', v_sur,
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

revoke all on function public.duel_remove(text) from public, anon;
grant execute on function public.duel_remove(text) to authenticated;
revoke all on function public.duel_record_k(uuid, text) from public, anon, authenticated;
revoke all on function public.duel_no_play_after_surrender() from public, anon, authenticated;
grant execute on function public.duel_inbox() to anon, authenticated;
grant execute on function public.duel_get(text, text) to anon, authenticated;
