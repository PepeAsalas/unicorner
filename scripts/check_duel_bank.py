#!/usr/bin/env python3
"""Check duel questions (see duel/TEMPLATES.md).

  python3 scripts/check_duel_bank.py                 check duel/bank.json
  python3 scripts/check_duel_bank.py FILE            check a batch of new questions against the bank
  python3 scripts/check_duel_bank.py --merge FILE    check, then add the batch to duel/bank.json
  python3 scripts/check_duel_bank.py --stats         questions per template
Exit code 1 when anything fails.
"""
import json, re, sys, unicodedata, collections, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANK = os.path.join(ROOT, 'duel', 'bank.json')
TYPES = {'player', 'club', 'country', 'manager'}
TEMPLATES = range(1, 25)


def norm(s):
    s = unicodedata.normalize('NFD', str(s)).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', norm(s)).strip('-')


def check(qs, bank_prompts=frozenset(), bank_ids=frozenset()):
    errors, warns = [], []
    seen_ids, seen_prompts = set(), set()
    for i, q in enumerate(qs):
        tag = f"#{i} {q.get('prompt', '?')[:60]}"
        e = lambda m: errors.append(f'{tag}: {m}')
        w = lambda m: warns.append(f'{tag}: {m}')
        for k in ('id', 'template', 'prompt', 'time', 'answer_type', 'answers'):
            if k not in q:
                e(f'missing "{k}"')
        if errors and errors[-1].startswith(tag) and 'missing' in errors[-1]:
            continue
        if q['template'] not in TEMPLATES:
            e(f"template {q['template']} is not 1-24")
        if q['answer_type'] not in TYPES:
            e(f"answer_type {q['answer_type']} must be one of {sorted(TYPES)}")
        if q['time'] != 15:
            w('time is not 15')
        want = f"d{q['template']}-{slug(q['prompt'])}"
        if q['id'] != want:
            w(f'id should be {want}')
        if q['id'] in seen_ids or q['id'] in bank_ids:
            e('duplicate id')
        np = norm(q['prompt'])
        if np in seen_prompts or np in bank_prompts:
            e('same prompt already exists')
        seen_ids.add(q['id']); seen_prompts.add(np)
        ans = q['answers']
        if not 8 <= len(ans) <= 200:
            e(f'{len(ans)} answers (need 8-200)')
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
                # allowed: the game asks the player to type more of the name; only a full name may not be shared
                (e if any(norm(n) == k and ' ' in k for n in names) else w)(f'"{k}" matches more than one answer: {sorted(set(names))}')
            elif len(names) > 1:
                w(f'"{k}" repeated within {names[0]}')
        n = len(ans)
        if n >= 12:
            if fames[6] == 0:
                w('no fame-6 answer (nothing obvious)')
            if fames[6] > max(3, n * 0.25):
                w(f'{fames[6]} fame-6 answers: many obvious ones')
            if fames[1] + fames[2] == 0:
                w('no fame 1-2 answers: no Screamers possible')
        for t in q.get('traps', []):
            if not t.get('name') or not t.get('why'):
                e('trap needs name and why')
            elif norm(t['name']) in keys:
                e(f"trap {t['name']} is also a valid answer")
        if q['answer_type'] in ('player', 'manager'):
            if any(not a.get('aliases') and len(a['name'].split()) > 1 for a in ans):
                w('some person answers have no aliases (surname, short name)')
    return errors, warns


def main(argv):
    bank = json.load(open(BANK))
    if '--stats' in argv:
        c = collections.Counter(q['template'] for q in bank)
        for t in TEMPLATES:
            print(f'{t:>2}  {c.get(t, 0):>4}')
        print(f'total {len(bank)}')
        return 0
    merge = '--merge' in argv
    files = [a for a in argv if not a.startswith('--')]
    if files:
        batch = json.load(open(files[0]))
        errs, warns = check(batch, frozenset(norm(q['prompt']) for q in bank), frozenset(q['id'] for q in bank))
    else:
        batch = None
        errs, warns = check(bank)
    for m in warns:
        print('warn ', m)
    for m in errs:
        print('ERROR', m)
    label = files[0] if files else 'bank'
    print(f"{label}: {len(batch if batch is not None else bank)} questions, {len(errs)} errors, {len(warns)} warnings")
    if errs:
        return 1
    if merge and batch:
        bank.extend(batch)
        json.dump(bank, open(BANK, 'w'), ensure_ascii=False, separators=(',', ':'))
        print(f'merged: bank now has {len(bank)} questions')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
