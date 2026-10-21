# Hunter Douglas – Sector City

An interactive presentation in the Hunter Douglas template style. It opens on the 3D city. Everything is reached by clicking in the city:

- **Sector buildings** (or keys 1–8): zoom in and open the sector panel. **Present** plays the sector as slides; a project card opens that project's slides (photo, then project info: product, location, architect).
- **Product link**: on a project's info slide, the product button (e.g. "Derako Wood Grill") opens that brand's material page at that product.
- **Material pages** (also the brand chips bottom left): cover, index, product spec pages, then reaction to fire, acoustics and sustainability for that brand.
- **Orange landmarks**: Hunter Douglas HQ (About Hunter Douglas) and the Special Projects pavilion.
- **Agenda** (top right, folded): Sectors, Special Projects, About Hunter Douglas.
- Click the Hunter Douglas logo for the cover slide.
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
In `content.js`, `topics` (Special Projects, About) are lists of slides, one line each. Each brand in `materials` has `products` (spec pages: name, acoustic, fire, voc, specs, drawing, finishes, certificates) and `fire`, `acoustics` and `sustainability` slide lists. Each slide has a `layout` from the Hunter Douglas template: `cover`, `section`, `text-photo`, `text`, `photo-info`, `photo`, `figures`, `thanks`. The top of content.js lists the fields for each. Copy a line to add a slide.

## Put it on the website
Upload the whole `hd-city` folder as it is to any web host. There is no build step.

## Files
- `content.js`: all text and photos (**edit this**)
- `assets/img/<sector>/`: photos per sector
- `assets/logos/`: brand logos
- `CHECKLIST.md`: what content is still missing
- `deck.js`, `deck.css`: the template-style slides
- `city.js`, `style.css`, `index.html`: the 3D city and layout (no need to touch)
