/* Low-poly city: one building per sector. Click a building to zoom in. */
(function () {
  const C = window.HD_CONTENT;
  const $ = (s) => document.querySelector(s);
  document.getElementById("title").textContent = C.title;
  document.getElementById("subtitle").textContent = C.subtitle;

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
  const BRANDS = {
    derako:    { name: "Derako",    logo: "assets/logos/derako.png" },
    heartfelt: { name: "HeartFelt", logo: "assets/logos/heartfelt.png" },
    luxalon:   { name: "Luxalon",   logo: "assets/logos/luxalon.png" }
  };
  const brandKey = (b) => String(b || "").toLowerCase();
  const brandOf = (b) => BRANDS[brandKey(b)] || { name: b, logo: "" };
  const panel = $("#panel");
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // "photo.jpg" → "assets/img/<folder>/photo.jpg"; full paths are left alone
  const imgPath = (folder, f) => (!f ? "" : f.includes("/") ? f : `assets/img/${folder}/${f}`);
  const pad = (n) => String(n).padStart(2, "0");

  // A wrong file name shows a clear message instead of a broken image
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
          const brand = brandOf(p.brand);
          const imgs = (p.images || []).filter(Boolean);
          const sub = [p.location, p.year].filter(Boolean).join(" · ");
          return `
          <article class="project ${esc(brandKey(p.brand))}" data-project="${pi}" tabindex="0">
            <div class="ph ${imgs.length ? "" : "empty"}">
              ${imgs.length ? `<img data-src-check src="${esc(imgPath(sector.id, imgs[0]))}" alt="">` : "<span>Add photo</span>"}
            </div>
            <div class="meta">
              <button class="brandbtn" type="button" data-brand="${esc(brandKey(p.brand))}" aria-label="About ${esc(brand.name)}">
                ${brand.logo ? `<img src="${esc(brand.logo)}" alt="${esc(brand.name)}">` : esc(brand.name)}
              </button>
              <span class="t">${esc(p.title)}</span>
              ${sub ? `<span class="p">${esc(sub)}</span>` : ""}
              <span class="more">View project <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            </div>
          </article>`;
        }).join("")
      : `<p class="empty-note">Projects for this sector coming soon. Add them in <code>content.js</code>.</p>`;
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
        ${points.length ? `<ol class="points" style="--i:2">${points.map((p, k) => `<li><span class="n">${pad(k + 1)}</span>${esc(p)}</li>`).join("")}</ol>` : ""}
        <h3 style="--i:3">Projects</h3>
        <div class="projects" style="--i:4">${projects}</div>
      </div>`;
    guardImages(panel);
    panel.scrollTop = 0;
  }

  panel.addEventListener("click", (e) => {
    const bb = e.target.closest(".brandbtn");
    if (bb) { e.stopPropagation(); return openMaterial(bb.dataset.brand); }
    const card = e.target.closest(".project[data-project]");
    if (card) openProject(buildings[active].sector, +card.dataset.project);
  });
  panel.addEventListener("keydown", (e) => {
    const card = e.target.closest(".project[data-project]");
    if (card && e.key === "Enter") { e.stopPropagation(); openProject(buildings[active].sector, +card.dataset.project); }
  });

  // ---------- Project view: large photo + info on the right ----------
  const viewer = $("#viewer");
  let proj = null; // { sector, project, imgs, k }

  function openProject(sector, pi) {
    const p = sector.projects[pi];
    const brand = brandOf(p.brand);
    const imgs = (p.images || []).filter(Boolean).map((f) => imgPath(sector.id, f));
    proj = { sector, p, imgs, k: 0 };
    const details = Object.entries(p.details || {});
    viewer.className = "viewer " + brandKey(p.brand);
    viewer.innerHTML = `
      <div class="v-media">
        <div class="v-stage">${imgs.length ? "" : `<div class="v-empty"><span>Add photos in content.js</span></div>`}</div>
        ${imgs.length > 1 ? `
          <button class="v-nav prev" type="button" aria-label="Previous photo"><svg width="20" height="20" viewBox="0 0 20 20"><path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="v-nav next" type="button" aria-label="Next photo"><svg width="20" height="20" viewBox="0 0 20 20"><path d="M8 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <div class="v-thumbs">${imgs.map((src, k) => `<button type="button" data-k="${k}" aria-label="Photo ${k + 1}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>` : ""}
      </div>
      <div class="v-info">
        <button class="v-close" type="button" aria-label="Close project"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
        <p class="kicker">${esc(sector.name)}</p>
        <h2>${esc(p.title)}</h2>
        ${[p.location, p.year].filter(Boolean).length ? `<p class="v-sub">${esc([p.location, p.year].filter(Boolean).join(" · "))}</p>` : ""}
        ${p.text ? `<p class="v-text">${esc(p.text)}</p>` : ""}
        ${details.length ? `<dl class="v-specs">${details.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v ? esc(v) : '<span class="tbd">—</span>'}</dd></div>`).join("")}</dl>` : ""}
        <button class="v-brand brandbtn" type="button" data-brand="${esc(brandKey(p.brand))}">
          ${brand.logo ? `<img src="${esc(brand.logo)}" alt="${esc(brand.name)}">` : esc(brand.name)}
          <span>Fire, acoustics &amp; sustainability</span>
          <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>`;
    if (imgs.length) showProjectPhoto(0, true);
    viewer.classList.add("open");
    document.body.classList.add("viewing");
  }

  function showProjectPhoto(k, first) {
    const n = proj.imgs.length;
    proj.k = (k + n) % n;
    const stage = viewer.querySelector(".v-stage");
    const old = stage.querySelector("img");
    const img = new Image();
    img.alt = proj.p.title;
    img.setAttribute("data-src-check", "");
    img.src = proj.imgs[proj.k];
    img.className = first ? "" : "entering";
    stage.appendChild(img);
    guardImages(stage);
    requestAnimationFrame(() => requestAnimationFrame(() => img.classList.remove("entering")));
    if (old) { old.classList.add("leaving"); setTimeout(() => old.remove(), 260); }
    viewer.querySelectorAll(".v-thumbs button").forEach((b, i) => b.classList.toggle("on", i === proj.k));
  }

  function closeProject() {
    viewer.classList.remove("open");
    document.body.classList.remove("viewing");
    proj = null;
  }
  viewer.addEventListener("click", (e) => {
    if (e.target.closest(".brandbtn")) return openMaterial(e.target.closest(".brandbtn").dataset.brand);
    if (e.target.closest(".v-close")) return closeProject();
    if (e.target.closest(".v-nav.prev")) return showProjectPhoto(proj.k - 1);
    if (e.target.closest(".v-nav.next")) return showProjectPhoto(proj.k + 1);
    const t = e.target.closest(".v-thumbs button");
    if (t) return showProjectPhoto(+t.dataset.k);
  });

  // ---------- Material slides (fire, acoustics, sustainability...) ----------
  const material = $("#material");
  let slideState = null; // { key, k, n }

  function openMaterial(key) {
    key = brandKey(key);
    const m = (C.materials || {})[key];
    const brand = brandOf(key);
    if (!m) return;
    const slides = m.slides || [];
    const folder = "materials/" + key;
    const media = (src, cls) => src
      ? `<div class="${cls}"><img data-src-check src="${esc(imgPath(folder, src))}" alt=""></div>`
      : `<div class="${cls} empty"><span>Add image</span></div>`;
    const cover = `
      <section class="m-slide m-cover">
        <div class="m-copy">
          <img class="m-logo" src="${esc(brand.logo)}" alt="${esc(brand.name)}">
          <h2>${esc(m.tagline)}</h2>
          <p class="m-text">${esc(m.intro)}</p>
          <ol class="m-index">${slides.map((sl, k) => `<li><button type="button" data-go="${k + 1}"><span class="n">${pad(k + 1)}</span>${esc(sl.title)}</button></li>`).join("")}</ol>
        </div>
        ${media(m.image, "m-media")}
      </section>`;
    const body = slides.map((sl, k) => `
      <section class="m-slide">
        <div class="m-copy">
          <p class="kicker">${pad(k + 1)} / ${pad(slides.length)}</p>
          <h2>${esc(sl.title)}</h2>
          <div class="m-figure ${sl.figure ? "" : "tbd"}">
            <strong>${esc(sl.figure || "Key figure")}</strong>
            ${sl.label ? `<span>${esc(sl.label)}</span>` : ""}
          </div>
          <p class="m-text">${esc(sl.text)}</p>
        </div>
        ${media(sl.image, "m-media")}
      </section>`).join("");
    material.className = "material " + key;
    material.innerHTML = `
      <header class="m-bar">
        <img src="${esc(brand.logo)}" alt="${esc(brand.name)}">
        <nav class="m-dots">${[m.tagline ? "Overview" : "Overview", ...slides.map((s) => s.title)].map((t, k) => `<button type="button" data-go="${k}" aria-label="${esc(t)}"></button>`).join("")}</nav>
        <button class="m-close" type="button" aria-label="Close"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
      </header>
      <div class="m-track">${cover}${body}</div>
      <div class="m-arrows">
        <button class="prev" type="button" aria-label="Previous slide"><svg width="20" height="20" viewBox="0 0 20 20"><path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <button class="next" type="button" aria-label="Next slide"><svg width="20" height="20" viewBox="0 0 20 20"><path d="M8 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>`;
    guardImages(material);
    slideState = { key, k: 0, n: slides.length + 1 };
    goSlide(0);
    material.classList.add("open");
  }
  function goSlide(k) {
    slideState.k = Math.max(0, Math.min(slideState.n - 1, k));
    material.querySelector(".m-track").style.transform = `translateX(${-slideState.k * 100}%)`;
    material.querySelectorAll(".m-slide").forEach((el, i) => el.classList.toggle("on", i === slideState.k));
    material.querySelectorAll(".m-dots button").forEach((b, i) => b.classList.toggle("on", i === slideState.k));
    material.querySelector(".m-arrows .prev").disabled = slideState.k === 0;
    material.querySelector(".m-arrows .next").disabled = slideState.k === slideState.n - 1;
  }
  function closeMaterial() { material.classList.remove("open"); slideState = null; }
  material.addEventListener("click", (e) => {
    if (e.target.closest(".m-close")) return closeMaterial();
    const go = e.target.closest("[data-go]");
    if (go) return goSlide(+go.dataset.go);
    if (e.target.closest(".m-arrows .prev")) return goSlide(slideState.k - 1);
    if (e.target.closest(".m-arrows .next")) return goSlide(slideState.k + 1);
  });
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
    const next = ["ArrowRight", "PageDown", " "].includes(e.key);
    const prev = ["ArrowLeft", "PageUp"].includes(e.key);
    if (slideState) {                       // material slides are on top
      if (e.key === "Escape") closeMaterial();
      else if (next) { e.preventDefault(); goSlide(slideState.k + 1); }
      else if (prev) { e.preventDefault(); goSlide(slideState.k - 1); }
      return;
    }
    if (proj) {                      // then the project view
      if (e.key === "Escape") closeProject();
      else if (proj.imgs.length > 1 && next) { e.preventDefault(); showProjectPhoto(proj.k + 1); }
      else if (proj.imgs.length > 1 && prev) { e.preventDefault(); showProjectPhoto(proj.k - 1); }
      return;
    }
    if (e.target.closest && e.target.closest("button, [tabindex]") && e.key === " ") return;
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
})();
