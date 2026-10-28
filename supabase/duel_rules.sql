-- Duel settings: questions per round and seconds per question, picked by whoever creates the duel.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
--
-- A duel is still 15 questions before sudden death, so duel_hp / duel_over / duel_outcome don't change;
-- only the size of each round does: 3 per round (5 rounds), 5 per round (3 rounds, the default) or all 15 at once.
-- The clock (seconds per question) is shown to both players; answers are timed on the device, as before.
-- Duels created before this file keep the defaults (5 per round, 15 seconds).

alter table public.duels add column if not exists per smallint not null default 5;
alter table public.duels add column if not exists secs smallint not null default 15;
alter table public.duels drop constraint if exists duels_per_check;
alter table public.duels add constraint duels_per_check check (per in (3, 5, 15));
alter table public.duels drop constraint if exists duels_secs_check;
alter table public.duels add constraint duels_secs_check check (secs in (10, 15, 20, 30));

-- the creator sets the rules straight after creating the duel, before anyone has joined or played
create or replace function public.duel_set_rules(p_code text, p_token text, p_per int, p_secs int)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_per not in (3, 5, 15) or p_secs not in (10, 15, 20, 30) then raise exception 'bad rules'; end if;
  select d.id into v_id from duels d join duel_players a on a.duel_id = d.id and a.slot = 1
   where d.code = upper(p_code)
     and (a.token_hash = md5(coalesce(p_token, '')) or (auth.uid() is not null and a.user_id = auth.uid()));
  if v_id is null then raise exception 'not your duel'; end if;
  if exists (select 1 from duel_players where duel_id = v_id and (slot = 2 or jsonb_array_length(picks) > 0)) then
    raise exception 'duel already started';
  end if;
  update duels set per = p_per, secs = p_secs where id = v_id;
end $$;

-- anyone with the link can read a duel's rules (the code is the secret, same as duel_get)
create or replace function public.duel_rules(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('per', per, 'secs', secs) from duels where code = upper(p_code)
$$;

-- submit the next round: one round's worth of picks while under 15, then 1 at a time (sudden death).
-- Same as the version in duel_challenges.sql, except the round size now comes from the duel.
create or replace function public.duel_submit(p_code text, p_token text, p_picks jsonb)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid; v_per int; v_slot smallint; v_mine jsonb; v_rival jsonb; n_me int; n_rv int; v_need int; v_shared int; x jsonb; v_score int := 0;
begin
  select id, per into v_id, v_per from duels where code = upper(p_code);
  if v_id is null then raise exception 'duel not found'; end if;
  select slot, picks into v_slot, v_mine from duel_players where duel_id = v_id
     and (token_hash = md5(p_token) or (auth.uid() is not null and user_id = auth.uid())) order by (token_hash = md5(p_token)) desc limit 1 for update;
  if v_slot is null then raise exception 'not in this duel'; end if;
  select picks into v_rival from duel_players where duel_id = v_id and slot <> v_slot;
  n_me := jsonb_array_length(v_mine); n_rv := coalesce(jsonb_array_length(v_rival), 0);
  if n_me > n_rv then raise exception 'already played this round'; end if;
  v_shared := least(n_me, n_rv);
  if v_rival is not null and duel_over(duel_hp(v_mine, v_rival, v_shared), v_shared) then raise exception 'duel is over'; end if;
  v_need := case when n_me < 15 then coalesce(v_per, 5) else 1 end;
  if jsonb_typeof(p_picks) <> 'array' or jsonb_array_length(p_picks) <> v_need then raise exception 'need % picks', v_need; end if;
  for x in select * from jsonb_array_elements(p_picks) loop
    if (x->>1)::int not in (0, 10, 30, 60, 85, 100) then raise exception 'bad points'; end if;
  end loop;
  v_mine := v_mine || p_picks;
  select coalesce(sum((e->>1)::int), 0) into v_score from jsonb_array_elements(v_mine) e;
  update duel_players set picks = v_mine, score = v_score, rounds_at = now() where duel_id = v_id and slot = v_slot;
end $$;

grant execute on function public.duel_set_rules(text, text, int, int) to anon, authenticated;
grant execute on function public.duel_rules(text) to anon, authenticated;
grant execute on function public.duel_submit(text, text, jsonb) to anon, authenticated;
