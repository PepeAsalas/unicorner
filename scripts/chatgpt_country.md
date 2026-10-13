You have access to my Supabase project for Unicorner (project ref yujhjepukzdahsppntua). Please run the SQL below on it, exactly as written, as one migration (SQL Editor or apply_migration). Do not change, shorten or "improve" it.

What it does (so you can sanity-check, not to rewrite it):
1. Adds a function public.events_set_country() and a BEFORE INSERT trigger "events_set_country" on public.events.
2. On every new event row it reads the request header cf-ipcountry (added by Supabase's Cloudflare edge) and stores only the 2-letter country code in the row's data column as data.country (e.g. "ES", "GB"). It never stores the IP. If the header is missing or invalid, the event is still saved, just without a country.
3. It does not change any existing rows, columns, policies or grants on public.events.

Before running, please check and tell me:
- select data_type from information_schema.columns where table_schema='public' and table_name='events' and column_name='data';  -> tell me if it is json or jsonb (the SQL works with both)

After running, please check and report back:
- select tgname, tgenabled from pg_trigger where tgrelid='public.events'::regclass and not tgisinternal;  -> should include events_set_country
- Tell me if anything errors, and paste the exact error message.

Then wait: I will open the website once. After I say "done", run this and paste the result:
- select name, created_at, data->>'src' as src, data->>'country' as country from public.events order by created_at desc limit 5;
  -> the newest rows should show a country code like ES or GB. If country is empty on new rows, tell me, and also run:
     select current_setting('request.headers', true);  (it will be empty from the SQL editor, that's expected — just confirm)

SQL:

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
