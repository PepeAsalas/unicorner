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
    ('¿Unicorner está en español?', 'Sí. Pulsa el botón ES/EN de arriba para cambiar de idioma, o entra en unicornergame.lol/es/. Las preguntas, el ranking y las ligas son los mismos en los dos idiomas, y puedes volver al inglés cuando quieras.'),
]

# Visible about/FAQ text, so the Spanish words are in the page itself and not only added by the script
TEXT = {
    'id="seo-info-h2">A free daily football trivia game</h2>': 'id="seo-info-h2">Un juego diario de trivia de fútbol, gratis</h2>',
    '<p>Unicorner is a free online football trivia game for fans who know more than the obvious answers. Every day, you get five football questions and 30 seconds to name one valid player, club, country, manager or stadium. Popular answers score fewer points, while rare answers can earn a Screamer. Play the new daily football quiz, test your ball knowledge and challenge your friends to beat your score. No download or sign-up required.</p>':
        '<p>Unicorner es un juego gratis de trivia de fútbol para quien sabe más que las respuestas obvias. Cada día tienes cinco preguntas de fútbol y 30 segundos para nombrar un jugador, club, país, entrenador o estadio válido. Las respuestas populares dan menos puntos y las raras pueden ser un Qué chicharro. Juega el partido de hoy, pon a prueba tu cultura futbolera y reta a tus amigos a superarte. Sin descargas ni registro.</p>',
    '<summary>Is Unicorner free?</summary><p>Yes. The daily football quiz is completely free to play.</p>': f'<summary>{FAQ[0][0]}</summary><p>{FAQ[0][1]}</p>',
    '<summary>When is there a new game?</summary><p>Five new football trivia questions are released every day.</p>': f'<summary>{FAQ[1][0]}</summary><p>{FAQ[1][1]}</p>',
    '<summary>How does scoring work?</summary><p>Correct but obvious answers score fewer points. The rarest valid answers score the most.</p>': f'<summary>{FAQ[2][0]}</summary><p>{FAQ[2][1]}</p>',
    '<summary>Is Unicorner available in Spanish?</summary><p>Yes. Tap the ES button at the top to play in Spanish, or open unicornergame.lol/?lang=es. The questions, ranking and leagues are the same in both languages, and you can switch back any time.</p>': f'<summary>{FAQ[3][0]}</summary><p>{FAQ[3][1]}</p>',
}


def build():
    s = SRC.read_text(encoding='utf-8')

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


if __name__ == '__main__':
    build()
