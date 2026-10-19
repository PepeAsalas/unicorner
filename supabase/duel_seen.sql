-- finished duels ping you until you've watched the final battle, then they go to the archive
alter table duel_players add column if not exists result_seen boolean not null default false;

-- duels already finished before this: count them as seen, so nobody gets a pile of old notifications
update duel_players p set result_seen = true
  from duels d
  join duel_players a on a.duel_id = d.id and a.slot = 1
  join duel_players b on b.duel_id = d.id and b.slot = 2
 where p.duel_id = d.id
   and (d.surrendered is not null
        or duel_over(duel_hp(a.picks, b.picks, least(jsonb_array_length(a.picks), jsonb_array_length(b.picks))),
                     least(jsonb_array_length(a.picks), jsonb_array_length(b.picks))));

-- called when you've watched the final battle (by account, or by this device's token)
create or replace function public.duel_seen(p_code text, p_token text)
returns void language sql security definer set search_path = public as $$
  update duel_players p set result_seen = true
    from duels d
   where d.id = p.duel_id and d.code = upper(p_code)
     and (p.token_hash = md5(coalesce(p_token, '')) or (auth.uid() is not null and p.user_id = auth.uid()))
$$;

create or replace function public.duel_inbox()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_me uuid := auth.uid(); r record; out jsonb := '[]'; st text; n int; h int[]; mine int; theirs int; ma jsonb; mb jsonb; ms int; opp text; fresh boolean;
begin
  if v_me is null then return jsonb_build_object('items', '[]'::jsonb, 'off', false); end if;
  for r in
    select d.id, d.code, d.created_at, d.challenged_user, d.declined_at, d.surrendered,
           a.user_id ua, a.name na, a.picks pa, a.result_seen sa, b.user_id ub, b.name nb, b.picks pb, b.result_seen sb, (b.duel_id is not null) joined,
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
    fresh := false;
    if not r.joined then
      st := case when r.declined_at is not null then 'declined'
                 when r.created_at < now() - interval '3 days' then 'expired'
                 when ms = 1 then 'sent' else 'challenge' end;
    elsif r.surrendered is not null then
      st := case when r.surrendered = ms then 'lost' else 'won' end;
      fresh := not coalesce(case when ms = 1 then r.sa else r.sb end, true);
    else
      n := least(jsonb_array_length(r.pa), jsonb_array_length(r.pb));
      h := duel_hp(r.pa, r.pb, n);
      if duel_over(h, n) then
        mine := h[ms]; theirs := h[3 - ms];
        st := case when mine > theirs then 'won' when mine = theirs then 'draw' else 'lost' end;
        fresh := not coalesce(case when ms = 1 then r.sa else r.sb end, true);
      elsif jsonb_array_length(ma) > jsonb_array_length(mb) then st := 'their_turn';
      else st := 'your_turn'; end if;
    end if;
    out := out || jsonb_build_object('code', r.code, 'opp', coalesce(opp, 'A mate'), 'state', st, 'at', r.touched,
                                     'played', coalesce(jsonb_array_length(ma), 0),
                                     'fresh', fresh,
                                     'gave_up', case when r.surrendered is null then null when r.surrendered = ms then 'you' else 'them' end);
  end loop;
  return jsonb_build_object('items', out, 'off', coalesce((select duel_challenges_off from player_profiles where user_id = v_me), false));
end $$;

revoke all on function public.duel_seen(text, text) from public;
grant execute on function public.duel_seen(text, text) to anon, authenticated;
grant execute on function public.duel_inbox() to anon, authenticated;
