#!/usr/bin/env python3
"""Check daily-game questions (see daily/QUESTIONS.md).

  python3 scripts/check_daily.py                   check the days written under these rules (from 2026-10-29)
  python3 scripts/check_daily.py --all             check every daily/*.json
  python3 scripts/check_daily.py FILE [FILE ...]   check only these days (against all the others for duplicates)
  python3 scripts/check_daily.py --coverage        last scheduled day and how many days ahead we are
  python3 scripts/check_daily.py --prompts         every prompt already used, to avoid repeats
Exit code 1 when anything fails.
"""
import json, re, sys, unicodedata, collections, os, glob, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DAILY = os.path.join(ROOT, 'daily')
TYPES = {'player', 'club', 'country', 'manager', 'stadium'}
REQUIRED = ('id', '_id', 'prompt', 'subtitle', 'difficulty', 'answer_type', 'scoring_version', 'answer_count', 'answers')
NEW = ('prompt_es', 'subtitle_es', 'format_family')
FIRST = '2026-10-29'  # earlier days predate daily/QUESTIONS.md
OPEN_ENDED = re.compile(r'\b(ever|all-time|to date|so far|present|now)\b', re.I)


def norm(s):
    s = unicodedata.normalize('NFD', str(s)).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def day_files():
    return sorted(glob.glob(os.path.join(DAILY, '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].json')))


def check_question(q, e, w):
    for k in REQUIRED:
        if k not in q:
            e(f'missing "{k}"')
    if 'answers' not in q or 'prompt' not in q:
        return
    if q.get('_id') != q.get('id'):
        e('_id must equal id')
    if q.get('difficulty') not in ('easy', 'medium', 'hard'):
        e('difficulty must be easy, medium or hard')
    if q.get('answer_type') not in TYPES:
        e(f"answer_type must be one of {sorted(TYPES)}")
    if q.get('scoring_version') != 2:
        e('new questions use scoring_version 2')
    for k in NEW:
        if not q.get(k):
            e(f'missing "{k}"')
    if OPEN_ENDED.search(q.get('subtitle', '')) or not re.search(r'\b(19|20)\d\d\b', q.get('subtitle', '') + q['prompt']):
        w('scope may be open-ended: give a range that ends at a finished season or tournament')
    t = q.get('answer_type')
    if t != 'player' and not re.match(rf'name an? (\S+ ){{0,6}}?{t}\b', q['prompt'][:60].lower()):
        e(f'a {t} question must start "Name a ..." and say "{t}" in the first 60 characters (the GitHub workflow rewrites it otherwise)')
    ans = q['answers']
    if q.get('answer_count') != len(ans):
        e(f"answer_count {q.get('answer_count')} but {len(ans)} answers")
    if not 10 <= len(ans) <= 80:
        e(f'{len(ans)} answers (need 10-80; aim for 20 or more)')
    elif len(ans) < 12 and q.get('format_family') != 'player_club_history':
        w(f'only {len(ans)} answers: need 12 or more (10 is only for a journeyman\'s clubs)')
    keys = collections.defaultdict(list)
    fames = collections.Counter()
    for a in ans:
        if not a.get('name'):
            e('answer without a name'); continue
        if a.get('fame') not in (1, 2, 3, 4, 5, 6):
            e(f"{a['name']}: fame must be 1-6")
        fames[a.get('fame')] += 1
        for k in {norm(a['name'])} | {norm(x) for x in a.get('aliases', []) if x}:
            if len(k) < 2:
                e(f"{a['name']}: alias too short")
            keys[k].append(a['name'])
    for k, names in keys.items():
        if len(set(names)) > 1:
            e(f'"{k}" matches more than one answer: {sorted(set(names))}')
    if fames[1] + fames[2] == 0:
        e('no fame 1-2 answer: nobody can hit a Screamer')
    if len(ans) >= 10 and fames[6] == 0:
        w('no fame-6 answer (nothing obvious)')
    if fames[6] > max(3, len(ans) * 0.3):
        w(f'{fames[6]} fame-6 answers: too many obvious ones')
    for t in q.get('traps', []):
        if not t.get('name') or not t.get('why') or not t.get('why_es'):
            e('trap needs name, why and why_es')
        elif ({norm(t['name'])} | {norm(x) for x in t.get('aliases', [])}) & set(keys):
            e(f"trap {t['name']} is also a valid answer")


def main(argv):
    files = day_files()
    if '--coverage' in argv:
        last = os.path.basename(files[-1])[:10]
        today = datetime.date.today()
        ahead = (datetime.date.fromisoformat(last) - today).days
        print(f'last scheduled day {last}: {ahead} days ahead of {today}')
        return 0
    if '--prompts' in argv:
        for f in files:
            for q in json.load(open(f))['questions']:
                print(os.path.basename(f)[:10], q.get('id'), q.get('prompt'), '|', q.get('subtitle'))
        return 0
    targets = [os.path.abspath(f) for f in argv if not f.startswith('--')] or \
        [f for f in files if '--all' in argv or os.path.basename(f)[:10] >= FIRST]
    errors, warns = [], []
    seen_ids, seen_prompts = {}, {}
    for f in files:
        for q in json.load(open(f))['questions']:
            seen_ids.setdefault(q.get('id'), []).append(f)
            seen_prompts.setdefault(norm(q.get('prompt', '')) + '|' + norm(q.get('subtitle', '')), []).append(f)
    for f in targets:
        name = os.path.basename(f)
        d = json.load(open(f))
        if d.get('date') != name[:10]:
            errors.append(f'{name}: date field {d.get("date")} does not match the file name')
        if d.get('timezone') != 'Europe/Amsterdam':
            errors.append(f'{name}: timezone must be Europe/Amsterdam')
        qs = d.get('questions', [])
        if len(qs) != 5:
            errors.append(f'{name}: {len(qs)} questions (need 5)')
        if not {q.get('difficulty') for q in qs} >= {'easy', 'hard'}:
            warns.append(f'{name}: a day should have at least one easy and one hard question')
        for i, q in enumerate(qs):
            tag = f"{name} #{i + 1} {q.get('prompt', '?')[:55]}"
            check_question(q, lambda m: errors.append(f'{tag}: {m}'), lambda m: warns.append(f'{tag}: {m}'))
            if len(seen_ids.get(q.get('id'), [])) > 1:
                errors.append(f'{tag}: id {q.get("id")} used more than once')
            k = norm(q.get('prompt', '')) + '|' + norm(q.get('subtitle', ''))
            if len(seen_prompts.get(k, [])) > 1:
                errors.append(f'{tag}: same prompt and scope also on {[os.path.basename(x) for x in seen_prompts[k] if x != f]}')
    for m in warns:
        print('warn ', m)
    for m in errors:
        print('ERROR', m)
    print(f'{len(targets)} days, {len(errors)} errors, {len(warns)} warnings')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
