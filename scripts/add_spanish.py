"""Add Spanish text (prompt_es, subtitle_es) and Spanish answer spellings to the daily question files.

Run: python3 scripts/add_spanish.py [first-day]   (default: today's files onward)
Prompts without a translation here are listed at the end; the site shows English for those.
"""
import json, sys, glob, datetime, re

PROMPTS = {
 'h005': "Nombra un holandés que haya jugado en el Barcelona",
 'k009': "Marcó en una final de la Champions League",
 'r015': "Convocado por Francia en la Euro 2000 o el Mundial 2006",
 'g008': "Jugó en el Man United y en el Man City",
 'c010': "Nombra un club que haya jugado en LaLiga entre 2020-21 y 2025-26",
 'c017': "Jugó en el Olympique de Marsella en 2023-24",
 'k005': "Nombra un club que haya entrenado José Mourinho",
 'h014': "Nombra un club de la Premier League que empiece por S o W",
 'k007': "Nombra un ganador de la Bota de Oro de un Mundial",
 'b009': "Nombra un estadio que acogió un partido de la Euro 2024",
 'b004': "Nombra un club que haya ganado la FA Cup",
 'r014': "Jugó en el Barcelona campeón de Champions de 2010–11",
 'b001': "Nombra un país que haya organizado un Mundial masculino",
 'g003': "Nombra un holandés que haya jugado en el Man United",
 'g009': "Jugó en el Real Madrid y en el Atlético de Madrid",
 'c007': "Nombra un club en el que haya jugado Jadon Sancho",
 'c016': "Ganó el Pichichi entre 2014-15 y 2024-25",
 'h002': "Nombra un brasileño que haya jugado en el Barcelona",
 'r018': "Jugó en el Inter del triplete de 2009–10",
 'g013': "Nombra un jugador de la Premier League cuyo apellido empiece por X o Y",
 'r006': "Jugó en el Real Madrid entre 2000-01 y 2003-04",
 'c014': "Marcó con Argentina en un Mundial o una Copa América, 2018-2024",
 'k001': "Nombra un club que haya ganado la Copa de la UEFA o la Europa League",
 'g011': "Jugó en la Juventus y en el Inter",
 'b006': "Nombra un país que haya ganado la Copa África",
 'r002': "Nombra un club en el que haya jugado Ronaldinho",
 'g002': "Nombra un francés que haya jugado en el Arsenal",
 'r010': "Jugó en el Milan en la temporada 2006-07",
 'g010': "Jugó en el Liverpool y en el Everton",
 'h013': "Nombra un campeón del mundo cuyo apellido empiece por B",
 'k002': "Nombra un club que haya ganado la Bundesliga",
 'b002': "Nombra un jugador que haya ganado el Balón de Oro",
 'c015': "Jugó en el Leverkusen invicto de 2023-24",
 'g006': "Nombra un italiano que haya jugado en el Chelsea",
 'b003': "Nombra un país que haya ganado la Eurocopa o la Copa América",
 'r004': "Jugó en el Arsenal de los Invencibles de 2003-04",
 'h015': 'Nombra un club de la Premier League con "City" en su nombre',
 'g007': "Jugó en el Barcelona y en el Real Madrid",
 'r012': "Nombra un club en el que haya jugado Zlatan Ibrahimović",
 'k010': "Marcó 10 o más goles en una sola temporada de Champions",
 'r016': "Jugó en el Liverpool campeón de Champions de 2004–05",
 'h016': "Nombra una selección que jugó la Euro 2024",
 'g001': "Nombra un brasileño que haya jugado en el Real Madrid",
 'r003': "Nombra un club que ganó la Champions League entre 1995 y 2012",
 'k006': "Nombra un ganador del Guante de Oro de la Premier League",
 'r011': "Nombra un club en el que haya jugado Thierry Henry",
 'u070': "Jugó con el Newcastle en la Champions 2023-24",
 'h004': "Nombra un argentino que haya jugado en el Real Madrid",
 'g014': "Nombra un campeón del mundo cuyo apellido empiece por M",
 'h007': "Jugó en el Chelsea y en el Tottenham",
 'u065': "Jugó en el Aston Villa en la temporada 2023-24",
 'b010': "Nombra un país que haya ganado el Mundial masculino",
 'k003': "Nombra un club que haya ganado la Serie A",
 'r019': "Ganó la Bota de Oro europea entre 2000 y 2012",
 'h011': "Jugó en la Premier con el Man United y con el Chelsea",
 'c018': "Nombra un club en el que haya jugado Julian Draxler",
 'k004': "Nombra un entrenador del Real Madrid",
 'g005': "Nombra un argentino que haya jugado en el Barcelona",
 'u004': "Jugó un partido de Serie A con la Juventus entre 2020-21 y 2021-22",
 'h012': "Nombra un campeón de la Champions cuyo apellido empiece por K",
 'h010': "Jugó en la Premier con el Liverpool y con el Chelsea",
 'r008': "Jugó en el Man United en la temporada 2007-08",
 'k014': "Llevó el dorsal 10 del Barcelona",
 'r013': "Nombra un club que ganó la Premier League o LaLiga entre 1995 y 2012",
 'k013': "Nombra un país con algún club campeón de la Copa de Europa o la Champions",
 'g015': "Nombra un club de la Premier League que empiece por B",
 'r017': "Convocado por Brasil para el Mundial 2006",
 'h003': "Nombra un francés que haya jugado en el Chelsea",
 'c021': "Nombra un club en el que haya jugado Ángel Di María",
 'b007': "Nombra un entrenador del Barcelona con Messi en el primer equipo",
 'e010': "Jugó 10 o más partidos de Serie A con la Juventus desde 2018/19",
 'k011': "Nombra un país que haya llegado a una final de la Eurocopa",
 'g004': "Nombra un español que haya jugado en el Liverpool",
 'h009': "Jugó en el Arsenal y en el Man United",
 'b005': "Nombra un club que jugó la primera temporada de la Premier League",
}

