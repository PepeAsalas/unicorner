-- Infinity as a one-time purchase (Stripe, $4.99). The stripe-webhook Edge Function writes status 'paid' with no end date.
-- 'paid' is active forever; 'refunded' is not. Old subscription rows keep working as before.
-- Paste into Supabase -> SQL Editor -> Run. Safe to run more than once.
create or replace function public.infinity_status()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((
    select jsonb_build_object(
      'active', s.status = 'paid'
        or (s.status in ('active', 'trialing', 'on_trial', 'past_due', 'cancelled') and coalesce(s.period_end, now()) > now() - interval '1 day'),
      'status', s.status,
      'until', s.period_end)
    from infinity_subs s where s.user_id = auth.uid()
  ), jsonb_build_object('active', false));
$$;
revoke execute on function public.infinity_status() from public, anon;
grant execute on function public.infinity_status() to authenticated;
