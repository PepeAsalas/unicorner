/* Advent calendar 2026: what's behind each of the 24 doors. Loaded by the home page during the Christmas season,
   and by /mockups/advent.html (preview: every door playable now, nothing saved to your real progress).
   A door opens once you've played that day's Daily 5. Missed doors can still be opened later, but their kit piece,
   vote and snowflakes are gone. Votes close at midnight (Amsterdam); results show from the next day. */
(() => {
  const PREVIEW = !!window.ADVENT_PREVIEW;
  const T = (en, es, pt) => { try { return L(en, es, pt) } catch { return en } };
  const KEY = k => PREVIEW ? 'advprev:' + k : k;
  const ls = (k, v) => { try { k = KEY(k); if (v === undefined) return localStorage.getItem(k); v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { } };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const dateOf = n => '2026-12-' + String(n).padStart(2, '0');
  const realToday = () => { try { return xmToday() } catch { return new Date().toISOString().slice(0, 10) } };
  let previewDay = 1;
  const today = () => PREVIEW ? dateOf(previewDay) : realToday();
  const played = d => PREVIEW ? true : (() => { try { return localStorage.getItem('unicorner-played-' + d) != null } catch { return false } })();
  const visitor = () => { try { return localStorage.getItem('uc-visitor') || '' } catch { return '' } };
  const track = (n, d) => { if (PREVIEW) return; try { window.track?.(n, d) } catch { } };
  const kitById = id => (typeof KITS !== 'undefined' && KITS.find(k => k.id === id)) || (window.KITS_GONE || []).find(k => k.id === id) || null;
  const kitImg = k => { try { return (window.sprite || window.spriteDraw)('happy', 0, false, k).replace(/"/g, "'") } catch { return 'none' } };
  const rnd = a => a[Math.floor(Math.random() * a.length)];

  // server calls (votes, door counter); the preview fakes them
  const rpc = (fn, a) => {
    if (PREVIEW) {
      if (fn === 'advent_vote') return Promise.resolve({ voted: a.p_option });
      if (fn === 'advent_open') return Promise.resolve(a.p_day === 13 ? 3120 : 900);
      if (fn === 'advent_results') { const c = {}; [41, 27, 19, 13].forEach((v, i) => c[i] = v * 31); return Promise.resolve({ closed: true, total: 3100, mine: null, counts: c }) }
    }
    return window.ucPubRpc ? window.ucPubRpc(fn, a) : Promise.reject(new Error('offline'));
  };
  const winnerOf = res => { const c = (res && res.counts) || {}; let best = -1, w = null; for (const k in c) if (+c[k] > best) { best = +c[k]; w = +k } return w };

  // kits won in the calendar: kept on this device (the account picks them up with your other kits)
  const grant = id => {
    let d = []; try { d = JSON.parse(ls('uc-kit-done') || '[]') } catch { }
    if (!d.includes(id)) { d.push(id); ls('uc-kit-done', JSON.stringify(d)); try { window.ucLookSync?.() } catch { } }
  };

  // ── snowflakes: best score per door ──
  const flakes = () => { try { return JSON.parse(ls('uc-adv-flakes') || '{}') } catch { return {} } };
  const total = () => Object.values(flakes()).reduce((a, b) => a + b, 0);
  const addFlakes = (n, v, o) => { if (o.missed) return; const f = flakes(); if ((f[n] || 0) < v) { f[n] = v; ls('uc-adv-flakes', JSON.stringify(f)) } refreshFlakes() };
  const PIECE_DAYS = [3, 9, 15, 21];
  const pieces = upTo => PIECE_DAYS.filter(n => n <= upTo && played(dateOf(n))).length;
  const doorsOpened = () => { let n = 0; for (let i = 1; i <= 24; i++) if (dateOf(i) <= today() && played(dateOf(i))) n++; return n };

  // ── the 24 doors ──
  const DAYS = {
    1: { t: 'welcome' },
    2: { t: 'penalty' },
    3: { t: 'piece', n: 1, name: T('the crown', 'la corona', 'a coroa') },
    4: { t: 'vote', q: T('Which Christmas kit should we make?', '¿Qué equipación navideña hacemos?', 'Que uniforme de Natal fazemos?'),
         opts: [['xm-elf', T('Elf', 'Elfo', 'Elfo')], ['xm-ginger', T('Gingerbread', 'Jengibre', 'Gengibre')], ['xm-grinch', 'Grinch'], ['xm-nutcracker', T('Nutcracker', 'Cascanueces', 'Quebra-nozes')]],
         after: T('The winner is revealed on door 22, and everyone who voted for it gets it.', 'El ganador se revela en la puerta 22 y se lo llevan quienes lo votaron.', 'O vencedor é revelado na porta 22, e quem votou nele ganha.') },
    5: { t: 'quiz', title: T('Christmas football quiz', 'Quiz navideño de fútbol', 'Quiz de futebol de Natal'), qs: [
         [T('The famous 1914 Christmas truce match was played during which war?', 'El famoso partido de la tregua de Navidad de 1914 se jugó durante qué guerra?', 'A famosa partida da trégua de Natal de 1914 foi jogada durante qual guerra?'), [T('First World War', 'Primera Guerra Mundial', 'Primeira Guerra Mundial'), T('Second World War', 'Segunda Guerra Mundial', 'Segunda Guerra Mundial'), T('Boer War', 'Guerra de los Bóers', 'Guerra dos Bôeres'), T('Crimean War', 'Guerra de Crimea', 'Guerra da Crimeia')], 0],
         [T('Who scored a hat-trick in the 2022 World Cup final?', '¿Quién marcó un hat-trick en la final del Mundial 2022?', 'Quem marcou um hat-trick na final da Copa de 2022?'), ['Lionel Messi', 'Kylian Mbappé', 'Ángel Di María', 'Olivier Giroud'], 1],
         [T('The first World Cup played in November and December was hosted by…', 'El primer Mundial jugado en noviembre y diciembre fue en…', 'A primeira Copa disputada em novembro e dezembro foi no…'), ['Qatar', T('Saudi Arabia', 'Arabia Saudí', 'Arábia Saudita'), T('United Arab Emirates', 'Emiratos Árabes', 'Emirados Árabes'), T('Russia', 'Rusia', 'Rússia')], 0]] },
    6: { t: 'catch', mult: 1 },
    7: { t: 'vote', q: T('Which retired kit should come back?', '¿Qué equipación retirada vuelve?', 'Qual uniforme aposentado deve voltar?'),
         opts: [['rainbow', T('Rainbow', 'Arcoíris', 'Arco-íris')], ['lava', 'Lava'], ['chrome', T('Chrome', 'Cromo', 'Cromo')]],
         after: T('The winner comes back for everyone on door 14.', 'La ganadora vuelve para todos en la puerta 14.', 'O vencedor volta para todos na porta 14.') },
    8: { t: 'year' },
    9: { t: 'piece', n: 2, name: T('the scarf', 'la bufanda', 'o cachecol') },
    10: { t: 'quiz', title: T('Clásico crossovers', 'Cruzados del Clásico', 'Atravessaram o Clássico'), qs: [
         [T('Which of these played for both Real Madrid and Barcelona?', '¿Cuál de estos jugó en el Real Madrid y en el Barcelona?', 'Qual destes jogou no Real Madrid e no Barcelona?'), ['Raúl', 'Luís Figo', 'Xavi', 'Iker Casillas'], 1],
         [T('And which of these?', '¿Y cuál de estos?', 'E qual destes?'), ['Rivaldo', 'Ronaldinho', 'Ronaldo Nazário', 'Kaká'], 2],
         [T('One more: which of these?', 'Una más: ¿cuál de estos?', 'Mais uma: qual destes?'), ['Hristo Stoichkov', 'Romário', 'Davor Šuker', 'Michael Laudrup'], 3]] },
    11: { t: 'emoji', set: [['🦊👑', 'Leicester City', ['Leeds United', 'Norwich City', 'Watford']], ['🐓', 'Tottenham Hotspur', ['Wolves', 'Burnley', 'Chelsea']], ['⚒️⚒️', 'West Ham United', ['Sheffield United', 'Arsenal', 'Everton']], ['🦅🇵🇹', 'Benfica', ['Porto', 'Sporting CP', 'Braga']], ['🐝', 'Brentford', ['Watford', 'Brighton', 'Fulham']]] },
    12: { t: 'vote', q: T('Pick the theme of the Christmas Day Daily 5', 'Elige el tema del Diario 5 de Navidad', 'Escolha o tema do Diário 5 de Natal'),
          opts: [[null, 'Premier League'], [null, T('World Cups', 'Mundiales', 'Copas do Mundo')], [null, 'La Liga'], [null, 'Champions League']],
          after: T('The winning theme is the Daily 5 on 25 December.', 'El tema ganador será el Diario 5 del 25 de diciembre.', 'O tema vencedor será o Diário 5 de 25 de dezembro.') },
    13: { t: 'goal', target: 3000 },
    14: { t: 'retro' },
    15: { t: 'piece', n: 3, name: T('the jumper', 'el jersey', 'o suéter') },
    16: { t: 'hilo' },
    17: { t: 'quiz', title: T('Champions League heartbreak', 'Dolor de Champions', 'Dor de Champions'), qs: [
         [T('Who scored for Liverpool in the 2018 final, which they lost to Real Madrid?', '¿Quién marcó para el Liverpool en la final de 2018, que perdió contra el Real Madrid?', 'Quem marcou pelo Liverpool na final de 2018, perdida para o Real Madrid?'), ['Mohamed Salah', 'Roberto Firmino', 'Sadio Mané', 'Virgil van Dijk'], 2],
         [T("Who scored Bayern's goal in the 2012 final they lost to Chelsea?", '¿Quién marcó el gol del Bayern en la final de 2012 que perdió contra el Chelsea?', 'Quem marcou o gol do Bayern na final de 2012, perdida para o Chelsea?'), ['Thomas Müller', 'Arjen Robben', 'Mario Gómez', 'Franck Ribéry'], 0],
         [T('Who scored for Juventus in the 2017 final they lost to Real Madrid?', '¿Quién marcó para la Juventus en la final de 2017 que perdió contra el Real Madrid?', 'Quem marcou pela Juventus na final de 2017, perdida para o Real Madrid?'), ['Gonzalo Higuaín', 'Paulo Dybala', 'Mario Mandžukić', 'Miralem Pjanić'], 2]] },
    18: { t: 'vote', q: T('The greatest goal ever?', '¿El mejor gol de la historia?', 'O maior gol de todos os tempos?'),
          opts: [[null, T('Maradona vs England, 1986', 'Maradona contra Inglaterra, 1986', 'Maradona contra a Inglaterra, 1986'), 'Maradona goal of the century England 1986'],
                 [null, T('Zidane volley, 2002 Champions League final', 'Volea de Zidane, final de Champions 2002', 'Voleio de Zidane, final da Champions de 2002'), 'Zidane volley 2002 Champions League final'],
                 [null, T('Bergkamp vs Newcastle, 2002', 'Bergkamp contra el Newcastle, 2002', 'Bergkamp contra o Newcastle, 2002'), 'Bergkamp goal vs Newcastle 2002'],
                 [null, T('Rooney overhead kick vs Man City, 2011', 'Chilena de Rooney contra el City, 2011', 'Bicicleta de Rooney contra o City, 2011'), 'Rooney overhead kick vs Manchester City 2011']],
          after: T('Tap ▶ to watch each one. The winner goes on our Instagram.', 'Toca ▶ para verlos. El ganador irá a nuestro Instagram.', 'Toque ▶ para assistir. O vencedor vai para o nosso Instagram.') },
    19: { t: 'penalty', hard: true },
    20: { t: 'emoji', set: [['🐺', 'Wolves', ['Leicester City', 'Millwall', 'Burnley']], ['🦅', 'Crystal Palace', ['Benfica', 'Lazio', 'Sunderland']], ['🦇', 'Valencia', ['Sevilla', 'Real Betis', 'Villarreal']], ['😈🔴', 'Manchester United', ['Liverpool', 'Arsenal', 'Southampton']], ['🍒', 'Bournemouth', ['Brighton', 'Fulham', 'Crystal Palace']]] },
    21: { t: 'piece', n: 4, name: T('the boots', 'las botas', 'as botas') },
    22: { t: 'reveal' },
    23: { t: 'catch', mult: 2 },
    24: { t: 'finale' },
  };

  // ── the pop-up ──
  let dlg;
  function shell(n) {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'adv-dlg'; dlg.className = 'adv-dlg';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-adv-x]')) dlg.close() });
      dlg.addEventListener('close', () => { stopGame?.(); stopGame = null });
    }
    dlg.innerHTML = `<div class="adv-in"><button type="button" class="adv-x" data-adv-x aria-label="${T('Close', 'Cerrar', 'Fechar')}">✕</button>
      <div class="adv-top"><span class="adv-no">${n}</span><span>${T('DECEMBER', 'DICIEMBRE', 'DEZEMBRO')}</span><span class="adv-fl" title="${T('Snowflakes', 'Copos', 'Flocos')}">❄ ${total()}</span></div>
      <div class="adv-body"></div></div>`;
    if (!dlg.open) dlg.showModal();
    return dlg.querySelector('.adv-body');
  }
  let stopGame = null;
  const refreshFlakes = () => { const f = dlg?.querySelector('.adv-fl'); if (f) f.textContent = '❄ ' + total(); if (!PREVIEW) window.ucAdventRedraw?.() };

  function open(n) {
    if (PREVIEW) previewDay = n;
    const d = dateOf(n), t = today(), cfg = DAYS[n];
    stopGame?.(); stopGame = null;
    const body = shell(n);
    if (d > t) { body.innerHTML = `<h3>${T('Not yet!', '¡Todavía no!', 'Ainda não!')}</h3><p>${T(`This door opens on ${n} December.`, `Esta puerta se abre el ${n} de diciembre.`, `Esta porta abre em ${n} de dezembro.`)}</p>`; return }
    if (d === t && !played(d)) {
      body.innerHTML = `<h3>${T("Play today's Daily 5 to open this door", 'Juega el Diario 5 de hoy para abrir esta puerta', 'Jogue o Diário 5 de hoje para abrir esta porta')}</h3>
        <p>${T('Five questions, about three minutes. Then come back and open it.', 'Cinco preguntas, unos tres minutos. Luego vuelve y ábrela.', 'Cinco perguntas, uns três minutos. Depois volte e abra.')}</p>
        <button type="button" class="adv-btn" data-adv-play>${T("Play today's game", 'Jugar el partido de hoy', 'Jogar o jogo de hoje')}</button>`;
      body.querySelector('[data-adv-play]').onclick = () => { dlg.close(); document.getElementById('go')?.click() };
      return;
    }
    const o = { missed: !played(d), isToday: d === t, n };
    if (o.isToday) { rpc('advent_open', { p_day: n, p_visitor: visitor() }).then(c => { if (n === 13 && !o.missed) { ls('uc-adv-13', '1'); if (c >= DAYS[13].target) grant('xm-together') } }).catch(() => { }); }
    checkCommunity(n);
    track('advent_door', { n, missed: o.missed });
    R[cfg.t](body, n, cfg, o);
  }
  // the day 13 goal can be reached after you opened the door: check again on later doors
  function checkCommunity(n) {
    if (n <= 13 || ls('uc-adv-13') !== '1') return;
    rpc('advent_open', { p_day: 13, p_visitor: visitor() }).then(c => { if (c >= DAYS[13].target) grant('xm-together') }).catch(() => { });
  }

  const missedNote = o => o.missed ? `<p class="adv-note">${T("You missed this day, so there's no prize, but you can still have a go.", 'Te perdiste este día, así que no hay premio, pero puedes jugar igual.', 'Você perdeu este dia, então não há prêmio, mas pode jogar mesmo assim.')}</p>` : '';
  const horacio = (pose, text) => `<div class="adv-hor"><img src="/rosco/host/xmas/${pose}.png" alt=""><p>${text}</p></div>`;

  // ── what each kind of door shows ──
  const R = {
    welcome(b) {
      b.innerHTML = horacio('happy-talk', T("Ho ho ho! Welcome to the Unicorner advent calendar. Play every day to open a door: mini games, votes, quizzes and a secret kit, piece by piece. Collect all 4 pieces (doors 3, 9, 15 and 21) and it's yours.", '¡Jo, jo, jo! Bienvenido al calendario de Adviento de Unicorner. Juega cada día para abrir una puerta: minijuegos, votaciones, quizzes y una equipación secreta, pieza a pieza. Consigue las 4 piezas (puertas 3, 9, 15 y 21) y es tuya.', 'Ho ho ho! Bem-vindo ao calendário do Advento do Unicorner. Jogue todo dia para abrir uma porta: minijogos, votações, quizzes e um uniforme secreto, peça por peça. Junte as 4 peças (portas 3, 9, 15 e 21) e ele é seu.'))
        + `<div class="adv-kit"><i style="background-image:${kitImg(frostKit(0))}"></i><span class="adv-q">?</span></div>${pieceRow()}`;
    },
    piece(b, n, cfg, o) {
      const have = PREVIEW ? cfg.n : pieces(n);
      b.innerHTML = `<h3>${o.missed ? T('You missed this piece', 'Te perdiste esta pieza', 'Você perdeu esta peça') : T(`Secret kit: piece ${cfg.n} of 4`, `Equipación secreta: pieza ${cfg.n} de 4`, `Uniforme secreto: peça ${cfg.n} de 4`)}</h3>
        <div class="adv-kit adv-pop"><i style="background-image:${kitImg(frostKit(have))}"></i></div>
        <p>${o.missed ? T('Pieces only count on their own day. There are more to come!', 'Las piezas solo cuentan en su día. ¡Quedan más!', 'As peças só contam no seu dia. Ainda tem mais!')
          : have === 4 ? T(`You got ${cfg.name}! All 4 pieces: the Frost kit is yours. Find it in your kits.`, `¡Conseguiste ${cfg.name}! Las 4 piezas: la equipación Escarcha es tuya. Búscala en tus equipaciones.`, `Você ganhou ${cfg.name}! As 4 peças: o uniforme Geada é seu. Veja nos seus uniformes.`)
          : T(`You got ${cfg.name}! ${have} of 4 collected.`, `¡Conseguiste ${cfg.name}! ${have} de 4.`, `Você ganhou ${cfg.name}! ${have} de 4.`)}</p>${pieceRow(PREVIEW ? cfg.n : null)}`;
    },
    vote(b, n, cfg, o) {
      const key = 'uc-adv-vote-' + n, mine = ls(key);
      const draw = res => {
        const closed = res && res.closed, counts = (res && res.counts) || {}, tot = Object.values(counts).reduce((a, c) => a + +c, 0);
        const my = res && res.mine != null ? res.mine : mine != null ? +mine : null;
        const canVote = o.isToday && !o.missed && my == null && !(PREVIEW && closed);
        const win = closed ? winnerOf(res) : null;
        b.innerHTML = `<h3>${esc(cfg.q)}</h3><div class="adv-opts${cfg.opts[0][0] ? ' kits' : ''}">${cfg.opts.map(([kid, label, yt], i) => {
          const pct = closed && tot ? Math.round((counts[i] || 0) / tot * 100) : null, k = kid && kitById(kid);
          return `<div class="adv-ow"><button type="button" class="adv-opt${my === i ? ' me' : ''}${win === i ? ' win' : ''}" data-v="${i}" ${canVote ? '' : 'disabled'}>
            ${k ? `<i class="adv-ok" style="background-image:${kitImg(k)}"></i>` : ''}<span>${esc(label)}</span>${pct != null ? `<b>${pct}%</b><em style="transform:scaleX(${pct / 100})"></em>` : ''}</button>
            ${yt ? `<a class="adv-yt" href="https://www.youtube.com/results?search_query=${encodeURIComponent(yt)}" target="_blank" rel="noopener" aria-label="${T('Watch on YouTube', 'Ver en YouTube', 'Ver no YouTube')}">▶</a>` : ''}</div>`
        }).join('')}</div>
          <p class="adv-note">${closed ? T(`Voting closed: ${tot} votes.`, `Votación cerrada: ${tot} votos.`, `Votação encerrada: ${tot} votos.`)
            : my != null ? T('Thanks for voting! Results tomorrow.', '¡Gracias por votar! Resultados mañana.', 'Obrigado por votar! Resultado amanhã.')
            : canVote ? T('One vote each. Voting closes at midnight.', 'Un voto por persona. Se cierra a medianoche.', 'Um voto por pessoa. Fecha à meia-noite.')
            : T('You missed this vote.', 'Te perdiste esta votación.', 'Você perdeu esta votação.')} ${esc(cfg.after || '')}</p>
          ${PREVIEW && !closed && my != null ? `<button type="button" class="adv-btn alt" data-adv-res>${T('Preview: show the result', 'Vista previa: ver el resultado', 'Prévia: ver o resultado')}</button>` : ''}`;
        b.querySelectorAll('[data-v]:not([disabled])').forEach(btn => btn.onclick = async () => {
          const v = +btn.dataset.v; b.querySelectorAll('[data-v]').forEach(x => x.disabled = true);
          try { const r = await rpc('advent_vote', { p_day: n, p_option: v, p_visitor: visitor() }); ls(key, String(r && r.voted != null ? r.voted : v)) } catch { ls(key, String(v)) }
          track('advent_vote', { n, v }); draw({ closed: false, mine: +ls(key) });
        });
        b.querySelector('[data-adv-res]')?.addEventListener('click', () => rpc('advent_results', {}).then(r => draw({ ...r, mine: +ls(key) })));
      };
      draw(null);
      if (!PREVIEW) rpc('advent_results', { p_day: n, p_visitor: visitor() }).then(r => { if (dlg.open && r) draw(r) }).catch(() => { });
    },
    quiz(b, n, cfg, o) {
      let i = 0, right = 0;
      const step = () => {
        if (i >= cfg.qs.length) {
          const v = right * 3; addFlakes(n, v, o);
          b.innerHTML = `<h3>${esc(cfg.title)}</h3>${horacio(right === 3 ? 'celebrate' : right ? 'happy-1' : 'facepalm', right === 3 ? T('Perfect! Three out of three.', '¡Perfecto! Tres de tres.', 'Perfeito! Três de três.') : T(`${right} out of 3. Not bad!`, `${right} de 3. ¡No está mal!`, `${right} de 3. Nada mal!`))}
            <p class="adv-big">${o.missed ? '' : `+${v} ❄`}</p>${missedNote(o)}`;
          return;
        }
        const [q, opts, ok] = cfg.qs[i];
        b.innerHTML = `<h3>${esc(cfg.title)} <small>${i + 1}/3</small></h3><p class="adv-qq">${esc(q)}</p><div class="adv-opts">${opts.map((x, j) => `<div class="adv-ow"><button type="button" class="adv-opt" data-a="${j}"><span>${esc(x)}</span></button></div>`).join('')}</div>`;
        b.querySelectorAll('[data-a]').forEach(btn => btn.onclick = () => {
          const j = +btn.dataset.a; b.querySelectorAll('[data-a]').forEach(x => x.disabled = true);
          b.querySelector(`[data-a="${ok}"]`).classList.add('win'); if (j !== ok) btn.classList.add('bad'); else right++;
          setTimeout(() => { i++; step() }, 900);
        });
      };
      step();
    },
    emoji(b, n, cfg, o) {
      let i = 0, right = 0;
      const set = cfg.set.map(([e, a, wrong]) => [e, a, [a, ...wrong].sort(() => Math.random() - .5)]);
      const step = () => {
        if (i >= set.length) {
          const v = right * 2; addFlakes(n, v, o);
          b.innerHTML = `<h3>${T('Emoji club', 'Club emoji', 'Clube emoji')}</h3>${horacio(right >= 4 ? 'celebrate' : 'wink', T(`${right} out of ${set.length} clubs!`, `¡${right} de ${set.length} clubes!`, `${right} de ${set.length} clubes!`))}<p class="adv-big">${o.missed ? '' : `+${v} ❄`}</p>${missedNote(o)}`;
          return;
        }
        const [e, a, opts] = set[i];
        b.innerHTML = `<h3>${T('Emoji club', 'Club emoji', 'Clube emoji')} <small>${i + 1}/${set.length}</small></h3><p class="adv-note">${T('Which club is this?', '¿Qué club es?', 'Que clube é este?')}</p>
          <div class="adv-emoji">${e}</div><div class="adv-opts two">${opts.map(x => `<div class="adv-ow"><button type="button" class="adv-opt" data-a="${esc(x)}"><span>${esc(x)}</span></button></div>`).join('')}</div>`;
        b.querySelectorAll('[data-a]').forEach(btn => btn.onclick = () => {
          b.querySelectorAll('[data-a]').forEach(x => x.disabled = true);
          b.querySelector(`[data-a="${CSS.escape(a)}"]`).classList.add('win'); if (btn.dataset.a !== a) btn.classList.add('bad'); else right++;
          setTimeout(() => { i++; step() }, 800);
        });
      };
      step();
    },
    hilo(b, n, cfg, o) {
      // Ballon d'Or wins, a chain with no ties
      const C = [['Zinedine Zidane', 1], ['Lionel Messi', 8], ['Johan Cruyff', 3], ['Ronaldo Nazário', 2], ['Cristiano Ronaldo', 5], ['Luka Modrić', 1], ['Michel Platini', 3]];
      let i = 0, right = 0;
      const step = () => {
        if (i >= C.length - 1) {
          const v = right * 2; addFlakes(n, v, o);
          b.innerHTML = `<h3>${T('Higher or lower', 'Más o menos', 'Mais ou menos')}</h3>${horacio(right >= 5 ? 'celebrate' : 'think', T(`${right} out of ${C.length - 1}!`, `¡${right} de ${C.length - 1}!`, `${right} de ${C.length - 1}!`))}<p class="adv-big">${o.missed ? '' : `+${v} ❄`}</p>${missedNote(o)}`;
          return;
        }
        const [a, av] = C[i], [c, cv] = C[i + 1];
        b.innerHTML = `<h3>${T('Higher or lower', 'Más o menos', 'Mais ou menos')} <small>${i + 1}/${C.length - 1}</small></h3><p class="adv-note">${T('Ballon d\'Or wins', 'Balones de Oro', 'Bolas de Ouro')}</p>
          <div class="hl"><div><b>${esc(a)}</b><span class="hl-n">${av}</span></div><div><b>${esc(c)}</b><span class="hl-n hl-q">?</span></div></div>
          <div class="adv-opts two"><div class="adv-ow"><button type="button" class="adv-opt" data-h="1"><span>▲ ${T('Higher', 'Más', 'Mais')}</span></button></div><div class="adv-ow"><button type="button" class="adv-opt" data-h="0"><span>▼ ${T('Lower', 'Menos', 'Menos')}</span></button></div></div>`;
        b.querySelectorAll('[data-h]').forEach(btn => btn.onclick = () => {
          b.querySelectorAll('[data-h]').forEach(x => x.disabled = true);
          const ok = (btn.dataset.h === '1') === (cv > av), q = b.querySelector('.hl-q');
          q.textContent = cv; q.classList.add(ok ? 'ok' : 'no'); btn.classList.add(ok ? 'win' : 'bad'); if (ok) right++;
          setTimeout(() => { i++; step() }, 1000);
        });
      };
      step();
    },
    penalty(b, n, cfg, o) { penalty(b, n, !!cfg.hard, o) },
    catch(b, n, cfg, o) { catchGame(b, n, cfg.mult, o) },
    year(b, n, cfg, o) {
      let st = null; try { st = PREVIEW ? null : kitStats() } catch { }
      st = st || { games: 47, best: 412, streak: 12, scr: 9 };
      const rows = [[T('Daily 5 games played', 'Partidos del Diario 5', 'Jogos do Diário 5'), st.games], [T('Best score', 'Mejor puntuación', 'Melhor pontuação'), st.best], [T('Best streak', 'Mejor racha', 'Melhor sequência'), st.streak], [T('Screamers found', 'Chicharros', 'Golaços'), st.scr]];
      b.innerHTML = `<h3>${T('Your year in Unicorner', 'Tu año en Unicorner', 'Seu ano no Unicorner')}</h3><div class="yr">${rows.map(([k, v], i) => `<div style="--d:${i * 60}ms"><b>${v}</b><span>${k}</span></div>`).join('')}</div>
        ${horacio('happy-talk', T('Thanks for playing with us this year. Screenshot it and show your mates!', 'Gracias por jugar con nosotros este año. ¡Haz captura y enséñaselo a tus amigos!', 'Obrigado por jogar com a gente este ano. Tire um print e mostre aos amigos!'))}`;
    },
    goal(b, n, cfg, o) {
      const draw = c => {
        const pct = Math.min(100, Math.round(c / cfg.target * 100)), done = c >= cfg.target;
        b.innerHTML = `<h3>${T('Community goal', 'Objetivo de la comunidad', 'Meta da comunidade')}</h3>
          <p>${T(`If ${cfg.target.toLocaleString()} of you open today's door, everyone who opened it gets the Together kit.`, `Si ${cfg.target.toLocaleString()} abrís la puerta de hoy, todos los que la abran se llevan la equipación Juntos.`, `Se ${cfg.target.toLocaleString()} de vocês abrirem a porta de hoje, todos que abriram ganham o uniforme Juntos.`)}</p>
          <div class="goal"><i style="transform:scaleX(${pct / 100})"></i><span>${c.toLocaleString()} / ${cfg.target.toLocaleString()}</span></div>
          <div class="adv-kit"><i style="background-image:${kitImg(kitById('xm-together'))}${done ? '' : ';filter:brightness(0) opacity(.35)'}"></i></div>
          <p class="adv-note">${done ? T('Goal reached! The Together kit is in your kits.', '¡Objetivo cumplido! La equipación Juntos ya está en tus equipaciones.', 'Meta batida! O uniforme Juntos está nos seus uniformes.') : T('Share Unicorner with your mates to get there!', '¡Comparte Unicorner con tus amigos para llegar!', 'Compartilhe o Unicorner com os amigos para chegar lá!')}</p>${missedNote(o)}`;
      };
      draw(0);
      rpc('advent_open', { p_day: 13, p_visitor: visitor() }).then(c => { if (dlg.open) { draw(+c || 0); if (c >= cfg.target && !o.missed && (o.isToday || ls('uc-adv-13') === '1')) grant('xm-together') } }).catch(() => { });
    },
    retro(b, n, cfg, o) {
      b.innerHTML = `<h3>${T('A retired kit returns…', 'Vuelve una equipación retirada…', 'Um uniforme aposentado volta…')}</h3><div class="adv-kit"><i></i></div><p class="adv-note">…</p>`;
      rpc('advent_results', { p_day: 7, p_visitor: visitor() }).then(r => {
        const w = winnerOf(r), opt = w != null ? DAYS[7].opts[w] : null; if (!dlg.open) return;
        if (!opt) { b.querySelector('.adv-note').textContent = T('The votes are still being counted. Come back later!', 'Aún se cuentan los votos. ¡Vuelve luego!', 'Os votos ainda estão sendo contados. Volte depois!'); return }
        const k = kitById(opt[0]);
        b.innerHTML = `<h3>${T(`${opt[1]} is back!`, `¡Vuelve ${opt[1]}!`, `${opt[1]} voltou!`)}</h3><div class="adv-kit adv-pop"><i style="background-image:${kitImg(k)}"></i></div>
          <p>${o.missed ? T('You missed this door, but you voted it back. It returns for everyone who opened door 14 on the day.', 'Te perdiste esta puerta. Vuelve para quienes abrieron la puerta 14 ese día.', 'Você perdeu esta porta. Volta para quem abriu a porta 14 no dia.')
            : T('You voted, the kit room listened. It\'s in your kits now (reload the page to see it).', 'Votasteis y el vestuario escuchó. Ya está en tus equipaciones (recarga la página).', 'Vocês votaram e o vestiário ouviu. Já está nos seus uniformes (recarregue a página).')}</p>`;
        if (!o.missed) { ls('uc-adv-back', opt[0]); grant(opt[0]) }
      }).catch(() => { b.querySelector('.adv-note').textContent = T('Could not load the result. Try again later.', 'No se pudo cargar el resultado. Inténtalo luego.', 'Não foi possível carregar o resultado. Tente depois.') });
    },
    reveal(b, n, cfg, o) {
      b.innerHTML = `<h3>${T('And the new kit is…', 'Y la nueva equipación es…', 'E o novo uniforme é…')}</h3><div class="adv-kit"><i></i></div><p class="adv-note">…</p>`;
      rpc('advent_results', { p_day: 4, p_visitor: visitor() }).then(r => {
        const w = winnerOf(r), opt = w != null ? DAYS[4].opts[w] : null; if (!dlg.open) return;
        if (!opt) { b.querySelector('.adv-note').textContent = T('The votes are still being counted. Come back later!', 'Aún se cuentan los votos. ¡Vuelve luego!', 'Os votos ainda estão sendo contados. Volte depois!'); return }
        const mine = PREVIEW ? w : (r.mine != null ? r.mine : ls('uc-adv-vote-4') != null ? +ls('uc-adv-vote-4') : null), won = mine === w && !o.missed;
        b.innerHTML = `<h3>${esc(opt[1])}!</h3><div class="adv-kit adv-pop"><i style="background-image:${kitImg(kitById(opt[0]))}"></i></div>
          <p>${won ? T('You voted for it, so it\'s yours. Find it in your kits!', 'Lo votaste, así que es tuya. ¡Búscala en tus equipaciones!', 'Você votou nele, então é seu. Veja nos seus uniformes!')
            : T('Didn\'t vote for it? Play the Daily 5 on 23 and 24 December and it\'s yours too.', '¿No lo votaste? Juega el Diario 5 el 23 y el 24 de diciembre y también será tuya.', 'Não votou nele? Jogue o Diário 5 em 23 e 24 de dezembro e ele também é seu.')}</p>`;
        ls('uc-adv-kitwin', opt[0]); if (won) grant(opt[0]);
      }).catch(() => { b.querySelector('.adv-note').textContent = T('Could not load the result. Try again later.', 'No se pudo cargar el resultado. Inténtalo luego.', 'Não foi possível carregar o resultado. Tente depois.') });
    },
    finale(b, n, cfg, o) {
      const doors = PREVIEW ? 22 : doorsOpened(), star = doors >= 20;
      if (star && !o.missed) grant('xm-star');
      const kw = ls('uc-adv-kitwin'); if (kw && played(dateOf(23)) && played(dateOf(24))) grant(kw);
      b.innerHTML = `<h3>${T('Merry Christmas!', '¡Feliz Navidad!', 'Feliz Natal!')}</h3>
        ${horacio('celebrate', T("You made it to door 24! Thank you for playing Unicorner every day. See you tomorrow for the Christmas Day Daily 5.", '¡Llegaste a la puerta 24! Gracias por jugar a Unicorner cada día. Nos vemos mañana en el Diario 5 de Navidad.', 'Você chegou à porta 24! Obrigado por jogar Unicorner todo dia. Até amanhã no Diário 5 de Natal.'))}
        <div class="yr"><div><b>${doors}</b><span>${T('doors opened', 'puertas abiertas', 'portas abertas')}</span></div><div><b>${total()}</b><span>${T('snowflakes', 'copos', 'flocos')}</span></div><div><b>${PREVIEW ? 4 : pieces(24)}/4</b><span>${T('Frost pieces', 'piezas Escarcha', 'peças Geada')}</span></div></div>
        <div class="adv-kit${star ? ' adv-pop' : ''}"><i style="background-image:${kitImg(kitById('xm-star'))}${star ? '' : ';filter:brightness(0) opacity(.35)'}"></i></div>
        <p class="adv-note">${star ? T('20 doors or more: the Golden star kit is yours!', '20 puertas o más: ¡la Estrella dorada es tuya!', '20 portas ou mais: a Estrela dourada é sua!') : T(`Open 20 doors for the Golden star kit (you have ${doors}). Or play on Christmas Day!`, `Abre 20 puertas para la Estrella dorada (llevas ${doors}). ¡O juega el día de Navidad!`, `Abra 20 portas para a Estrela dourada (você tem ${doors}). Ou jogue no dia de Natal!`)}</p>`;
    },
  };

  function pieceRow(upTo) {
    const names = [T('Crown', 'Corona', 'Coroa'), T('Scarf', 'Bufanda', 'Cachecol'), T('Jumper', 'Jersey', 'Suéter'), T('Boots', 'Botas', 'Botas')];
    const got = PIECE_DAYS.map((d, i) => upTo != null ? i < upTo : played(dateOf(d)) && dateOf(d) <= today());
    return `<div class="adv-pcs">${names.map((x, i) => `<span class="${got[i] ? 'on' : ''}"><b>${got[i] ? '✓' : PIECE_DAYS[i]}</b>${x}</span>`).join('')}</div>`;
  }

  // ── mini game: penalty in the snow. One shot; pick a corner, Horacio dives. ──
  function penalty(b, n, hard, o) {
    const done = flakes()[n];
    const Z = [[18, 30], [50, 30], [82, 30], [18, 70], [50, 70], [82, 70]];
    b.innerHTML = `<h3>${hard ? T('Penalty in the snow: hard mode', 'Penalti en la nieve: modo difícil', 'Pênalti na neve: modo difícil') : T('Penalty in the snow', 'Penalti en la nieve', 'Pênalti na neve')}</h3>
      <p class="adv-note">${done != null ? T("You've taken today's penalty.", 'Ya tiraste el penalti de hoy.', 'Você já cobrou o pênalti de hoje.') : hard ? T('Horacio has been studying your penalties. One shot: pick your corner.', 'Horacio ha estudiado tus penaltis. Un disparo: elige esquina.', 'Horacio estudou seus pênaltis. Um chute: escolha o canto.') : T('One shot. Tap where you want to shoot.', 'Un disparo. Toca donde quieras chutar.', 'Um chute. Toque onde quer chutar.')}</p>
      <div class="pk"><div class="pk-goal">${Z.map((z, i) => `<button type="button" class="pk-z" data-z="${i}" style="left:${z[0]}%;top:${z[1]}%" aria-label="${T('Shoot here', 'Chuta aquí', 'Chute aqui')}" ${done != null ? 'disabled' : ''}></button>`).join('')}
        <img class="pk-keep" src="/rosco/host/xmas/excited.png" alt="Horacio"></div><i class="pk-ball"></i></div>
      <p class="adv-big" aria-live="polite">${done != null ? (done >= 10 ? T('GOAL! +10 ❄', '¡GOL! +10 ❄', 'GOL! +10 ❄') : T('Saved! +3 ❄', '¡Parada! +3 ❄', 'Defendeu! +3 ❄')) : ''}</p>${missedNote(o)}`;
    if (done != null) return;
    b.querySelectorAll('.pk-z').forEach(z => z.onclick = () => {
      const i = +z.dataset.z; b.querySelectorAll('.pk-z').forEach(x => x.disabled = true);
      const k = hard && Math.random() < .5 ? i : Math.floor(Math.random() * 6), goal = k !== i;
      const pk = b.querySelector('.pk'), goalEl = b.querySelector('.pk-goal'), ball = b.querySelector('.pk-ball'), keep = b.querySelector('.pk-keep');
      const gr = goalEl.getBoundingClientRect(), pr = pk.getBoundingClientRect(), br = ball.getBoundingClientRect();
      const tx = gr.left + gr.width * Z[i][0] / 100 - (br.left + br.width / 2), ty = gr.top + gr.height * Z[i][1] / 100 - (br.top + br.height / 2);
      ball.style.transform = `translate(${tx}px,${ty}px) scale(.6) rotate(540deg)`;
      keep.style.transform = `translate(${(Z[k][0] - 50) * 1.6}%,${Z[k][1] < 50 ? -38 : -6}%) rotate(${(Z[k][0] - 50) * .7}deg)`;
      setTimeout(() => {
        addFlakes(n, goal ? 10 : 3, o);
        keep.src = goal ? '/rosco/host/xmas/facepalm.png' : '/rosco/host/xmas/celebrate.png';
        if (goal) pk.classList.add('scored');
        b.querySelector('.adv-big').textContent = goal ? T('GOAL!', '¡GOL!', 'GOL!') + (o.missed ? '' : ' +10 ❄') : T('Saved by Horacio!', '¡Parada de Horacio!', 'Horacio defendeu!') + (o.missed ? '' : ' +3 ❄');
        track('advent_penalty', { n, goal });
      }, 480);
    });
  }

  // ── mini game: catch the presents. 20 seconds; move the reindeer with your finger, mouse or arrow keys. ──
  function catchGame(b, n, mult, o) {
    const best = flakes()[n];
    b.innerHTML = `<h3>${T('Catch the presents', 'Atrapa los regalos', 'Pegue os presentes')}${mult > 1 ? ' ×2' : ''}</h3>
      <p class="adv-note">${T('Move the reindeer to catch the presents. Dodge the coal! 20 seconds.', 'Mueve al reno para atrapar los regalos. ¡Esquiva el carbón! 20 segundos.', 'Mova a rena para pegar os presentes. Desvie do carvão! 20 segundos.')}${best != null ? ' ' + T(`Your best: ${best} ❄`, `Tu mejor: ${best} ❄`, `Seu melhor: ${best} ❄`) : ''}</p>
      <div class="cg"><div class="cg-hud"><span class="cg-s">0</span><span class="cg-t">20</span></div><i class="cg-r"></i>
        <button type="button" class="adv-btn cg-go">${T('Start', 'Empezar', 'Começar')}</button></div>
      <p class="adv-big" aria-live="polite"></p>${missedNote(o)}`;
    const box = b.querySelector('.cg'), deer = b.querySelector('.cg-r');
    try { deer.style.backgroundImage = kitImg(kitById('xm-reindeer')) } catch { }
    let x = .5, items = [], score = 0, t0 = 0, raf = 0, last = 0, spawnAt = 0, running = false, keys = {};
    const W = () => box.clientWidth, H = () => box.clientHeight, DW = 70;
    const place = () => deer.style.transform = `translateX(${x * (W() - DW)}px)`;
    place();
    const setX = cx => { const r = box.getBoundingClientRect(); x = Math.max(0, Math.min(1, (cx - r.left - DW / 2) / (r.width - DW))); place() };
    box.addEventListener('pointermove', e => { if (running) setX(e.clientX) });
    box.addEventListener('pointerdown', e => { if (running) { setX(e.clientX); box.setPointerCapture?.(e.pointerId) } });
    const kd = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys[e.key] = e.type === 'keydown'; e.preventDefault() } };
    addEventListener('keydown', kd); addEventListener('keyup', kd);
    const end = () => {
      running = false; cancelAnimationFrame(raf); items.forEach(it => it.el.remove()); items = [];
      const v = Math.min(30, Math.max(0, score) * mult); addFlakes(n, v, o);
      b.querySelector('.adv-big').textContent = T(`${score} presents!`, `¡${score} regalos!`, `${score} presentes!`) + (o.missed ? '' : ` +${v} ❄`);
      const go = b.querySelector('.cg-go'); go.textContent = T('Play again', 'Otra vez', 'De novo'); go.hidden = false;
      track('advent_catch', { n, score });
    };
    stopGame = () => { running = false; cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', kd) };
    const frame = t => {
      if (!running) return;
      const dt = Math.min(48, t - last) / 16.7; last = t;
      const el = (t - t0) / 1000, left = Math.max(0, 20 - el);
      b.querySelector('.cg-t').textContent = Math.ceil(left);
      if (keys.ArrowLeft) { x = Math.max(0, x - .025 * dt); place() } if (keys.ArrowRight) { x = Math.min(1, x + .025 * dt); place() }
      if (t >= spawnAt) {
        const coal = Math.random() < .2, it = document.createElement('i');
        it.className = 'cg-i' + (coal ? ' coal' : ''); if (!coal) it.style.backgroundImage = `url(/xmas/deco/gift-${Math.random() < .5 ? 'red' : 'green'}.png)`;
        box.appendChild(it); items.push({ el: it, x: Math.random() * (W() - 34), y: -34, v: 2.2 + el * .12 + Math.random() * 1.2, coal });
        spawnAt = t + Math.max(260, 620 - el * 18);
      }
      const dx = x * (W() - DW), floor = H() - 56;
      items = items.filter(it => {
        it.y += it.v * dt; it.el.style.transform = `translate(${it.x}px,${it.y}px)`;
        if (it.y > floor - 30 && it.y < floor + 10 && it.x + 30 > dx && it.x < dx + DW) {
          score += it.coal ? -2 : 1; b.querySelector('.cg-s').textContent = score;
          deer.classList.remove('hit'); void deer.offsetWidth; deer.classList.add(it.coal ? 'hit' : 'hit');
          it.el.remove(); return false;
        }
        if (it.y > H()) { it.el.remove(); return false }
        return true;
      });
      if (left <= 0) return end();
      raf = requestAnimationFrame(frame);
    };
    b.querySelector('.cg-go').onclick = e => {
      e.currentTarget.hidden = true; score = 0; b.querySelector('.cg-s').textContent = 0; b.querySelector('.adv-big').textContent = '';
      running = true; t0 = last = performance.now(); spawnAt = t0 + 300; raf = requestAnimationFrame(frame);
    };
  }

  // ── styles for the pop-up and the games (shared by the home page and the preview) ──
  const css = `
dialog.adv-dlg{border:4px solid #000!important;border-radius:0!important;padding:0!important;background:#f6eed8!important;color:#1d1a2b!important;box-shadow:6px 6px 0 rgba(0,0,0,.5);width:min(460px,calc(100vw - 24px));max-height:calc(100dvh - 32px);overflow:auto}
.adv-dlg::backdrop{background:rgba(10,8,20,.6)}
.adv-dlg[open]{animation:advIn .22s cubic-bezier(.23,1,.32,1)}@keyframes advIn{from{opacity:0;transform:scale(.95)}}
.adv-in{position:relative;padding:16px 18px 18px}
#adv-dlg button{font-family:inherit}
#adv-dlg [hidden]{display:none!important}
#adv-dlg .adv-x{all:unset;box-sizing:border-box;display:grid;place-items:center;position:absolute;right:10px;top:10px;width:34px;height:34px;border:3px solid #000;background:#fff;font:400 18px/1 monospace;cursor:pointer;transition:transform .12s ease-out}
#adv-dlg .adv-x:active{transform:scale(.94)}
.adv-top{display:flex;align-items:center;gap:10px;margin:0 44px 12px 0;font:400 14px/1 VT323,monospace;letter-spacing:.12em;color:#6b5f86}
.adv-no{display:grid;place-items:center;width:42px;height:42px;background:#c8473b;color:#fff;border:3px solid #000;font:400 24px/1 'Jersey 10',monospace;letter-spacing:0}
.adv-fl{margin-left:auto;color:#2f7fc4;font-size:17px;letter-spacing:.04em}
.adv-body h3{margin:0 0 10px;font:400 26px/1.1 'Jersey 10',monospace;color:#1d1a2b;text-shadow:none}.adv-body h3 small{font:400 15px VT323,monospace;color:#6b5f86;margin-left:6px}
.adv-body p{margin:0 0 12px;font:400 17px/1.35 VT323,monospace}
.adv-note{color:#5b5070}.adv-qq{font-size:19px!important;color:#1d1a2b}
.adv-big{font:400 26px/1 'Jersey 10',monospace!important;text-align:center;min-height:26px;color:#1d1a2b}
#adv-dlg .adv-btn{all:unset;box-sizing:border-box;text-align:center;display:block;width:100%;padding:12px;background:#2ebd6b;color:#fff;border:3px solid #000;box-shadow:0 4px 0 #000;font:400 20px/1 'Jersey 10',monospace;cursor:pointer;transition:transform .12s ease-out,box-shadow .12s ease-out}
#adv-dlg .adv-btn.alt{background:#fff;color:#1d1a2b;margin-top:4px}
#adv-dlg .adv-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #000}
.adv-hor{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}.adv-hor img{width:84px;height:84px;image-rendering:pixelated;flex:none;border:3px solid #000;background:#1d4486}
.adv-hor p{background:#fff;border:3px solid #000;padding:10px 12px;margin:0}
.adv-kit{position:relative;display:grid;place-items:center;height:150px;margin:4px 0 10px;background:linear-gradient(#1d4486,#16336a);border:3px solid #000;overflow:hidden}
.adv-kit i{width:180px;height:150px;background:center/contain no-repeat;image-rendering:pixelated}
.adv-kit .adv-q{position:absolute;font:400 64px/1 'Jersey 10',monospace;color:#fff;text-shadow:3px 3px 0 #000}
.adv-pop i{animation:advPop .5s cubic-bezier(.34,1.56,.64,1)}@keyframes advPop{from{transform:scale(.8);opacity:0}}
.adv-pcs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.adv-pcs span{display:flex;flex-direction:column;align-items:center;gap:4px;font:400 14px/1 VT323,monospace;color:#6b5f86}
.adv-pcs b{display:grid;place-items:center;width:38px;height:38px;border:3px solid #000;background:#e2d8bd;font:400 18px/1 'Jersey 10',monospace;color:#6b5f86}.adv-pcs .on b{background:#7cc7f0;color:#fff}
.adv-opts{display:grid;gap:8px;margin-bottom:10px}.adv-opts.two{grid-template-columns:1fr 1fr}.adv-opts.kits{grid-template-columns:1fr 1fr}
.adv-ow{display:flex;gap:6px}
#adv-dlg .adv-opt{all:unset;box-sizing:border-box;flex:1;position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 14px;background:#fff;border:3px solid #000;font:400 19px/1.1 'Jersey 10',monospace;color:#1d1a2b;text-align:left;cursor:pointer;transition:transform .12s ease-out,background-color .15s ease}
.adv-opts.kits .adv-opt{flex-direction:column;justify-content:flex-end;padding:8px}
#adv-dlg .adv-opt span,#adv-dlg .adv-opt b,#adv-dlg .adv-opt .adv-ok{position:relative;z-index:1}
#adv-dlg .adv-opt em{position:absolute;left:0;top:0;bottom:0;width:100%;background:#f2c230;opacity:.5;transform-origin:left;transition:transform .5s cubic-bezier(.23,1,.32,1)}
.adv-ok{display:block;width:100%;height:76px;background:center/contain no-repeat;image-rendering:pixelated}
@media (hover:hover) and (pointer:fine){#adv-dlg .adv-opt:not([disabled]):hover{background:#fff3c4}}
#adv-dlg .adv-opt:not([disabled]):active{transform:scale(.97)}
#adv-dlg .adv-opt[disabled]{cursor:default}
#adv-dlg .adv-opt.me{box-shadow:inset 0 0 0 3px #2ebd6b}
#adv-dlg .adv-opt.win{background:#c9f2d8}#adv-dlg .adv-opt.bad{background:#f6d2cd}
.adv-yt{display:grid;place-items:center;width:44px;flex:none;background:#c8473b;color:#fff;border:3px solid #000;text-decoration:none;font-size:18px}
.adv-emoji{font-size:64px;line-height:1.2;text-align:center;margin:4px 0 12px}
.hl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.hl div{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;background:#1d4486;color:#fff;border:3px solid #000;text-align:center}
.hl b{font:400 18px/1.1 'Jersey 10',monospace}.hl-n{font:400 44px/1 'Jersey 10',monospace;color:#f2c230}.hl-n.ok{color:#7fe0a8}.hl-n.no{color:#ff8a80}
.yr{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:12px}
.yr div{display:flex;flex-direction:column;gap:4px;padding:10px;background:#fff;border:3px solid #000;animation:advRise .35s cubic-bezier(.23,1,.32,1) backwards;animation-delay:var(--d,0ms)}
.yr b{font:400 34px/1 'Jersey 10',monospace;color:#c8473b}.yr span{font:400 15px/1.1 VT323,monospace;color:#5b5070}
@keyframes advRise{from{opacity:0;transform:translateY(8px)}}
.goal{position:relative;height:34px;border:3px solid #000;background:#fff;margin-bottom:10px;overflow:hidden}
.goal i{position:absolute;inset:0;background:#2ebd6b;transform-origin:left;transition:transform .8s cubic-bezier(.23,1,.32,1)}
.goal span{position:relative;display:grid;place-items:center;height:100%;font:400 18px/1 'Jersey 10',monospace}
.pk{position:relative;height:250px;background:linear-gradient(#cfe3f2 0 58%,#e8f2f8 58%);border:3px solid #000;overflow:hidden;margin-bottom:10px}
.pk-goal{position:absolute;left:12%;right:12%;top:12%;height:52%;border:5px solid #fff;border-bottom:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.35) 0 2px,transparent 2px 12px),repeating-linear-gradient(0deg,rgba(255,255,255,.35) 0 2px,transparent 2px 12px)}
#adv-dlg .pk-z{all:unset;box-sizing:border-box;position:absolute;width:30%;height:42%;transform:translate(-50%,-50%);border:2px dashed rgba(29,26,43,.35);cursor:crosshair;z-index:2}
@media (hover:hover) and (pointer:fine){#adv-dlg .pk-z:not([disabled]):hover{background:rgba(242,194,48,.35)}}
#adv-dlg .pk-z[disabled]{cursor:default;border-color:transparent}
.pk-keep{position:absolute;left:50%;bottom:-4px;width:96px;margin-left:-48px;image-rendering:pixelated;transition:transform .42s cubic-bezier(.23,1,.32,1)}
.pk-ball{position:absolute;left:50%;bottom:14px;width:22px;height:22px;margin-left:-11px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff 0 40%,#ccc 41%),#fff;border:2px solid #000;transition:transform .46s cubic-bezier(.2,.7,.3,1)}
.pk.scored .pk-goal{animation:advNet .3s ease-out}@keyframes advNet{40%{transform:scale(1.02,1.03)}}
.cg{position:relative;height:300px;border:3px solid #000;background:linear-gradient(#16336a,#2a4f92 70%,#e8f2f8 70%);overflow:hidden;margin-bottom:10px;touch-action:none;user-select:none}
.cg-hud{position:absolute;left:8px;right:8px;top:6px;display:flex;justify-content:space-between;font:400 26px/1 'Jersey 10',monospace;color:#fff;text-shadow:2px 2px 0 #000;z-index:3}
.cg-s:before{content:"🎁 "}.cg-t:after{content:"s"}
.cg-r{position:absolute;left:0;bottom:8px;width:70px;height:58px;background:center/contain no-repeat;image-rendering:pixelated;z-index:2}
.cg-r.hit{animation:advBump .2s ease-out}@keyframes advBump{50%{translate:0 -4px}}
.cg-i{position:absolute;left:0;top:0;width:34px;height:34px;background:center/contain no-repeat;image-rendering:pixelated;will-change:transform}
.cg-i.coal{width:26px;height:26px;margin:4px;border-radius:40%;background:#2a2a2a;box-shadow:inset -4px -4px 0 #000,inset 3px 3px 0 #5a5a5a}
#adv-dlg .cg-go{position:absolute;left:50%;top:50%;width:auto;padding:12px 28px;transform:translate(-50%,-50%);z-index:4}
#adv-dlg .cg-go:active{transform:translate(-50%,-50%) scale(.97)}
@media (prefers-reduced-motion:reduce){.adv-dlg[open],.adv-pop i,.yr div{animation:none}.pk-keep,.pk-ball{transition-duration:0s}}`;
  if (!document.getElementById('adv-css')) { const s = document.createElement('style'); s.id = 'adv-css'; s.textContent = css; document.head.appendChild(s) }

  window.ucAdvent = { open, total, flakes };
  if (!PREVIEW) window.ucAdventRedraw?.();
})();
