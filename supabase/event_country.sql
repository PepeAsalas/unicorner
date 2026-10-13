-- ── Country on analytics events ──
-- Every insert into public.events gets data.country = the visitor's 2-letter country code (ES, GB, …),
-- read from the CF-IPCountry header that Supabase's Cloudflare edge adds to each API request.
-- Only the code is stored, never the IP. The browser can't set or fake it: any "country" it sends is replaced.
create or replace function public.events_set_country()
returns trigger language plpgsql security definer set search_path = public as $$
declare h json; cc text;
begin
  begin h := nullif(current_setting('request.headers', true), '')::json; exception when others then h := null; end;
  cc := upper(coalesce(h->>'cf-ipcountry', ''));
  if cc !~ '^[A-Z]{2}$' or cc in ('XX', 'T1') then cc := null; end if;
  new.data := (coalesce(new.data::jsonb, '{}'::jsonb) - 'country')
              || case when cc is null then '{}'::jsonb else jsonb_build_object('country', cc) end;
  return new;
exception when others then
  return new;  -- never block an event because of this
end $$;
revoke all on function public.events_set_country() from public, anon, authenticated;

drop trigger if exists events_set_country on public.events;
create trigger events_set_country before insert on public.events
  for each row execute function public.events_set_country();
