-- Lets a signed-in player delete their own account (App Store rule 5.1.1(v)).
-- Everything tied to the account (profile, scores, leagues, friends, chats, Infinity) is removed by the
-- "on delete cascade" links to auth.users.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Please sign in'; end if;
  delete from auth.users where id = u;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
