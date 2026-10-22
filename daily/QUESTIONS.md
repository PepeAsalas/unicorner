# Daily-game questions

Each day is one file, `daily/YYYY-MM-DD.json`, with five questions. Everyone plays the same five, in English and Spanish, with 30 seconds per question and one answer each. Duel questions are a different kind (see `duel/TEMPLATES.md`) and never go here.

## What makes a good daily question

The daily game is the shop window. A question should make people smile, argue, or say "oh, I know a weird one". Duel questions are plain lists ("Name a German who played in the Premier League"); daily questions need an angle.

Good angles:

| Angle | Example |
|---|---|
| A strange fact | Name a goalkeeper who has scored in the Premier League |
| Drama and moments | Sent off in a World Cup final; scored in a Euro final |
| A journeyman's career | Name a club Peter Crouch played for (Dulwich Hamlet and IFK Hässleholm are the Screamers) |
| A surprising side of a famous name | Name a club Pep Guardiola played for (Dorados de Sinaloa) |
| A manager's travels | Name a Premier League club managed by Sam Allardyce |
| Letters and names | Name a Premier League club whose name starts with S |
| Records and thresholds | Scored 30+ goals in one Premier League season |
| Winners across history | Name a club that has won the European Cup or Champions League |

Avoid: plain squad lists, "played for club X in season Y", and anything a duel template already covers. A question where the answers are only the famous ones is boring; one where only experts score is frustrating. The best have a few obvious answers and a tail of surprising ones.

## A day

- Five questions, ideally two easy, two medium and one hard.
- Mix the answer types: not five player questions. Use clubs, countries and managers too.
- Mix the topics: Premier League, Spain, Europe, World Cup and Euros, careers, oddities. Spanish players read the game too, so include LaLiga and Spanish or Latin American angles.
- Never reuse a prompt or the same topic as a recent day. Run `python3 scripts/check_daily.py --prompts` to see everything already used.

## Format of one question

```json
{
  "id": "f005", "_id": "f005",
  "prompt": "Name a goalkeeper who has scored in the Premier League",
  "subtitle": "Any season, 1992-93 to 2024-25",
  "prompt_es": "Nombra un portero que haya marcado en la Premier League",
  "subtitle_es": "Cualquier temporada, de la 1992-93 a la 2024-25",
  "difficulty": "hard",
  "answer_type": "player",
  "format_family": "oddity",
  "scoring_version": 2,
  "answer_count": 6,
  "clash_note": "",
  "answers": [{"name": "Alisson Becker", "aliases": ["Alisson"], "fame": 6}],
  "traps": [{"name": "Jordan Pickford", "aliases": ["Pickford"], "why": "One sentence in English.", "why_es": "Una frase en español."}]
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
4. **5 to 80 answers.** Fewer than 5 makes the question a lottery; more than 80 cannot be checked.
5. **No alias shared by two answers.** Put the shared word in neither and let the clash note explain.

## Workflow (what the weekly routine does)

1. `python3 scripts/check_daily.py --coverage` shows the last scheduled day. Fill the days after it until the schedule is 14 days ahead of today.
2. `python3 scripts/check_daily.py --prompts` lists what has been used.
3. Write each day file, researching every answer list, then do the second pass and add traps.
4. `python3 scripts/check_daily.py daily/<each new day>.json` until it reports 0 errors and 0 warnings.
5. Commit to the review branch with a summary; a human says "push" before anything goes live.
