-- duel_get links a signed-in player's account to their seat (an UPDATE), so it must be volatile.
-- Marked stable it fails with "UPDATE is not allowed in a non-volatile function" the first time
-- a signed-in player opens a duel they joined before signing in. The other writers are listed too, to be sure.
alter function public.duel_get(text, text) volatile;
alter function public.duel_join(text, text, text, text) volatile;
alter function public.duel_submit(text, text, jsonb) volatile;
alter function public.duel_seen(text, text) volatile;
alter function public.duel_remove(text) volatile;
alter function public.duel_create(text, text, text, jsonb) volatile;
alter function public.duel_challenge(text, text, text, jsonb, text) volatile;
alter function public.duel_decline(text) volatile;
alter function public.duel_challenges_set(boolean) volatile;
