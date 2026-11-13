// Global chat, docked on the right of every page (a "CHAT" tab on the edge opens it; on phones it's a full-screen sheet).
// Reading is open to everyone, posting needs a nickname. Rules (rate limit, reports, blocks, moderators) live in the database:
// supabase/socials_chat.sql. Today's Daily 5 answers are shown as SPOILER so nobody gets the game spoiled.
(()=>{
if(window.__ucChat)return;window.__ucChat=1;
const SB_URL="https://yujhjepukzdahsppntua.supabase.co",SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1amhqZXB1a3pkYWhzcHBudHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDMzNDcsImV4cCI6MjEwNTIxOTM0N30.YIOdtL7tJnNLPFPy19QuXe6w3Dcnz6Xedw0tFGdV_CE";
const ES=location.pathname.startsWith('/es/'),L=(en,es)=>ES?es:en,HOME=ES?'/es/':'/';
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch{return null}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ROOT=null;const $=id=>ROOT?ROOT.getElementById(id):null;
function sess(){try{const s=JSON.parse(ls('uc-player-session'));return s&&s.access_token?s:null}catch{return null}}
async function token(){let s=sess();if(!s)return null;
 if((s.exp||0)<Date.now()+60000){try{const r=await fetch(SB_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});const j=await r.json();if(!r.ok||!j.access_token)return null;
  s={...s,access_token:j.access_token,refresh_token:j.refresh_token||s.refresh_token,exp:Date.now()+Math.max(60,(+j.expires_in||3600))*1000};ls('uc-player-session',JSON.stringify(s))}catch{return null}}
 return s.access_token}
async function call(fn,args){const t=await token();const r=await fetch(SB_URL+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+(t||SB_KEY),'Content-Type':'application/json'},body:JSON.stringify(args||{})});
 const j=await r.json().catch(()=>null);if(!r.ok)throw new Error((j&&(j.message||j.hint))||L('Something went wrong. Try again.','Algo ha fallado. Inténtalo de nuevo.'));return j}
const track=(name,data)=>{try{fetch(SB_URL+'/rest/v1/events',{method:'POST',keepalive:true,headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({name,session:'c'+Math.random().toString(36).slice(2,8),visitor:ls('uc-visitor'),seconds:0,game_day:DAY,event_version:2,data:{page:location.pathname,...(data||{})}})}).catch(()=>{})}catch{}};
const DAY=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Amsterdam'});

// ── spoilers: every answer (and alias) to today's Daily 5, plus close misspellings, becomes SPOILER ──
const norm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ø/g,'o').replace(/ß/g,'ss').toLowerCase();
let SPOIL=null;
function lev(a,b){if(Math.abs(a.length-b.length)>2)return 3;const d=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);for(let j=1;j<=b.length;j++)d[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1)}return d[a.length][b.length]}
const STOP=new Set(['fc','cf','sc','ac','as','the','de','del','la','le','van','von','der','den','da','do','dos','di','el','al','city','united','real','club','sporting','athletic','atletico','inter','olympique','town','rovers','sport']);
async function loadSpoilers(){try{const r=await fetch('/daily/'+DAY+'.json',{cache:'no-cache'});if(!r.ok)throw 0;const d=await r.json();const phrases=new Set(),words=new Set();
 for(const q of d.questions||[])for(const a of q.answers||[])for(const n of [a.name,...(a.aliases||[])]){const t=norm(n).replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();if(t.length<2)continue;
  if(t.includes(' '))phrases.add(t);else if(t.length>=3&&!STOP.has(t))words.add(t);
  // a player's surname on its own gives the answer away too
  if(q.answer_type!=='club'&&q.answer_type!=='country'){const w=t.split(' ').filter(x=>!STOP.has(x));const last=w[w.length-1];if(last&&last.length>=4)words.add(last)}}
 SPOIL={phrases:[...phrases].sort((a,b)=>b.length-a.length),words}}catch{SPOIL={phrases:[],words:new Set()}}}
