#!/usr/bin/env python3
"""Build football-trivia-questions/index.html: a party quiz made from past Unicorner daily questions and the duel bank.

Questions are sorted into rounds by topic; each answer list is hidden behind "Show answers" so friends can
play it out loud. Only past daily games are used (never today's or the scheduled future ones). Run daily by
the Upkeep workflow, which also keeps it in sitemap.xml.
"""
import glob
import html
import json
import os
import re
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PER_ROUND = 10
TIERS = {6: 't', 5: 't', 4: 'h', 3: 'v', 2: 'b', 1: 's'}
ROUNDS = [
    ('Premier League & England', r'premier league|england|english|fa cup|league cup|chelsea|arsenal|liverpool|man(chester)? (united|city)|tottenham|everton|newcastle|aston villa|west ham'),
    ('La Liga & Spain', r'la liga|spain|spanish|real madrid|barcelona|atl[eé]tico|copa del rey|sevilla|valencia'),
    ('World Cup & Euros', r'world cup|euro|copa am[eé]rica|africa cup|asian cup|nations league'),
    ('Champions League & Europe', r'champions league|european cup|europa league|uefa cup|ballon'),
    ('Italy, Germany & France', r'serie a|italy|italian|juventus|milan|inter|napoli|roma|bundesliga|germany|german|bayern|dortmund|ligue 1|france|french|psg|paris'),
    ('Managers & mixed bag', r'.'),
]
e = html.escape


def questions():
    today = datetime.now(ZoneInfo('Europe/Amsterdam')).date().isoformat()
    out, seen = [], set()
    for f in sorted(glob.glob(os.path.join(ROOT, 'daily', '2*.json')), reverse=True):
        if os.path.basename(f)[:-5] >= today:
            continue
        d = json.load(open(f, encoding='utf-8'))
        out += d['questions'] if isinstance(d, dict) else d
    out += json.load(open(os.path.join(ROOT, 'duel', 'bank.json'), encoding='utf-8'))
    good = []
    for q in out:
        key = q['prompt'].strip().lower()
        if key in seen or not q.get('answers') or len(q['answers']) > 40:
            continue
        seen.add(key)
        good.append(q)
    return good


def main():
    qs = questions()
    rounds, used = [], set()
    for name, pat in ROUNDS:
        rx = re.compile(pat, re.I)
        pick = [q for q in qs if id(q) not in used and (rx.search(q['prompt']) or (name.startswith('Managers') and q.get('answer_type') == 'manager'))]
        if name.startswith('Managers'):
            pick.sort(key=lambda q: q.get('answer_type') != 'manager')
        pick = pick[:PER_ROUND]
        used.update(id(q) for q in pick)
        if pick:
            rounds.append((name, pick))
    n = 0
    parts, toc = [], []
    for r, (name, pick) in enumerate(rounds, 1):
        slug = f'round-{r}'
        toc.append(f'<a href="#{slug}">Round {r}: {e(name)}</a>')
        parts.append(f'<section id="{slug}"><h2>Round {r}: {e(name)}</h2>')
        for q in pick:
            n += 1
            ans = sorted(q['answers'], key=lambda a: (-(a.get('fame') or 3), a['name']))
            sub = f'<p class="sub">{e(q["subtitle"])}</p>' if q.get('subtitle') else ''
            names = ''.join(f'<li class="{TIERS.get(a.get("fame"), "v")}">{e(a["name"])}</li>' for a in ans)
            parts.append(f'<article class="q"><h3><span>{n}</span> {e(q["prompt"])}</h3>{sub}'
                         f'<details><summary>Show the {len(ans)} answers</summary><ul>{names}</ul></details></article>')
        parts.append('</section>')
    page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{n} football trivia questions and answers for a quiz night | Unicorner</title>
