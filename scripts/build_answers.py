#!/usr/bin/env python3
"""Build answers/index.html: the questions and every valid answer from the last 7 finished days.

Only past days (Amsterdam time) are ever published, never today's game. Run daily by the Upkeep
workflow after midnight; it also adds the page to sitemap.xml with today's date.
"""
import html
import json
import os
import re
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DAYS = 7
TIERS = {6: 'Tap-in', 5: 'Tap-in', 4: 'Header', 3: 'Volley', 2: 'Bicycle kick', 1: 'Screamer'}
TIER_ORDER = ['Screamer', 'Bicycle kick', 'Volley', 'Header', 'Tap-in']
TIER_CLASS = {'Screamer': 's', 'Bicycle kick': 'b', 'Volley': 'v', 'Header': 'h', 'Tap-in': 't'}
e = html.escape


def load(day):
    p = os.path.join(ROOT, 'daily', f'{day.isoformat()}.json')
    if not os.path.exists(p):
        return None
    d = json.load(open(p, encoding='utf-8'))
    return d['questions'] if isinstance(d, dict) else d


def day_html(day, qs):
    nice = day.strftime('%A %-d %B %Y')
    out = [f'<section class="day" id="{day.isoformat()}"><h2>{e(nice)}</h2>']
    for i, q in enumerate(qs, 1):
        groups = {}
        for a in q['answers']:
            groups.setdefault(TIERS.get(a.get('fame'), 'Volley'), []).append(a['name'])
        sub = f'<p class="sub">{e(q["subtitle"])}</p>' if q.get('subtitle') else ''
        out.append(f'<article class="q"><h3><span>Q{i}</span> {e(q["prompt"])}</h3>{sub}'
                   f'<p class="n">{len(q["answers"])} valid answers</p>')
        for t in TIER_ORDER:
            names = sorted(groups.get(t, []))
            if names:
                out.append(f'<p class="tier {TIER_CLASS[t]}"><b>{t}</b> {", ".join(e(n) for n in names)}</p>')
        out.append('</article>')
    out.append('</section>')
    return '\n'.join(out)


def main():
    today = datetime.now(ZoneInfo('Europe/Amsterdam')).date()
    days = [(d, load(d)) for d in (today - timedelta(n) for n in range(1, DAYS + 1))]
    days = [(d, q) for d, q in days if q]
    if not days:
        return
    latest = days[0][0]
    prompts = ' '.join(q['prompt'].rstrip('.?') + '?' for q in days[0][1])
    topics = ', '.join(q['prompt'].rstrip('.?') for q in days[0][1][:2])
    if len(topics) > 70:
        topics = topics[:67].rsplit(' ', 1)[0] + '…'
    body = '\n'.join(day_html(d, q) for d, q in days)
    nav = ' · '.join(f'<a href="#{d.isoformat()}">{d.strftime("%a %-d %b")}</a>' for d, _ in days)
    page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unicorner answers {latest.strftime("%-d %B %Y")}: {e(topics)}</title>
<meta name="description" content="All answers to Unicorner, {latest.strftime("%-d %B")}: {e(prompts)} Every valid answer from the last {len(days)} days of the daily football trivia game.">
<link rel="canonical" href="https://unicornergame.lol/answers/">
<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link href="https://fonts.googleapis.com/css2?family=Jersey+15&family=VT323&family=Barlow:wght@500;700&display=swap" rel="stylesheet">
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#1b1530;color:#f3ead2;font:500 16px/1.5 Barlow,system-ui,sans-serif}}
main{{max-width:760px;margin:0 auto;padding:24px 16px 48px}}a{{color:#ffd23f}}
h1{{font:400 44px/1 'Jersey 15',monospace;margin:0 0 8px;color:#ffd23f;text-shadow:3px 3px 0 #06041a}}
.lead{{color:#c9bff5;margin:0 0 16px}}.play{{display:inline-block;margin:0 0 18px;padding:12px 18px;background:#2fbf71;color:#04210f;border:3px solid #06041a;box-shadow:0 4px 0 #06041a;font:400 24px/1 'Jersey 15',monospace;text-decoration:none}}
nav{{font:18px VT323,monospace;margin:0 0 20px}}
.day h2{{font:400 30px/1 'Jersey 15',monospace;margin:28px 0 10px;padding:8px 12px;background:#d7262e;color:#fff;border:3px solid #06041a}}
.q{{background:#fbf3dc;color:#1a1030;border:3px solid #06041a;box-shadow:4px 4px 0 rgba(0,0,0,.4);padding:12px 14px;margin:0 0 12px}}
.q h3{{margin:0;font:700 18px/1.3 Barlow,sans-serif}}.q h3 span{{font:400 20px 'Jersey 15',monospace;background:#ffd23f;padding:0 6px;margin-right:4px}}
.sub{{margin:2px 0 0;color:#5b5070;font-size:14px}}.n{{margin:6px 0;font:17px VT323,monospace;color:#5b5070}}
.tier{{margin:4px 0;font-size:15px}}.tier b{{display:inline-block;min-width:96px;font:400 15px VT323,monospace;padding:0 6px;margin-right:6px;border:2px solid #06041a;color:#fff}}
.s b{{background:#d7262e}}.b b{{background:#ff6fb5}}.v b{{background:#7c4dff}}.h b{{background:#2fbf71}}.t b{{background:#6b6878}}
footer{{margin-top:30px;color:#c9bff5;font-size:14px}}
</style></head><body><main>
<h1>Unicorner answers</h1>
<p class="lead">Every valid answer to the last {len(days)} days of Unicorner, the free daily football trivia game. Rarer answers score more: a Screamer is an answer almost nobody gives.</p>
<a class="play" href="/">Play today's game ▶</a>
<nav>{nav}</nav>
{body}
<footer>Today's answers appear here after midnight (Amsterdam time). <a href="/">Back to Unicorner</a></footer>
</main></body></html>
'''
    os.makedirs(os.path.join(ROOT, 'answers'), exist_ok=True)
    open(os.path.join(ROOT, 'answers', 'index.html'), 'w', encoding='utf-8').write(page)

    sm = os.path.join(ROOT, 'sitemap.xml')
    s = open(sm, encoding='utf-8').read()
    entry = (f'  <url>\n    <loc>https://unicornergame.lol/answers/</loc>\n    <lastmod>{today.isoformat()}</lastmod>\n'
             f'    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n')
    if '/answers/</loc>' in s:
        s = re.sub(r'(<loc>https://unicornergame\.lol/answers/</loc>\s*<lastmod>)[^<]*', r'\g<1>' + today.isoformat(), s)
    else:
        s = s.replace('</urlset>', entry + '</urlset>')
    open(sm, 'w', encoding='utf-8').write(s)


if __name__ == '__main__':
    main()
