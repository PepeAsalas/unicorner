/* Unicorner Football Tycoon: demo. Everything runs in the browser; progress saves on this device.
   The only network calls are the feedback form and three analytics events (open, wall, feedback). */
(() => {
'use strict';
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

// ---------- the map (canvas) ----------
const W = 300, H = 360;
const PLOTS = {
  stadium: {x: 70, y: 14, w: 160, h: 100},
  shop: {x: 12, y: 136, w: 100, h: 78},
  transfer: {x: 188, y: 136, w: 100, h: 78},
  academy: {x: 12, y: 238, w: 112, h: 92},
  pitch: {x: 140, y: 232, w: 148, h: 104},
};
const TARGET_PLOT = {tap: 'pitch', pitch: 'pitch', sales: 'academy', transfer: 'transfer', shop: 'shop', tickets: 'stadium'};
const stageOf = b => S.lv[b] ? C.stages.filter(t => S.lv[b] >= t).length : 0;
const cv = $('map'), ctx = cv.getContext('2d');
let K = 2;
function resize() {
  const cssW = cv.parentElement.clientWidth;
  K = Math.max(1, Math.round(cssW / W * (window.devicePixelRatio || 1)));
  cv.width = W * K; cv.height = H * K; ctx.imageSmoothingEnabled = false;
}
// optional art from tycoon/art/ (ART_BRIEF.md); the procedural drawings are used until a file exists
const ART = {};
function loadArt() {
  for (const f of C.art || []) { const m = /^building-(\w+)-(\d)\.png$/.exec(f); if (!m) continue; const img = new Image(); img.onload = () => { ART[m[1] + m[2]] = img; }; img.src = 'art/' + f; }
}
const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const INK = '#1a1030';
function box(x, y, w, h, c) { R(x - 1, y - 1, w + 2, h + 2, INK); R(x, y, w, h, c); }
function text(s, x, y, size, c, align) { ctx.font = `${size}px Silkscreen, monospace`; ctx.textAlign = align || 'center'; ctx.fillStyle = c; ctx.fillText(s, x, y); }

function drawGround(t) {
  for (let y = 0; y < H; y += 20) R(0, y, W, 20, (y / 20) % 2 ? '#5aae64' : '#62b86c');
  // paths
  R(128, 0, 44, H, '#e2c98f'); R(0, 222, W, 12, '#e2c98f'); R(0, 120, W, 12, '#e2c98f');
  for (let y = 4; y < H; y += 14) R(148, y, 4, 6, '#d4b878');
}
function drawSale(p, b) {
  R(p.x + 6, p.y + 10, p.w - 12, p.h - 20, '#9b7b4c');
  for (let i = 0; i < 6; i++) R(p.x + 12 + i * ((p.w - 30) / 5), p.y + 18 + (i % 2) * 20, 6, 4, '#7d6038');
  const sx = p.x + p.w / 2 - 26, sy = p.y + p.h / 2 - 14;
  box(sx, sy, 52, 22, '#fbf3dc'); R(sx + 24, sy + 22, 4, 14, INK);
  text('FOR', sx + 26, sy + 9, 7, INK); text('SALE', sx + 26, sy + 18, 7, '#e3262f');
}
function house(p, st, wall, roof, t) {
  const s = 0.55 + 0.12 * st, w = p.w * s, h = p.h * s * 0.8, x = p.x + (p.w - w) / 2, y = p.y + p.h - h - 8;
  box(x, y, w, h, wall);
  R(x - 3, y - 10, w + 6, 10, INK); R(x - 2, y - 9, w + 4, 8, roof);
  const n = 1 + st;
  for (let i = 0; i < n; i++) { const wx = x + 6 + i * ((w - 18) / Math.max(1, n - 1 || 1)); R(wx, y + 8, 6, 6, '#bfe8ff'); if (h > 30) R(wx, y + 20, 6, 6, '#bfe8ff'); }
  R(x + w / 2 - 5, y + h - 12, 10, 12, '#7a4a2a');
  if (st >= 2) { R(x + w - 4, y - 26, 2, 16, INK); R(x + w - 2, y - 26 + Math.round(Math.sin(t * 6)), 10, 6, '#e3262f'); }
  if (st >= 4) { R(x - 3, y - 12, w + 6, 3, '#f2c230'); R(x + w / 2 - 6, y - 22, 12, 10, '#f2c230'); }
  return {x, y, w, h};
}
function drawStadium(p, st, t) {
  const s = 0.6 + 0.1 * st, w = p.w * s, h = p.h * s, x = p.x + (p.w - w) / 2, y = p.y + (p.h - h) / 2;
  box(x, y, w, h, st >= 4 ? '#f2c230' : '#b9b3c9');
  R(x + 8, y + 8, w - 16, h - 16, '#4da35a');
  R(x + w / 2 - 1, y + 8, 2, h - 16, '#e8f5e9');
  const fans = Math.min(40, 6 + st * 8), cols = ['#e3262f', '#3fc1ff', '#fbf3dc', '#ff6fa8', '#f2c230'];
  for (let i = 0; i < fans; i++) {
    const side = i % 4, k = (i >> 2) / (fans / 4), bob = Math.round(Math.sin(t * 8 + i) * 0.6);
    const fx = side < 2 ? x + 3 + k * (w - 6) : (side === 2 ? x + 2 : x + w - 5), fy = side < 2 ? (side ? y + h - 5 : y + 2) : y + 3 + k * (h - 6);
    R(fx, fy + bob, 3, 3, cols[i % cols.length]);
  }
  if (st >= 3) { R(x - 4, y - 4, w + 8, 4, INK); R(x - 2, y - 3, w + 4, 2, '#d8d2e6'); }
  if (st >= 4) { for (let i = 0; i < 4; i++) R(x - 6 + i * (w + 8) / 3, y - 14, 3, 12, INK); }
}
let ballBoost = 0;
function drawPitch(p, st, t) {
  const s = 0.6 + 0.07 * st, w = p.w * s, h = p.h * s, x = p.x + (p.w - w) / 2, y = p.y + (p.h - h) / 2 - 4;
  box(x, y, w, h, st >= 2 ? '#3f9c4c' : '#7a8f3a');
  if (st === 1) for (let i = 0; i < 8; i++) R(x + 6 + (i * 17) % (w - 12), y + 6 + (i * 11) % (h - 12), 6, 4, '#8b6b3a');
  R(x + 4, y + 4, w - 8, 1, '#e8f5e9'); R(x + 4, y + h - 5, w - 8, 1, '#e8f5e9'); R(x + w / 2, y + 4, 1, h - 8, '#e8f5e9');
  const gc = st >= 4 ? '#f2c230' : '#fff';
  R(x - 2, y + h / 2 - 9, 3, 18, gc); R(x + w - 1, y + h / 2 - 9, 3, 18, gc);
  if (st === 1) { R(x + 10, y + h - 14, 3, 5, '#ff8c1a'); R(x + 20, y + h - 14, 3, 5, '#ff8c1a'); }
  if (st >= 3) for (const lx of [x - 6, x + w + 3]) { R(lx, y - 10, 3, 18, INK); R(lx - 2, y - 13, 7, 4, '#fff7a8'); }
  drawPlayer(x + w / 2 - 4, y + h / 2 - 2, t);
}
// the keepy-uppies player (the tap target)
function drawPlayer(px, py, t) {
  R(px, py, 8, 10, '#e3262f'); R(px + 1, py - 7, 6, 7, '#f1c27d'); R(px + 1, py + 10, 2, 6, INK); R(px + 5, py + 10, 2, 6, INK);
  const amp = 10 + ballBoost * 14, by = py + 12 - Math.abs(Math.sin(t * 5)) * amp;
  R(px + 6, by, 5, 5, '#fff'); R(px + 7, by + 1, 2, 2, INK);
  pitchHit = {x: px - 18, y: py - 30, w: 44, h: 52};
}
let pitchHit = {x: 0, y: 0, w: 0, h: 0};
// walking supporters and academy kids
const walkers = [];
function stepWalkers(dt, t) {
  const want = S.lv.stadium ? Math.min(14, 2 + S.lv.stadium) : 0;
  if (walkers.length < want && Math.random() < dt * 1.5) walkers.push({p: 0, c: ['#e3262f', '#3fc1ff', '#ff6fa8', '#f2c230'][walkers.length % 4], sp: 0.08 + Math.random() * 0.06});
  for (let i = walkers.length - 1; i >= 0; i--) { walkers[i].p += walkers[i].sp * dt; if (walkers[i].p >= 1) walkers.splice(i, 1); }
}
function drawWalkers(t) {
  for (const w of walkers) {
    const y = H - 4 - w.p * (H - 120), x = 140 + Math.sin(w.p * 30) * 2, leg = Math.sin(t * 14 + w.p * 50) > 0;
    R(x, y - 8, 5, 6, w.c); R(x + 1, y - 12, 3, 4, '#f1c27d'); R(x + (leg ? 0 : 3), y - 2, 2, 3, INK);
  }
  const kids = Math.min(4, Math.ceil(S.lv.academy / 5));
  const p = PLOTS.academy;
  for (let i = 0; i < kids; i++) {
    const a = t * 1.6 + i * 1.7, x = p.x + p.w / 2 + Math.cos(a) * 34, y = p.y + p.h - 12 + Math.sin(a) * 5;
    R(x, y - 6, 4, 5, '#3fc1ff'); R(x, y - 9, 4, 3, '#f1c27d'); R(x + (Math.sin(t * 16 + i) > 0 ? 0 : 2), y - 1, 2, 2, INK);
  }
}
function draw(t) {
  ctx.setTransform(K, 0, 0, K, 0, 0);
  drawGround(t);
  for (const [b, p] of Object.entries(PLOTS)) {
    const st = stageOf(b);
    if (!st) { drawSale(p, b); }
    else if (ART[b + st]) { const img = ART[b + st], s = Math.min(p.w / img.width, p.h / img.height); ctx.drawImage(img, p.x + (p.w - img.width * s) / 2, p.y + (p.h - img.height * s) / 2, img.width * s, img.height * s); }
    else if (b === 'stadium') drawStadium(p, st, t);
    else if (b === 'pitch') drawPitch(p, st, t);
    else house(p, st, {academy: '#fbf3dc', transfer: '#cfd8e6', shop: '#ffd1e3'}[b], {academy: '#3fc1ff', transfer: '#4a1c86', shop: '#e3262f'}[b], t);
    if (b === 'pitch' && ART[b + st]) drawPlayer(p.x + p.w / 2 - 4, p.y + p.h / 2 - 2, t);
    text(B[b].name.toUpperCase() + (S.lv[b] ? ' ' + S.lv[b] : ''), p.x + p.w / 2, p.y + p.h - 1, 6, INK);
  }
  drawWalkers(t);
  if (EV) {
    const p = PLOTS[TARGET_PLOT[EV.e.target]], on = Math.sin(t * 8) > 0;
    ctx.strokeStyle = on ? '#e3262f' : '#fff'; ctx.lineWidth = 2; ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);
    box(p.x + p.w - 16, p.y + 4, 12, 14, '#e3262f'); text('!', p.x + p.w - 10, p.y + 15, 10, '#fff');
  }
}

// ---------- floats and ticker ----------
const floats = $('floats');
function floatText(s, xPct, yPct, big) {
  const el = document.createElement('div'); el.className = 'float' + (big ? ' big' : ''); el.textContent = s;
  el.style.left = xPct + '%'; el.style.top = yPct + '%'; floats.appendChild(el); setTimeout(() => el.remove(), 950);
}
const plotPct = b => { const p = PLOTS[b]; return [(p.x + p.w / 2) / W * 100, (p.y + p.h / 3) / H * 100]; };
let tickerT = 0;
function ticker(s) { $('ticker').textContent = s; tickerT = 6; }

// ---------- tapping the map ----------
cv.addEventListener('pointerdown', e => {
  if (S.wall) return;
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
  if (EV) { const p = PLOTS[TARGET_PLOT[EV.e.target]]; if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return openEvent(); }
  const h = pitchHit;
  if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
    const v = tapValue(); earn(v); S.taps++; ballBoost = 1;
    floatText('+' + fmt(v), x / W * 100, y / H * 100);
    if (S.taps % 9 === 1) ticker(C.tapLines[(S.taps / 9 | 0) % C.tapLines.length].replace('{m}', fmt(v)));
    paintBank(); return;
  }
  for (const [b, p] of Object.entries(PLOTS)) if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) { tab = 'club'; renderPanel(b); return; }
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
      return `<div class="row" id="row-${b.id}"><div><h3>${esc(b.name)}<small>${lv ? 'LEVEL ' + lv : 'NOT BUILT'}</small></h3><p>${esc(b.blurb)}</p>${earnLine ? `<div class="earn">${earnLine}</div>` : ''}</div>
        <button type="button" class="buy" data-buy="${b.id}" data-cost="${c}">${lv ? 'Upgrade' : 'Build'}<br>${fmt(c)}</button></div>`;
    }).join('');
    if (focus) { const row = $('row-' + focus); if (row) { row.scrollIntoView({block: 'nearest', behavior: 'smooth'}); row.animate([{background: '#fff3b0'}, {background: '#fff'}], {duration: 900}); } }
  } else if (tab === 'upgrades') {
    const list = availableUps().sort((a, b) => a.u.cost - b.u.cost);
    panel.innerHTML = list.length ? list.map(({u, i}) => `<div class="row"><div><h3>${esc(u.name)}</h3><p>${esc(B[u.b].name)}: ${u.what === 'tap' ? 'tap money' : u.what === 'sales' ? 'player sale prices' : 'income'} ${u.mult >= 2 ? 'x' + u.mult : '+' + Math.round((u.mult - 1) * 100) + '%'}</p><p><i>${esc(u.joke)}</i></p></div>
      <button type="button" class="buy" data-up="${i}" data-cost="${u.cost}">Buy<br>${fmt(u.cost)}</button></div>`).join('')
      : '<p class="empty">No upgrades right now. Level up your buildings to unlock more.</p>';
  } else {
    const kept = S.stars.filter(s => s.kept);
    panel.innerHTML = kept.length ? kept.map(s => { const st = C.stars[s.i]; return `<div class="row"><div><h3>${esc(st.name)}</h3><p>${esc(st.trait)}</p><div class="earn">${bonusText(st.bonus)}</div></div>
      <button type="button" class="buy sell" data-sell="${s.i}" data-cost="0">Sell<br>${fmt(starPrice())}</button></div>`; }).join('')
      : '<p class="empty">Your academy finds a star now and then. Keep them for a bonus, or sell them for a fortune.</p>';
  }
  refreshButtons();
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
  modal(`<span class="tag gold">WONDERKID!</span><h2>${esc(st.name)}</h2><p>${esc(st.trait)}</p>
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
    academyTick(dt); eventTick(dt); stepWalkers(dt, t);
    if (!document.hidden) S.play += dt;
    if (S.play >= DEMO_SECONDS && modalEl.hidden) wall();
  }
  ballBoost = Math.max(0, ballBoost - dt * 1.5);
  draw(t);
  uiT += dt; if (uiT > 0.2) { uiT = 0; paintBank(); refreshButtons(); }
  saveT += dt; if (saveT > 5) { saveT = 0; save(); }
  if (tickerT > 0) { tickerT -= dt; }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else { last = performance.now(); offline(); } });
window.addEventListener('pagehide', save);
window.addEventListener('resize', resize);

resize(); loadArt(); renderPanel(); paintBank();
if (S.wall) (S.feedback ? thanks : wall)();
else offline();
track('tycoon_open', {returning: S.earned > 0});
requestAnimationFrame(frame);
})();
