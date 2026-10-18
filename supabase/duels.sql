-- Unicorner duels (1 v 1, challenge a friend by link). NOT LIVE YET: nothing on the site calls these until duel.html ships.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- It only adds two new tables and six functions; nothing existing is touched.
--
-- How a duel works: player 1 creates it (all 20 possible questions are fixed at that moment) and gets a code to share.
-- Player 2 opens the link and joins. Both start on 300 HP and play rounds of five on their own time; a round's
-- answers stay hidden from the rival until both have played it, then both see that round's battle.
-- Rounds repeat until someone is KO'd. After 15 questions with no KO, the higher HP wins; if HP is level,
-- sudden death: one question at a time (up to 5) until someone is ahead. No sign-in: each browser keeps a random
-- secret ("token") that proves which side of the duel it is; only a hash of it is stored.

create table if not exists public.duels (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  qset       jsonb not null,            -- 20 question ids from duel/bank.json, in play order
  created_at timestamptz not null default now()
);

create table if not exists public.duel_players (
  duel_id     uuid not null references public.duels(id) on delete cascade,
  slot        smallint not null check (slot in (1, 2)),
  token_hash  text not null,
  name        text not null,
  kit         text,
  picks       jsonb not null default '[]', -- [["Chile", 100], [null, 0], ...], grows by a round at a time
  rounds_at   timestamptz,             -- when this player last submitted
  score       integer,
  joined_at   timestamptz not null default now(),
  primary key (duel_id, slot)
);

alter table public.duels enable row level security;
alter table public.duel_players enable row level security;
-- no policies: the tables are only reached through the functions below

-- HP after the first n questions. Same answer on a question = block (no damage either way).
create or replace function public.duel_hp(a jsonb, b jsonb, n int)
returns int[] language plpgsql immutable as $$
declare ha int := 300; hb int := 300; i int; x jsonb; y jsonb;
begin
  for i in 0 .. n - 1 loop
    x := a->i; y := b->i;
    if not coalesce(x->>0 = y->>0, false) then
      ha := greatest(0, ha - coalesce((y->>1)::int, 0));
      hb := greatest(0, hb - coalesce((x->>1)::int, 0));
    end if;
  end loop;
  return array[ha, hb];
end $$;

-- is the duel decided after n shared questions?
create or replace function public.duel_over(hp int[], n int)
returns boolean language sql immutable as $$
  select n > 0 and (hp[1] = 0 or hp[2] = 0 or (n >= 15 and hp[1] <> hp[2]) or n >= 20)
$$;

create or replace function public.duel_create(p_token text, p_name text, p_kit text, p_qset jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text; v_id uuid; v_try int := 0;
begin
  if length(coalesce(p_token, '')) < 16 then raise exception 'bad token'; end if;
  if jsonb_typeof(p_qset) <> 'array' or jsonb_array_length(p_qset) <> 20 then raise exception 'need 20 questions'; end if;
  loop
    v_code := upper(substr(translate(encode(gen_random_bytes(6), 'base64'), '+/=0O1I', 'XYZABCD'), 1, 6));
    begin
      insert into duels (code, qset) values (v_code, p_qset) returning id into v_id;
      exit;
    exception when unique_violation then
      v_try := v_try + 1; if v_try > 5 then raise; end if;
    end;
  end loop;
  insert into duel_players (duel_id, slot, token_hash, name, kit, picks)
    values (v_id, 1, md5(p_token), left(coalesce(nullif(trim(p_name), ''), 'Player 1'), 16), left(p_kit, 24), '[]');
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
  if v_slot is not null then return v_slot; end if;               -- already in this duel
  if exists (select 1 from duel_players where duel_id = v_id and slot = 2) then raise exception 'duel is full'; end if;
  insert into duel_players (duel_id, slot, token_hash, name, kit, picks)
    values (v_id, 2, md5(p_token), left(coalesce(nullif(trim(p_name), ''), 'Player 2'), 16), left(p_kit, 24), '[]');
  return 2;
end $$;

-- submit the next round: 5 picks while under 15 questions, then 1 at a time (sudden death)
create or replace function public.duel_submit(p_code text, p_token text, p_picks jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_slot smallint; v_mine jsonb; v_rival jsonb; n_me int; n_rv int; v_need int; v_shared int; x jsonb; v_score int := 0;
begin
  select id into v_id from duels where code = upper(p_code);
  if v_id is null then raise exception 'duel not found'; end if;
  select slot, picks into v_slot, v_mine from duel_players where duel_id = v_id and token_hash = md5(p_token) for update;
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

create or replace function public.duel_get(p_code text, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_q jsonb; v_me smallint; a jsonb; b jsonb; v_shared int; v_hp int[];
begin
  select id, qset into v_id, v_q from duels where code = upper(p_code);
  if v_id is null then return null; end if;
  select slot into v_me from duel_players where duel_id = v_id and token_hash = md5(coalesce(p_token, ''));
  select picks into a from duel_players where duel_id = v_id and slot = 1;
  select picks into b from duel_players where duel_id = v_id and slot = 2;
  v_shared := least(jsonb_array_length(a), coalesce(jsonb_array_length(b), 0));
  v_hp := duel_hp(a, coalesce(b, '[]'), v_shared);
  return jsonb_build_object(
    'code', upper(p_code), 'qset', v_q, 'me', v_me, 'shared', v_shared,
    'hp', to_jsonb(v_hp), 'over', b is not null and duel_over(v_hp, v_shared),
    'players', (select coalesce(jsonb_agg(jsonb_build_object(
        'slot', slot, 'name', name, 'kit', kit, 'played', jsonb_array_length(picks),
        -- your own answers always; the rival's only for rounds you have both played
        'picks', case when slot = v_me then picks
                      else (select coalesce(jsonb_agg(e order by i), '[]') from jsonb_array_elements(picks) with ordinality t(e, i) where i <= v_shared) end
        ) order by slot), '[]'::jsonb)
      from duel_players where duel_id = v_id));
end $$;

revoke all on function public.duel_create(text, text, text, jsonb) from public;
revoke all on function public.duel_join(text, text, text, text) from public;
revoke all on function public.duel_submit(text, text, jsonb) from public;
revoke all on function public.duel_get(text, text) from public;
grant execute on function public.duel_create(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.duel_join(text, text, text, text) to anon, authenticated;
grant execute on function public.duel_submit(text, text, jsonb) to anon, authenticated;
grant execute on function public.duel_get(text, text) to anon, authenticated;
