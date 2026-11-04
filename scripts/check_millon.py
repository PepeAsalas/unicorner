#!/usr/bin/env python3
"""Checks Millions day files (millon/YYYY-MM-DD.json). Usage: check_millon.py [files...] ; no args = all days."""
import json, glob, os, re, sys
from collections import Counter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COUNTS = [4, 4, 4, 3, 3, 3, 3, 2]
SAMPLE = {'2026-11-03', '2026-11-04', '2026-11-05'}  # the hand-written tester set, before these rules

def norm(s): return re.sub(r'[^a-z0-9]', '', s.lower())

def check(path, seen):
    errs = []
    try: d = json.load(open(path, encoding='utf-8'))
    except Exception as e: return [f'not valid JSON: {e}']
    day = os.path.basename(path)[:-5]
    if d.get('day') != day: errs.append('"day" does not match the file name')
    qs = d.get('questions') or []
    if len(qs) != 8: errs.append(f'needs 8 questions, has {len(qs)}')
    strict = day not in SAMPLE
    for i, q in enumerate(qs, 1):
        e = lambda m: errs.append(f'Q{i}: {m}')
        o = q.get('o') or []
        for k in ('q', 'q_es'):
            if not (q.get(k) or '').strip(): e(f'missing {k}')
        if strict:
            if i <= 8 and len(o) != COUNTS[i - 1]: e(f'needs {COUNTS[i-1]} options, has {len(o)}')
            for k in ('why', 'why_es', 'src'):
                if not (q.get(k) or '').strip(): e(f'missing {k}')
        if len({norm(x) for x in o}) != len(o): e('duplicate options')
        if 'o_es' in q and len(q['o_es']) != len(o): e('o_es must have the same length as o')
        if not isinstance(q.get('a'), int) or not 0 <= q['a'] < len(o): e('"a" is not a valid option index')
        if strict:
            k = norm(q.get('q', ''))
            if k in seen and seen[k] != day: e(f'question already used on {seen[k]}')
            seen.setdefault(k, day)
    if strict and len(qs) == 8:
        pos = Counter(q.get('a') for q in qs)
        if pos.most_common(1)[0][1] >= 5: errs.append('right answer sits in the same position too often: mix it up')
    return errs

if __name__ == '__main__':
    files = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, 'millon', '2*.json')))
    seen, bad = {}, 0
    for f in sorted(glob.glob(os.path.join(ROOT, 'millon', '2*.json'))):  # every earlier day counts for repeats
        if f not in files and os.path.basename(f)[:10] not in SAMPLE:
            for q in json.load(open(f, encoding='utf-8')).get('questions', []): seen.setdefault(norm(q.get('q', '')), os.path.basename(f)[:10])
    for f in files:
        es = check(f, seen)
        for m in es: print(f'{os.path.basename(f)}: {m}')
        bad += len(es)
    print(f'{len(files)} days, {bad} errors'); sys.exit(1 if bad else 0)
