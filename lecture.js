/* Lecture mode (desktop only): press Esc twice quickly and a plain lecture slide covers the page.
   Nothing underneath stops: timers, games and sounds keep going. Esc twice again (or a click on "Exit")
   takes it away. Arrow keys turn the slides so it holds up if someone looks over your shoulder. */
(() => {
  if (!matchMedia('(pointer:fine) and (min-width:900px)').matches) return;

  const DECKS = [
    { course: 'ECON 201 · Week 7', title: 'Aggregate Demand and Supply', slides: [
      ['Aggregate Demand and Supply', ['Lecture 7', 'Intermediate Macroeconomics']],
      ['Components of aggregate demand', ['AD = C + I + G + (X − M)', 'Consumption is the largest share in most economies', 'Investment is the most volatile component', 'Net exports depend on the real exchange rate']],
      ['Why does AD slope downward?', ['Wealth effect: higher prices reduce real wealth', 'Interest-rate effect: higher prices raise money demand', 'Exchange-rate effect: domestic goods become relatively dearer'], 'line-down'],
      ['Short-run aggregate supply', ['Sticky wages and prices', 'Menu costs and long-term contracts', 'Misperceptions about relative prices'], 'line-up'],
      ['Demand shocks', ['Positive shock: output and prices rise in the short run', 'Long run: output returns to potential, prices stay higher', 'Policy response: fiscal vs monetary stabilisation'], 'bars'],
      ['Summary', ['AD and SRAS determine short-run equilibrium', 'LRAS is vertical at potential output', 'Next week: the Phillips curve', 'Reading: Chapter 12, pp. 341–368']],
    ]},
    { course: 'BIO 110 · Week 5', title: 'Cellular Respiration', slides: [
      ['Cellular Respiration', ['Lecture 5', 'Introduction to Cell Biology']],
      ['Overview', ['C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ATP', 'Three main stages', 'Takes place in the cytoplasm and mitochondria']],
      ['Glycolysis', ['Occurs in the cytoplasm', 'Glucose is split into 2 pyruvate', 'Net gain: 2 ATP and 2 NADH', 'Does not require oxygen'], 'bars'],
      ['The Krebs cycle', ['Takes place in the mitochondrial matrix', 'Acetyl-CoA enters the cycle', 'Produces NADH, FADH₂ and 2 ATP per glucose']],
      ['Electron transport chain', ['Inner mitochondrial membrane', 'Proton gradient drives ATP synthase', 'Around 26–28 ATP per glucose', 'Oxygen is the final electron acceptor'], 'line-up'],
      ['Summary', ['Glycolysis → Krebs cycle → ETC', 'Most ATP comes from oxidative phosphorylation', 'Quiz on Friday: stages and locations']],
    ]},
    { course: 'HIST 230 · Week 9', title: 'The Industrial Revolution', slides: [
      ['The Industrial Revolution', ['Lecture 9', 'Modern European History']],
      ['Why Britain first?', ['Access to coal and iron ore', 'Colonial markets and capital', 'Agricultural improvements freed labour', 'Stable institutions and patent law']],
      ['Textiles and mechanisation', ['Spinning jenny (1764)', 'Water frame and the factory system', 'Power loom: output rises sharply'], 'line-up'],
      ['Steam power', ['Watt’s improved steam engine (1776)', 'Factories no longer tied to rivers', 'Railways transform trade and travel'], 'bars'],
      ['Social consequences', ['Rapid urbanisation', 'Working conditions and child labour', 'Rise of trade unions', 'Factory Acts of the 1830s–40s']],
      ['Summary', ['Technology, resources and markets combined', 'Spread to Europe and North America', 'Essay due in two weeks']],
    ]},
  ];

  let on = false, deck = null, idx = 0, last = 0, el = null, oldTitle = '', oldIcon = null;

  const css = `
#uc-lecture{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;background:#e9ebee;color:#202124;font:14px/1.4 Arial,Helvetica,sans-serif;cursor:default}
#uc-lecture *{box-sizing:border-box;text-shadow:none}
#uc-lecture .lt-bar{height:52px;display:flex;align-items:center;gap:14px;padding:0 16px;background:#fff;border-bottom:1px solid #dadce0}
#uc-lecture .lt-doc{width:26px;height:32px;background:#4a6fd0;border-radius:3px;position:relative}
#uc-lecture .lt-doc:after{content:"";position:absolute;left:6px;right:6px;top:11px;height:9px;border:2px solid #fff;border-radius:1px}
#uc-lecture .lt-name{font-size:17px;color:#202124}
#uc-lecture .lt-sub{font-size:12px;color:#5f6368}
#uc-lecture .lt-x{margin-left:auto;border:1px solid #dadce0;background:#fff;border-radius:4px;padding:6px 14px;font:13px Arial,sans-serif;color:#3c4043;cursor:pointer}
#uc-lecture .lt-main{flex:1;display:flex;min-height:0}
#uc-lecture .lt-side{width:190px;overflow:auto;padding:14px 12px;background:#f8f9fa;border-right:1px solid #dadce0}
#uc-lecture .lt-th{display:flex;gap:8px;margin-bottom:12px;cursor:pointer;color:#5f6368;font-size:12px}
#uc-lecture .lt-th div{flex:1;aspect-ratio:16/9;background:#fff;border:1px solid #dadce0;padding:6px;font-size:7px;line-height:1.2;overflow:hidden;color:#202124}
#uc-lecture .lt-th.on div{border:2px solid #1a73e8}
#uc-lecture .lt-stage{flex:1;display:flex;align-items:center;justify-content:center;padding:28px;min-width:0}
#uc-lecture .lt-slide{width:min(100%,calc((100vh - 170px) * 16 / 9));aspect-ratio:16/9;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);padding:5% 6%;display:flex;flex-direction:column;position:relative;overflow:hidden}
#uc-lecture .lt-slide h1{text-shadow:none;letter-spacing:normal;text-transform:none;-webkit-text-stroke:0;margin:0 0 4%;font:700 clamp(22px,3.2vw,44px)/1.15 Georgia,'Times New Roman',serif;color:#1f3864}
#uc-lecture .lt-slide.cover{justify-content:center;background:linear-gradient(90deg,#1f3864 0 1.4%,#fff 1.4%)}
#uc-lecture .lt-slide.cover h1{font-size:clamp(28px,4.2vw,58px)}
#uc-lecture .lt-slide.cover p{margin:0;font-size:clamp(14px,1.6vw,22px);color:#5f6368}
#uc-lecture .lt-body{display:flex;gap:5%;flex:1;min-height:0}
#uc-lecture ul{margin:0;padding-left:1.2em;font-size:clamp(14px,1.55vw,22px);line-height:1.6;flex:1}
#uc-lecture li::marker{color:#1f3864}
#uc-lecture svg{width:38%;align-self:center}
#uc-lecture .lt-foot{position:absolute;left:6%;right:6%;bottom:3.5%;display:flex;justify-content:space-between;font-size:clamp(10px,.9vw,13px);color:#80868b}
#uc-lecture .lt-nav{height:44px;display:flex;align-items:center;justify-content:center;gap:16px;background:#fff;border-top:1px solid #dadce0;color:#5f6368;font-size:13px}
#uc-lecture .lt-nav button{border:0;background:none;font-size:18px;color:#5f6368;cursor:pointer;padding:4px 10px}`;

  const chart = t => {
    const ax = '<line x1="30" y1="10" x2="30" y2="170" stroke="#5f6368" stroke-width="2"/><line x1="30" y1="170" x2="290" y2="170" stroke="#5f6368" stroke-width="2"/>';
    if (t === 'line-down') return `<svg viewBox="0 0 300 190">${ax}<path d="M50 30 Q150 90 270 150" fill="none" stroke="#1a73e8" stroke-width="4"/></svg>`;
    if (t === 'line-up') return `<svg viewBox="0 0 300 190">${ax}<path d="M50 150 Q150 120 270 30" fill="none" stroke="#e8710a" stroke-width="4"/></svg>`;
    if (t === 'bars') return `<svg viewBox="0 0 300 190">${ax}${[60, 95, 75, 130, 110].map((h, i) => `<rect x="${50 + i * 48}" y="${170 - h}" width="30" height="${h}" fill="${i === 3 ? '#1f3864' : '#8ab4f8'}"/>`).join('')}</svg>`;
    return '';
  };

  function render() {
    const [h, pts, ch] = deck.slides[idx], cover = idx === 0;
    el.querySelector('.lt-slide').className = 'lt-slide' + (cover ? ' cover' : '');
    el.querySelector('.lt-slide').innerHTML = cover
      ? `<h1>${h}</h1>${pts.map(p => `<p>${p}</p>`).join('')}<div class="lt-foot"><span>${deck.course}</span><span>${idx + 1}</span></div>`
      : `<h1>${h}</h1><div class="lt-body"><ul>${pts.map(p => `<li>${p}</li>`).join('')}</ul>${chart(ch)}</div><div class="lt-foot"><span>${deck.course}</span><span>${idx + 1}</span></div>`;
    el.querySelectorAll('.lt-th').forEach((t, i) => t.classList.toggle('on', i === idx));
    el.querySelector('.lt-n').textContent = `Slide ${idx + 1} of ${deck.slides.length}`;
  }

  function show() {
    deck = DECKS[Math.floor(Math.random() * DECKS.length)]; idx = 1 + Math.floor(Math.random() * (deck.slides.length - 2));
    if (!document.getElementById('uc-lecture-css')) { const s = document.createElement('style'); s.id = 'uc-lecture-css'; s.textContent = css; document.head.appendChild(s); }
    el = document.createElement('div'); el.id = 'uc-lecture';
    el.innerHTML = `<div class="lt-bar"><i class="lt-doc"></i><div><div class="lt-name">${deck.course.split(' · ')[0]} – ${deck.title}</div><div class="lt-sub">${deck.course} · Lecture slides</div></div><button type="button" class="lt-x">Exit</button></div>
      <div class="lt-main"><div class="lt-side">${deck.slides.map((s, i) => `<div class="lt-th" data-i="${i}"><span>${i + 1}</span><div><b>${s[0]}</b></div></div>`).join('')}</div>
      <div class="lt-stage"><div class="lt-slide"></div></div></div>
      <div class="lt-nav"><button type="button" class="lt-p" aria-label="Previous slide">‹</button><span class="lt-n"></span><button type="button" class="lt-f" aria-label="Next slide">›</button></div>`;
    el.querySelector('.lt-x').onclick = hide;
    el.querySelector('.lt-p').onclick = () => { idx = Math.max(0, idx - 1); render(); };
    el.querySelector('.lt-f').onclick = () => { idx = Math.min(deck.slides.length - 1, idx + 1); render(); };
    el.querySelectorAll('.lt-th').forEach(t => t.onclick = () => { idx = +t.dataset.i; render(); });
    document.body.appendChild(el); render();
    // the tab looks like the lecture too
    oldTitle = document.title; document.title = `${deck.course.split(' · ')[0]} – ${deck.title} – Lecture slides`;
    const ic = document.querySelector('link[rel~="icon"]'); oldIcon = ic ? ic.href : null;
    setIcon('data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="2" y="1" width="12" height="14" rx="1.5" fill="#4a6fd0"/><rect x="4.5" y="6" width="7" height="5" fill="none" stroke="#fff" stroke-width="1.3"/></svg>'));
    on = true;
  }
  function setIcon(href) { let l = document.querySelector('link[rel~="icon"]'); if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); } l.href = href; }
  function hide() { el?.remove(); el = null; document.title = oldTitle; if (oldIcon) setIcon(oldIcon); on = false; }

  addEventListener('keydown', e => {
    if (on && (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ')) { e.preventDefault(); e.stopImmediatePropagation(); idx = Math.min(deck.slides.length - 1, idx + 1); render(); return; }
    if (on && (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp')) { e.preventDefault(); e.stopImmediatePropagation(); idx = Math.max(0, idx - 1); render(); return; }
    if (e.key !== 'Escape') { if (on) { e.preventDefault(); e.stopImmediatePropagation(); } return; }
    const now = Date.now();
    if (now - last < 450) { last = 0; e.preventDefault(); on ? hide() : show(); } else last = now;
    if (on) e.stopImmediatePropagation();
  }, true);
})();
