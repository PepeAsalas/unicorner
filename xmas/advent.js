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
  // the secret kit is shown on top of the season's default kit (Reindeer)
  const frostOn = n => { const base = kitById('xm-reindeer') || {}; const f = frostKit(n); const id = n >= 4 ? 'xm-frost' : 'xm-frost-p' + n; return n >= 3 ? { ...f, id } : { ...base, id, addon: f.addon } };
  const kitImg = k => { try { return (window.sprite || window.spriteDraw)('happy', 0, false, k).replace(/"/g, "'") } catch { return 'none' } };
  const rnd = a => a[Math.floor(Math.random() * a.length)];

  // server calls (votes, door counter); the preview fakes them
  const rpc = (fn, a) => {
    if (PREVIEW) {
      if (fn === 'advent_vote') return Promise.resolve({ voted: a.p_option });
      if (fn === 'advent_open') return Promise.resolve(a.p_day === 13 ? 1040 : 900);
      if (fn === 'advent_flakes_top') return Promise.resolve({ players: 812, me: { rank: 14, total: 96 }, top: [['brf_1871', 'xm-santa', 212], ['PaddyJ', 'xm-frost', 205], ['JG_gasperin', 'xm-elf', 198], ['Chummers', 'xm-jumper', 187], ['XxCillyWillyxX', 'xm-snowman', 176], ['Pepo', 'xm-reindeer', 160], ['footyfan', 'xm-tree', 151], ['NetBuster', 'xm-reindeer', 140], ['Ollie_9', 'xm-jumper', 133], ['Kopite88', 'xm-snowman', 121]].map(([nick, kit, total], i) => ({ nick, kit, total, rank: i + 1 })) });
      if (fn.startsWith('advent_flakes')) return Promise.resolve(null);
      if (fn === 'advent_results') { const c = {}; [41, 27, 19, 13].forEach((v, i) => c[i] = v * 31); return Promise.resolve({ closed: true, total: 3100, mine: null, counts: c }) }
    }
    return window.ucPubRpc ? window.ucPubRpc(fn, a) : Promise.reject(new Error('offline'));
  };
  const srpc = (fn, a) => !PREVIEW && window.ucSignedIn?.() && window.ucRpc ? window.ucRpc(fn, a).catch(() => rpc(fn, a)) : rpc(fn, a);
  const winnerOf = res => { const c = (res && res.counts) || {}; let best = -1, w = null; for (const k in c) if (+c[k] > best) { best = +c[k]; w = +k } return w };

  // kits won in the calendar: kept on this device (the account picks them up with your other kits)
  const grant = id => {
    let d = []; try { d = JSON.parse(ls('uc-kit-done') || '[]') } catch { }
    if (!d.includes(id)) { d.push(id); ls('uc-kit-done', JSON.stringify(d)); try { window.ucLookSync?.() } catch { } }
  };

  // ── snowflakes: best score per door ──
  const flakes = () => { try { return JSON.parse(ls('uc-adv-flakes') || '{}') } catch { return {} } };
  const total = () => Object.values(flakes()).reduce((a, b) => a + b, 0);
  const addFlakes = (n, v, o) => { if (o.missed) return; const f = flakes(); if ((f[n] || 0) < v) { f[n] = v; ls('uc-adv-flakes', JSON.stringify(f)); srpc('advent_flakes_save', { p_day: n, p_flakes: Math.min(30, v), p_visitor: visitor() }).catch(() => { }) } refreshFlakes() };
  // snowflakes live on the server (your account when signed in, this browser otherwise): merge both ways on load
  const syncFlakes = () => {
    if (PREVIEW) return;
    srpc('advent_flakes_mine', { p_visitor: visitor() }).then(srv => {
      if (!srv || typeof srv !== 'object') return;
      const f = flakes(); let changed = false;
      for (const k in srv) if ((f[k] || 0) < +srv[k]) { f[k] = +srv[k]; changed = true }
      for (const k in f) if ((+srv[k] || 0) < f[k]) srpc('advent_flakes_save', { p_day: +k, p_flakes: Math.min(30, f[k]), p_visitor: visitor() }).catch(() => { });
      if (changed) { ls('uc-adv-flakes', JSON.stringify(f)); refreshFlakes() }
    }).catch(() => { });
  };
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
         [T('The 2022 World Cup final was played on which date?', '¿En qué fecha se jugó la final del Mundial 2022?', 'Em que data foi a final da Copa de 2022?'), [T('11 December', '11 de diciembre', '11 de dezembro'), T('18 December', '18 de diciembre', '18 de dezembro'), T('20 December', '20 de diciembre', '20 de dezembro'), T('23 December', '23 de diciembre', '23 de dezembro')], 1],
         [T("Who scored Argentina's winning penalty in the 2022 final shootout?", '¿Quién marcó el penalti ganador de Argentina en la tanda de la final de 2022?', 'Quem marcou o pênalti decisivo da Argentina na final de 2022?'), ['Leandro Paredes', 'Paulo Dybala', 'Gonzalo Montiel', 'Lautaro Martínez'], 2],
         [T('Who refereed the 2022 World Cup final?', '¿Quién arbitró la final del Mundial 2022?', 'Quem apitou a final da Copa de 2022?'), ['Szymon Marciniak', 'Daniele Orsato', 'Clément Turpin', 'Anthony Taylor'], 0]] },
    6: { t: 'catch', mult: 1 },
    7: { t: 'vote', q: T('The greatest save ever?', '¿La mejor parada de la historia?', 'A maior defesa de todos os tempos?'),
         opts: [[null, T('Gordon Banks vs Pelé, 1970', 'Gordon Banks ante Pelé, 1970', 'Gordon Banks contra Pelé, 1970'), 'Gordon Banks save Pele 1970'],
                [null, T("Higuita's scorpion kick, 1995", 'El escorpión de Higuita, 1995', 'O escorpião de Higuita, 1995'), 'Higuita scorpion kick Wembley 1995'],
                [null, T("Dudek's double save, 2005 final", 'Doble parada de Dudek, final 2005', 'Defesa dupla de Dudek, final de 2005'), 'Dudek double save Shevchenko 2005'],
                [null, T('Casillas vs Robben, 2010 final', 'Casillas ante Robben, final 2010', 'Casillas contra Robben, final de 2010'), 'Casillas save Robben 2010 World Cup final']],
         after: T('Tap ▶ to watch each one. The winner goes on our Instagram.', 'Toca ▶ para verlas. La ganadora irá a nuestro Instagram.', 'Toque ▶ para assistir. A vencedora vai para o nosso Instagram.') },
    8: { t: 'year' },
    9: { t: 'piece', n: 2, name: T('the scarf', 'la bufanda', 'o cachecol') },
    10: { t: 'quiz', title: T('Clásico crossovers', 'Cruzados del Clásico', 'Atravessaram o Clássico'), qs: [
         [T('Only one of these played for both Real Madrid and Barcelona. Who?', 'Solo uno de estos jugó en el Real Madrid y en el Barcelona. ¿Cuál?', 'Só um destes jogou no Real Madrid e no Barcelona. Qual?'), ['Hristo Stoichkov', 'Romário', 'Gheorghe Hagi', 'Ronald Koeman'], 2],
         [T('And here?', '¿Y aquí?', 'E aqui?'), ['Diego Maradona', 'Bernd Schuster', 'Gary Lineker', 'Mark Hughes'], 1],
         [T('Last one: who crossed the divide?', 'La última: ¿quién cruzó la línea?', 'A última: quem atravessou?'), ['Juan Román Riquelme', 'Ivan Rakitić', 'Rafael Márquez', 'Javier Saviola'], 3]] },
    11: { t: 'emoji', set: [['🦉', 'Sheffield Wednesday', ['Sheffield United', 'Bolton Wanderers', 'Hull City']], ['🍬', 'Everton', ['Liverpool', 'Preston North End', 'Bolton Wanderers']], ['🦢', 'Swansea City', ['Cardiff City', 'Norwich City', 'Reading']], ['🐐', 'FC Köln', ['Hamburger SV', 'Werder Bremen', 'Hertha Berlin']], ['🐍', 'Inter', ['AC Milan', 'Juventus', 'Napoli']]] },
    12: { t: 'vote', q: T('Pick the theme of the Christmas Day Daily 5', 'Elige el tema del Diario 5 de Navidad', 'Escolha o tema do Diário 5 de Natal'),
          opts: [[null, 'Premier League'], [null, T('World Cups', 'Mundiales', 'Copas do Mundo')], [null, 'La Liga'], [null, 'Champions League']],
          after: T('The winning theme is the Daily 5 on 25 December.', 'El tema ganador será el Diario 5 del 25 de diciembre.', 'O tema vencedor será o Diário 5 de 25 de dezembro.') },
    13: { t: 'goal', target: 1000 },
    14: { t: 'quiz', title: T('World Cup finals', 'Finales del Mundial', 'Finais de Copa'), qs: [
         [T('Who won the Golden Ball (best player) at the 2002 World Cup?', '¿Quién ganó el Balón de Oro (mejor jugador) del Mundial 2002?', 'Quem ganhou a Bola de Ouro (melhor jogador) da Copa de 2002?'), ['Ronaldo Nazário', 'Rivaldo', 'Oliver Kahn', 'Michael Ballack'], 2],
         [T('Who scored the winner in the 2014 final?', '¿Quién marcó el gol de la victoria en la final de 2014?', 'Quem marcou o gol da vitória na final de 2014?'), ['Thomas Müller', 'André Schürrle', 'Miroslav Klose', 'Mario Götze'], 3],
         [T("Who scored Italy's goal in normal time in the 2006 final?", '¿Quién marcó el gol de Italia en el tiempo reglamentario de la final de 2006?', 'Quem marcou o gol da Itália no tempo normal da final de 2006?'), ['Andrea Pirlo', 'Marco Materazzi', 'Luca Toni', 'Alessandro Del Piero'], 1]] },
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
    20: { t: 'emoji', set: [['🐏', 'Derby County', ['Leeds United', 'Nottingham Forest', 'Stoke City']], ['🐯', 'Hull City', ['Wolves', 'Leicester City', 'Burnley']], ['🦓', 'Juventus', ['Torino', 'Fiorentina', 'Atalanta']], ['🐺', 'Roma', ['Lazio', 'Napoli', 'Fiorentina']], ['🦇', 'Valencia', ['Sevilla', 'Real Betis', 'Villarreal']]] },
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
      dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-adv-x]')) dlg.close(); else if (e.target.closest('[data-adv-lb]')) { stopGame?.(); stopGame = null; board(dlg.querySelector('.adv-body')) } });
      dlg.addEventListener('close', () => { stopGame?.(); stopGame = null });
    }
    dlg.innerHTML = `<div class="adv-in"><button type="button" class="adv-x" data-adv-x aria-label="${T('Close', 'Cerrar', 'Fechar')}">✕</button>
      <div class="adv-top"><span class="adv-no">${n}</span><span>${T('DECEMBER', 'DICIEMBRE', 'DEZEMBRO')}</span><button type="button" class="adv-fl" data-adv-lb title="${T('Snowflake leaderboard', 'Clasificación de copos', 'Ranking de flocos')}">❄ ${total()} ▸</button></div>
      <div class="adv-body"></div></div>`;
    if (!dlg.open) dlg.showModal();
    return dlg.querySelector('.adv-body');
  }
  let stopGame = null; // set by games that run a loop or listen to keys; called when the pop-up closes
  const refreshFlakes = () => { const f = dlg?.querySelector('.adv-fl'); if (f) f.textContent = '❄ ' + total() + ' ▸'; if (!PREVIEW) window.ucAdventRedraw?.() };

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
        + `<div class="adv-kit"><i style="background-image:${kitImg(frostKit(4))};filter:brightness(0) opacity(.45)"></i><span class="adv-q">?</span></div>${pieceRow()}`;
    },
    piece(b, n, cfg, o) {
      const have = PREVIEW ? cfg.n : pieces(n);
      b.innerHTML = `<h3>${o.missed ? T('You missed this piece', 'Te perdiste esta pieza', 'Você perdeu esta peça') : T(`Secret kit: piece ${cfg.n} of 4`, `Equipación secreta: pieza ${cfg.n} de 4`, `Uniforme secreto: peça ${cfg.n} de 4`)}</h3>
        <div class="adv-kit adv-pop"><i style="background-image:${kitImg(frostOn(have))}"></i></div>
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
      if (doneBefore(b, n, cfg.title)) return;
      let i = 0, right = 0;
      const step = () => {
        if (i >= cfg.qs.length) {
          const v = right * 3; addFlakes(n, v, o); ls('uc-adv-done-' + n, right + '/' + cfg.qs.length);
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
      if (doneBefore(b, n, T('Emoji club', 'Club emoji', 'Clube emoji'))) return;
      let i = 0, right = 0;
      const set = cfg.set.map(([e, a, wrong]) => [e, a, [a, ...wrong].sort(() => Math.random() - .5)]);
      const step = () => {
        if (i >= set.length) {
          const v = right * 2; addFlakes(n, v, o); ls('uc-adv-done-' + n, right + '/' + set.length);
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
      if (doneBefore(b, n, T('Higher or lower', 'Más o menos', 'Mais ou menos'))) return;
      // World Cup goals (retired players, so the numbers can't change), a chain with no ties
      const C = [['Zinedine Zidane', 5], ['Miroslav Klose', 16], ['Diego Maradona', 8], ['Gerd Müller', 14], ['Eusébio', 9], ['Ronaldo Nazário', 15], ['Gary Lineker', 10], ['Pelé', 12]];
      let i = 0, right = 0;
      const step = () => {
        if (i >= C.length - 1) {
          const v = right * 2; addFlakes(n, v, o); ls('uc-adv-done-' + n, right + '/' + (C.length - 1));
          b.innerHTML = `<h3>${T('Higher or lower', 'Más o menos', 'Mais ou menos')}</h3>${horacio(right >= 5 ? 'celebrate' : 'think', T(`${right} out of ${C.length - 1}!`, `¡${right} de ${C.length - 1}!`, `${right} de ${C.length - 1}!`))}<p class="adv-big">${o.missed ? '' : `+${v} ❄`}</p>${missedNote(o)}`;
          return;
        }
        const [a, av] = C[i], [c, cv] = C[i + 1];
        b.innerHTML = `<h3>${T('Higher or lower', 'Más o menos', 'Mais ou menos')} <small>${i + 1}/${C.length - 1}</small></h3><p class="adv-note">${T('Goals scored at World Cups', 'Goles marcados en Mundiales', 'Gols marcados em Copas do Mundo')}</p>
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
      // everything comes from the games saved on this device
      const DAYN = [T('Sundays', 'domingos', 'domingos'), T('Mondays', 'lunes', 'segundas'), T('Tuesdays', 'martes', 'terças'), T('Wednesdays', 'miércoles', 'quartas'), T('Thursdays', 'jueves', 'quintas'), T('Fridays', 'viernes', 'sextas'), T('Saturdays', 'sábados', 'sábados')];
      let g = [];
      if (!PREVIEW) try {
        for (const k of Object.keys(localStorage)) {
          if (!/^unicorner-played-\d{4}-\d\d-\d\d$/.test(k)) continue;
          const day = k.slice(17); let r = null; try { r = JSON.parse(localStorage.getItem(k)) } catch { }
          const picks = Array.isArray(r?.picks) ? r.picks.filter(Array.isArray) : [];
          let sc = 0; try { sc = newScoreOf(r, day) } catch { sc = +r?.score || 0 }
          g.push({ day, sc, picks });
        }
      } catch { }
      let st = {}; try { st = PREVIEW ? {} : kitStats() } catch { }
      const S = g.length ? {
        games: g.length, total: g.reduce((a, x) => a + x.sc, 0), best: g.reduce((a, x) => x.sc > a.sc ? x : a, g[0]),
        first: g.map(x => x.day).sort()[0],
        // longest run of consecutive days played
        streak: (() => { const ds = g.map(x => x.day).sort(); let best = 0, run = 0, prev = null; for (const d of ds) { const t = Date.parse(d + 'T12:00:00Z'); run = prev != null && t - prev === 864e5 ? run + 1 : 1; prev = t; best = Math.max(best, run) } return Math.max(best, st.streak || 0) })(),
        scr: Math.max(st.scr || 0, g.reduce((a, x) => a + x.picks.filter(p => +p[2] >= 100).length, 0)),
        perfect: Math.max(st.allfive || 0, g.filter(x => x.picks.length === 5 && x.picks.every(p => +p[2] > 0)).length),
        wd: (() => { const c = Array(7).fill(0); g.forEach(x => c[new Date(x.day + 'T12:00:00').getDay()]++); return c.indexOf(Math.max(...c)) })(),
        rare: [...new Set(g.flatMap(x => x.picks.filter(p => +p[2] >= 100 && p[1]).map(p => String(p[1]))))].slice(-3),
      } : { games: 47, total: 13420, best: { sc: 482, day: '2026-11-14' }, first: '2026-09-21', streak: 12, scr: 9, perfect: 6, wd: 2, rare: ['Ricardo Pereira', 'Marcos Senna', 'Asmir Begović'] };
      const fmt = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) } catch { return d } };
      const tiles = [[S.games, T('Daily 5 games', 'partidos del Diario 5', 'jogos do Diário 5')], [S.total.toLocaleString(), T('points in total', 'puntos en total', 'pontos no total')],
        [Math.round(S.total / S.games), T('average score', 'puntuación media', 'pontuação média')], [S.best.sc, T(`best score (${fmt(S.best.day)})`, `mejor puntuación (${fmt(S.best.day)})`, `melhor pontuação (${fmt(S.best.day)})`)],
        [S.streak, T('best streak', 'mejor racha', 'melhor sequência')], [S.scr, T('Screamers found', 'chicharros', 'golaços')],
        [S.perfect, T('perfect 5/5 games', 'partidos 5/5', 'jogos 5/5')], [fmt(S.first), T('your first game', 'tu primer partido', 'seu primeiro jogo')]];
      b.innerHTML = `<h3>${T('Your year in Unicorner', 'Tu año en Unicorner', 'Seu ano no Unicorner')}</h3>
        <div class="yr">${tiles.map(([v, k], i) => `<div style="--d:${i * 45}ms"><b>${esc(v)}</b><span>${k}</span></div>`).join('')}</div>
        <p class="adv-note">${T(`You play most on ${DAYN[S.wd]}.`, `Juegas sobre todo los ${DAYN[S.wd]}.`, `Você joga mais às ${DAYN[S.wd]}.`)}</p>
        ${S.rare.length ? `<p class="adv-note">${T('Your rarest answers:', 'Tus respuestas más raras:', 'Suas respostas mais raras:')} <b>${S.rare.map(esc).join(', ')}</b></p>` : ''}
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
        <div class="lb-embed"></div><p class="adv-note">${star ? T('20 doors or more: the Golden star kit is yours!', '20 puertas o más: ¡la Estrella dorada es tuya!', '20 portas ou mais: a Estrela dourada é sua!') : T(`Open 20 doors for the Golden star kit (you have ${doors}). Or play on Christmas Day!`, `Abre 20 puertas para la Estrella dorada (llevas ${doors}). ¡O juega el día de Navidad!`, `Abra 20 portas para a Estrela dourada (você tem ${doors}). Ou jogue no dia de Natal!`)}</p>`;
      board(b.querySelector('.lb-embed'), true);
    },
  };

  // one go per quiz: opening it again shows how you did
  function doneBefore(b, n, title) {
    const d = ls('uc-adv-done-' + n); if (!d || PREVIEW) return false;
    b.innerHTML = `<h3>${esc(title)}</h3>${horacio('wink', T(`You already played this one: ${d}. A new door opens tomorrow!`, `Ya jugaste esta: ${d}. ¡Mañana se abre otra puerta!`, `Você já jogou esta: ${d}. Amanhã abre outra porta!`))}<p class="adv-big">❄ ${flakes()[n] || 0}</p>`;
    return true;
  }

  // the snowflake leaderboard (signed-in players)
  function board(b, embed) {
    const el = embed ? document.createElement('div') : b; if (embed) b.appendChild(el);
    el.innerHTML = `<h3>${T('Snowflake leaderboard', 'Clasificación de copos', 'Ranking de flocos')}</h3><p class="adv-note">…</p>`;
    srpc('advent_flakes_top', {}).then(r => {
      if (!r) throw 0;
      const me = r.me, signed = PREVIEW || window.ucSignedIn?.();
      el.innerHTML = `<h3>${T('Snowflake leaderboard', 'Clasificación de copos', 'Ranking de flocos')}</h3>
        <ol class="lb">${(r.top || []).map(x => `<li><b>${x.rank}</b><i style="background-image:${kitImg(kitById(x.kit))}"></i><span>${esc(x.nick)}</span><em>❄ ${x.total}</em></li>`).join('') || `<li class="lb-empty">${T('No one yet. Be the first!', 'Nadie todavía. ¡Sé el primero!', 'Ninguém ainda. Seja o primeiro!')}</li>`}</ol>
        <p class="adv-note">${signed ? (me ? T(`You're #${me.rank} of ${r.players} with ❄ ${me.total}.`, `Vas #${me.rank} de ${r.players} con ❄ ${me.total}.`, `Você é #${me.rank} de ${r.players} com ❄ ${me.total}.`) : T('Win snowflakes in the mini games and quizzes to get on the board.', 'Gana copos en los minijuegos y quizzes para entrar.', 'Ganhe flocos nos minijogos e quizzes para entrar.'))
          : T('Sign in to get on the leaderboard and keep your snowflakes on every device.', 'Inicia sesión para entrar en la clasificación y tener tus copos en todos tus dispositivos.', 'Entre para aparecer no ranking e manter seus flocos em todos os aparelhos.')}</p>
        ${!signed && window.ucOpenLogin ? `<button type="button" class="adv-btn" data-adv-login>${T('Sign in', 'Iniciar sesión', 'Entrar')}</button>` : ''}`;
      el.querySelector('[data-adv-login]')?.addEventListener('click', () => { dlg.close(); window.ucOpenLogin() });
    }).catch(() => { el.querySelector('.adv-note').textContent = T('The leaderboard is not available right now.', 'La clasificación no está disponible ahora.', 'O ranking não está disponível agora.') });
  }

  function pieceRow(upTo) {
    const names = [T('Crown', 'Corona', 'Coroa'), T('Scarf', 'Bufanda', 'Cachecol'), T('Jumper', 'Jersey', 'Suéter'), T('Boots', 'Botas', 'Botas')];
    const got = PIECE_DAYS.map((d, i) => upTo != null ? i < upTo : played(dateOf(d)) && dateOf(d) <= today());
    return `<div class="adv-pcs">${names.map((x, i) => `<span class="${got[i] ? 'on' : ''}"><b>${got[i] ? '✓' : PIECE_DAYS[i]}</b>${x}</span>`).join('')}</div>`;
  }

  // ── mini game: penalty shootout in the snow. Skill + strategy:
  //    1. Horacio leans before each shot: usually he dives that way, sometimes it's a bluff (more bluffs in hard mode).
  //    2. You pick a corner, then stop the power bar. Too soft and he gets to it, too hard and it flies over or wide,
  //       a perfect strike in a corner beats him even if he guesses right. The bar speeds up with every goal.
  //    3. He remembers your favourite side. One save and the run is over.
  function penalty(b, n, hard, o) {
    const best = flakes()[n];
    const Z = [[24, 43], [50, 43], [76, 43], [24, 76], [50, 76], [76, 76]];
    const GK = '/xmas/gk/', DIVE = ['dive-left-high', 'jump-middle', 'dive-right-high', 'dive-left-low', 'ready', 'dive-right-low'];
    DIVE.concat(['save', 'beaten']).forEach(f => { const im = new Image(); im.src = GK + f + '.png' });
    let goals = 0, phase = 'aim', aim = -1, lean = 1, genuine = true, raf = 0, pw = 0, dir = 1, lastT = 0, cols = [0, 0, 0];
    b.innerHTML = `<h3>${hard ? T('Shootout in the snow: hard mode', 'Tanda en la nieve: modo difícil', 'Disputa na neve: modo difícil') : T('Shootout in the snow', 'Tanda de penaltis en la nieve', 'Disputa de pênaltis na neve')}</h3>
      <p class="adv-note">${T('Read Horacio, pick a corner, then stop the power bar in the green. Gold is a perfect strike. One save and it\'s over.', 'Lee a Horacio, elige esquina y para la barra en el verde. El dorado es un disparo perfecto. Una parada y se acabó.', 'Leia o Horacio, escolha o canto e pare a barra no verde. O dourado é um chute perfeito. Uma defesa e acabou.')}${best != null ? ' ' + T(`Best: ${best} ❄`, `Mejor: ${best} ❄`, `Melhor: ${best} ❄`) : ''}</p>
      <div class="pk"><div class="cg-hud"><span class="pk-g">⚽ 0</span><span class="pk-tell"></span></div><div class="pk-goal">${Z.map((z, i) => `<button type="button" class="pk-z" data-z="${i}" style="left:${z[0]}%;top:${z[1]}%" aria-label="${T('Aim here', 'Apunta aquí', 'Mire aqui')}"></button>`).join('')}
        <img class="pk-keep" src="${GK}ready.png" alt="Horacio"></div><img class="pk-ball" src="/xmas/shootout/ball.png" alt=""></div>
      <div class="pm" hidden><i class="pm-ok"></i><i class="pm-top"></i><i class="pm-n"></i></div>
      <p class="adv-big" aria-live="polite"></p><button type="button" class="adv-btn pk-again" hidden>${T('Again', 'Otra vez', 'De novo')}</button>${missedNote(o)}`;
    const pk = b.querySelector('.pk'), goalEl = b.querySelector('.pk-goal'), ball = b.querySelector('.pk-ball'), keep = b.querySelector('.pk-keep'), msg = b.querySelector('.adv-big');
    const meter = b.querySelector('.pm'), needle = b.querySelector('.pm-n'), tell = b.querySelector('.pk-tell');
    const SWEET = [.5, .82], PERFECT = [.66, .74];
    const setup = () => {
      // Horacio shows which way he's leaning
      lean = [0, 2][Math.floor(Math.random() * 2)]; if (Math.random() < .25) lean = 1;
      genuine = Math.random() > (hard ? .45 : .3);
      keep.style.transition = 'transform .25s ease-out'; keep.src = GK + 'ready.png';
      keep.style.transform = `translateX(${lean === 0 ? -9 : lean === 2 ? 9 : 0}%) rotate(${lean === 0 ? -5 : lean === 2 ? 5 : 0}deg)`;
      tell.textContent = lean === 1 ? T('Horacio stays big…', 'Horacio se hace grande…', 'Horacio fica grande…') : lean === 0 ? T('Horacio leans left…', 'Horacio se inclina a la izquierda…', 'Horacio inclina à esquerda…') : T('Horacio leans right…', 'Horacio se inclina a la derecha…', 'Horacio inclina à direita…');
      ball.style.transition = 'none'; ball.style.transform = ''; void ball.offsetWidth; ball.style.transition = '';
      pk.classList.remove('scored'); b.querySelectorAll('.pk-z').forEach(x => { x.disabled = false; x.classList.remove('on') }); phase = 'aim'; meter.hidden = true;
    };
    const keeperZone = () => {
      // column: follow the lean if it's genuine, else the other way; he also leans on your favourite side
      let col = genuine ? lean : (lean === 1 ? [0, 2][Math.floor(Math.random() * 2)] : 2 - lean);
      const fav = cols.indexOf(Math.max(...cols));
      if (goals >= 2 && Math.random() < Math.min(.35, goals * .05) && cols[fav] > 1) col = fav;
      return col + (Math.random() < .5 ? 0 : 3);
    };
    const runMeter = t => {
      if (phase !== 'power') return;
      const dt = Math.min(48, t - lastT); lastT = t;
      pw += dir * dt * (0.0011 + goals * 0.00016) * (hard ? 1.2 : 1);
      if (pw >= 1) { pw = 1; dir = -1 } if (pw <= 0) { pw = 0; dir = 1 }
      needle.style.transform = `translateX(${pw * 100}%)`;
      raf = requestAnimationFrame(runMeter);
    };
    const shoot = () => {
      if (phase !== 'power') return; phase = 'shot'; cancelAnimationFrame(raf);
      const k = keeperZone(), top = aim < 3, col = aim % 3, kcol = k % 3, p = pw;
      const perfect = p >= PERFECT[0] && p <= PERFECT[1] && col !== 1;
      let result;
      if (p > (top ? .86 : .93)) result = top ? 'over' : 'wide';
      else if (p < SWEET[0]) result = kcol === col ? 'save' : 'goal';
      else result = (k === aim && !perfect) ? 'save' : 'goal';
      cols[col]++;
      const gr = goalEl.getBoundingClientRect(), br = ball.getBoundingClientRect();
      const tx = result === 'wide' ? (col === 0 ? -0.18 : 1.18) : Z[aim][0] / 100, ty = result === 'over' ? -0.25 : Z[aim][1] / 100;
      ball.style.transition = `transform ${p < SWEET[0] ? .7 : .42}s cubic-bezier(.2,.7,.3,1)`;
      ball.style.transform = `translate(${gr.left + gr.width * tx - (br.left + br.width / 2)}px,${gr.top + gr.height * ty - (br.top + br.height / 2)}px) scale(.6) rotate(540deg)`;
      keep.style.transition = 'transform .34s cubic-bezier(.23,1,.32,1)'; keep.src = GK + DIVE[k] + '.png';
      keep.style.transform = `translate(${(Z[k][0] - 50) * 1.7}%,${k === 1 ? -14 : Z[k][1] < 50 ? -22 : 0}%)`;
      meter.hidden = true; tell.textContent = '';
      setTimeout(() => {
        if (result === 'goal') {
          goals++; b.querySelector('.pk-g').textContent = '⚽ ' + goals; pk.classList.add('scored'); setTimeout(() => keep.src = GK + 'beaten.png', 200);
          msg.textContent = perfect ? T('Perfect strike! Top bins!', '¡Disparo perfecto! ¡A la escuadra!', 'Chute perfeito! No ângulo!') : goals >= 5 ? T('Unstoppable!', '¡Imparable!', 'Imparável!') : T('GOAL!', '¡GOL!', 'GOL!');
          setTimeout(setup, 900);
        } else {
          if (result === 'save') setTimeout(() => keep.src = GK + 'save.png', 200);
          const v = Math.min(30, goals * 3); addFlakes(n, v, o);
          msg.textContent = (result === 'over' ? T('Over the bar!', '¡Por encima del larguero!', 'Por cima do travessão!') : result === 'wide' ? T('Wide!', '¡Fuera!', 'Para fora!') : p < SWEET[0] ? T('Too soft, saved!', '¡Muy flojo, parada!', 'Fraco demais, defendeu!') : T('Saved!', '¡Parada!', 'Defendeu!'))
            + ' ' + T(`${goals} goals`, `${goals} goles`, `${goals} gols`) + (o.missed ? '' : ` · +${v} ❄`);
          b.querySelector('.pk-again').hidden = false; track('advent_penalty', { n, goals });
        }
      }, 480);
    };
    b.querySelectorAll('.pk-z').forEach(z => z.onclick = () => {
      if (phase !== 'aim') return;
      aim = +z.dataset.z; phase = 'power'; z.classList.add('on'); b.querySelectorAll('.pk-z').forEach(x => x.disabled = true);
      msg.textContent = T('Tap to shoot!', '¡Toca para chutar!', 'Toque para chutar!');
      meter.hidden = false; pw = 0; dir = 1; lastT = performance.now(); raf = requestAnimationFrame(runMeter);
    });
    // stop the bar: tap anywhere in the game, or press space
    pk.addEventListener('pointerdown', e => { if (phase === 'power' && !e.target.closest('.pk-z')) shoot() });
    meter.addEventListener('pointerdown', () => shoot());
    const key = e => { if (e.code === 'Space' && phase === 'power') { e.preventDefault(); shoot() } };
    addEventListener('keydown', key);
    stopGame = () => { cancelAnimationFrame(raf); phase = 'done'; removeEventListener('keydown', key) };
    b.querySelector('.pk-again').onclick = e => { e.currentTarget.hidden = true; goals = 0; cols = [0, 0, 0]; b.querySelector('.pk-g').textContent = '⚽ 0'; msg.textContent = ''; setup() };
    setup();
  }

  // ── mini game: catch the presents. 20 seconds; move the reindeer with your finger, mouse or arrow keys. ──
  function catchGame(b, n, mult, o) {
    const best = flakes()[n];
    b.innerHTML = `<h3>${T('Catch the presents', 'Atrapa los regalos', 'Pegue os presentes')}${mult > 1 ? ' ×2' : ''}</h3>${mult > 1 ? `<p class="adv-note"><b>${T('Christmas Eve rules: every present adds time, coal takes 2 seconds away.', 'Reglas de Nochebuena: cada regalo suma tiempo y el carbón quita 2 segundos.', 'Regras da véspera de Natal: cada presente dá mais tempo, o carvão tira 2 segundos.')}</b></p>` : ''}
      <p class="adv-note">${T('Move the reindeer to catch the presents. Coal costs you 3, golden presents are worth 5. It gets faster! 20 seconds.', 'Mueve al reno para atrapar los regalos. El carbón resta 3. ¡Cada vez más rápido! 20 segundos.', 'Mova a rena para pegar os presentes. Carvão tira 3. Fica cada vez mais rápido! 20 segundos.')}${best != null ? ' ' + T(`Your best: ${best} ❄`, `Tu mejor: ${best} ❄`, `Seu melhor: ${best} ❄`) : ''}</p>
      <div class="cg"><div class="cg-hud"><span class="cg-s">0</span><span class="cg-t">20</span></div><i class="cg-r"></i>
        <button type="button" class="adv-btn cg-go">${T('Start', 'Empezar', 'Começar')}</button></div>
      <p class="adv-big" aria-live="polite"></p>${missedNote(o)}`;
    const box = b.querySelector('.cg'), deer = b.querySelector('.cg-r');
    try { deer.style.backgroundImage = kitImg(kitById('xm-reindeer')) } catch { }
    let bonus = 0, x = .5, items = [], score = 0, t0 = 0, raf = 0, last = 0, spawnAt = 0, running = false, keys = {};
    const IT = '/xmas/items/';
    ['coal', 'coal-hot', 'gift-gold', 'plus1', 'minus3'].forEach(f => { const im = new Image(); im.src = IT + f + '.png' });
    // a +1 / -3 / +5 that floats up from where you caught it
    const pop = (pts, px, py) => { const e = document.createElement('i'); e.className = 'cg-pop'; if (pts === 1 || pts === -3) e.style.backgroundImage = `url(${IT}${pts > 0 ? 'plus1' : 'minus3'}.png)`; else { e.textContent = '+' + pts; e.classList.add('txt') }
      e.style.left = px + 'px'; e.style.top = py + 'px'; box.appendChild(e); setTimeout(() => e.remove(), 650) };
    const W = () => box.clientWidth, H = () => box.clientHeight, DW = 58;
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
      const el = (t - t0) / 1000, left = Math.max(0, 20 + bonus - el);
      b.querySelector('.cg-t').textContent = Math.ceil(left); b.querySelector('.cg-t').classList.toggle('low', left < 5);
      if (keys.ArrowLeft) { x = Math.max(0, x - .025 * dt); place() } if (keys.ArrowRight) { x = Math.min(1, x + .025 * dt); place() }
      if (t >= spawnAt) {
        const r = Math.random(), coal = r < Math.min(.45, .25 + el * .012), hot = coal && Math.random() < .3, gold = !coal && Math.random() < .07, it = document.createElement('i');
        it.className = 'cg-i' + (coal ? ' coal' : '') + (gold ? ' gold' : '');
        it.style.backgroundImage = `url(${coal ? (hot ? IT + 'coal-hot.png' : IT + 'coal.png') : gold ? IT + 'gift-gold.png' : `/xmas/deco/gift-${Math.random() < .5 ? 'red' : 'green'}.png`})`;
        box.appendChild(it); items.push({ el: it, x: Math.random() * (W() - 34), y: -34, v: (3.2 + el * .11 + Math.random() * 1.4) * (hot ? 1.45 : gold ? 1.25 : 1), coal, gold });
        spawnAt = t + Math.max(230, 500 - el * 9);
      }
      const dx = x * (W() - DW), floor = H() - 56;
      items = items.filter(it => {
        it.y += it.v * dt; it.el.style.transform = `translate(${it.x}px,${it.y}px)`;
        if (it.y > floor - 30 && it.y < floor + 10 && it.x + 30 > dx && it.x < dx + DW) {
          const pts = it.coal ? -3 : it.gold ? 5 : 1; score += pts; if (mult > 1) { bonus += it.coal ? -2 : it.gold ? 2 : .5 } b.querySelector('.cg-s').textContent = score; pop(pts, it.x, floor - 40);
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
      e.currentTarget.hidden = true; score = 0; bonus = 0; b.querySelector('.cg-s').textContent = 0; b.querySelector('.adv-big').textContent = '';
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
#adv-dlg .adv-fl{all:unset;cursor:pointer;margin-left:auto;color:#2f7fc4;font:400 17px/1 VT323,monospace;letter-spacing:.04em;padding:4px 6px;border:2px solid transparent}
@media (hover:hover){#adv-dlg .adv-fl:hover{border-color:#2f7fc4}}
.lb{list-style:none;margin:0 0 10px;padding:0;display:grid;gap:4px}.lb li{display:grid;grid-template-columns:28px 40px 1fr auto;align-items:center;gap:8px;padding:4px 8px;background:#fff;border:2px solid #000;font:400 17px/1 VT323,monospace}
.lb li b{font:400 20px/1 'Jersey 10',monospace;color:#c8473b}.lb li i{width:40px;height:32px;background:center/contain no-repeat;image-rendering:pixelated}.lb li em{font-style:normal;color:#2f7fc4}.lb li:nth-child(-n+3){background:#fff3c4}.lb-empty{display:block!important;text-align:center}
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
.adv-emoji{font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif;font-size:72px;line-height:1.2;text-align:center;margin:4px 0 12px}
.hl{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.hl div{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;background:#1d4486;color:#fff;border:3px solid #000;text-align:center}
.hl b{font:400 18px/1.1 'Jersey 10',monospace}.hl-n{font:400 44px/1 'Jersey 10',monospace;color:#f2c230}.hl-n.ok{color:#7fe0a8}.hl-n.no{color:#ff8a80}
.yr{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-bottom:12px}
.yr div{display:flex;flex-direction:column;gap:4px;padding:10px;background:#fff;border:3px solid #000;animation:advRise .35s cubic-bezier(.23,1,.32,1) backwards;animation-delay:var(--d,0ms)}
.yr b{font:400 30px/1 'Jersey 10',monospace;color:#c8473b}.yr span{font:400 15px/1.1 VT323,monospace;color:#5b5070}
@keyframes advRise{from{opacity:0;transform:translateY(8px)}}
.goal{position:relative;height:34px;border:3px solid #000;background:#fff;margin-bottom:10px;overflow:hidden}
.goal i{position:absolute;inset:0;background:#2ebd6b;transform-origin:left;transition:transform .8s cubic-bezier(.23,1,.32,1)}
.goal span{position:relative;display:grid;place-items:center;height:100%;font:400 18px/1 'Jersey 10',monospace}
.pk{position:relative;aspect-ratio:800/540;background:#1d2a5a url(/xmas/shootout/bg.webp) center/100% 100%;image-rendering:pixelated;border:3px solid #000;overflow:hidden;margin-bottom:10px}
.pk-goal{position:absolute;left:6%;width:88%;top:13%;aspect-ratio:2/1;background:url(/xmas/shootout/goal.png) center/100% 100%}
#adv-dlg .pk-z{all:unset;box-sizing:border-box;position:absolute;width:26%;height:31%;transform:translate(-50%,-50%);border:2px dashed rgba(242,194,48,.75);cursor:crosshair;z-index:2}
@media (hover:hover) and (pointer:fine){#adv-dlg .pk-z:not([disabled]):hover{background:rgba(242,194,48,.35)}}
#adv-dlg .pk-z[disabled]{cursor:default;border-color:transparent;pointer-events:none}
.pm{position:relative;height:30px;border:3px solid #000;margin:-2px 0 10px;overflow:hidden;cursor:pointer;touch-action:manipulation;
 background:linear-gradient(90deg,#f6d2cd 0 50%,#c9f2d8 50% 66%,#f2c230 66% 74%,#c9f2d8 74% 82%,#f6d2cd 82%)}
.pm-n{position:absolute;left:-2px;top:0;bottom:0;width:100%;pointer-events:none}.pm-n:before{content:"";position:absolute;left:0;top:-2px;bottom:-2px;width:5px;background:#1d1a2b}
.pk-tell{font:400 17px/1 VT323,monospace!important;text-shadow:none!important;color:#1d1a2b;background:rgba(255,255,255,.75);padding:3px 6px}
#adv-dlg .pk-z.on{border:3px solid #f2c230!important;background:rgba(242,194,48,.25)!important}
.pk-keep{position:absolute;left:50%;bottom:4%;width:30%;aspect-ratio:1;margin-left:-15%;image-rendering:auto;object-fit:contain;transition:transform .36s cubic-bezier(.23,1,.32,1);pointer-events:none;z-index:1}
.pk-ball{position:absolute;left:50%;bottom:6%;width:28px;height:28px;margin-left:-14px;image-rendering:pixelated;pointer-events:none;transition:transform .46s cubic-bezier(.2,.7,.3,1)}
.pk.scored .pk-goal{animation:advNet .3s ease-out}@keyframes advNet{40%{transform:scale(1.02,1.03)}}
.cg{position:relative;height:300px;border:3px solid #000;background:linear-gradient(#16336a,#2a4f92 70%,#e8f2f8 70%);overflow:hidden;margin-bottom:10px;touch-action:none;user-select:none}
.cg-hud{position:absolute;left:8px;right:8px;top:6px;display:flex;justify-content:space-between;font:400 26px/1 'Jersey 10',monospace;color:#fff;text-shadow:2px 2px 0 #000;z-index:3}
.cg-s:before{content:"🎁 "}.cg-t:after{content:"s"}.cg-t.low{color:#ff8a80}
.cg-r{position:absolute;left:0;bottom:8px;width:58px;height:58px;background:center/contain no-repeat;image-rendering:pixelated;z-index:2}
.cg-r.hit{animation:advBump .2s ease-out}@keyframes advBump{50%{translate:0 -4px}}
.cg-i{position:absolute;left:0;top:0;width:34px;height:34px;background:center/contain no-repeat;image-rendering:pixelated;will-change:transform}
.cg-i.coal{width:32px;height:30px}.cg-i.gold{width:38px;height:40px;filter:drop-shadow(0 0 6px rgba(255,220,90,.9))}
.cg-pop{position:absolute;width:44px;height:30px;background:center/contain no-repeat;pointer-events:none;z-index:5;animation:cgPop .65s cubic-bezier(.23,1,.32,1) forwards}
.cg-pop.txt{font:400 28px/1 'Jersey 10',monospace;font-style:normal;color:#f2c230;text-shadow:2px 2px 0 #000;width:auto}
@keyframes cgPop{from{opacity:1;transform:translateY(0) scale(.85)}to{opacity:0;transform:translateY(-44px) scale(1.1)}}
#adv-dlg .cg-go{position:absolute;left:50%;top:50%;width:auto;padding:12px 28px;transform:translate(-50%,-50%);z-index:4}
#adv-dlg .cg-go:active{transform:translate(-50%,-50%) scale(.97)}
@media (prefers-reduced-motion:reduce){.adv-dlg[open],.adv-pop i,.yr div{animation:none}.pk-keep,.pk-ball{transition-duration:0s}}`;
  if (!document.getElementById('adv-css')) { const s = document.createElement('style'); s.id = 'adv-css'; s.textContent = css; document.head.appendChild(s) }

  window.ucAdvent = { open, total, flakes };
  setTimeout(syncFlakes, 1500);
  if (!PREVIEW) window.ucAdventRedraw?.();
})();
