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
const DEMO_SECONDS = 1020; // the wall appears after 17 minutes of play
const $ = id => document.getElementById(id);
const B = Object.fromEntries(C.buildings.map(b => [b.id, b]));

// ---------- state ----------
const fresh = () => ({v: 5, club: 'Unicorner FC', money: 0, earned: 0, lv: {boots: 0, pitch: 0, academy: 0, transfer: 0, shop: 0, stadium: 0}, ups: [], stars: [], sold: 0, play: 0,
  saved: Date.now(), wall: false, feedback: false, taps: 0, academyT: 0, nextEvent: 90, firstStarAt: 25});
let S = fresh();
try { const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (raw && raw.v === 5) S = Object.assign(fresh(), raw, {lv: Object.assign(fresh().lv, raw.lv)}); } catch {}
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
  const every = Math.max(2.5, 20 / (1 + 0.08 * lv) / upMult('academy', 'rate'));
  const sale = 15 * lv ** 1.05 * (1 + 0.03 * S.lv.pitch) * (1 + 0.08 * S.lv.transfer) * upMult('academy', 'sales') * upMult('transfer', 'sales')
    * starMult('sales') * evMult('sales') * canteen();
  return {every, sale, perSec: sale / every};
}
function rates(noEvents) {
  const ev = noEvents ? () => 1 : evMult;
  const r = {
    boots: S.lv.boots * B.boots.rate * upMult('boots', 'rate') * ev('tap'),
    pitch: S.lv.pitch * B.pitch.rate * upMult('pitch', 'rate') * ev('pitch'),
    transfer: S.lv.transfer * B.transfer.rate * upMult('transfer', 'rate') * starMult('transfer') * ev('transfer'),
    shop: S.lv.shop * B.shop.rate * upMult('shop', 'rate') * starMult('shop') * ev('shop'),
    stadium: S.lv.stadium * B.stadium.rate * upMult('stadium', 'rate') * starMult('tickets') * ev('tickets'),
  };
  for (const k in r) r[k] *= canteen();
  const a = academy();
  r.academy = noEvents && EV && EV.e.target === 'sales' ? a.perSec / (1 - EV.e.hit) : a.perSec;
  r.total = r.boots + r.pitch + r.transfer + r.shop + r.stadium + r.academy;
  return r;
}
const tapValue = () => Math.max(1, (1 + 0.01 * rates().total) * upMult('pitch', 'tap') * starMult('tap') * evMult('tap'));
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

// ---------- the club grounds: one isometric field with roads and plots (canvas) ----------
// World coordinates are (u, v) grid units; P() turns them into pixels. Plots are 4x4 units with 3-unit roads between them.
// RAT matches the camera angle of the stadium art (a little flatter than a 2:1 diamond)
const W = 320, H = 245, A = 14, RAT = 0.405, X0 = 160, Y0 = 62;
const P = (u, v) => [X0 + (u - v) * A, Y0 + (u + v) * A * RAT];
// u0, v0: the plot's back corner. door: where people arrive, on a road next to it.
const LOTS = {
  stadium: {u0: -3, v0: -3, n: 7, door: [2, 5.5]}, // the stadium gets a bigger plot that reaches back past the roads
  shop: {u0: 0, v0: 7, door: [5.5, 9]},
  transfer: {u0: 7, v0: 0, door: [9, 5.5]},
  pitch: {u0: 7, v0: 7, door: [12.5, 9]},
  academy: {u0: 7, v0: 14, door: [12.5, 16]},
};
const ROADS = [5.5, 12.5], EDGE = [-8, 26];
const LOCKED = [[-9, -1], [-1, -9], [-9, -9], [20, 20], [21, 13], [13, 21]]; // plots of the full game's bigger map
const TARGET_PLOT = {tap: 'pitch', pitch: 'pitch', sales: 'academy', transfer: 'transfer', shop: 'shop', tickets: 'stadium'};
const stageOf = b => S.lv[b] ? C.stages.filter(t => S.lv[b] >= t).length : 0;
const size = b => LOTS[b].n || 4;
const lotCentre = b => { const L = LOTS[b], n = size(b); return P(L.u0 + n / 2, L.v0 + n / 2); };
const lotFront = b => { const L = LOTS[b], n = size(b); return P(L.u0 + n, L.v0 + n); };

const cv = $('map'), ctx = cv.getContext('2d'), mid = $('stage'), mapFloats = $('mapFloats');
let K = 2, SC = 1, OX = 0, OY = 0, CW = 1, CH = 1;
const ground = document.createElement('canvas'), gctx = ground.getContext('2d');
function resize() {
  const r = mid.getBoundingClientRect(); if (!r.width || !r.height) return;
  CW = r.width; CH = r.height; SC = Math.min(CW / W, CH / H); OX = (CW - W * SC) / 2; OY = (CH - H * SC) / 2;
  const dpr = window.devicePixelRatio || 1; K = dpr;
  cv.style.width = CW + 'px'; cv.style.height = CH + 'px'; cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr);
  Object.assign(mapFloats.style, {width: W * SC + 'px', height: H * SC + 'px', left: OX + 'px', top: OY + 'px'});
  ground.width = cv.width; ground.height = cv.height; paintGround();
}
const toWorld = c => c.setTransform(K * SC, 0, 0, K * SC, K * OX, K * OY);
const visible = () => [-OX / SC, -OY / SC, CW / SC, CH / SC]; // x, y, w, h of the world that is on screen