SUBS = {
 "Competitive first-team games, all-time": "Partidos oficiales con el primer equipo, en toda la historia",
 "Finals 2012–2025, not counting shootouts": "Finales 2012–2025, sin contar tandas de penaltis",
 "Euro 2000 or World Cup 2006 squads": "Convocatorias de la Euro 2000 o del Mundial 2006",
 "LaLiga seasons 2020-21 through 2025-26": "Temporadas de LaLiga de 2020-21 a 2025-26",
 "All senior competitions, 2023-24": "Todas las competiciones, 2023-24",
 "Senior clubs, up to 2025": "Clubes profesionales, hasta 2025",
 "Any season, 1992–2025": "Cualquier temporada, 1992–2025",
 "1982–2022, including shared": "1982–2022, incluidos los compartidos",
 "All 10 venues": "Las 10 sedes",
 "Finals 2000–2025": "Finales 2000–2025",
 "2010/11 competitive first-team appearances": "Partidos oficiales con el primer equipo en 2010/11",
 "1930–2026, including co-hosts": "1930–2026, incluidos los coorganizadores",
 "Premier League, 1992–2025": "Premier League, 1992–2025",
 "Whole senior career through 20 September 2026": "Toda su carrera profesional hasta el 20 de septiembre de 2026",
 "LaLiga seasons 2014-15 through 2024-25": "Temporadas de LaLiga de 2014-15 a 2024-25",
 "2009/10 competitive appearances, cups included": "Partidos oficiales en 2009/10, copas incluidas",
 "1992–2025, 1+ PL appearance": "1992–2025, al menos un partido en la Premier",
 "Shortened Galácticos range: 2000-01 through 2003-04": "Época de los Galácticos: de 2000-01 a 2003-04",
 "World Cup and Copa América, 2018 through 2024": "Mundial y Copa América, de 2018 a 2024",
 "Tournaments up to 2023": "Torneos hasta 2023",
 "Senior competitive appearances, 1998–2015": "Partidos oficiales como profesional, 1998–2015",
 "2006-07 Champions League-winning season": "Temporada 2006-07, campeón de la Champions",
 "Winning squads, 1998–2022": "Plantillas campeonas, 1998–2022",
 "All-time, 1963–64 to 2024–25": "Toda la historia, de 1963–64 a 2024–25",
 "Men's award, 2000–2025": "Premio masculino, 2000–2025",
 "Men's tournaments, up to 2024": "Torneos masculinos, hasta 2024",
 "Arsenal, 2003-04": "Arsenal, 2003-04",
 "Senior career, 1999–2023": "Carrera profesional, 1999–2023",
 "2000–01 to 2024–25, qualifying rounds excluded": "De 2000–01 a 2024–25, sin contar las rondas previas",
 "2004/05 competitive first-team appearances": "Partidos oficiales con el primer equipo en 2004/05",
 "All 24 teams at the finals in Germany": "Las 24 selecciones de la fase final en Alemania",
 "Final years 1995 through 2012, inclusive": "Finales de 1995 a 2012, ambas incluidas",
 "2004–05 to 2024–25, including shared": "De 2004–05 a 2024–25, incluidos los compartidos",
 "Senior career, 1994–2014": "Carrera profesional, 1994–2014",
 "2023-24 UEFA Champions League group stage": "Fase de grupos de la Champions 2023-24",
 "Winning squads, 2006–2022": "Plantillas campeonas, 2006–2022",
 "2023-24 first-team season": "Temporada 2023-24 con el primer equipo",
 "Tournaments up to 2022": "Torneos hasta 2022",
 "All-time Italian champions, up to 2024–25": "Campeones de Italia de toda la historia, hasta 2024–25",
 "Awards 2000–2012 inclusive": "Premios de 2000 a 2012, ambos incluidos",
 "1992–2025": "1992–2025",
 "Senior clubs through 20 September 2026": "Clubes profesionales hasta el 20 de septiembre de 2026",
 "2000–2025, including interim": "2000–2025, incluidos los interinos",
 "League appearances, 2020-21 to 2021-22": "Partidos de liga, de 2020-21 a 2021-22",
 "Winning squads, 2000–2025": "Plantillas campeonas, 2000–2025",
 "2007-08 Champions League-winning season": "Temporada 2007-08, campeón de la Champions",
 "Official squad number, 1995–96 to 2025–26": "Dorsal oficial, de 1995–96 a 2025–26",
 "Champions crowned 1995–2012 inclusive": "Campeones de 1995 a 2012, ambos incluidos",
 "Up to 2025": "Hasta 2025",
 "Official 23-man Germany 2006 squad": "Lista oficial de 23 para Alemania 2006",
 "2004–2021, including interim": "2004–2021, incluidos los interinos",
 "Serie A appearances, 2018/19 through 2025/26": "Partidos de Serie A, de 2018/19 a 2025/26",
 "Men's, all-time up to 2024": "Masculina, toda la historia hasta 2024",
 "1992–93, all 22 clubs": "1992–93, los 22 clubes",
}
def sub_es(s):
    if not s: return ''
    if s in SUBS: return SUBS[s]
    m = re.fullmatch(r"Competitive first-team games, (\d{4}–\d{4})", s)
    if m: return f"Partidos oficiales con el primer equipo, {m.group(1)}"
    return None

