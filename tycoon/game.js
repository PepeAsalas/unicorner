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
function tree(c, u, v, s = 1) {
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
  c.fillStyle = '#4f8d36'; c.fillRect(vx, vy, vw, vh);
  for (let u = -60; u < 80; u += 2) quad(c, u, -60, u + 1, 80, '#548f39'); // mowing stripes
  // roads, kerbs first so the paving sits on top
  for (const k of ROADS) { quad(c, k - 1.1, -60, k + 1.1, 80, '#a89a72'); quad(c, -60, k - 1.1, 80, k + 1.1, '#a89a72'); }
  for (const k of ROADS) { quad(c, k - 1, -60, k + 1, 80, '#e2d4a6'); quad(c, -60, k - 1, 80, k + 1, '#e2d4a6'); }
  // the far corners of the grounds: a pond, a little park, the car park and the entrance plaza
  quad(c, 14.2, 0.2, 17.8, 3.8, '#4a8a34');
  const [px, py] = P(16, 2); c.fillStyle = '#2d5e8a'; c.beginPath(); c.ellipse(px, py, 20, 10, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#4f9ad0'; c.beginPath(); c.ellipse(px, py - 1, 18, 8.4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(px - 8, py - 4, 6, 1.2); c.fillRect(px + 3, py + 1, 5, 1.2);
  quad(c, 14.2, 7.2, 17.8, 10.8, '#6b6878');
  for (let i = 0; i < 4; i++) { const [ax, ay] = P(14.6, 7.6 + i * 0.85), [bx, by] = P(16.2, 7.6 + i * 0.85); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); }
  quad(c, 14.2, 14.2, 17.8, 17.8, '#d8c99c'); quad(c, 15.2, 15.2, 16.8, 16.8, '#c9b685');
  // trees: a few in the park corner and plenty outside the grounds
  for (const [u, v] of [[1, 15], [2.6, 14.8], [1.6, 16.6], [3.2, 16.8], [0.8, 17.6]]) tree(c, u, v, 0.9);
  const trees = [];
  for (let u = -30; u < 44; u++) for (let v = -30; v < 44; v++) {
    const inside = u > -1.5 && u < 19 && v > -1.5 && v < 19 || u > -4.5 && u < 4.5 && v > -4.5 && v < 4.5, onRoad = ROADS.some(k => Math.abs(u + 0.5 - k) < 2.2 || Math.abs(v + 0.5 - k) < 2.2);
    if (!inside && !onRoad && hash(u, v) < 0.09) trees.push([u + hash(v, u) * 0.6, v + hash(u + 3, v) * 0.6]);
  }
  trees.sort((a, b) => a[0] + a[1] - b[0] - b[1]).forEach(([u, v]) => tree(c, u, v, 0.8 + hash(u, v) * 0.35));
}

