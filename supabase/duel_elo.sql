-- Duel rating (Elo) + monthly seasons.
-- Rated: finished duels where both players are signed in (different accounts). Link duels against anonymous players don't count.
--   * start at 1000; K = 40 for your first 5 rated duels (placement), then 20
--   * margin of victory: points x 0.8 (a squeaker) up to x1.5 (a KO with most of your HP left); give-up / timeout = x0.8
--   * same opponent again within 7 days counts half as much each time (1, 1/2, 1/4...), so farming a mate earns little
--   * seasons are calendar months (Amsterdam time): at each new month every rating is pulled halfway back to 1000;
--     the top 3 of a finished season (3+ duels that season, placement done) get a season title
-- Everything is replayed from the duels themselves, so timeouts and give-ups land in the right place automatically.

alter table public.duels add column if not exists surrendered_at timestamptz;

create or replace function public.duel_elo_state()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  x record; P jsonb := '{}'; PR jsonb := '{}'; SN jsonb := '{}'; DL jsonb := '{}';
  cur text := to_char(now() at time zone 'Europe/Amsterdam', 'YYYY-MM');
  ka text; kb text; pa jsonb; pb jsonb; ra numeric; rb numeric; ea numeric; sa numeric; m numeric; f numeric; kk numeric; kb2 numeric;
  da numeric; db numeric; pk text; recent jsonb; n int; h int[]; lo int; u text; season text;
