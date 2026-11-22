#!/usr/bin/env python3
"""Build the public question archive: one page per Daily 5 question and one page per day, in English, Spanish and
Brazilian Portuguese, for every day at least ARCHIVE_DELAY days old (newer days stay part of Infinity mode).

  /questions/<slug>/        /es/preguntas/<slug>/        /pt/perguntas/<slug>/     every valid answer to one question
  /answers/<day>/           /es/respuestas/<day>/        /pt/respostas/<day>/      that day's five questions
  /questions/               /es/preguntas/               /pt/perguntas/            the index of them all
Writes sitemap-archive.xml (listed in robots.txt). Run daily by the Upkeep workflow; safe to run any time.
"""
import glob
import html
import json
import os
import re
import unicodedata
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://unicornergame.lol'
ARCHIVE_DELAY = 30
e = html.escape
TIERS = {6: 'Tap-in', 5: 'Tap-in', 4: 'Header', 3: 'Volley', 2: 'Bicycle kick', 1: 'Screamer'}
ORDER = ['Screamer', 'Bicycle kick', 'Volley', 'Header', 'Tap-in']
CLS = {'Screamer': 's', 'Bicycle kick': 'b', 'Volley': 'v', 'Header': 'h', 'Tap-in': 't'}
PTS = {'Screamer': 100, 'Bicycle kick': 85, 'Volley': 60, 'Header': 30, 'Tap-in': 10}