function spoil(text){if(!SPOIL)return esc(text);
 // work on the normalised text, map hits back onto the original characters
 const src=String(text);let n='';for(const ch of src){const c=norm(ch)[0]||' ';const k=/[a-z0-9]/.test(c)?c:' ';n+=k.padEnd(ch.length,' ')}const hit=new Uint8Array(src.length);
 for(const p of SPOIL.phrases){let i=0;while((i=n.indexOf(p,i))>-1){const a=i,b=i+p.length;if((a===0||!/[a-z0-9]/.test(n[a-1]))&&(b>=n.length||!/[a-z0-9]/.test(n[b])))hit.fill(1,a,b);i=b}}
 const re=/[a-z0-9]+/g;let m;while((m=re.exec(n))){const w=m[0];if(w.length<3)continue;let bad=SPOIL.words.has(w);
  if(!bad&&w.length>=5){const tol=w.length>=9?2:1;for(const t of SPOIL.words){if(t.length>=5&&Math.abs(t.length-w.length)<=tol&&lev(w,t)<=tol){bad=true;break}}}
  if(bad)hit.fill(1,m.index,m.index+w.length)}
 let out='',i=0;while(i<src.length){if(hit[i]){let j=i;while(j<src.length&&(hit[j]||(src[j]===' '&&hit[j+1])))j++;out+=`<mark class="ucc-sp" title="${L("Today's Daily 5 answer",'Respuesta del Daily 5 de hoy')}">SPOILER</mark>`;i=j}else{let j=i;while(j<src.length&&!hit[j])j++;out+=esc(src.slice(i,j));i=j}}
 return out}

// ── the unicorn next to each name: whichever sprite helper this page has ──
let spriteReady=null;
function ensureSprites(){if(typeof spriteDraw==='function'||typeof sprite==='function')return Promise.resolve();if(spriteReady)return spriteReady;
 spriteReady=new Promise(res=>{const s=document.createElement('script');s.src='/duel/sprites.js';s.onload=res;s.onerror=res;document.head.appendChild(s)});return spriteReady}
