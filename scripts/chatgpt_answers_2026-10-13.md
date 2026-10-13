You are building answer lists for Unicorner, a daily football trivia game. For each question, players type ONE valid answer. Rare answers score more, so every answer needs a "fame" rating for how likely a typical football fan is to think of it (not how big the number is):

- fame 5 = Tap-in (10 pts): the obvious answer most people say first
- fame 4 = Header (30 pts): well known
- fame 3 = Volley (60 pts): a real fan knows it
- fame 2 = Bicycle kick (85 pts): deep knowledge
- fame 1 = Screamer (100 pts): almost nobody will think of it

These are "stat threshold" questions (100+ caps, 50+ assists, and so on). Please browse and check current figures; do not answer from memory.

RULES (every question must pass all of them):
1. The list must be COMPLETE: every answer that meets the threshold within the scope line. Missing a valid answer is the worst mistake, because a player who types it gets told they're wrong. Check sources (official federation/league sites, Wikipedia lists, RSSSF, Transfermarkt) before answering.
2. Players right at or near the threshold are where mistakes happen. Double-check anyone within 3 of the line, and put the exact figure in "stat" so I can verify it.
3. At least 9 answers per question. If a question genuinely has fewer than 9 valid answers, say so in "clash_note" instead of padding it.
4. Every question must use all five fame levels, including at least one fame 1 Screamer and at least one fame 5 Tap-in. Most answers should sit at fame 2–4. Old-era and lesser-known players are the Screamers.
5. "aliases" = other ways people type the same answer: surnames, nicknames, spellings without accents, common misspellings, and the Spanish spelling. For example: "Sergio Ramos" → ["Ramos"]; "Real Club Deportivo Mallorca" → ["Mallorca", "RCD Mallorca"]. Don't include an alias that could also mean a different valid answer (e.g. don't give "Ronaldo" if two different Ronaldos are valid).
6. For club answers whose Spanish name differs, add "name_es" with the Spanish name.
7. Use "clash_note" for anything tricky: who counts, who doesn't, disputed figures, and names that could be confused.
8. If you are not sure an answer is correct, leave it out and list it under "unsure" with the reason.
9. Give the sources you used in "sources" (URLs).

Reply with ONLY one JSON array, one object per question, in this exact shape:

[
  {
    "key": "S2",
    "clash_note": "…",
    "sources": ["https://…"],
    "answers": [
      {"name": "Sergio Ramos", "aliases": ["Ramos"], "fame": 5, "stat": 180},
      {"name": "Andoni Zubizarreta", "aliases": ["Zubizarreta", "Zubi"], "fame": 2, "stat": 126}
    ],
    "unsure": []
  }
]

THE QUESTIONS (the scope line sets exactly who counts; stick to it):

S1. Name a Spanish club with "Real" in its full name
    Scope: Spanish men's clubs whose OFFICIAL full name contains "Real" (or the Catalan "Reial"), that have played at least one season in LaLiga or the Segunda División (any era, including clubs that have since dissolved or been refounded). The club counts even if people don't usually say "Real" (e.g. Espanyol = Reial Club Deportiu Espanyol). Put the official full name in "stat".

S2. Name a player with 100+ caps for Spain
    Scope: Senior men's Spain national team, official caps per the RFEF, 100 or more, counted up to 1 October 2026 (so the 2026 World Cup counts). Put the number of caps in "stat".

S3. Name a player with 100+ caps for England
    Scope: Senior men's England national team, official caps per the FA, 100 or more, up to 1 October 2026. Put the number of caps in "stat".

S4. Name a player with 100+ caps for Argentina
    Scope: Senior men's Argentina national team, official caps per the AFA / RSSSF, 100 or more, up to 1 October 2026. Put the number of caps in "stat".

S5. Name a player with 100+ caps for Germany
    Scope: Senior men's Germany national team including West Germany caps (East Germany caps do not count), official DFB figures, 100 or more, up to 1 October 2026. Put the number of caps in "stat".

S6. Name a player with 25+ goals for Spain
    Scope: Senior men's Spain national team, official RFEF goal counts, 25 or more, up to 1 October 2026. Put the number of goals in "stat".

S7. Name a player with 100+ Premier League goals
    Scope: Premier League goals only (1992-93 onwards), official Premier League figures, 100 or more, up to 1 October 2026. Put the number of goals in "stat".

S8. Name a player with 50+ Premier League assists
    Scope: Premier League assists as recorded by the official Premier League website (premierleague.com), 50 or more, up to 1 October 2026. Use ONLY the official PL figures, not Opta-alternatives or other sites, because assist counts differ between sources. Put the number of assists in "stat".

S9. Name a player with 200+ LaLiga goals
    Scope: Goals in the Spanish top division (LaLiga / Primera División) in all eras since 1929, official LaLiga figures, 200 or more, up to 1 October 2026. Put the number of goals in "stat".

S10. Name a player with 50+ Champions League goals
    Scope: UEFA Champions League goals from 1992-93 onwards (not the old European Cup), qualifying rounds excluded, official UEFA figures, 50 or more, up to 1 October 2026. Put the number of goals in "stat".
