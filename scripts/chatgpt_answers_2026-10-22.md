You are building answer lists for Unicorner, a daily football trivia game. For each question, players type ONE valid answer. Rare answers score more, so every answer needs a "fame" rating:

- fame 5 = Tap-in (10 pts): the obvious answer most people say first
- fame 4 = Header (25 pts): well known
- fame 3 = Volley (40 pts): a real fan knows it
- fame 2 = Bicycle kick (70 pts): deep knowledge
- fame 1 = Screamer (100 pts): almost nobody will think of it

RULES (every question must pass all of them):
1. The list must be COMPLETE: every answer that fits the question and its scope line. Missing a valid answer is the worst mistake, because a player who types it gets told they're wrong. Check sources (Wikipedia, Transfermarkt, official sites) before answering.
2. At least 9 answers per question.
3. Every question must use all five fame levels, including at least one fame 1 Screamer and at least one fame 5 Tap-in. Most answers should sit at fame 2–4.
4. "aliases" = other ways people type the same answer: surnames, nicknames, spellings without accents, common misspellings, and the Spanish spelling. For example: "Atlético Madrid" → ["Atletico Madrid", "Atleti", "Atlético de Madrid"]. Don't include an alias that could also mean a different valid answer.
5. For club and country answers whose Spanish name differs, add "name_es" with the Spanish name, e.g. "name_es": "Inglaterra".
6. Use "clash_note" for anything tricky: who counts, who doesn't, and names that could be confused.
7. If you are not sure an answer is correct, leave it out and list it under "unsure" instead.

Reply with ONLY one JSON array, one object per question, in this exact shape:

[
  {
    "key": "N1",
    "clash_note": "…",
    "answers": [
      {"name": "Real Madrid", "aliases": [], "fame": 5},
      {"name": "Monaco", "aliases": ["AS Monaco", "Mónaco"], "fame": 1, "name_es": "Mónaco"}
    ],
    "unsure": []
  }
]

THE QUESTIONS (the line under each one sets the scope; stick to it exactly):

N1. Name a club that has played in a Champions League final
    Scope: finals from 1992-93 to 2024-25, winners and losers

N2. Name a player who has captained England
    Scope: wore the armband for the senior men's team at any point in a match, 2000 to 2025

N3. Name an African player who has won the Premier League
    Scope: plays for an African national team; made at least one league appearance in a title-winning season, 1992-93 to 2024-25

N4. Name an Asian country that has played at a men's World Cup
    Scope: members of the Asian Football Confederation (AFC) today, finals tournaments 1930 to 2026. Australia counts. Include historic names such as Dutch East Indies (Indonesia) as aliases of the modern country.

N6. Name a player sold for €80m or more
    Scope: a single transfer fee of €80m or more including add-ons, up to the end of the summer 2026 window

N7. Name a club relegated from the Premier League
    Scope: relegated at the end of a season from 2015-16 to 2024-25

N8. Name a player who scored in El Clásico
    Scope: Real Madrid v Barcelona, all competitions, 2010 to 2025. Own goals don't count.

N9. Name a Brazilian who has played in the Premier League
    Scope: 50 or more Premier League appearances, 1992-93 to 2024-25

N10. Name a club that played in Serie A in 2024-25
    Scope: the 20 clubs of that season

N11. Name a player who played in the 2014 World Cup final
    Scope: Germany v Argentina, starters plus substitutes who came on

N12. Name a club that played in the Bundesliga
    Scope: any season from 2015-16 to 2024-25

N13. Name a country that has won Olympic gold in men's football
    Scope: Olympic Games 1900 to 2024, including Great Britain and teams that no longer exist (USSR, Yugoslavia, East Germany, Czechoslovakia)
