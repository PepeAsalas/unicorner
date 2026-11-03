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

## The library (use it first)
- daily/*.json: each question has a full answer list with fame 1-6 (6 = superstar, 1 = almost nobody knows) and "traps":
  famous WRONG answers with the reason why. A trap is a ready-made, verified wrong option.
- duel/bank.json: 340+ more lists with answers and traps.
Recipe: take a list, the right option is an answer (low fame = harder), the wrong options are its traps or
famous players that are certainly not on that complete list. Re-check every option yourself; lists can miss people.
