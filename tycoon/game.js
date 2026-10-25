/* Unicorner Football Tycoon: demo. Everything runs in the browser; progress saves on this device.
   The only network calls are the feedback form and three analytics events (open, wall, feedback). */
(() => {
'use strict';
// demo is tester-only for now: open /tycoon/?tester=on once on a device to see it (and the home card); ?tester=off to hide it again
try {
  const q = new URLSearchParams(location.search).get('tester');
  if (q === 'on') localStorage.setItem('uc-tycoon-tester', '1');
  if (q === 'off') localStorage.removeItem('uc-tycoon-tester');
  if (q) history.replaceState(null, '', location.pathname);
  if (localStorage.getItem('uc-tycoon-tester') !== '1') { location.replace('/'); return; }
} catch { location.replace('/'); return; }
const C = window.TYC_CONTENT;
const SB_URL = 'https://yujhjepukzdahsppntua.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1amhqZXB1a3pkYWhzcHBudHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDMzNDcsImV4cCI6MjEwNTIxOTM0N30.YIOdtL7tJnNLPFPy19QuXe6w3Dcnz6Xedw0tFGdV_CE';
const SAVE_KEY = 'uc-tycoon-demo';
const DEMO_SECONDS = 600; // the wall appears after 10 minutes of play
const $ = id => document.getElementById(id);
const B = Object.fromEntries(C.buildings.map(b => [b.id, b]));

// ---------- state ----------
const fresh = () => ({v: 1, money: 0, earned: 0, lv: {pitch: 1, academy: 0, transfer: 0, shop: 0, stadium: 0}, ups: [], stars: [], sold: 0, play: 0,
  saved: Date.now(), wall: false, feedback: false, taps: 0, academyT: 0, nextEvent: 90, firstStarAt: 25});
let S = fresh();
try { const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (raw && raw.v === 1) S = Object.assign(fresh(), raw, {lv: Object.assign(fresh().lv, raw.lv)}); } catch {}
let EV = null; // the active event: {e, until}
const save = () => { S.saved = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} };

// ---------- economy ----------
const upMult = (b, what) => S.ups.reduce((m, i) => { const u = C.upgrades[i]; return u.b === b && u.what === what ? m * u.mult : m; }, 1);
const starCount = kind => S.stars.filter(s => s.kept && C.stars[s.i].bonus === kind).length;
const starMult = kind => kind === 'tap' ? 2 ** starCount('tap') : 1.5 ** starCount(kind);
const evMult = target => EV && EV.e.target === target ? 1 - EV.e.hit : 1;
const canteen = () => 1 + 0.1 * starCount('canteen');
const cost = b => Math.ceil(B[b].first * B[b].grow ** S.lv[b]);
function academy() {
  const lv = S.lv.academy;
  if (!lv) return {every: Infinity, sale: 0, perSec: 0};
  const every = Math.max(1.5, 20 / (1 + 0.12 * lv) / upMult('academy', 'rate'));
  const sale = 15 * lv ** 1.15 * (1 + 0.03 * S.lv.pitch) * (1 + 0.12 * S.lv.transfer) * upMult('academy', 'sales') * upMult('transfer', 'sales')
    * starMult('sales') * evMult('sales') * canteen();
  return {every, sale, perSec: sale / every};
}
function rates(noEvents) {
  const ev = noEvents ? () => 1 : evMult;
  const r = {
    pitch: S.lv.pitch * B.pitch.rate * upMult('pitch', 'rate') * ev('pitch'),
    transfer: S.lv.transfer * B.transfer.rate * upMult('transfer', 'rate') * starMult('transfer') * ev('transfer'),
    shop: S.lv.shop * B.shop.rate * upMult('shop', 'rate') * starMult('shop') * ev('shop'),
    stadium: S.lv.stadium * B.stadium.rate * upMult('stadium', 'rate') * starMult('tickets') * ev('tickets'),
  };
  for (const k in r) r[k] *= canteen();
  const a = academy();
  r.academy = noEvents && EV && EV.e.target === 'sales' ? a.perSec / (1 - EV.e.hit) : a.perSec;
  r.total = r.pitch + r.transfer + r.shop + r.stadium + r.academy;
  return r;
}
const tapValue = () => Math.max(1, (1 + 0.02 * rates().total) * upMult('pitch', 'tap') * starMult('tap') * evMult('tap'));
function earn(n) { S.money += n; S.earned += n; }

// ---------- formatting ----------
function fmt(n) {
  if (n < 10) return '€' + (Math.round(n * 10) / 10).toString();
  if (n < 1000) return '€' + Math.floor(n);
  const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi']; let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return '€' + (n < 100 ? n.toFixed(n < 10 ? 2 : 1) : Math.floor(n)) + u[i];
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// ---------- analytics (three events per visit at most) ----------
const VISITOR = (() => { try { let v = localStorage.getItem('uc-tycoon-visitor'); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('uc-tycoon-visitor', v); } return v; } catch { return null; } })();
const DAY = new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit'}).format(new Date());
function track(name, data) {
  try {
    fetch(SB_URL + '/rest/v1/events', {method: 'POST', keepalive: true, headers: {apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal'},
      body: JSON.stringify({name, session: VISITOR, visitor: VISITOR, seconds: Math.round(S.play), game_day: DAY, event_version: 2, data: {page: 'tycoon', language: 'en', ...(data || {})}})}).catch(() => {});
  } catch {}
}

// ---------- the district: floating islands in the sky (canvas) ----------
const W = 300, H = 420;
// cx, cy: centre of each island's grass top; w: drawn width. Islands further back (smaller cy) are drawn first.
const ISLES = {
  stadium: {cx: 150, cy: 100, w: 120},
  shop: {cx: 66, cy: 212, w: 100},
  transfer: {cx: 234, cy: 212, w: 100},
  academy: {cx: 74, cy: 326, w: 106},
  pitch: {cx: 226, cy: 326, w: 112},
};
const BRIDGES = [['pitch', 'academy'], ['academy', 'shop'], ['shop', 'stadium'], ['stadium', 'transfer'], ['transfer', 'pitch']];
const TARGET_PLOT = {tap: 'pitch', pitch: 'pitch', sales: 'academy', transfer: 'transfer', shop: 'shop', tickets: 'stadium'};
const stageOf = b => S.lv[b] ? C.stages.filter(t => S.lv[b] >= t).length : 0;
const cv = $('map'), ctx = cv.getContext('2d'), mid = $('stage'), mapFloats = $('mapFloats');
let K = 2;
function resize() {
  const r = mid.getBoundingClientRect(), s = Math.min(r.width / W, r.height / H);
  const cw = Math.floor(W * s), ch = Math.floor(H * s);
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  Object.assign(mapFloats.style, {width: cw + 'px', height: ch + 'px', left: (r.width - cw) / 2 + 'px', top: (r.height - ch) / 2 + 'px'});
  K = Math.max(1, Math.ceil(s * (window.devicePixelRatio || 1)));
  cv.width = W * K; cv.height = H * K; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
}
// art from tycoon/art/ (listed in content.js); anything missing falls back to a simple drawing
const ART = {};
function loadArt() { for (const f of C.art || []) { const img = new Image(); img.onload = () => { ART[f.replace(/\.\w+$/, '')] = img; }; img.src = 'art/' + f; } }
const art = name => ART[name];
const INK = '#1a1030';
const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function text(s, x, y, size, c) { ctx.font = `${size}px Silkscreen, monospace`; ctx.textAlign = 'center'; ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.strokeText(s, x, y); ctx.fillStyle = c; ctx.fillText(s, x, y); }
// island name tags: an ink plate so they stay readable over art and sky
function label(s, x, y) {
  ctx.font = '6px Silkscreen, monospace'; const w = ctx.measureText(s).width + 8;
  R(Math.round(x - w / 2), y - 7, Math.round(w), 10, INK); ctx.textAlign = 'center'; ctx.fillStyle = '#fbf3dc'; ctx.fillText(s, x, y);
}

// clouds drifting behind the islands
const clouds = Array.from({length: 7}, (_, i) => ({x: Math.random() * W, y: 10 + i * 50 + Math.random() * 20, s: 0.6 + Math.random() * 0.8, v: 3 + Math.random() * 5}));
function drawCloud(c) {
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  const u = 6 * c.s;
  ctx.fillRect(c.x, c.y, u * 6, u * 1.5); ctx.fillRect(c.x + u, c.y - u, u * 3, u); ctx.fillRect(c.x + u * 2.5, c.y - u * 1.8, u * 2, u);
}
function drawBridge(a, b, t) {
  const A = ISLES[a], B2 = ISLES[b], dx = B2.cx - A.cx, dy = B2.cy - A.cy, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy * 4, ny = ux * 4;
  const sag = 6;
  for (let d = 0; d <= len; d += 5) {
    const k = d / len, x = A.cx + dx * k, y = A.cy + dy * k + Math.sin(k * Math.PI) * sag + 8;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x - nx - 0.5, y - ny - 0.5); ctx.lineTo(x + nx + 0.5, y + ny + 0.5); ctx.lineTo(x + nx + ux * 4.5, y + ny + uy * 4.5 + 1); ctx.lineTo(x - nx + ux * 4.5, y - ny + uy * 4.5 + 1); ctx.fill();
    ctx.fillStyle = (d / 5) % 2 ? '#b07a43' : '#c48a4f'; ctx.beginPath(); ctx.moveTo(x - nx, y - ny); ctx.lineTo(x + nx, y + ny); ctx.lineTo(x + nx + ux * 4, y + ny + uy * 4); ctx.lineTo(x - nx + ux * 4, y - ny + uy * 4); ctx.fill();
  }
}
// the point on a bridge where walkers stand (same curve as the planks)
function bridgePoint(a, b, k) {
  const A = ISLES[a], B2 = ISLES[b];
  return {x: A.cx + (B2.cx - A.cx) * k, y: A.cy + (B2.cy - A.cy) * k + Math.sin(k * Math.PI) * 6 + 10};
}
// an empty floating island with a "for sale" sign
function drawEmpty(I) {
  const w = I.w * 0.78, h = w * 0.46, x = I.cx, y = I.cy + 6;
  ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x, y + h / 2); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + 12); ctx.lineTo(x, y + h / 2 + 12); ctx.lineTo(x - w / 2, y + 12); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#6fbf5a'; ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x + w / 2, y); ctx.lineTo(x, y + h / 2); ctx.lineTo(x - w / 2, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#a77b46'; ctx.beginPath(); ctx.moveTo(x, y - h / 4); ctx.lineTo(x + w / 4, y); ctx.lineTo(x, y + h / 4); ctx.lineTo(x - w / 4, y); ctx.closePath(); ctx.fill();
  R(x - 1, y - 18, 3, 16, INK); R(x - 17, y - 30, 34, 15, INK); R(x - 16, y - 29, 32, 13, '#fbf3dc');
  ctx.font = '5px Silkscreen, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText('FOR', x, y - 23.5); ctx.fillStyle = '#e3262f'; ctx.fillText('SALE', x, y - 17.5);
  return {x: x - w / 2, y: y - 32, w, h: h / 2 + 46};
}
const hitBox = {};
function drawIsland(b, t) {
  const I = ISLES[b], st = stageOf(b), img = st && art(`building-${b}-${st}`);
  if (!img) { hitBox[b] = drawEmpty(I); return; }
  const w = I.w, h = img.height * w / img.width, bottom = I.cy + w * 0.3 + Math.sin(t * 0.8 + I.cx) * 1.2;
  ctx.drawImage(img, I.cx - w / 2, bottom - h, w, h);
  hitBox[b] = {x: I.cx - w / 2, y: bottom - h, w, h};
}
// characters: ChatGPT sprites moved, bobbed and flipped in code
function sprite(name, x, y, h, t, opts = {}) {
  const img = art(name); if (!img) return;
  const w = img.width * h / img.height, walk = opts.walk ? Math.abs(Math.sin(t * 10 + x)) * 1.6 : Math.sin(t * 2.4 + x) * 0.6;
  ctx.save(); ctx.translate(x, y - walk);
  if (opts.walk) ctx.rotate(Math.sin(t * 10 + x) * 0.06);
  if (opts.flip) ctx.scale(-1, 1);
  ctx.fillStyle = 'rgba(26,16,48,.22)'; ctx.beginPath(); ctx.ellipse(0, walk, w * 0.32, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
}
const walkers = [];
function stepWalkers(dt) {
  const want = S.lv.stadium ? Math.min(10, 2 + S.lv.stadium) : 0;
  if (walkers.length < want && Math.random() < dt * 1.2) {
    const from = Math.random() < 0.5 ? 'shop' : 'transfer';
    walkers.push({a: from, b: 'stadium', k: 0, v: 0.12 + Math.random() * 0.08});
  }
  for (let i = walkers.length - 1; i >= 0; i--) { walkers[i].k += walkers[i].v * dt; if (walkers[i].k >= 1) walkers.splice(i, 1); }
}
function drawPeople(t) {
  const list = [];
  for (const w of walkers) { const p = bridgePoint(w.a, w.b, w.k); list.push({y: p.y, f: () => sprite('char-fan', p.x, p.y, 17, t, {walk: true, flip: ISLES[w.b].cx < ISLES[w.a].cx})}); }
  if (S.lv.academy) {
    const I = ISLES.academy, kids = Math.min(3, Math.ceil(S.lv.academy / 6));
    for (let i = 0; i < kids; i++) { const s = Math.sin(t * 0.9 + i * 2.1), x = I.cx - 22 + i * 18 + s * 10, y = I.cy + 14 + i * 3; list.push({y, f: () => sprite('char-youth', x, y, 15, t, {walk: true, flip: Math.cos(t * 0.9 + i * 2.1) < 0})}); }
  }
  if (S.lv.pitch >= 5) { const I = ISLES.pitch; list.push({y: I.cy + 22, f: () => sprite('char-coach', I.cx + 30, I.cy + 22, 16, t, {flip: Math.sin(t * 0.4) > 0})}); }
  if (S.lv.transfer) {
    const I = ISLES.transfer, n = EV && EV.e.target === 'transfer' ? 5 : 1;
    for (let i = 0; i < n; i++) { const x = I.cx - 26 + i * 12 + Math.sin(t * 1.3 + i) * 6, y = I.cy + 20 + (i % 2) * 4; list.push({y, f: () => sprite('char-agent', x, y, 16, t, {walk: n > 1, flip: Math.cos(t * 1.3 + i) < 0})}); }
  }
  if (S.lv.shop >= 10) { // the mascot wanders the bridges
    const e = BRIDGES[Math.floor(t / 9) % BRIDGES.length], k = (t % 9) / 9, p = bridgePoint(e[0], e[1], k);
    list.push({y: p.y, f: () => sprite('char-mascot', p.x, p.y, 18, t, {walk: true, flip: ISLES[e[1]].cx < ISLES[e[0]].cx})});
  }
  list.sort((a, b) => a.y - b.y).forEach(o => o.f());
}
const PROP = {plague: 'event-plague-cloud', airport: 'event-plane', haalunch: 'event-sold-out-sign', misprint: 'event-misprint-shirts', mascot: 'event-banana'};
function eventProp(e) { const t = e.title.toLowerCase(); return e.prop || (t.includes('plague') ? PROP.plague : t.includes('airport') ? PROP.airport : t.includes('haalunch') ? PROP.haalunch : t.includes('misprint') ? PROP.misprint : t.includes('mascot') ? PROP.mascot : null); }
function drawEvent(t) {
  if (!EV) return;
  const b = TARGET_PLOT[EV.e.target], hb = hitBox[b], I = ISLES[b]; if (!hb) return;
  const prop = eventProp(EV.e), img = prop && art(prop), y = hb.y - 4 + Math.sin(t * 3) * 3;
  if (prop === PROP.airport && img) { const x = ((t * 40) % (W + 120)) - 60; ctx.drawImage(img, x - 30, I.cy - 70 + Math.sin(t * 2) * 4, 60, 60 * img.height / img.width); }
  else if (img) { const w = 44, h = w * img.height / img.width; ctx.drawImage(img, I.cx - w / 2, y - h + 10, w, h); }
  const on = Math.sin(t * 8) > 0; R(I.cx + I.w / 2 - 18, hb.y + 4, 14, 16, INK); R(I.cx + I.w / 2 - 17, hb.y + 5, 12, 14, on ? '#e3262f' : '#ff6b6b'); text('!', I.cx + I.w / 2 - 11, hb.y + 16, 10, '#fff');
}
function draw(t, dt) {
  ctx.setTransform(K, 0, 0, K, 0, 0); ctx.clearRect(0, 0, W, H);
  for (const c of clouds) { c.x += c.v * dt; if (c.x > W + 10) { c.x = -60; c.y = 10 + Math.random() * (H - 30); } drawCloud(c); }
  for (const [a, b] of BRIDGES) if (S.lv[a] || S.lv[b]) drawBridge(a, b, t);
  const order = Object.keys(ISLES).sort((a, b) => ISLES[a].cy - ISLES[b].cy);
  for (const b of order) drawIsland(b, t);
  drawPeople(t);
  for (const b of order) label(B[b].name.toUpperCase() + (S.lv[b] ? ' · ' + S.lv[b] : ''), ISLES[b].cx, ISLES[b].cy + ISLES[b].w * 0.3 + 9);
  drawEvent(t);
}

// ---------- floats, coins and the news ticker ----------
function floatText(s, xPct, yPct, big, layer) {
  const el = document.createElement('div'); el.className = 'float' + (big ? ' big' : ''); el.textContent = s;
  el.style.left = xPct + '%'; el.style.top = yPct + '%'; (layer || mapFloats).appendChild(el); setTimeout(() => el.remove(), 950);
}
const plotPct = b => { const I = ISLES[b]; return [I.cx / W * 100, (I.cy - I.w * 0.2) / H * 100]; };
let tickerT = 0;
function ticker(s) { $('tickerText').textContent = s; tickerT = 9; }
function news() {
  const pool = [...C.tapLines.map(l => l.replace('+{m} ', '')), ...C.clubs.map(c => `${c.name}: ${c.line}`), ...C.stars.map(s => `${s.name} ${s.trait[0].toLowerCase()}${s.trait.slice(1)}`)];
  ticker(pool[Math.random() * pool.length | 0]);
}

// ---------- tapping: the keepy-uppies player (left) and the islands (map) ----------
const kicker = $('kicker'), kickImg = kicker.querySelector('img'), ball = $('ball'), kickFloats = $('floats');
kicker.addEventListener('pointerdown', e => {
  if (S.wall) return;
  e.preventDefault();
  const v = tapValue(); earn(v); S.taps++;
  const r = kickFloats.getBoundingClientRect();
  floatText('+' + fmt(v), (e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100, false, kickFloats);
  kickImg.animate([{transform: 'translateX(-50%) scale(1,1)'}, {transform: 'translateX(-50%) scale(1.06,.92)'}, {transform: 'translateX(-50%) scale(.97,1.04)'}, {transform: 'translateX(-50%) scale(1,1)'}], {duration: 260, easing: 'ease-out'});
  ball.animate([{transform: 'translateY(0)'}, {transform: 'translateY(-420%) rotate(240deg)', offset: .45}, {transform: 'translateY(0) rotate(360deg)'}], {duration: 520, easing: 'cubic-bezier(.33,0,.67,1)'});
  for (let i = 0; i < 3; i++) {
    const c = document.createElement('span'); c.className = 'coin'; c.style.left = (e.clientX - r.left) + 'px'; c.style.top = (e.clientY - r.top) + 'px'; kickFloats.appendChild(c);
    const dx = (Math.random() - 0.5) * 90, dy = -40 - Math.random() * 40;
    c.animate([{transform: 'translate(-50%,-50%)', opacity: 1}, {transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, opacity: 1, offset: .4}, {transform: `translate(calc(-50% + ${dx * 1.4}px), calc(-50% + ${dy + 90}px))`, opacity: 0}], {duration: 700, easing: 'ease-out'}).onfinish = () => c.remove();
  }
  if (S.taps % 9 === 1) ticker(C.tapLines[(S.taps / 9 | 0) % C.tapLines.length].replace('{m}', fmt(v)));
  paintBank();
});
cv.addEventListener('pointerdown', e => {
  if (S.wall) return;
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  const inside = b => { const h = hitBox[b]; return h && x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h; };
  if (EV && inside(TARGET_PLOT[EV.e.target])) return openEvent();
  const hit = Object.keys(ISLES).sort((a, b) => ISLES[b].cy - ISLES[a].cy).find(inside);
  if (hit) { tab = 'club'; renderPanel(hit); }
});

// ---------- the panel ----------
let tab = 'club';
const panel = $('panel');
document.querySelectorAll('.tabs button').forEach(btn => btn.onclick = () => { tab = btn.dataset.tab; renderPanel(); });
function availableUps() { return C.upgrades.map((u, i) => ({u, i})).filter(({u, i}) => !S.ups.includes(i) && S.lv[u.b] >= u.unlock); }
function renderPanel(focus) {
  document.querySelectorAll('.tabs button').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  const r = rates();
  if (tab === 'club') {
    panel.innerHTML = C.buildings.map(b => {
      const lv = S.lv[b.id], c = cost(b.id);
      const earnLine = b.id === 'academy' ? (lv ? `Sells a player every ${academy().every.toFixed(1)} s for ${fmt(academy().sale)}` : '') : (lv ? `Earning ${fmt(r[b.id])} per second` : '');
      const th = `art/building-${b.id}-${Math.max(1, stageOf(b.id))}.webp`;
      return `<div class="row" id="row-${b.id}"><img class="thumb" src="${th}" alt="" style="${lv ? '' : 'filter:grayscale(1);opacity:.55'}"><div><h3>${esc(b.name)}<small>${lv ? 'LEVEL ' + lv : 'NOT BUILT'}</small></h3><p>${esc(b.blurb)}</p>${earnLine ? `<div class="earn">${earnLine}</div>` : ''}</div>
        <button type="button" class="buy" data-buy="${b.id}" data-cost="${c}">${lv ? 'Upgrade' : 'Build'}<br>${fmt(c)}</button></div>`;
    }).join('');
    if (focus) { const row = $('row-' + focus); if (row) { row.scrollIntoView({block: 'nearest', behavior: 'smooth'}); row.animate([{background: '#fff3b0'}, {background: '#fff'}], {duration: 900}); } }
  } else if (tab === 'upgrades') {
    const list = availableUps().sort((a, b) => a.u.cost - b.u.cost);
    panel.innerHTML = list.length ? list.map(({u, i}) => `<div class="row"><img class="thumb" src="art/building-${u.b}-${Math.max(1, stageOf(u.b))}.webp" alt=""><div><h3>${esc(u.name)}</h3><p>${esc(B[u.b].name)}: ${u.what === 'tap' ? 'tap money' : u.what === 'sales' ? 'player sale prices' : 'income'} ${u.mult >= 2 ? 'x' + u.mult : '+' + Math.round((u.mult - 1) * 100) + '%'}</p><p><i>${esc(u.joke)}</i></p></div>
      <button type="button" class="buy" data-up="${i}" data-cost="${u.cost}">Buy<br>${fmt(u.cost)}</button></div>`).join('')
      : '<p class="empty">No upgrades right now. Level up your buildings to unlock more.</p>';
  } else {
    const kept = S.stars.filter(s => s.kept);
    panel.innerHTML = kept.length ? kept.map(s => { const st = C.stars[s.i]; return `<div class="row">${portrait(st)}<div><h3>${esc(st.name)}</h3><p>${esc(st.trait)}</p><div class="earn">${bonusText(st.bonus)}</div></div>
      <button type="button" class="buy sell" data-sell="${s.i}" data-cost="0">Sell<br>${fmt(starPrice())}</button></div>`; }).join('')
      : '<p class="empty">Your academy finds a star now and then. Keep them for a bonus, or sell them for a fortune.</p>';
  }
  refreshButtons();
}
function portrait(st, hero) {
  const img = st.art && art(st.art);
  return img ? `<img class="${hero ? 'hero' : 'portrait'}" src="${img.src}" alt="">` : hero ? '' : `<span class="portrait init">${esc(st.name[0])}</span>`;
}
function bonusText(k) { return {tap: 'Tap money x2', tickets: 'Ticket income +50%', shop: 'Shop sales +50%', sales: 'Player sale prices +50%', transfer: 'Transfer office +50%', canteen: 'Everything +10% (keeps the canteen busy)'}[k]; }
function refreshButtons() {
  panel.querySelectorAll('[data-cost]').forEach(b => { b.disabled = S.money < +b.dataset.cost; });
  const n = availableUps().filter(({u}) => S.money >= u.cost).length;
  $('upCount').textContent = n || ''; $('starCount').textContent = S.stars.filter(s => s.kept).length || '';
}
panel.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled || S.wall) return;
  if (b.dataset.buy) { const id = b.dataset.buy, c = cost(id); if (S.money < c) return; S.money -= c; S.lv[id]++; const [x, y] = plotPct(id); floatText(S.lv[id] === 1 ? 'BUILT!' : 'LEVEL ' + S.lv[id], x, y, true); if (C.stages.includes(S.lv[id])) ticker(`${B[id].name} looks bigger and shinier!`); }
  else if (b.dataset.up) { const i = +b.dataset.up, u = C.upgrades[i]; if (S.money < u.cost || S.ups.includes(i)) return; S.money -= u.cost; S.ups.push(i); ticker(`${u.name}: ${u.joke}`); }
  else if (b.dataset.sell) { const i = +b.dataset.sell, s = S.stars.find(x => x.i === i && x.kept); if (!s) return; const p = starPrice(); s.kept = false; earn(p); ticker(`${C.stars[i].name} sold to ${club().name} for ${fmt(p)}.`); }
  save(); paintBank(); renderPanel();
});

