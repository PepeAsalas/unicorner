#!/usr/bin/env python3
"""Build football-trivia-mistakes/index.html (English) and es/errores-futbol/index.html (Spanish).

One page of the answers people often give that are WRONG, with the reason for each, taken from the "traps"
of past daily questions. It never lists the valid answers (those stay a reason to play and to get Infinity).
Only finished days are used (Amsterdam time). Run daily by the Upkeep workflow; adds both pages to sitemap.xml.
"""
import glob
import html
import json
import os
import re
from datetime import date, datetime
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
e = html.escape
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
TOPICS = [  # (en, es, pattern on the English prompt)
    ('Awards', 'Premios', r'golden|ballon|award|best player|top scorer|boot|golden boy'),
    ('World Cup & Euros', 'Mundiales y Eurocopas', r'world cup|euro|copa am[eé]rica|nations'),
    ('Clubs & leagues', 'Clubes y ligas', r'club|league|premier|liga|serie a|bundesliga|ligue|cup'),
    ('Players & managers', 'Jugadores y entrenadores', r'.'),
]


def entries(today):
    out = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'daily', '2*.json')), reverse=True):
        day = os.path.basename(f)[:-5]
        if day >= today:
            continue
        d = json.load(open(f, encoding='utf-8'))
        for q in (d['questions'] if isinstance(d, dict) else d):
            traps = [t for t in (q.get('traps') or []) if t.get('why')]
            if traps:
                out.append((day, q, traps))
    return out


