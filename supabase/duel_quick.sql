-- Quick match (not live): tap Quick match and you join a waiting duel from a player near your rating (within 150),
-- or, if nobody is waiting, your own duel is posted for the next player near your rating to pick up.
-- Rated like any duel between two signed-in players. A posted quick duel nobody joins closes after 24 hours (same as links).
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.

alter table public.duels add column if not exists quick boolean not null default false;
alter table public.duels add column if not exists quick_r int;
create index if not exists duels_quick_open on public.duels (quick, created_at) where quick;

create or replace function public.duel_quick(p_token text, p_name text, p_kit text, p_qset jsonb, p_per int, p_secs int)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_r int; v_code text;
begin
  if v_me is null then raise exception 'sign in to play quick match'; end if;
  v_r := coalesce(round((duel_elo_state()->'p'->(v_me::text)->>'r')::numeric)::int, 1000);
  -- the closest waiting duel near my rating, not mine, not from someone I already have a duel going with
  select d.code into v_code from duels d
    join duel_players a on a.duel_id = d.id and a.slot = 1
   where d.quick and d.declined_at is null and d.created_at > now() - interval '23 hours'
     and a.user_id is not null and a.user_id <> v_me
     and abs(coalesce(d.quick_r, 1000) - v_r) <= 150
     and not exists (select 1 from duel_players b where b.duel_id = d.id and b.slot = 2)
   order by abs(coalesce(d.quick_r, 1000) - v_r), d.created_at
   limit 1 for update of d skip locked;
  if v_code is not null then
    perform duel_join(v_code, p_token, p_name, p_kit);
    return jsonb_build_object('code', v_code, 'matched', true, 'r', v_r);
  end if;
  -- nobody near me is waiting: post mine (one open quick duel at a time)
  select d.code into v_code from duels d join duel_players a on a.duel_id = d.id and a.slot = 1
   where d.quick and a.user_id = v_me and d.created_at > now() - interval '23 hours'
     and not exists (select 1 from duel_players b where b.duel_id = d.id and b.slot = 2) limit 1;
  if v_code is not null then return jsonb_build_object('code', v_code, 'matched', false, 'r', v_r, 'already', true); end if;
  v_code := duel_create(p_token, p_name, p_kit, p_qset);
  update duels set quick = true, quick_r = v_r,
         per = case when p_per in (3, 5, 15) then p_per else 5 end,
         secs = case when p_secs in (10, 15, 20, 30) then p_secs else 15 end
   where code = v_code;
  update duel_players set user_id = v_me where duel_id = (select id from duels where code = v_code) and slot = 1 and user_id is null;
  return jsonb_build_object('code', v_code, 'matched', false, 'r', v_r);
end $$;

revoke all on function public.duel_quick(text, text, text, jsonb, int, int) from public, anon;
grant execute on function public.duel_quick(text, text, text, jsonb, int, int) to authenticated;

-- which of my duels are quick matches still waiting for a rival (for the My duels labels)
create or replace function public.duel_quick_mine()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(d.code), '[]') from duels d join duel_players a on a.duel_id = d.id and a.slot = 1
   where d.quick and a.user_id = auth.uid() and d.created_at > now() - interval '24 hours'
     and not exists (select 1 from duel_players b where b.duel_id = d.id and b.slot = 2)
$$;
grant execute on function public.duel_quick_mine() to authenticated;
