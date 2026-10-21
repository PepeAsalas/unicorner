/* Low-poly city: one building per sector. Click a building to zoom in. */
(function () {
  const C = window.HD_CONTENT;
  const $ = (s) => document.querySelector(s);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Renderer, scene, camera ----------
  const canvas = $("#scene");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#FAF7F2");

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
  const CAM_DIR = new THREE.Vector3(1, 1.05, 1).normalize();
  const CAM_DIST = 160;
  const OVERVIEW = { target: new THREE.Vector3(0, 4, 0), zoom: 1 };
  const view = { target: OVERVIEW.target.clone(), zoom: 1 }; // current, animated
  let viewSize = 70; // world units visible vertically at zoom 1

  scene.add(new THREE.HemisphereLight(0xffffff, 0xe9d8c6, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.75);
  sun.position.set(40, 70, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 220 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // ---------- Helpers ----------
  // Seeded random so the city looks the same every time it loads
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const choose = (arr) => arr[Math.floor(rand() * arr.length)];
  const mats = {};
  const mat = (hex) => (mats[hex] ||= new THREE.MeshLambertMaterial({ color: hex, flatShading: true }));
  function box(w, h, d, color, x = 0, y = 0, z = 0, parent) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.position.set(x, y + h / 2, z);
    m.castShadow = m.receiveShadow = true;
    if (parent) parent.add(m);
    return m;
  }
  function cyl(r, h, color, x, y, z, parent, seg = 8) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat(color));
    m.position.set(x, y + h / 2, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  // Rows of windows on one face (+z) of a block
  function windows(parent, w, h, d, floors, cols, color, y0 = 1.2, gap = 2.2) {
    for (let f = 0; f < floors; f++)
      for (let c = 0; c < cols; c++) {
        const x = -w / 2 + (w / cols) * (c + 0.5);
        box(w / cols - 0.6, 1.1, 0.2, color, x, y0 + f * gap, d / 2, parent);
      }
  }

  // Palette: white architectural-model look with Hunter Douglas orange accents
  const P = {
    grass: "#F3EEE6", grassDark: "#F6C9A0", road: "#D8D2C8", line: "#FFFFFF", walk: "#FBF9F5",
    white: "#F7F6F1", cream: "#EDE6D8", glass: "#9FB2C9", glassDark: "#6F82A0",
    hf: "#4C653D", hfLight: "#D6E5CD", dk: "#6A5C48", dkLight: "#E1D5C2", lx: "#57617A", lxLight: "#E1EAF8",
    orange: "#F08300", peach: "#F8C9A0", red: "#D9574A", tree: "#A9C394", treeDark: "#8DAE78", trunk: "#B59C80", water: "#A9CBDD",
    decoy: ["#FFFFFF", "#F4F0EA", "#ECE6DC"], decoyRoof: "#E2DACD", decoyWin: "#D6DCE2"
  };

  // ---------- Ground & roads ----------
  const city = new THREE.Group();
  scene.add(city);
  const BLOCK = 20, ROAD = 6, EDGE = 12;
  const step = BLOCK + ROAD;                         // 26: centre of each sector plot
  const roadsAt = [BLOCK / 2 + ROAD / 2, step + BLOCK / 2 + ROAD / 2]; // 13, 39
  const SIZE = 2 * (roadsAt[1] + ROAD / 2 + EDGE);   // whole island
  box(SIZE, 3, SIZE, P.grassDark, 0, -3, 0, city);   // island base (pastel orange edge)
  box(SIZE - 1, 0.2, SIZE - 1, P.grass, 0, 0, 0, city);
  roadsAt.forEach((r) => [-1, 1].forEach((s) => {
    const o = s * r;
    box(SIZE - 1, 0.25, ROAD, P.road, 0, 0, o, city);
    box(ROAD, 0.25, SIZE - 1, P.road, o, 0, 0, city);
    for (let i = -SIZE / 2 + 3; i < SIZE / 2 - 2; i += 4) {   // dashed lines
      if (roadsAt.some((q) => Math.abs(Math.abs(i) - q) < ROAD / 2 + 1)) continue; // keep crossings clean
      box(1.6, 0.3, 0.3, P.line, i, 0, o, city);
      box(0.3, 0.3, 1.6, P.line, o, 0, i, city);
    }
  }));

  // Central plaza with fountain
  const plaza = new THREE.Group(); city.add(plaza);
  box(BLOCK - 4, 0.4, BLOCK - 4, P.walk, 0, 0, 0, plaza);
  cyl(4, 0.9, P.white, 0, 0.4, 0, plaza, 16);
  cyl(3.4, 0.95, P.water, 0, 0.4, 0, plaza, 16);
  cyl(0.6, 2.4, P.white, 0, 0.4, 0, plaza);
  box(2.2, 2.2, 2.2, P.orange, 0, 2.8, 0, plaza).rotation.y = Math.PI / 4;

  function tree(x, z, s = 1, parent = city) {
    const g = new THREE.Group();
    box(0.6 * s, 1.4 * s, 0.6 * s, P.trunk, 0, 0, 0, g);
    box(2.2 * s, 2.2 * s, 2.2 * s, rand() > 0.5 ? P.tree : P.treeDark, 0, 1.4 * s, 0, g);
    g.position.set(x, 0.1, z);
    g.rotation.y = rand() * Math.PI;
    parent.add(g);
  }
  [[-6, -6], [6, 6], [6, -6], [-6, 6]].forEach(([x, z]) => tree(x, z, 0.9, plaza));

  // ---------- Buildings (one per sector) ----------
  const B = {
    commercial(g) {           // glass office tower with timber-slat crown
      box(12, 22, 12, P.glass, 0, 0, 0, g);
      for (let y = 2.5; y < 22; y += 2.6) box(12.3, 0.4, 12.3, P.white, 0, y, 0, g);
      box(13, 1.6, 13, P.white, 0, 22, 0, g);
      for (let i = -5.5; i <= 5.5; i += 1.1) box(0.35, 1.2, 12.6, P.dk, i, 23.6, 0, g);
      box(8, 2, 0.6, P.white, 0, 0, 6.3, g);
    },
    education(g) {            // school with clock tower
      box(16, 7, 10, P.cream, 0, 0, 0, g);
      box(16.6, 0.8, 10.6, P.hf, 0, 7, 0, g);
      windows(g, 16, 7, 10, 2, 5, P.glass, 1.6, 3);
      box(4, 12, 4, P.cream, 0, 0, 1, g);
      box(4.6, 1, 4.6, P.hf, 0, 12, 1, g);
      cyl(1.2, 0.3, P.white, 0, 9, 3.1, g, 16).rotation.x = Math.PI / 2;
      box(3, 2.2, 0.4, P.hf, 0, 0, 5.1, g);
    },
    healthcare(g) {           // hospital with red cross and helipad
      box(16, 10, 10, P.white, 0, 0, 0, g);
      box(8, 6, 8, P.white, -4, 10, -1, g);
      windows(g, 16, 10, 10, 3, 6, P.glass, 1.4, 3);
      box(1, 3.4, 0.4, P.red, 4, 10.6, 5.1, g);
      box(3.4, 1, 0.4, P.red, 4, 11.8, 5.1, g);
      cyl(3, 0.3, P.lx, -4, 16, -1, g, 16);
      box(4, 3, 0.4, P.lxLight, 0, 0, 5.1, g);
    },
    sport(g) {                // arena: stands around a court, basketball hoops, floodlights
      const s = 15;
      box(s, 3, s, P.white, 0, 0, 0, g);                         // podium
      box(s - 3, 0.2, s - 5, "#7FAE5F", 0, 3, 0, g);             // court
      box(0.25, 0.06, s - 6, P.white, 0, 3.2, 0, g);             // centre line
      [-1, 1].forEach((side) => {
        box(s, 1.2, 1.2, P.hf, 0, 3, side * (s / 2 - 0.6), g);   // stands
        box(s, 0.8, 0.8, P.hfLight, 0, 4.2, side * (s / 2 - 0.4), g);
        const x = side * (s / 2 - 2.2);                          // hoop: pole, board, rim
        box(0.25, 3.2, 0.25, P.lx, x, 3.2, 0, g);
        box(0.15, 1.2, 1.8, P.white, x - side * 0.2, 5.6, 0, g);
        box(0.6, 0.08, 0.6, P.orange, x - side * 0.6, 5.7, 0, g);
      });
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
        box(0.5, 10, 0.5, P.lx, a * (s / 2 + 0.6), 0, b * (s / 2 + 0.6), g);   // floodlights outside the podium
        box(1.8, 1, 0.5, P.white, a * (s / 2 + 0.6), 10, b * (s / 2 + 0.6), g).rotation.y = a * b * Math.PI / 4;
      });
    },
    retail(g) {               // shops with striped awnings
      box(16, 8, 10, P.dkLight, 0, 0, 0, g);
      box(16.4, 0.8, 10.4, P.dk, 0, 8, 0, g);
      for (let i = 0; i < 4; i++) {
        const x = -6 + i * 4;
        box(3.2, 3.4, 0.3, P.glass, x, 0.2, 5.05, g);
        const aw = box(3.6, 0.3, 2, i % 2 ? P.orange : P.hf, x, 4.2, 5.8, g);
        aw.rotation.x = -0.25;
      }
      box(12, 1.6, 0.4, P.white, 0, 5.8, 5.1, g);
    },
    transport(g) {            // station with curved roof
      box(17, 5, 10, P.glass, 0, 0, 0, g);
      for (let i = 0; i < 9; i++) {
        const a = (i / 8) * Math.PI;
        const r = box(17.6, 0.6, 2.2, P.lx, 0, 0, 0, g);
        r.position.set(0, 5 + Math.sin(a) * 3, -Math.cos(a) * 5.5);
        r.rotation.x = a - Math.PI / 2;
      }
      box(1, 7, 1, P.lx, 7.5, 0, 6.5, g);
      cyl(1.2, 0.4, P.white, 7.5, 7, 6.8, g, 16).rotation.x = Math.PI / 2;
    },
    leisure(g) {              // hotel/cinema with stepped volumes
      box(14, 6, 12, P.lxLight, 0, 0, 0, g);
      box(10, 6, 9, P.white, -1, 6, -1, g);
      box(6, 5, 6, P.lxLight, -2, 12, -2, g);
      windows(g, 14, 6, 12, 1, 5, P.glassDark, 1.6);
      box(8, 2, 0.4, P.orange, 1, 6.5, 3.6, g);
      box(16, 0.4, 3, P.lx, 0, 4.2, 7, g);
    },
    exterior(g) {             // building wrapped in façade fins
      box(12, 14, 12, P.cream, 0, 0, 0, g);
      for (let i = -5.5; i <= 5.5; i += 1.4) {
        box(0.35, 14.4, 1, P.lx, i, 0, 6.3, g);
        box(1, 14.4, 0.35, P.lx, 6.3, 0, i, g);
      }
      box(12.8, 0.8, 12.8, P.lx, 0, 14.2, 0, g);
    }
  };

  // Plot positions around the plaza (3x3 grid without the centre)
  const plots = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
  const buildings = C.sectors.map((sector, i) => {
    const g = new THREE.Group();
    (B[sector.id] || B.commercial)(g);
    const [px, pz] = plots[i % plots.length];
    const holder = new THREE.Group();
    holder.position.set(px * step, 0.1, pz * step);
    holder.add(g);
    // a couple of trees per plot
    tree(-BLOCK / 2 + 1.5, BLOCK / 2 - 1.5, 0.7, holder);
    tree(BLOCK / 2 - 1.5, BLOCK / 2 - 1.5, 0.6, holder);
    city.add(holder);
    const bbox = new THREE.Box3().setFromObject(g);
    const height = bbox.max.y;
    g.traverse((o) => (o.userData.index = i));
    return { sector, group: g, holder, height, lift: 0, hover: 0 };
  });

  // ---------- Decoy buildings (plain, white, not clickable) ----------

  function house(x, z, parent) {
    const g = new THREE.Group();
    const w = 3.5 + rand() * 1.5, d = 3.5 + rand() * 1.5, h = 2.5 + rand() * 1.5;
    box(w, h, d, choose(P.decoy), 0, 0, 0, g);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, w * 0.75, 2, 4, 1), mat(P.decoyRoof));
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 1, d / w);
    roof.position.y = h + 1;
    roof.castShadow = true;
    g.add(roof);
    box(0.9, 1.4, 0.15, P.decoyRoof, 0, 0, d / 2, g);
    g.position.set(x, 0.1, z);
    g.rotation.y = Math.floor(rand() * 4) * Math.PI / 2;
    parent.add(g);
  }
  function block(x, z, maxH, parent) {
    const g = new THREE.Group();
    const w = 5 + rand() * 3, d = 5 + rand() * 3, h = 4 + rand() * (maxH - 4);
    const col = choose(P.decoy);
    box(w, h, d, col, 0, 0, 0, g);
    windows(g, w, h, d, Math.floor(h / 2.6), Math.max(2, Math.floor(w / 2)), P.decoyWin, 1.2, 2.6);
    box(w + 0.3, 0.4, d + 0.3, P.decoyRoof, 0, h, 0, g);
    if (rand() > 0.6) box(w * 0.4, 1.2, d * 0.4, P.decoyRoof, 0, h + 0.4, 0, g);
    g.position.set(x, 0.1, z);
    parent.add(g);
  }

  // Outer ring of cells around the sector plots
  const ringCentre = roadsAt[1] + ROAD / 2 + EDGE / 2;       // middle of the edge strip
  const cells = [-ringCentre, -step, 0, step, ringCentre];
  cells.forEach((cx) => cells.forEach((cz) => {
    const outer = Math.abs(cx) === ringCentre || Math.abs(cz) === ringCentre;
    if (!outer) return;
    // cells nearest the camera (+x / +z) stay low so they never hide the sector buildings
    const front = cx === ringCentre || cz === ringCentre;
    const along = Math.abs(cx) === ringCentre ? "z" : "x";
    const span = Math.abs(cx) === ringCentre && Math.abs(cz) === ringCentre ? 0 : BLOCK / 2 - 3;
    const slots = span ? [-span, 0, span] : [0];
    slots.forEach((o) => {
      const x = cx + (along === "x" ? o : 0), z = cz + (along === "z" ? o : 0);
      const r = rand();
      if (r < 0.2) tree(x, z, 0.8 + rand() * 0.3);
      else if (front || r < 0.55) house(x, z, city);
      else block(x, z, 16, city);
    });
  }));

  // ---------- Little cars (crossy-road vibe) ----------
  const carColors = [P.orange, P.lx, P.peach, P.hf, P.white, P.dk, P.red];
  const cars = [];
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Group();
    const col = carColors[i % carColors.length];
    box(3, 1.2, 1.7, col, 0, 0.3, 0, c);
    box(1.8, 0.9, 1.5, P.white, -0.2, 1.5, 0, c);
    const horizontal = i % 2 === 0;
    const lane = (i % 4 < 2 ? -1 : 1) * roadsAt[i % 3 === 2 ? 1 : 0] + (i % 3 === 0 ? 1.4 : -1.4);
    const dir = i % 3 === 0 ? 1 : -1;
    if (!horizontal) c.rotation.y = Math.PI / 2;
    if (dir < 0) c.rotation.y += Math.PI;
    city.add(c);
    cars.push({ c, horizontal, lane, dir, t: Math.random() * SIZE, speed: 5 + Math.random() * 4 });
  }

  // ---------- HTML labels ----------
  const labelsEl = $("#labels");
  buildings.forEach((b, i) => {
    const el = document.createElement("button");
    el.className = "tag";
    el.type = "button";
    el.innerHTML = `<span class="num">${i + 1}</span>${b.sector.name}`;
    el.addEventListener("click", () => focus(i));
    el.addEventListener("pointerenter", () => (hovered = i));
    el.addEventListener("pointerleave", () => (hovered = -1));
    labelsEl.appendChild(el);
    b.label = el;
  });

  // ---------- Panel ----------
  const { esc, pad, imgPath, themeOf, THEMES, ARROW } = window.Deck;
  const brandKey = (b) => String(b || "").toLowerCase();
  const panel = $("#panel");
  const projectName = (p) => p.title || p.product || "";

  function guardImages(root) {
    root.querySelectorAll("img[data-src-check]").forEach((img) => {
      img.addEventListener("error", () => {
        const box = img.parentElement;
        box.classList.add("missing");
        box.innerHTML = `<span>Image not found:<br>${esc(img.getAttribute("src"))}</span>`;
      }, { once: true });
    });
  }

  function renderPanel(sector) {
    const projects = (sector.projects || []).length
      ? sector.projects.map((p, pi) => {
          const theme = themeOf(p.brand);
          const brand = THEMES[theme];
          const imgs = (p.images || []).filter(Boolean);
          const sub = [p.title ? p.product : "", p.location, p.year].filter(Boolean).join(" · ");
          return `
          <article class="project ${theme}" data-project="${pi}" tabindex="0">
            <div class="ph ${imgs.length ? "" : "empty"}">
              ${imgs.length ? `<img data-src-check src="${esc(imgPath(sector.id, imgs[0]))}" alt="">` : "<span>Add photo</span>"}
              ${imgs.length > 1 ? `<span class="count">${imgs.length}</span>` : ""}
            </div>
            <div class="meta">
              ${brand.logo ? `<button class="brandbtn" type="button" data-brand="${theme}" aria-label="${esc(brand.name)} material slides"><img src="${esc(brand.logo)}" alt="${esc(brand.name)}"></button>` : ""}
              <span class="t">${projectName(p) ? esc(projectName(p)) : '<span class="todo">Project name to add</span>'}</span>
              ${sub ? `<span class="p">${esc(sub)}</span>` : ""}
              <span class="more">View project ${ARROW}</span>
            </div>
          </article>`;
        }).join("")
      : `<p class="empty-note">No projects yet. Add them in <code>content.js</code>.</p>`;
    const hero = sector.hero
      ? `<img data-src-check src="${esc(imgPath(sector.id, sector.hero))}" alt="">`
      : `<div class="hero-empty"></div>`;
    const points = sector.points || [];
    panel.innerHTML = `
      <div class="hero">${hero}</div>
      <div class="body stagger">
        <p class="kicker" style="--i:0">Sector ${pad(active + 1)}</p>
        <h2 style="--i:0">${esc(sector.name)}</h2>
        <p class="lead" style="--i:1">${esc(sector.intro)}</p>
        ${points.length ? `<ol class="points" style="--i:2">${points.map((p, k) => `<li><span class="n">${pad(k + 1)}</span>${esc(p.title || p)}</li>`).join("")}</ol>` : ""}
        <button class="present" type="button" style="--i:3" data-present>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5z" fill="currentColor"/></svg>
          Present ${esc(sector.name)}
          <span>${(sector.projects || []).length + 3} slides</span>
        </button>
        <h3 style="--i:4">Projects</h3>
        <div class="projects" style="--i:5">${projects}</div>
      </div>`;
    guardImages(panel);
    panel.scrollTop = 0;
  }

  panel.addEventListener("click", (e) => {
    const bb = e.target.closest(".brandbtn");
    if (bb) { e.stopPropagation(); return openMaterial(bb.dataset.brand); }
    if (e.target.closest("[data-present]")) return presentSector(buildings[active].sector);
    const card = e.target.closest(".project[data-project]");
    if (card) openProject(buildings[active].sector, +card.dataset.project);
  });
  panel.addEventListener("keydown", (e) => {
    const card = e.target.closest(".project[data-project]");
    if (card && e.key === "Enter") { e.stopPropagation(); openProject(buildings[active].sector, +card.dataset.project); }
  });

  // ---------- Slides built from the content ----------
  function projectCaption(p) {
    const theme = themeOf(p.brand);
    const bits = [p.location, p.title ? p.product : ""].filter(Boolean).map(esc);
    return `<b>${projectName(p) ? esc(projectName(p)) : '<span class="s-todo">Project name to add</span>'}</b>`
      + bits.map((b) => `<span class="sep"></span>${b}`).join("")
      + (THEMES[theme].logo ? `<img class="brand" src="${esc(THEMES[theme].logo)}" alt="${esc(THEMES[theme].name)}">` : "");
  }

  function projectSlides(p) {
    const theme = themeOf(p.brand);
    const imgs = (p.images || []).filter(Boolean);
    const rows = Object.entries(Object.assign(p.product ? { Product: p.product } : {}, p.location ? { Location: p.location } : {}, p.details || {}));
    const specs = rows.length ? `<dl class="s-specs">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v ? esc(v) : '<span class="s-todo">—</span>'}</dd></div>`).join("")}</dl>` : "";
    const link = THEMES[theme].logo
      ? `<button class="s-link" type="button" data-action="material" data-arg="${theme}"><img src="${esc(THEMES[theme].logo)}" alt="">Material specs: fire, acoustics, sustainability ${ARROW}</button>` : "";
    const slides = [
      { layout: "photo-info", image: imgs[0] || "", captionHtml: projectCaption(p) },
      { layout: "text-photo", title: projectName(p), subtitle: [p.location, p.year].filter(Boolean).join(" · "),
        text: p.text, html: specs + link, image: imgs[1] || imgs[0] || "" }
    ];
    imgs.slice(1).forEach((img) => slides.push({ layout: "photo", image: img }));
    return { slides, theme };
  }

  function openProject(sector, pi) {
    const { slides, theme } = projectSlides(sector.projects[pi]);
    window.Deck.open(slides, { theme, folder: sector.id });
  }

  function presentSector(sector) {
    const slides = [
      { layout: "section", title: sector.name, subtitle: "Sectors" },
      { layout: "text-photo", title: sector.name, text: sector.intro, image: sector.hero },
      { layout: "text", title: sector.name, subtitle: "Why it matters",
        bullets: (sector.points || []).map((p) => (typeof p === "string" ? p : { title: p.title, text: p.text })) }
    ];
    (sector.projects || []).forEach((p) => {
      (p.images || []).filter(Boolean).slice(0, 1).forEach((img) =>
        slides.push({ layout: "photo-info", image: img, captionHtml: projectCaption(p), theme: themeOf(p.brand) }));
      if (!(p.images || []).filter(Boolean).length)
        slides.push({ layout: "photo-info", image: "", captionHtml: projectCaption(p), theme: themeOf(p.brand) });
    });
    window.Deck.open(slides, { theme: "general", folder: sector.id });
  }

  function openMaterial(key) {
    const slides = (C.materials || {})[brandKey(key)];
    if (slides) window.Deck.open(slides, { theme: brandKey(key), folder: "materials/" + brandKey(key) });
  }

  function openTopic(id) {
    if (id === "sectors") { window.Deck.close(); return; }
    const t = (C.topics || []).find((x) => x.id === id);
    if (t) window.Deck.open(t.slides, { theme: "general", folder: t.id });
  }

  // Opening deck: cover + agenda. Closing it (or going past the end) lands in the city.
  function agendaItems() {
    return [{ id: "sectors", title: "Sectors" }, ...(C.topics || [])];
  }
  function openIntro() {
    const cv = C.cover || {};
    const list = `<ol class="s-agenda">${agendaItems().map((t, k) =>
      `<li><button type="button" data-action="topic" data-arg="${esc(t.id)}"><span class="n">${pad(k + 1)}</span>${esc(t.title)}</button></li>`).join("")}</ol>`;
    window.Deck.open([
      { layout: "cover", title: cv.title, subtitle: cv.subtitle, image: cv.image },
      { layout: "text-photo", title: "Today's agenda", html: list, image: cv.image, text: " " }
    ], { theme: "general", folder: "cover" });
  }

  window.Deck.onAction = (action, arg) => {
    if (action === "material") openMaterial(arg);
    if (action === "topic") openTopic(arg);
  };

  // Home screen: agenda + material chips
  $("#agenda").innerHTML = agendaItems().map((t, k) =>
    `<li><button type="button" data-topic="${esc(t.id)}" class="${t.id === "sectors" ? "here" : ""}"><span class="n">${pad(k + 1)}</span>${esc(t.title)}</button></li>`).join("");
  $("#agenda").addEventListener("click", (e) => {
    const b = e.target.closest("[data-topic]");
    if (b && b.dataset.topic !== "sectors") openTopic(b.dataset.topic);
  });
  $("#intro-btn").addEventListener("click", openIntro);
  document.querySelectorAll(".legend [data-brand]").forEach((b) => b.addEventListener("click", () => openMaterial(b.dataset.brand)));

  // ---------- Camera animation ----------
  let anim = null;
  let active = -1;
  let hovered = -1;
  const easeInOut = (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);

  function flyTo(target, zoom) {
    anim = {
      from: { target: view.target.clone(), zoom: view.zoom },
      to: { target, zoom },
      start: performance.now(),
      dur: reduceMotion ? 1 : 1100
    };
  }

  function focusTarget(b) {
    // Aim at the building's middle, nudged so it sits left of the panel
    const t = b.holder.position.clone().setY(b.height * 0.45);
    const zoom = Math.min(3.2, (viewSize * 0.55) / Math.max(b.height, 14));
    const narrow = window.innerWidth <= 760;
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), CAM_DIR).normalize();
    const up = new THREE.Vector3().crossVectors(CAM_DIR, right).normalize();
    const halfW = (viewSize * aspect()) / 2 / zoom;
    const halfH = viewSize / 2 / zoom;
    if (narrow) t.addScaledVector(up, -halfH * 0.55);
    else t.addScaledVector(right, halfW * 0.42);
    return { t, zoom };
  }

  function focus(i) {
    const b = buildings[i];
    if (!b) return;
    active = i;
    renderPanel(b.sector);
    document.body.classList.add("focused");
    const { t, zoom } = focusTarget(b);
    flyTo(t, zoom);
  }

  function overview() {
    active = -1;
    document.body.classList.remove("focused");
    flyTo(OVERVIEW.target.clone(), OVERVIEW.zoom);
  }
  $("#back").addEventListener("click", overview);

  window.addEventListener("keydown", (e) => {
    if (window.Deck.handleKey(e)) return;     // slides are on top
    if (e.target.closest && e.target.closest("button, [tabindex]") && (e.key === " " || e.key === "Enter")) return;
    const n = buildings.length;
    if (e.key === "Escape" || e.key === "Home") overview();
    else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); focus(active < 0 ? 0 : (active + 1) % n); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); focus(active < 0 ? n - 1 : (active - 1 + n) % n); }
    else if (/^[1-9]$/.test(e.key) && +e.key <= n) focus(+e.key - 1);
  });

  // ---------- Picking ----------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(e) {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(buildings.map((b) => b.group), true)[0];
    return hit ? hit.object.userData.index : -1;
  }
  let downAt = null;
  canvas.addEventListener("pointermove", (e) => {
    hovered = pick(e);
    canvas.style.cursor = hovered >= 0 ? "pointer" : "default";
  });
  canvas.addEventListener("pointerdown", (e) => (downAt = [e.clientX, e.clientY]));
  canvas.addEventListener("pointerup", (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const i = pick(e);
    if (i >= 0) focus(i);
    else if (active >= 0) overview();
  });

  // ---------- Resize ----------
  const aspect = () => innerWidth / innerHeight;
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    viewSize = aspect() < 1 ? 170 : 112;
    const a = aspect();
    camera.left = (-viewSize * a) / 2;
    camera.right = (viewSize * a) / 2;
    camera.top = viewSize / 2;
    camera.bottom = -viewSize / 2;
    camera.updateProjectionMatrix();
    if (active >= 0 && !anim) {
      const { t, zoom } = focusTarget(buildings[active]);
      view.target.copy(t); view.zoom = zoom;
    }
  }
  addEventListener("resize", resize);
  resize();

  // ---------- Loop ----------
  const tmp = new THREE.Vector3();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (anim) {
      const k = Math.min(1, (now - anim.start) / anim.dur);
      const e = easeInOut(k);
      view.target.lerpVectors(anim.from.target, anim.to.target, e);
      view.zoom = anim.from.zoom + (anim.to.zoom - anim.from.zoom) * e;
      if (k === 1) anim = null;
    }
    camera.position.copy(view.target).addScaledVector(CAM_DIR, CAM_DIST);
    camera.lookAt(view.target);
    camera.zoom = view.zoom;
    camera.updateProjectionMatrix();

    // Hover: building rises a touch (spring-ish smoothing)
    buildings.forEach((b, i) => {
      const goal = (i === hovered && active < 0) || i === active ? 1 : 0;
      b.hover += (goal - b.hover) * Math.min(1, dt * 12);
      b.group.position.y = b.hover * 0.8;
      b.label.classList.toggle("hover", i === hovered);
    });

    // Cars drive around, wrapping at the island edge
    if (!reduceMotion) cars.forEach((car) => {
      car.t += car.dir * car.speed * dt;
      const half = SIZE / 2 - 2;
      if (car.t > half) car.t = -half;
      if (car.t < -half) car.t = half;
      if (car.horizontal) car.c.position.set(car.t, 0.1, car.lane);
      else car.c.position.set(car.lane, 0.1, car.t);
    });

    // Labels follow buildings on screen
    buildings.forEach((b) => {
      tmp.copy(b.holder.position).setY(b.height + 3 + b.hover * 0.8).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * innerWidth;
      const y = (-tmp.y * 0.5 + 0.5) * innerHeight;
      b.label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if ((C.cover || {}).showOnStart !== false) openIntro();
})();
