#!/usr/bin/env python3
"""Move old analytics events out of the database into private Supabase Storage.

Run weekly by .github/workflows/upkeep.yml (job "archive"). For every UTC day older than KEEP_DAYS that still
has rows in public.events, it:
  1. downloads all of that day's rows,
  2. saves them as events/YYYY-MM-DD.ndjson.gz in the private bucket "events-archive",
  3. downloads the file back and checks it holds every row,
  4. only then deletes that day's rows from the database.
A day that fails any check is left in the database and retried next week.

Needs SUPABASE_SERVICE_ROLE_KEY (GitHub secret). Run with --dry-run to see what would happen without changing anything.
"""
import datetime, gzip, json, os, re, sys, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEEP_DAYS = 21          # the site reads at most ~2 weeks of events (trophies, answer shares, player counts)
MAX_DAYS_PER_RUN = 60   # bounded so one run never takes too long
BUCKET = 'events-archive'
PAGE = 1000

URL = re.search(r'SB_URL="([^"]+)"', open(os.path.join(ROOT, 'index.html')).read()).group(1)
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
DRY = '--dry-run' in sys.argv


def req(method, path, body=None, headers=None, raw=False):
    h = {'apikey': KEY, 'Authorization': f'Bearer {KEY}'}
    h.update(headers or {})
    data = body if isinstance(body, (bytes, type(None))) else json.dumps(body).encode()
    if data is not None and 'Content-Type' not in h:
        h['Content-Type'] = 'application/json'
    r = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=120) as resp:
            out = resp.read()
            return resp, (out if raw else (json.loads(out) if out else None))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'{method} {path.split("?")[0]}: HTTP {e.code} {e.read().decode(errors="replace")[:300]}') from None


def count(lo, hi):
    resp, _ = req('HEAD', f'/rest/v1/events?select=id&created_at=gte.{lo}&created_at=lt.{hi}', headers={'Prefer': 'count=exact'})
    return int(resp.headers.get('Content-Range', '*/0').split('/')[-1])


def oldest_day():
    _, rows = req('GET', '/rest/v1/events?select=created_at&order=created_at.asc&limit=1')
    return datetime.date.fromisoformat(rows[0]['created_at'][:10]) if rows else None


def fetch_day(lo, hi):
    rows, last = [], 0
    while True:
        _, page = req('GET', f'/rest/v1/events?select=*&created_at=gte.{lo}&created_at=lt.{hi}&id=gt.{last}&order=id.asc&limit={PAGE}')
        rows += page
        if len(page) < PAGE:
            return rows
        last = page[-1]['id']


def ensure_bucket():
    try:
        req('GET', f'/storage/v1/bucket/{BUCKET}')
    except RuntimeError:
        if not DRY:
            req('POST', '/storage/v1/bucket', {'id': BUCKET, 'name': BUCKET, 'public': False})
            print(f'created private bucket {BUCKET}')


def main():
    if not KEY:
        print('SUPABASE_SERVICE_ROLE_KEY is not set: add it as a GitHub secret (see the workflow file).')
        return 1
    ensure_bucket()
    cutoff = datetime.datetime.now(datetime.timezone.utc).date() - datetime.timedelta(days=KEEP_DAYS)
    day = oldest_day()
    if not day or day >= cutoff:
        print(f'Nothing older than {cutoff} to archive.')
        return 0
    done = failed = 0
    while day < cutoff and done + failed < MAX_DAYS_PER_RUN:
        lo, hi = f'{day}T00:00:00Z', f'{day + datetime.timedelta(days=1)}T00:00:00Z'
        n = count(lo, hi)
        if n:
            try:
                rows = fetch_day(lo, hi)
                if len(rows) != n:
                    raise RuntimeError(f'fetched {len(rows)} rows but the table has {n}')
                blob = gzip.compress('\n'.join(json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in rows).encode(), 9)
                path = f'{BUCKET}/events/{day}.ndjson.gz'
                if DRY:
                    print(f'{day}: would archive {n} rows ({len(blob) // 1024} KB) and delete them')
                else:
                    req('POST', f'/storage/v1/object/{path}', blob, {'Content-Type': 'application/gzip', 'x-upsert': 'true'})
                    _, back = req('GET', f'/storage/v1/object/{path}', raw=True)
                    if len(gzip.decompress(back).splitlines()) != n:
                        raise RuntimeError('the saved file does not contain every row')
                    max_id = rows[-1]['id']
                    req('DELETE', f'/rest/v1/events?created_at=gte.{lo}&created_at=lt.{hi}&id=lte.{max_id}', headers={'Prefer': 'return=minimal'})
                    print(f'{day}: archived and removed {n} rows ({len(blob) // 1024} KB)')
                done += 1
            except Exception as e:
                failed += 1
                print(f'{day}: FAILED, left in the database: {e}')
        day += datetime.timedelta(days=1)
    print(f'{done} days archived, {failed} failed.')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
