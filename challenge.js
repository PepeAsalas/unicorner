/* Friend challenge for the side games (Rosco, Millions): "beat my score on today's game" links (?c=…).
   Same idea as the Daily 5 challenge in index.html. Funnel, tied by the link id (cid) and the game:
   challenge_sent → challenge_open → challenge_finish (plus challenge_cancel when the share sheet is closed).
   A link carries {g: game, n: name, s: score, d: day, i: cid}; it only counts on the day it was made.

   const ch = ucChallenge({game, day, max, es, track, fmt, banner, share, url})
     fmt(score)            -> how a score reads ("18/24", "650,000")
     banner(who, score)    -> {en, es} lines for the invited friend before they play
     share(score, url)     -> the text that goes with the link
   ch.c                    -> the challenge for this visitor (null if none / own link)
   ch.intro(el)            -> fills el with the friend's banner (nothing if no challenge)
   ch.end(el, score, fresh)-> fills el with the comparison + the "challenge a friend" button */
(function(){
const SEND='<svg class="px-send" width="24" height="24" viewBox="0 0 8 8" aria-hidden="true" shape-rendering="crispEdges"><rect x="4" y="0" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="4" y="1" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="5" y="1" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="0" y="2" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="1" y="2" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="2" y="2" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="3" y="2" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="4" y="2" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="5" y="2" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="6" y="2" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="0" y="3" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="1" y="3" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="2" y="3" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="3" y="3" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="4" y="3" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="5" y="3" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="6" y="3" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="7" y="3" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="0" y="4" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="1" y="4" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="2" y="4" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="3" y="4" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="4" y="4" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="5" y="4" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="6" y="4" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="7" y="4" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="0" y="5" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="1" y="5" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="2" y="5" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="3" y="5" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="4" y="5" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="5" y="5" width="1.02" height="1.02" fill="#fbf6e8"/><rect x="6" y="5" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="4" y="6" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="5" y="6" width="1.02" height="1.02" fill="#1d1a2b"/><rect x="4" y="7" width="1.02" height="1.02" fill="#1d1a2b"/></svg>';
const esc=t=>String(t??'').replace(/[&<>"'`]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
const ls={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
const sentList=()=>{try{return JSON.parse(ls.get('uc-chal-sent')||'[]')}catch{return[]}};
const coarse=()=>{try{return matchMedia('(pointer:coarse)').matches}catch{return false}};
const mobileShare=()=>!!navigator.share&&coarse();
const b64=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=t=>JSON.parse(decodeURIComponent(escape(atob(t.replace(/-/g,'+').replace(/_/g,'/')))));
let styled=false;
function style(){if(styled)return;styled=true;const s=document.createElement('style');s.textContent=`
.uc-ch{display:grid;gap:8px;text-align:center}
.uc-ch-go{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:56px;border:3px solid var(--ink,#1d1a2b);box-shadow:0 4px 0 var(--ink,#1d1a2b);background:var(--gold,#f2c230);color:var(--ink,#1d1a2b);font:400 22px/1.1 var(--disp,"Jersey 10",monospace);padding:10px 12px;cursor:pointer;transition:transform 120ms cubic-bezier(.23,1,.32,1),box-shadow 120ms cubic-bezier(.23,1,.32,1)}
.uc-ch-go:active{transform:translateY(3px);box-shadow:0 1px 0 var(--ink,#1d1a2b)}
.uc-ch small{font:17px/1.2 var(--mono,"VT323",monospace);color:var(--sand,#e9dfc2)}
.uc-ch-name{display:grid;gap:6px;text-align:left}.uc-ch-name[hidden],.uc-ch-url[hidden]{display:none}
.uc-ch-name label{font:18px var(--mono,"VT323",monospace);color:var(--sand,#e9dfc2)}.uc-ch-name div{display:flex;gap:8px}
.uc-ch-name input,.uc-ch-url{flex:1;min-width:0;width:100%;font:20px var(--mono,"VT323",monospace);padding:8px 10px;border:3px solid var(--ink,#1d1a2b);border-radius:0;background:#fff;color:var(--ink,#1d1a2b)}
.uc-ch-name button{border:3px solid var(--ink,#1d1a2b);background:var(--gold,#f2c230);color:var(--ink,#1d1a2b);font:400 20px var(--disp,"Jersey 10",monospace);padding:0 14px;cursor:pointer}
.uc-ch-vs{padding:10px 12px;border:3px solid var(--ink,#1d1a2b);background:var(--paper,#fbf6e8);color:var(--ink,#1d1a2b);font:600 16px/1.3 Barlow,system-ui,sans-serif}.uc-ch-vs.won{background:#7fe0a8}.uc-ch-vs.lost{background:#f0c4bd}.uc-ch-vs b{font-size:1.2em}
.uc-ch-banner{display:flex;gap:10px;align-items:center;padding:10px 12px;background:var(--gold,#f2c230);color:var(--ink,#1d1a2b);border:3px solid var(--ink,#1d1a2b);box-shadow:0 4px 0 var(--ink,#1d1a2b);font:600 15px/1.3 Barlow,system-ui,sans-serif;text-align:left}
.uc-ch .px-send,.uc-ch-banner .px-send{flex:none}.uc-ch-banner.cool{background:var(--paper,#fbf6e8)}.uc-ch-banner>b{font-size:24px;line-height:1}`;document.head.appendChild(s)}

window.ucChallenge=function(o){
 const L=(en,es)=>o.es?es:en,device=()=>coarse()?'mobile':'desktop';
 let c=null,fresh=false;
 try{const q=new URLSearchParams(location.search),raw=q.get('c');
  if(raw){try{const j=unb64(raw);
    if(j&&j.g===o.game&&/^\d{4}-\d\d-\d\d$/.test(j.d)&&Number.isInteger(j.s)&&j.s>=0&&j.s<=o.max&&/^[a-z0-9]{6,12}$/.test(j.i)){
     c={n:String(j.n||'').replace(/[<>&"'`]/g,'').trim().slice(0,16),s:j.s,d:j.d,i:j.i};fresh=true;ls.set('uc-chal-'+o.game,JSON.stringify(c))}}catch{}
   q.delete('c');history.replaceState(history.state,'',location.pathname+(q.toString()?'?'+q:'')+location.hash)}
  if(!c)c=JSON.parse(ls.get('uc-chal-'+o.game)||'null')}catch{}
 if(c&&sentList().includes(c.i))c=null; // my own link
 if(c){c.old=c.d!==o.day;if(c.old&&!fresh)c=null}
 if(c&&fresh){try{sessionStorage.setItem('uc-src-s','challenge')}catch{}
  o.track('challenge_open',{game:o.game,cid:c.i,from_score:c.s,same_day:!c.old,played_already:!c.old&&o.played?.()!=null,device:device(),src:'challenge'})}
 const who=()=>c&&c.n?esc(c.n):L('Your friend','Tu amigo');
 const api={c};

 api.intro=el=>{if(!el)return;if(!c){el.innerHTML='';return}style();
  if(c.old){el.innerHTML=`<div class="uc-ch-banner cool">${SEND}<span>${L(`${who()} challenged you on an earlier game. Today's is new: play it and challenge them back!`,`${who()} te retó en un juego anterior. El de hoy es nuevo: juégalo y devuélvele el reto.`)}</span></div>`;return}
  const t=o.banner(who(),c.s);el.innerHTML=`<div class="uc-ch-banner">${SEND}<span>${L(t.en,t.es)}</span></div>`};

 api.end=(el,score,isFresh)=>{if(!el)return;style();
  const vs=c&&!c.old?`<div class="uc-ch-vs ${score>c.s?'won':score===c.s?'':'lost'}">${score>c.s?L(`🏆 You beat ${who()}! <b>${o.fmt(score)}</b> vs ${o.fmt(c.s)}`,`🏆 ¡Has ganado a ${who()}! <b>${o.fmt(score)}</b> a ${o.fmt(c.s)}`):score===c.s?L(`🤝 A draw with ${who()}: <b>${o.fmt(score)}</b> each`,`🤝 Empate con ${who()}: <b>${o.fmt(score)}</b> cada uno`):L(`${who()} wins this one: <b>${o.fmt(c.s)}</b> vs your ${o.fmt(score)}`,`${who()} gana esta: <b>${o.fmt(c.s)}</b> a tu ${o.fmt(score)}`)}</div>`:'';
  const mob=mobileShare();
  el.innerHTML=`${vs}<div class="uc-ch"><button type="button" class="uc-ch-go">${SEND}<span>${mob?L(`Challenge a friend to beat ${o.fmt(score)}`,`Reta a un amigo a superar tu ${o.fmt(score)}`):L(`Copy a challenge link · beat my ${o.fmt(score)}`,`Copiar enlace de reto · supera mi ${o.fmt(score)}`)}</span></button>
   <div class="uc-ch-name" hidden><label>${L('Your name, so they know who to beat','Tu nombre, para que sepan a quién ganar')}</label><div><input maxlength="16" autocomplete="nickname" aria-label="${L('Your name','Tu nombre')}" placeholder="${L('e.g. Pepo','p. ej. Pepo')}"><button type="button">${L('Send','Enviar')}</button></div></div>
   <input class="uc-ch-url" readonly hidden aria-label="${L('Challenge link','Enlace del reto')}">
   <small>${mob?L('They get the same game and see your score.','Le toca el mismo juego y ve tu resultado.'):L('Paste it in WhatsApp, Discord or any chat. They get the same game.','Pégalo en WhatsApp, Discord o cualquier chat. Le toca el mismo juego.')}</small></div>`;
  const go=el.querySelector('.uc-ch-go'),box=el.querySelector('.uc-ch-name'),inp=box.querySelector('input'),url=el.querySelector('.uc-ch-url');
  const name=()=>ls.get('uc-nick')||ls.get('uc-chal-name')||'';
  const asked=()=>!!(ls.get('uc-nick')||ls.get('uc-chal-name')||ls.get('uc-chal-asked'));
  const send=async()=>{const cid=Math.random().toString(36).slice(2,10).padEnd(8,'0');ls.set('uc-chal-sent',JSON.stringify([...sentList(),cid].slice(-30)));
   const link=o.url(b64({g:o.game,n:name().slice(0,16),s:score,d:o.day,i:cid})),text=o.share(score,link);
   let how='copy';if(mobileShare()){try{await navigator.share({text});how='share'}catch(e){if(e&&e.name==='AbortError'){o.track('challenge_cancel',{game:o.game,cid,score,device:device()});return}}}
   if(how==='copy'){const ok=navigator.clipboard?.writeText?await navigator.clipboard.writeText(text).then(()=>true).catch(()=>false):false;
    if(ok){const sp=go.querySelector('span'),t=sp.textContent;sp.textContent=L('Link copied! Paste it in any chat','¡Enlace copiado! Pégalo en cualquier chat');setTimeout(()=>{sp.textContent=t},2400)}
    else{url.value=link;url.hidden=false;url.focus();url.select();how='manual'}}
   o.track('challenge_sent',{game:o.game,cid,score,method:how,device:device(),parent:c&&!c.old?c.i:null})};
  const ok=()=>{const v=inp.value.replace(/[<>&"'`]/g,'').trim().slice(0,16);ls.set('uc-chal-name',v);ls.set('uc-chal-asked','1');box.hidden=true;send()};
  go.onclick=()=>{if(asked())return send();box.hidden=false;inp.focus()};
  box.querySelector('button').onclick=ok;inp.onkeydown=e=>{if(e.key==='Enter')ok()};
  if(isFresh&&c&&!c.old&&!ls.get('uc-chal-done-'+c.i)){ls.set('uc-chal-done-'+c.i,'1');o.track('challenge_finish',{game:o.game,cid:c.i,score,from_score:c.s,won:score>c.s,draw:score===c.s,device:device(),src:'challenge'})}};
 return api};
})();
