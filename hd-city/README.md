# Hunter Douglas – Sector City

An interactive presentation in the Hunter Douglas template style. It opens on the cover and agenda slides. Press → to enter the 3D city, where each coloured building is a sector. The white buildings are decoration only.

- **Sector**: click a building (or press 1–8) to zoom in. **Present** plays the sector as slides: section divider, intro, points, then one slide per project.
- **Project**: click a project card for its slides: a large photo with caption, an info slide with details, then any extra photos.
- **Materials**: click a brand logo (home screen bottom left, project cards, or the project info slide) for that brand's slides: product range, fire, acoustics, sustainability.
- **Agenda** (top right on the home screen): opens the topic slides (Acoustics, Reaction to fire, ...).
- In slides: ← → or a clicker to move, Esc to go back. Going past the last slide also goes back.

See **CHECKLIST.md** for what is still missing.

## Run it
Double-click `index.html` (Chrome or Edge), then press F11 for full screen. It works offline; only the web fonts need internet (it falls back to Arial without it).

## Edit text and photos (no coding needed)
Open **`content.js`** in any text editor (Notepad, TextEdit, VS Code). Everything you can change is there, with instructions at the top.

**Add a photo**
1. Copy the photo into that sector's folder, e.g. `assets/img/healthcare/`
2. In `content.js`, write just the file name: `images: ["clinic-ceiling.jpg"]`
3. Save the file and press F5 in the browser.

Several photos per project → `images: ["one.jpg", "two.jpg", "three.jpg"]`. The first one shows on the card; clicking it opens all of them (← → to browse).

**Add a project**: copy a `{ brand: ..., images: [...] }` block, paste it after the last one, and put a comma between the blocks.

| Field | What it does |
|---|---|
| `brand` | `"derako"`, `"heartfelt"` or `"luxalon"`: sets the logo and card colour |
| `title` | Project name |
| `location`, `year` | Shown under the title (leave `""` to hide) |
| `text` | Project description (project view) |
| `details` | Info rows in the project view, e.g. `"Architect": "Studio X"`. Rename, add or remove rows freely |
| `images` | Photo file names; `[]` shows a placeholder |
| `hero` | Wide photo at the top of the sector panel |
| `points` | The small tags (e.g. "Noise control") |

If a photo name is misspelled, the card shows **"Image not found: …"** with the path it looked for, so you can fix it.

Tips: use JPGs about 1800px wide (under ~1 MB each) so it stays fast. Avoid spaces in file names (`my-photo.jpg`, not `my photo.jpg`).

## Slides (topics and materials)
In `content.js`, `topics` (agenda items) and `materials` (per brand) are lists of slides, one line each. Each slide has a `layout` from the Hunter Douglas template: `cover`, `section`, `text-photo`, `text`, `photo-info`, `photo`, `thanks`. The top of content.js lists the fields for each. Copy a line to add a slide.

## Put it on the website
Upload the whole `hd-city` folder as it is to any web host. There is no build step.

## Files
- `content.js`: all text and photos (**edit this**)
- `assets/img/<sector>/`: photos per sector
- `assets/logos/`: brand logos
- `CHECKLIST.md`: what content is still missing
- `deck.js`, `deck.css`: the template-style slides
- `city.js`, `style.css`, `index.html`: the 3D city and layout (no need to touch)
