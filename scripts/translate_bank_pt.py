#!/usr/bin/env python3
"""Add Brazilian Portuguese prompts (prompt_pt) to duel/bank.json (used by Duels and Stable Hand).

Same idea as translate_bank_es.py: the bank's prompts follow a few fixed patterns, so they are translated by rule;
anything no rule matches is listed (add a rule or a MANUAL line). Questions that already have prompt_pt are kept.
Usage: python scripts/translate_bank_pt.py [--check]
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAT = {'Brazilian': 'brasileiro', 'Argentine': 'argentino', 'French': 'francês', 'Dutch': 'holandês', 'Spanish': 'espanhol',
       'Italian': 'italiano', 'Uruguayan': 'uruguaio', 'Portuguese': 'português', 'German': 'alemão', 'Belgian': 'belga',
       'Croatian': 'croata', 'Colombian': 'colombiano', 'Danish': 'dinamarquês', 'Swedish': 'sueco', 'Japanese': 'japonês',
       'Mexican': 'mexicano', 'English': 'inglês', 'American': 'americano', 'Serbian': 'sérvio', 'Moroccan': 'marroquino',
       'Nigerian': 'nigeriano', 'African': 'africano', 'Scottish': 'escocês',
       'Dutchman': 'holandês', 'Spaniard': 'espanhol', 'Frenchman': 'francês'}
ROLE = {'player': 'jogador', 'goalkeeper': 'goleiro', 'centre-back': 'zagueiro', 'left-back': 'lateral-esquerdo',
        'right-back': 'lateral-direito', 'striker': 'atacante', 'winger': 'ponta', 'midfielder': 'meio-campista',
        'defender': 'defensor', 'defensive midfielder': 'volante', 'manager': 'técnico'}
COUNTRY = {'Brazil': 'o Brasil', 'Argentina': 'a Argentina', 'France': 'a França', 'Germany': 'a Alemanha', 'Spain': 'a Espanha',
           'England': 'a Inglaterra', 'Portugal': 'Portugal', 'the Netherlands': 'a Holanda', 'Italy': 'a Itália',
           'Belgium': 'a Bélgica', 'Uruguay': 'o Uruguai', 'Croatia': 'a Croácia'}
LEAGUE = {'the Premier League': 'a Premier League', 'La Liga': 'LaLiga', 'Serie A': 'a Serie A italiana', 'the Bundesliga': 'a Bundesliga',
          'Ligue 1': 'a Ligue 1', 'the Scottish Premiership': 'a Premiership escocesa'}
LEAGUE_IN = {'the Premier League': 'na Premier League', 'La Liga': 'em LaLiga', 'Serie A': 'na Serie A italiana', 'the Bundesliga': 'na Bundesliga',
             'Ligue 1': 'na Ligue 1', 'the Scottish Premiership': 'na Premiership escocesa'}
LEAGUE_FROM = {'the Premier League': 'da Premier League', 'La Liga': 'de LaLiga', 'Serie A': 'da Serie A italiana', 'the Bundesliga': 'da Bundesliga',
               'Ligue 1': 'da Ligue 1', 'the Scottish Premiership': 'da Premiership escocesa'}
TROPHY = {'the Champions League': 'a Champions League', 'the Premier League': 'a Premier League', 'La Liga': 'LaLiga',
          'Serie A': 'a Serie A', 'the Bundesliga': 'a Bundesliga', 'Ligue 1': 'a Ligue 1', 'the Europa League': 'a Europa League',
          'the FA Cup': 'a FA Cup', 'the Eredivisie': 'a Eredivisie', 'the Primeira Liga': 'a Primeira Liga', 'the Copa del Rey': 'a Copa do Rei'}
GOALS_IN = {'Premier League': 'na Premier League', 'La Liga': 'em LaLiga', 'Serie A': 'na Serie A', 'Bundesliga': 'na Bundesliga',
            'Ligue 1': 'na Ligue 1', 'Champions League': 'na Champions League'}
INTL = {'Japan': 'do Japão', 'South Korea': 'da Coreia do Sul', 'Egypt': 'do Egito', 'Mexico': 'do México', 'Canada': 'do Canadá',
        'Chile': 'do Chile', 'Colombia': 'da Colômbia', 'Uruguay': 'do Uruguai', 'Ecuador': 'do Equador', 'Paraguay': 'do Paraguai',
        'Croatia': 'da Croácia', 'Morocco': 'do Marrocos', 'Austria': 'da Áustria'}
NAT_CLUB = {'English': 'inglês', 'Spanish': 'espanhol', 'German': 'alemão', 'Italian': 'italiano', 'French': 'francês'}


FEM = {'Juventus', 'Roma', 'Lazio', 'Fiorentina', 'Real Sociedad', 'Atalanta', 'Sampdoria', 'Udinese', 'Inter', 'Internazionale', 'Real Sociedad', 'Salernitana', 'Cremonese', 'Reggina', 'Fiorentina'}


def no(club):  # "no Barcelona" / "na Juventus"
    return ('na ' if club in FEM else 'no ') + club


def do(club):
    return ('da ' if club in FEM else 'do ') + club


def art(club):
    return ('a ' if club in FEM else 'o ') + club


def pelo(club):
    return ('pela ' if club in FEM else 'pelo ') + club


def por(country):  # "pelo Brasil", "pela Argentina", "por Portugal"
    return {'o ': 'pelo ', 'a ': 'pela '}.get(country[:2], 'por ') + (country[2:] if country[:2] in ('o ', 'a ') else country)


def span(s):
    s = s.strip()
    for pat, out in ((r'up to (\S+)', 'até {0}'), (r'between (\S+) and (\S+)', 'entre {0} e {1}'), (r'from (\S+) to (\S+)', 'entre {0} e {1}'),
                     (r'in the (\d{4})s', 'na década de {0}'), (r'in (\S+)', 'em {0}')):
        m = re.fullmatch(pat, s)
        if m:
            return out.format(*m.groups())
    return None


def tr(p):
    p = p.strip()
    nat = '|'.join(sorted(map(re.escape, NAT), key=len, reverse=True))
    role = '|'.join(sorted(map(re.escape, ROLE), key=len, reverse=True))
    lg = '|'.join(sorted(map(re.escape, LEAGUE), key=len, reverse=True))
    ctry = '|'.join(map(re.escape, COUNTRY))
    when = r'((?:up to|between|from|in) .+)'

    def who(n, r):
        n_pt = NAT.get(n, '') if n else ''
        if n and (not r or r == 'player'):
            return f'um {n_pt}'
        return f'um {ROLE.get(r or "player", "jogador")}' + (f' {n_pt}' if n_pt else '')

    m = re.fullmatch(rf'Name an? (?:({nat}) )?(?:({role}) )?who played for (.+?) {when}', p)
    if m and span(m.group(4)) and not m.group(3).startswith('both ') and ' at a ' not in m.group(3):
        return f'Cite {who(m.group(1), m.group(2))} que jogou {no(m.group(3))} {span(m.group(4))}'
    m = re.fullmatch(rf'Name a player who played for both (.+?) and (.+?) {when}', p)
    if m and span(m.group(3)):
        return f'Cite um jogador que jogou {no(m.group(1))} e {no(m.group(2))} {span(m.group(3))}'
    m = re.fullmatch(rf'Name a player who played for ({ctry}) at a (World Cup or Euro|World Cup|Euro|Copa América) {when}', p)
    if m and span(m.group(3)):
        t = {'World Cup or Euro': 'uma Copa do Mundo ou Eurocopa', 'World Cup': 'uma Copa do Mundo', 'Euro': 'uma Eurocopa', 'Copa América': 'uma Copa América'}[m.group(2)]
        return f'Cite um jogador que defendeu {COUNTRY[m.group(1)]} em {t} {span(m.group(3))}'
    m = re.fullmatch(rf'Name a player who won ({"|".join(map(re.escape, TROPHY))}) with (.+?) {when}', p)
    if m and span(m.group(3)):
        return f'Cite um jogador que ganhou {TROPHY[m.group(1)]} com {art(m.group(2))} {span(m.group(3))}'
    m = re.fullmatch(rf'Name an? (?:({nat}) )?(?:({role}) )?who played in ({lg}) {when}', p)
    if m and span(m.group(4)):
        return f'Cite {who(m.group(1), m.group(2))} que jogou {LEAGUE_IN[m.group(3)]} {span(m.group(4))}'
    m = re.fullmatch(r'Name a (player|defender) with (\d+\+) (Premier League|La Liga|Serie A|Bundesliga|Ligue 1|Champions League) (goals|assists) (.+)', p)
    if m:
        rest = m.group(5)
        rest_pt = '(desde 1992-93)' if rest == '(since 1992-93)' else span(rest)
        if rest_pt:
            what = 'gols' if m.group(4) == 'goals' else 'assistências'
            return f'Cite um {ROLE[m.group(1)]} com {m.group(2)} {what} {GOALS_IN[m.group(3)]} {rest_pt}'
    m = re.fullmatch(rf'Name a player who scored (\d+\+) (Premier League|La Liga|Serie A|Bundesliga) goals in a single season {when}', p)
    if m and span(m.group(3)):
        return f'Cite um jogador que marcou {m.group(1)} gols {GOALS_IN[m.group(2)]} numa única temporada {span(m.group(3))}'
    m = re.fullmatch(rf'Name a player who scored a (Premier League|Champions League) hat-trick {when}', p)
    if m and span(m.group(2)):
        return f'Cite um jogador que fez um hat-trick {GOALS_IN[m.group(1)]} {span(m.group(2))}'
    m = re.fullmatch(rf'Name a player who scored (\d+\+) goals for ({ctry}) {when}', p)
    if m and span(m.group(3)):
        return f'Cite um jogador que marcou {m.group(1)} gols {por(COUNTRY[m.group(2)])} {span(m.group(3))}'
    m = re.fullmatch(rf'Name an? ({nat}) ({role})', p)
    if m:
        return f'Cite um {ROLE[m.group(2)]} {NAT[m.group(1)]}'
    m = re.fullmatch(rf'Name a left-footed ({nat}) player', p)
    if m:
        return f'Cite um jogador canhoto {NAT[m.group(1)]}'
    m = re.fullmatch(r'Name a country that played at (?:the )?(\d{4}) World Cup', p)
    if m: return f'Cite uma seleção que jogou a Copa do Mundo de {m.group(1)}'
    m = re.fullmatch(r'Name a country that played at (?:the )?Euro (\d{4})', p)
    if m: return f'Cite uma seleção que jogou a Euro {m.group(1)}'
    m = re.fullmatch(r'Name a country that played at the (\d{4}) Copa América( Centenario)?', p)
    if m: return f'Cite uma seleção que jogou a Copa América{" Centenario" if m.group(2) else ""} {m.group(1)}'
    m = re.fullmatch(r'Name a country that played at the (\d{4}) Africa Cup of Nations', p)
    if m: return f'Cite uma seleção que jogou a Copa Africana de Nações de {m.group(1)}'
    m = re.fullmatch(r'Name a country that played at the (\d{4}) AFC Asian Cup', p)
    if m: return f'Cite uma seleção que jogou a Copa da Ásia de {m.group(1)}'
    m = re.fullmatch(rf'Name a club that played in ({lg}) {when}', p)
    if m and span(m.group(2)):
        return f'Cite um clube que jogou {LEAGUE_IN[m.group(1)]} {span(m.group(2))}'
    m = re.fullmatch(rf'Name a club relegated from ({lg}) {when}(?: \(relegation play-off losers included\))?', p)
    if m and span(m.group(2)):
        extra = ' (incluindo quem perdeu o playoff de rebaixamento)' if 'play-off' in p else ''
        return f'Cite um clube rebaixado {LEAGUE_FROM[m.group(1)]} {span(m.group(2))}{extra}'
    m = re.fullmatch(rf'Name an? ({nat})(?: manager)? who was a permanent Premier League manager {when}', p)
    if m and span(m.group(2)):
        return f'Cite um técnico {NAT[m.group(1)]} que foi técnico efetivo na Premier League {span(m.group(2))}'
    m = re.fullmatch(rf'Name a manager who won the (Premier League|La Liga|Bundesliga|Serie A) title {when}', p)
    if m and span(m.group(2)):
        return f'Cite um técnico que ganhou {TROPHY.get("the " + m.group(1), TROPHY.get(m.group(1)))} {span(m.group(2))}'
    m = re.fullmatch(rf'Name an? (English|Spanish|German|Italian) club that played in the Champions League group or league phase {when}', p)
    if m and span(m.group(2)):
        return f'Cite um clube {NAT_CLUB[m.group(1)]} que jogou a fase de grupos ou de liga da Champions League {span(m.group(2))}'
    m = re.fullmatch(r'Name a senior (.+?) international who played in the Premier League (.+)', p)
    if m and span(m.group(2)) and m.group(1) in INTL:
        return f'Cite um jogador da seleção principal {INTL[m.group(1)]} que jogou na Premier League {span(m.group(2))}'
    m = re.fullmatch(rf'Name an? ({nat})(?: player)? who played for the winning team in a Champions League final {when} \(starter or substitute who came on\)', p)
    if m and span(m.group(2)):
        return f'Cite um jogador {NAT[m.group(1)]} que jogou pelo time campeão numa final da Champions League {span(m.group(2))} (titular ou reserva que entrou)'
    m = re.fullmatch(rf'Name an? ({nat})(?: player)? who played in ({lg}) for (.+?) {when}', p)
    if m and span(m.group(4)):
        return f'Cite um jogador {NAT[m.group(1)]} que jogou {LEAGUE_IN[m.group(2)]} {pelo(m.group(3))} {span(m.group(4))}'
    m = re.fullmatch(rf'Name a country outside the UK that had a player in the Premier League for (.+?) {when} \(his national team, or country of birth if uncapped\)', p)
    if m and span(m.group(2)):
        return f'Cite um país de fora do Reino Unido que teve um jogador {do(m.group(1))} na Premier League {span(m.group(2))} (pela seleção dele, ou país de nascimento se nunca foi convocado)'
    m = re.fullmatch(r'Name a club promoted to (the Premier League|the Bundesliga|Serie A|La Liga|Ligue 1) in the summers of (\d{4}) to (\d{4}) \(automatic promotion or play-offs\)', p)
    if m:
        dst = {'the Premier League': 'à Premier League', 'the Bundesliga': 'à Bundesliga', 'Serie A': 'à Serie A italiana', 'La Liga': 'a LaLiga', 'Ligue 1': 'à Ligue 1'}[m.group(1)]
        return f'Cite um clube que subiu {dst} nas temporadas de {m.group(2)} a {m.group(3)} (acesso direto ou por playoff)'
    m = re.fullmatch(r'Name a country that played at the (\d{4}) FIFA Confederations Cup', p)
    if m: return f'Cite uma seleção que jogou a Copa das Confederações de {m.group(1)}'
    m = re.fullmatch(rf'Name a club that played in the Primeira Liga {when}', p)
    if m and span(m.group(1)):
        return f'Cite um clube que jogou a Primeira Liga portuguesa {span(m.group(1))}'
    return MANUAL.get(p)


MANUAL = {
    "Name a goalkeeper who scored a goal in a top-five European league up to 2025-26": "Cite um goleiro que marcou um gol numa das cinco grandes ligas europeias até 2025-26",
    "Name a London club that played in the Premier League up to 2025-26": "Cite um clube de Londres que jogou na Premier League até 2025-26",
    "Name a club from Andalusia that played in La Liga between 2000-01 and 2025-26": "Cite um clube da Andaluzia que jogou em LaLiga entre 2000-01 e 2025-26",
    "Name a club from North West England that played in the Premier League up to 2025-26": "Cite um clube do noroeste da Inglaterra que jogou na Premier League até 2025-26",
    "Name a country that reached a World Cup semi-final between 1998 and 2022": "Cite uma seleção que chegou à semifinal de uma Copa do Mundo entre 1998 e 2022",
    "Name a country that reached the Euro semi-finals between 1996 and 2024": "Cite uma seleção que chegou à semifinal de uma Eurocopa entre 1996 e 2024",
    "Name a country that has won the World Cup (up to 2022)": "Cite uma seleção campeã da Copa do Mundo (até 2022)",
    "Name a country that has played in a World Cup final (up to 2022)": "Cite uma seleção que jogou uma final de Copa do Mundo (até 2022)",
    "Name a country that hosted a World Cup up to 2022": "Cite um país que sediou uma Copa do Mundo até 2022",
    "Name a country that has won the European Championship up to Euro 2024": "Cite uma seleção campeã da Eurocopa até a Euro 2024",
    "Name a country that has won the Copa América up to 2024": "Cite uma seleção campeã da Copa América até 2024",
    "Name a country that has won the Africa Cup of Nations up to 2023": "Cite uma seleção campeã da Copa Africana de Nações até 2023",
    "Name a country that has won the AFC Asian Cup up to 2023": "Cite uma seleção campeã da Copa da Ásia até 2023",
    "Name a club that won the European Cup or Champions League up to 2024-25": "Cite um clube que ganhou a Copa dos Campeões ou a Champions League até 2024-25",
    "Name an English club that won the top-flight league title between 1960-61 and 2024-25": "Cite um clube inglês campeão da primeira divisão entre 1960-61 e 2024-25",
    "Name an English club that won the FA Cup between 1990-91 and 2024-25": "Cite um clube inglês que ganhou a FA Cup entre 1990-91 e 2024-25",
    "Name an English club that won the League Cup between 1990-91 and 2024-25": "Cite um clube inglês que ganhou a Copa da Liga Inglesa entre 1990-91 e 2024-25",
    "Name a Spanish club that won the Copa del Rey between 2000-01 and 2024-25": "Cite um clube espanhol que ganhou a Copa do Rei entre 2000-01 e 2024-25",
    "Name a German club that won the DFB-Pokal between 2000-01 and 2024-25": "Cite um clube alemão que ganhou a Copa da Alemanha entre 2000-01 e 2024-25",
    "Name an Italian club that won the Coppa Italia between 2000-01 and 2024-25": "Cite um clube italiano que ganhou a Copa da Itália entre 2000-01 e 2024-25",
    "Name a French club that won the Coupe de France between 2000-01 and 2024-25": "Cite um clube francês que ganhou a Copa da França entre 2000-01 e 2024-25",
    "Name a club that won the UEFA Cup or Europa League between 2000-01 and 2024-25": "Cite um clube que ganhou a Copa da UEFA ou a Europa League entre 2000-01 e 2024-25",
    "Name a manager who won the Champions League between 1992-93 and 2024-25": "Cite um técnico que ganhou a Champions League entre 1992-93 e 2024-25",
    "Name a club relegated from Ligue 1 between 2014-15 and 2024-25 (relegation play-off losers included)": "Cite um clube rebaixado da Ligue 1 entre 2014-15 e 2024-25 (incluindo quem perdeu o playoff de rebaixamento)",
    "Name a club from the Midlands of England that played in the Premier League up to 2025-26": "Cite um clube das Midlands inglesas que jogou na Premier League até 2025-26",
    "Name a club from North Rhine-Westphalia that played in the Bundesliga between 2000-01 and 2025-26": "Cite um clube da Renânia do Norte-Vestfália que jogou na Bundesliga entre 2000-01 e 2025-26",
    "Name a country that reached a World Cup quarter-final between 1998 and 2022": "Cite uma seleção que chegou às quartas de final de uma Copa do Mundo entre 1998 e 2022",
    "Name a manager who won the Europa League or UEFA Cup between 2000-01 and 2024-25": "Cite um técnico que ganhou a Europa League ou a Copa da UEFA entre 2000-01 e 2024-25",
    "Name a manager who won the FA Cup between 2000-01 and 2024-25": "Cite um técnico que ganhou a FA Cup entre 2000-01 e 2024-25",
    "Name a manager who won the English League Cup between 2000-01 and 2024-25": "Cite um técnico que ganhou a Copa da Liga Inglesa entre 2000-01 e 2024-25",
    "Name a manager who won the Copa del Rey between 2000-01 and 2024-25": "Cite um técnico que ganhou a Copa do Rei entre 2000-01 e 2024-25",
    "Name a club from London that played in the Premier League between 2000-01 and 2025-26": "Cite um clube de Londres que jogou na Premier League entre 2000-01 e 2025-26",
    "Name a club that played in a European Cup or Champions League final between 1992-93 and 2025-26": "Cite um clube que jogou uma final da Champions League entre 1992-93 e 2025-26",
    "Name a club that played in a UEFA Cup or Europa League final between 2000-01 and 2025-26": "Cite um clube que jogou uma final da Copa da UEFA ou da Europa League entre 2000-01 e 2025-26",
    "Name a club that reached the Champions League semi-finals between 2000-01 and 2025-26": "Cite um clube que chegou à semifinal da Champions League entre 2000-01 e 2025-26",
    "Name a club that reached the Champions League quarter-finals between 2008-09 and 2025-26": "Cite um clube que chegou às quartas de final da Champions League entre 2008-09 e 2025-26",
    "Name a club that reached the Europa League semi-finals between 2009-10 and 2025-26": "Cite um clube que chegou à semifinal da Europa League entre 2009-10 e 2025-26",
    "Name a club that reached the Europa League quarter-finals between 2009-10 and 2025-26": "Cite um clube que chegou às quartas de final da Europa League entre 2009-10 e 2025-26",
    "Name a player who played in both the Premier League and the A-League Men up to 2025-26 (league games in each)": "Cite um jogador que jogou na Premier League e na A-League australiana até 2025-26 (jogos de liga nas duas)",
    "Name a club that played in La Liga between 2000-01 and 2025-26 whose traditional home shirt is blue and white vertical stripes": "Cite um clube que jogou em LaLiga entre 2000-01 e 2025-26 cuja camisa tradicional tem listras verticais azuis e brancas",
    "Name a club from Emilia-Romagna that played in Serie A between 2000-01 and 2025-26": "Cite um clube da Emília-Romanha que jogou na Serie A italiana entre 2000-01 e 2025-26"
}


def main():
    check = '--check' in sys.argv
    path = os.path.join(ROOT, 'duel', 'bank.json')
    raw = open(path, encoding='utf-8').read()
    bank = json.loads(raw)
    missing, added = [], 0
    for q in bank:
        if q.get('prompt_pt'):
            continue
        pt = tr(q['prompt'])
        if not pt:
            missing.append(q['prompt'])
            continue
        if not check:
            q['prompt_pt'] = pt
            added += 1
    for m in missing:
        print('NO RULE:', m)
    if not check and added:
        json.dump(bank, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'added {added}, missing {len(missing)}')


if __name__ == '__main__':
    main()
