# Project context: Hunter Douglas "Sector City" presentation

## What it is
An interactive presentation for **Hunter Douglas Architectural** (CPD presentation), made as a local website: open `index.html` in Chrome or Edge (F11 for full screen). It works offline, needs no build step and has no frameworks. The same folder can be uploaded to any web host.

It opens on a **low-poly 3D city** (Three.js, Crossy Road style, white architectural-model look with Hunter Douglas orange accents). Each coloured building is a **sector**: Commercial, Education, Healthcare, Sport, Retail, Transport (an airport with planes landing and taking off), Leisure, Exterior. White buildings are decoration only. Two orange **landmarks** are also clickable: the Hunter Douglas HQ (About Hunter Douglas) and the Special Projects pavilion.

Everything else is **slides in the Hunter Douglas PowerPoint template style** (16:9, brand-coloured backgrounds, black brand tab on the left edge, slatted cover backgrounds, white footer band with page number, presentation name and HD logo).

## Brands and colours (must be kept)
- **Derako** (wood): brown, dark #483C2C, mid #6A5C48, light #E1D5C2
- **HeartFelt** (felt): green, dark #334E22, mid #4C653D, light #D6E5CD
- **Luxalon** (metal): blue, dark #303A54, mid #57617A, light #E1EAF8
- **General Hunter Douglas**: off-white #FAF7F2, orange #F08300, pastel orange #F8C9A0, grey #5B6770
- Fonts: Inter (headings), Roboto Light (body)

## How it works (user flow)
- **City** → click a sector building (or press keys 1–8, or ← →): the camera zooms in and a **sector panel** slides in on the right.
- **Sector panel**: previous/next sector buttons, the intro ("Read more" when long), 4 numbered points, a **Present** button (plays the whole sector as slides) and a **project grid**: two columns with photo, name, location and product, brand filters with counts, and a search box when there are more than 6 projects.
- **Project** (click a card): slides. A large photo with a caption, then an info slide (product, location, architect, details) with a product button, then any extra photos as full slides. Project slides show **only project info**, never fire or acoustic data.
- **Product button** on a project → opens that brand's **material page** directly at that product's spec page.
- **Material pages** (also from the brand chips at bottom left): cover → clickable index → one spec page per product (sound absorption / fire class / VOC, spec list, drawing, finishes, certificates) → Reaction to fire → Acoustics → Sustainability.
- **Agenda** button (top right, folded): Sectors, Special Projects, About Hunter Douglas.
- Clicking the HD logo shows the cover slide.
- In slides: ← → or a presentation clicker, Esc goes back one level, going past the last slide also goes back.

## Files
```
hd-city/
  index.html        page shell (topbar, agenda, material chips, panel)
  content.js        ALL text, images, projects, slides, material data  ← edit this
  city.js           3D city, buildings, airport/planes, cars, camera, sector panel, builds the slides
  deck.js           slide engine + template layouts
  deck.css          slide styling (template look)
  style.css         city UI styling (panel, labels, agenda, chips)
  vendor/three.min.js   Three.js r149 (local, offline)
  assets/logos/     hunter-douglas.png, derako.png, heartfelt.png, luxalon.png
  assets/img/<sector>/          project photos per sector
  assets/img/materials/<brand>/ product drawings, finishes, certificates
  assets/img/materials/shared/  fire / sustainability images shared by all brands
  assets/img/about/, special-projects/, cover/
  README.md, CHECKLIST.md (missing content), CHATGPT_PROMPT.md
```

## content.js structure
```js
window.HD_CONTENT = {
  presentation: { name, version },          // slide footer
  cover: { title, subtitle, image },
  topics: [ { id: "special-projects" | "about", title, slides: [ ...slide ] } ],
  sectors: [ {
    id,            // commercial, education, healthcare, sport, retail, transport, leisure, exterior — DO NOT rename (linked to 3D buildings)
    name, intro, hero,
    points: [ { title, text } ],
    projects: [ { brand: "derako"|"heartfelt"|"luxalon"|"", product, title, location, year, text,
                  details: { "Architect": "", ... }, images: ["a.jpg", "b.jpg"] } ]
  } ],
  materials: {
    derako | heartfelt | luxalon: {        // DO NOT rename these keys
      name, tagline, intro, cover,
      products: [ { name, acoustic, fire, voc, drawing, finishes, certificates, specs: [] } ],
      fire: [ ...slide ], acoustics: [ ...slide ], sustainability: [ ...slide ]
    }
  }
};
```
- **Image paths**: write just the file name, and the folder is added automatically (`assets/img/<sector id>/`, `assets/img/<topic id>/`, `assets/img/materials/<brand>/`). Relative paths like `"../exterior/x.jpg"` or `"../../commercial/x.jpg"` reach other folders. Paths starting with `assets/` are used as they are.
- A project's `product` must match a product `name` in `materials` (matching ignores the brand word), so the product button opens the right spec page.
- **Slide layouts** (one object per slide):
  - `cover`: title, subtitle, image
  - `section`: title, subtitle (divider with slats)
  - `text-photo`: title, subtitle, text, bullets[], image, optional figure + label (big key number)
  - `text`: title, subtitle, text, bullets[]
  - `photo-info`: image, caption (large photo + caption)
  - `photo`: image
  - `figures`: title, subtitle, figures[{value,label}], image
  - `thanks`: title
  - `spec`: built automatically from material products
- Empty fields (`""`) show as subtle "to add" placeholders. A wrong image name shows "Image not found: <path>".

## Rules for editing
1. Content changes go **only in `content.js`** (and new images in `assets/`). Don't touch `city.js`, `deck.js`, the CSS or `index.html` unless the task is explicitly about the 3D city, layout or behaviour.
2. Never rename sector ids, topic ids or the brand keys.
3. Keep `content.js` valid JavaScript (quotes, commas, brackets).
4. Don't invent technical facts (fire classes, acoustic values, project names, locations, architects). Leave `""` if unknown.
5. Image files: lowercase, no spaces, JPG about 2000 px wide.
6. The design follows the Hunter Douglas template and Emil Kowalski-style UI polish: custom ease-out curves, short UI animations (under 300 ms), `scale(0.97)` press feedback, hover effects only on real pointer devices, motion reduced when the system asks for it, stagger on entry. Keep that standard for any UI work.

## Technical notes
- Plain scripts, no modules, so it works from `file://`. Load order: three.min.js → content.js → deck.js → city.js.
- `deck.js` exposes `window.Deck` (`open(slides, {theme, folder, start, onClose})`, `close`, `handleKey`, `isOpen`, `imgPath`, `themeOf`, `THEMES`). Decks stack (a project opens a material page on top). Slide sizes use `cqw` units so slides scale like PowerPoint.
- `city.js`: an orthographic isometric camera with eased fly-to; plots on a 3×3 grid around a central plaza; an outer ring of seeded-random decoy buildings; the landmarks sit in the outer ring; the airport planes follow keyframed loops half a cycle apart (they never share the runway); HTML labels are projected over the buildings.

## Status
- All 5 CPD decks (parts 1.1–4.2) are imported: project photos, names and products from the speaker notes, sector texts, material specs, fire and sustainability content, and About.
- The user has since added many projects (e.g. Commercial has 23) and an `assets` update package.
- Still open (see CHECKLIST.md): Luxalon spec data and drawings (project photos used as stand-ins), several project names, brands and details, Our Team, Special Projects captions, the HeartFelt Baffle dimensions.
- Git branch: `claude/fervent-carson-h614da` in `PepeAsalas/unicorner`, folder `hd-city/`.
