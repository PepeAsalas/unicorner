-- ── Kits on the ranking: each player's unicorn shows on the boards in the kit they wear ──
-- The game sends the kit being worn plus the kits, best streak and games counted on the player's device.
-- The boards return them, so anyone can tap a player and see their card.
alter table public.player_profiles add column if not exists kit         text;
alter table public.player_profiles add column if not exists kits        text[] not null default '{}';
alter table public.player_profiles add column if not exists best_streak integer not null default 0;
alter table public.player_profiles add column if not exists games       integer not null default 0;

create or replace function public.lg_set_look(p_kit text, p_kits text[] default '{}', p_streak integer default 0, p_games integer default 0)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid();
        known text[] := array['stripes','hoops','ref','candy','sash','keeper','halves','night','pin','fire','quarters','checks','hat3','dots',
                              'toxic','ice','perfect','leopard','zebra','shadow','galaxy','ocean','sunset','camo','lava','chrome','rainbow','tiedye','gold'];
        ks text[] := coalesce(p_kits, '{}');
begin
  if coalesce(array_length(ks, 1), 0) > 40 or not (ks <@ known) then raise exception 'Unknown kit'; end if;
  if p_kit is not null and p_kit <> 'classic' and not (p_kit = any(ks)) then raise exception 'That kit is not unlocked'; end if;
  update player_profiles
     set kit = nullif(p_kit, 'classic'),
         kits = coalesce((select array_agg(distinct x order by x) from unnest(ks) x), '{}'),
         best_streak = least(greatest(coalesce(p_streak, 0), 0), 5000),
         games = least(greatest(coalesce(p_games, 0), 0), 5000)
   where user_id = uid;
end $$;
revoke all on function public.lg_set_look(text, text[], integer, integer) from public, anon;
grant execute on function public.lg_set_look(text, text[], integer, integer) to authenticated;

create or replace function public.lg_league_board(p_league uuid)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := lg_uid(); t date := lg_today(); wk date := date_trunc('week', lg_today())::date; l leagues; rows json;
begin
  if not exists (select 1 from league_members where league_id = p_league and user_id = uid) then
    raise exception 'You are not in this league';
  end if;
  select * into l from leagues where id = p_league;
  select coalesce(json_agg(r order by r.today_score desc nulls last, r.week_total desc, r.nickname), '[]'::json) into rows from (
    select p.nickname, (m.user_id = uid) as me, p.kit, p.kits, p.best_streak as streak, p.games,
           (select s.score from player_scores s where s.user_id = m.user_id and s.day = t and not s.removed) as today_score,
           coalesce((select sum(s.score) from player_scores s where s.user_id = m.user_id and s.day between wk and t and not s.removed), 0) as week_total,
           (select count(*) from player_scores s where s.user_id = m.user_id and s.day between wk and t and not s.removed) as week_played
    from league_members m join player_profiles p on p.user_id = m.user_id
    where m.league_id = p_league) r;
  return json_build_object('id', l.id, 'name', l.name, 'code', l.code, 'today', t, 'week_start', wk, 'rows', rows);
end $$;

create or replace function public.lg_global_board()
returns json language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); t date := lg_today(); wk date := date_trunc('week', lg_today())::date;
        td json; tn int; tme json; wkj json; wn int; wme json; yj json;
begin
  select json_build_object('nickname', p.nickname, 'score', s.score, 'kit', p.kit, 'kits', p.kits, 'streak', p.best_streak, 'games', p.games,
           'players', greatest(
             -- everyone who finished yesterday's game, signed up or not (anonymous players are only in the events log)
             (select count(distinct coalesce(e.visitor, e.session)) from events e
               where e.name = 'game_finish' and e.game_day::text = to_char(t - 1, 'YYYY-MM-DD')
                 and e.created_at >= (t - 2)::timestamptz and e.created_at < (t + 1)::timestamptz
                 and coalesce(e.data->>'mode', '') <> 'infinity'),
             (select count(*) from player_scores s2 join player_profiles p2 on p2.user_id = s2.user_id where s2.day = t - 1 and not s2.removed))) into yj
    from player_scores s join player_profiles p on p.user_id = s.user_id
    where s.day = t - 1 and not s.removed order by s.score desc, s.created_at limit 1;

  with r as (
    select s.user_id, p.nickname, s.score, p.kit, p.kits, p.best_streak, p.games,
           row_number() over (order by s.score desc, s.created_at) as rk
    from player_scores s join player_profiles p on p.user_id = s.user_id
    where s.day = t and not s.removed)
  select coalesce(json_agg(json_build_object('nickname', nickname, 'score', score, 'rank', rk, 'me', user_id = uid,
                                             'kit', kit, 'kits', kits, 'streak', best_streak, 'games', games)
                           order by rk) filter (where rk <= 10), '[]'::json),
         count(*),
         (select json_build_object('rank', x.rk, 'score', x.score) from r x where x.user_id = uid)
    into td, tn, tme from r;

  with w as (
    select s.user_id, p.nickname, p.kit, p.kits, p.best_streak, p.games,
           sum(s.score)::int as total, count(*)::int as played, max(s.created_at) as last_at
    from player_scores s join player_profiles p on p.user_id = s.user_id
    where s.day between wk and t and not s.removed
    group by s.user_id, p.nickname, p.kit, p.kits, p.best_streak, p.games),
  r as (select w.*, row_number() over (order by total desc, played desc, last_at) as rk from w)
  select coalesce(json_agg(json_build_object('nickname', nickname, 'score', total, 'played', played, 'rank', rk, 'me', user_id = uid,
                                             'kit', kit, 'kits', kits, 'streak', best_streak, 'games', games)
                           order by rk) filter (where rk <= 10), '[]'::json),
         count(*),
         (select json_build_object('rank', x.rk, 'score', x.total) from r x where x.user_id = uid)
    into wkj, wn, wme from r;

  return json_build_object('today', t, 'week_start', wk, 'yesterday', yj,
    'day', json_build_object('rows', td, 'players', tn, 'me', tme),
    'week', json_build_object('rows', wkj, 'players', wn, 'me', wme));
end $$;
