-- Bigger rating swings: K = 80 for your first 5 rated duels (placement), then 40 (was 40 / 20).
-- Ratings are replayed from every finished duel, so this also re-scores past duels with the new K.
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.

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
    kk := case when (pa->>'g')::int < 5 then 80 else 40 end;
    kb2 := case when (pb->>'g')::int < 5 then 80 else 40 end;
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
