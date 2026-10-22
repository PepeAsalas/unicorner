# Daily-game questions

Each day is one file, `daily/YYYY-MM-DD.json`, with five questions. Everyone plays the same five, in English and Spanish, with 30 seconds per question and one answer each. Duel questions are a different kind (see `duel/TEMPLATES.md`) and never go here.

## What makes a good daily question

The daily game is the shop window. A question should make people smile, argue, or say "oh, I know a weird one". Duel questions are plain lists ("Name a German who played in the Premier League"); daily questions need an angle.

**Size matters most.** A question needs enough answers that most players can name one: at least 12, ideally 20 to 40. A tiny list (goalkeepers who scored, players sent off in a final) is a quiz for experts and most people score nothing. The only exception is a journeyman's clubs, which needs 10 or more.

Good angles:

| Angle | Example |
|---|---|
| Moments across history | Scored in a World Cup final, 1966 to 2022 (37 answers, Pelé to Nanninga) |
| Awards with a long tail | Won the Premier League Golden Boot (Dion Dublin is the Screamer) |
| A journeyman's career, 10+ clubs | Name a club Kevin-Prince Boateng played for (Barcelona, Monza) |
| Winners across history | Name a club that has won the English top flight (Preston, Huddersfield) |
| Places | Name a stadium that hosted a World Cup final; a country that hosted Euros matches |
| Spain and Latin America | Clubs in a Copa del Rey final; Copa Libertadores winners |
| Records and thresholds | Scored 5+ goals at one World Cup |

Avoid: tiny lists, plain squad lists, "played for club X in season Y", and anything a duel template already covers. A question where the answers are only the famous ones is boring; one where only experts score is frustrating. The best have a few obvious answers and a long tail of surprising ones.

## A day

- Five questions, ideally two easy, two medium and one hard.
- Mix the answer types: not five player questions. Use clubs, countries and managers too.
- Mix the topics: Premier League, Spain, Europe, World Cup and Euros, careers, oddities. Spanish players read the game too, so include LaLiga and Spanish or Latin American angles.
- Never reuse a prompt or the same topic as a recent day. Run `python3 scripts/check_daily.py --prompts` to see everything already used.

## Format of one question

```json
{
  "id": "f004", "_id": "f004",
  "prompt": "Won the Premier League Golden Boot",
  "subtitle": "1992-93 to 2024-25, shared awards count",
  "prompt_es": "Ganó la Bota de Oro de la Premier",
  "subtitle_es": "De la 1992-93 a la 2024-25, cuentan los premios compartidos",
  "difficulty": "easy",
  "answer_type": "player",
  "format_family": "award_winner_player",
  "scoring_version": 2,
  "answer_count": 26,
  "clash_note": "",
  "answers": [{"name": "Alan Shearer", "aliases": ["Shearer"], "fame": 6}],
  "traps": [{"name": "Wayne Rooney", "aliases": ["Rooney"], "why": "Rooney never won it: his 26 in 2009-10 was three behind Drogba.", "why_es": "Rooney nunca la ganó: sus 26 de la 2009-10 se quedaron a tres de Drogba."}]
}
```

- `id` and `_id`: the same value, a letter plus three digits, unique across every daily file. The letter `f` is used by these guided questions; continue its numbering (`f021`, `f022`, ...).
- `prompt`: short, ideally under 60 characters. For any `answer_type` other than player, it must start "Name a" or "Name an" and contain the type word ("club", "country", "manager", "stadium") in its first 60 characters, or a GitHub workflow rewrites it. `subtitle`: the exact scope.
- `prompt_es` and `subtitle_es`: natural Spanish from Spain ("la Premier", "la Champions", "el Mundial", "la Eurocopa", seasons as "la 2024-25").
- `answer_type`: `player`, `club`, `country`, `manager` or `stadium`. Person types (player, manager) also match on surname, so an answer like `Nico Williams` works with `Williams`.
- `format_family`: a short snake_case label for the angle (`career_clubs`, `oddity`, `final_scorer`, `letter_challenge`, ...).
- `answer_count`: the number of answers.
- `answers`: EVERY valid answer. `name` is the full name; `aliases` are what people actually type (surname, nickname, spelling without accents, short club name like "Spurs", "Man Utd", "Atleti"). For a club or country with a different Spanish name, add `"name_es"` and also put that name in the aliases.
- `fame` (how obvious the answer is): 6 = first thing everyone says (10 points), 5 = well known (30), 4 or 3 = a real fan knows it (60), 2 = deep knowledge (85), 1 = almost nobody (100, a Screamer). Every question needs at least one fame 1 or 2 answer.
- `traps`: famous near-misses people will type. A VAR popup shows `why` (or `why_es`) and they can try again. They are never accepted.

## Rules every question must pass

1. **Correct and complete.** Research every list from reliable sources (official competition sites, Wikipedia season and final pages, Transfermarkt), then do a second, independent pass looking for missing and wrong answers. A missing answer means a player is told they are wrong when they are right, which is the worst thing that can happen in this game.
2. **The scope is closed.** It must end at a finished season or tournament: "1992-93 to 2024-25", "finals from 2000 to 2025", or for a career, a player who has retired ("retired 2019") or "up to 2025-26". Never "has ever", "all-time" or "so far" for anything still going on.
3. **Unambiguous.** Say what counts: "played for" means a competitive first-team appearance, loans count, youth and B teams do not; "scored" means normal or extra time, not shootouts, not own goals.
4. **12 to 80 answers, ideally 20 to 40** (10 is enough only for a journeyman's clubs). Fewer leaves most players with nothing; more than 80 cannot be checked.
5. **No alias shared by two answers.** Put the shared word in neither and let the clash note explain.

## Workflow (what the weekly routine does)

1. `python3 scripts/check_daily.py --coverage` shows the last scheduled day. Fill the days after it until the schedule is 14 days ahead of today.
2. `python3 scripts/check_daily.py --prompts` lists what has been used.
3. Write each day file, researching every answer list, then do the second pass and add traps.
4. `python3 scripts/check_daily.py daily/<each new day>.json` until it reports 0 errors and 0 warnings.
5. Commit to the review branch with a summary; a human says "push" before anything goes live.