function uni(kit){try{const K=typeof KITS!=='undefined'?KITS:[];const k=K.find(x=>x.id===kit)||null;const kk=k&&k.id!=='classic'?k:null;
 if(typeof spriteDraw==='function')return spriteDraw('happy',0,false,kk).replace(/"/g,"'");if(typeof sprite==='function')return sprite('happy',0,false,kk||K.find(x=>x.id==='classic')).replace(/"/g,"'")}catch{}return'none'}

const CSS=`
.ucc-tab{position:fixed;z-index:8000;right:0;top:50%;transform:translateY(-50%);all:unset;position:fixed;z-index:8000;right:0;top:50%;transform:translateY(-50%);cursor:pointer;background:#f2c230;color:#1d1a2b;border:3px solid #1d1a2b;border-right:0;box-shadow:-4px 4px 0 rgba(0,0,0,.35);padding:14px 8px;writing-mode:vertical-rl;font:400 22px/1 "Jersey 10",Impact,sans-serif;letter-spacing:.12em;display:flex;align-items:center;gap:8px}
.ucc-tab:hover{background:#ffd64d}.ucc-tab:focus-visible{outline:3px solid #4fd7ff}
.ucc-tab i{writing-mode:horizontal-tb;font-style:normal;background:#c8473b;color:#fff;border:2px solid #1d1a2b;font:400 15px/1 "Jersey 10",sans-serif;padding:3px 5px 1px;letter-spacing:0}
.ucc{position:fixed;z-index:8001;top:0;right:0;bottom:0;width:min(380px,100vw);display:flex;flex-direction:column;background:#fbf6e8;color:#1d1a2b;border-left:4px solid #1d1a2b;box-shadow:-8px 0 0 rgba(0,0,0,.25);transform:translateX(105%);transition:transform 240ms cubic-bezier(.32,.72,0,1);font:400 20px/1.25 VT323,ui-monospace,monospace;padding-bottom:env(safe-area-inset-bottom,0px)}
.ucc[data-open="1"]{transform:none}
.ucc-h{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#1d1a2b;color:#fbf6e8;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px 14px}
.ucc-h b{font:400 26px/1 "Jersey 10",Impact,sans-serif;color:#f2c230;letter-spacing:.04em}.ucc-h small{display:block;font:400 16px VT323,monospace;color:#bdb4dc;margin-top:2px}
.ucc-x{all:unset;box-sizing:border-box;flex:none;cursor:pointer;width:38px;height:38px;display:grid;place-items:center;line-height:0;border:3px solid #fbf6e8;font:400 20px/1 "Jersey 10",sans-serif;color:#fbf6e8}.ucc-x:hover{background:#fbf6e8;color:#1d1a2b}.ucc-x svg{display:block}.ucc-x:focus-visible{outline:3px solid #4fd7ff}
.ucc-rules{margin:0;padding:8px 12px;font-size:16px;color:#6b6480;border-bottom:3px solid #1d1a2b;background:#f3e6bf}
.ucc-list{flex:1;overflow-y:auto;padding:4px 8px;scrollbar-width:thin;scrollbar-color:#c9a24a transparent}
.ucc-list::-webkit-scrollbar{width:6px}.ucc-list::-webkit-scrollbar-thumb{background:#c9a24a}
.ucc-empty{margin:40px 10px;text-align:center;color:#6b6480}
.ucc-m{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:1px 8px;align-items:start;padding:7px 4px 8px;border-bottom:2px dashed #e3d9bd}
.ucc-m.mine{background:#fff3c4}
.ucc-av{width:30px;height:26px;background:center/contain no-repeat;image-rendering:pixelated;margin-top:2px}
.ucc-hd{display:flex;gap:7px;align-items:baseline;min-width:0}
.ucc-n{all:unset;cursor:pointer;font:400 20px/1 "Jersey 10",Impact,sans-serif;color:#1d1a2b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ucc-n:hover{text-decoration:underline}.ucc-n:focus-visible{outline:2px solid #4fd7ff}
.ucc-mod{font:400 12px/1 "Jersey 10",sans-serif;background:#c8473b;color:#fff;padding:2px 4px 1px}
.ucc-t{font-size:15px;color:#6b6480;flex:none}
.ucc-b{grid-column:2;font-size:21px;line-height:1.2;overflow-wrap:anywhere;white-space:pre-wrap}
.ucc-sp{background:#1d1a2b;color:#f2c230;font:400 15px/1 "Jersey 10",sans-serif;letter-spacing:.08em;padding:2px 5px 0;vertical-align:1px}
.ucc-more{all:unset;cursor:pointer;grid-row:1/span 2;grid-column:3;width:28px;height:28px;display:grid;place-items:center;font:400 20px/1 "Jersey 10",sans-serif;color:#6b6480}.ucc-more:hover{background:#e3d9bd;color:#1d1a2b}
.ucc-menu{grid-column:2/-1;display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.ucc-menu button{all:unset;cursor:pointer;font:400 16px/1 "Jersey 10",sans-serif;padding:7px 9px 5px;border:2px solid #1d1a2b;background:#fbf6e8;box-shadow:0 2px 0 #1d1a2b}
.ucc-menu button.danger{background:#c8473b;color:#fff}
.ucc-f{display:flex;gap:8px;padding:10px;border-top:3px solid #1d1a2b}
.ucc-f input{flex:1;min-width:0;font:400 21px VT323,monospace;padding:9px 10px 7px;border:3px solid #1d1a2b;background:#fff;color:#1d1a2b;border-radius:0}
.ucc-f button{all:unset;cursor:pointer;font:400 22px/1 "Jersey 10",sans-serif;padding:10px 16px 8px;border:3px solid #1d1a2b;background:#f2c230;box-shadow:0 3px 0 #1d1a2b}
.ucc-f button:disabled{opacity:.6}
.ucc-info{margin:0;padding:10px 12px;border-top:3px solid #1d1a2b;font-size:18px;color:#6b6480}.ucc-info a{color:#1d1a2b;font-weight:700}.ucc-info.bad{color:#c8473b}
.ucc-err{margin:0 10px 8px;color:#c8473b;font-size:17px}
.ucc-toast{position:absolute;left:12px;right:12px;bottom:80px;background:#1d1a2b;color:#fbf6e8;padding:8px 10px;font-size:18px;text-align:center}
@media (max-width:700px){.ucc{width:100vw;border-left:0}.ucc-tab{top:auto;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:none;writing-mode:horizontal-tb;padding:10px 12px 8px;border-right:0;font-size:20px}}
@media (prefers-reduced-motion:reduce){.ucc{transition:none}}`;

const C={rows:[],last:0,me:null,open:null,loaded:false,busy:false,isOpen:false,unread:0,seen:+(ls('uc-chat-seen')||0)};
const tm=at=>new Date(at).toLocaleTimeString(ES?'es-ES':'en-GB',{hour:'2-digit',minute:'2-digit'});
function row(m){const open=C.open===m.id,me=C.me;
 const menu=open?`<div class="ucc-menu">${m.mine?`<button type="button" data-c="del" data-id="${m.id}">${L('Delete','Borrar')}</button>`:`<button type="button" data-c="report" data-id="${m.id}">${L('Report','Denunciar')}</button><button type="button" data-c="block" data-nick="${esc(m.nick)}">${L('Block','Bloquear')} ${esc(m.nick)}</button>`}${me?.mod&&!m.mine?`<button type="button" class="danger" data-c="del" data-id="${m.id}">${L('Delete','Borrar')}</button><button type="button" class="danger" data-c="mute" data-nick="${esc(m.nick)}" data-h="24">${L('Mute 24h','Silenciar 24h')}</button><button type="button" class="danger" data-c="mute" data-nick="${esc(m.nick)}" data-h="9999">${L('Mute for good','Silenciar siempre')}</button>`:''}</div>`:'';
 return`<div class="ucc-m${m.mine?' mine':''}"><i class="ucc-av" style="background-image:${uni(m.kit)}"></i><div class="ucc-hd"><button type="button" class="ucc-n" data-nick="${esc(m.nick)}" data-kit="${esc(m.kit)}">${esc(m.nick)}</button>${m.mod?'<span class="ucc-mod">MOD</span>':''}<span class="ucc-t">${tm(m.at)}</span></div>${sess()?`<button type="button" class="ucc-more" data-c="menu" data-id="${m.id}" aria-label="${L('Options','Opciones')}" aria-expanded="${open}">⋯</button>`:''}<div class="ucc-b">${spoil(m.body)}</div>${menu}</div>`}
function draw(keep){const el=$('ucc-list');if(!el)return;const near=el.scrollHeight-el.scrollTop-el.clientHeight<80;
 el.innerHTML=C.rows.length?C.rows.map(row).join(''):`<p class="ucc-empty">${C.loaded?L('No messages yet. Say hello!','Aún no hay mensajes. ¡Saluda!'):L('Loading the chat…','Cargando el chat…')}</p>`;
 if(!keep||near)el.scrollTop=el.scrollHeight}
function compose(){const box=$('ucc-c');if(!box)return;const me=C.me;
 if(!sess()){box.innerHTML=`<p class="ucc-info"><a href="${HOME}#signin" data-uc-signin>${L('Sign in','Inicia sesión')}</a> ${L('to chat with everyone. It\'s free.','para chatear con todos. Es gratis.')}</p>`;return}
 if(!me?.nick){box.innerHTML=`<p class="ucc-info">${L('Pick a nickname on the','Elige un apodo en la')} <a href="${HOME}">${L('home page','página principal')}</a> ${L('to start chatting.','para chatear.')}</p>`;return}
 if(me.muted_until){box.innerHTML=`<p class="ucc-info bad">${L('A moderator muted you until','Un moderador te ha silenciado hasta')} ${new Date(me.muted_until).toLocaleString(ES?'es-ES':'en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}.</p>`;return}
 if($('ucc-in'))return;
 box.innerHTML=`<p class="ucc-err" id="ucc-err" hidden></p><form class="ucc-f" id="ucc-f"><input id="ucc-in" maxlength="280" autocomplete="off" enterkeyhint="send" placeholder="${L('Message as','Escribe como')} ${esc(me.nick)}" aria-label="${L('Message','Mensaje')}"><button type="submit" id="ucc-send">${L('Send','Enviar')}</button></form>`;
 $('ucc-f').onsubmit=async e=>{e.preventDefault();const v=$('ucc-in').value.trim();if(!v)return;$('ucc-send').disabled=true;$('ucc-err').hidden=true;
  try{const m=await call('chat_send',{p_body:v});$('ucc-in').value='';if(m&&!C.rows.some(r=>r.id===m.id)){C.rows.push(m);C.last=Math.max(C.last,m.id);draw()}track('chat_send',{len:v.length})}
  catch(err){$('ucc-err').textContent=err.message;$('ucc-err').hidden=false}finally{$('ucc-send').disabled=false;$('ucc-in').focus()}}}
let toastT;function toast(t){const p=$('ucc');if(!p)return;let e=p.querySelector('.ucc-toast');if(!e){e=document.createElement('div');e.className='ucc-toast';e.setAttribute('role','status');p.appendChild(e)}e.textContent=t;clearTimeout(toastT);toastT=setTimeout(()=>e.remove(),2400)}
function badge(){const t=$('ucc-tab');if(!t)return;let i=t.querySelector('i');const n=C.isOpen?0:C.unread;if(!n){i?.remove();return}if(!i){i=document.createElement('i');t.appendChild(i)}i.textContent=n>9?'9+':n}
async function load(){try{const j=await call('chat_recent',{});C.rows=j?.rows||[];C.me=j?.me||null;C.last=C.rows.reduce((a,m)=>Math.max(a,m.id),0);C.loaded=true;
 C.unread=C.rows.filter(m=>m.id>C.seen&&!m.mine).length;draw();compose();badge()}catch{C.loaded=true;draw()}}
async function poll(){if(C.busy||!C.loaded||document.hidden)return;C.busy=true;
 try{const j=await call('chat_since',{p_after:C.last});const gone=new Set(j?.gone||[]),add=(j?.rows||[]).filter(m=>!C.rows.some(r=>r.id===m.id));const n0=C.rows.length;
  C.rows=C.rows.filter(r=>!gone.has(r.id)).concat(add).slice(-200);C.last=C.rows.reduce((a,m)=>Math.max(a,m.id),C.last);
  if(!C.isOpen)C.unread+=add.filter(m=>!m.mine).length;else markSeen();badge();if(add.length||C.rows.length!==n0)draw(true)}catch{}finally{C.busy=false}}
function markSeen(){C.seen=C.last;ls('uc-chat-seen',String(C.seen));C.unread=0}
function setOpen(on,how){C.isOpen=on;const p=$('ucc');p.dataset.open=on?'1':'0';p.inert=!on;ls('uc-chat-open',on?'1':null);$('ucc-tab').hidden=on;$('ucc-tab').setAttribute('aria-expanded',String(on));
 if(on){markSeen();draw();if(how)track('chat_open',{how})}badge()}
function playerOpen(nick,kit){if(typeof window.ucPlayerCard==='function'){if(matchMedia('(max-width:700px)').matches)setOpen(false);window.ucPlayerCard(nick,kit);return}location.href=HOME+'squad.html#player='+encodeURIComponent(nick)}
function build(){const host=document.createElement('div');host.id='ucc-host';document.body.appendChild(host);ROOT=host.attachShadow({mode:'open'});const st=document.createElement('style');st.textContent=CSS;ROOT.appendChild(st);
 const tab=document.createElement('button');tab.type='button';tab.id='ucc-tab';tab.className='ucc-tab';tab.textContent=L('CHAT','CHAT');tab.setAttribute('aria-controls','ucc');tab.setAttribute('aria-expanded','false');
 const p=document.createElement('aside');p.id='ucc';p.className='ucc';p.setAttribute('aria-label',L('Global chat','Chat global'));p.dataset.open='0';p.inert=true;
 p.innerHTML=`<div class="ucc-h"><div><b>${L('GLOBAL CHAT','CHAT GLOBAL')}</b><small>${L("Keep it football. Today's Daily 5 answers show as SPOILER.",'De fútbol. Las respuestas del Daily 5 de hoy salen como SPOILER.')}</small></div><button type="button" class="ucc-x" id="ucc-x" aria-label="${L('Close chat','Cerrar chat')}"><svg viewBox="0 0 9 8" width="18" height="16" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M0 0h1v1H0zM0 7h1v1H0zM1 0h1v1H1zM1 1h1v1H1zM1 6h1v1H1zM1 7h1v1H1zM2 1h1v1H2zM2 2h1v1H2zM2 5h1v1H2zM2 6h1v1H2zM3 2h1v1H3zM3 3h1v1H3zM3 4h1v1H3zM3 5h1v1H3zM4 3h1v1H4zM4 4h1v1H4zM5 2h1v1H5zM5 3h1v1H5zM5 4h1v1H5zM5 5h1v1H5zM6 1h1v1H6zM6 2h1v1H6zM6 5h1v1H6zM6 6h1v1H6zM7 0h1v1H7zM7 1h1v1H7zM7 6h1v1H7zM7 7h1v1H7zM8 0h1v1H8zM8 7h1v1H8z"/></svg></button></div>
  <p class="ucc-rules">${L("Say what you want. Anything nasty: tap ⋯ and report it. Three reports and it's gone.",'Di lo que quieras. Si algo es ofensivo: toca ⋯ y denúncialo. Con tres denuncias desaparece.')}</p>
  <div class="ucc-list" id="ucc-list" aria-live="polite"></div><div id="ucc-c"></div>`;
 ROOT.append(tab,p);
 tab.onclick=()=>setOpen(true,'tab');$('ucc-x').onclick=()=>{setOpen(false);tab.focus()};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&C.isOpen){setOpen(false);tab.focus()}});
 ROOT.addEventListener('click',e=>{if(e.target.closest('[data-uc-signin]'))ls('uc-return',location.pathname+location.search)});
 $('ucc-list').addEventListener('click',async e=>{const n=e.target.closest('.ucc-n');if(n){playerOpen(n.dataset.nick,n.dataset.kit);return}
  const b=e.target.closest('[data-c]');if(!b)return;const k=b.dataset.c,id=+b.dataset.id;
  if(k==='menu'){C.open=C.open===id?null:id;draw(true);return}
  try{if(k==='report'){const r=await call('chat_report',{p_id:id});toast(r==='hidden'?L('Removed. Thanks for reporting.','Eliminado. Gracias por avisar.'):L('Reported. Thanks.','Denunciado. Gracias.'));if(r==='hidden')C.rows=C.rows.filter(m=>m.id!==id);track('chat_report',{})}
   else if(k==='del'){await call('chat_delete',{p_id:id});C.rows=C.rows.filter(m=>m.id!==id);toast(L('Deleted','Borrado'))}
   else if(k==='block'){await call('chat_block',{p_nick:b.dataset.nick,p_on:true});C.rows=C.rows.filter(m=>m.nick!==b.dataset.nick);toast(L("You won't see them in the chat any more.",'Ya no lo verás en el chat.'));track('chat_block',{})}
   else if(k==='mute'){await call('chat_mute',{p_nick:b.dataset.nick,p_hours:+b.dataset.h});C.rows=C.rows.filter(m=>m.nick!==b.dataset.nick);toast(b.dataset.nick+L(' is muted',' está silenciado'))}
   C.open=null;draw(true)}catch(err){toast(err.message)}});
 window.ucChatOpen=()=>setOpen(true,'link');
 // wide screens remember an open chat between pages; phones always start closed
 if(ls('uc-chat-open')==='1'&&matchMedia('(min-width:1200px)').matches)setOpen(true);
}
async function start(){build();await Promise.all([loadSpoilers(),ensureSprites()]);await load();setInterval(()=>{if(C.isOpen||Date.now()%30000<4000)poll()},4000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll()})}
document.readyState==='loading'?addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
