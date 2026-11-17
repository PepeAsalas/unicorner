#!/usr/bin/env python3
"""Check Rosco days for answers players will expect to count but that we reject.

  python3 scripts/check_rosco.py              today and later days
  python3 scripts/check_rosco.py FILE ...     only these days
  add --fix to count them as right answers (moves them from 'others' into 'answers' with the nickname as an alias)
Flags, per 'starts' letter: a rejected name ('others') that people know by one word starting with that letter
(Ronaldo, Ronaldinho, Bojan, Edu, Juninho...), taken from the one-word aliases in the question banks.
Exit code 1 when anything is flagged.
"""
import glob
import json
import os
import sys
import unicodedata
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower().strip()


def aliases():
    """name -> one-word names people use for them, from every bank we have"""
    out = {}
    files = [os.path.join(ROOT, 'duel', 'bank.json')] + glob.glob(os.path.join(ROOT, 'daily', '*.json')) + glob.glob(os.path.join(ROOT, 'rosco', '*.json'))
    for f in files:
        try:
            d = json.load(open(f, encoding='utf-8'))
        except Exception:
            continue
        qs = d if isinstance(d, list) else d.get('questions') or d.get('letters') or [d]
        for q in qs:
            for a in (q.get('answers') or []) if isinstance(q, dict) else []:
                if not isinstance(a, dict) or not a.get('name'):
                    continue
                words = norm(a['name']).split()
                for al in a.get('aliases') or []:
                    w = norm(al)
                    # a one-word nickname that is not part of the name (Ronaldinho, Kun, Pippo); first names don't count (the rule is the surname)
                    if ' ' not in w and len(w) >= 3 and w not in words and not any(x.startswith(w) or w.startswith(x) for x in words):
                        out.setdefault(norm(a['name']), set()).add(w)
    return out


MONONYMS = {'ronaldo nazario': 'ronaldo', 'ronaldo de assis moreira': 'ronaldinho', 'bojan krkic': 'bojan', 'edu gaspar': 'edu',
            'juninho paulista': 'juninho', 'francisco roman alarcon suarez': 'isco', 'jorge resurreccion merodio': 'koke'}


def main():
    today = datetime.now(ZoneInfo('Europe/Amsterdam')).date().isoformat()
    files = [a for a in sys.argv[1:] if not a.startswith('--')] or [f for f in sorted(glob.glob(os.path.join(ROOT, 'rosco', '2*.json'))) if os.path.basename(f)[:10] >= today]
    al = aliases()
    bad = 0
    for f in files:
        d = json.load(open(f, encoding='utf-8'))
        changed = False
        for L in d['letters']:
            if L.get('mode') != 'starts' or L.get('answer_type') not in ('player', 'manager'):
                continue
            ok = {norm(x) for a in L['answers'] for x in [a['name']] + (a.get('aliases') or [])}
            for o in L.get('others') or []:
                known = set(al.get(norm(o), set()))
                if norm(o) in MONONYMS:
                    known.add(MONONYMS[norm(o)])
                hits = [w for w in known if w[:1] == L['letter'].lower() and w not in ok]
                if hits:
                    bad += 1
                    if '--fix' in sys.argv:
                        L['answers'].append({'name': o, 'aliases': sorted(hits)})
                        L['others'] = [x for x in L['others'] if x != o]
                        changed = True
                    print(f"{os.path.basename(f)[:10]} {L['letter']}: '{o}' is known as {', '.join(sorted(hits))} but is rejected ({L['prompt'][:60]})")
        if changed:
            json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'{bad} problem(s) in {len(files)} day(s)')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