// ---------- academy sales and stars ----------
const club = () => C.clubs[Math.random() * C.clubs.length | 0];
const starPrice = () => Math.max(2000, rates().total * 150);
function academyTick(dt) {
  const a = academy(); if (!S.lv.academy) return;
  S.academyT += dt;
  while (S.academyT >= a.every) {
    S.academyT -= a.every; earn(a.sale); S.sold++;
    const [x, y] = plotPct('academy'); floatText('+' + fmt(a.sale), x, y);
    if (S.sold % 7 === 1) { const c = club(); ticker(`Academy player sold to ${c.name}. ${c.line}`); }
    const left = C.stars.map((s, i) => i).filter(i => !S.stars.some(s => s.i === i));
    if (left.length && S.lv.academy >= 3 && (S.sold >= S.firstStarAt && !S.stars.length || Math.random() < 0.025)) {
      const i = left[Math.random() * left.length | 0]; S.stars.push({i, kept: false}); return foundStar(i);
    }
  }
}
function foundStar(i) {
  const st = C.stars[i], p = starPrice(), c = club();
  modal(`${portrait(st, true)}<span class="tag gold">WONDERKID!</span><h2>${esc(st.name)}</h2><p>${esc(st.trait)}</p>
    <div class="choices"><button type="button" class="buy" data-act="keep">Keep him<span>${bonusText(st.bonus)}</span></button>
    <button type="button" class="buy sell" data-act="sell">Sell to ${esc(c.name)} for ${fmt(p)}<span>${esc(c.line)}</span></button></div>`, act => {
    const s = S.stars.find(x => x.i === i);
    if (act === 'keep') { s.kept = true; ticker(`${st.name} joins the club. ${bonusText(st.bonus)}.`); }
    else { earn(p); ticker(`${st.name} sold to ${c.name} for ${fmt(p)}.`); }
    save(); renderPanel();
  });
}

