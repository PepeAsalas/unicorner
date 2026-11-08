"""Short explanations for football terms that many players won't know (trophies, foreign leagues and cups).

Used by build_rosco.py (Rosco clue subtitles) and by explain_questions.py (Millions question notes), so a clue like
"Won the PFA Players' Player of the Year" also says what that award is. English and Spanish.
Keep each line short, plain and true. Famous names (Ballon d'Or, FA Cup, Champions League) need no explanation.
"""
import re

# (pattern matched on the English text, English explanation, Spanish explanation)
TERMS = [
    (r"PFA Players' Player", "England's player of the year award",
     'El premio al mejor jugador del año en Inglaterra'),
    (r'PFA Young Player', "England's best young player of the year, voted for by the players",
     'El mejor joven del año en Inglaterra, votado por los futbolistas'),
    (r'Golden Glove', 'The award for the Premier League goalkeeper with the most clean sheets',
     'El premio al portero de la Premier con más porterías a cero'),
    (r'Golden Shoe', 'The award for the top league scorer in all of Europe',
     'El premio al máximo goleador de todas las ligas de Europa'),
    (r'Golden Boy', 'The award for the best under-21 player at a European club',
     'El premio al mejor jugador sub-21 de un club europeo'),
    (r'Capocannoniere', 'The Serie A top scorer', 'El máximo goleador de la Serie A'),
    (r"Cup Winners' Cup", "An old European competition for each country's cup winners",
     'Un antiguo torneo europeo para los campeones de copa de cada país'),
    (r'Fairs Cup', 'The forerunner of the UEFA Cup, played from 1955 to 1971',
     'El antecesor de la Copa de la UEFA, jugado de 1955 a 1971'),
    (r'Copa Libertadores', "South America's Champions League", 'La Champions de Sudamérica'),
    (r'Copa Sudamericana', "South America's second club competition, like the Europa League",
     'La segunda competición de clubes de Sudamérica, como la Europa League'),
    (r'Club World Cup', 'The FIFA tournament between the best clubs of each continent',
     'El torneo de la FIFA entre los mejores clubes de cada continente'),
    (r'Conference League', "UEFA's third club competition, started in 2021", 'La tercera competición de la UEFA, creada en 2021'),
    (r'Eredivisie', 'The Dutch top league', 'La primera división de Países Bajos'),
    (r'Primeira Liga', "Portugal's top league", 'La primera división de Portugal'),
    (r'Coppa Italia', "Italy's main cup", 'La copa nacional de Italia'),
    (r'DFB-Pokal', "Germany's main cup", 'La copa nacional de Alemania'),
    (r'Coupe de France', "France's main cup", 'La copa nacional de Francia'),
    (r'Super Lig|Süper Lig', "Turkey's top league", 'La primera división de Turquía'),
    (r'Invincibles', 'The Arsenal team that went a whole Premier League season unbeaten',
     'El Arsenal que pasó una temporada entera de Premier sin perder'),
    (r'European Cup(?! Winners)', "The Champions League's name until 1992", 'El nombre de la Champions hasta 1992'),
    (r'permanent (Premier League )?manager', "Caretaker and interim managers don't count", 'No cuentan los interinos'),
]


# a term is not explained again when the clue's own subtitle already covers it
ALREADY = {
    'permanent': r'caretaker|interim',
    'PFA': r'player of the year',
}


def explain(prompt, subtitle=''):
    """The explanations that apply to an English prompt: [(en, es), ...]. Terms only count in the prompt itself."""
    out = []
    for pat, en, es in TERMS:
        if not re.search(pat, prompt or '', re.I) or (en, es) in out:
            continue
        key = next((k for k in ALREADY if k.lower() in pat.lower()), None)
        if key and re.search(ALREADY[key], subtitle or '', re.I):
            continue
        out.append((en, es))
    return out


def merge(existing, extra):
    """Add explanations to an existing subtitle without repeating what is already there."""
    parts = [existing] if existing else []
    for x in extra:
        if x.lower() not in (existing or '').lower():
            parts.append(x)
    return ' · '.join(p for p in parts if p)
