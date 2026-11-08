#!/usr/bin/env python3
"""Add short explanations of tricky football terms to today's and future Daily 5, Rosco and Millions games.

Daily 5 and Rosco: appended to each question's subtitle (English and Spanish).
Millions: a note under the question ('n' / 'n_es'), shown by millon.html.
Terms and wording live in football_terms.py. Safe to run again: it never adds the same explanation twice.
Run by the Upkeep workflow every night, after the Rosco builder.
"""
import glob
import json
import os
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from football_terms import explain, merge  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    today = datetime.now(ZoneInfo('Europe/Amsterdam')).date().isoformat()
    changed = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'rosco', '2*.json'))):
        if os.path.basename(f)[:-5] < today:
            continue
        d = json.load(open(f, encoding='utf-8'))
        before = json.dumps(d, ensure_ascii=False)
        for it in d['letters']:
            ex = explain(it['prompt'], it.get('subtitle') or '')
            if ex:
                it['subtitle'] = merge(it.get('subtitle') or '', [en for en, _ in ex])
                it['subtitle_es'] = merge(it.get('subtitle_es') or '', [es for _, es in ex])
        if json.dumps(d, ensure_ascii=False) != before:
            json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
            changed.append(os.path.relpath(f, ROOT))
    for f in sorted(glob.glob(os.path.join(ROOT, 'daily', '2*.json'))):
        if os.path.basename(f)[:-5] < today:
            continue
        d = json.load(open(f, encoding='utf-8'))
        before = json.dumps(d, ensure_ascii=False)
        for q in (d['questions'] if isinstance(d, dict) else d):
            ex = explain(q['prompt'], q.get('subtitle') or '')
            if ex:
                q['subtitle'] = merge(q.get('subtitle') or '', [en for en, _ in ex])
                q['subtitle_es'] = merge(q.get('subtitle_es') or '', [es for _, es in ex])
        if json.dumps(d, ensure_ascii=False) != before:
            json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
            changed.append(os.path.relpath(f, ROOT))
    for f in sorted(glob.glob(os.path.join(ROOT, 'millon', '2*.json'))):
        if os.path.basename(f)[:-5] < today:
            continue
        d = json.load(open(f, encoding='utf-8'))
        before = json.dumps(d, ensure_ascii=False)
        for q in d['questions']:
            ex = explain(q['q'] + ' ' + ' '.join(q.get('o') or []))
            if ex:
                q['n'] = merge(q.get('n') or '', [en for en, _ in ex])
                q['n_es'] = merge(q.get('n_es') or '', [es for _, es in ex])
        if json.dumps(d, ensure_ascii=False) != before:
            json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            changed.append(os.path.relpath(f, ROOT))
    print('explained:', ', '.join(changed) or 'nothing new')


if __name__ == '__main__':
    main()
