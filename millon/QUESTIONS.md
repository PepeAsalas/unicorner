# Millions questions

One file per day: millon/YYYY-MM-DD.json
{"day":"YYYY-MM-DD","questions":[ 8 x {"q","q_es","o":[options],"o_es":[optional, same order],"a":index of the right option,"why","why_es","src"} ]}

- Option counts, in order: 4,4,4,3,3,3,3,2 (the game uses the count it finds, the checker enforces this).
- Exactly ONE option is right. Every other option must be provably wrong for the exact question.
- "why"/"why_es": one short sentence shown after the reveal (e.g. "Ronaldo never won it: Van der Vaart won the first in 2003").
- "src": where the fact comes from, e.g. "daily/2026-11-01.json#q1" or "duel/bank.json#<id>" or a URL.

## Difficulty: this is the whole game
The player must WANT to split the money. A question where everyone knows the answer is a wasted round.
- Question 1 is the easiest, the final (2 options) is the hardest. Nothing should be a gimme: no "who won the 2010 World Cup".
- Every wrong option is a believable near miss: same era, same club, same nationality, the famous player people wrongly assume.
- Good shapes: "Which of these won X?" (one winner, three famous non-winners); "Which of these NEVER played for X?";
  "Who scored more / Which came first?"; numbers and years with close options ("How many league titles…: 19 / 20 / 22").
- No trick wording, no "all of the above", no fact that changes after the date in the question. Scope every question to a finished season.

## Too easy: never use these
- The scorer of a famous final or famous goal (Götze 2014, Hurst 1966, Drogba 2012, Iniesta 2010, Zidane 2002…).
- Ballon d'Or / Golden Ball / Golden Boot winners of the last 20 years, unless the option set is three near-equal contenders.
- Who won a big recent trophy (Champions League, World Cup, Euro, top-5 league in the last 15 years).
- "Which of these has never won X" where the right option is a famous non-winner everyone knows (Zlatan / Ballon d'Or).
- Two famous options where any fan knows the answer (Messi vs Ronaldo goals).
- The same question shape as one already used in millon/ (e.g. "where did X end his career").
Test: if a casual fan who watches every weekend would put everything on one answer within 5 seconds, it is too easy.

## The difficulty ramp
Q1-Q3 (4 options): medium, a fan should be torn between two.
Q4-Q7 (3 options): hard, a fan should be torn between all three.
Q8 (2 options, all-in): the hardest of the day, a true 50/50 for most fans (close numbers, two similar careers).
At least two number or year questions per day, and at least two "which of these never…" questions.

## The library (use it first)
- daily/*.json: each question has a full answer list with fame 1-6 (6 = superstar, 1 = almost nobody knows) and "traps":
  famous WRONG answers with the reason why. A trap is a ready-made, verified wrong option.
- duel/bank.json: 340+ more lists with answers and traps.
Recipe: take a list, the right option is an answer (low fame = harder), the wrong options are its traps or
famous players that are certainly not on that complete list. Re-check every option yourself; lists can miss people.