// ---------- buildings: art sits on its plot; a quick settle when it is built or grows ----------
const hitBox = {}, pops = {};
const ease = k => 1 - Math.pow(1 - k, 3);
function popScale(b, t) { // squash and settle, 360 ms, only after a purchase
  const p = pops[b]; if (!p) return [1, 1];
  const k = (t - p.t) / 0.36; if (k >= 1) { delete pops[b]; return [1, 1]; }
  const big = p.big ? 1 : 0.4, s = Math.sin(k * Math.PI * 2) * (1 - ease(k)) * 0.07 * big;
  return [1 + s, 1 - s];
}
function drawLot(b, t) {
  const L = LOTS[b], n = size(b), st = stageOf(b), img = st && art(`building-${b}-${st}`), [cx] = lotCentre(b), [, fy] = lotFront(b);
  if (!img) { // empty plot for sale
    quad(ctx, L.u0 + 0.35, L.v0 + 0.35, L.u0 + n - 0.35, L.v0 + n - 0.35, '#9a6f45');
    for (let i = 1; i < n * 1.5; i++) { const [ax, ay] = P(L.u0 + 0.35 + i * 0.55, L.v0 + 0.5), [bx, by] = P(L.u0 + 0.35 + i * 0.55, L.v0 + n - 0.5); ctx.strokeStyle = '#86603b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
    for (const [u, v] of [[0.35, 0.35], [n - 0.35, 0.35], [0.35, n - 0.35], [n - 0.35, n - 0.35]]) { const [x, y] = P(L.u0 + u, L.v0 + v); R(x - 0.8, y - 5, 1.6, 5, '#f3ead0'); }
    const [x, y] = lotCentre(b);
    R(x - 1, y - 16, 2.2, 16, INK); R(x - 15, y - 28, 30, 14, INK); R(x - 14, y - 27, 28, 12, '#fbf3dc');
    ctx.font = '5px Silkscreen, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText('FOR', x, y - 21.5); ctx.fillStyle = '#e3262f'; ctx.fillText('SALE', x, y - 16);
    hitBox[b] = {x: x - 26, y: y - 30, w: 52, h: 46};
    return;
  }
  const w = 2 * n * A, h = img.height * w / img.width, [sx, sy] = popScale(b, t);
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
function celebrate(b) { const big = S.lv[b] === 1 || C.stages.includes(S.lv[b]); pops[b] = {t: performance.now() / 1000, big}; puff(b, big); if (big) lampsFrom = performance.now() / 1000; }

// ---------- moving parts painted by ChatGPT: corner flags and floodlights ----------
// Positions are fractions of the building image (x, y). Flags stand on (x, y) with a pole h tall; lamps are centred on (x, y), w wide.
const ANIM = {
  'building-stadium-1': {
    flags: [[0.5003, 0.894], [0.1769, 0.636], [0.8237, 0.636], [0.5003, 0.351]], pole: 0.046,
    lamps: [[0.4997, 0.034, 0.04], [0.0715, 0.302, 0.03], [0.9282, 0.3, 0.03]],
  },
};
let lampsFrom = performance.now() / 1000 - 99, flick = {i: -1, until: 0, next: 6};
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
      const on = lampOn(i, t), dw = lw * w * 1.35, dh = dw * fh / fw, cx = x0 + lx * w, cy = y0 + ly * h;
      ctx.drawImage(lamp, on ? fw : 0, 0, fw, fh, cx - dw / 2, cy - dh / 2, dw, dh);
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, dw * 1.3); g.addColorStop(0, 'rgba(255,240,180,.35)'); g.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = g; ctx.fillRect(cx - dw * 1.3, cy - dw * 1.3, dw * 2.6, dw * 2.6); ctx.restore(); }
    });
  }
  if (flag) {
    const fw = flag.width / 4, fh = flag.height, gust = Math.sin(t * 0.37) + Math.sin(t * 0.23 + 1);
    const seq = gust < -1.1 ? [0, 1, 0, 1] : [1, 2, 3, 2], fps = gust < -1.1 ? 3 : 7;
    fx.flags.forEach(([fxp, fyp], i) => {
      const f = seq[Math.floor(t * fps + i * 0.6) % 4], dh = fx.pole * h * 2.2, dw = dh * fw / fh, px = x0 + fxp * w, py = y0 + fyp * h;
      ctx.drawImage(flag, f * fw, 0, fw, fh, px - dw * 0.075, py - dh, dw, dh); // the pole sits at the left edge of each frame
    });
  }
}

