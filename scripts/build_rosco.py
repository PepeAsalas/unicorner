#!/usr/bin/env python3
"""Build the daily Rosco: rosco/YYYY-MM-DD.json, one hard clue per letter, made from our own question bank.

Each letter gets a question from a past daily game or the duel bank where only 1-4 valid answers start with
that letter (for players and managers: the surname, as on the shirt). Hard letters with no good clue are
skipped for the day, like on the show. The same date always builds the same Rosco (seeded by the date).

Usage: python scripts/build_rosco.py [days ahead, default 3]   (today and the next days, Amsterdam time)
"""
import glob
import json
import os
import random
import re
import sys
import unicodedata
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORDER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
MAX_LETTERS = 25
CLUB_PREFIX = re.compile(r'^(FC|AFC|SC|AC|AS|SS|CF|CD|UD|RC|SL|SV|VfB|VfL|1\. ?FC|Real|Club|Sporting|Atlético|Athletic|Deportivo)\s+', re.I)
# open-ended prompts ("a Brazilian left-back") are risky: our lists can't be complete. A clue needs a clear limit.
BOUNDED = re.compile(r'\d|squad|won|winning|captain|final|scorer|top three|ballon|golden|cup|champion|title', re.I)


def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').upper()


PARTICLES = {'van', 'de', 'der', 'den', 'di', 'da', 'dos', 'das', 'del', 'le', 'la', 'von', 'el', 'al', 'ter', 'ten'}


def surnames(name):
    """The words a person can be called by: everything after the first name, without particles (de, van, ...)."""
    words = [w for w in name.replace('-', ' ').split() if w.lower() not in PARTICLES]
    return words[1:] if len(words) > 1 else words


def key(name, kind):
    """The letter an answer counts for: the first surname for people (Víctor Valdés Arribas -> V), the main word for clubs and countries."""
    if kind in ('player', 'manager'):
        return norm(surnames(name)[0])[:1]
    return norm(CLUB_PREFIX.sub('', name))[:1]


def letters_of(name, kind):
    """Every letter a typed answer could fairly claim: any surname word for people (Valdés or Arribas)."""
    if kind in ('player', 'manager'):
        return {norm(w)[:1] for w in surnames(name)}
    return {key(name, kind)}


def bank(today):
    out, seen = [], set()
    files = [f for f in glob.glob(os.path.join(ROOT, 'daily', '2*.json')) if os.path.basename(f)[:-5] < today]
    for f in sorted(files):
        d = json.load(open(f, encoding='utf-8'))
        out += d['questions'] if isinstance(d, dict) else d
    out += json.load(open(os.path.join(ROOT, 'duel', 'bank.json'), encoding='utf-8'))
    good = []
    for q in out:
        k = q['prompt'].strip().lower()
        if k in seen or not q.get('answers'):
            continue
        seen.add(k)
        text = q['prompt'] + ' ' + (q.get('subtitle') or '')
        if len(q['answers']) < 6 or not BOUNDED.search(text) or re.search(r'starts? with|letter|surname', text, re.I):
            continue
        good.append(q)
    return good


def candidates(questions):
    by_letter = {}
    for q in questions:
        kind = q.get('answer_type', 'player')
        for letter in ORDER:
            # targets: answers known by that letter; anyone else with a surname on that letter also counts, so the cap includes them
            # (clean names only: our data sometimes has full legal names like 'Sergio Leonel Agüero')
            answers = [a for a in q['answers'] if key(a['name'], kind) == letter and (kind not in ('player', 'manager') or len(surnames(a['name'])) == 1)]
            fair = [a for a in q['answers'] if letter in letters_of(a['name'], kind)]
            if not answers or not 1 <= len(fair) <= 4:
                continue
            fame = sum((a.get('fame') or 3) for a in answers) / len(answers)
            # the obvious names make it too easy; clubs and countries must be rare ones
            if fame > (4 if kind in ('player', 'manager') else 2):
                continue
            by_letter.setdefault(letter, []).append((q, fair, fame))
    return by_letter


def build(day, questions, recent):
    rng = random.Random('rosco-' + day)
    by_letter = candidates(questions)
    used, items = set(), []
    for letter in ORDER:
        pool = [c for c in by_letter.get(letter, []) if c[0]['prompt'] not in used and c[0]['prompt'] not in recent]
        # hard but fair: prefer fame around 2-4 (Volley, Header), avoid only-Screamer letters most days
        pool = [c for c in pool if 2 <= c[2] <= 4] or pool
        if not pool:
            continue
        q, answers, _ = rng.choice(pool)
        used.add(q['prompt'])
        kind = q.get('answer_type', 'player')
        items.append({
            'letter': letter,
            'mode': 'starts',
            'prompt': q['prompt'],
            'subtitle': q.get('subtitle') or '',
            'prompt_es': q.get('prompt_es') or '',
            'subtitle_es': q.get('subtitle_es') or '',
            'answer_type': kind,
            'answers': [{'name': a['name'], 'aliases': a.get('aliases') or []} for a in answers],
            # every other valid answer to the question: typed one of these and it's right, just the wrong letter
            'others': [a['name'] for a in q['answers'] if a not in answers][:400],
        })
    # the hardest letters go first when there are too many
    while len(items) > MAX_LETTERS:
        items.remove(min((i for i in items if i['letter'] in 'KQWXY'), key=lambda i: i['letter'], default=items[-1]))
    return {"date": day, "seconds": 180, 'letters': items}


def main():
    ahead = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    today = datetime.now(ZoneInfo('Europe/Amsterdam')).date()
    os.makedirs(os.path.join(ROOT, 'rosco'), exist_ok=True)
    for n in range(ahead + 1):
        day = (today + timedelta(n)).isoformat()
        path = os.path.join(ROOT, 'rosco', day + '.json')
        if os.path.exists(path):
            continue  # a published Rosco never changes
        recent = set()
        for back in range(1, 15):  # no clue repeats within two weeks
            p = os.path.join(ROOT, 'rosco', (date.fromisoformat(day) - timedelta(back)).isoformat() + '.json')
            if os.path.exists(p):
                recent |= {i['prompt'] for i in json.load(open(p, encoding='utf-8'))['letters']}
        r = build(day, bank(today.isoformat()), recent)
        json.dump(r, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print(day, len(r['letters']), 'letters, skipped', ''.join(c for c in ORDER if c not in {i['letter'] for i in r['letters']}) or 'none')


if __name__ == '__main__':
    main()
