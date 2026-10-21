-- Infinity mode subscriptions. Lemon Squeezy tells the lemonsqueezy-webhook Edge Function about every change and it keeps this table up to date.
-- (The stripe_* column names are from the first version: they hold the payment provider's customer and subscription ids.)
-- Nobody reads the table directly; the site asks infinity_status() about the signed-in player only.
create table if not exists public.infinity_subs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer text,
  stripe_sub text unique,
  status text not null default 'incomplete',
  period_end timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists infinity_subs_customer on public.infinity_subs (stripe_customer);
alter table public.infinity_subs enable row level security;
revoke all on public.infinity_subs from anon, authenticated;
grant select, insert, update, delete on public.infinity_subs to service_role;

-- active while the plan is live (on_trial, past_due = card being retried, cancelled = runs to the end of the paid month) and the paid period hasn't run out (+1 day grace)
create or replace function public.infinity_status()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((
    select jsonb_build_object(
      'active', s.status in ('active', 'trialing', 'on_trial', 'past_due', 'cancelled') and coalesce(s.period_end, now()) > now() - interval '1 day',
      'status', s.status,
      'until', s.period_end)
    from infinity_subs s where s.user_id = auth.uid()
  ), jsonb_build_object('active', false));
$$;
revoke execute on function public.infinity_status() from public, anon;
grant execute on function public.infinity_status() to authenticated;
