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
  scene.background = new THREE.Color("#EEF3EA");

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 400);
  const CAM_DIR = new THREE.Vector3(1, 1.05, 1).normalize();
  const CAM_DIST = 120;
  const OVERVIEW = { target: new THREE.Vector3(0, 7, 0), zoom: 1 };
  const view = { target: OVERVIEW.target.clone(), zoom: 1 }; // current, animated
  let viewSize = 70; // world units visible vertically at zoom 1

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c7ae, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.75);
  sun.position.set(40, 70, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 200 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // ---------- Helpers ----------
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

  // Palette: soft, matches the template's pastel tones
  const P = {
    grass: "#CFDDBF", grassDark: "#B8CBA6", road: "#8D9297", line: "#F4F4EF", walk: "#E6E2D8",
    white: "#F7F6F1", cream: "#EDE6D8", glass: "#9FB2C9", glassDark: "#6F82A0",
    hf: "#4C653D", hfLight: "#D6E5CD", dk: "#6A5C48", dkLight: "#E1D5C2", lx: "#57617A", lxLight: "#E1EAF8",
    orange: "#EE7F1A", red: "#D9574A", tree: "#6F9A57", treeDark: "#557F43", trunk: "#7A6248", water: "#9FC3D9"
  };

  // ---------- Ground & roads ----------
  const city = new THREE.Group();
  scene.add(city);
  const SIZE = 72, BLOCK = 20, ROAD = 6;
  box(SIZE, 3, SIZE, P.grassDark, 0, -3, 0, city);           // island base
  box(SIZE - 1, 0.2, SIZE - 1, P.grass, 0, 0, 0, city);
  [-1, 1].forEach((s) => {
    const o = s * (BLOCK / 2 + ROAD / 2);
    box(SIZE - 1, 0.25, ROAD, P.road, 0, 0, o, city);
    box(ROAD, 0.25, SIZE - 1, P.road, o, 0, 0, city);
    for (let i = -SIZE / 2 + 3; i < SIZE / 2 - 2; i += 4) {   // dashed lines
      box(1.6, 0.3, 0.3, P.line, i, 0, o, city);
      box(0.3, 0.3, 1.6, P.line, o, 0, i, city);
    }
  });

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
    box(2.2 * s, 2.2 * s, 2.2 * s, Math.random() > 0.5 ? P.tree : P.treeDark, 0, 1.4 * s, 0, g);
    g.position.set(x, 0.1, z);
    g.rotation.y = Math.random() * Math.PI;
    parent.add(g);
  }
  // Trees along the island edge
  for (let i = -SIZE / 2 + 2.5; i < SIZE / 2 - 2; i += 5.5) {
    [[i, -SIZE / 2 + 2], [i, SIZE / 2 - 2], [-SIZE / 2 + 2, i], [SIZE / 2 - 2, i]].forEach(([x, z]) => {
      if (Math.abs(Math.abs(x) - (BLOCK / 2 + ROAD / 2)) > 4 && Math.abs(Math.abs(z) - (BLOCK / 2 + ROAD / 2)) > 4)
        tree(x, z, 0.8 + Math.random() * 0.4);
    });
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
    sport(g) {                // stadium bowl
      const s = 15;
      box(s, 4, s, P.white, 0, 0, 0, g);
      box(s - 4, 4.1, s - 4, P.hf, 0, 0, 0, g);
      box(s - 6, 4.2, s - 8, "#7FAE5F", 0, 0, 0, g);
      box(0.3, 4.3, s - 8, P.white, 0, 0, 0, g);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
        box(0.5, 9, 0.5, P.lx, a * (s / 2 - 0.5), 0, b * (s / 2 - 0.5), g);
        box(2, 1, 0.6, P.white, a * (s / 2 - 0.5), 9, b * (s / 2 - 0.5), g);
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
  const step = BLOCK + ROAD;
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

  // ---------- Little cars (crossy-road vibe) ----------
  const carColors = [P.orange, P.lx, P.red, P.hf, P.white, P.dk];
  const cars = [];
  for (let i = 0; i < 10; i++) {
    const c = new THREE.Group();
    const col = carColors[i % carColors.length];
    box(3, 1.2, 1.7, col, 0, 0.3, 0, c);
    box(1.8, 0.9, 1.5, P.white, -0.2, 1.5, 0, c);
    const horizontal = i % 2 === 0;
    const lane = (i % 4 < 2 ? -1 : 1) * (BLOCK / 2 + ROAD / 2) + (i % 3 === 0 ? 1.4 : -1.4);
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
  const panel = $("#panel");
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function renderPanel(sector) {
    const brandName = (k) => C.brands[k]?.name || k;
    const projects = sector.projects.length
      ? sector.projects.map((p) => `
          <article class="project ${esc(p.brand)}">
            <div class="ph ${p.image ? "" : "empty"}">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)}">` : "Add photo"}</div>
            <div class="meta">
              <span class="badge">${esc(brandName(p.brand))}</span>
              <span class="t">${esc(p.title)}</span>
              <span class="p">${esc(p.place)}</span>
            </div>
          </article>`).join("")
      : `<p class="empty-note">Projects for this sector coming soon. Add them in <code>content.js</code>.</p>`;
    const hero = sector.hero
      ? `<img src="${esc(sector.hero)}" alt="">`
      : `<div style="height:100%;background:repeating-linear-gradient(90deg,#D6E5CD 0 22px,#fff 22px 23px)"></div>`;
    panel.innerHTML = `
      <div class="hero">${hero}<span class="eyebrow">Sector</span></div>
      <div class="body stagger">
        <h2 style="--i:0">${esc(sector.name)}</h2>
        <p class="lead" style="--i:1">${esc(sector.intro)}</p>
        ${sector.points.length ? `<ul class="points" style="--i:2">${sector.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
        <h3 style="--i:3">What we've made</h3>
        <div class="projects" style="--i:4">${projects}</div>
      </div>`;
    panel.scrollTop = 0;
  }
  panel.addEventListener("click", (e) => {
    const img = e.target.closest(".ph img");
    if (!img) return;
    const lb = $("#lightbox");
    lb.querySelector("img").src = img.src;
    lb.classList.add("open");
  });
  $("#lightbox").addEventListener("click", () => $("#lightbox").classList.remove("open"));

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
    if ($("#lightbox").classList.contains("open")) {
      if (e.key === "Escape") $("#lightbox").classList.remove("open");
      return;
    }
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
    viewSize = aspect() < 1 ? 130 : 92;
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
