# Unicorner Football Tycoon: art brief (for ChatGPT image generation)

Paste the "Style prompt" at the start of every image request so everything matches.

## Style prompt

> Cute, funny 16-bit pixel art for a mobile football tycoon game. Three-quarter top-down view (like Stardew Valley), chunky dark outlines (#1a1030), flat colours, no gradients, no text, no logos, no real people or real club crests. Palette: grass greens, cream #fbf3dc, gold #f2c230, red #e3262f, sky blue #3fc1ff, pink #ff6fa8, purple #4a1c86. Transparent background. Single object, centred, no shadow on the background.

## What to make, in this order

1. **Buildings**: 5 for the demo (training pitch, youth academy, transfer office, stadium, club shop). Each in **4 stages**, from shabby to ridiculous:
   - Stage 1: tiny and poor (a shed, a muddy pitch, a caravan office).
   - Stage 2: decent.
   - Stage 3: big and shiny.
   - Stage 4: absurdly over the top (gold, fountains, a helipad).
   Ask for each building's 4 stages as **one image with 4 versions side by side**, same size and angle, so they stay consistent.
2. **Characters** (small, same style): the keepy-uppies player, a youth player, a supporter, a suited agent, the mascot, a coach. One standing pose each is enough: the game animates them with bouncing and walking motion in code, so no frame-by-frame sprite sheets are needed.
3. **Stars**: Kylian Mboopi, Erling Haalunch and the others from DESIGN.md, as character portraits (head and shoulders), clearly cartoon parodies, not real likenesses.
4. **Event props**: green plague cloud, airplane, "SOLD OUT" sign, pile of misprinted shirts, banana.
5. **Ground**: one grass tile and one path tile that repeat seamlessly.

## Files

- PNG with a transparent background.
- Square canvas, at least 512 x 512 (the game shrinks them).
- Name them like `building-stadium-1.png`, `char-agent.png`, `star-mboopi.png`, `event-plane.png`.
- Put them in `tycoon/art/` (or send them to Claude to add).

## Tips

- ChatGPT images drift in style between requests: if one looks off, ask "redo this in exactly the same style as the previous image".
- Keep everything facing the same way (front-left) so the map looks consistent.
- Don't worry about perfection for the demo: placeholder art works until yours is ready.
