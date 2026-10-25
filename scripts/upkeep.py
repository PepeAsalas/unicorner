#!/usr/bin/env python3
"""Upkeep jobs run by .github/workflows/upkeep.yml.

  python3 scripts/upkeep.py health       daily: schedule, today's file, live site; refreshes sitemap dates
  python3 scripts/upkeep.py rejections   weekly: saves what players typed that was rejected (daily game)
  python3 scripts/upkeep.py report       weekly: writes the report as Markdown to stdout

health exits 1 and prints the problems when something is wrong.
"""
import datetime, glob, json, os, re, subprocess, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://unicornergame.lol'
MIN_DAYS_AHEAD = 5


def today():
    # the game day runs on Amsterdam time; the jobs run early morning UTC, which is the same day
    return (datetime.datetime.utcnow() + datetime.timedelta(hours=1)).date()


def get(url, timeout=30):
    req = urllib.request.Request(url, headers={'User-Agent': 'unicorner-upkeep'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read()


def supabase_rpc(fn, args):
    html = open(os.path.join(ROOT, 'index.html')).read()
    url = re.search(r'SB_URL="([^"]+)"', html).group(1)
    key = re.search(r'SB_KEY="([^"]+)"', html).group(1)
    req = urllib.request.Request(f'{url}/rest/v1/rpc/{fn}', data=json.dumps(args).encode(), method='POST',
                                 headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def last_day():
    files = sorted(glob.glob(os.path.join(ROOT, 'daily', '[0-9]*-[0-9]*-[0-9]*.json')))
    return datetime.date.fromisoformat(os.path.basename(files[-1])[:10])


def health():
    problems = []
    t = today()
    ahead = (last_day() - t).days
    if ahead < MIN_DAYS_AHEAD:
        problems.append(f'Only {ahead} days of daily questions left (last day {last_day()}). The Saturday routine may have failed.')
    path = os.path.join(ROOT, 'daily', f'{t}.json')
    try:
        d = json.load(open(path))
        if len(d.get('questions', [])) != 5 or any(not q.get('answers') for q in d['questions']):
            problems.append(f"Today's file daily/{t}.json does not have 5 questions with answers.")
    except Exception as e:
        problems.append(f"Today's file daily/{t}.json is missing or broken: {e}")
    for url, must in [(f'{SITE}/', 'Unicorner'), (f'{SITE}/es/', 'Unicorner'), (f'{SITE}/duel.html', 'Duel')]:
        try:
            status, body = get(url)
            if status != 200 or must.encode() not in body:
                problems.append(f'{url} answered {status} without the expected page.')
        except Exception as e:
            problems.append(f'{url} did not load: {e}')
    try:
        status, body = get(f'{SITE}/daily/{t}.json')
        json.loads(body)
    except Exception as e:
        problems.append(f"The live site does not serve today's questions ({SITE}/daily/{t}.json): {e}")
    try:
        bank = json.load(open(os.path.join(ROOT, 'duel', 'bank.json')))
        if len(bank) < 40:
            problems.append(f'The duel bank has only {len(bank)} questions.')
    except Exception as e:
        problems.append(f'duel/bank.json is broken: {e}')

    # keep the sitemap's homepage dates current (the questions change every day)
    sm = os.path.join(ROOT, 'sitemap.xml')
    s = open(sm).read()
    s2 = re.sub(r'(<loc>https://unicornergame\.lol/(es/)?</loc>\s*<lastmod>)[^<]*', rf'\g<1>{t}', s)
    if s2 != s:
        open(sm, 'w').write(s2)

    for p in problems:
        print(f'- {p}')
    if not problems:
        print(f'All good: {ahead} days of questions ahead, site and today\'s questions are live.')
    return 1 if problems else 0


def rejections():
    t = today()
    rows = supabase_rpc('upkeep_daily_rejections', {'days': 7})
    out = os.path.join(ROOT, 'daily', 'rejections', f'{t}.json')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump({'generated': str(t), 'days': 7, 'rows': rows}, open(out, 'w'), ensure_ascii=False, indent=1)
    print(f'{len(rows)} rejected answers saved to daily/rejections/{t}.json')
    return 0


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True).stdout


def report():
    t = today()
    lines = [f'## Unicorner weekly report, week to {t}', '']
    try:
        stats = supabase_rpc('upkeep_weekly_stats', {'days': 7})
        lines += ['### Players', '', '| Day | Visitors | Finished the daily | Avg score | Infinity runs | Duel answers | Reddit joins | Waitlist |', '|---|---|---|---|---|---|---|---|']
        for r in stats:
            lines.append(f"| {r['day']} | {r['visitors']} | {r['players']} | {r['avg_score'] or '-'} | {r['infinity_runs']} | {r['duel_rounds']} | {r['reddit_joins']} | {r['waitlist']} |")
        tot = lambda k: sum(r[k] or 0 for r in stats)
        lines += ['', f"**Week total:** {tot('players')} daily games finished, {tot('reddit_joins')} Reddit joins, {tot('waitlist')} Infinity waitlist sign-ups.", '']
    except Exception as e:
        lines += [f'Player numbers unavailable ({e}). Has supabase/upkeep.sql been run?', '']

    since = (t - datetime.timedelta(days=7)).isoformat()
    base = git('rev-list', '-1', f'--before={since}', 'HEAD').strip()
    day_re = re.compile(r'daily/(\d{4}-\d{2}-\d{2})\.json$')
    before = {m.group(1) for f in git('ls-tree', '--name-only', base, 'daily/').split() if (m := day_re.match(f))} if base else set()
    now = {os.path.basename(f)[:10] for f in glob.glob(os.path.join(ROOT, 'daily', '[0-9]*-[0-9]*-[0-9]*.json'))}
    new_days = sorted(now - before)
    changed = {m.group(1) for f in git('diff', '--name-only', base, 'HEAD', '--', 'daily/').split() if (m := day_re.match(f))} if base else set()
    fixed = sorted(d for d in changed & before if d < str(t))
    bank = len(json.load(open(os.path.join(ROOT, 'duel', 'bank.json'))))
    ahead = (last_day() - t).days
    lines += ['### Questions', '',
              f"- New daily days published: {len(new_days)}" + (f" ({new_days[0]} to {new_days[-1]})" if new_days else ' ⚠️ none: check the Saturday routine'),
              f"- Past days corrected from player answers: {len(fixed)}",
              f"- Daily schedule runs to {last_day()} ({ahead} days ahead)" + (' ⚠️' if ahead < MIN_DAYS_AHEAD else ''),
              f"- Duel bank: {bank} questions", '']
    print('\n'.join(lines))
    return 0


if __name__ == '__main__':
    job = sys.argv[1] if len(sys.argv) > 1 else ''
    sys.exit({'health': health, 'rejections': rejections, 'report': report}[job]())