L = {
 'en': dict(home='/', qdir='questions', ddir='answers', html='en', locale='en_GB',
   tier={'Screamer': 'Screamer', 'Bicycle kick': 'Bicycle kick', 'Volley': 'Volley', 'Header': 'Header', 'Tap-in': 'Tap-in'},
   months=['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
   days=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
   date=lambda d, M, D: f'{D[d.weekday()]} {d.day} {M[d.month - 1]} {d.year}',
   n_answers='{n} valid answers', played='Played on {d} in Unicorner, the free daily football trivia game.',
   scoring='In Unicorner, rarer answers score more: a Tap-in (the answer everyone gives) is worth 10 points, a Screamer (an answer almost nobody thinks of) is worth 100.',
   all_answers='All answers', mistakes='Answers that did not count', related='More questions like this',
   day_link='All five questions from {d}', play='Play today\'s game ▶', bar='Think you know ball? Five new questions every day.',
   q_title='{p}: all {n} answers | Unicorner', q_desc='{p}. All {n} valid answers{sub}, from the rarest Screamers to the obvious Tap-ins, plus the near misses that don\'t count.',
   d_title='Unicorner answers, {d}: all five questions', d_desc='Every valid answer to the five Unicorner questions of {d}: {ps}',
   d_h1='Unicorner answers · {d}', d_lead='The five questions of the daily football trivia game on {d}, with every valid answer.',
   idx_title='Football trivia questions with every answer | Unicorner archive', idx_h1='Question archive',
   idx_desc='{n} football trivia questions from Unicorner\'s daily game, each with its complete list of valid answers: squads, clubs, managers, stadiums and countries.',
   idx_lead='Every Daily 5 question from more than {k} days ago, with its full list of answers. Newer questions are part of Infinity mode.',
   types={'player': 'Players', 'club': 'Clubs', 'manager': 'Managers', 'country': 'Countries', 'stadium': 'Stadiums'},
   prev='◀ Previous day', next='Next day ▶', archive='Question archive', back='Back to Unicorner'),
 'es': dict(home='/es/', qdir='es/preguntas', ddir='es/respuestas', html='es', locale='es_ES',
   tier={'Screamer': 'Qué chicharro', 'Bicycle kick': 'Chilena', 'Volley': 'Volea', 'Header': 'Remate', 'Tap-in': 'Empujarla'},
   months=['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
   days=['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
   date=lambda d, M, D: f'{D[d.weekday()]} {d.day} de {M[d.month - 1]} de {d.year}',
   n_answers='{n} respuestas válidas', played='Se jugó el {d} en Unicorner, el juego diario y gratis de preguntas de fútbol.',
   scoring='En Unicorner, las respuestas más raras puntúan más: Empujarla (la que da todo el mundo) vale 10 puntos y un «Qué chicharro» (una respuesta en la que casi nadie piensa) vale 100.',
   all_answers='Todas las respuestas', mistakes='Respuestas que no contaban', related='Más preguntas como esta',
   day_link='Las cinco preguntas del {d}', play='Juega el partido de hoy ▶', bar='¿Sabes de fútbol? Cinco preguntas nuevas cada día.',
   q_title='{p}: las {n} respuestas | Unicorner', q_desc='{p}. Las {n} respuestas válidas{sub}, de los chicharros más raros a las más obvias, y los fallos típicos que no cuentan.',
   d_title='Respuestas de Unicorner, {d}: las cinco preguntas', d_desc='Todas las respuestas válidas de las cinco preguntas de Unicorner del {d}: {ps}',
   d_h1='Respuestas de Unicorner · {d}', d_lead='Las cinco preguntas del juego diario de fútbol del {d}, con todas las respuestas válidas.',
   idx_title='Preguntas de fútbol con todas las respuestas | Archivo de Unicorner', idx_h1='Archivo de preguntas',
   idx_desc='{n} preguntas de fútbol del juego diario de Unicorner, cada una con su lista completa de respuestas válidas: plantillas, clubes, entrenadores, estadios y selecciones.',
   idx_lead='Todas las preguntas del Daily 5 de hace más de {k} días, con su lista completa de respuestas. Las más recientes son parte del Modo Infinito.',
   types={'player': 'Jugadores', 'club': 'Clubes', 'manager': 'Entrenadores', 'country': 'Selecciones', 'stadium': 'Estadios'},
   prev='◀ Día anterior', next='Día siguiente ▶', archive='Archivo de preguntas', back='Volver a Unicorner'),
 'pt': dict(home='/pt/', qdir='pt/perguntas', ddir='pt/respostas', html='pt-BR', locale='pt_BR',
   tier={'Screamer': 'Golaço', 'Bicycle kick': 'Bicicleta', 'Volley': 'Voleio', 'Header': 'Cabeçada', 'Tap-in': 'Empurrãozinho'},
   months=['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
   days=['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo'],
   date=lambda d, M, D: f'{D[d.weekday()]}, {d.day} de {M[d.month - 1]} de {d.year}',
   n_answers='{n} respostas válidas', played='Pergunta do Unicorner de {d}, o quiz diário e grátis de futebol.',
   scoring='No Unicorner, respostas mais raras valem mais: um Empurrãozinho (a que todo mundo dá) vale 10 pontos, e um Golaço (uma resposta em que quase ninguém pensa) vale 100.',
   all_answers='Todas as respostas', mistakes='Respostas que não contavam', related='Mais perguntas como esta',
   day_link='As cinco perguntas de {d}', play='Jogar o jogo de hoje ▶', bar='Entende de bola? Cinco perguntas novas todo dia.',
   q_title='{p}: todas as {n} respostas | Unicorner', q_desc='{p}. Todas as {n} respostas válidas{sub}, dos golaços mais raros às mais óbvias, e os quase-acertos que não contam.',
   d_title='Respostas do Unicorner, {d}: as cinco perguntas', d_desc='Todas as respostas válidas das cinco perguntas do Unicorner de {d}: {ps}',
   d_h1='Respostas do Unicorner · {d}', d_lead='As cinco perguntas do quiz diário de futebol de {d}, com todas as respostas válidas.',
   idx_title='Perguntas de futebol com todas as respostas | Arquivo do Unicorner', idx_h1='Arquivo de perguntas',
   idx_desc='{n} perguntas de futebol do jogo diário do Unicorner, cada uma com a lista completa de respostas válidas: elencos, clubes, técnicos, estádios e seleções.',
   idx_lead='Todas as perguntas do Diário 5 de mais de {k} dias atrás, com a lista completa de respostas. As mais recentes fazem parte do Modo Infinito.',
   types={'player': 'Jogadores', 'club': 'Clubes', 'manager': 'Técnicos', 'country': 'Seleções', 'stadium': 'Estádios'},
   prev='◀ Dia anterior', next='Próximo dia ▶', archive='Arquivo de perguntas', back='Voltar ao Unicorner'),
}
SUFFIX = {'en': '', 'es': '_es', 'pt': '_pt'}

CSS = '''*{box-sizing:border-box}body{margin:0;background:#1d1a2b;color:#f3ead2;font:500 16px/1.5 Barlow,system-ui,sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 48px}a{color:#f2c230}
h1{font:400 40px/1.05 'Jersey 15',monospace;margin:0 0 8px;color:#f2c230;text-shadow:3px 3px 0 #1d1a2b}
h2{font:400 26px/1 'Jersey 15',monospace;margin:26px 0 10px;color:#fff}
.lead{color:#e9dfc2;margin:0 0 14px}.sub{color:#cfc6ad;margin:-2px 0 12px}
.play{display:inline-block;margin:6px 0 16px;padding:12px 18px;background:#2f9a62;color:#fbf6e8;border:3px solid #1d1a2b;box-shadow:0 4px 0 #1d1a2b;font:400 24px/1 'Jersey 15',monospace;text-decoration:none}
.card{background:#fbf6e8;color:#1d1a2b;border:3px solid #1d1a2b;box-shadow:4px 4px 0 rgba(0,0,0,.4);padding:12px 14px;margin:0 0 12px}
.card h3{margin:0 0 4px;font:700 18px/1.3 Barlow,sans-serif}.card h3 a{color:#1d1a2b}.n{margin:4px 0;font:17px VT323,monospace;color:#5d566b}
.tier{margin:6px 0;font-size:15px}.tier b{display:inline-block;min-width:116px;font:400 15px VT323,monospace;padding:0 6px;margin-right:6px;border:2px solid #1d1a2b;color:#fff}
.s b{background:#c8473b}.b b{background:#ff6fb5}.v b{background:#7c4dff}.h b{background:#2f9a62}.t b{background:#6b6878}
ul.miss{margin:0;padding-left:18px}ul.miss li{margin:4px 0}ul.links{padding-left:18px}ul.links li{margin:4px 0}
.pn{display:flex;justify-content:space-between;gap:10px;margin:18px 0;font:18px VT323,monospace}
footer{margin-top:30px;color:#e9dfc2;font-size:14px}
.hero{display:flex;align-items:center;gap:14px;margin:-24px -16px 18px;padding:22px 16px;background:linear-gradient(rgba(27,21,48,.35),#1d1a2b),url(/bg/floodlit-wide.webp) center/cover;border-bottom:3px solid #1d1a2b;text-decoration:none}
.hero img{width:64px;height:64px;image-rendering:pixelated;border:3px solid #1d1a2b;background:#fbf6e8}.hero b{font:400 32px/1 'Jersey 15',monospace;color:#f2c230;text-shadow:3px 3px 0 #1d1a2b}.hero small{display:block;font:18px VT323,monospace;color:#fff}
.bar{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:24px -16px -48px;padding:10px 16px;background:#fbf6e8;color:#1d1a2b;border-top:3px solid #1d1a2b;font:700 15px Barlow,sans-serif}.bar .play{white-space:nowrap;margin:0;font-size:20px;padding:8px 14px}'''


def slugify(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r"['’]", '', s)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:70].rstrip('-')


def tx(q, k, lang):
    return q.get(k + SUFFIX[lang]) or q.get(k) or ''


def aname(a, lang):
    return a.get('name' + SUFFIX[lang]) or a['name'] if lang != 'en' else a['name']


def why(t, lang):
    return t.get('why' + SUFFIX[lang]) or t.get('why') or ''


def page(lang, path, title, desc, body, alts, ld=None):
    c = L[lang]
    alt = ''.join(f'<link rel="alternate" hreflang="{L[k]["html"]}" href="{BASE}/{p}">' for k, p in alts.items())
    alt += f'<link rel="alternate" hreflang="x-default" href="{BASE}/{alts["en"]}">'
    ldj = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>' if ld else ''
    return f'''<!doctype html>
<html lang="{c["html"]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{BASE}/{path}">
{alt}
<meta property="og:type" content="article"><meta property="og:site_name" content="Unicorner"><meta property="og:url" content="{BASE}/{path}">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:locale" content="{c["locale"]}">
<meta property="og:image" content="{BASE}/og-image.jpg"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon-32.png" sizes="32x32"><link rel="stylesheet" href="/fonts/fonts.css">
<style>{CSS}</style>{ldj}</head><body><main>
<a class="hero" href="{c["home"]}"><img src="/favicon-512.png" alt="Unicorner"><span><b>Unicorner</b><small>{e(c["bar"])}</small></span></a>
{body}
<footer><a href="/{c["qdir"]}/">{e(c["archive"])}</a> · <a href="{c["home"]}">{e(c["back"])}</a></footer>
<div class="bar"><span>{e(c["bar"])}</span><a class="play" href="{c["home"]}">{e(c["play"])}</a></div>
</main></body></html>
'''


def tiers_html(q, lang):
    c, groups = L[lang], {}
    for a in q['answers']:
        groups.setdefault(TIERS.get(a.get('fame'), 'Volley'), []).append(aname(a, lang))
    out = []
    for t in ORDER:
        names = sorted(set(groups.get(t, [])), key=lambda s: unicodedata.normalize('NFKD', s).lower())
        if names:
            out.append(f'<p class="tier {CLS[t]}"><b>{e(c["tier"][t])} · {PTS[t]}</b> {", ".join(e(n) for n in names)}</p>')
    return '\n'.join(out)


def main():
    today = datetime.now(ZoneInfo('Europe/Amsterdam')).date()
    cutoff = today - timedelta(days=ARCHIVE_DELAY)
    days = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'daily', '2*.json'))):
        d = date.fromisoformat(os.path.basename(f)[:10])
        if d <= cutoff:
            qs = json.load(open(f, encoding='utf-8'))
            days.append((d, qs['questions'] if isinstance(qs, dict) else qs))
    # one slug per question, from the English prompt, unique across the archive
    slugs, used = {}, set()
    for d, qs in days:
        for q in qs:
            s = slugify(q['prompt']) or q['id']
            if s in used:
                s = f'{s}-{q["id"]}'
            used.add(s)
            slugs[q['id']] = s
    by_type = {}
    for d, qs in days:
        for q in qs:
            by_type.setdefault(q.get('answer_type') or 'player', []).append((d, q))
    urls = []
    for lang, c in L.items():
        M, D = c['months'], c['days']
        nice = lambda d: c['date'](d, M, D)
        qalts = lambda s: {k: f'{L[k]["qdir"]}/{s}/' for k in L}
        dalts = lambda d: {k: f'{L[k]["ddir"]}/{d.isoformat()}/' for k in L}
        # question pages
        for i, (d, qs) in enumerate(days):
            for q in qs:
                s, p = slugs[q['id']], tx(q, 'prompt', lang)
                sub = tx(q, 'subtitle', lang)
                n = len(q['answers'])
                body = [f'<h1>{e(p)}</h1>']
                if sub:
                    body.append(f'<p class="sub">{e(sub)}</p>')
                body.append(f'<p class="lead">{e(c["played"].format(d=nice(d)))} {e(c["scoring"])}</p>')
                body.append(f'<a class="play" href="{c["home"]}">{e(c["play"])}</a>')
                body.append(f'<h2>{e(c["all_answers"])} ({n})</h2><div class="card">{tiers_html(q, lang)}</div>')
                traps = [t for t in q.get('traps', []) if t.get('name') and why(t, lang)]
                if traps:
                    body.append(f'<h2>{e(c["mistakes"])}</h2><div class="card"><ul class="miss">' +
                                ''.join(f'<li><b>{e(aname(t, lang))}</b>: {e(why(t, lang))}</li>' for t in traps) + '</ul></div>')
                rel = [x for x in by_type.get(q.get('answer_type') or 'player', []) if x[1]['id'] != q['id']]
                rel = sorted(rel, key=lambda x: abs((x[0] - d).days))[:6]
                if rel:
                    body.append(f'<h2>{e(c["related"])}</h2><ul class="links">' +
                                ''.join(f'<li><a href="/{c["qdir"]}/{slugs[x[1]["id"]]}/">{e(tx(x[1], "prompt", lang))}</a></li>' for x in rel) + '</ul>')
                body.append(f'<p><a href="/{c["ddir"]}/{d.isoformat()}/">{e(c["day_link"].format(d=nice(d)))}</a></p>')
                names = [aname(a, lang) for a in sorted(q['answers'], key=lambda a: a.get('fame', 3))]
                desc = c['q_desc'].format(p=p.rstrip('.'), n=n, sub=(f' ({sub[:80]})' if sub else ''))
                ld = {'@context': 'https://schema.org', '@graph': [
                    {'@type': 'ItemList', 'name': p, 'numberOfItems': n, 'itemListElement': [{'@type': 'ListItem', 'position': j + 1, 'name': x} for j, x in enumerate(names)]},
                    {'@type': 'BreadcrumbList', 'itemListElement': [
                        {'@type': 'ListItem', 'position': 1, 'name': 'Unicorner', 'item': BASE + c['home']},
                        {'@type': 'ListItem', 'position': 2, 'name': c['archive'], 'item': f'{BASE}/{c["qdir"]}/'},
                        {'@type': 'ListItem', 'position': 3, 'name': p, 'item': f'{BASE}/{c["qdir"]}/{s}/'}]}]}
                path = f'{c["qdir"]}/{s}/'
                out = os.path.join(ROOT, path)
                os.makedirs(out, exist_ok=True)
                open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(
                    page(lang, path, c['q_title'].format(p=p.rstrip('.'), n=n), desc, '\n'.join(body), qalts(s), ld))
                urls.append((path, d))
        # day pages
        for i, (d, qs) in enumerate(days):
            cards = []
            for q in qs:
                s = slugs[q['id']]
                cards.append(f'<div class="card"><h3><a href="/{c["qdir"]}/{s}/">{e(tx(q, "prompt", lang))}</a></h3>'
                             f'<p class="n">{e(c["n_answers"].format(n=len(q["answers"])))}</p>{tiers_html(q, lang)}</div>')
            pn = '<div class="pn">' + (f'<a href="/{c["ddir"]}/{days[i - 1][0].isoformat()}/">{e(c["prev"])}</a>' if i > 0 else '<span></span>') + \
                 (f'<a href="/{c["ddir"]}/{days[i + 1][0].isoformat()}/">{e(c["next"])}</a>' if i + 1 < len(days) else '<span></span>') + '</div>'
            body = f'<h1>{e(c["d_h1"].format(d=nice(d)))}</h1><p class="lead">{e(c["d_lead"].format(d=nice(d)))} {e(c["scoring"])}</p>' \
                   f'<a class="play" href="{c["home"]}">{e(c["play"])}</a>\n' + '\n'.join(cards) + pn
            ps = ' '.join(tx(q, 'prompt', lang).rstrip('.?') + '.' for q in qs)
            path = f'{c["ddir"]}/{d.isoformat()}/'
            out = os.path.join(ROOT, path)
            os.makedirs(out, exist_ok=True)
            open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(
                page(lang, path, c['d_title'].format(d=nice(d)), c['d_desc'].format(d=nice(d), ps=ps)[:300], body, dalts(d)))
            urls.append((path, d))
        # index
        n = sum(len(qs) for _, qs in days)
        sections = []
        for t in ['player', 'club', 'manager', 'country', 'stadium']:
            items = sorted(by_type.get(t, []), key=lambda x: x[0], reverse=True)
            if items:
                sections.append(f'<h2>{e(c["types"][t])} ({len(items)})</h2><ul class="links">' +
                                ''.join(f'<li><a href="/{c["qdir"]}/{slugs[q["id"]]}/">{e(tx(q, "prompt", lang))}</a></li>' for _, q in items) + '</ul>')
        dl = '<h2>' + e(c['archive']) + ' · ' + ('days' if lang == 'en' else 'días' if lang == 'es' else 'dias') + '</h2><ul class="links">' + \
             ''.join(f'<li><a href="/{c["ddir"]}/{d.isoformat()}/">{e(nice(d))}</a></li>' for d, _ in reversed(days)) + '</ul>'
        body = f'<h1>{e(c["idx_h1"])}</h1><p class="lead">{e(c["idx_lead"].format(k=ARCHIVE_DELAY))}</p><a class="play" href="{c["home"]}">{e(c["play"])}</a>' + ''.join(sections) + dl
        path = f'{c["qdir"]}/'
        os.makedirs(os.path.join(ROOT, path), exist_ok=True)
        open(os.path.join(ROOT, path, 'index.html'), 'w', encoding='utf-8').write(
            page(lang, path, c['idx_title'], c['idx_desc'].format(n=n), body, {k: f'{L[k]["qdir"]}/' for k in L}))
        urls.append((path, today))
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path, d in urls:
        sm.append(f'  <url><loc>{BASE}/{path}</loc><lastmod>{d.isoformat()}</lastmod></url>')
    sm.append('</urlset>')
    open(os.path.join(ROOT, 'sitemap-archive.xml'), 'w', encoding='utf-8').write('\n'.join(sm) + '\n')
    print(f'archive: {len(days)} days, {sum(len(q) for _, q in days)} questions, {len(urls)} pages')


if __name__ == '__main__':
    main()
    import add_gtag  # Google tag on every page, regenerated ones included
    add_gtag.main()
