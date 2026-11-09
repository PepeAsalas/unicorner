-- Duels: extra time instead of draws.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run. Safe to run more than once.
--
-- From question 16 (the one-at-a-time questions after a level 15), each answer also carries how long it took
-- in milliseconds: [answer, points, ms]. If both players get it right and the HP is still level after it
-- (same answer, or the same points), the faster answer wins: the slower player loses 1 HP, so the duel ends.
-- Both wrong, or answers without a time (older duels, earlier questions): nothing changes.
-- Only duel_hp changes; duel_over, duel_outcome, duel_submit and the inbox all use it, so they follow.
-- Same rule as hpAfter() in duel.html and the replay in duel/battle.js.
create or replace function public.duel_hp(a jsonb, b jsonb, n int)
returns int[] language plpgsql immutable as $$
declare ha int := 300; hb int := 300; i int; x jsonb; y jsonb; same boolean; ta int; tb int;
begin
  for i in 0 .. n - 1 loop
    exit when ha = 0 or hb = 0;           -- a KO ends the duel on that question
    x := a->i; y := b->i;
    same := coalesce(x->>0 = y->>0, false);
    if not same then
      ha := greatest(0, ha - coalesce((y->>1)::int, 0));
      hb := greatest(0, hb - coalesce((x->>1)::int, 0));
    end if;
    -- extra time: both right, still level, both timed -> the slower one loses 1 HP
    if i >= 15 and ha > 0 and hb > 0 and ha = hb
       and (same or coalesce((x->>1)::int, 0) = coalesce((y->>1)::int, 0))
       and coalesce((x->>1)::int, 0) > 0 and coalesce((y->>1)::int, 0) > 0 then
      ta := case when jsonb_typeof(x->2) = 'number' then (x->>2)::int end;
      tb := case when jsonb_typeof(y->2) = 'number' then (y->>2)::int end;
      if ta > 0 and tb > 0 and ta <> tb then
        if ta > tb then ha := ha - 1; else hb := hb - 1; end if;
      end if;
    end if;
  end loop;
  return array[ha, hb];
end $$;
revoke all on function public.duel_hp(jsonb, jsonb, int) from public, anon, authenticated;
