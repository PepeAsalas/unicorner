-- Advent calendar 2026: community votes and the door counter (for the day 13 community goal).
-- One vote per browser (visitor id) per vote day, only on that day (Amsterdam time). Results show from the next day.
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.

create table if not exists public.advent_votes (
  day      int  not null check (day between 1 and 24),
  voter    text not null,
  option   int  not null check (option between 0 and 5),
  voted_at timestamptz not null default now(),
  primary key (day, voter)
);
alter table public.advent_votes enable row level security;
revoke all on public.advent_votes from anon, authenticated;

create table if not exists public.advent_opens (
  day       int  not null check (day between 1 and 24),
  voter     text not null,
  opened_at timestamptz not null default now(),
  primary key (day, voter)
);
alter table public.advent_opens enable row level security;
revoke all on public.advent_opens from anon, authenticated;

-- today's advent day (1-24) in Amsterdam, or null outside 1-24 December 2026
create or replace function public.advent_today()
returns int language sql stable set search_path = public as $$
  select case when d between date '2026-12-01' and date '2026-12-24' then extract(day from d)::int end
    from (select (now() at time zone 'Europe/Amsterdam')::date as d) x
$$;

-- vote: only on that day, once per visitor (a second vote changes nothing). Returns {voted: option}
create or replace function public.advent_vote(p_day int, p_option int, p_visitor text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare mine int;
begin
  if p_visitor is null or length(p_visitor) < 8 or length(p_visitor) > 80 then raise exception 'bad visitor'; end if;
  if p_day is distinct from advent_today() then raise exception 'voting for this day is closed'; end if;
  insert into advent_votes (day, voter, option) values (p_day, p_visitor, p_option) on conflict (day, voter) do nothing;
  select option into mine from advent_votes where day = p_day and voter = p_visitor;
  return jsonb_build_object('voted', mine);
end $$;

-- results: counts per option once the day is over (before that, only the total and your own vote)
create or replace function public.advent_results(p_day int, p_visitor text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'closed', coalesce(advent_today(), 25) > p_day,
    'total', (select count(*) from advent_votes where day = p_day),
    'mine', (select option from advent_votes where day = p_day and voter = p_visitor),
    'counts', case when coalesce(advent_today(), 25) > p_day then
      (select coalesce(jsonb_object_agg(option, n), '{}') from (select option, count(*) n from advent_votes where day = p_day group by option) c) end)
$$;

-- door opened today (counted for the community goal); returns how many opened that door
create or replace function public.advent_open(p_day int, p_visitor text)
returns int language plpgsql volatile security definer set search_path = public as $$
begin
  if p_visitor is not null and length(p_visitor) between 8 and 80 and p_day = advent_today() then
    insert into advent_opens (day, voter) values (p_day, p_visitor) on conflict do nothing;
  end if;
  return (select count(*) from advent_opens where day = p_day);
end $$;

grant execute on function public.advent_vote(int, int, text), public.advent_results(int, text), public.advent_open(int, text) to anon, authenticated;

-- ── Snowflakes on the server (v2): saved per account when signed in, per browser otherwise; signing in claims the
--    browser's snowflakes. A day's score is the best you got on that door (max 30). Leaderboard: signed-in players.
create table if not exists public.advent_flakes (
  owner      text not null,          -- 'u:<user id>' or 'v:<visitor id>'
  day        int  not null check (day between 1 and 24),
  flakes     int  not null check (flakes between 0 and 30),
  updated_at timestamptz not null default now(),
  primary key (owner, day)
);
alter table public.advent_flakes enable row level security;
revoke all on public.advent_flakes from anon, authenticated;

create or replace function public.advent_owner(p_visitor text)
returns text language sql stable set search_path = public as $$
  select case when auth.uid() is not null then 'u:' || auth.uid()
              when p_visitor is not null and length(p_visitor) between 8 and 80 then 'v:' || p_visitor end
$$;

-- save a door's snowflakes (keeps your best); only for doors that have opened
create or replace function public.advent_flakes_save(p_day int, p_flakes int, p_visitor text)
returns int language plpgsql volatile security definer set search_path = public as $$
declare o text := advent_owner(p_visitor);
begin
  if o is null then raise exception 'no owner'; end if;
  if p_day < 1 or p_day > coalesce(advent_today(), case when (now() at time zone 'Europe/Amsterdam')::date > date '2026-12-24' then 24 else 0 end) then raise exception 'door not open'; end if;
  insert into advent_flakes (owner, day, flakes) values (o, p_day, least(30, greatest(0, p_flakes)))
  on conflict (owner, day) do update set flakes = greatest(advent_flakes.flakes, excluded.flakes), updated_at = now();
  return (select coalesce(sum(flakes), 0) from advent_flakes where owner = o);
end $$;

-- your snowflakes per door; when signed in, the browser's snowflakes are moved to the account first
create or replace function public.advent_flakes_mine(p_visitor text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare o text := advent_owner(p_visitor);
begin
  if o is null then return '{}'; end if;
  if auth.uid() is not null and p_visitor is not null and length(p_visitor) between 8 and 80 then
    insert into advent_flakes (owner, day, flakes)
      select o, day, flakes from advent_flakes where owner = 'v:' || p_visitor
    on conflict (owner, day) do update set flakes = greatest(advent_flakes.flakes, excluded.flakes);
    delete from advent_flakes where owner = 'v:' || p_visitor;
  end if;
  return (select coalesce(jsonb_object_agg(day, flakes), '{}') from advent_flakes where owner = o);
end $$;

-- top 10 signed-in players by snowflakes, plus your own rank
create or replace function public.advent_flakes_top()
returns jsonb language sql stable security definer set search_path = public as $$
  with t as (select substr(f.owner, 3)::uuid as uid, sum(f.flakes) as total from advent_flakes f where f.owner like 'u:%' group by 1),
       r as (select t.uid, t.total, rank() over (order by t.total desc) as rk from t)
  select jsonb_build_object(
    'top', coalesce((select jsonb_agg(jsonb_build_object('nick', p.nickname, 'kit', p.kit, 'total', r.total, 'rank', r.rk) order by r.rk)
                      from r join player_profiles p on p.user_id = r.uid where r.rk <= 10), '[]'),
    'me', (select jsonb_build_object('rank', r.rk, 'total', r.total) from r where r.uid = auth.uid()),
    'players', (select count(*) from t))
$$;

grant execute on function public.advent_flakes_save(int, int, text), public.advent_flakes_mine(text), public.advent_flakes_top() to anon, authenticated;
