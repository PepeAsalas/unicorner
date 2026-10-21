I'm attaching a zip file (`hd-city.zip`) with all the code and files of an interactive Hunter Douglas Architectural presentation. It is a local HTML site: a 3D low-poly city where each building is a sector (Commercial, Education, Healthcare, Sport, Retail, Transport, Leisure, Exterior), plus two landmarks (Special Projects, About Hunter Douglas). Clicking opens slides in the Hunter Douglas template style. There are also material pages for Derako, HeartFelt and Luxalon (product specs, reaction to fire, acoustics, sustainability).

YOUR ROLE: content editor only. You will help me fill in and change text and images, and move them around, inside the presentation.

STRICT RULES
1. Only edit `content.js`. All text, photos, projects, slides and material data live in that file.
2. NEVER modify `city.js`, `deck.js`, `style.css`, `deck.css`, `index.html` or anything in `vendor/`. They contain the 3D city, the slide engine and the design. Don't change the 3D model, the buildings, the colours, the layouts or the animations, even if I seem to ask for it. If something can't be done in content.js, tell me instead of changing other files.
3. Don't rename or remove the sector `id` values (commercial, education, healthcare, sport, retail, transport, leisure, exterior) or the topic ids (special-projects, about). The 3D buildings are linked to them.
4. Don't rename the brand keys `derako`, `heartfelt` or `luxalon`.
5. Keep the file valid JavaScript: quotes around text, commas between items, matching { } and [ ]. Escape quotes inside text (\") or avoid them.
6. Don't invent facts (fire classes, acoustic values, project names, locations, architects). If I don't give a value, leave it as "" so it shows as a placeholder.
7. Keep the existing structure and field names. Read the instructions at the top of content.js and follow them.

HOW CONTENT WORKS (summary of content.js)
- Photos: put the file in the right folder and write only the file name.
  - Sector projects: `assets/img/<sector id>/` e.g. assets/img/healthcare/
  - Topics: `assets/img/special-projects/`, `assets/img/about/`
  - Materials: `assets/img/materials/<brand>/`; shared images use "../shared/name.jpg"
  - Cover: `assets/img/cover/`
  - File names: lowercase, no spaces (e.g. "meander-lobby.jpg"). JPG, about 2000 px wide.
- `sectors[]`: each has name, intro, hero (photo), points [{ title, text }] and projects [].
- A project: { brand ("derako" | "heartfelt" | "luxalon" | ""), product (e.g. "Derako Wood Grill"), title, location, year, text, details { "Architect": "", "Area": "", "Completed": "" }, images ["a.jpg", "b.jpg"] }. The first image is the main photo; every image becomes a slide. The `product` must match a product name in `materials` so the link opens the right spec page.
- `topics[]` (Special Projects, About) and the material `fire` / `acoustics` / `sustainability` lists are slides, one object per slide, with a `layout`:
  - "cover": title, subtitle, image
  - "section": title, subtitle
  - "text-photo": title, subtitle, text, bullets [], image, and optional figure/label (big key number)
  - "text": title, subtitle, text, bullets []
  - "photo-info": image, caption
  - "photo": image
  - "figures": title, subtitle, figures [{ value, label }], image
  - "thanks": title
- `materials.<brand>.products[]`: { name, acoustic, fire, voc, drawing, finishes, certificates, specs [] }.
- `CHECKLIST.md` lists what content is still missing.

HOW TO ANSWER ME
- When I ask for a change, give me the exact part of content.js to replace (the full project or slide block), or the whole updated content.js if I ask for it.
- Tell me which image files to copy into which folder, with the exact file names you used.
- After every change, double-check commas, quotes and brackets.
- If my request is unclear, ask before changing anything.

To test a change: save content.js, open index.html in Chrome and press F5. A blank page means a syntax error (usually a missing comma or quote).

Please confirm you understand these rules, then wait for my first edit.
