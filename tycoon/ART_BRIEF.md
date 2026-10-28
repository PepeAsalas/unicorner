# Unicorner Football Tycoon: art brief (for ChatGPT image generation)

All art is made in **one ChatGPT chat**, so it remembers the style and what was liked or rejected.

## The reference: stadium stage 1

The first stadium (a small red-and-cream ground with two covered stands, four lattice floodlights and a striped pitch,
inside a red-and-cream wall) is the look everything follows:

- **Camera**: the same isometric angle as that stadium. Every new image says "same camera angle, scale and style as the stadium".
- **No base**: no grass tile, dirt, rock or island under a building. It stands straight on a plain white background,
  so the game can place it on its own ground.
- **Footprint**: a diamond (corners up, down, left, right). All stages of one building keep the same footprint and canvas size,
  so swapping stages doesn't move anything.
- Chunky pixels, bold dark outlines, saturated colours, red and cream club colours, no text or real logos.

## Movement is done in code, from separate parts

Static pictures stay still; anything that moves comes as a small separate sprite sheet the game places on top:

- **Corner flag**: 4 frames waving in the wind (the game puts one on each corner and cycles the frames).
- **Floodlight head**: 3 states, off / on / on with glow (the game switches lights on one by one, flickers them, glows at night).
- **Characters**: a few frames each when walking or kicking matters (for example the keepy-uppy player: 4 kick frames
  without the ball, plus the ball on its own).

## Order of work

1. Stadium: stage 1 (done), animation parts, then stages 2 to 4.
2. Keepy-uppy player frames and ball.
3. The other buildings, one at a time, each matched to the stadium.
4. Ground pieces (pond, car park, entrance plaza, empty plot for sale).

## For later: the main game's background

The same stadium style could replace the flat backdrop on the main Unicorner page (a wide strip of stands painted by ChatGPT,
with code adding jumping fans, flags, scrolling ad boards and day/night lighting). Parked until the tycoon art is done.

## Files

- PNG or WebP on white or transparent; Claude removes the white background and trims the art.
- Names like `building-stadium-2.png`, `anim-corner-flag.png`, `anim-floodlight.png`, `char-keepy-uppy-frames.png`.
- Send them as a zip; Claude processes them into `tycoon/art/`.
