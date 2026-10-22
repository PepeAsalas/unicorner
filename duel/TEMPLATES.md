# Duel question templates

Duel questions live in `duel/bank.json`. Each one is built from a template below. Daily-game questions are a different kind and never go in the duel bank.

## Format of one question

```json
{
  "id": "d17-name-a-portuguese-club-that-played-in-the-primeira-liga-since-2010",
  "template": 17,
  "prompt": "Name a Portuguese club that played in the Primeira Liga since 2010",
  "time": 15,
  "answer_type": "club",
  "answers": [{"name": "Sport Lisboa e Benfica", "aliases": ["Benfica", "SL Benfica"], "fame": 6}],
  "traps": [{"name": "Some Club", "why": "Why it does NOT count, in one sentence."}]
}
```

- `id`: `d<template>-<prompt slug>`, unique.
- `answer_type`: `player`, `club`, `country` or `manager`.
- `answers`: EVERY valid answer. `name` is the full official name; `aliases` are what people actually type (surname, nickname, common spelling without accents, short club name).
- `fame` (how obvious the answer is): 6 = first thing everyone says (10 pts), 5 = well known (30), 4 or 3 = a real fan knows it (60), 2 = deep knowledge (85), 1 = almost nobody (100, a Screamer). Spread: roughly 5-10% fame 6, a healthy middle, and real Screamers at the bottom.
- `traps`: famous near-misses people will type, with why they don't count. They are never accepted.

## Rules every question must pass

1. **Complete.** Every answer that fits must be listed. If a complete list is not realistic, tighten the scope (add a "since" year, a minimum of appearances, a single season) until it is.
2. **Unambiguous scope.** Say what counts: competitive first-team matches; "played for" means at least one competitive first-team appearance; loans count; youth and B teams do not; "since 2000" means 2000-01 season onwards.
3. **8 to 200 answers.** Fewer is too narrow for a 15-second duel; more cannot be checked.
4. **Aliases** for every answer people would type differently. No alias may be shared by two answers in the same question.
5. **No duplicates** of a prompt already in the bank (same template + same scope).
6. **Facts as of the end of the 2025-26 season** unless the prompt has its own end year.

## Templates

### About players (`answer_type: player`)

| # | Template | Example prompt | Scope to keep it complete |
|---|---|---|---|
| 1 | Nationality at a club | Name a Brazilian who played for Real Madrid | all-time, competitive apps |
| 2 | Goalkeeper at a club | Name a goalkeeper who played for Barcelona | since 2000 if needed |
| 3 | Played for both clubs | Name a player who played for both Chelsea and Arsenal | all-time |
| 4 | Won a trophy with a club | Name a player who won the Champions League with Real Madrid since 2000 | squad members who played in that season's competition |
| 5 | Nationality in a league | Name a German player who played in the Premier League since 2000 | since a year |
| 6 | Country at World Cups | Name a player who played for Brazil at a World Cup since 2006 | appeared in a match |
| 7 | Club in a decade | Name a player who played for Man United in the 2000s | competitive apps in that decade |
| 8 | League + position | Name a goalkeeper who played in La Liga since 2000 | since a year; minimum apps if large |
| 9 | Goals or assists threshold | Name a player with 100+ Premier League goals | fixed list |
| 10 | Nationality + position or foot | Name a Brazilian left-back | capped internationals at that position |
| 11 | League + nationality + position | Name a Brazilian defender who played in the Premier League | all-time or since a year |
| 12 | National team + club league | Name a France international who played in the Premier League since 2010 | capped player who played in that league in that period |
| 13 | Famous league + niche league | Name a player who played in both the Premier League and the MLS | competitive apps in both |
| 14 | Club + nationality + era | Name an Argentine who played for Inter in the 2000s | competitive apps in that era |
| 15 | A well-travelled manager's players | Name a player José Mourinho managed at three or more clubs | players with apps under him at each club |
| 16 | Champions League + nationality | Name a Dutch player who won the Champions League | in the winning squad and played in that campaign |

### About clubs (`answer_type: club`)

| # | Template | Example prompt | Scope |
|---|---|---|---|
| 17 | Country + league | Name a Portuguese club that played in the Primeira Liga since 2010 | top division seasons in range |
| 18 | Clubs in a European competition | Name an English club that played in the Champions League since 2000 | group/league phase or knockout; say if qualifiers count |
| 19 | City or region | Name a club from London that played in the Premier League | Premier League seasons |
| 20 | Colours + country | Name an Italian Serie A club that plays in red and black | first-choice home kit colours |
| 21 | Relegated or promoted | Name a club relegated from La Liga since 2010 | relegation seasons in range |

### About countries (`answer_type: country`)

| # | Template | Example prompt | Scope |
|---|---|---|---|
| 22 | Countries at a tournament | Name a country that played at the 2014 World Cup | finals tournament only |
| 23 | Countries a club's players come from | Name a country that had a player at Arsenal since 2000 | senior internationals or birth nationality, say which |

### About managers (`answer_type: manager`)

| # | Template | Example prompt | Scope |
|---|---|---|---|
| 24 | Managers by nationality in a league | Name an Italian manager who managed in the Premier League | permanent managers, caretakers excluded |

## Workflow (what the weekly routine does)

1. `python3 scripts/check_duel_bank.py --stats` to see counts per template; pick templates with the fewest questions.
2. Write new questions into `duel/new/<date>.json` (a JSON list), then run a second, independent pass on each: try to find missing answers and wrong ones, add traps.
3. `python3 scripts/check_duel_bank.py duel/new/<date>.json` until it passes.
4. `python3 scripts/check_duel_bank.py --merge duel/new/<date>.json` adds them to `duel/bank.json`.
5. Commit to the review branch with a summary; a human says "push" before anything goes live.