def page(es, items, today):
    n_q, n_t = len(items), sum(len(t) for _, _, t in items)
    groups = {}
    for day, q, traps in items:
        for en_name, es_name, pat in TOPICS:
            if re.search(pat, q['prompt'], re.I):
                groups.setdefault(es_name if es else en_name, []).append((day, q, traps))
                break
    order = [(t[1] if es else t[0]) for t in TOPICS]
    nice = (lambda d: f'{int(d[8:])} de {MESES[int(d[5:7]) - 1]} de {d[:4]}') if es else (lambda d: date.fromisoformat(d).strftime('%-d %B %Y'))
    parts, toc = [], []
    for gi, g in enumerate([g for g in order if g in groups], 1):
        slug = f'g{gi}'
        toc.append(f'<a href="#{slug}">{e(g)} ({sum(len(t) for _, _, t in groups[g])})</a>')
        parts.append(f'<section id="{slug}"><h2>{e(g)}</h2>')
        for day, q, traps in groups[g]:
            prompt = (q.get('prompt_es') or q['prompt']) if es else q['prompt']
            sub = (q.get('subtitle_es') or q.get('subtitle')) if es else q.get('subtitle')
            lis = ''.join(
                f'<li><b>✗ {e(t["name"])}</b> {e((t.get("why_es") or t["why"]) if es else t["why"])}</li>' for t in traps)
            parts.append(
                f'<article class="q"><h3>{e(prompt)}</h3>'
                + (f'<p class="sub">{e(sub)}</p>' if sub else '')
                + f'<p class="meta">{"Partido del" if es else "Played on"} {nice(day)} · {q.get("answer_count") or len(q["answers"])} {"respuestas válidas" if es else "valid answers"}</p>'
                + f'<p class="wl">{"Respuestas que la gente da y no valen:" if es else "Answers people give that are wrong:"}</p><ul>{lis}</ul></article>')
        parts.append('</section>')
    home = '/es/' if es else '/'
    canon = 'https://unicornergame.lol/es/errores-futbol/' if es else 'https://unicornergame.lol/football-trivia-mistakes/'
    alt = ('<link rel="alternate" hreflang="en" href="https://unicornergame.lol/football-trivia-mistakes/">'
           '<link rel="alternate" hreflang="es" href="https://unicornergame.lol/es/errores-futbol/">')
    if es:
        title = f'Errores de fútbol: {n_t} respuestas que la gente cree correctas y no lo son | Unicorner'
        desc = f'{n_t} respuestas de fútbol que mucha gente da por buenas y son falsas, con la explicación de cada una. Sacadas de {n_q} preguntas de Unicorner.'
        h1, lead = 'Errores de fútbol que casi todo el mundo comete', f'En Unicorner cada pregunta tiene muchas respuestas válidas, y algunas trampas. Aquí tienes {n_t} respuestas que la gente da muy convencida y no son correctas, con el porqué de cada una. No te damos las respuestas buenas: para eso, juega.'
        play, bar, foot = 'Juega el partido de hoy ▶', '¿Sabes de fútbol? Cinco preguntas nuevas cada día.', 'Se añaden errores nuevos a medida que se juegan partidos.'
    else:
        title = f'Football trivia mistakes: {n_t} answers people think are right (but aren\'t) | Unicorner'
        desc = f'{n_t} football answers that lots of people are sure about and get wrong, each with the reason. Taken from {n_q} Unicorner quiz questions.'
        h1, lead = 'Football trivia mistakes almost everyone makes', f'Every Unicorner question has many right answers, and a few traps. These are {n_t} answers people give with total confidence that are wrong, with the reason for each. We don\'t list the right answers here: for those, you have to play.'
        play, bar, foot = 'Play today\'s game ▶', 'Think you know ball? Five new questions every day.', 'New mistakes are added as more games are played.'
    return f'''<!doctype html>
<html lang="{'es' if es else 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canon}">{alt}
<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link rel="stylesheet" href="/fonts/fonts.css">
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#1d1a2b;color:#f3ead2;font:500 16px/1.5 Barlow,system-ui,sans-serif}}
main{{max-width:760px;margin:0 auto;padding:24px 16px 48px}}a{{color:#f2c230}}
h1{{font:400 42px/1 'Jersey 10',monospace;margin:0 0 10px;color:#f2c230}}
.lead{{color:#e9dfc2;margin:0 0 14px}}
.play{{display:inline-block;margin:0 0 16px;padding:12px 18px;background:#2f9a62;color:#fbf6e8;border:3px solid #1d1a2b;box-shadow:0 4px 0 #000;font:400 24px/1 'Jersey 10',monospace;text-decoration:none}}
nav{{display:grid;gap:4px;font:19px VT323,monospace;margin:0 0 10px}}
h2{{font:400 30px/1 'Jersey 10',monospace;margin:28px 0 10px;padding:8px 12px;background:#c8473b;color:#fff;border:3px solid #000}}
.q{{background:#fbf6e8;color:#1d1a2b;border:3px solid #000;box-shadow:4px 4px 0 rgba(0,0,0,.4);padding:12px 14px;margin:0 0 12px}}
.q h3{{margin:0;font:700 18px/1.3 Barlow,sans-serif}}.sub{{margin:2px 0 0;color:#5d566b;font-size:14px}}
.meta{{margin:4px 0 0;font:16px VT323,monospace;color:#5d566b}}.wl{{margin:10px 0 4px;font-weight:700;font-size:14px}}
ul{{margin:0;padding:0;list-style:none;display:grid;gap:8px}}li{{font-size:15px;line-height:1.45}}li b{{display:block;color:#c8473b}}
footer{{margin-top:30px;color:#e9dfc2;font-size:14px}}
.hero{{display:flex;align-items:center;gap:14px;margin:-24px -16px 18px;padding:22px 16px;background:linear-gradient(rgba(27,21,48,.35),#1d1a2b),url(/bg/floodlit-wide.webp) center/cover;border-bottom:3px solid #000;text-decoration:none}}.hero img{{width:72px;height:72px;image-rendering:pixelated;border:3px solid #000}}.hero b{{font:400 34px/1 'Jersey 10',monospace;color:#f2c230}}.hero small{{display:block;font:18px VT323,monospace;color:#fff}}
.bar{{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:24px -16px -48px;padding:10px 16px;background:#fbf6e8;color:#1d1a2b;border-top:3px solid #000;font:700 15px Barlow,sans-serif}}.bar .play{{white-space:nowrap;margin:0;font-size:20px;padding:8px 14px}}
</style></head><body><main>
<a class="hero" href="{home}"><img src="/favicon-512.png" alt="Unicorner"><span><b>Unicorner</b><small>{'trivia de fútbol diaria y gratis ▶ juega ya' if es else 'free daily football trivia ▶ play now'}</small></span></a>
<h1>{e(h1)}</h1>
<p class="lead">{e(lead)}</p>
<a class="play" href="{home}">{play}</a>
<nav>{''.join(toc)}</nav>
{''.join(parts)}
<footer>{foot} <a href="{home}">Unicorner</a> · <a href="{'/es/preguntas-futbol/' if es else '/football-trivia-questions/'}">{'Preguntas de fútbol' if es else 'Trivia questions'}</a> · <a href="/how-to-play.html">{'Cómo se juega' if es else 'How to play'}</a></footer>
<div class="bar"><span>{bar}</span><a class="play" href="{home}">{'Jugar ▶' if es else 'Play ▶'}</a></div>
</main></body></html>
'''


def main():
    today = datetime.now(ZoneInfo('Europe/Amsterdam')).date().isoformat()
    items = entries(today)
    if not items:
        return
    for es, out in ((False, 'football-trivia-mistakes'), (True, os.path.join('es', 'errores-futbol'))):
        os.makedirs(os.path.join(ROOT, out), exist_ok=True)
        open(os.path.join(ROOT, out, 'index.html'), 'w', encoding='utf-8').write(page(es, items, today))
    sm = os.path.join(ROOT, 'sitemap.xml')
    s = open(sm, encoding='utf-8').read()
    for loc in ('https://unicornergame.lol/football-trivia-mistakes/', 'https://unicornergame.lol/es/errores-futbol/'):
        if f'<loc>{loc}</loc>' in s:
            s = re.sub(r'(<loc>' + re.escape(loc) + r'</loc>\s*<lastmod>)[^<]*', r'\g<1>' + today, s)
        else:
            s = s.replace('</urlset>', f'  <url>\n    <loc>{loc}</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>')
    open(sm, 'w', encoding='utf-8').write(s)
    print(len(items), 'questions,', sum(len(t) for _, _, t in items), 'mistakes')


if __name__ == '__main__':
    main()
