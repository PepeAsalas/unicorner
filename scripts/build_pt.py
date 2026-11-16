"""Build pt/index.html (Brazilian Portuguese, unicornergame.lol/pt/) from index.html.

Same idea as build_es.py: the game is the same file and switches to Portuguese because its path starts with /pt/.
This only changes what search engines and link previews read first (language, title, description, canonical URL,
share tags, the FAQ data) and pre-translates the visible about/FAQ text using PT_TEXT from index.html.
Run after changing index.html:  python3 scripts/build_pt.py   (build_es.py runs it too)
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'index.html', ROOT / 'pt' / 'index.html'
TITLE = 'Unicorner – Quiz diário de futebol | Quanto você entende de bola?'
DESC = 'O quiz diário de futebol em que a resposta óbvia vale menos. Ache a resposta que ninguém mais pensa.'
OG_TITLE = 'Unicorner – Quiz diário de futebol'
OG_DESC = '5 perguntas de futebol por dia, 30 segundos cada. A resposta óbvia vale menos — quanto você entende de bola?'


def bake(s, table):
    """Swap visible English text (and placeholder/title/aria-label values) for the translation, in HTML only,
    never inside scripts or styles, so search engines read the translated page without running scripts."""
    parts = re.split(r'(<script\b.*?</script>|<style\b.*?</style>)', s, flags=re.S)
    items = sorted(table.items(), key=lambda kv: -len(kv[0]))
    for i in range(0, len(parts), 2):
        for en, tr in items:
            if not en.strip():
                continue
            parts[i] = parts[i].replace(f'>{en}<', f'>{tr}<')
            for a in ('placeholder', 'title', 'aria-label'):
                parts[i] = parts[i].replace(f'{a}="{en}"', f'{a}="{tr}"')
    return ''.join(parts)


def build():
    s = SRC.read_text(encoding='utf-8')
    m = re.search(r'const PT_TEXT=(\{.*?\});', s)
    if not m:
        sys.exit('build_pt: PT_TEXT not found in index.html')
    pt = json.loads(m.group(1))

    def sub(old, new, count=1):
        nonlocal s
        n = s.count(old)
        if n != count:
            sys.exit(f'build_pt: expected {count}x {old[:70]!r} in index.html, found {n} — update scripts/build_pt.py')
        s = s.replace(old, new)

    def sub_re(pattern, new):
        nonlocal s
        s, n = re.subn(pattern, lambda _: new, s, count=1)
        if n != 1:
            sys.exit(f'build_pt: pattern {pattern[:70]!r} not found — update scripts/build_pt.py')

    sub('<html lang="en"><head>', '<html lang="pt-BR"><head><base href="/">')
    sub_re(r'<title>[^<]*</title>', f'<title>{TITLE}</title>')
    sub_re(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{DESC}">')
    sub('<link rel="canonical" href="https://unicornergame.lol/">', '<link rel="canonical" href="https://unicornergame.lol/pt/">')
    sub('<meta property="og:url" content="https://unicornergame.lol/">', '<meta property="og:url" content="https://unicornergame.lol/pt/">')
    for k, v in (('og:title', OG_TITLE), ('og:description', OG_DESC)):
        sub_re(rf'<meta property="{k}" content="[^"]*">', f'<meta property="{k}" content="{v}">')
    for k, v in (('twitter:title', OG_TITLE), ('twitter:description', OG_DESC)):
        sub_re(rf'<meta name="{k}" content="[^"]*">', f'<meta name="{k}" content="{v}">')
    sub('<meta property="og:locale" content="en_GB">', '<meta property="og:locale" content="pt_BR">')
    sub('<meta property="og:locale:alternate" content="pt_BR">', '<meta property="og:locale:alternate" content="en_GB">')
    sub('<a class="privacy-link" href="/questions/">Question archive</a>', '<a class="privacy-link" href="/pt/perguntas/">Arquivo de perguntas</a>')
    sub('<a class="privacy-link" href="/how-to-play.html">How to play</a>', '<a class="privacy-link" href="/pt/como-jogar.html">Como jogar</a>')
    sub('<a class="privacy-link lang-link" href="/es/" hreflang="es">Español</a>', '<a class="privacy-link lang-link" href="/" hreflang="en">English</a>')
    sub('<a class="privacy-link lang-link2" href="/pt/" hreflang="pt-BR">Português</a>', '<a class="privacy-link lang-link2" href="/es/" hreflang="es">Español</a>')
    s = re.sub(r'<a class="privacy-link ft-g" href="/([\w.]*)">', r'<a class="privacy-link ft-g" href="/pt/\1">', s)  # footer game links

    s = bake(s, pt)
    for en_href, pt_href in (('/answers/', '/pt/respostas/'), ('/football-trivia-questions/', '/pt/perguntas-futebol/'), ('/football-trivia-mistakes/', '/pt/erros-futebol/')):
        s = s.replace(f'<a class="privacy-link" href="{en_href}">', f'<a class="privacy-link" href="{pt_href}">', 1)
    body = s
    q = re.findall(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>', body)
    q = [x for x in q if '${' not in x[0]]
    if len(q) < 10:
        sys.exit('build_pt: FAQ not found')
    faq = {'@context': 'https://schema.org', '@type': 'FAQPage', 'inLanguage': 'pt-BR',
           'mainEntity': [{'@type': 'Question', 'name': a, 'acceptedAnswer': {'@type': 'Answer', 'text': b}} for a, b in q]}
    sub_re(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"FAQPage".*?</script>',
           '<script type="application/ld+json">' + json.dumps(faq, ensure_ascii=False, separators=(',', ':')) + '</script>')

    OUT.parent.mkdir(exist_ok=True)
    banner = '<!-- Generated from index.html by scripts/build_pt.py — edit index.html, not this file. -->\n'
    out = s.replace('<!doctype html>', '<!doctype html>\n' + banner, 1)
    if OUT.exists() and OUT.read_text(encoding='utf-8') == out:
        print('pt/index.html already up to date')
    else:
        OUT.write_text(out, encoding='utf-8')
        print('wrote pt/index.html')


if __name__ == '__main__':
    build()