# Spanish spellings that should count as the same answer (added as aliases, so they work in both languages)
COUNTRY = {
 'Algeria':['Argelia'],'Belgium':['Bélgica'],'Brazil':['Brasil'],'Cameroon':['Camerún'],'Canada':['Canadá'],
 'Croatia':['Croacia'],'Czech Republic':['República Checa','Chequia'],'Czechoslovakia':['Checoslovaquia'],
 'DR Congo':['RD Congo','República Democrática del Congo'],'Denmark':['Dinamarca'],'Egypt':['Egipto'],
 'England':['Inglaterra'],'Ethiopia':['Etiopía'],'France':['Francia'],'Germany':['Alemania','Alemania Occidental'],
 'Greece':['Grecia'],'Hungary':['Hungría'],'Italy':['Italia'],'Ivory Coast':['Costa de Marfil'],'Japan':['Japón'],
 'Mexico':['México','Méjico'],'Morocco':['Marruecos'],'Netherlands':['Países Bajos','Holanda'],'Peru':['Perú'],
 'Poland':['Polonia'],'Romania':['Rumanía','Rumania'],'Russia':['Rusia'],'Scotland':['Escocia'],
 'Slovakia':['Eslovaquia'],'Slovenia':['Eslovenia'],'South Africa':['Sudáfrica'],'South Korea':['Corea del Sur','Corea'],
 'Soviet Union':['Unión Soviética','URSS'],'Spain':['España'],'Sudan':['Sudán'],'Sweden':['Suecia'],
 'Switzerland':['Suiza'],'Tunisia':['Túnez'],'Turkey':['Turquía'],'Ukraine':['Ucrania'],
 'United States':['Estados Unidos','EEUU','EE UU'],'Qatar':['Catar'],
}
CLUB = {
 '1. FC Köln':['Colonia'],'1. FC Nürnberg':['Núremberg'],'1860 Munich':['1860 Múnich'],'Atlético Madrid':['Atlético de Madrid'],
 'Bayern Munich':['Bayern de Múnich','Bayern Múnich'],'CSKA Moscow':['CSKA de Moscú','CSKA Moscú'],'Deportivo':['Deportivo de La Coruña','Depor'],
 'Hamburger SV':['Hamburgo'],'Inter':['Inter de Milán'],'Inter Milan':['Inter de Milán'],'Monaco':['Mónaco'],'Napoli':['Nápoles'],
 'PSG':['París Saint-Germain','Paris Saint-Germain'],'Porto':['Oporto'],'Shakhtar Donetsk':['Shajtar Donetsk','Shajtar'],
 'Zenit St Petersburg':['Zenit de San Petersburgo'],'Bologna':['Bolonia'],'Marseille':['Olympique de Marsella','Marsella'],
 'Sevilla':['Sevilla FC'],'Tottenham':['Tottenham Hotspur'],
}

