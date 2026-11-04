#!/usr/bin/env python3
"""Add Spanish prompts (prompt_es) to duel/bank.json, in the same style as the daily game ("Nombra un ... que haya ...").

The bank's prompts follow a few fixed patterns, so they are translated by rule; anything that matches no rule is listed
and left untouched (add a rule or a line to MANUAL). Questions that already have prompt_es are kept as they are.
Usage: python scripts/translate_bank_es.py [--check]   (--check only lists what is missing)
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# nationality: (man, men-plural not needed) — players and managers in the bank are referred to in the masculine
NAT = {'Brazilian': 'brasileño', 'Argentine': 'argentino', 'French': 'francés', 'Dutch': 'holandés', 'Spanish': 'español',
       'Italian': 'italiano', 'Uruguayan': 'uruguayo', 'Portuguese': 'portugués', 'German': 'alemán', 'Belgian': 'belga',
       'Croatian': 'croata', 'Colombian': 'colombiano', 'Danish': 'danés', 'Swedish': 'sueco', 'Japanese': 'japonés',
       'Mexican': 'mexicano', 'English': 'inglés', 'American': 'estadounidense', 'Serbian': 'serbio', 'Moroccan': 'marroquí',
       'Nigerian': 'nigeriano', 'African': 'africano', 'Scottish': 'escocés',
       'Dutchman': 'holandés', 'Spaniard': 'español', 'Frenchman': 'francés'}
ROLE = {'player': 'jugador', 'goalkeeper': 'portero', 'centre-back': 'central', 'left-back': 'lateral izquierdo',
        'right-back': 'lateral derecho', 'striker': 'delantero', 'winger': 'extremo', 'midfielder': 'centrocampista',
        'defender': 'defensa', 'defensive midfielder': 'mediocentro defensivo', 'manager': 'entrenador'}
COUNTRY = {'Brazil': 'Brasil', 'Argentina': 'Argentina', 'France': 'Francia', 'Germany': 'Alemania', 'Spain': 'España',
           'England': 'Inglaterra', 'Portugal': 'Portugal', 'the Netherlands': 'Países Bajos', 'Italy': 'Italia',
           'Belgium': 'Bélgica', 'Uruguay': 'Uruguay', 'Croatia': 'Croacia'}
LEAGUE = {'the Premier League': 'la Premier League', 'La Liga': 'LaLiga', 'Serie A': 'la Serie A', 'the Bundesliga': 'la Bundesliga',
          'Ligue 1': 'la Ligue 1', 'the Scottish Premiership': 'la Premiership escocesa'}
TROPHY = {'the Champions League': 'la Champions League', 'the Premier League': 'la Premier League', 'La Liga': 'LaLiga',
          'Serie A': 'la Serie A', 'the Bundesliga': 'la Bundesliga', 'Ligue 1': 'la Ligue 1', 'the Europa League': 'la Europa League',
          'the FA Cup': 'la FA Cup', 'the Eredivisie': 'la Eredivisie', 'the Primeira Liga': 'la Primeira Liga', 'the Copa del Rey': 'la Copa del Rey'}
GOALS_IN = {'Premier League': 'de Premier League', 'La Liga': 'de LaLiga', 'Serie A': 'de Serie A', 'Bundesliga': 'de Bundesliga',
            'Ligue 1': 'de Ligue 1', 'Champions League': 'de Champions League'}


def a(word):
    return 'un'


def span(s):
    """'up to 2025-26' / 'between 2000-01 and 2025-26' / 'from 2006 to 2022' / 'in the 2010s' / 'in 2025-26'."""
    s = s.strip()
    m = re.fullmatch(r'up to (\S+)', s)
    if m: return f'hasta {m.group(1)}'
    m = re.fullmatch(r'between (\S+) and (\S+)', s)
    if m: return f'entre {m.group(1)} y {m.group(2)}'
    m = re.fullmatch(r'from (\S+) to (\S+)', s)
    if m: return f'entre {m.group(1)} y {m.group(2)}'
    m = re.fullmatch(r'in the (\d{4})s', s)
    if m: return f'en la década de {m.group(1)}'
    m = re.fullmatch(r'in (\S+)', s)
    if m: return f'en {m.group(1)}'
    return None


def tr(p):
    p = p.strip()
    nat = '|'.join(sorted(map(re.escape, NAT), key=len, reverse=True))
    role = '|'.join(sorted(map(re.escape, ROLE), key=len, reverse=True))
    lg = '|'.join(sorted(map(re.escape, LEAGUE), key=len, reverse=True))
    when = r'((?:up to|between|from|in) .+)'

    def who(n, r):  # "a Brazilian (player)" -> "brasileño" / "un portero brasileño"
        n_es = NAT.get(n, '') if n else ''
        r_es = ROLE.get(r or 'player', 'jugador')
        if n and (not r or r == 'player'):
            return f'un {n_es}'
        return f'un {r_es}' + (f' {n_es}' if n_es else '')

    # Name a Brazilian who played for Real Madrid up to 2025-26 / a goalkeeper who played for X ...
    m = re.fullmatch(rf'Name an? (?:({nat}) )?(?:({role}) )?who played for (.+?) {when}', p)
    if m and span(m.group(4)) and not m.group(3).startswith('both ') and ' at a ' not in m.group(3):
        return f'Nombra {who(m.group(1), m.group(2))} que haya jugado en el {m.group(3)} {span(m.group(4))}'
    # played for both X and Y
    m = re.fullmatch(rf'Name a player who played for both (.+?) and (.+?) {when}', p)
    if m and span(m.group(3)):
        return f'Nombra un jugador que haya jugado en el {m.group(1)} y en el {m.group(2)} {span(m.group(3))}'
    # played for <country> at a World Cup / Euro / Copa América
    m = re.fullmatch(rf'Name a player who played for ({"|".join(map(re.escape, COUNTRY))}) at a (World Cup or Euro|World Cup|Euro|Copa América) {when}', p)
    if m and span(m.group(3)):
        t = {'World Cup or Euro': 'un Mundial o una Eurocopa', 'World Cup': 'un Mundial', 'Euro': 'una Eurocopa', 'Copa América': 'una Copa América'}[m.group(2)]
        return f'Nombra un jugador que haya jugado con {COUNTRY[m.group(1)]} en {t} {span(m.group(3))}'
    # won <trophy> with <club>
    m = re.fullmatch(rf'Name a player who won ({"|".join(map(re.escape, TROPHY))}) with (.+?) {when}', p)
    if m and span(m.group(3)):
        return f'Nombra un jugador que haya ganado {TROPHY[m.group(1)]} con el {m.group(2)} {span(m.group(3))}'
    # Name a <nat> (<role>) who played in <league> <when>
    m = re.fullmatch(rf'Name an? (?:({nat}) )?(?:({role}) )?who played in ({lg}) {when}', p)
    if m and span(m.group(4)):
        return f'Nombra {who(m.group(1), m.group(2))} que haya jugado en {LEAGUE[m.group(3)]} {span(m.group(4))}'
    # with N+ <league> goals / assists
    m = re.fullmatch(r'Name a (player|defender) with (\d+\+) (Premier League|La Liga|Serie A|Bundesliga|Ligue 1|Champions League) (goals|assists) (.+)', p)
    if m:
        rest = m.group(5)
        rest_es = '(desde 1992-93)' if rest == '(since 1992-93)' else span(rest)
        if rest_es:
            what = 'goles' if m.group(4) == 'goals' else 'asistencias'
            return f'Nombra un {ROLE[m.group(1)]} con {m.group(2)} {what} {GOALS_IN[m.group(3)]} {rest_es}'
    # scored N+ <league> goals in a single season
    m = re.fullmatch(rf'Name a player who scored (\d+\+) (Premier League|La Liga|Serie A|Bundesliga) goals in a single season {when}', p)
    if m and span(m.group(3)):
        return f'Nombra un jugador que haya marcado {m.group(1)} goles {GOALS_IN[m.group(2)]} en una sola temporada {span(m.group(3))}'
    m = re.fullmatch(rf'Name a player who scored a (Premier League|Champions League) hat-trick {when}', p)
    if m and span(m.group(2)):
        return f'Nombra un jugador que haya marcado un hat-trick {GOALS_IN[m.group(1)]} {span(m.group(2))}'
    m = re.fullmatch(rf'Name a player who scored (\d+\+) goals for ({"|".join(map(re.escape, COUNTRY))}) {when}', p)
    if m and span(m.group(3)):
        return f'Nombra un jugador que haya marcado {m.group(1)} goles con {COUNTRY[m.group(2)]} {span(m.group(3))}'
    # Name a Brazilian left-back / an Argentine striker
    m = re.fullmatch(rf'Name an? ({nat}) ({role})', p)
    if m:
        return f'Nombra un {ROLE[m.group(2)]} {NAT[m.group(1)]}'
    m = re.fullmatch(rf'Name a left-footed ({nat}) player', p)
    if m:
        return f'Nombra un jugador zurdo {NAT[m.group(1)]}'
    # countries at tournaments
    m = re.fullmatch(r'Name a country that played at (?:the )?(\d{4}) World Cup', p)
    if m: return f'Nombra una selección que jugó el Mundial de {m.group(1)}'
    m = re.fullmatch(r'Name a country that played at (?:the )?Euro (\d{4})', p)
    if m: return f'Nombra una selección que jugó la Euro {m.group(1)}'
    m = re.fullmatch(r'Name a country that played at the (\d{4}) Copa América( Centenario)?', p)
    if m: return f'Nombra una selección que jugó la Copa América{" Centenario" if m.group(2) else ""} {m.group(1)}'
    m = re.fullmatch(r'Name a country that played at the (\d{4}) Africa Cup of Nations', p)
    if m: return f'Nombra una selección que jugó la Copa África {m.group(1)}'
    m = re.fullmatch(r'Name a country that played at the (\d{4}) AFC Asian Cup', p)
    if m: return f'Nombra una selección que jugó la Copa Asiática {m.group(1)}'
    # clubs in leagues
    m = re.fullmatch(rf'Name a club that played in ({lg}) {when}', p)
    if m and span(m.group(2)):
        return f'Nombra un club que haya jugado en {LEAGUE[m.group(1)]} {span(m.group(2))}'
    m = re.fullmatch(rf'Name a club relegated from ({lg}) {when}(?: \(relegation play-off losers included\))?', p)
    if m and span(m.group(2)):
        extra = ' (incluidos los que perdieron la promoción)' if 'play-off' in p else ''
        return f'Nombra un club que haya descendido de {LEAGUE[m.group(1)]} {span(m.group(2))}{extra}'
    # permanent Premier League managers
    m = re.fullmatch(rf'Name an? ({nat})(?: manager)? who was a permanent Premier League manager {when}', p)
    if m and span(m.group(2)):
        return f'Nombra un entrenador {NAT[m.group(1)]} que haya dirigido en la Premier League (no interino) {span(m.group(2))}'
    m = re.fullmatch(rf'Name a manager who won the (Premier League|La Liga|Bundesliga|Serie A) title {when}', p)
    if m and span(m.group(2)):
        return f'Nombra un entrenador que haya ganado {TROPHY.get("the " + m.group(1), TROPHY.get(m.group(1)))} {span(m.group(2))}'
    m = re.fullmatch(rf'Name an? (English|Spanish|German|Italian) club that played in the Champions League group or league phase {when}', p)
    if m and span(m.group(2)):
        return f'Nombra un club {NAT[m.group(1)]} que haya jugado la fase de grupos o la liguilla de la Champions League {span(m.group(2))}'
    return MANUAL.get(p)


MANUAL = {
    'Name a club relegated from Ligue 1 between 2014-15 and 2024-25 (relegation play-off losers included)': 'Nombra un club que haya descendido de la Ligue 1 entre 2014-15 y 2024-25 (incluidos los que perdieron la promoción)',
    'Name a goalkeeper who scored a goal in a top-five European league up to 2025-26': 'Nombra un portero que haya marcado un gol en una de las cinco grandes ligas europeas hasta 2025-26',
    'Name a London club that played in the Premier League up to 2025-26': 'Nombra un club de Londres que haya jugado en la Premier League hasta 2025-26',
    'Name a club from Andalusia that played in La Liga between 2000-01 and 2025-26': 'Nombra un club andaluz que haya jugado en LaLiga entre 2000-01 y 2025-26',
    'Name a club promoted to the Premier League in the summers of 2015 to 2025 (automatic promotion or play-offs)': 'Nombra un club que haya ascendido a la Premier League en los veranos de 2015 a 2025 (directo o por play-off)',
    'Name a club from North West England that played in the Premier League up to 2025-26': 'Nombra un club del noroeste de Inglaterra que haya jugado en la Premier League hasta 2025-26',
    'Name a club from the Midlands of England that played in the Premier League up to 2025-26': 'Nombra un club de las Midlands inglesas que haya jugado en la Premier League hasta 2025-26',
    'Name a club from North Rhine-Westphalia that played in the Bundesliga between 2000-01 and 2025-26': 'Nombra un club de Renania del Norte-Westfalia que haya jugado en la Bundesliga entre 2000-01 y 2025-26',
    'Name a country that reached a World Cup semi-final between 1998 and 2022': 'Nombra una selección que haya llegado a semifinales de un Mundial entre 1998 y 2022',
    'Name a country that reached the Euro semi-finals between 1996 and 2024': 'Nombra una selección que haya llegado a semifinales de una Eurocopa entre 1996 y 2024',
    'Name a country that reached a World Cup quarter-final between 1998 and 2022': 'Nombra una selección que haya llegado a cuartos de final de un Mundial entre 1998 y 2022',
    'Name a country that has won the World Cup (up to 2022)': 'Nombra una selección que haya ganado el Mundial (hasta 2022)',
    'Name a country that has played in a World Cup final (up to 2022)': 'Nombra una selección que haya jugado una final del Mundial (hasta 2022)',
    'Name a country that hosted a World Cup up to 2022': 'Nombra un país que haya organizado un Mundial hasta 2022',
    'Name a country that has won the European Championship up to Euro 2024': 'Nombra una selección que haya ganado la Eurocopa hasta la Euro 2024',
    'Name a country that has won the Copa América up to 2024': 'Nombra una selección que haya ganado la Copa América hasta 2024',
    'Name a country that has won the Africa Cup of Nations up to 2023': 'Nombra una selección que haya ganado la Copa África hasta 2023',
    'Name a country that has won the AFC Asian Cup up to 2023': 'Nombra una selección que haya ganado la Copa Asiática hasta 2023',
    'Name a club that won the European Cup or Champions League up to 2024-25': 'Nombra un club que haya ganado la Copa de Europa o la Champions League hasta 2024-25',
    'Name an English club that won the top-flight league title between 1960-61 and 2024-25': 'Nombra un club inglés que haya ganado la liga de primera división entre 1960-61 y 2024-25',
    'Name an English club that won the FA Cup between 1990-91 and 2024-25': 'Nombra un club inglés que haya ganado la FA Cup entre 1990-91 y 2024-25',
    'Name an English club that won the League Cup between 1990-91 and 2024-25': 'Nombra un club inglés que haya ganado la Copa de la Liga entre 1990-91 y 2024-25',
    'Name a Spanish club that won the Copa del Rey between 2000-01 and 2024-25': 'Nombra un club español que haya ganado la Copa del Rey entre 2000-01 y 2024-25',
    'Name a German club that won the DFB-Pokal between 2000-01 and 2024-25': 'Nombra un club alemán que haya ganado la Copa de Alemania entre 2000-01 y 2024-25',
    'Name an Italian club that won the Coppa Italia between 2000-01 and 2024-25': 'Nombra un club italiano que haya ganado la Coppa Italia entre 2000-01 y 2024-25',
    'Name a French club that won the Coupe de France between 2000-01 and 2024-25': 'Nombra un club francés que haya ganado la Copa de Francia entre 2000-01 y 2024-25',
    'Name a club that won the UEFA Cup or Europa League between 2000-01 and 2024-25': 'Nombra un club que haya ganado la Copa de la UEFA o la Europa League entre 2000-01 y 2024-25',
    'Name a manager who won the Champions League between 1992-93 and 2024-25': 'Nombra un entrenador que haya ganado la Champions League entre 1992-93 y 2024-25',
}


def main():
    check = '--check' in sys.argv
    path = os.path.join(ROOT, 'duel', 'bank.json')
    bank = json.load(open(path, encoding='utf-8'))
    missing, added = [], 0
    for q in bank:
        if q.get('prompt_es'):
            continue
        es = tr(q['prompt'])
        if not es:
            missing.append(q['prompt'])
            continue
        if not check:
            q['prompt_es'] = es
            added += 1
    for m in missing:
        print('NO RULE:', m)
    if not check:
        json.dump(bank, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'added {added}, missing {len(missing)}')


if __name__ == '__main__':
    main()
