// Friend request notifications on every page: a pop-up card ("X wants to be your friend" with Accept / Not now),
// the red number on Socials, and a phone notification for the other player when you send a request.
// Signed-in players only. Checks when the page opens, when you come back to the tab, and every minute while it's open.
(()=>{
if(window.__ucNotify)return;window.__ucNotify=1;
const SB_URL="https://yujhjepukzdahsppntua.supabase.co",SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1amhqZXB1a3pkYWhzcHBudHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDMzNDcsImV4cCI6MjEwNTIxOTM0N30.YIOdtL7tJnNLPFPy19QuXe6w3Dcnz6Xedw0tFGdV_CE";
const ES=location.pathname.startsWith('/es/'),L=(en,es)=>ES?es:en;
const ls=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch{return null}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let busy=false,last=0;
function sess(){try{const s=JSON.parse(ls('uc-player-session'));return s&&s.access_token?s:null}catch{return null}}
async function token(){let s=sess();if(!s)return null;
 if((s.exp||0)<Date.now()+60000){try{const r=await fetch(SB_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});const j=await r.json();if(!r.ok||!j.access_token)return null;
  s={...s,access_token:j.access_token,refresh_token:j.refresh_token||s.refresh_token,exp:Date.now()+Math.max(60,(+j.expires_in||3600))*1000};ls('uc-player-session',JSON.stringify(s))}catch{return null}}
 return s.access_token}
async function rpc(fn,args){const t=await token();if(!t)return null;const r=await fetch(SB_URL+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify(args||{})});
 const j=await r.json().catch(()=>null);if(!r.ok)throw new Error((j&&j.message)||'error');return j}
