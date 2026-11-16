#!/usr/bin/env python3
"""Add Brazilian Portuguese to daily question files: prompt_pt/subtitle_pt (from a translations file)
and Portuguese country names (name_pt shown in the game, plus aliases so typing "Alemanha" counts).

Usage: python3 scripts/add_portuguese.py [translations.txt]
translations.txt lines: <question id>|<prompt_pt>|<subtitle_pt>
Countries are added to every daily file; safe to run again.
"""
import glob, json, os, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COUNTRY_PT = {
 'Albania': 'Albânia', 'Algeria': 'Argélia', 'Armenia': 'Armênia', 'Austria': 'Áustria', 'Azerbaijan': 'Azerbaijão',
 'Belarus': 'Belarus', 'Belgium': 'Bélgica', 'Brazil': 'Brasil', 'Bulgaria': 'Bulgária', 'Cameroon': 'Camarões',
 'Canada': 'Canadá', 'Cape Verde': 'Cabo Verde', 'Colombia': 'Colômbia', 'Croatia': 'Croácia', 'Cyprus': 'Chipre',
 'Czech Republic': 'República Tcheca', 'Czechoslovakia': 'Tchecoslováquia', 'DR Congo': 'RD Congo', 'Denmark': 'Dinamarca',
 'Dominican Republic': 'República Dominicana', 'East Germany': 'Alemanha Oriental', 'Ecuador': 'Equador', 'Egypt': 'Egito',
 'England': 'Inglaterra', 'Equatorial Guinea': 'Guiné Equatorial', 'Estonia': 'Estônia', 'Ethiopia': 'Etiópia',
 'Faroe Islands': 'Ilhas Faroé', 'Finland': 'Finlândia', 'France': 'França', 'Gabon': 'Gabão', 'Gambia': 'Gâmbia',
 'Georgia': 'Geórgia', 'Germany': 'Alemanha', 'Great Britain': 'Grã-Bretanha', 'Greece': 'Grécia', 'Guinea': 'Guiné',
 'Guinea-Bissau': 'Guiné-Bissau', 'Hungary': 'Hungria', 'Iceland': 'Islândia', 'Indonesia': 'Indonésia', 'Iran': 'Irã',
 'Iraq': 'Iraque', 'Italy': 'Itália', 'Ivory Coast': 'Costa do Marfim', 'Jamaica': 'Jamaica', 'Japan': 'Japão',
 'Jordan': 'Jordânia', 'Kazakhstan': 'Cazaquistão', 'Kosovo': 'Kosovo', 'Kuwait': 'Kuwait', 'Latvia': 'Letônia',
 'Lebanon': 'Líbano', 'Liberia': 'Libéria', 'Libya': 'Líbia', 'Lithuania': 'Lituânia', 'Luxembourg': 'Luxemburgo',
 'Malaysia': 'Malásia', 'Mauritania': 'Mauritânia', 'Mexico': 'México', 'Moldova': 'Moldávia', 'Montenegro': 'Montenegro',
 'Morocco': 'Marrocos', 'Mozambique': 'Moçambique', 'Namibia': 'Namíbia', 'Netherlands': 'Holanda',
 'New Zealand': 'Nova Zelândia', 'Nigeria': 'Nigéria', 'North Korea': 'Coreia do Norte', 'North Macedonia': 'Macedônia do Norte',
 'Northern Ireland': 'Irlanda do Norte', 'Norway': 'Noruega', 'Panama': 'Panamá', 'Philippines': 'Filipinas',
 'Poland': 'Polônia', 'Qatar': 'Catar', 'Republic of Ireland': 'Irlanda', 'Romania': 'Romênia', 'Russia': 'Rússia',
 'Saudi Arabia': 'Arábia Saudita', 'Scotland': 'Escócia', 'Serbia': 'Sérvia', 'Singapore': 'Singapura', 'Slovakia': 'Eslováquia',
 'Slovenia': 'Eslovênia', 'South Africa': 'África do Sul', 'South Korea': 'Coreia do Sul', 'Soviet Union': 'União Soviética',
 'Spain': 'Espanha', 'Sudan': 'Sudão', 'Sweden': 'Suécia', 'Switzerland': 'Suíça', 'Tahiti': 'Taiti', 'Tanzania': 'Tanzânia',
 'Thailand': 'Tailândia', 'Trinidad and Tobago': 'Trinidad e Tobago', 'Tunisia': 'Tunísia', 'Turkey': 'Turquia',
 'USA': 'Estados Unidos', 'United States': 'Estados Unidos', 'Ukraine': 'Ucrânia', 'United Arab Emirates': 'Emirados Árabes Unidos',
 'United Kingdom': 'Reino Unido', 'Uzbekistan': 'Uzbequistão', 'Vietnam': 'Vietnã', 'Wales': 'País de Gales',
 'Yugoslavia': 'Iugoslávia', 'Zaire': 'Zaire', 'Zambia': 'Zâmbia', 'Hong Kong': 'Hong Kong', 'Cuba': 'Cuba',
 'El Salvador': 'El Salvador', 'Haiti': 'Haiti', 'Honduras': 'Honduras', 'Israel': 'Israel', 'Malta': 'Malta', 'Mali': 'Mali',
}
EXTRA = {'Netherlands': ['Países Baixos', 'Paises Baixos'], 'United States': ['EUA'], 'USA': ['EUA'], 'Wales': ['Gales'],
         'Republic of Ireland': ['República da Irlanda'], 'Czech Republic': ['Tchéquia', 'Chéquia'], 'Ivory Coast': ['Costa do Marfim'],
         'Moldova': ['Moldova'], 'Belarus': ['Bielorrússia', 'Bielorrussia'], 'Iran': ['Irão']}
fold = lambda s: ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')


def add_country(a):
    pt = COUNTRY_PT.get(a['name'])
    if not pt:
        return
    if pt != a['name']:
        a['name_pt'] = pt
    have = {fold(x) for x in [a['name'], *a.get('aliases', [])]}
    for x in [pt, *EXTRA.get(a['name'], [])]:
        for v in {x, ''.join(c for c in unicodedata.normalize('NFD', x) if unicodedata.category(c) != 'Mn')}:
            if fold(v) not in have:
                a.setdefault('aliases', []).append(v); have.add(fold(v))


def main():
    tr = {}
    if len(sys.argv) > 1:
        for ln in open(sys.argv[1], encoding='utf-8'):
            p = ln.rstrip('\n').split('|')
            if len(p) == 3:
                tr[p[0]] = p[1:]
    n = 0
    for f in sorted(glob.glob(os.path.join(ROOT, 'daily', '2*.json'))):
        raw = open(f, encoding='utf-8').read()
        d = json.loads(raw)
        for q in d['questions']:
            if q['id'] in tr:
                q['prompt_pt'], q['subtitle_pt'] = tr[q['id']]; n += 1
            if q.get('answer_type') == 'country':
                for a in q['answers'] + q.get('traps', []):
                    add_country(a)
        if d == json.loads(raw):
            continue
        pretty = raw.lstrip().startswith('{\n')
        out = json.dumps(d, ensure_ascii=False, indent=2 if pretty else None, separators=None if pretty else (',', ':')) + ('\n' if raw.endswith('\n') else '')
        if out != raw:
            open(f, 'w', encoding='utf-8').write(out)
    print('prompts translated:', n)


if __name__ == '__main__':
    main()