NO_DISPLAY = {'Sevilla', 'Tottenham'}  # aliases only; the English name already reads fine in Spanish

def main():
    first = sys.argv[1] if len(sys.argv) > 1 else datetime.date.today().isoformat()
    missing = []
    for f in sorted(glob.glob('daily/*.json')):
        if f[6:16] < first: continue
        d = json.load(open(f, encoding='utf-8'))
        for q in d['questions']:
            qid = q.get('id') or q.get('_id')
            if qid in PROMPTS: q['prompt_es'] = PROMPTS[qid]
            else: missing.append((f[6:16], qid, q['prompt']))
            se = sub_es(q.get('subtitle', ''))
            if se is not None: q['subtitle_es'] = se
            elif q.get('subtitle'): missing.append((f[6:16], qid, 'SUB: ' + q['subtitle']))
            table = COUNTRY if q.get('answer_type') == 'country' else CLUB if q.get('answer_type') == 'club' else {}
            for a in q['answers']:
                es = table.get(a['name'], [])
                if es and a['name'] not in NO_DISPLAY: a['name_es'] = es[0]   # shown instead of the English name in Spanish
                for alias in es:
                    if alias not in a.setdefault('aliases', []) and alias != a['name']:
                        a['aliases'].append(alias)
        raw = open(f, encoding='utf-8').read()
        out = json.dumps(d, ensure_ascii='\\u' in raw, separators=(',', ':'))
        open(f, 'w', encoding='utf-8').write(out + ('\n' if raw.endswith('\n') else ''))
    for m in missing: print('no Spanish yet:', *m)

if __name__ == '__main__':
    main()