begin
  for x in
    with base as (
      select d.code, d.surrendered_at, a.user_id ua, b.user_id ub, a.picks apk, b.picks bpk,
             a.rounds_at x_ra, b.rounds_at x_rb, a.joined_at x_ja, b.joined_at x_jb,
             duel_outcome(d.surrendered, a.picks, a.rounds_at, a.joined_at, b.picks, b.rounds_at, b.joined_at) oc
        from duels d
        join duel_players a on a.duel_id = d.id and a.slot = 1
        join duel_players b on b.duel_id = d.id and b.slot = 2
       where a.user_id is not null and b.user_id is not null and a.user_id <> b.user_id)
    select * from (select *, case oc->>'how'
                when 'ko' then greatest(x_ra, x_rb)
                when 'gave_up' then coalesce(surrendered_at, greatest(x_ra, x_rb, x_ja, x_jb))
                else greatest(x_ra, x_rb, x_ja, x_jb) + interval '24 hours' end ended
      from base where oc is not null) q
     order by q.ended, q.code
  loop
    season := to_char(x.ended at time zone 'Europe/Amsterdam', 'YYYY-MM');
    ka := x.ua::text; kb := x.ub::text;
    -- bring both players into this season (soft reset for every month boundary they crossed)
    foreach u in array array[ka, kb] loop
      if not P ? u then P := P || jsonb_build_object(u, jsonb_build_object('r', 1000, 'g', 0, 's', season, 'sg', 0)); end if;
      if P->u->>'s' < season then
        SN := jsonb_set(SN, array[P->u->>'s'], coalesce(SN->(P->u->>'s'), '{}') || jsonb_build_object(u, jsonb_build_object('r', P->u->'r', 'g', P->u->'g', 'sg', P->u->'sg')));
        n := (extract(year from to_date(season, 'YYYY-MM')) * 12 + extract(month from to_date(season, 'YYYY-MM')))
           - (extract(year from to_date(P->u->>'s', 'YYYY-MM')) * 12 + extract(month from to_date(P->u->>'s', 'YYYY-MM')));
        P := jsonb_set(P, array[u], (P->u) || jsonb_build_object('r', 1000 + ((P->u->>'r')::numeric - 1000) / power(2, n), 's', season, 'sg', 0));
      end if;
    end loop;
    pa := P->ka; pb := P->kb; ra := (pa->>'r')::numeric; rb := (pb->>'r')::numeric;
    lo := (x.oc->>'loser')::int;
    sa := case lo when 0 then 0.5 when 2 then 1 else 0 end;
    ea := 1 / (1 + power(10, (rb - ra) / 400));
    if x.oc->>'how' in ('gave_up') or (x.oc->>'how' = 'timeout' and jsonb_array_length(x.apk) <> jsonb_array_length(x.bpk)) then m := 0.8;
    elsif lo = 0 then m := 1;
    else n := least(jsonb_array_length(x.apk), jsonb_array_length(x.bpk)); h := duel_hp(x.apk, x.bpk, n);
         m := 0.8 + 0.7 * least(1, abs(h[1] - h[2]) / 300.0); end if;
    -- repeat opponents within 7 days count less
    pk := least(ka, kb) || ':' || greatest(ka, kb);
    recent := coalesce((select jsonb_agg(t) from jsonb_array_elements_text(coalesce(PR->pk, '[]')) t where t::timestamptz > x.ended - interval '7 days'), '[]');
    f := power(0.5, jsonb_array_length(recent));
    PR := PR || jsonb_build_object(pk, recent || to_jsonb(x.ended::text));
    kk := case when (pa->>'g')::int < 5 then 40 else 20 end;
    kb2 := case when (pb->>'g')::int < 5 then 40 else 20 end;
    da := kk * m * f * (sa - ea);
    db := kb2 * m * f * ((1 - sa) - (1 - ea));
    P := jsonb_set(P, array[ka], pa || jsonb_build_object('r', ra + da, 'g', (pa->>'g')::int + 1, 'sg', (pa->>'sg')::int + 1));
    P := jsonb_set(P, array[kb], pb || jsonb_build_object('r', rb + db, 'g', (pb->>'g')::int + 1, 'sg', (pb->>'sg')::int + 1));
    DL := DL || jsonb_build_object(x.code, jsonb_build_object('b1', round(ra), 'b2', round(rb), 'a1', round(ra + da), 'a2', round(rb + db),
                                                              'g1', (pa->>'g')::int + 1, 'g2', (pb->>'g')::int + 1));
  end loop;
  -- players who haven't played this month: close their last season and apply the reset now
  for u in select jsonb_object_keys(P) loop
    if P->u->>'s' < cur then
      SN := jsonb_set(SN, array[P->u->>'s'], coalesce(SN->(P->u->>'s'), '{}') || jsonb_build_object(u, jsonb_build_object('r', P->u->'r', 'g', P->u->'g', 'sg', P->u->'sg')));
      n := (extract(year from to_date(cur, 'YYYY-MM')) * 12 + extract(month from to_date(cur, 'YYYY-MM')))
         - (extract(year from to_date(P->u->>'s', 'YYYY-MM')) * 12 + extract(month from to_date(P->u->>'s', 'YYYY-MM')));
      P := jsonb_set(P, array[u], (P->u) || jsonb_build_object('r', 1000 + ((P->u->>'r')::numeric - 1000) / power(2, n), 's', cur, 'sg', 0));
    end if;
  end loop;
  return jsonb_build_object('cur', cur, 'p', P, 'past', SN, 'duels', DL);
end $$;