// ---------- events ----------
function eventTick(dt) {
  if (EV) { if (performance.now() > EV.until) { ticker(`${EV.e.title}: it sorted itself out.`); EV = null; $('eventBadge').hidden = true; } return; }
  if (S.lv.academy < 1) return;
  S.nextEvent -= dt;
  if (S.nextEvent <= 0) {
    const pool = C.events.filter(e => S.lv[TARGET_PLOT[e.target]] > 0);
    const e = pool[Math.random() * pool.length | 0];
    EV = {e, until: performance.now() + 75000};
    S.nextEvent = 70 + Math.random() * 60;
    const b = $('eventBadge'); b.textContent = '⚠ ' + e.title + ' · tap to fix'; b.hidden = false;
    ticker(e.see);
  }
}
$('eventBadge').onclick = () => openEvent();
function openEvent() {
  if (!EV) return;
  const e = EV.e, r = rates(true).total, fixCost = Math.max(20, Math.round(r * 20)), payout = Math.max(15, Math.round(r * 12));
  const what = {tap: 'tap money', pitch: 'training income', sales: 'player sale prices', transfer: 'transfer income', shop: 'shop sales', tickets: 'ticket income'}[e.target];
  modal(`<span class="tag">PROBLEM</span><h2>${esc(e.title)}</h2><p>${esc(e.see)} ${what[0].toUpperCase() + what.slice(1)} -${Math.round(e.hit * 100)}% until it's sorted.</p>
    <div class="choices"><button type="button" class="buy" data-act="fix" ${S.money < fixCost ? 'disabled' : ''}>${esc(e.fix)}<span>Costs ${fmt(fixCost)}. Back to normal now.</span></button>
    <button type="button" class="buy sell" data-act="trade">${esc(e.trade)}<span>Earn ${fmt(payout)} and move on.</span></button>
    <button type="button" class="buy" style="background:#fff" data-act="wait">Ignore it<span>It sorts itself out in a minute.</span></button></div>`, act => {
    if (act === 'fix') { if (S.money < fixCost) return; S.money -= fixCost; ticker(`${e.fix}. Sorted!`); end(); }
    else if (act === 'trade') { earn(payout); ticker(`${e.trade}: +${fmt(payout)}`); end(); }
  });
  function end() { EV = null; $('eventBadge').hidden = true; save(); }
}