// art from tycoon/art/ (listed in content.js)
const ART = {};
function loadArt() { for (const f of C.art || []) { const img = new Image(); img.onload = () => { ART[f.replace(/\.\w+$/, '')] = img; paintGround(); }; img.src = 'art/' + f; } }
const art = name => ART[name];
const INK = '#1a1030';
const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
function text(s, x, y, size, c) { ctx.font = `${size}px Silkscreen, monospace`; ctx.textAlign = 'center'; ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.strokeText(s, x, y); ctx.fillStyle = c; ctx.fillText(s, x, y); }
function label(s, x, y) {
  ctx.font = '6px Silkscreen, monospace'; const w = ctx.measureText(s).width + 8;
  R(Math.round(x - w / 2), y - 7, Math.round(w), 10, INK); ctx.textAlign = 'center'; ctx.fillStyle = '#fbf3dc'; ctx.fillText(s, x, y);
}
// a filled iso rectangle from (u0, v0) to (u1, v1)
function quad(c, u0, v0, u1, v1, fill) {
  c.beginPath(); for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]) c.lineTo(...P(u, v)); c.closePath(); c.fillStyle = fill; c.fill();
}
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
// a 4x4 ground piece of art sitting on its plot; false when the art hasn't loaded
function piece(c, name, u0, v0, n = 4) {
  const img = art(name); if (!img) return false;
  const w = 2 * n * A, h = img.height * w / img.width, [x] = P(u0 + n / 2, v0 + n / 2), [, y] = P(u0 + n, v0 + n);
  c.drawImage(img, x - w / 2, y + 1 - h, w, h); return true;
}
// something standing on the ground at (u, v), h world pixels tall
function stand(c, name, u, v, h) {
  const img = art(name); if (!img) return;
  const [x, y] = P(u, v), w = img.width * h / img.height;
  c.fillStyle = 'rgba(20,40,10,.25)'; c.beginPath(); c.ellipse(x + 1, y, Math.max(3, w * 0.45), 1.6, 0, 0, Math.PI * 2); c.fill();
  c.drawImage(img, x - w / 2, y - h, w, h);
}
function tree(c, u, v, s = 1) {
  const pick = hash(u * 3.1, v * 1.7), kind = pick < 0.45 ? 1 : pick < 0.75 ? 3 : 2;
  if (art(`tree-${kind}`)) return stand(c, `tree-${kind}`, u, v, (kind === 2 ? 30 : kind === 3 ? 26 : 22) * s);
  const [x, y] = P(u, v);
  c.fillStyle = 'rgba(20,40,10,.25)'; c.beginPath(); c.ellipse(x + 2, y, 7 * s, 3.2 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#5b3a1e'; c.fillRect(x - 1, y - 6 * s, 2.4, 6 * s);
  c.fillStyle = '#1f4a1c'; c.beginPath(); c.arc(x, y - 11 * s, 7.4 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2f7a2a'; c.beginPath(); c.arc(x - 0.6, y - 11.6 * s, 6.2 * s, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#4fa03a'; c.beginPath(); c.arc(x - 2.2 * s, y - 13.6 * s, 3 * s, 0, Math.PI * 2); c.fill();
}

// everything that never moves: grass, roads, the pond, the trees. Painted once per resize.
function paintGround() {
  const c = gctx; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, ground.width, ground.height); toWorld(c);
  const [vx, vy, vw, vh] = visible();
  c.fillStyle = '#5f9531'; c.fillRect(vx, vy, vw, vh);
  const grass = art('ground-grass');
  if (grass) { // ChatGPT's mown grass tile, one per 8x8 units and faded into the base colour so the stripes stay calm
    const T = 8, w = 2 * T * A + 1, h = 2 * T * A * RAT + 1; c.globalAlpha = 0.45;
    for (let u = -48; u < 64; u += T) for (let v = -48; v < 64; v += T) {
      const [x, y] = P(u + T / 2, v + T / 2); if (x < vx - w || x > vx + vw + w || y < vy - h || y > vy + vh + h) continue;
      c.drawImage(grass, x - w / 2, y - h / 2, w, h);
    }
    c.globalAlpha = 1;
  } else for (let u = -60; u < 80; u += 2) quad(c, u, -60, u + 1, 80, '#548f39'); // mowing stripes until the tile loads
  // footpaths: ChatGPT's herringbone paving as a texture laid along the iso axes, a red-and-cream kerb, the club crest at each crossing
  const pave = art('path-straight');
  if (pave) {
    const tex = document.createElement('canvas'); tex.width = 150; tex.height = 70; // a clean square of paving from the middle of the tile
    tex.getContext('2d').drawImage(pave, 200, 80, 150, 70, 0, 0, 150, 70); // already drawn at our angle, so it repeats as a plain screen pattern
    const pat = c.createPattern(tex, 'repeat'); pat.setTransform(new DOMMatrix([0.16, 0, 0, 0.16, 0, 0]));
    for (const k of ROADS) { quad(c, k - 1, -60, k + 1, 80, '#e6d6b2'); quad(c, -60, k - 1, 80, k + 1, '#e6d6b2'); }
    c.globalAlpha = 0.35; for (const k of ROADS) { quad(c, k - 1, -60, k + 1, 80, pat); quad(c, -60, k - 1, 80, k + 1, pat); } c.globalAlpha = 1; // the paving pattern faded right back, so the paths stay calm
  } else for (const k of ROADS) { quad(c, k - 1, -60, k + 1, 80, '#ead8b4'); quad(c, -60, k - 1, 80, k + 1, '#ead8b4'); }
  for (const k of ROADS) for (const e of [-1, 1]) for (let i = -40; i < 60; i += 0.5) { // kerb: alternating red and cream blocks
    const a = i, b2 = i + 0.5; if (ROADS.some(q => Math.abs(a + 0.25 - q) < 1)) continue;
    const col = (i * 2) % 4 === 0 ? '#b8434a' : '#efe4c6', o = k + e * 1.02, w2 = 0.12 * e;
    quad(c, o - w2, a, o + w2, b2, col); quad(c, a, o - w2, b2, o + w2, col);
  }
  const cross = art('path-cross');
  if (cross) for (const [u, v] of [[ROADS[0], ROADS[1]]]) { // one crest, at the crossing nearest the entrance // the crest mosaic from the middle of the crossroads tile
    const [x, y] = P(u, v), w2 = 1.7 * A, h2 = w2 * 70 / 124; // a roomy crop with an oval clip, so the whole ring shows and no square corner does
    c.save(); c.beginPath(); c.ellipse(x, y, w2 * 0.43, h2 * 0.43, 0, 0, Math.PI * 2); c.clip();
    c.drawImage(cross, 288, 118, 124, 70, x - w2 / 2, y - h2 / 2, w2, h2); c.restore();
  }
  // the far corners of the grounds: a pond, a little park, the car park and the entrance plaza (ChatGPT art when it has loaded)
  if (!piece(c, 'ground-pond', 14, 0)) {
    quad(c, 14.2, 0.2, 17.8, 3.8, '#4a8a34');
    const [px, py] = P(16, 2); c.fillStyle = '#2d5e8a'; c.beginPath(); c.ellipse(px, py, 20, 10, 0, 0, Math.PI * 2); c.fill();
  }
  if (!piece(c, 'ground-car-park', 14, 7)) quad(c, 14.2, 7.2, 17.8, 10.8, '#6b6878');
  if (!piece(c, 'ground-plaza', 14, 14)) quad(c, 14.2, 14.2, 17.8, 17.8, '#d8c99c');
  // street furniture by the paths: bins, bollards, flower tubs and a signpost to the stadium
  const props = art('path-props');
  if (props) {
    const fw = props.width / 4, put = (i, u, v, h) => { const [x, y] = P(u, v), w2 = fw * h / props.height; c.fillStyle = 'rgba(20,30,10,.25)'; c.beginPath(); c.ellipse(x + 1, y, w2 * 0.4, 1.4, 0, 0, Math.PI * 2); c.fill(); c.drawImage(props, i * fw, 0, fw, props.height, x - w2 / 2, y - h, w2, h); };
    for (const [i, u, v, h] of [[2, 6.8, 4.2, 8], [3, 11.2, 4.1, 16], [0, 11.2, 13.8, 9]]) put(i, u, v, h); // just three: a flower tub, the stadium signpost, a bin
  }
  // land beyond the grounds, locked in the demo: fenced plots with a padlock sign, hinting the map goes on
  for (const [u0, v0] of LOCKED) {
    quad(c, u0, v0, u0 + 4, v0 + 4, 'rgba(60,50,30,.18)');
    c.strokeStyle = 'rgba(26,16,48,.45)'; c.lineWidth = 1; c.setLineDash([3, 3]); c.beginPath();
    for (const [u, v] of [[u0, v0], [u0 + 4, v0], [u0 + 4, v0 + 4], [u0, v0 + 4], [u0, v0]]) c.lineTo(...P(u, v)); c.stroke(); c.setLineDash([]);
    const [x, y] = P(u0 + 2, v0 + 2);
    c.fillStyle = '#1a1030'; c.fillRect(x - 1, y - 14, 2, 14); c.fillRect(x - 16, y - 26, 32, 13);
    c.fillStyle = '#efe4c6'; c.fillRect(x - 15, y - 25, 30, 11);
    c.font = '5px Silkscreen, monospace'; c.textAlign = 'center'; c.fillStyle = '#c8303a'; c.fillText('FULL GAME', x, y - 17.5);
  }
  // benches by the plaza
  for (const [u, v] of [[13.9, 15.2], [15.2, 13.9]]) stand(c, 'prop-bench', u, v, 7);
  // trees: a few in the park corner and plenty outside the grounds
  for (const [u, v] of [[1, 15], [2.6, 14.8], [1.6, 16.6], [3.2, 16.8], [0.8, 17.6]]) tree(c, u, v, 0.9);
  const trees = [];
  for (let u = -30; u < 44; u++) for (let v = -30; v < 44; v++) {
    const inside = LOCKED.some(([a, b]) => u > a - 1 && u < a + 5 && v > b - 1 && v < b + 5) || u > -1.5 && u < 19 && v > -1.5 && v < 19 || u > -4.5 && u < 4.5 && v > -4.5 && v < 4.5, onRoad = ROADS.some(k => Math.abs(u + 0.5 - k) < 2.2 || Math.abs(v + 0.5 - k) < 2.2);
    if (!inside && !onRoad && hash(u, v) < 0.09) trees.push([u + hash(v, u) * 0.6, v + hash(u + 3, v) * 0.6]);
  }
  trees.sort((a, b) => a[0] + a[1] - b[0] - b[1]).forEach(([u, v]) => tree(c, u, v, 0.8 + hash(u, v) * 0.35));
}

// ---------- buildings: art sits on its plot; a quick settle when it is built or grows ----------
const hitBox = {}, pops = {};
const ease = k => 1 - Math.pow(1 - k, 3);
function popScale(b, t) { // squash and settle, 360 ms, only after a purchase
  const p = pops[b]; if (!p) return [1, 1];
  const k = (t - p.t) / 0.36; if (k < 0) return [1, 1]; if (k >= 1) { delete pops[b]; return [1, 1]; }
  const big = p.big ? 1 : 0.4, s = Math.sin(k * Math.PI * 2) * (1 - ease(k)) * 0.07 * big;
  return [1 + s, 1 - s];
}
function drawLot(b, t) {
  const L = LOTS[b], n = size(b), st = stageOf(b), img = st && art(`building-${b}-${st}`), [cx] = lotCentre(b), [, fy] = lotFront(b);
  if (!img && (art('plot-for-sale') || art('ground-empty-plot'))) { // empty plot for sale
    const e = art('plot-for-sale') || art('ground-empty-plot'), w = 8 * A, h = e.height * w / e.width, [, by] = P(L.u0 + n / 2 + 2, L.v0 + n / 2 + 2); ctx.drawImage(e, cx - w / 2, by + 1 - h, w, h);
    hitBox[b] = {x: cx - w / 2, y: by - h, w, h}; return;
  }
  if (!img) { // empty plot for sale, drawn in code until the art loads
    quad(ctx, L.u0 + 0.35, L.v0 + 0.35, L.u0 + n - 0.35, L.v0 + n - 0.35, '#9a6f45');
    for (let i = 1; i < n * 1.5; i++) { const [ax, ay] = P(L.u0 + 0.35 + i * 0.55, L.v0 + 0.5), [bx, by] = P(L.u0 + 0.35 + i * 0.55, L.v0 + n - 0.5); ctx.strokeStyle = '#86603b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
    for (const [u, v] of [[0.35, 0.35], [n - 0.35, 0.35], [0.35, n - 0.35], [n - 0.35, n - 0.35]]) { const [x, y] = P(L.u0 + u, L.v0 + v); R(x - 0.8, y - 5, 1.6, 5, '#f3ead0'); }
    const [x, y] = lotCentre(b);
    R(x - 1, y - 16, 2.2, 16, INK); R(x - 15, y - 28, 30, 14, INK); R(x - 14, y - 27, 28, 12, '#fbf3dc');
    ctx.font = '5px Silkscreen, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText('FOR', x, y - 21.5); ctx.fillStyle = '#e3262f'; ctx.fillText('SALE', x, y - 16);
    hitBox[b] = {x: x - 26, y: y - 30, w: 52, h: 46};
    return;
  }
  if (img) quad(ctx, L.u0 + 0.35, L.v0 + 0.1, L.u0 + n + 0.35, L.v0 + n + 0.1, 'rgba(20,30,10,.22)');
  const site = art('construction'), k = t - (builtAt[b] || -9);
  if (site && k < 1.05) { // scaffolding, the crane, then the dust as it comes down; the building pops in after
    // scaffolding, crane, dust: drawn at the stadium's angle, so its plot sits straight on ours
    const fw = site.width / 3, w = 8 * A, h = site.height * w / fw, [, by] = P(L.u0 + n / 2 + 2, L.v0 + n / 2 + 2);
    ctx.drawImage(site, Math.min(2, Math.floor(k / 0.35)) * fw, 0, fw, site.height, cx - w / 2, by + 1 - h, w, h);
    hitBox[b] = {x: cx - w / 2, y: by - h, w, h}; return;
  }
  const fit = FIT[`building-${b}-${st}`];
  if (fit) { // flat art drawn from a steeper camera: map its left, right and bottom ground corners onto the plot's
    const [sx, sy] = popScale(b, t), [lx, ly] = P(L.u0, L.v0 + n), [rx, ry] = P(L.u0 + n, L.v0), [bx, by] = P(L.u0 + n, L.v0 + n);
    const [[x1, y1], [x2, y2], [x3, y3]] = fit.map(([fx, fy]) => [fx * img.width, fy * img.height]);
    const det = (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
    const a = ((rx - lx) * (y3 - y1) - (bx - lx) * (y2 - y1)) / det, c = ((bx - lx) * (x2 - x1) - (rx - lx) * (x3 - x1)) / det;
    const b2 = ((ry - ly) * (y3 - y1) - (by - ly) * (y2 - y1)) / det, d = ((by - ly) * (x2 - x1) - (ry - ly) * (x3 - x1)) / det;
    ctx.save(); ctx.translate(cx, by); ctx.scale(sx, sy); ctx.translate(-cx, -by);
    ctx.transform(a, b2, c, d, lx - a * x1 - c * y1, ly - b2 * x1 - d * y1); ctx.drawImage(img, 0, 0); ctx.restore();
    hitBox[b] = {x: lx, y: Math.min(ly, ry) - (by - Math.min(ly, ry)), w: rx - lx, h: 2 * (by - Math.min(ly, ry))};
    return;
  }
  const w = 2 * n * A, h = img.height * w / img.width, [sx, sy] = popScale(b, t);
  const base = BASE[`building-${b}-${st}`];
  if (base) { // drawn from a steeper camera: keep the building as drawn, flatten only the front half of its plot onto ours
    const k = w / img.width, [, ly] = P(L.u0, L.v0 + n), cut = base * img.height, top = cut * k;
    ctx.save(); ctx.translate(cx, fy + 1); ctx.scale(sx, sy); ctx.translate(-cx, -(fy + 1));
    ctx.drawImage(img, 0, 0, img.width, cut, cx - w / 2, ly - top, w, top);
    ctx.drawImage(img, 0, cut, img.width, img.height - cut, cx - w / 2, ly, w, fy + 1 - ly);
    ctx.restore(); hitBox[b] = {x: cx - w / 2, y: ly - top, w, h: fy - ly + top}; return;
  }
  ctx.save(); ctx.translate(cx, fy + 1); ctx.scale(sx, sy); ctx.drawImage(img, -w / 2, -h, w, h);
  const fx = ANIM[`building-${b}-${st}`]; if (fx) animate(fx, b, -w / 2, -h, w, h, t);
  ctx.restore();
  hitBox[b] = {x: cx - w / 2, y: fy - h, w, h};
}
// dust puffs when something is built
const puffs = [];
function puff(b, big) {
  const L = LOTS[b], n = size(b);
  for (let i = 0; i < (big ? 14 : 5); i++) { const a = i / (big ? 14 : 5) * Math.PI * 2, [x, y] = P(L.u0 + n / 2 + Math.cos(a) * n * 0.52, L.v0 + n / 2 + Math.sin(a) * n * 0.52); puffs.push({x, y, dx: Math.cos(a) * 10, dy: Math.sin(a) * 5 - 4, t: 0}); }
}
function drawPuffs(dt) {
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i]; p.t += dt; const k = p.t / 0.5; if (k >= 1) { puffs.splice(i, 1); continue; }
    const e = ease(k); ctx.fillStyle = `rgba(251,243,220,${0.85 * (1 - k)})`; ctx.beginPath(); ctx.arc(p.x + p.dx * e, p.y + p.dy * e, 2.5 + 3 * e, 0, Math.PI * 2); ctx.fill();
  }
}
const builtAt = {};
function celebrate(b) {
  const big = S.lv[b] === 1 || C.stages.includes(S.lv[b]), now = performance.now() / 1000;
  if (S.lv[b] === 1) { builtAt[b] = now; pops[b] = {t: now + 1.05, big}; setTimeout(() => puff(b, true), 1050); }
  else { pops[b] = {t: now, big}; puff(b, big); }
  if (b === 'stadium') { cheerUntil = now + 2.5; volley = now + (big ? 0.9 : 0); if (big) lampsFrom = now; } // fireworks wait for the floodlights on a new stage
}

// ---------- moving parts painted by ChatGPT: corner flags and floodlights ----------
// Positions are fractions of the building image: flags stand on (x, y) with a pole that tall; lamp heads are centred on (x, y), w wide.
// Ground corners (left, right, bottom) of art drawn from a different camera angle, as fractions of the image: drawLot bends it onto the plot.
const FIT = {
  'building-pitch-1': [[0, 0.528], [1, 0.534], [0.505, 1]], 'building-pitch-2': [[0, 0.527], [1, 0.535], [0.505, 1]],
  'building-pitch-3': [[0, 0.616], [1, 0.618], [0.507, 1]], 'building-pitch-4': [[0, 0.609], [1, 0.611], [0.499, 1]],
};
// Height (fraction of the image) of the plot's left and right corners in art drawn from a steeper camera.
const BASE = {};
// Flags stand on the pitch corners the stands don't hide.
const ANIM = {
  'building-stadium-1': {flags: [[0.1477, 0.6244], [0.5003, 0.3427], [0.8587, 0.6056], [0.5061, 0.8873]], pole: 0.0646, lamps: [[0.0712, 0.3016, 0.0280], [0.4997, 0.0329, 0.0350], [0.9276, 0.3016, 0.0280]]},
  'building-stadium-2': {flags: [[0.5003, 0.3419], [0.5061, 0.8852]], pole: 0.0644, lamps: [[0.0683, 0.3021, 0.0374], [0.5003, 0.0340, 0.0403], [0.9317, 0.3009, 0.0350]], fans: [[[0.1582, 0.5187], [0.4256, 0.3595]], [[0.1459, 0.4438], [0.4168, 0.3009]], [[0.5756, 0.3595], [0.8587, 0.5351]], [[0.5838, 0.2845], [0.8675, 0.4438]]], fan: 0.0280},
  'building-stadium-3': {flags: [[0.4997, 0.3427], [0.5055, 0.8873]], pole: 0.0646, lamps: [[0.0665, 0.2441, 0.0373], [0.5003, 0.0329, 0.0402], [0.9329, 0.2465, 0.0350]], fans: [[[0.1335, 0.4695], [0.4332, 0.3603]], [[0.0997, 0.3603], [0.4163, 0.2347]], [[0.5749, 0.3521], [0.8746, 0.5035]], [[0.5749, 0.2512], [0.8828, 0.3603]]], fan: 0.0280},
  'building-stadium-4': {flags: [[0.1480, 0.6172], [0.5012, 0.3387], [0.8602, 0.5986], [0.5070, 0.8770]], pole: 0.0638, lamps: [[0.0661, 0.2831, 0.0398], [0.5000, 0.0394, 0.0409], [0.9351, 0.2865, 0.0386]], fans: [[[0.1585, 0.5383], [0.4263, 0.3898]], [[0.1503, 0.3979], [0.4263, 0.2738]], [[0.5848, 0.3817], [0.8520, 0.5302]], [[0.5766, 0.2657], [0.8602, 0.3979]]], fan: 0.0281, screens: [[0.1082, 0.0872, 0.1205, -0.0188, 0.1655], [0.7760, 0.0270, 0.1076, 0.1226, 0.1470]], roof: [[0.2754, 0.0858], [0.3632, 0.0360], [0.6392, 0.0360], [0.7392, 0.0858]]},
};
let lampsFrom = performance.now() / 1000 - 99, flick = {i: -1, until: 0, next: 6};
let cheerUntil = 0, volley = 0, nextRocket = 4;
const rockets = []; // {i: launch point, t0}
function lampOn(i, t) { // switch on one by one with a stutter after a build, and now and then one lamp flickers
  const k = t - lampsFrom - i * 0.35;
  if (k < 0) return false;
  if (k < 0.3) return Math.floor(k / 0.07) % 2 === 1;
  if (flick.i === i && t < flick.until) return Math.floor(t / 0.06) % 2 === 0;
  return true;
}
function animate(fx, b, x0, y0, w, h, t) {
  const flag = art('anim-corner-flag'), lamp = art('anim-floodlight');
  if (t > flick.next) { flick = {i: Math.random() * fx.lamps.length | 0, until: t + 0.35, next: t + 9 + Math.random() * 14}; }
  if (lamp) {
    const fw = lamp.width / 3, fh = lamp.height;
    fx.lamps.forEach(([lx, ly, lw], i) => {
      const on = lampOn(i, t), dw = lw * w * 1.08, dh = dw * fh / fw, cx = x0 + lx * w, cy = y0 + ly * h;
      ctx.drawImage(lamp, on ? fw : 0, 0, fw, fh, cx - dw / 2, cy - dh / 2, dw, dh);
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, dw * 1.3); g.addColorStop(0, 'rgba(255,240,180,.35)'); g.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = g; ctx.fillRect(cx - dw * 1.3, cy - dw * 1.3, dw * 2.6, dw * 2.6); ctx.restore(); }
    });
  }
  if (flag) {
    const fw = flag.width / 4, fh = flag.height, gust = Math.sin(t * 0.37) + Math.sin(t * 0.23 + 1);
    const seq = gust < -1.1 ? [0, 1, 0, 1] : [1, 2, 3, 2], fps = gust < -1.1 ? 3 : 7;
    fx.flags.forEach(([fxp, fyp], i) => {
      const f = seq[Math.floor(t * fps + i * 0.6) % 4], dh = fx.pole * h, dw = dh * fw / fh, px = x0 + fxp * w, py = y0 + fyp * h;
      ctx.drawImage(flag, f * fw, 0, fw, fh, px - dw * 0.075, py - dh, dw, dh); // the pole sits at the left edge of each frame
    });
  }
  const screen = art('anim-screen');
  if (screen && fx.screens) { // the big screens cycle through their four pictures; the right one is sheared to face the other way
    const fw = screen.width / 4, fh = screen.height, f = Math.floor(t / 2.6) % 4;
    for (const [sx, sy, sw, sk, sh] of fx.screens) {
      ctx.save(); ctx.transform(sw * w / fw, sk * h / fw, 0, sh * h / fh, x0 + sx * w, y0 + sy * h);
      ctx.drawImage(screen, f * fw, 0, fw, fh, 0, 0, fw, fh); ctx.restore();
    }
  }
  const fans = art('anim-fans');
  if (fans && fx.fans) { // a Mexican wave runs round the stands every 14 s; everyone jumps after an upgrade
    const fw = fans.width / 2, fh = fans.height, dw = fx.fan * w, dh = dw * fh / fw, wave = (t % 14) / 3, all = t < cheerUntil;
    const total = fx.fans.length;
    fx.fans.forEach(([[ax, ay], [bx, by]], r) => {
      const right = bx > 0.55, n = Math.max(2, Math.round(Math.hypot((bx - ax) * w, (by - ay) * h) / (dw * 1.15)));
      for (let k = 0; k <= n; k++) {
        const q = k / n, x = x0 + (ax + (bx - ax) * q) * w, y = y0 + (ay + (by - ay) * q) * h;
        const along = (right ? 0.5 : 0) + (right ? q : q) * 0.5; // left stand first, then the right one
        const up = all ? Math.floor(t * 4 + k) % 2 === 0 : Math.abs(wave - along) < 0.07;
        ctx.save(); ctx.translate(x, y); if (right) ctx.scale(-1, 1);
        ctx.drawImage(fans, up ? fw : 0, 0, fw, fh, -dw / 2, -dh, dw, dh); ctx.restore();
      }
    });
  }
  const pts = fx.roof || fx.lamps, rocket = art('anim-rocket'), boom = art('anim-firework');
  if (rocket && boom) { // fireworks: now and then from the stage 4 roof, and a volley after an upgrade
    if (fx.roof && t > nextRocket) { rockets.push({i: Math.random() * pts.length | 0, t0: t}); nextRocket = t + 2.5 + Math.random() * 4; }
    if (volley && t > volley) { pts.forEach((_, i) => rockets.push({i, t0: t + i * 0.18})); volley = 0; }
    const bw = boom.width / 5, bh = boom.height, size = 0.09 * w, rise = 0.12 * h;
    for (let n = rockets.length - 1; n >= 0; n--) {
      const r = rockets[n], k = t - r.t0, [px, py] = pts[r.i], x = x0 + px * w, y = y0 + py * h;
      if (k < 0) continue;
      if (k < 0.45) { const e = ease(k / 0.45), rh = size * 0.4; ctx.drawImage(rocket, x - rh * rocket.width / rocket.height / 2, y - rise * e - rh * 0.3, rh * rocket.width / rocket.height, rh); continue; }
      const f = Math.floor((k - 0.45) / 0.11); if (f > 4) { rockets.splice(n, 1); continue; }
      ctx.drawImage(boom, f * bw, 0, bw, bh, x - size / 2, y - rise - size / 2, size, size * bh / bw);
    }
  }
}