const track=(name,data)=>{try{fetch(SB_URL+'/rest/v1/events',{method:'POST',keepalive:true,headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({name,session:'n'+Math.random().toString(36).slice(2,8),visitor:ls('uc-visitor'),seconds:0,game_day:new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Amsterdam'}),event_version:2,data:{page:location.pathname,...(data||{})}})}).catch(()=>{})}catch{}};

// the red number: the home page's Socials bar listens for this, the Socials page has its own dot
function badge(n){window.dispatchEvent(new CustomEvent('uc-inbox',{detail:{n}}));const pip=document.getElementById('pip');if(pip&&location.pathname.endsWith('squad.html')){pip.hidden=!n;pip.textContent=n}}

const CSS=`.ucfr{position:fixed;z-index:9000;left:max(12px,env(safe-area-inset-left,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));width:min(360px,calc(100vw - 24px));background:#fbf6e8;color:#1d1a2b;border:3px solid #1d1a2b;box-shadow:5px 5px 0 rgba(0,0,0,.45);font:400 17px/1.25 VT323,ui-monospace,monospace;padding:12px 12px 12px 14px;transition:transform 220ms cubic-bezier(.23,1,.32,1),opacity 220ms ease}
.ucfr[data-in="0"]{transform:translateY(16px);opacity:0}
.ucfr h4{margin:0 26px 2px 0;font:400 24px/1.05 "Jersey 10",Impact,sans-serif}.ucfr h4 em{font-style:normal;color:#c8473b}
.ucfr p{margin:0 0 10px;color:#5b5070}.ucfr .r{display:flex;gap:8px;flex-wrap:wrap}
#ucfr.ucfr button{all:unset;box-sizing:border-box;font:400 20px/1 "Jersey 10",Impact,sans-serif;padding:9px 14px 7px;border:3px solid #1d1a2b;box-shadow:0 3px 0 #1d1a2b;cursor:pointer;background:#fbf6e8;color:#1d1a2b;text-transform:none;letter-spacing:0;min-height:0;width:auto}
#ucfr.ucfr button:focus-visible{outline:3px solid #4fd7ff;outline-offset:2px}
#ucfr.ucfr button.y{background:#f2c230}#ucfr.ucfr button:active{transform:translateY(2px);box-shadow:0 1px 0 #1d1a2b}#ucfr.ucfr button:disabled{opacity:.6}
#ucfr.ucfr .x{position:absolute;top:6px;right:6px;width:30px;height:30px;padding:0;font-size:18px;box-shadow:none;border-width:2px;display:grid;place-items:center}
.ucfr .more{margin-left:auto;align-self:center;color:#1d1a2b;font-size:16px}
@media (prefers-reduced-motion:reduce){.ucfr{transition:none}}`;
function card(list){let el=document.getElementById('ucfr');
 const seen=new Set(JSON.parse(ls('uc-fr-seen')||'[]')),fresh=list.filter(r=>!seen.has(r.nick+'|'+r.at));
 if(!fresh.length){el?.remove();return}
 // never during a timed duel round
 if(document.querySelector('#s-play:not([hidden]),#s-battle:not([hidden]),#s-ready:not([hidden])'))return;
 // on the Socials friends tab the requests are already on screen
 if(location.pathname.endsWith('squad.html')&&(location.hash==='#friends'||matchMedia('(min-width:900px)').matches))return;
 const r=fresh[0],more=fresh.length-1;
 if(!document.getElementById('ucfr-css')){const st=document.createElement('style');st.id='ucfr-css';st.textContent=CSS;document.head.appendChild(st)}
 if(!el){el=document.createElement('div');el.id='ucfr';el.className='ucfr';el.setAttribute('role','status');el.dataset.in='0';document.body.appendChild(el);requestAnimationFrame(()=>requestAnimationFrame(()=>el.dataset.in='1'))}
 const social=(ES?'/es/':'/')+'squad.html#friends';
 el.innerHTML=`<button type="button" class="x" data-fr="close" aria-label="${L('Close','Cerrar')}">✕</button><h4><em>${esc(r.nick)}</em> ${L('wants to be your friend','quiere ser tu amigo')}</h4><p>${L('Friends see each other on the rankings and can challenge each other to duels.','Los amigos se ven en los rankings y pueden retarse a duelos.')}</p>
  <div class="r"><button type="button" class="y" data-fr="yes">${L('Accept','Aceptar')}</button><button type="button" data-fr="no">${L('Decline','Rechazar')}</button>${more?`<a class="more" href="${social}">+${more} ${L('more','más')}</a>`:''}</div>`;
 const done=()=>{seen.add(r.nick+'|'+r.at);ls('uc-fr-seen',JSON.stringify([...seen].slice(-200)))};
 el.onclick=async e=>{const b=e.target.closest('[data-fr]');if(!b)return;const k=b.dataset.fr;
  if(k==='close'){done();track('friend_popup_close',{});el.dataset.in='0';setTimeout(()=>{el.remove();card(list)},220);return}
  el.querySelectorAll('button').forEach(x=>x.disabled=true);
  try{await rpc('sq_respond',{p_nick:r.nick,p_accept:k==='yes'});track('friend_popup_'+(k==='yes'?'accept':'decline'),{});
   el.querySelector('h4').innerHTML=k==='yes'?`${L('You and','Tú y')} <em>${esc(r.nick)}</em> ${L('are friends now!','ya sois amigos!')}`:L('Request declined','Solicitud rechazada');el.querySelector('p').textContent='';el.querySelector('.r').innerHTML='';
   done();window.dispatchEvent(new Event('uc-friends-changed'));setTimeout(()=>{el.dataset.in='0';setTimeout(()=>{el.remove();check(true)},220)},1600)}
  catch(err){el.querySelector('p').textContent=err.message;el.querySelectorAll('button').forEach(x=>x.disabled=false)}}}

async function check(force){if(busy||!sess())return;if(!force&&Date.now()-last<20000)return;busy=true;last=Date.now();
 try{const list=await rpc('sq_inbox',{});if(Array.isArray(list)){badge(list.length);card(list)}}catch{}finally{busy=false}}
window.ucInboxCheck=()=>check(true);
// after you send a request: a phone notification for the other player (once per request, checked on the server)
window.ucFriendPush=async nick=>{try{const t=await token();if(!t||!nick)return;fetch(SB_URL+'/functions/v1/duel-push',{method:'POST',keepalive:true,headers:{apikey:SB_KEY,Authorization:'Bearer '+t,'Content-Type':'application/json'},body:JSON.stringify({friend:String(nick)})}).catch(()=>{})}catch{}};
const start=()=>{setTimeout(()=>check(true),1500);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});setInterval(()=>{if(!document.hidden)check()},60000)};
document.readyState==='loading'?addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