// ---------- modal ----------
const modalEl = $('modal'), sheet = $('sheet');
let modalCb = null;
function modal(html, cb, locked) {
  sheet.innerHTML = html; modalEl.hidden = false; modalCb = cb || null; modalEl.dataset.locked = locked ? '1' : '';
  const f = sheet.querySelector('button:not([disabled]),input'); if (f) f.focus({preventScroll: true});
}
function closeModal() { modalEl.hidden = true; sheet.innerHTML = ''; modalCb = null; }
sheet.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; const cb = modalCb; closeModal(); if (cb) cb(b.dataset.act); paintBank(); });
modalEl.addEventListener('click', e => { if (e.target === modalEl && !modalEl.dataset.locked) closeModal(); });

// ---------- offline earnings ----------
function offline() {
  const away = (Date.now() - S.saved) / 1000;
  if (away < 30 || S.wall) return;
  const gain = away * rates(true).total;
  if (gain < 1) return;
  modal('<h2>Welcome back, chairman</h2><p>Calculating offline earnings...</p><div class="dots">⚽ ⚽ ⚽</div>', null, true);
  setTimeout(() => {
    earn(gain); save();
    const h = Math.floor(away / 3600), m = Math.floor(away % 3600 / 60);
    modal(`<h2>Welcome back, chairman</h2><p>While you were away for ${h ? h + ' h ' : ''}${m} min, the club kept earning.</p><div class="big-money">+${fmt(gain)}</div>
      <div class="choices"><button type="button" class="buy" data-act="ok">Back to work</button></div>`);
  }, 1200);
}

