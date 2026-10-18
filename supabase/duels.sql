-- Unicorner duels (1 v 1, challenge a friend by link). NOT LIVE YET: nothing on the site calls these until duel.html ships.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
-- It only adds two new tables and four functions; nothing existing is touched.
--
-- How a duel works: player 1 creates it (the five questions are fixed at that moment) and gets a code to share.
-- Player 2 opens the link and joins. Each plays the five on their own time; each player's answers stay hidden
-- from the other until both have finished, then both see the battle. No sign-in: each browser keeps a random
-- secret ("token") that proves which side of the duel it is; only a hash of it is stored.

create table if not exists public.duels (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  qset       jsonb not null,            -- the five questions: [{"day":"2026-09-18","i":2}, ...]
  created_at timestamptz not null default now()
);

create table if not exists public.duel_players (
  duel_id     uuid not null references public.duels(id) on delete cascade,
  slot        smallint not null check (slot in (1, 2)),
  token_hash  text not null,
  name        text not null,
  kit         text,
  picks       jsonb,                   -- [["Chile", 100], [null, 0], ...] once finished
  score       integer,
  finished_at timestamptz,
  joined_at   timestamptz not null default now(),
  primary key (duel_id, slot)
);

alter table public.duels enable row level security;
alter table public.duel_players enable row level security;
-- no policies: the tables are only reached through the functions below

create or replace function public.duel_create(p_token text, p_name text, p_kit text, p_qset jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text; v_id uuid; v_try int := 0;
begin
  if length(coalesce(p_token, '')) < 16 then raise exception 'bad token'; end if;
  if jsonb_typeof(p_qset) <> 'array' or jsonb_array_length(p_qset) <> 5 then raise exception 'need 5 questions'; end if;
  loop
    v_code := upper(substr(translate(encode(gen_random_bytes(6), 'base64'), '+/=0O1I', 'XYZABCD'), 1, 6));
    begin
      insert into duels (code, qset) values (v_code, p_qset) returning id into v_id;
      exit;
    exception when unique_violation then
      v_try := v_try + 1; if v_try > 5 then raise; end if;
    end;
  end loop;
  insert into duel_players (duel_id, slot, token_hash, name, kit)
    values (v_id, 1, md5(p_token), left(coalesce(nullif(trim(p_name), ''), 'Player 1'), 16), left(p_kit, 24));
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
  insert into duel_players (duel_id, slot, token_hash, name, kit)
    values (v_id, 2, md5(p_token), left(coalesce(nullif(trim(p_name), ''), 'Player 2'), 16), left(p_kit, 24));
  return 2;
end $$;

create or replace function public.duel_submit(p_code text, p_token text, p_picks jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_score int := 0; x jsonb;
begin
  select id into v_id from duels where code = upper(p_code);
  if v_id is null then raise exception 'duel not found'; end if;
  if jsonb_typeof(p_picks) <> 'array' or jsonb_array_length(p_picks) <> 5 then raise exception 'need 5 picks'; end if;
  for x in select * from jsonb_array_elements(p_picks) loop
    if (x->>1)::int not in (0, 10, 30, 60, 85, 100) then raise exception 'bad points'; end if;
    v_score := v_score + (x->>1)::int;
  end loop;
  update duel_players set picks = p_picks, score = v_score, finished_at = now()
    where duel_id = v_id and token_hash = md5(p_token) and finished_at is null;
  if not found then raise exception 'not in this duel, or already played'; end if;
end $$;

create or replace function public.duel_get(p_code text, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_q jsonb; v_me smallint; v_done boolean;
begin
  select id, qset into v_id, v_q from duels where code = upper(p_code);
  if v_id is null then return null; end if;
  select slot into v_me from duel_players where duel_id = v_id and token_hash = md5(coalesce(p_token, ''));
  select count(*) = 2 from duel_players where duel_id = v_id and finished_at is not null into v_done;
  return jsonb_build_object(
    'code', upper(p_code), 'qset', v_q, 'me', v_me, 'done', v_done,
    'players', (select coalesce(jsonb_agg(jsonb_build_object(
        'slot', slot, 'name', name, 'kit', kit, 'finished', finished_at is not null,
        -- your own answers always; the rival's only once both have finished
        'picks', case when v_done or slot = v_me then picks end,
        'score', case when v_done or slot = v_me then score end) order by slot), '[]'::jsonb)
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
