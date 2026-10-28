# Unicorner Football Tycoon: design

Working title: **Unicorner Football Money Tycoon** (change freely).
This file is the single source of truth for names, buildings, numbers and events. Fill the `TODO` parts with ChatGPT and paste the results here; the code reads its content from this design.

## The demo (what ships first)

- Lives at `/tycoon/`, opened from a card on the Unicorner home page (like the duels card).
- No account: progress saves on the device. Feedback goes to Supabase.
- After **10 minutes of play** a wall appears: "We're still building the full game!", with "Notify me when it's ready" (email), a 1-10 rating and an optional comment.
- English only for the demo (Spanish later).

## Core loop

1. Tap the player doing keepy-uppies: each tap earns money (a funny gimmick, e.g. "+€1 viral clip").
2. Spend money on buildings and upgrades. Purchases are instant: no timers, no energy.
3. Buildings earn money every second on their own.
4. The academy produces ordinary players and sells them automatically.
5. Absurd events pop up; tap to fix them or accept a funny trade-off.
6. Coming back after closing the tab: "Calculating offline earnings..." then "While you were away you earned €X" (time away x income rate; no cap for now, uses the server clock in the full game).

## The district (fixed map, one plot per building)

Portrait map, phone-first. Each plot shows the building at its current level (level 0 = empty plot with a "for sale" sign).

| # | Building | Earns from | Interacts with | Demo? |
|---|---|---|---|---|
| 1 | Training pitch | Tap income + small passive | Boosts academy player quality | Yes (starts built, terrible) |
| 2 | Youth academy | Produces players, sold automatically | Better pitch = better players | Yes |
| 3 | Transfer office | Multiplies player sale prices | Agents event | Yes |
| 4 | Stadium | Ticket income from supporters | Stars attract more fans | Yes |
| 5 | Club shop / shirt factory | Shirt sales | Stars multiply shirt sales | Yes |
| 6 | Sponsorship office | Flat income, grows with stadium size | Stadium | Full game |
| 7 | Canteen | Keeps players happy (+% everything) | Haalunch event | Full game |
| 8 | Medical centre | Cures the plague events faster | Plague event | Full game |
| 9 | Chairman's office | Global multiplier | Mascot event | Full game |

Each building has **4 visual stages** (levels 1, 10, 25, 50) and can be levelled 1-50+. Cost grows x1.15 per level (the Cookie Clicker rule).

## Money and pacing (first guess, to be tuned in play-testing)

- Tap: €1 at start, upgrades double it.
- Pitch level 1: €0.5/s. Academy: one player every 20 s, sold for €15 at level 1.
- Target: the demo's 10 minutes should reach the stadium and shop with a few upgrades and 1-2 stars.
- Full game: about one hour to the first prestige ("Sell the club").

## Parody stars (TODO: fill with ChatGPT)

Special players appear rarely from the academy or as event rewards. Keep for a bonus, assign to a building, or sell for a big payout.

| Name | Parody of | Bonus | Demo? |
|---|---|---|---|
| Kylian Mboopi | TODO | Shop sales x2 | Yes |
| Erling Haalunch | TODO | Ticket income x1.5, empties the canteen | Yes |
| TODO | | | |

Rules: original artwork only, no real photos, crests or kits; names are clearly jokes.

## Parody clubs (TODO)

Clubs that buy your academy players: Royal Madribble, TODO...

## Events (TODO: write 12-20, at least 6 for the demo)

Each event is one entry in a list; the game reads it, so adding events needs no code changes.

| id | Title | What you see | Effect | Fix / choice |
|---|---|---|---|---|
| plague | Dressing-room plague | Green cloud over the academy | Player sale value -12% for 60 s | Tap the medical van / pay €X |
| agents | Agents everywhere | Men in suits swarm the transfer office | Transfer income -25% | Tap each agent to shoo them |
| haalunch | Erling Haalunch empties the canteen | Canteen sign flips to "SOLD OUT" | Happiness boost off | Order more food €X, or let it be (he scores more: tickets +20%) |
| mascot | The mascot takes over the chairman's office | Mascot in the window | Global x0.9 | Bribe with a banana / keep him (shop +30%) |
| airport | Stadium mistaken for an airport | A plane lands on the pitch | Tickets paused 30 s | Sell plane-spotter tickets instead (+€) |
| misprint | Misprinted shirts | Shirts with "UNICRONER" | Choice: | Bin them (lose €X) or sell as limited edition (shop x3 for 45 s) |
| TODO | | | | |

Rules: at most one bad event at a time, every bad event has an instant fix, effects last seconds, never a ruined club.

## Upgrades (TODO: 20-30 short funny ones)

Format: name, cost, effect, one-line joke. Example: "Golden cones, €500, pitch x2, 'they don't help, but they're shiny'".

## Prestige (full game, not demo)

"Sell the club": reset money, buildings, squad; keep trophies and cosmetics; gain Legacy points = permanent +% income.
