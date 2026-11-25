-- Infinity without signing in first: a player can pay on Stripe straight away. The stripe-webhook function stores
-- such a purchase under the email used at checkout (infinity_pending); when someone signs in with that email,
-- infinity_status() moves it onto their account. Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.
create table if not exists public.infinity_pending (
  email text primary key,           -- lower-case email from Stripe checkout
  stripe_customer text,
  stripe_sub text unique,
  status text not null,
  period_end timestamptz,
  updated_at timestamptz not null default now());
alter table public.infinity_pending enable row level security;
revoke all on public.infinity_pending from anon, authenticated;
grant select, insert, update, delete on public.infinity_pending to service_role;

create or replace function public.infinity_status()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare u uuid := auth.uid(); em text := lower(coalesce(auth.jwt()->>'email', '')); p infinity_pending; cur text;
begin
  if u is null then return jsonb_build_object('active', false); end if;
  -- claim a purchase made before signing in
  if em <> '' then
    select * into p from infinity_pending where email = em;
    if found then
      select status into cur from infinity_subs where user_id = u;
      if cur is distinct from 'paid' then
        insert into infinity_subs (user_id, stripe_customer, stripe_sub, status, period_end, updated_at)
        values (u, p.stripe_customer, p.stripe_sub, p.status, p.period_end, now())
        on conflict (user_id) do update set stripe_customer = excluded.stripe_customer, stripe_sub = excluded.stripe_sub,
          status = excluded.status, period_end = excluded.period_end, updated_at = now();
      end if;
      delete from infinity_pending where email = em;
    end if;
  end if;
  return coalesce((
    select jsonb_build_object(
      'active', s.status = 'paid'
        or (s.status in ('active', 'trialing', 'on_trial', 'past_due', 'cancelled') and coalesce(s.period_end, now()) > now() - interval '1 day'),
      'status', s.status, 'until', s.period_end)
    from infinity_subs s where s.user_id = u), jsonb_build_object('active', false));
end $$;
revoke execute on function public.infinity_status() from public, anon;
grant execute on function public.infinity_status() to authenticated;
