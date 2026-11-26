/* Advent calendar 2026: what's behind each door. Loaded by the home page during the Christmas season.
   A door opens once you've played that day's Daily 5. Missed doors can still be opened later, but their
   kit piece and their vote are gone. Votes close at midnight (Amsterdam); results show the next day.
   Mini games and bonus questions give snowflakes (stored on this device). */
(() => {
  const T = (en, es, pt) => { try { return L(en, es, pt) } catch { return en } };
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { } };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const today = () => { try { return xmToday() } catch { return new Date().toISOString().slice(0, 10) } };
  const dateOf = n => '2026-12-' + String(n).padStart(2, '0');
  const played = d => ls('unicorner-played-' + d) != null;
  const visitor = () => ls('uc-visitor') || '';
  const rpc = (fn, args) => window.ucPubRpc ? window.ucPubRpc(fn, args) : Promise.reject(new Error('offline'));
  const track = (n, d) => { try { window.track?.(n, d) } catch { } };
  const kitImg = k => { try { return sprite('happy', 0, false, k).replace(/"/g, "'") } catch { return 'none' } };

  // ── snowflakes: one score per door, best result kept ──
  const flakes = () => { try { return JSON.parse(ls('uc-adv-flakes') || '{}') } catch { return {} } };
  const addFlakes = (n, v) => { const f = flakes(); if ((f[n] || 0) < v) { f[n] = v; ls('uc-adv-flakes', JSON.stringify(f)) } return total() };
  const total = () => Object.values(flakes()).reduce((a, b) => a + b, 0);
  const pieces = () => ['2026-12-03', '2026-12-09', '2026-12-15', '2026-12-21'].filter(played).length;

  // ── the 24 doors ──
  const P = (n, piece, name) => ({ t: 'piece', n: piece, name });
  const DAYS = {
    1: { t: 'welcome' },
    2: { t: 'penalty' },
    3: P(3, 1, T('the crown', 'la corona', 'a coroa')),
    4: { t: 'vote', key: 'kit', q: T('Which Christmas kit should we make?', '¿Qué equipación navideña hacemos?', 'Que uniforme de Natal fazemos?'),
         opts: [T('Elf', 'Elfo', 'Elfo'), T('Gingerbread', 'Galleta de jengibre', 'Biscoito de gengibre'), T('Grinch', 'Grinch', 'Grinch'), T('Nutcracker', 'Cascanueces', 'Quebra-nozes')],
         after: T('The winner is revealed on door 22.', 'El ganador se revela en la puerta 22.', 'O vencedor é revelado na porta 22.') },
    5: { t: 'soon', kind: 'q' }, 6: { t: 'soon', kind: 'game' },
    7: { t: 'vote', key: 'retro', q: T('Which retired kit should come back?', '¿Qué equipación retirada vuelve?', 'Qual uniforme aposentado deve voltar?'),
         opts: ['?', '?', '?'], soon: true, after: T('The winner returns on door 14.', 'La ganadora vuelve en la puerta 14.', 'O vencedor volta na porta 14.') },
    8: { t: 'soon', kind: 'gift' }, 9: P(9, 2, T('the scarf', 'la bufanda', 'o cachecol')),
    10: { t: 'soon', kind: 'q' }, 11: { t: 'soon', kind: 'game' },
    12: { t: 'vote', key: 'theme', q: T('Pick the theme of the Christmas Day Daily 5', 'Elige el tema del Diario 5 del día de Navidad', 'Escolha o tema do Diário 5 do dia de Natal'),
          opts: ['Premier League', T('World Cups', 'Mundiales', 'Copas do Mundo'), 'La Liga', 'Champions League'],
          after: T('The winning theme is the Daily 5 on 25 December.', 'El tema ganador será el Diario 5 del 25 de diciembre.', 'O tema vencedor será o Diário 5 de 25 de dezembro.') },
    13: { t: 'soon', kind: 'goal' }, 14: { t: 'soon', kind: 'gift' }, 15: P(15, 3, T('the jumper', 'el jersey', 'o suéter')),
    16: { t: 'soon', kind: 'game' }, 17: { t: 'soon', kind: 'q' }, 18: { t: 'soon', kind: 'vote' },
    19: { t: 'penalty', hard: true }, 20: { t: 'soon', kind: 'game' }, 21: P(21, 4, T('the boots', 'las botas', 'as botas')),
    22: { t: 'soon', kind: 'gift' }, 23: { t: 'soon', kind: 'game' }, 24: { t: 'soon', kind: 'finale' },
  };

  // ── the pop-up ──
  let dlg;
  function shell(n) {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.id = 'adv-dlg'; dlg.className = 'adv-dlg';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-adv-x]')) dlg.close() });
    }
    dlg.innerHTML = `<div class="adv-in"><button type="button" class="adv-x" data-adv-x aria-label="${T('Close', 'Cerrar', 'Fechar')}">✕</button>
      <div class="adv-top"><span class="adv-no">${n}</span><span>${T('DECEMBER', 'DICIEMBRE', 'DEZEMBRO')}</span><span class="adv-fl" title="${T('Snowflakes', 'Copos', 'Flocos')}">❄ ${total()}</span></div>
      <div class="adv-body"></div></div>`;
    if (!dlg.open) dlg.showModal();
    return dlg.querySelector('.adv-body');
  }
  const refreshFlakes = () => { const f = dlg?.querySelector('.adv-fl'); if (f) f.textContent = '❄ ' + total(); window.ucAdventRedraw?.() };

  function open(n) {
    const d = dateOf(n), t = today(), cfg = DAYS[n] || { t: 'soon' };
    const body = shell(n);
    if (d > t) { body.innerHTML = `<h3>${T('Not yet!', '¡Todavía no!', 'Ainda não!')}</h3><p>${T(`This door opens on ${n} December.`, `Esta puerta se abre el ${n} de diciembre.`, `Esta porta abre em ${n} de dezembro.`)}</p>`; return }
    if (d === t && !played(d)) {
      body.innerHTML = `<h3>${T("Play today's Daily 5 to open this door", 'Juega el Diario 5 de hoy para abrir esta puerta', 'Jogue o Diário 5 de hoje para abrir esta porta')}</h3>
        <p>${T('Five questions, about three minutes. Then come back and open it.', 'Cinco preguntas, unos tres minutos. Luego vuelve y ábrela.', 'Cinco perguntas, uns três minutos. Depois volte e abra.')}</p>
        <button type="button" class="adv-btn" data-adv-play>${T("Play today's game", 'Jugar el partido de hoy', 'Jogar o jogo de hoje')}</button>`;
      body.querySelector('[data-adv-play]').onclick = () => { dlg.close(); document.getElementById('go')?.click() };
      return;
    }
    const missed = !played(d);
    if (d === t) rpc('advent_open', { p_day: n, p_visitor: visitor() }).catch(() => { });
    track('advent_door', { n, missed });
    (R[cfg.t] || R.soon)(body, n, cfg, { missed, isToday: d === t });
  }

  // ── what each kind of door shows ──
  const R = {
    welcome(b) {
      b.innerHTML = `<div class="adv-hor"><img src="/rosco/host/xmas/happy-talk.png" alt=""><p>${T("Ho ho ho! Welcome to the Unicorner advent calendar. Play every day to open a door: mini games, votes, bonus questions and a secret kit, piece by piece. Collect all 4 pieces (doors 3, 9, 15 and 21) and it's yours.", '¡Jo, jo, jo! Bienvenido al calendario de Adviento de Unicorner. Juega cada día para abrir una puerta: minijuegos, votaciones, preguntas extra y una equipación secreta, pieza a pieza. Consigue las 4 piezas (puertas 3, 9, 15 y 21) y es tuya.', 'Ho ho ho! Bem-vindo ao calendário do Advento do Unicorner. Jogue todo dia para abrir uma porta: minijogos, votações, perguntas extras e um uniforme secreto, peça por peça. Junte as 4 peças (portas 3, 9, 15 e 21) e ele é seu.')}</p></div>
        ${pieceRow()}`;
    },
    piece(b, n, cfg, o) {
      const got = !o.missed, have = pieces();
      b.innerHTML = `<h3>${got ? T(`Secret kit: piece ${cfg.n} of 4`, `Equipación secreta: pieza ${cfg.n} de 4`, `Uniforme secreto: peça ${cfg.n} de 4`) : T('You missed this piece', 'Te perdiste esta pieza', 'Você perdeu esta peça')}</h3>
        <div class="adv-kit"><i style="background-image:${kitImg(frostKit(have))}"></i></div>
        <p>${got ? T(`You got ${cfg.name}! ${have === 4 ? 'All 4 pieces: the Frost kit is yours. Find it in your kits.' : `${have} of 4 collected.`}`, `¡Conseguiste ${cfg.name}! ${have === 4 ? 'Las 4 piezas: la equipación Escarcha es tuya. Búscala en tus equipaciones.' : `${have} de 4 conseguidas.`}`, `Você ganhou ${cfg.name}! ${have === 4 ? 'As 4 peças: o uniforme Geada é seu. Veja nos seus uniformes.' : `${have} de 4 conseguidas.`}`)
          : T('Pieces only count on their own day. There are more to come!', 'Las piezas solo cuentan en su día. ¡Quedan más!', 'As peças só contam no seu dia. Ainda tem mais!')}</p>${pieceRow()}`;
      if (got && have === 4) window.ucAdventRedraw?.();
    },
    vote(b, n, cfg, o) {
      const key = 'uc-adv-vote-' + n, mine = ls(key);
      const draw = res => {
        const closed = res && res.closed, counts = (res && res.counts) || {}, tot = Object.values(counts).reduce((a, c) => a + +c, 0);
        const my = res && res.mine != null ? res.mine : mine != null ? +mine : null;
        const canVote = o.isToday && !o.missed && my == null && !cfg.soon;
        b.innerHTML = `<h3>${esc(cfg.q)}</h3><div class="adv-opts">${cfg.opts.map((x, i) => {
          const pct = closed && tot ? Math.round((counts[i] || 0) / tot * 100) : null;
          return `<button type="button" class="adv-opt${my === i ? ' me' : ''}" data-v="${i}" ${canVote ? '' : 'disabled'}><span>${esc(x)}</span>${pct != null ? `<b>${pct}%</b><i style="width:${pct}%"></i>` : ''}</button>`
        }).join('')}</div>
          <p class="adv-note">${cfg.soon ? T('The options are revealed on the day.', 'Las opciones se revelan ese día.', 'As opções são reveladas no dia.')
            : closed ? T(`Voting closed. ${tot} votes.`, `Votación cerrada. ${tot} votos.`, `Votação encerrada. ${tot} votos.`)
            : my != null ? T('Thanks for voting! Results tomorrow.', '¡Gracias por votar! Resultados mañana.', 'Obrigado por votar! Resultado amanhã.')
            : o.isToday && !o.missed ? T('One vote each. Voting closes at midnight.', 'Un voto por persona. Se cierra a medianoche.', 'Um voto por pessoa. Fecha à meia-noite.')
            : T('You missed this vote.', 'Te perdiste esta votación.', 'Você perdeu esta votação.')} ${esc(cfg.after || '')}</p>`;
        b.querySelectorAll('[data-v]:not([disabled])').forEach(btn => btn.onclick = async () => {
          const v = +btn.dataset.v; b.querySelectorAll('[data-v]').forEach(x => x.disabled = true);
          try { const r = await rpc('advent_vote', { p_day: n, p_option: v, p_visitor: visitor() }); ls(key, String(r && r.voted != null ? r.voted : v)) } catch { ls(key, String(v)) }
          track('advent_vote', { n, v }); draw({ closed: false, mine: +ls(key) });
        });
      };
      draw(null);
      rpc('advent_results', { p_day: n, p_visitor: visitor() }).then(r => { if (dlg.open && r) draw(r) }).catch(() => { });
    },
    penalty(b, n, cfg, o) { penalty(b, n, !!cfg.hard, o) },
    soon(b, n, cfg) {
      b.innerHTML = `<h3>${T('A surprise is being wrapped…', 'Estamos envolviendo una sorpresa…', 'Estamos embrulhando uma surpresa…')}</h3><div class="adv-hor"><img src="/rosco/host/xmas/wink.png" alt=""><p>${T("Horacio is still tying the bow on this one. Come back on the day!", 'Horacio todavía le está poniendo el lazo. ¡Vuelve ese día!', 'O Horacio ainda está amarrando o laço. Volte no dia!')}</p></div>`;
    },
  };

  function pieceRow() {
    const names = [T('Crown', 'Corona', 'Coroa'), T('Scarf', 'Bufanda', 'Cachecol'), T('Jumper', 'Jersey', 'Suéter'), T('Boots', 'Botas', 'Botas')];
    const got = ['2026-12-03', '2026-12-09', '2026-12-15', '2026-12-21'].map(played);
    return `<div class="adv-pcs">${names.map((x, i) => `<span class="${got[i] ? 'on' : ''}"><b>${got[i] ? '✓' : [3, 9, 15, 21][i]}</b>${x}</span>`).join('')}</div>`;
  }

  // ── mini game: penalty in the snow. One shot a day; pick a corner, Horacio dives. ──
  function penalty(b, n, hard, o) {
    const done = flakes()[n];
    const ZONES = [[18, 30], [50, 30], [82, 30], [18, 68], [50, 68], [82, 68]];
    b.innerHTML = `<h3>${hard ? T('Penalty in the snow: hard mode', 'Penalti en la nieve: modo difícil', 'Pênalti na neve: modo difícil') : T('Penalty in the snow', 'Penalti en la nieve', 'Pênalti na neve')}</h3>
      <p class="adv-note">${done != null ? T('You already took today\'s penalty.', 'Ya tiraste el penalti de hoy.', 'Você já cobrou o pênalti de hoje.') : T('One shot. Tap where you want to shoot.', 'Un disparo. Toca donde quieras chutar.', 'Um chute. Toque onde quer chutar.')}</p>
      <div class="pk"><div class="pk-goal">${ZONES.map((z, i) => `<button type="button" class="pk-z" data-z="${i}" style="left:${z[0]}%;top:${z[1]}%" aria-label="${T('Shoot here', 'Chuta aquí', 'Chute aqui')}" ${done != null ? 'disabled' : ''}></button>`).join('')}
        <img class="pk-keep" src="/rosco/host/xmas/excited.png" alt="Horacio"></div><i class="pk-ball"></i></div>
      <p class="pk-res" aria-live="polite"></p>`;
    if (done != null) { b.querySelector('.pk-res').textContent = done >= 10 ? T('GOAL! +10 ❄', '¡GOL! +10 ❄', 'GOL! +10 ❄') : T('Saved! +3 ❄', '¡Parada! +3 ❄', 'Defendeu! +3 ❄'); return }
    b.querySelectorAll('.pk-z').forEach(z => z.onclick = () => {
      const i = +z.dataset.z; b.querySelectorAll('.pk-z').forEach(x => x.disabled = true);
      // Horacio guesses a corner; in hard mode he reads you half the time
      const k = hard && Math.random() < .5 ? i : Math.floor(Math.random() * 6), goal = k !== i;
      const goalEl = b.querySelector('.pk-goal'), ball = b.querySelector('.pk-ball'), keep = b.querySelector('.pk-keep');
      const gr = goalEl.getBoundingClientRect(), pr = b.querySelector('.pk').getBoundingClientRect();
      const tx = gr.left - pr.left + gr.width * ZONES[i][0] / 100, ty = gr.top - pr.top + gr.height * ZONES[i][1] / 100;
      ball.style.transform = `translate(${tx - pr.width / 2}px,${ty - (pr.height - 26)}px) scale(.55)`;
      keep.style.transform = `translate(${(ZONES[k][0] - 50) * .9}%,${(ZONES[k][1] - 50) * .5}%) rotate(${(ZONES[k][0] - 50) / 2}deg)`;
      setTimeout(() => {
        const v = o.missed ? 0 : goal ? 10 : 3; if (!o.missed) addFlakes(n, v); refreshFlakes();
        keep.src = goal ? '/rosco/host/xmas/facepalm.png' : '/rosco/host/xmas/celebrate.png';
        b.querySelector('.pk-res').textContent = goal ? T(`GOAL! ${o.missed ? '' : '+10 ❄'}`, `¡GOL! ${o.missed ? '' : '+10 ❄'}`, `GOL! ${o.missed ? '' : '+10 ❄'}`) : T(`Saved by Horacio! ${o.missed ? '' : '+3 ❄'}`, `¡Parada de Horacio! ${o.missed ? '' : '+3 ❄'}`, `Horacio defendeu! ${o.missed ? '' : '+3 ❄'}`);
        track('advent_penalty', { n, goal });
      }, 520);
    });
  }

  window.ucAdvent = { open, total, flakes };
  window.ucAdventRedraw?.();
})();
