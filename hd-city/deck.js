/* Slide decks in the Hunter Douglas template style.
   Deck.open(slides, { theme, folder }) shows a 16:9 slide player on top of the city.
   Slides are plain objects: { layout, title, subtitle, text, bullets, image, ... } */
(function () {
  const C = window.HD_CONTENT;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");

  const THEMES = {
    general:   { name: "",          logo: "" },
    derako:    { name: "Derako",    logo: "assets/logos/derako.png" },
    heartfelt: { name: "HeartFelt", logo: "assets/logos/heartfelt.png" },
    luxalon:   { name: "Luxalon",   logo: "assets/logos/luxalon.png" }
  };
  const themeOf = (t) => (THEMES[String(t || "").toLowerCase()] ? String(t).toLowerCase() : "general");

  // "photo.jpg" → "assets/img/<folder>/photo.jpg"; full paths are left alone
  // "../shared/x.jpg" is relative to that folder; "assets/..." paths are used as they are
  const imgPath = (folder, f) => (!f ? "" : /^(assets\/|https?:)/.test(f) ? f : `assets/img/${folder}/${f}`);

  const ARROW = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------- Pieces shared by the layouts ----------
  function photo(src, folder, cls) {
    const path = imgPath(folder, src);
    return path
      ? `<div class="s-photo ${cls}"><img data-src-check src="${esc(path)}" alt=""></div>`
      : `<div class="s-photo ${cls} todo"><span>Add photo</span></div>`;
  }
  const todo = (v, label) => (v ? esc(v) : `<span class="s-todo">${esc(label)}</span>`);
  const tab = (theme) => (THEMES[theme].name ? `<div class="s-tab"><span>${esc(THEMES[theme].name)}</span></div>` : "");
  const logo = (cls) => `<img class="s-hdlogo ${cls}" src="assets/logos/hunter-douglas.png" alt="Hunter Douglas Architectural">`;
  function footer(n) {
    const p = C.presentation || {};
    return `<div class="s-footer">
      <span class="s-num">${n}</span>
      <span class="s-foot-text">Hunter Douglas Architectural ${esc(p.name || "")}${p.version ? " - " + esc(p.version) : ""}</span>
      ${logo("small")}
    </div>`;
  }
  function body(s) {
    const bullets = (s.bullets || []).filter(Boolean);
    const figure = s.figure !== undefined
      ? `<div class="s-figure ${s.figure ? "" : "empty"}"><strong>${s.figure ? esc(s.figure) : "Key figure"}</strong>${s.label ? `<span>${esc(s.label)}</span>` : ""}</div>` : "";
    const text = s.text ? `<p class="s-text">${esc(s.text)}</p>` : (s.html ? "" : (!bullets.length && !s.list ? `<p class="s-text"><span class="s-todo">Add text</span></p>` : ""));
    const list = bullets.length ? `<ul class="s-bullets">${bullets.map((b) => typeof b === "string"
      ? `<li>${esc(b)}</li>`
      : `<li><b>${esc(b.title)}</b>${b.text ? `<span>${esc(b.text)}</span>` : ""}</li>`).join("")}</ul>` : "";
    return figure + text + list + (s.html || "");
  }

  // ---------- Layouts ----------
  const LAYOUTS = {
    cover: (s, t, f) => `
      ${photo(s.image, f, "cover")}
      <div class="s-cover-text">
        <p class="s-sub">${esc(s.subtitle || "")}</p>
        <h1 class="s-title xl">${todo(s.title, "Title")}</h1>
      </div>
      ${logo("big")}`,
    section: (s) => `
      <div class="s-cover-text section">
        ${s.subtitle ? `<p class="s-sub">${esc(s.subtitle)}</p>` : ""}
        <h1 class="s-title xxl">${todo(s.title, "Title")}</h1>
      </div>
      ${logo("big")}`,
    thanks: (s) => `
      <h1 class="s-title thanks">${esc(s.title || "Thank you for your attention")}</h1>
      ${logo("big")}`,
    "text-photo": (s, t, f, n) => `
      <div class="s-head"><h2 class="s-title">${todo(s.title, "Title")}</h2>${s.subtitle ? `<p class="s-subtitle">${esc(s.subtitle)}</p>` : ""}</div>
      <div class="s-body">${body(s)}</div>
      ${photo(s.image, f, "side")}
      ${footer(n)}`,
    text: (s, t, f, n) => `
      <div class="s-head"><h2 class="s-title">${todo(s.title, "Title")}</h2>${s.subtitle ? `<p class="s-subtitle">${esc(s.subtitle)}</p>` : ""}</div>
      <div class="s-body wide">${body(s)}</div>
      ${footer(n)}`,
    "photo-info": (s, t, f, n) => `
      ${photo(s.image, f, "info")}
      <p class="s-caption">${s.captionHtml || (s.caption ? esc(s.caption) : '<span class="s-todo">Add caption</span>')}</p>
      ${footer(n)}`,
    photo: (s, t, f, n) => `${photo(s.image, f, "full")}${footer(n)}`,
    // Product spec page: key figures, specs, drawing, finishes, certificates
    spec: (s, t, f, n) => `
      <div class="s-head"><p class="s-kicker">${esc(s.brand || "")}</p><h2 class="s-title">${todo(s.title, "Product")}</h2></div>
      <div class="s-keys">${[["Sound absorption", s.acoustic], ["Reaction to fire", s.fire], ["VOC emission", s.voc]].map(([l, v]) =>
        `<div class="${v ? "" : "empty"}"><strong>${v ? esc(v) : "—"}</strong><span>${l}</span></div>`).join("")}</div>
      <div class="s-body spec">${(s.specs || []).length ? `<ul class="s-bullets compact">${s.specs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : '<p class="s-text"><span class="s-todo">Add product specifications</span></p>'}</div>
      ${photo(s.drawing, f, "drawing")}
      ${s.finishes ? photo(s.finishes, f, "finishes") : ""}
      ${s.certificates ? `<div class="s-certs"><img data-src-check src="${esc(imgPath(f, s.certificates))}" alt="Certificates"></div>` : ""}
      ${footer(n)}`,
    // Big numbers (e.g. "132 companies")
    figures: (s, t, f, n) => `
      <div class="s-head"><h2 class="s-title">${todo(s.title, "Title")}</h2>${s.subtitle ? `<p class="s-subtitle">${esc(s.subtitle)}</p>` : ""}</div>
      <div class="s-figs">${(s.figures || []).map((x) => `<div><strong>${esc(x.value)}</strong><span>${esc(x.label)}</span></div>`).join("")}</div>
      ${photo(s.image, f, "side")}
      ${footer(n)}`
  };
  // the slatted background layouts
  const SLATS = new Set(["cover", "section", "thanks"]);

  function renderSlide(s, i, deck) {
    const theme = themeOf(s.theme || deck.theme);
    const layout = LAYOUTS[s.layout] ? s.layout : "text-photo";
    const html = LAYOUTS[layout](s, theme, s.folder || deck.folder || "", i + 1);
    return `<section class="slide l-${layout} t-${theme} ${SLATS.has(layout) ? "slats" : ""}" data-i="${i}">${tab(theme)}${html}</section>`;
  }

  // ---------- Player ----------
  const root = document.createElement("div");
  root.className = "deck";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.innerHTML = `
    <div class="deck-stage"></div>
    <button class="deck-close" type="button" aria-label="Close"><svg viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
    <div class="deck-bar">
      <button class="prev" type="button" aria-label="Previous slide"><svg viewBox="0 0 20 20"><path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <span class="deck-count"></span>
      <button class="next" type="button" aria-label="Next slide"><svg viewBox="0 0 20 20"><path d="M8 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>`;
  document.body.appendChild(root);
  const stage = root.querySelector(".deck-stage");
  const stack = []; // decks can open on top of each other (project → material)

  function guardImages(el) {
    el.querySelectorAll("img[data-src-check]").forEach((img) => img.addEventListener("error", () => {
      const box = img.parentElement;
      box.classList.add("todo", "missing");
      box.innerHTML = `<span>Image not found:<br>${esc(img.getAttribute("src"))}</span>`;
    }, { once: true }));
  }

  function mount() {
    const d = stack[stack.length - 1];
    stage.innerHTML = d.slides.map((s, i) => renderSlide(s, i, d)).join("");
    guardImages(stage);
    show(d.k, true);
  }

  function show(k, instant) {
    const d = stack[stack.length - 1];
    d.k = Math.max(0, Math.min(d.slides.length - 1, k));
    stage.querySelectorAll(".slide").forEach((el, i) => {
      el.classList.toggle("on", i === d.k);
      if (instant) el.classList.add("instant"); else el.classList.remove("instant");
    });
    root.querySelector(".deck-count").textContent = `${d.k + 1} / ${d.slides.length}`;
    root.querySelector(".deck-bar .prev").disabled = d.k === 0;
    wake();
  }

  function open(slides, opts = {}) {
    if (!slides || !slides.length) return;
    stack.push({ slides, theme: opts.theme, folder: opts.folder, k: opts.start || 0, onClose: opts.onClose });
    mount();
    root.classList.add("open");
    document.body.classList.add("deck-open");
  }
  function close() {
    const d = stack.pop();
    if (stack.length) mount();
    else { root.classList.remove("open"); document.body.classList.remove("deck-open"); }
    if (d && d.onClose) d.onClose();
  }
  function next() {
    const d = stack[stack.length - 1];
    if (d.k >= d.slides.length - 1) return close();   // past the last slide → back
    show(d.k + 1);
  }
  const prev = () => show(stack[stack.length - 1].k - 1);

  // Controls fade out while presenting; any mouse movement brings them back
  let idle;
  function wake() {
    root.classList.add("awake");
    clearTimeout(idle);
    idle = setTimeout(() => root.classList.remove("awake"), 2200);
  }
  root.addEventListener("pointermove", wake);

  root.addEventListener("click", (e) => {
    if (e.target.closest(".deck-close")) return close();
    if (e.target.closest(".deck-bar .prev")) return prev();
    if (e.target.closest(".deck-bar .next")) return next();
    const act = e.target.closest("[data-action]");
    if (act && act.dataset.action === "goto") return show(+act.dataset.arg);
    if (act && Deck.onAction) Deck.onAction(act.dataset.action, act.dataset.arg);
  });

  // Returns true when the deck used the key
  function handleKey(e) {
    if (!stack.length) return false;
    if (e.key === "Escape") close();
    else if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === "Home") show(0);
    return true;
  }

  window.Deck = { open, close, handleKey, isOpen: () => stack.length > 0, themeOf, imgPath, esc, pad, THEMES, ARROW, onAction: null };
})();
