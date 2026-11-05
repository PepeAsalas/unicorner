"""Build es/index.html (the Spanish page at unicornergame.lol/es/) from index.html.

The game is the same file; this only changes what search engines and link previews read first:
language, title, description, canonical URL, social tags, the FAQ data and the about/FAQ text,
plus <base href="/"> so the page's relative links (daily/, privacy.html) still point at the site root.
The page itself switches to Spanish because its path starts with /es/.

Run after changing index.html:  python3 scripts/build_es.py
(A GitHub workflow also runs it on every push that touches index.html.)
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'index.html', ROOT / 'es' / 'index.html'

TITLE = 'Unicorner – Juego diario de trivia de fútbol | ¿Cuánto sabes de fútbol?'
DESC = 'El juego diario de trivia de fútbol en el que la respuesta obvia puntúa menos. Encuentra la respuesta que nadie más piensa.'
OG_TITLE = 'Unicorner – Juego diario de trivia de fútbol'
OG_DESC = '5 preguntas de fútbol al día, 30 segundos cada una. La respuesta obvia puntúa menos — ¿cuánto sabes de fútbol?'

FAQ = [
    ('¿Unicorner es gratis?', 'Sí. El juego diario es totalmente gratis.'),
    ('¿Cuándo hay partido nuevo?', 'Cada día salen cinco preguntas nuevas de fútbol.'),
    ('¿Cómo se puntúa?', 'Las respuestas correctas pero obvias dan menos puntos. Las respuestas válidas más raras dan más.'),
    ('¿Unicorner está en español?', 'Sí. Juega en español en unicornergame.lol/es/ o pulsa el botón ES/EN de arriba. Las preguntas, el ranking y las ligas son los mismos en los dos idiomas, y puedes volver al inglés cuando quieras.'),
    ('¿Hay un Wordle de fútbol?', 'Sí. Unicorner es un juego diario de fútbol al estilo Wordle: un partido nuevo cada día, las mismas cinco preguntas para todos y una puntuación que puedes compartir. En lugar de adivinar una palabra, nombras jugadores, clubes o países, y cuanto más rara sea tu respuesta, más puntúa.'),
    ('¿Puedo jugar con amigos?', 'Sí. Crea una liga privada, manda el enlace a tus amigos y comparad vuestras puntuaciones del día y de la semana. Para las ligas hace falta entrar gratis con tu email; para el juego diario, no.'),
    ('¿Hay una clasificación?', 'Sí. Hay un ranking mundial de cada partido diario y otro semanal que se reinicia cada lunes, y arriba aparece el ganador de ayer. Para salir en él, entra y elige un apodo.'),
    ('¿Cuál es la puntuación máxima?', '500. Cada una de las cinco preguntas vale hasta 100 puntos: 10 por las respuestas más obvias (Empujarla), luego 30, 60 y 85, y 100 por las respuestas válidas más raras (Qué chicharro).'),
    ('¿Qué es el Modo Infinito?', 'El Modo Infinito es práctica sin fin con las mismas reglas que el juego diario: 30 segundos por pregunta y las respuestas más raras puntúan más, pero sin ranking. Puedes probar una ronda corta gratis, y la versión infinita completa se desbloquea con un solo pago: pagas una vez y es tuya para siempre.'),
    ('¿Qué son las equipaciones?', 'Las equipaciones son trajes para tu unicornio pixelado. Hay 40 que se desbloquean jugando: por partidos jugados, rachas, chicharros y puntuaciones altas. La más rara, el GOAT cósmico, es solo para quien gana un día. Si has entrado con tu cuenta, tu equipación sale en la clasificación.'),
    ('¿Qué es un «Qué chicharro»?', '«Qué chicharro» es la respuesta válida más rara de una pregunta y vale los 100 puntos. Todas las respuestas correctas cuentan, pero cuanto más obvia, menos puntos: Empujarla vale 10, luego Remate 30, Volea 60 y Chilena 85.'),
    ('¿Por qué no me ha contado la respuesta?', 'La respuesta tiene que encajar exactamente con la pregunta. Si escribes un fallo típico, como un jugador que llegó una temporada tarde o que jugó en el otro club, salta un VAR que te explica por qué no cuenta, y puedes volver a intentarlo mientras quede tiempo.'),
    ('¿Qué son los trofeos semanales?', 'Cada lunes a medianoche se cierra la semana y se reparten trofeos: Campeón para quien más puntos suma, la Bota de Oro para quien más chicharros mete, Siempre presente por jugar los siete días, Hat-trick por tres chicharros en un partido, y más. Van a tu vitrina de trofeos y salen como insignias junto a tu nombre en el ranking. Para ganarlos necesitas un apodo.'),
]

# Visible about/FAQ text, so the Spanish words are in the page itself and not only added by the script
TEXT = {
    'id="seo-info-h2">A free daily football trivia game</h2>': 'id="seo-info-h2">Un juego diario de trivia de fútbol, gratis</h2>',
    '<p>Unicorner is a free online football trivia game for fans who know more than the obvious answers. Every day, you get five football questions and 30 seconds to name one valid player, club, country, manager or stadium. Popular answers score fewer points, while rare answers can earn a Screamer. Play the new daily football quiz, test your ball knowledge and challenge your friends to beat your score. No download or sign-up required. Also known as soccer trivia, Unicorner is playable worldwide in English and Spanish, and you can challenge a friend to a 1v1 duel.</p>':
        '<p>Unicorner es un juego gratis de trivia de fútbol para quien sabe más que las respuestas obvias. Cada día tienes cinco preguntas de fútbol y 30 segundos para nombrar un jugador, club, país, entrenador o estadio válido. Las respuestas populares dan menos puntos y las raras pueden ser un Qué chicharro. Juega el partido de hoy, pon a prueba tu cultura futbolera y reta a tus amigos a superarte. Sin descargas ni registro. También conocido como soccer trivia, Unicorner se juega en todo el mundo, en español y en inglés.</p>',
    '<summary>Is Unicorner free?</summary><p>Yes. The daily football quiz is completely free to play.</p>': f'<summary>{FAQ[0][0]}</summary><p>{FAQ[0][1]}</p>',
    '<summary>When is there a new game?</summary><p>Five new football trivia questions are released every day.</p>': f'<summary>{FAQ[1][0]}</summary><p>{FAQ[1][1]}</p>',
    '<summary>How does scoring work?</summary><p>Correct but obvious answers score fewer points. The rarest valid answers score the most.</p>': f'<summary>{FAQ[2][0]}</summary><p>{FAQ[2][1]}</p>',
    '<summary>Is Unicorner available in Spanish?</summary><p>Yes. Play in Spanish at unicornergame.lol/es/, or tap the ES button at the top. The questions, ranking and leagues are the same in both languages, and you can switch back any time.</p>': f'<summary>{FAQ[3][0]}</summary><p>{FAQ[3][1]}</p>',
}
# The newer FAQ entries: English text as it is in index.html, matched to FAQ[4:] above
FAQ_EN_NEW = [
    ('Is there a football Wordle?', 'Yes. Unicorner is a daily football game in the spirit of Wordle: one new game a day, the same five questions for everyone, and a score you can share. Instead of guessing a word, you name players, clubs or countries, and the rarer your answer, the more it scores.'),
    ('Can I play with friends?', 'Yes. Challenge a friend to a 1v1 duel: send the link, play rounds of five questions, and the rarer answer hits harder until someone is knocked out. You can also create a private league, send the link to your friends and compare your daily and weekly scores. Leagues need a free sign-in with your email; the daily game itself does not.'),
    ('Is there a leaderboard?', "Yes. There is a global ranking for each day's game and a weekly ranking that resets every Monday, and yesterday's winner is shown at the top. To appear on it, sign in and pick a nickname."),
    ('What is the highest score?', '500. Each of the five questions is worth up to 100 points: 10 for the most obvious answers (a Tap-in), then 30, 60 and 85, and 100 for the rarest valid answers (a Screamer).'),
    ('What is Infinity mode?', 'Infinity mode is endless practice with the same rules as the daily game: 30 seconds per question and rarer answers score more, but there is no ranking. You can try a short run for free, and the full endless version is a one-time unlock: pay once and it is yours forever.'),
    ('What are kits?', 'Kits are outfits for your pixel unicorn. There are 40 to unlock by playing, through games played, streaks, Screamers and big scores. The rarest, the Cosmic GOAT, is only for players who win a day. If you are signed in, your kit shows on the leaderboard.'),
    ('What is a Screamer?', 'A Screamer is the rarest valid answer to a question, worth the full 100 points. Every correct answer counts, but the more obvious it is, the fewer points it scores: a Tap-in is 10, then a Header 30, a Volley 60 and a Bicycle kick 85.'),
    ("Why didn't my answer count?", 'Your answer has to fit the question exactly. If you type a common near miss, such as a player who joined a season too late or played for the other club, a VAR check pops up and explains why it does not count, and you can try again while the clock is still running.'),
    ('What are the weekly trophies?', 'Every Monday at midnight the past week is wrapped up and trophies are handed out: Champion for the most points, the Golden Boot for the most Screamers, Ever-present for playing all seven days, a Hat-trick for three Screamers in one game, and more. They go in your trophy cabinet and show as badges next to your name on the leaderboard. You need a nickname to win them.'),
]
for (q, a), (qe, ae) in zip(FAQ_EN_NEW, FAQ[4:]):
    TEXT[f'<summary>{q}</summary><p>{a}</p>'] = f'<summary>{qe}</summary><p>{ae}</p>'


def build():
    s = SRC.read_text(encoding='utf-8')
    s = s.replace('<a class="privacy-link lang-link" href="/es/" hreflang="es">Español</a>', '<a class="privacy-link lang-link" href="/" hreflang="en">English</a>', 1)
    s = s.replace('href="/answers/">Past answers</a>', 'href="/es/respuestas/">Past answers</a>', 1).replace('href="/football-trivia-questions/">Trivia questions</a>', 'href="/es/preguntas-futbol/">Preguntas de fútbol</a>', 1).replace('>How to play</a>', '>Cómo se juega</a>', 1).replace('>📲 Get the app</a>', '>📲 Descarga la app</a>', 1)
    s = s.replace('>Past answers</a>', '>Respuestas anteriores</a>', 1).replace('href="/duel.html">Duels</a>', 'href="/duel.html">Duelos</a>', 1)

    def sub(old, new, count=1):
        nonlocal s
        n = s.count(old)
        if n != count:
            sys.exit(f'build_es: expected {count}x {old[:70]!r} in index.html, found {n} — update scripts/build_es.py')
        s = s.replace(old, new)

    def sub_re(pattern, new):
        nonlocal s
        s, n = re.subn(pattern, lambda m: new, s, count=1)
        if n != 1:
            sys.exit(f'build_es: pattern {pattern[:70]!r} not found in index.html — update scripts/build_es.py')

    sub('<html lang="en"><head>', '<html lang="es"><head><base href="/">')
    sub_re(r'<title>[^<]*</title>', f'<title>{TITLE}</title>')
    sub_re(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{DESC}">')
    sub('<link rel="canonical" href="https://unicornergame.lol/">', '<link rel="canonical" href="https://unicornergame.lol/es/">')
    sub('<meta property="og:url" content="https://unicornergame.lol/">', '<meta property="og:url" content="https://unicornergame.lol/es/">')
    sub_re(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{OG_TITLE}">')
    sub_re(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{OG_DESC}">')
    sub_re(r'<meta name="twitter:title" content="[^"]*">', f'<meta name="twitter:title" content="{OG_TITLE}">')
    sub_re(r'<meta name="twitter:description" content="[^"]*">', f'<meta name="twitter:description" content="{OG_DESC}">')
    # the Spanish link preview (title in Spanish)
    sub('https://unicornergame.lol/og-daily.jpg', 'https://unicornergame.lol/og-daily-es.jpg', 4)
    sub_re(r'<meta property="og:image:alt" content="[^"]*">', '<meta property="og:image:alt" content="Unicorner: ¿Cuánto sabes de fútbol? Trivia de fútbol diaria.">')
    sub('<meta property="og:locale" content="en_GB">\n<meta property="og:locale:alternate" content="es_ES">',
        '<meta property="og:locale" content="es_ES">\n<meta property="og:locale:alternate" content="en_GB">')
    for en, es in TEXT.items():
        sub(en, es)
    faq = {'@context': 'https://schema.org', '@type': 'FAQPage', 'inLanguage': 'es',
           'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in FAQ]}
    sub_re(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"FAQPage".*?</script>',
           '<script type="application/ld+json">' + json.dumps(faq, ensure_ascii=False, separators=(',', ':')) + '</script>')

    OUT.parent.mkdir(exist_ok=True)
    banner = '<!-- Generated from index.html by scripts/build_es.py — edit index.html, not this file. -->\n'
    out = s.replace('<!doctype html>', '<!doctype html>\n' + banner, 1)
    if OUT.exists() and OUT.read_text(encoding='utf-8') == out:
        print('es/index.html already up to date')
    else:
        OUT.write_text(out, encoding='utf-8')
        print('wrote es/index.html')


# ── SEO for the side games (Rosco, Millions): title, description, canonical, hreflang, share tags and structured
# data, written into the English source and its Spanish copy. Rewritten on every build, so edit it here. ──
SEO = {
    'rosco': {
        'en': ('Football Rosco – Daily A–Z Football Quiz | Unicorner',
               'One football clue for every letter of the alphabet, against the clock: players, clubs and managers from A to Z. Free, new every day, in English and Spanish.',
               'Football Rosco'),
        'es': ('Rosco de fútbol – El rosco diario de preguntas | Unicorner',
               'Una pista de fútbol por cada letra del abecedario, contra el reloj: jugadores, clubes y entrenadores de la A a la Z. Gratis y nuevo cada día.',
               'Rosco de fútbol')},
    'millon': {
        'en': ('Millions – Daily Football Money Drop Quiz | Unicorner',
               'Start with 1,000,000 and spread it over the answers to 8 football questions. You keep only what lands on the right one. A free football quiz, new every day.',
               'Millions'),
        'es': ('Millones – El quiz diario de fútbol con un millón en juego | Unicorner',
               'Empiezas con 1.000.000 y lo repartes entre las respuestas de 8 preguntas de fútbol. Solo te llevas lo que caiga en la correcta. Gratis y nuevo cada día.',
               'Millones')}}


def seo_block(game, lang):
    import json as _j
    base = 'https://unicornergame.lol'
    url = {l: f'{base}{"/es" if l == "es" else ""}/{game}.html' for l in ('en', 'es')}
    title, desc, name = SEO[game][lang]
    img = f'{base}/og-{game}{"-es" if lang == "es" else ""}.jpg'
    esc = lambda t: t.replace('&', '&amp;').replace('"', '&quot;')
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'VideoGame', 'name': name, 'url': url[lang], 'description': desc, 'inLanguage': lang,
         'genre': ['Trivia', 'Quiz', 'Sports'], 'gamePlatform': 'Web browser', 'applicationCategory': 'Game', 'operatingSystem': 'Any',
         'isAccessibleForFree': True, 'image': img, 'publisher': {'@id': base + '/#org'}, 'isPartOf': {'@id': base + '/#website'},
         'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'EUR'}},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Unicorner', 'item': base + ('/es/' if lang == 'es' else '/')},
            {'@type': 'ListItem', 'position': 2, 'name': name, 'item': url[lang]}]}]}
    return ('<!--seo-->'
            f'<title>{esc(title)}</title>\n<meta name="description" content="{esc(desc)}">\n'
            f'<link rel="canonical" href="{url[lang]}">\n'
            f'<link rel="alternate" hreflang="en" href="{url["en"]}">\n<link rel="alternate" hreflang="es" href="{url["es"]}">\n<link rel="alternate" hreflang="x-default" href="{url["en"]}">\n'
            f'<meta property="og:type" content="website">\n<meta property="og:site_name" content="Unicorner">\n<meta property="og:url" content="{url[lang]}">\n'
            f'<meta property="og:title" content="{esc(title)}">\n<meta property="og:description" content="{esc(desc)}">\n'
            f'<meta property="og:image" content="{img}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'
            f'<meta property="og:locale" content="{"es_ES" if lang == "es" else "en_GB"}">\n'
            f'<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="{esc(title)}">\n<meta name="twitter:description" content="{esc(desc)}">\n<meta name="twitter:image" content="{img}">\n'
            f'<script type="application/ld+json">{_j.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>'
            '<!--/seo-->')


def seo_games():
    for game in ('rosco', 'millon'):
        for lang, path in (('en', SRC.parent / f'{game}.html'), ('es', SRC.parent / 'es' / f'{game}.html')):
            h = path.read_text(encoding='utf-8')
            if '<!--seo-->' in h:
                h = re.sub(r'<!--seo-->.*?<!--/seo-->', lambda m: seo_block(game, lang), h, count=1, flags=re.S)
            else:  # first run: replace the plain title and description
                h = re.sub(r'<title>[^<]*</title>\n?', '', h, count=1)
                h = re.sub(r'<meta name="description" content="[^"]*">', lambda m: seo_block(game, lang), h, count=1)
            path.write_text(h, encoding='utf-8')


if __name__ == '__main__':
    build()
    import build_sprites  # Duels draws the same kits as the main game
    build_sprites.main()
    # the Rosco: the same page in Spanish (rosco.html switches language by its /es/ path)
    r = (SRC.parent / 'rosco.html').read_text(encoding='utf-8')
    r = r.replace('<html lang="en">', '<html lang="es">', 1).replace('<title>Unicorner Rosco</title>', '<title>Rosco de fútbol · Unicorner</title>', 1)
    r = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="El Rosco diario de fútbol: una pista por cada letra, contra el reloj. Gratis y nuevo cada día.">', r, count=1)
    (SRC.parent / 'es' / 'rosco.html').write_text(r, encoding='utf-8')
    # Millions: the same page in Spanish too
    m = (SRC.parent / 'millon.html').read_text(encoding='utf-8')
    m = m.replace('<html lang="en">', '<html lang="es">', 1).replace('<title>Unicorner Millions</title>', '<title>Millones · Unicorner</title>', 1)
    (SRC.parent / 'es' / 'millon.html').write_text(m, encoding='utf-8')
    seo_games()
