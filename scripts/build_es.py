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
    ('¿Qué es el Modo Infinito?', 'El Modo Infinito es práctica sin fin con las mismas reglas que el juego diario: 30 segundos por pregunta y las respuestas más raras puntúan más, pero sin ranking. Ya puedes probar una ronda corta; la versión infinita completa llega pronto.'),
    ('¿Qué son las equipaciones?', 'Las equipaciones son trajes para tu unicornio pixelado. Hay 40 que se desbloquean jugando: por partidos jugados, rachas, chicharros y puntuaciones altas. La más rara, el GOAT cósmico, es solo para quien gana un día. Si has entrado con tu cuenta, tu equipación sale en la clasificación.'),
    ('¿Qué es un Qué chicharro?', 'Qué chicharro es la respuesta válida más rara de una pregunta y vale los 100 puntos. Todas las respuestas correctas cuentan, pero cuanto más obvia, menos puntos: Empujarla vale 10, luego Remate 30, Volea 60 y Chilena 85.'),
    ('¿Por qué no me ha contado la respuesta?', 'La respuesta tiene que encajar exactamente con la pregunta. Si escribes un fallo típico, como un jugador que llegó una temporada tarde o que jugó en el otro club, salta un VAR que te explica por qué no cuenta, y puedes volver a intentarlo mientras quede tiempo.'),
    ('¿Qué son los trofeos semanales?', 'Cada lunes a medianoche se cierra la semana y se reparten trofeos: Campeón para quien más puntos suma, la Bota de Oro para quien más chicharros mete, Siempre presente por jugar los siete días, Hat-trick por tres chicharros en un partido, y más. Van a tu vitrina de trofeos y salen como insignias junto a tu nombre en el ranking. Para ganarlos necesitas un apodo.'),
]

# Visible about/FAQ text, so the Spanish words are in the page itself and not only added by the script
TEXT = {
    'id="seo-info-h2">A free daily football trivia game</h2>': 'id="seo-info-h2">Un juego diario de trivia de fútbol, gratis</h2>',
    '<p>Unicorner is a free online football trivia game for fans who know more than the obvious answers. Every day, you get five football questions and 30 seconds to name one valid player, club, country, manager or stadium. Popular answers score fewer points, while rare answers can earn a Screamer. Play the new daily football quiz, test your ball knowledge and challenge your friends to beat your score. No download or sign-up required.</p>':
        '<p>Unicorner es un juego gratis de trivia de fútbol para quien sabe más que las respuestas obvias. Cada día tienes cinco preguntas de fútbol y 30 segundos para nombrar un jugador, club, país, entrenador o estadio válido. Las respuestas populares dan menos puntos y las raras pueden ser un Qué chicharro. Juega el partido de hoy, pon a prueba tu cultura futbolera y reta a tus amigos a superarte. Sin descargas ni registro.</p>',
    '<summary>Is Unicorner free?</summary><p>Yes. The daily football quiz is completely free to play.</p>': f'<summary>{FAQ[0][0]}</summary><p>{FAQ[0][1]}</p>',
    '<summary>When is there a new game?</summary><p>Five new football trivia questions are released every day.</p>': f'<summary>{FAQ[1][0]}</summary><p>{FAQ[1][1]}</p>',
    '<summary>How does scoring work?</summary><p>Correct but obvious answers score fewer points. The rarest valid answers score the most.</p>': f'<summary>{FAQ[2][0]}</summary><p>{FAQ[2][1]}</p>',
    '<summary>Is Unicorner available in Spanish?</summary><p>Yes. Play in Spanish at unicornergame.lol/es/, or tap the ES button at the top. The questions, ranking and leagues are the same in both languages, and you can switch back any time.</p>': f'<summary>{FAQ[3][0]}</summary><p>{FAQ[3][1]}</p>',
}
# The newer FAQ entries: English text as it is in index.html, matched to FAQ[4:] above
FAQ_EN_NEW = [
    ('Is there a football Wordle?', 'Yes. Unicorner is a daily football game in the spirit of Wordle: one new game a day, the same five questions for everyone, and a score you can share. Instead of guessing a word, you name players, clubs or countries, and the rarer your answer, the more it scores.'),
    ('Can I play with friends?', 'Yes. Create a private league, send the link to your friends and compare your daily and weekly scores. Leagues need a free sign-in with your email; the daily game itself does not.'),
    ('Is there a leaderboard?', "Yes. There is a global ranking for each day's game and a weekly ranking that resets every Monday, and yesterday's winner is shown at the top. To appear on it, sign in and pick a nickname."),
    ('What is the highest score?', '500. Each of the five questions is worth up to 100 points: 10 for the most obvious answers (a Tap-in), then 30, 60 and 85, and 100 for the rarest valid answers (a Screamer).'),
    ('What is Infinity mode?', 'Infinity mode is endless practice with the same rules as the daily game: 30 seconds per question and rarer answers score more, but there is no ranking. You can try a short run now; the full endless version is coming soon.'),
    ('What are kits?', 'Kits are outfits for your pixel unicorn. There are 40 to unlock by playing, through games played, streaks, Screamers and big scores. The rarest, the Cosmic GOAT, is only for players who win a day. If you are signed in, your kit shows on the leaderboard.'),
    ('What is a Screamer?', 'A Screamer is the rarest valid answer to a question, worth the full 100 points. Every correct answer counts, but the more obvious it is, the fewer points it scores: a Tap-in is 10, then a Header 30, a Volley 60 and a Bicycle kick 85.'),
    ("Why didn't my answer count?", 'Your answer has to fit the question exactly. If you type a common near miss, such as a player who joined a season too late or played for the other club, a VAR check pops up and explains why it does not count, and you can try again while the clock is still running.'),
    ('What are the weekly trophies?', 'Every Monday at midnight the past week is wrapped up and trophies are handed out: Champion for the most points, the Golden Boot for the most Screamers, Ever-present for playing all seven days, a Hat-trick for three Screamers in one game, and more. They go in your trophy cabinet and show as badges next to your name on the leaderboard. You need a nickname to win them.'),
]
for (q, a), (qe, ae) in zip(FAQ_EN_NEW, FAQ[4:]):
    TEXT[f'<summary>{q}</summary><p>{a}</p>'] = f'<summary>{qe}</summary><p>{ae}</p>'


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