// ---------- the 10-minute wall ----------
function wall() {
  S.wall = true; save(); track('tycoon_wall', {earned: Math.round(S.earned)});
  if (S.feedback) return thanks();
  let rating = 0;
  modal(`<span class="tag gold">DEMO OVER</span><h2>We're still building the full game!</h2>
    <p>Thanks for playing. Help us shape Unicorner Football Tycoon: how did it feel?</p>
    <label>Rate the demo, 1 to 10</label><div class="rate10" id="r10">${Array.from({length: 10}, (_, i) => `<button type="button" data-r="${i + 1}">${i + 1}</button>`).join('')}</div>
    <label for="fb-c">Anything to tell us? (optional)</label><textarea id="fb-c" maxlength="1000" placeholder="What was fun, what was boring, what should we add?"></textarea>
    <label for="fb-e">Email me when it's ready (optional)</label><input type="email" id="fb-e" placeholder="you@example.com" autocomplete="email">
    <p class="note">We'll only use your email to tell you the full game is out. No newsletter.</p>
    <div class="choices"><button type="button" class="buy" id="fb-send" disabled>Send</button></div>
    <p class="note" id="fb-msg"></p>`, null, true);
  sheet.querySelector('#r10').onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; rating = +b.dataset.r; sheet.querySelectorAll('#r10 button').forEach(x => x.classList.toggle('on', x === b)); sheet.querySelector('#fb-send').disabled = false; };
  sheet.querySelector('#fb-send').onclick = async () => {
    const comment = sheet.querySelector('#fb-c').value.trim().slice(0, 1000), email = sheet.querySelector('#fb-e').value.trim().slice(0, 200);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { sheet.querySelector('#fb-msg').textContent = 'That email doesn\'t look right.'; return; }
    sheet.querySelector('#fb-send').disabled = true;
    try {
      await fetch(SB_URL + '/rest/v1/rpc/tycoon_feedback_submit', {method: 'POST', headers: {apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json'},
        body: JSON.stringify({p_rating: rating, p_comment: comment || null, p_email: email || null, p_visitor: VISITOR, p_seconds: Math.round(S.play), p_earned: Math.round(S.earned)})});
    } catch {}
    track('tycoon_feedback', {rating, notify: !!email});
    S.feedback = true; save(); thanks();
  };
}
function thanks() {
  modal(`<h2>Thank you!</h2><p>Your club is saved on this device. When the full game is ready, you'll be first in.</p>
    <p>Total earned: <b>${fmt(S.earned)}</b></p><div class="choices"><a class="buy" href="/" style="text-align:center;text-decoration:none;color:inherit">Back to Unicorner</a></div>`, null, true);
}

// ---------- loop ----------
function paintBank() { $('money').textContent = fmt(S.money); $('rate').textContent = fmt(rates().total) + ' per second'; }
let last = performance.now(), uiT = 0, saveT = 0;
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  const t = now / 1000;
  if (!S.wall) {
    earn((rates().total - academy().perSec) * dt);
    academyTick(dt); eventTick(dt); stepWalkers(dt);
    if (!document.hidden) S.play += dt;
    if (S.play >= DEMO_SECONDS && modalEl.hidden) wall();
  }
  draw(t, dt);
  uiT += dt; if (uiT > 0.2) { uiT = 0; paintBank(); refreshButtons(); }
  saveT += dt; if (saveT > 5) { saveT = 0; save(); }
  tickerT -= dt; if (tickerT < 0) news();
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else { last = performance.now(); offline(); } });
window.addEventListener('pagehide', save);
window.addEventListener('resize', resize);
if (window.ResizeObserver) new ResizeObserver(resize).observe(mid);

resize(); loadArt(); renderPanel(); paintBank();
if (S.wall) (S.feedback ? thanks : wall)();
else offline();
track('tycoon_open', {returning: S.earned > 0});
requestAnimationFrame(frame);
})();
