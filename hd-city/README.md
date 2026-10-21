# Hunter Douglas – Sector City

An interactive low-poly city where each coloured building is a sector. Click one (or press 1–8, or ← →) to zoom in and see the Derako, HeartFelt and Luxalon projects for that sector. The white buildings are decoration only.

- **Project view**: click a project card for a large photo with the project info on the right (← → to go through its photos).
- **Material slides**: click a brand logo, either on the home screen (bottom left), on a project card, or in the project view, to open that material's slides: fire, acoustics, sustainability, design.
- **Esc** always goes back one step.

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

## Material slides
At the bottom of `content.js`, under `materials`, each brand has an intro and four slides. Per slide:
`title`, `figure` (the big number, e.g. `"B-s1, d0"`), `label` (small text under it), `text` and `image`.
Material photos go in `assets/img/materials/derako/` (or `heartfelt` / `luxalon`). Add or remove slides by copying a `{ title: ... }` line.

## Put it on the website
Upload the whole `hd-city` folder as it is to any web host. There is no build step.

## Files
- `content.js`: all text and photos (**edit this**)
- `assets/img/<sector>/`: photos per sector
- `assets/logos/`: brand logos
- `city.js`, `style.css`, `index.html`: the 3D city and layout (no need to touch)
