You are updating answer lists for Unicorner, a daily football trivia game. Three questions currently stop at the 2022 World Cup. Extend each one to include the 2026 men's World Cup (USA, Canada, Mexico). Check the 2026 results before answering: who played the final and who won.

Fame scale for any NEW answers you add (rarer = more points):
- fame 5 = Tap-in: the obvious answer
- fame 4 = Header: well known
- fame 3 = Volley: a real fan knows it
- fame 2 = Bicycle kick: deep knowledge
- fame 1 = Screamer: almost nobody will think of it

QUESTION A (key "g014"): Name a World Cup winner whose surname starts with M
New scope: winning squads, 2006–2026
Current answers: Thomas Müller, Kylian Mbappé, Emiliano Martínez, Lionel Messi, Marco Materazzi, Juan Mata, Alexis Mac Allister, Lisandro Martínez, Lautaro Martínez, Javi Martínez, Per Mertesacker, Blaise Matuidi, Benjamin Mendy, Shkodran Mustafi, Nahuel Molina, Gonzalo Montiel, Carlos Marchena, Steve Mandanda
→ Add every player in the 2026 winning squad whose surname starts with M (full 26-man squad, played or not), with aliases and fame.

QUESTION B (key "b010"): Name a country that has won the men's World Cup
New scope: tournaments up to 2026
Current answers: Brazil, Germany, Argentina, France, Italy, Spain, England, Uruguay
→ If the 2026 winner is a first-time winner, add it. If not, say so.

QUESTION C (key "w018"): Name a country that has reached a men's World Cup final
New scope: 1930 to 2026
Current answers: Argentina, Brazil, Germany, Italy, France, Netherlands, Spain, England, Croatia, Uruguay, Hungary, Sweden, Czechoslovakia
→ Add either 2026 finalist that isn't already listed. If both are already listed, say so.

For country answers whose Spanish name differs, add "name_es" (e.g. "name_es": "Marruecos"). Aliases are other ways people type the same answer: surnames, spellings without accents, Spanish names.

Reply with ONLY this JSON:

{
  "final_2026": "Team A v Team B, winner: Team X, score",
  "g014_add": [{"name": "…", "aliases": ["…"], "fame": 3}],
  "b010_add": [],
  "w018_add": [],
  "notes": "anything you're unsure about"
}