// ---------- people: they walk along the roads to a building's door ----------
// person() draws a character standing at (x, y) on the ground. Each character has two 4-frame walking sheets:
// "front" (walking towards the camera, down-right) and "back" (walking away, up-right); walking left is a mirror image.
function person(who, x, y, h, t, o = {}) {
  const name = `char-${who}-${o.back ? 'back' : 'front'}`, img = art(name); if (!img) return;
  const fw = img.width / 4, fh = img.height, w = fw * h / fh, f = o.f != null ? o.f : o.walk ? Math.floor(t * 6 + (o.seed || 0)) % 4 : 0; // walkers pass f from the distance walked, so feet don't slide
  ctx.save(); ctx.globalAlpha = o.alpha ?? 1; ctx.translate(x, y);
  ctx.fillStyle = 'rgba(20,40,10,.28)'; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  if (!o.right) ctx.scale(-1, 1);
  ctx.drawImage(img, f * fw, 0, fw, fh, -w / 2, -h, w, h); ctx.restore();
}
// any other sheet of frames standing on the ground (the academy players' kick)
function frames(name, n, f, x, y, h, right) {
  const img = art(name); if (!img) return;
  const fw = img.width / n, fh = img.height, w = fw * h / fh;
  ctx.save(); ctx.translate(x, y); if (right) ctx.scale(-1, 1); ctx.drawImage(img, (f % n) * fw, 0, fw, fh, -w / 2, -h, w, h); ctx.restore();
}
// road graph: crossings, the points where roads leave the grounds, and every door
function route(from, to) {
  const pts = [];
  for (const a of ROADS) for (const b of ROADS) pts.push([a, b]);
  for (const k of ROADS) for (const e of EDGE) pts.push([k, e], [e, k]);
  pts.push(from, to);
  const same = (p, q) => Math.abs(p[0] - q[0]) < 1e-6 || Math.abs(p[1] - q[1]) < 1e-6;
  const onRoad = (p, q) => same(p, q) && (ROADS.includes(p[0]) && Math.abs(p[0] - q[0]) < 1e-6 || ROADS.includes(p[1]) && Math.abs(p[1] - q[1]) < 1e-6);
  const dist = pts.map(() => Infinity), prev = pts.map(() => -1), done = pts.map(() => false), s = pts.length - 2, e = pts.length - 1;
  dist[s] = 0;
  for (;;) {
    let i = -1; for (let j = 0; j < pts.length; j++) if (!done[j] && (i < 0 || dist[j] < dist[i])) i = j;
    if (i < 0 || dist[i] === Infinity || i === e) break; done[i] = true;
    for (let j = 0; j < pts.length; j++) if (!done[j] && onRoad(pts[i], pts[j])) { const d = dist[i] + Math.abs(pts[i][0] - pts[j][0]) + Math.abs(pts[i][1] - pts[j][1]); if (d < dist[j]) { dist[j] = d; prev[j] = i; } }
  }
  const out = []; for (let i = e; i >= 0; i = prev[i]) out.unshift(pts[i]);
  return out[0] === from ? out : [from, to];
}
const walkers = [];
const WHO = {stadium: 'fan', shop: 'fan', transfer: 'agent', pitch: 'youth', academy: 'youth'};
function spawn(b, from) {
  const start = from || [ROADS[Math.random() * 2 | 0], EDGE[1]].sort(() => Math.random() - 0.5);
  walkers.push({who: WHO[b], path: route(start, LOTS[b].door), i: 0, k: 0, v: 1 + Math.random() * 0.3, seed: Math.random() * 9, life: 0, out: 0});
}
function stepWalkers(dt) {
  const busy = S.lv.stadium * 1.2 + S.lv.shop * 0.6 + S.lv.transfer * 0.3 + (S.lv.academy ? 1 : 0);
  if (walkers.length < Math.min(14, 1 + busy) && Math.random() < dt * 0.9) {
    const open = Object.keys(LOTS).filter(b => S.lv[b]), weights = open.map(b => b === 'stadium' ? 3 : b === 'shop' ? 2 : 1);
    let r = Math.random() * weights.reduce((a, b) => a + b, 0), pick = open[0];
    for (let i = 0; i < open.length; i++) { r -= weights[i]; if (r <= 0) { pick = open[i]; break; } }
    if (pick) spawn(pick);
  }
  for (let n = walkers.length - 1; n >= 0; n--) {
    const w = walkers[n]; w.life += dt;
    if (w.i >= w.path.length - 1) { w.out += dt; if (w.out > 0.25) walkers.splice(n, 1); continue; }
    const a = w.path[w.i], b = w.path[w.i + 1], len = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) || 1e-6;
    w.k += w.v * dt / len; w.dist = (w.dist || 0) + w.v * dt; if (w.k >= 1) { w.k = 0; w.i++; }
  }
}
function walkerPos(w) {
  const a = w.path[Math.min(w.i, w.path.length - 1)], b = w.path[Math.min(w.i + 1, w.path.length - 1)];
  const u = a[0] + (b[0] - a[0]) * w.k, v = a[1] + (b[1] - a[1]) * w.k, side = (w.seed % 1 - 0.5) * 1.1; // keep people off the exact centre line
  const [x, y] = P(u + (a[0] === b[0] ? side : 0), v + (a[1] === b[1] ? side : 0));
  const [bx, by] = P(b[0], b[1]), [ax, ay] = P(a[0], a[1]);
  return {x, y, d: u + v, right: bx > ax, back: by < ay};
}
function drawPeople(t) {
  const list = [];
  for (const w of walkers) {
    const p = walkerPos(w), alpha = Math.min(1, w.life / 0.25) * (1 - w.out / 0.25);
    list.push({d: p.d, f: () => person(w.who, p.x, p.y, 15, t, {walk: w.out === 0, f: Math.floor((w.dist || 0) * 4.5 + w.seed) % 4, right: p.right, back: p.back, alpha})});
  }
  if (S.lv.academy) { // academy players practising shots beside the academy: a kick every couple of seconds each
    const L = LOTS.academy, kids = Math.min(3, Math.ceil(S.lv.academy / 6));
    for (let i = 0; i < kids; i++) {
      const u = L.u0 + 4.5, v = L.v0 + 0.9 + i * 1.3, [x, y] = P(u, v), k = (t * 0.55 + i * 0.37) % 1, f = k < 0.6 ? 0 : Math.floor((k - 0.6) / 0.1);
      list.push({d: u + v, f: () => frames('char-youth-kick', 4, f, x, y, 14, i % 2 === 1)});
    }
  }
  if (S.lv.pitch >= 5) { // the coach paces up and down the touchline, turning at each end
    const L = LOTS.pitch, k = (t / 4.5) % 2, out = k < 1, q = out ? k : 2 - k, e = q * q * (3 - 2 * q), v = L.v0 + 0.6 + e * 2.8, u = L.u0 + 4.6, [x, y] = P(u, v);
    const turning = q < 0.04 || q > 0.96; // the walking sheets have no standing frame, so he only stops for a beat at the turn
    list.push({d: u + v, f: () => person('coach', x, y, 15, t, {walk: !turning, right: !out, back: !out})});
  }
  if (EV && EV.e.target === 'transfer') { // agents pace up and down outside the transfer office
    for (let i = 0; i < 5; i++) { const s = Math.sin(t * 0.8 + i * 1.3), [x, y] = P(9 + (i - 2) * 0.6 + s * 0.4, 4.7 + (i % 2) * 0.5); list.push({d: 13.7, f: () => person('agent', x, y, 14, t, {walk: true, seed: i, right: Math.cos(t * 0.8 + i * 1.3) > 0, back: Math.cos(t * 0.8 + i * 1.3) < 0})}); }
  }
  if (S.lv.shop >= 10) { // the mascot does laps of the grounds
    const k = (t / 48) % 1, loop = [[5.5, 5.5], [12.5, 5.5], [12.5, 12.5], [5.5, 12.5], [5.5, 5.5]], seg = Math.floor(k * 4), f = k * 4 - seg;
    const a = loop[seg], b = loop[seg + 1], u = a[0] + (b[0] - a[0]) * f, v = a[1] + (b[1] - a[1]) * f, [x, y] = P(u, v);
    list.push({d: u + v, f: () => person('mascot', x, y, 17, t, {walk: true, right: P(...b)[0] > P(...a)[0], back: P(...b)[1] < P(...a)[1], seed: 3})});
  }
  for (const b of Object.keys(LOTS)) { const L = LOTS[b]; list.push({d: L.u0 + L.v0 + size(b), f: () => drawLot(b, t)}); }
  list.sort((a, b) => a.d - b.d).forEach(o => o.f());
}