-- the two players' ratings for one duel, and how this duel moved them (null if the duel isn't rated)
create or replace function public.duel_elo_duel(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare st jsonb; ua uuid; ub uuid;
begin
  select a.user_id, b.user_id into ua, ub from duels d
    join duel_players a on a.duel_id = d.id and a.slot = 1
    join duel_players b on b.duel_id = d.id and b.slot = 2
   where d.code = upper(p_code);
  if ua is null or ub is null or ua = ub then return null; end if;
  st := duel_elo_state();
  return jsonb_build_object(
    'p1', jsonb_build_object('r', round(coalesce((st->'p'->ua::text->>'r')::numeric, 1000)), 'g', coalesce((st->'p'->ua::text->>'g')::int, 0)),
    'p2', jsonb_build_object('r', round(coalesce((st->'p'->ub::text->>'r')::numeric, 1000)), 'g', coalesce((st->'p'->ub::text->>'g')::int, 0)),
    'delta', st->'duels'->upper(p_code));
end $$;

-- a leaderboard player's rating and season titles (player card)
create or replace function public.duel_elo_nick(p_nick text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare st jsonb; v uuid; titles jsonb := '[]'; s text; rk int;
begin
  select user_id into v from player_profiles where lower(nickname) = lower(trim(p_nick));
  if v is null then return null; end if;
  st := duel_elo_state();
  if not (st->'p') ? v::text then return null; end if;
  for s in select jsonb_object_keys(st->'past') loop
    select pos into rk from (
      select key, row_number() over (order by (value->>'r')::numeric desc) pos
        from jsonb_each(st->'past'->s) where (value->>'sg')::int >= 3 and (value->>'g')::int >= 5) t
     where key = v::text;
    if rk is not null and rk <= 3 then titles := titles || jsonb_build_object('season', s, 'place', rk); end if;
  end loop;
  return jsonb_build_object('r', round((st->'p'->v::text->>'r')::numeric), 'g', (st->'p'->v::text->>'g')::int,
                            'sg', (st->'p'->v::text->>'sg')::int, 'titles', titles);
end $$;

-- this month's duel season: top 10 (placement done, 1+ duel this month), your place, last month's podium
create or replace function public.duel_season()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare st jsonb; top jsonb; me jsonb; prev text; podium jsonb;
begin
  st := duel_elo_state();
  with t as (
    select key::uuid uid, (value->>'r')::numeric r, (value->>'g')::int g, (value->>'sg')::int sg,
           row_number() over (order by (value->>'r')::numeric desc) pos
      from jsonb_each(st->'p') where (value->>'sg')::int >= 1 and (value->>'g')::int >= 5)
  select coalesce(jsonb_agg(jsonb_build_object('pos', pos, 'nick', p.nickname, 'r', round(t.r), 'sg', t.sg) order by pos) filter (where pos <= 10), '[]'),
         (select jsonb_build_object('pos', pos, 'r', round(r)) from t where uid = auth.uid())
    into top, me
    from t left join player_profiles p on p.user_id = t.uid;
  prev := to_char((date_trunc('month', now() at time zone 'Europe/Amsterdam') - interval '1 day'), 'YYYY-MM');
  select coalesce(jsonb_agg(jsonb_build_object('pos', pos, 'nick', nick, 'r', r) order by pos), '[]') into podium from (
    select row_number() over (order by (value->>'r')::numeric desc) pos, p.nickname nick, round((value->>'r')::numeric) r
      from jsonb_each(coalesce(st->'past'->prev, '{}')) e left join player_profiles p on p.user_id = e.key::uuid
     where (value->>'sg')::int >= 3 and (value->>'g')::int >= 5) z where pos <= 3;
  return jsonb_build_object('season', st->>'cur',
    'ends', (date_trunc('month', now() at time zone 'Europe/Amsterdam') + interval '1 month') at time zone 'Europe/Amsterdam',
    'top', top, 'me', me, 'mine', case when auth.uid() is not null and (st->'p') ? auth.uid()::text
       then jsonb_build_object('r', round((st->'p'->auth.uid()::text->>'r')::numeric), 'g', (st->'p'->auth.uid()::text->>'g')::int) end,
    'last', jsonb_build_object('season', prev, 'podium', podium));
end $$;

-- giving up now records when, so the rating replay puts it in the right order
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
      update duels set surrendered = v_slot, surrendered_at = now() where id = v_id; did := 'surrendered';
    end if;
  elsif v_slot is null and b is null then
    update duels set declined_at = coalesce(declined_at, now()) where id = v_id; did := 'declined';
  end if;
  insert into duel_hidden (user_id, duel_id) values (v_me, v_id) on conflict do nothing;
  return did;
end $$;

revoke all on function public.duel_elo_state() from public, anon, authenticated;
revoke all on function public.duel_remove(text) from public, anon;
grant execute on function public.duel_remove(text) to authenticated;
grant execute on function public.duel_elo_duel(text) to anon, authenticated;
grant execute on function public.duel_elo_nick(text) to anon, authenticated;
grant execute on function public.duel_season() to anon, authenticated;
