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
ORDER = 'ABCDEFGHIJKLMNOPRSTUVWYZ'  # no Q or X: too few fair clues
MAX_LETTERS = 25
EASY = 11  # letters per Rosco with a better-known answer (was 9; players found it too hard)
STARS = 4  # letters per Rosco whose answer is a superstar (fame 6): a few gimmes to get going
CONTAINS = 5  # letters per Rosco that ask 'contains the letter' instead of 'starts with' (easier: more answers fit)
CLUB_PREFIX = re.compile(r'^(FC|AFC|SC|AC|AS|SS|CF|CD|UD|RC|SL|SV|VfB|VfL|1\. ?FC|Real|Club|Sporting|Atlético|Athletic|Deportivo)\s+', re.I)
# open-ended prompts ("a Brazilian left-back") are risky: our lists can't be complete. A clue needs a clear limit.
BOUNDED = re.compile(r'\d|squad|won|winning|captain|final|scorer|top three|ballon|golden|cup|champion|title', re.I)


def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').upper()


PARTICLES = {'van', 'de', 'der', 'den', 'di', 'da', 'dos', 'das', 'del', 'le', 'la', 'von', 'el', 'al', 'ter', 'ten', 'do', 'du', 'des', 'della', 'dei'}
# particles people say as part of the surname (van Persie, De Bruyne, Di María, Del Piero, Le Saux): those surnames count
# for the particle's letter too, so van Persie is fine for V and for P (players asked for both)
LEAD = {'van', 'de', 'di', 'del', 'le', 'la', 'von', 'ter', 'ten', 'den', 'der'}


def surnames(name):
    """The words a person can be called by: everything after the first name, without particles (de, van, ...)."""
    words = [w for w in name.replace('-', ' ').split() if w.lower() not in PARTICLES]
    return words[1:] if len(words) > 1 else words


def key(name, kind):
    """The letter an answer counts for: the first surname for people (Víctor Valdés Arribas -> V), the main word for clubs and countries."""
    if kind in ('player', 'manager'):
        return norm(surnames(name)[0])[:1]
    return norm(CLUB_PREFIX.sub('', name))[:1]


def obvious(name, kind):
    """Only answers whose letter nobody would argue about can be a letter's answer: 'first name + surname' players with no
    particle (no De Cuyper, Di Lorenzo, Van Dijk) and clubs whose name doesn't start with a word we skip (no Atlético Madrid, Real Betis)."""
    if kind in ('player', 'manager'):
        words = name.replace('-', ' ').split()
        return len(words) == 2 and not any(w.lower() in PARTICLES for w in words)
    return not CLUB_PREFIX.match(name)


def letters_of(name, kind):
    """Every letter a typed answer could fairly claim: any surname word for people (Valdés or Arribas)."""
    if kind in ('player', 'manager'):
        out = {norm(w)[:1] for w in surnames(name)}
        words = name.replace('-', ' ').split()
        core = [w for w in words if w.lower() not in PARTICLES]
        lead = [w for w in words[1:] if w.lower() in PARTICLES]
        if len(core) == 2 and lead and all(w.lower() in LEAD for w in lead):
            out.add(norm(lead[0])[:1])
        return out
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
    by_letter, contains = {}, {}
    for q in questions:
        kind = q.get('answer_type', 'player')
        if kind == 'country' or not q.get('prompt_es') or (q.get('subtitle') and not q.get('subtitle_es')):
            continue  # country names start with different letters in Spanish (USA / Estados Unidos); every clue needs its Spanish text
        for letter in ORDER:
            # 'contains': the letter is somewhere in the surname (club: main name) but it doesn't start with it
            inside = [a for a in q['answers'] if obvious(a['name'], kind) and letter in norm(surnames(a['name'])[-1] if kind in ('player', 'manager') else CLUB_PREFIX.sub('', a['name']))[1:]]
            if 1 <= len(inside) <= 3 and len(q['answers']) >= 8:
                fame = sum((a.get('fame') or 3) for a in inside) / len(inside)
                if 3.5 <= fame <= 5.5:
                    contains.setdefault(letter, []).append((q, inside, fame))
        for letter in ORDER:
            # targets: answers known by that letter; anyone else with a surname on that letter also counts, so the cap includes them
            # (clean 'first name + surname' only, so the clue is always about the surname: no full legal names, no one-name players like Xavi)
            answers = [a for a in q['answers'] if key(a['name'], kind) == letter and obvious(a['name'], kind)]
            fair = [a for a in q['answers'] if letter in letters_of(a['name'], kind)]
            if not answers or not 1 <= len(fair) <= 4:
                continue
            fame = sum((a.get('fame') or 3) for a in answers) / len(answers)
            # superstars (fame 6) are too easy for any letter; the rest is sorted into hard and easier letters in build()
            if any((a.get('fame') or 3) >= 6 for a in answers):
                fame = 6  # a superstar clue: only used for the STARS letters
            elif fame > (5.5 if kind in ('player', 'manager') else 4):
                continue
            by_letter.setdefault(letter, []).append((q, fair, fame))
    return by_letter, contains