// ---------- events: a prop over the building, a pin to tap, and the odd plane ----------
const PROP = {plague: 'event-plague-cloud', airport: 'event-plane', haalunch: 'event-sold-out-sign', misprint: 'event-misprint-shirts', mascot: 'event-banana'};
const PROP_FRAMES = {'event-plague-cloud': 4, 'event-sold-out-sign': 2};
function eventProp(e) { const t = e.title.toLowerCase(); return e.prop || (t.includes('plague') ? PROP.plague : t.includes('airport') ? PROP.airport : t.includes('haalunch') ? PROP.haalunch : t.includes('misprint') ? PROP.misprint : t.includes('mascot') ? PROP.mascot : null); }
function drawEvent(t) {
  if (!EV) return;
  const b = TARGET_PLOT[EV.e.target], hb = hitBox[b]; if (!hb) return;
  const [cx, cy] = lotCentre(b), prop = eventProp(EV.e), img = prop && art(prop);
  if (prop === PROP.airport && img) { // flies over the grounds, its shadow on the grass
    const k = (t / 6) % 1, x = -40 + k * (W + 80), y = 30 + k * 40, w = 54;
    ctx.fillStyle = 'rgba(20,40,10,.18)'; ctx.beginPath(); ctx.ellipse(x + 10, y + 70, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(img, x - w / 2, y - w * img.height / img.width / 2, w, w * img.height / img.width);
  } else if (img) { // props with several frames (the swirling cloud, the blinking sign) cycle through them
    const n = PROP_FRAMES[prop] || 1, f = Math.floor(t * (n > 2 ? 5 : 2)) % n, fw = img.width / n, L = LOTS[b], sz = size(b);
    const k = Math.min(1, (t - EV.t0) / 0.25), e = ease(k), sc = 0.9 + 0.1 * e; // arrives with a short settle, then stays put
    ctx.save(); ctx.globalAlpha = e;
    if (prop === PROP.plague) { // a cloud may float: it hangs over the building and darkens the ground under it
      const w = 46, h = w * img.height / fw, drift = Math.sin(t * 0.6) * 4;
      ctx.fillStyle = 'rgba(40,60,10,.25)'; ctx.beginPath(); ctx.ellipse(cx + drift, cy + 4, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(img, f * fw, 0, fw, img.height, cx + drift - w * sc / 2, hb.y - h * sc * 0.4, w * sc, h * sc);
    } else { // everything else stands on the grass in front of the plot, with a contact shadow
      const [gx, gy] = P(L.u0 + sz * 0.3, L.v0 + sz + 0.9), w = 26, h = w * img.height / fw;
      ctx.fillStyle = 'rgba(20,30,10,.3)'; ctx.beginPath(); ctx.ellipse(gx, gy, w * 0.42, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(img, f * fw, 0, fw, img.height, gx - w * sc / 2, gy - h * sc, w * sc, h * sc);
    }
    ctx.restore();
  }
  // the pin: bobs gently so it reads as tappable
  const y = hb.y + 2 - Math.abs(Math.sin(t * 3)) * 4, x = cx + 30;
  ctx.fillStyle = 'rgba(20,40,10,.25)'; ctx.beginPath(); ctx.ellipse(x, cy - 2, 4, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  R(x - 7, y, 14, 15, INK); R(x - 6, y + 1, 12, 13, '#e3262f'); R(x - 2, y + 15, 4, 3, INK); text('!', x, y + 11.5, 10, '#fff');
}
// slow cloud shadows drifting over the grass: the only ambient motion
const shadows = Array.from({length: 3}, (_, i) => ({x: i * 150 - 60, y: 40 + i * 80, v: 4 + i}));
function drawShadows(dt) {
  const [vx, vy, vw] = visible();
  ctx.fillStyle = 'rgba(10,30,10,.07)';
  for (const s of shadows) {
    s.x += s.v * dt; if (s.x > vx + vw + 80) s.x = vx - 120;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, 46, 18, 0, 0, Math.PI * 2); ctx.ellipse(s.x + 30, s.y + 6, 30, 13, 0, 0, Math.PI * 2); ctx.fill();
  }
}
// red-and-cream pennants on the plaza flagpoles, waving
function drawPennants(t) {
  const img = art('anim-pennant'), plaza = art('ground-plaza'); if (!img || !plaza) return;
  const fw = img.width / 4, fh = img.height, w = 8 * A, h = plaza.height * w / plaza.width, [x0] = P(16, 16), [, yb] = P(18, 18), left = x0 - w / 2, top = yb + 1 - h;
  [[0.255, 0.01], [0.743, 0.01]].forEach(([px, py], i) => {
    const f = Math.floor(t * 6 + i * 1.5) % 4, dh = h * 0.3, dw = dh * fw / fh;
    ctx.drawImage(img, f * fw, 0, fw, fh, left + px * w - dw * 0.09, top + py * h, dw, dh);
  });
}
function draw(t, dt) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(ground, 0, 0);
  toWorld(ctx);
  drawPeople(t);
  drawPuffs(dt);
  drawPennants(t);
  for (const b of Object.keys(LOTS)) if (!S.lv[b]) { const L = LOTS[b], n = size(b), [x, y] = P(L.u0 + n / 2 + 2, L.v0 + n / 2 + 2); label(B[b].name.toUpperCase(), x, y - 6); } // names only on empty plots
  drawShadows(dt);
  drawEvent(t);
}

// ---------- floats, coins and the news ticker ----------
function floatText(s, xPct, yPct, big, layer) {
  const el = document.createElement('div'); el.className = 'float' + (big ? ' big' : ''); el.textContent = s;
  el.style.left = xPct + '%'; el.style.top = yPct + '%'; (layer || mapFloats).appendChild(el); setTimeout(() => el.remove(), 750);
}
const plotPct = b => { const [x] = lotCentre(b), y = hitBox[b] ? hitBox[b].y + 10 : lotCentre(b)[1] - 20; return [x / W * 100, y / H * 100]; };
let tickerT = 0;
let lastTick = -99;
// one news line at a time: small talk waits at least 15 s after the last line; important news (events, stars, hints) always shows
function ticker(s, important) {
  const now = performance.now() / 1000; if (!important && now - lastTick < 15) return;
  lastTick = now; $('tickerText').textContent = s; tickerT = 30;
}
let lastNews = '';
function news() { // a line that fits how far the club has come, never the same one twice in a row
  const built = Object.keys(LOTS).filter(b => S.lv[b]).length, tier = built === 0 ? 0 : built < 4 ? 1 : 2;
  const pool = C.news.filter(([t, l]) => t === tier && l !== lastNews).map(([, l]) => l);
  if (pool.length) ticker(lastNews = pool[Math.random() * pool.length | 0]);
}

// ---------- tapping: the cookie unicorn (left) and the plots (map) ----------
const kicker = $('kicker'), uni = $('uni'), kickFloats = $('floats'), moneyEl = $('money');
const still = matchMedia('(prefers-reduced-motion: reduce)');
// the unicorn stands still and blinks now and then; a tap makes it gallop for a moment and shed crumbs
const UNI = [0, 1, 2].map(f => cookieUnicorn(f, 8)), BLINK = cookieUnicorn(0, 8, true), ug = uni.getContext('2d');
uni.width = UNI[0].width; uni.height = UNI[0].height;
let uniFrame = -1, galloping = 0, nextBlink = 3;
function showUni(img) { if (img === uniFrame) return; uniFrame = img; ug.clearRect(0, 0, uni.width, uni.height); ug.drawImage(img, 0, 0); }
function stepUni(dt) {
  const t = performance.now() / 1000;
  if (galloping > 0) { galloping -= dt; return showUni(UNI[galloping > 0.09 ? 2 : 1]); }
  if (t > nextBlink) { if (t > nextBlink + 0.12) nextBlink = t + 2.5 + Math.random() * 3; return showUni(BLINK); }
  showUni(UNI[0]);
}
// the training pitch's boots: one per level (up to 36) circle the unicorn and take turns kicking it; a coin pops out each time
const bootsCv = $('boots'), bctx = bootsCv.getContext('2d'), pops2 = [];
const BOOT = (() => { // a 10x6 pixel boot, toe pointing right
  const rows = ['..KKK.....', '.KCCK.....', '.KRRKKKK..', 'KRRRRRRRKK', 'KKKKKKKKKK', '.G.G..G.G.'], col = {K: '#14101f', C: '#fbf3dc', R: '#d7262e', G: '#f2c230'};
  const c = document.createElement('canvas'), z = 3; c.width = 10 * z; c.height = 6 * z; const g = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (col[ch]) { g.fillStyle = col[ch]; g.fillRect(x * z, y * z, z, z); } }));
  return c;
})();
const coinImg = new Image(); coinImg.src = 'art/coin.webp';
function stepBoots(dt) {
  const dpr = window.devicePixelRatio || 1, W2 = bootsCv.clientWidth, H2 = bootsCv.clientHeight;
  if (bootsCv.width !== Math.round(W2 * dpr)) { bootsCv.width = Math.round(W2 * dpr); bootsCv.height = Math.round(H2 * dpr); }
  bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, W2, H2); bctx.imageSmoothingEnabled = false;
  const n = Math.min(36, S.lv.boots), t = performance.now() / 1000, cx = W2 / 2, cy = H2 / 2, R0 = Math.min(W2, H2) * 0.42, bw = Math.max(18, R0 * 0.2), bh = bw * 0.6;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + t * 0.12, p = (t * 0.3 + i / n * 3.7) % 1;
    const kick = still.matches || p > 0.1 ? 0 : Math.sin(p / 0.1 * Math.PI); // a quick jab inwards and back
    if (!still.matches && p < 0.05 && p + dt * 0.3 >= 0.05 && Math.random() < Math.min(1, 10 / n)) pops2.push({x: cx + Math.cos(a) * R0 * 0.55, y: cy + Math.sin(a) * R0 * 0.55, a, k: 0});
    const r = R0 - kick * bw * 0.45;
    bctx.save(); bctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); bctx.rotate(a + Math.PI);
    const bootArt = art('boot');
    if (bootArt) { const f = kick ? (p < 0.03 ? 1 : 2) : 0, fw = bootArt.width / 4, h2 = bw * bootArt.height / fw; bctx.imageSmoothingEnabled = true; bctx.drawImage(bootArt, f * fw, 0, fw, bootArt.height, -bw / 2, -h2 / 2, bw, h2); }
    else bctx.drawImage(BOOT, -bw / 2, -bh / 2, bw, bh);
    bctx.restore();
  }
  for (let i = pops2.length - 1; i >= 0; i--) { // coins hop out of the unicorn and fade
    const c = pops2[i]; c.k += dt / 0.6; if (c.k >= 1) { pops2.splice(i, 1); continue; }
    const e = ease(c.k), s2 = bw * 0.55; bctx.globalAlpha = 1 - c.k;
    if (coinImg.complete) bctx.drawImage(coinImg, 0, 0, coinImg.height, coinImg.height, c.x - Math.cos(c.a) * 6 * e - s2 / 2, c.y - 22 * e - s2 / 2, s2, s2);
    bctx.globalAlpha = 1;
  }
}
function crumbs(x, y) { // a few cookie crumbs fall away from the tap with a little gravity
  if (still.matches) return;
  for (let i = 0; i < 5; i++) {
    const c = document.createElement('span'); c.className = 'crumb'; c.style.left = x + 'px'; c.style.top = y + 'px'; kickFloats.appendChild(c);
    const dx = (Math.random() - 0.5) * 90, up = 20 + Math.random() * 30;
    c.animate([{transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1}, {transform: `translate(calc(-50% + ${dx * 0.6}px), calc(-50% - ${up}px)) rotate(${dx * 2}deg)`, opacity: 1, offset: .35},
      {transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${70 - up}px)) rotate(${dx * 4}deg)`, opacity: 0}], {duration: 620, easing: 'cubic-bezier(.33,0,.67,1)'}).onfinish = () => c.remove();
  }
}
let lastCoin = 0;
function coinToBank(x, y) { // one coin flies from the tap into the money counter, which then pulses
  const now = performance.now(); if (now - lastCoin < 90 || still.matches) return; lastCoin = now;
  const m = moneyEl.getBoundingClientRect(), tx = m.left + m.width / 2, ty = m.top + m.height / 2, c = document.createElement('span');
  c.className = 'coin'; document.body.appendChild(c);
  const lift = Math.min(80, Math.abs(ty - y) * 0.4 + 30);
  c.animate([{transform: `translate(${x - 11}px,${y - 11}px) scale(.9)`}, {transform: `translate(${(x + tx) / 2 - 11}px,${Math.min(y, ty) - lift - 11}px) scale(1.15)`, offset: .45}, {transform: `translate(${tx - 11}px,${ty - 11}px) scale(.7)`}],
    {duration: 520, easing: 'cubic-bezier(.45,0,.25,1)'}).onfinish = () => { c.remove(); moneyEl.animate([{transform: 'scale(1.06)'}, {transform: 'scale(1)'}], {duration: 180, easing: 'cubic-bezier(.23,1,.32,1)'}); };
}
kicker.addEventListener('pointerdown', e => {
  if (S.wall) return;
  e.preventDefault();
  const v = tapValue(); earn(v); S.taps++;
  const r = kickFloats.getBoundingClientRect();
  floatText('+' + fmt(v), (e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100, false, kickFloats);
  galloping = 0.18; crumbs(e.clientX - r.left, e.clientY - r.top);
  coinToBank(e.clientX, e.clientY);
  if (S.taps % 40 === 1) ticker(C.tapLines[(S.taps / 40 | 0) % C.tapLines.length].replace('{m}', '+' + fmt(v)));
  paintBank();
});
cv.addEventListener('pointerdown', e => {
  if (S.wall) return;
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left - OX) / SC, y = (e.clientY - r.top - OY) / SC;
  const inside = b => { const h = hitBox[b]; return h && x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h; };
  if (EV && inside(TARGET_PLOT[EV.e.target])) return openEvent();
  const hit = Object.keys(LOTS).sort((a, b) => LOTS[b].u0 + LOTS[b].v0 - LOTS[a].u0 - LOTS[a].v0).find(inside);
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
  const coin = '<i class="ico-coin" aria-hidden="true"></i>';
  if (tab === 'club') {
    // Cookie Clicker style store: every row is one big button. Buildings you can't reach yet stay a "???" silhouette.
    const reach = Math.max(1, ...C.buildings.map((b, i) => S.lv[b.id] ? i + 1 : 0)); // owned ones plus the next one
    panel.innerHTML = `<div class="store-head"><span>Club store</span><b>${fmt(r.total)}/s</b></div>` + C.buildings.map((b, i) => {
      const lv = S.lv[b.id], c = cost(b.id), hidden = i > reach;
      if (hidden) return `<div class="shop-row hidden-row"><span class="thumb q">?</span><div class="mid-col"><h3>???</h3><p class="price">${coin}${fmt(c)}</p></div><b class="owned"></b></div>`;
      const th = b.id === 'boots' ? '<span class="thumb boot-thumb"></span>' : `<img class="thumb${lv ? '' : ' unbuilt'}" src="art/building-${b.id}-${Math.max(1, stageOf(b.id))}.webp" alt="">`;
      const next = LOTS[b.id] && lv ? C.stages.find(t => t > lv) : null, prev = [...C.stages].reverse().find(t => t <= lv) || 0;
      const info = lv ? `<span class="earn">+${fmt(r[b.id])}/s</span>${next ? `<span class="stage" title="New look at level ${next}"><i style="width:${Math.round((lv - prev) / (next - prev) * 100)}%"></i></span>` : ''}` : `<span class="blurb">${esc(b.blurb)}</span>`;
      return `<button type="button" class="shop-row" id="row-${b.id}" data-buy="${b.id}" data-cost="${c}">${th}<div class="mid-col"><h3>${esc(b.name)}</h3><p class="price">${coin}${fmt(c)}</p>${info}</div><b class="owned">${lv || ''}</b></button>`;
    }).join('') + `<div class="locked-head">Full game · ${C.later.length} more to build</div>` + C.later.map(n => `<div class="shop-row locked-row"><span class="thumb lock" aria-hidden="true"></span><div class="mid-col"><h3>${esc(n)}</h3><p class="price">Locked</p></div><b class="owned"></b></div>`).join('');
    if (focus) { const row = $('row-' + focus); if (row) { row.scrollIntoView({block: 'nearest', behavior: 'smooth'}); row.animate([{outline: '3px solid #f2c230'}, {outline: '3px solid transparent'}], {duration: 900}); } }
  } else if (tab === 'upgrades') {
    const list = availableUps().sort((a, b) => a.u.cost - b.u.cost);
    panel.innerHTML = list.length ? `<div class="store-head"><span>Upgrades</span><b>${list.length} available</b></div>` + list.map(({u, i}) => `<button type="button" class="shop-row" data-up="${i}" data-cost="${u.cost}">${u.b === 'boots' ? '<span class="thumb boot-thumb"></span>' : `<img class="thumb" src="art/building-${u.b}-${Math.max(1, stageOf(u.b))}.webp" alt="">`}<div class="mid-col"><h3>${esc(u.name)}</h3><p class="price">${coin}${fmt(u.cost)}</p><span class="earn">${u.what === 'tap' ? 'Kicks' : u.what === 'sales' ? 'Player sales' : esc(B[u.b].name)} ${u.mult >= 2 ? 'x' + u.mult : '+' + Math.round((u.mult - 1) * 100) + '%'}</span></div><b class="owned up">${u.mult >= 2 ? 'x' + u.mult : '+' + Math.round((u.mult - 1) * 100) + '%'}</b></button>`).join('')
      : '<p class="empty">Nothing to buy yet. Level up your buildings and upgrades turn up here.</p>';
    panel.innerHTML += `<div class="locked-head">Full game · 60+ more upgrades</div>` + C.laterUps.map(n => `<div class="shop-row locked-row"><span class="thumb lock" aria-hidden="true"></span><div class="mid-col"><h3>${esc(n)}</h3><p class="price">Locked</p></div><b class="owned"></b></div>`).join('');
  } else {
    const kept = S.stars.filter(s => s.kept);
    panel.innerHTML = kept.length ? `<div class="store-head"><span>Squad market</span><b>${fmt(kept.reduce((t, s) => t + starValue(s), 0))}</b></div>` + kept.map(s => {
      const st = C.stars[s.i], ch = starChange(s);
      return `<button type="button" class="shop-row star-row" data-star="${s.i}">${portrait(st)}<div class="mid-col"><h3>${esc(st.name)}</h3><p class="price">${coin}<span data-val="${s.i}">${fmt(starValue(s))}</span></p><span class="earn">${bonusText(st.bonus)}</span></div>
        <span class="trend ${ch >= 0 ? 'up' : 'down'}" data-trend="${s.i}">${spark(s.hist, 56, 26)}<b>${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(1)}%</b></span></button>`; }).join('')
      : '<p class="empty">The academy finds a star now and then. Keep him and his value goes up and down like a share price: sell at the top.</p>';
  }
  refreshButtons();
}
function portrait(st, hero) {
  const img = st.art && art(st.art);
  return img ? `<img class="${hero ? 'hero' : 'portrait'}" src="${img.src}" alt="">` : hero ? '' : `<span class="portrait init">${esc(st.name[0])}</span>`;
}
function bonusText(k) { return {tap: 'Tap money x2', tickets: 'Ticket income +50%', shop: 'Shop sales +50%', sales: 'Player sale prices +50%', transfer: 'Transfer office +50%', canteen: 'Everything +10% (keeps the canteen busy)'}[k]; }
function refreshButtons() {
  panel.querySelectorAll('[data-cost]').forEach(b => { const ok = S.money >= +b.dataset.cost; b.disabled = !ok; b.classList.toggle('can', ok); });
  const n = availableUps().filter(({u}) => S.money >= u.cost).length;
  $('upCount').textContent = n || ''; $('starCount').textContent = S.stars.filter(s => s.kept).length || '';
}
panel.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled || S.wall) return;
  if (b.dataset.buy) { const id = b.dataset.buy, c = cost(id); if (S.money < c) return; S.money -= c; S.lv[id]++; if (LOTS[id]) { celebrate(id); const [x, y] = plotPct(id); floatText(S.lv[id] === 1 ? 'BUILT!' : 'LEVEL ' + S.lv[id], x, y, true); } if (LOTS[id] && C.stages.includes(S.lv[id])) ticker(`${B[id].name} looks bigger and shinier!`); }
  else if (b.dataset.up) { const i = +b.dataset.up, u = C.upgrades[i]; if (S.money < u.cost || S.ups.includes(i)) return; S.money -= u.cost; S.ups.push(i); ticker(`${u.name}: ${u.joke}`); }
  else if (b.dataset.star) return starSheet(+b.dataset.star);
  else if (b.dataset.sell) { const i = +b.dataset.sell, s = S.stars.find(x => x.i === i && x.kept); if (!s) return; const p = starValue(s); s.kept = false; earn(p); ticker(`${C.stars[i].name} sold to ${club().name} for ${fmt(p)}.`); }
  save(); paintBank(); renderPanel();
  const again = b.dataset.buy && $('row-' + b.dataset.buy); // the row you just bought from gives a quick gold flash
  if (again && !still.matches) again.animate([{boxShadow: 'inset 0 0 0 3px #f2c230, 0 3px 0 #1a1030'}, {boxShadow: 'inset 0 0 0 0 #f2c230, 0 3px 0 #1a1030'}], {duration: 380, easing: 'cubic-bezier(.23,1,.32,1)'});
});

// ---------- academy sales and stars ----------
const club = () => C.clubs[Math.random() * C.clubs.length | 0];
const starPrice = () => Math.max(2000, rates().total * 150);
// ---------- the squad market: a kept star's value wanders like a share price (form, injuries, nights out) ----------
const starValue = s => starPrice() * (s.m || 1);
const starChange = s => { const h = s.hist || [1]; return h.length < 2 ? 0 : (h[h.length - 1] / h[h.length - 2] - 1) * 100; };
const NEWS_UP = ['{n} scores a bicycle kick in training. Value up.', '{n} trends worldwide for a celebration. Value up.', 'A Saudi club asks about {n}. Value up.', '{n} nutmegs the manager. Value up.'];
const NEWS_DOWN = ['{n} seen leaving a nightclub at 4am holding a traffic cone. Value down.', '{n} pulls a hamstring taking a selfie. Value down.', '{n} misses an open goal. From one yard. Value down.', '{n} has started a podcast. Value down.'];
let marketT = 0;
function marketTick(dt) {
  marketT += dt; if (marketT < 3) return; marketT = 0;
  for (const s of S.stars) {
    if (!s.kept) continue;
    if (!s.hist) { s.m = 1; s.hist = [1]; }
    let r = 0.004 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.09; // mostly small moves, a slight drift up
    if (Math.random() < 0.04) { // now and then a big story moves him 25-45%
      const up = Math.random() < 0.5, n = C.stars[s.i].name, pool = up ? NEWS_UP : NEWS_DOWN;
      r = (up ? 1 : -1) * (0.25 + Math.random() * 0.2); ticker(pool[Math.random() * pool.length | 0].replace('{n}', n), true);
    }
    s.m = Math.min(8, Math.max(0.08, s.m * Math.exp(r)));
    s.hist.push(s.m); if (s.hist.length > 60) s.hist.shift();
  }
  if (tab === 'stars') paintMarket();
  if (openStar >= 0) paintStarSheet();
}
function paintMarket() { // update numbers in place, no re-render, so a press on a row isn't lost
  for (const s of S.stars) {
    if (!s.kept) continue;
    const v = panel.querySelector(`[data-val="${s.i}"]`), t = panel.querySelector(`[data-trend="${s.i}"]`), ch = starChange(s);
    if (v) v.textContent = fmt(starValue(s));
    if (t) { t.className = 'trend ' + (ch >= 0 ? 'up' : 'down'); t.innerHTML = spark(s.hist, 56, 26) + `<b>${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(1)}%</b>`; }
  }
}
function spark(h, w, ht, big) { // a tiny pixel line chart of the price history
  const lo = Math.min(...h), hi = Math.max(...h), span = hi - lo || 1, n = Math.max(1, h.length - 1);
  const pts = h.map((m, i) => `${(i / n * w).toFixed(1)},${(ht - 3 - (m - lo) / span * (ht - 6)).toFixed(1)}`).join(' ');
  const up = h[h.length - 1] >= h[0], col = up ? '#1d7a45' : '#c8303a';
  return `<svg viewBox="0 0 ${w} ${ht}" width="${w}" height="${ht}" shape-rendering="crispEdges" aria-hidden="true">${big ? `<polygon points="0,${ht} ${pts} ${w},${ht}" fill="${col}" opacity=".12"/>` : ''}<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="${big ? 2.5 : 2}" stroke-linejoin="miter"/></svg>`;
}
let openStar = -1;
function starSheet(i) {
  openStar = i;
  const s = S.stars.find(x => x.i === i && x.kept), st = C.stars[i]; if (!s) return;
  modal(`<button type="button" class="sheet-x" data-act="hold" aria-label="Close">✕</button><div class="star-sheet">${portrait(st)}<div><span class="tag gold">SQUAD MARKET</span><h2>${esc(st.name)}</h2><p class="note">${esc(st.trait)}</p></div></div>
    <div class="chart" id="starChart"></div>
    <div class="choices"><button type="button" class="buy sell" data-act="sell" id="starSellBtn"></button><button type="button" class="buy" data-act="hold">Keep him<span>${bonusText(st.bonus)} while he stays</span></button></div>`, act => {
    openStar = -1;
    if (act === 'sell') { const p = starValue(s); s.kept = false; earn(p); ticker(`${st.name} sold to ${club().name} for ${fmt(p)}.`, true); save(); renderPanel(); }
  });
  paintStarSheet();
}
function paintStarSheet() {
  const s = S.stars.find(x => x.i === openStar && x.kept), box = $('starChart'), btn = $('starSellBtn'); if (!s || !box) return;
  const ch = (s.hist[s.hist.length - 1] / s.hist[0] - 1) * 100, hi = Math.max(...s.hist), lo = Math.min(...s.hist);
  box.innerHTML = spark(s.hist, 320, 120, true) + `<div class="chart-ax"><span>High ${fmt(starPrice() * hi)}</span><span class="${ch >= 0 ? 'up' : 'down'}">${ch >= 0 ? '▲' : '▼'} ${Math.abs(ch).toFixed(1)}% since signing</span><span>Low ${fmt(starPrice() * lo)}</span></div>`;
  btn.innerHTML = `Sell now for ${fmt(starValue(s))}<span>Price changes every 3 seconds</span>`;
}
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
    if (act === 'keep') { s.kept = true; s.m = 1; s.hist = [1]; ticker(`${st.name} joins the club. ${bonusText(st.bonus)}.`, true); }
    else { earn(p); ticker(`${st.name} sold to ${c.name} for ${fmt(p)}.`, true); }
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
    EV = {e, until: performance.now() + 75000, t0: performance.now() / 1000};
    S.nextEvent = 70 + Math.random() * 60;
    const b = $('eventBadge'); b.textContent = '⚠ Trouble! Tap'; b.hidden = false;
    ticker(e.see, true);
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
    if (act === 'fix') { if (S.money < fixCost) return; S.money -= fixCost; ticker(`${e.fix}. Sorted!`, true); end(); }
    else if (act === 'trade') { earn(payout); ticker(`${e.trade}: +${fmt(payout)}`, true); end(); }
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
// tapping outside a pop-up does nothing: every pop-up needs an answer from its own buttons. Escape works where there's a close button.
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modalEl.hidden) { const x = sheet.querySelector('.sheet-x'); if (x) x.click(); } });

// ---------- the club's name: set in the story, changed any time by tapping it ----------
let pendingName = '';
function setClub(n) { S.club = (n || '').trim().slice(0, 24) || 'Unicorner FC'; $('clubName2').textContent = S.club; document.title = S.club + ' · Unicorner Tycoon (demo)'; }
$('clubName2').addEventListener('click', () => {
  modal(`<button type="button" class="sheet-x" data-act="x" aria-label="Close">✕</button><h2>Rename the club</h2><label for="clubName">Club name</label><input id="clubName" maxlength="24" value="${esc(S.club)}" autocomplete="off">
    <div class="choices" style="margin-top:12px"><button type="button" class="buy" data-act="ok">Save</button></div>`, act => { if (act === 'ok') { setClub(pendingName); save(); } });
  pendingName = S.club; const i = $('clubName'); i.addEventListener('input', e => { pendingName = e.target.value; }); i.select();
});
// ---------- the story, once at the start ----------
function intro() {
  const pic = cookieUnicorn(0, 8).toDataURL();
  modal(`<img class="hero" src="${pic}" alt="" style="image-rendering:pixelated;height:auto;width:180px">
    <span class="tag">UNICORNER FC</span><h2>Your club is skint</h2>
    <p>You're the president of the worst club in the league. The floodlights run on a hamster and the striker is your uncle.</p>
    <p>Then a unicorn wandered onto the pitch. Every time someone kicks it, money falls out.</p>
    <label for="clubName">Name your club</label><input id="clubName" maxlength="24" value="${esc(S.club)}" autocomplete="off">
    <div class="choices" style="margin-top:12px"><button type="button" class="buy" data-act="go">Kick the unicorn</button></div>`, () => { S.intro = true; setClub(pendingName); save(); }, true);
  pendingName = S.club; $('clubName').addEventListener('input', e => { pendingName = e.target.value; });
}

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
// the big counter shows every cent ticking up (€12,345.67), then three decimals of millions and beyond (€5.012M)
function bigMoney(n) {
  if (n < 1e6) return '€' + n.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const u = ['M', 'B', 'T', 'Qa', 'Qi']; let i = 0; n /= 1e6;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return '€' + n.toFixed(3) + u[i];
}
function paintBank() { $('money').textContent = bigMoney(S.money); $('rate').textContent = fmt(rates().total) + ' per second'; }
let last = performance.now(), uiT = 0, saveT = 0, hinted = false;
function frame(now) {
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  const t = now / 1000;
  if (!S.wall) {
    earn((rates().total - academy().perSec) * dt);
    academyTick(dt); eventTick(dt); stepWalkers(dt); marketTick(dt);
    if (!document.hidden) S.play += dt;
    if (S.play >= DEMO_SECONDS && modalEl.hidden) wall();
  }
  draw(t, dt); stepUni(dt); stepBoots(dt);
  $('money').textContent = bigMoney(S.money); // every frame, so the cents roll
  uiT += dt; if (uiT > 0.2) { uiT = 0; paintBank(); refreshButtons(); }
  saveT += dt; if (saveT > 5) { saveT = 0; save(); }
  if (!S.lv.boots && S.money >= cost('boots') && !hinted) { hinted = true; ticker('You can afford a pair of boots: buy them in the Club tab.', true); }
  tickerT -= dt; if (tickerT < 0) news();
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else { last = performance.now(); offline(); } });
window.addEventListener('pagehide', save);
window.addEventListener('resize', resize);
if (window.ResizeObserver) new ResizeObserver(resize).observe(mid);

resize(); loadArt(); renderPanel(); paintBank(); setClub(S.club);
if (S.wall) (S.feedback ? thanks : wall)();
else if (!S.intro) intro();
else offline();
track('tycoon_open', {returning: S.earned > 0});
requestAnimationFrame(frame);
})();
