-- Duel records per account (email), not per device. Run once, after duels.sql. Safe to run more than once.
-- Signed-in players send their login with each duel call; their duel rows get their user id, and
-- old rows played on this device are claimed the next time they open a duel while signed in.
-- Players who are not signed in keep the per-device record as before.

alter table public.duel_players add column if not exists user_id uuid;
create index if not exists duel_players_user_idx on public.duel_players (user_id);
create index if not exists duel_players_token_idx on public.duel_players (token_hash);

-- record for an account (and/or a device): one row per finished duel, never counted twice
create or replace function public.duel_record_k(p_user uuid, p_hash text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r record; v_w int := 0; v_d int := 0; v_l int := 0; n int; h int[]; mine int; theirs int;
begin
  for r in select distinct on (me.duel_id) a.picks pa, b.picks pb, me.slot from duel_players me
             join duel_players a on a.duel_id = me.duel_id and a.slot = 1
             join duel_players b on b.duel_id = me.duel_id and b.slot = 2
            where (p_user is not null and me.user_id = p_user) or (p_hash is not null and me.token_hash = p_hash)
            order by me.duel_id loop
    n := least(jsonb_array_length(r.pa), jsonb_array_length(r.pb));
    h := duel_hp(r.pa, r.pb, n);
    continue when not duel_over(h, n);
    mine := h[r.slot]; theirs := h[3 - r.slot];
    if mine > theirs then v_w := v_w + 1; elsif mine = theirs then v_d := v_d + 1; else v_l := v_l + 1; end if;
  end loop;
  return jsonb_build_object('w', v_w, 'd', v_d, 'l', v_l);
end $$;

-- keep the old helper working (by device)
create or replace function public.duel_record_h(p_hash text)
returns jsonb language sql stable security definer set search_path = public as $$ select duel_record_k(null, p_hash) $$;

-- your record: by account when signed in (plus anything on this device), else by device
create or replace function public.duel_record(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select duel_record_k(auth.uid(), md5(coalesce(p_token, '')))
$$;

-- claim: tag this device's duel rows with the signed-in account
create or replace function public.duel_claim(p_token text)
returns void language sql security definer set search_path = public as $$
  update duel_players set user_id = auth.uid()
   where auth.uid() is not null and user_id is null and token_hash = md5(coalesce(p_token, ''))
$$;

-- create / join now also store the account; get shows each player's record by account if they have one
create or replace function public.duel_create(p_token text, p_name text, p_kit text, p_qset jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text; v_id uuid; v_try int := 0;
begin
  if length(coalesce(p_token, '')) < 16 then raise exception 'bad token'; end if;
  if jsonb_typeof(p_qset) <> 'array' or jsonb_array_length(p_qset) <> 20 then raise exception 'need 20 questions'; end if;
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into duels (code, qset) values (v_code, p_qset) returning id into v_id;
      exit;
    exception when unique_violation then
      v_try := v_try + 1; if v_try > 5 then raise; end if;
    end;
  end loop;
  insert into duel_players (duel_id, slot, token_hash, name, kit, picks, user_id)
    values (v_id, 1, md5(p_token), left(coalesce(nullif(trim(p_name), ''), 'Player 1'), 16), left(p_kit, 24), '[]', auth.uid());
  return v_code;
end $$;

create or replace function public.duel_join(p_code text, p_token text, p_name text, p_kit text)
returns smallint language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_slot smallint;
begin
  if length(coalesce(p_token, '')) < 16 then raise exception 'bad token'; end if;
  select id into v_id from duels where code = upper(p_code);
  if v_id is null then raise exception 'duel not found'; end if;
  select slot into v_slot from duel_players where duel_id = v_id and token_hash = md5(p_token);
  if v_slot is not null then return v_slot; end if;
  if exists (select 1 from duel_players where duel_id = v_id and slot = 2) then raise exception 'duel is full'; end if;
  if auth.uid() is not null and exists (select 1 from duel_players where duel_id = v_id and user_id = auth.uid()) then raise exception 'you cannot duel yourself'; end if;
  insert into duel_players (duel_id, slot, token_hash, name, kit, picks, user_id)
    values (v_id, 2, md5(p_token), left(coalesce(nullif(trim(p_name), ''), 'Player 2'), 16), left(p_kit, 24), '[]', auth.uid());
  return 2;
end $$;

create or replace function public.duel_get(p_code text, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_q jsonb; v_me smallint; a jsonb; b jsonb; v_shared int; v_hp int[];
begin
  select id, qset into v_id, v_q from duels where code = upper(p_code);
  if v_id is null then return null; end if;
  select slot into v_me from duel_players where duel_id = v_id and token_hash = md5(coalesce(p_token, ''));
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
    'players', (select coalesce(jsonb_agg(jsonb_build_object(
        'slot', slot, 'name', name, 'kit', kit, 'played', jsonb_array_length(picks),
        'rec', case when user_id is not null then duel_record_k(user_id, null) else duel_record_k(null, token_hash) end,
        'picks', case when slot = v_me then picks
                      else (select coalesce(jsonb_agg(e order by i), '[]') from jsonb_array_elements(picks) with ordinality t(e, i) where i <= v_shared) end
        ) order by slot), '[]'::jsonb)
      from duel_players where duel_id = v_id));
end $$;

revoke all on function public.duel_record_k(uuid, text) from public, anon, authenticated;
revoke all on function public.duel_record_h(text) from public, anon, authenticated;
revoke all on function public.duel_claim(text) from public;
grant execute on function public.duel_claim(text) to anon, authenticated;
grant execute on function public.duel_record(text) to anon, authenticated;
grant execute on function public.duel_create(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.duel_join(text, text, text, text) to anon, authenticated;
grant execute on function public.duel_get(text, text) to anon, authenticated;