def build(day, questions, recent):
    rng = random.Random('rosco-' + day)
    by_letter, contains = candidates(questions)
    used, items = set(), []
    # a few letters ask 'contains' instead: prefer the letters with the fewest 'starts with' clues
    cl = [l for l in ORDER if contains.get(l)]
    cl.sort(key=lambda l: (len(by_letter.get(l, [])), rng.random()))
    inside = set(rng.sample(cl[:10], min(CONTAINS, len(cl[:10]))))
    # most letters are hard; EASY of them get a better-known answer (a well-known player, not a superstar)
    stars = set(rng.sample([l for l in ORDER if any(c[2] == 6 for c in by_letter.get(l, []))], min(STARS, len([l for l in ORDER if any(c[2] == 6 for c in by_letter.get(l, []))]))))
    easy = set(rng.sample([l for l in ORDER if by_letter.get(l) and l not in stars], EASY))
    for letter in ORDER:
        if letter in inside:
            pool = [c for c in contains[letter] if c[0]['prompt'] not in used and c[0]['prompt'] not in recent] or contains[letter]
            q, _, _ = rng.choice(pool)
            used.add(q['prompt'])
            # every valid answer with the letter anywhere in its name counts (Rivaldo for I, Zlatan for Z), not just the picked targets
            answers = []
            for a in q['answers']:
                # the shown (and accepted) name must contain the letter: if only an alias has it, that alias is the name
                if letter in norm(a['name']):
                    answers.append(a)
                else:
                    al = next((x for x in (a.get('aliases') or []) if letter in norm(x)), None)
                    if al:
                        answers.append({**a, 'name': al, 'aliases': [a['name']] + [x for x in a['aliases'] if x != al]})
            items.append({'letter': letter, 'mode': 'contains', 'prompt': q['prompt'], 'subtitle': q.get('subtitle') or '',
                          'prompt_es': q.get('prompt_es') or '', 'subtitle_es': q.get('subtitle_es') or '', 'answer_type': q.get('answer_type', 'player'),
                          'answers': [{'name': a['name'], 'aliases': a.get('aliases') or []} for a in answers],
                          'others': [n for n in (a['name'] for a in q['answers']) if n not in {x['name'] for x in answers} and n not in {y for x in answers for y in x.get('aliases', [])}][:400]})
            continue
        pool = [c for c in by_letter.get(letter, []) if c[0]['prompt'] not in used and c[0]['prompt'] not in recent]
        def known(c):
            return c[0].get('answer_type', 'player') in ('player', 'manager') and 4.5 <= c[2] <= 5.5 or c[0].get('answer_type') in ('club', 'country') and 3 <= c[2] <= 4
        def hard(c):
            return c[0].get('answer_type', 'player') in ('player', 'manager') and 2 <= c[2] <= 4 or c[0].get('answer_type') in ('club', 'country') and c[2] <= 2
        def star(c):
            return c[2] == 6
        pool = [c for c in pool if (star if letter in stars else known if letter in easy else hard)(c)] or [c for c in pool if hard(c)] or [c for c in pool if not star(c)] or pool
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
    return {"date": day, "seconds": 300, 'letters': items}


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