// ---------- people: they walk along the roads to a building's door ----------
// sprite() draws a character standing at (x, y) on the ground: a two-beat step bob and a slight lean while walking
function sprite(name, x, y, h, t, opts = {}) {
  const img = art(name); if (!img) return;
  const w = img.width * h / img.height, ph = t * 9 + (opts.seed || 0), lift = opts.walk ? Math.abs(Math.sin(ph)) * 1.4 : 0;
  ctx.save(); ctx.globalAlpha = opts.alpha ?? 1; ctx.translate(x, y);
  ctx.fillStyle = 'rgba(20,40,10,.28)'; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.translate(0, -lift); if (opts.walk) ctx.rotate(Math.sin(ph) * 0.05);
  if (opts.flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
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
const WHO = {stadium: 'char-fan', shop: 'char-fan', transfer: 'char-agent', pitch: 'char-youth', academy: 'char-youth'};
function spawn(b, from) {
  const start = from || [ROADS[Math.random() * 2 | 0], EDGE[1]].sort(() => Math.random() - 0.5);
  walkers.push({who: WHO[b], path: route(start, LOTS[b].door), i: 0, k: 0, v: 1.5 + Math.random() * 0.6, seed: Math.random() * 9, life: 0, out: 0});
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
    w.k += w.v * dt / len; if (w.k >= 1) { w.k = 0; w.i++; }
  }
}
function walkerPos(w) {
  const a = w.path[Math.min(w.i, w.path.length - 1)], b = w.path[Math.min(w.i + 1, w.path.length - 1)];
  const u = a[0] + (b[0] - a[0]) * w.k, v = a[1] + (b[1] - a[1]) * w.k, side = (w.seed % 1 - 0.5) * 1.1; // keep people off the exact centre line
  const [x, y] = P(u + (a[0] === b[0] ? side : 0), v + (a[1] === b[1] ? side : 0));
  const [bx] = P(b[0], b[1]), [ax] = P(a[0], a[1]);
  return {x, y, d: u + v, flip: bx < ax};
}
function drawPeople(t) {
  const list = [];
  for (const w of walkers) {
    const p = walkerPos(w), alpha = Math.min(1, w.life / 0.25) * (1 - w.out / 0.25);
    list.push({d: p.d, f: () => sprite(w.who, p.x, p.y, 15, t, {walk: w.out === 0, flip: p.flip, seed: w.seed, alpha})});
  }
  if (S.lv.academy) { // youth players doing drills in front of the academy
    const L = LOTS.academy, kids = Math.min(3, Math.ceil(S.lv.academy / 6));
    for (let i = 0; i < kids; i++) {
      const k = (Math.sin(t * 0.7 + i * 2.1) + 1) / 2, u = L.u0 + 4.5, v = L.v0 + 0.8 + i * 1.1 + k * 0.6, [x, y] = P(u, v);
      list.push({d: u + v, f: () => sprite('char-youth', x, y, 13, t, {walk: true, flip: Math.cos(t * 0.7 + i * 2.1) > 0, seed: i})});
    }
  }
  if (S.lv.pitch >= 5) { const [x, y] = P(LOTS.pitch.u0 + 4.6, LOTS.pitch.v0 + 2.6); list.push({d: 21.2, f: () => sprite('char-coach', x, y, 15, t, {flip: Math.sin(t * 0.4) > 0})}); }
  if (EV && EV.e.target === 'transfer') { // agents queue at the transfer office door
    for (let i = 0; i < 5; i++) { const [x, y] = P(9 + (i - 2) * 0.55, 4.7 + (i % 2) * 0.5); list.push({d: 13.7, f: () => sprite('char-agent', x, y, 14, t, {walk: true, seed: i * 1.7, flip: i % 2})}); }
  }
  if (S.lv.shop >= 10) { // the mascot does laps of the grounds
    const k = (t / 48) % 1, loop = [[5.5, 5.5], [12.5, 5.5], [12.5, 12.5], [5.5, 12.5], [5.5, 5.5]], seg = Math.floor(k * 4), f = k * 4 - seg;
    const a = loop[seg], b = loop[seg + 1], u = a[0] + (b[0] - a[0]) * f, v = a[1] + (b[1] - a[1]) * f, [x, y] = P(u, v);
    list.push({d: u + v, f: () => sprite('char-mascot', x, y, 17, t, {walk: true, flip: P(...b)[0] < P(...a)[0], seed: 3})});
  }
  for (const b of Object.keys(LOTS)) { const L = LOTS[b]; list.push({d: L.u0 + L.v0 + size(b), f: () => drawLot(b, t)}); }
  list.sort((a, b) => a.d - b.d).forEach(o => o.f());
}

// ---------- events: a prop over the building, a pin to tap, and the odd plane ----------
const PROP = {plague: 'event-plague-cloud', airport: 'event-plane', haalunch: 'event-sold-out-sign', misprint: 'event-misprint-shirts', mascot: 'event-banana'};
function eventProp(e) { const t = e.title.toLowerCase(); return e.prop || (t.includes('plague') ? PROP.plague : t.includes('airport') ? PROP.airport : t.includes('haalunch') ? PROP.haalunch : t.includes('misprint') ? PROP.misprint : t.includes('mascot') ? PROP.mascot : null); }
function drawEvent(t) {
  if (!EV) return;
  const b = TARGET_PLOT[EV.e.target], hb = hitBox[b]; if (!hb) return;
  const [cx, cy] = lotCentre(b), prop = eventProp(EV.e), img = prop && art(prop);
  if (prop === PROP.airport && img) { // flies over the grounds, its shadow on the grass
    const k = (t / 6) % 1, x = -40 + k * (W + 80), y = 30 + k * 40, w = 54;
    ctx.fillStyle = 'rgba(20,40,10,.18)'; ctx.beginPath(); ctx.ellipse(x + 10, y + 70, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(img, x - w / 2, y - w * img.height / img.width / 2, w, w * img.height / img.width);
  } else if (img) { const w = 40, h = w * img.height / img.width; ctx.drawImage(img, cx - w / 2, hb.y + 6 - h + Math.sin(t * 2.2) * 2, w, h); }
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
function draw(t, dt) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(ground, 0, 0);
  toWorld(ctx);
  drawPeople(t);
  drawPuffs(dt);
  for (const b of Object.keys(LOTS)) if (!S.lv[b]) { const [x, y] = lotFront(b); label(B[b].name.toUpperCase(), x, y - 6); } // names only on empty plots
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
function ticker(s) { $('tickerText').textContent = s; tickerT = 9; }
function news() {
  const pool = [...C.tapLines.map(l => l.replace('+{m} ', '')), ...C.clubs.map(c => `${c.name}: ${c.line}`), ...C.stars.map(s => `${s.name} ${s.trait[0].toLowerCase()}${s.trait.slice(1)}`)];
  ticker(pool[Math.random() * pool.length | 0]);
}

// ---------- tapping: the keepy-uppies player (left) and the islands (map) ----------
const kicker = $('kicker'), body = kicker.querySelector('.body'), ball = $('ball'), kickFloats = $('floats'), moneyEl = $('money');
const still = matchMedia('(prefers-reduced-motion: reduce)');
// the ball juggles on its own with real gravity; a tap kicks it higher. Units: player heights and seconds.
const BALL = {y: 0, vy: 0, spin: 0, g: 3.2, idle: 0.95, kick: 1.8};
function stepBall(dt) {
  if (still.matches) { ball.style.transform = ''; return; }
  BALL.vy -= BALL.g * dt; BALL.y += BALL.vy * dt; BALL.spin += BALL.vy * dt * 260;
  if (BALL.y <= 0) { BALL.y = 0; BALL.vy = BALL.idle; nudge(0.015); }
  ball.style.transform = `translateY(${-BALL.y * body.clientHeight}px) rotate(${BALL.spin}deg)`;
}
const nudge = k => body.animate([{transform: 'scale(1,1)'}, {transform: `scale(${1 + k},${1 - k})`, offset: .35}, {transform: 'scale(1,1)'}], {duration: 160, easing: 'cubic-bezier(.23,1,.32,1)'});
let lastCoin = 0;
function coinToBank(x, y) { // one coin flies from the tap into the money counter, which then pulses
  const now = performance.now(); if (now - lastCoin < 90 || still.matches) return; lastCoin = now;
  const m = moneyEl.getBoundingClientRect(), tx = m.left + m.width / 2, ty = m.top + m.height / 2, c = document.createElement('span');
  c.className = 'coin'; document.body.appendChild(c);
  const lift = Math.min(80, Math.abs(ty - y) * 0.4 + 30);
  c.animate([{transform: `translate(${x - 6}px,${y - 6}px) scale(.9)`}, {transform: `translate(${(x + tx) / 2 - 6}px,${Math.min(y, ty) - lift - 6}px) scale(1.15)`, offset: .45}, {transform: `translate(${tx - 6}px,${ty - 6}px) scale(.7)`}],
    {duration: 520, easing: 'cubic-bezier(.45,0,.25,1)'}).onfinish = () => { c.remove(); moneyEl.animate([{transform: 'scale(1.06)'}, {transform: 'scale(1)'}], {duration: 180, easing: 'cubic-bezier(.23,1,.32,1)'}); };
}
kicker.addEventListener('pointerdown', e => {
  if (S.wall) return;
  e.preventDefault();
  const v = tapValue(); earn(v); S.taps++;
  const r = kickFloats.getBoundingClientRect();
  floatText('+' + fmt(v), (e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100, false, kickFloats);
  nudge(0.05); BALL.vy = Math.max(BALL.vy, BALL.kick);
  coinToBank(e.clientX, e.clientY);
  if (S.taps % 9 === 1) ticker(C.tapLines[(S.taps / 9 | 0) % C.tapLines.length].replace('{m}', fmt(v)));
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
  if (b.dataset.buy) { const id = b.dataset.buy, c = cost(id); if (S.money < c) return; S.money -= c; S.lv[id]++; celebrate(id); const [x, y] = plotPct(id); floatText(S.lv[id] === 1 ? 'BUILT!' : 'LEVEL ' + S.lv[id], x, y, true); if (C.stages.includes(S.lv[id])) ticker(`${B[id].name} looks bigger and shinier!`); }
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
    stepBall(dt);
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