<meta name="description" content="{n} football quiz questions with every valid answer, in {len(rounds)} rounds: Premier League, La Liga, World Cup, Champions League and more. Test your mates' ball knowledge at a party or in the pub.">
<link rel="canonical" href="https://unicornergame.lol/football-trivia-questions/">
<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link href="https://fonts.googleapis.com/css2?family=Jersey+15&family=VT323&family=Barlow:wght@500;700&display=swap" rel="stylesheet">
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#1d1a2b;color:#f3ead2;font:500 16px/1.5 Barlow,system-ui,sans-serif}}
main{{max-width:760px;margin:0 auto;padding:24px 16px 48px}}a{{color:#f2c230}}
h1{{font:400 42px/1 'Jersey 15',monospace;margin:0 0 10px;color:#f2c230;text-shadow:3px 3px 0 #1d1a2b}}
.lead{{color:#e9dfc2;margin:0 0 10px}}.how{{background:#1d4486;border:2px solid #1d1a2b;padding:10px 14px;margin:0 0 16px;font-size:15px}}
.how b{{color:#f2c230}}.play{{display:inline-block;margin:0 0 16px;padding:12px 18px;background:#2f9a62;color:#fbf6e8;border:3px solid #1d1a2b;box-shadow:0 4px 0 #1d1a2b;font:400 24px/1 'Jersey 15',monospace;text-decoration:none}}
nav{{display:grid;gap:4px;font:19px VT323,monospace;margin:0 0 10px}}
h2{{font:400 30px/1 'Jersey 15',monospace;margin:28px 0 10px;padding:8px 12px;background:#c8473b;color:#fff;border:3px solid #1d1a2b}}
.q{{background:#fbf6e8;color:#1d1a2b;border:3px solid #1d1a2b;box-shadow:4px 4px 0 rgba(0,0,0,.4);padding:12px 14px;margin:0 0 12px}}
.q h3{{margin:0;font:700 18px/1.3 Barlow,sans-serif}}.q h3 span{{font:400 20px 'Jersey 15',monospace;background:#f2c230;padding:0 6px;margin-right:4px}}
.sub{{margin:2px 0 0;color:#5d566b;font-size:14px}}
summary{{cursor:pointer;margin-top:8px;font:18px VT323,monospace;color:#c8473b}}
ul{{display:flex;flex-wrap:wrap;gap:4px;list-style:none;margin:8px 0 0;padding:0}}li{{font-size:14px;padding:1px 7px;border:2px solid #1d1a2b;background:#fff}}
li.s{{background:#c8473b;color:#fff}}li.b{{background:#ff6fb5}}li.v{{background:#c9b8ff}}
footer{{margin-top:30px;color:#e9dfc2;font-size:14px}}
.hero{{position:relative;display:flex;align-items:center;gap:14px;margin:-24px -16px 18px;padding:22px 16px;background:linear-gradient(rgba(27,21,48,.35),#1d1a2b),url(/bg/floodlit-wide.webp) center/cover;border-bottom:3px solid #1d1a2b;text-decoration:none}}.hero img{{width:72px;height:72px;image-rendering:pixelated;border:3px solid #1d1a2b;background:#fbf6e8}}.hero b{{font:400 34px/1 'Jersey 15',monospace;color:#f2c230;text-shadow:3px 3px 0 #1d1a2b}}.hero small{{display:block;font:18px VT323,monospace;color:#fff}}.bar{{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:24px -16px -48px;padding:10px 16px;background:#fbf6e8;color:#1d1a2b;border-top:3px solid #1d1a2b;font:700 15px Barlow,sans-serif}}.bar .play{{white-space:nowrap;margin:0;font-size:20px;padding:8px 14px}}</style></head><body><main>
<a class="hero" href="/"><img src="/favicon-512.png" alt="Unicorner"><span><b>Unicorner</b><small>free daily football trivia ▶ play now</small></span></a>
<h1>Football trivia questions and answers</h1>
<p class="lead">{n} football quiz questions in {len(rounds)} rounds, made from real Unicorner games. Every question has many correct answers, so it's perfect for a party, the pub or a long car journey.</p>
<p class="how"><b>How to play with friends:</b> read a question out loud and go round the group. Everyone names one valid answer, no repeats. Get it wrong or freeze for 5 seconds and you're out. Last one standing wins the round. Bonus point for a <b>Screamer</b> (red): an answer almost nobody thinks of.</p>
<a class="play" href="/">Play today's daily game ▶</a>
<nav>{''.join(toc)}</nav>
{''.join(parts)}
<footer>New questions are added as Unicorner grows. Want yesterday's answers? See <a href="/answers/">past answers</a>. <a href="/">Back to Unicorner</a></footer>
<div class="bar"><span>Think you know ball? Five new questions every day.</span><a class="play" href="/">Play ▶</a></div>
</main></body></html>
'''
    os.makedirs(os.path.join(ROOT, 'football-trivia-questions'), exist_ok=True)
    open(os.path.join(ROOT, 'football-trivia-questions', 'index.html'), 'w', encoding='utf-8').write(page)


if __name__ == '__main__':
    main()
