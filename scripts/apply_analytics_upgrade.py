from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

if "event_version:2" in s and "FAME_PTS_V2" in s and "uc-admin-refresh" in s:
    print('Unicorner upgrade already applied')
    raise SystemExit(0)

def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'MISSING {label}')
    s = s.replace(old, new, 1)
    print('patched', label)

old = """function ask(){document.body.classList.add('playing');if(qi===0)track('game_start');const q=Q[qi];let left=TIME*1000,t0,done=false;
 swap(`<div class="card"><div class="mute">Prompt ${qi+1} of ${Q.length} · ${q.sub}</div><div class="prompt">${q.prompt}</div>${q.by?`<div class="byline">🦄 Community question by ${q.by}</div>`:''}
 <div class="timer" id="tm"><i id="bar"></i></div>
 <form id="f" autocomplete="off"><div class="answer-row"><input id="in" placeholder="Type a player" aria-label="Your answer"><button type="submit" class="cta submitbtn">Submit</button></div></form>
 <div class="msg" id="msg"></div><div class="skiprow"><button class="skipbtn" id="skip">Skip this one</button></div></div>`,()=>{t0=performance.now();
 const inp=document.getElementById('in'),msg=document.getElementById('msg'),bar=document.getElementById('bar');inp.focus();
 const tick=()=>{if(done)return;const el=left-(performance.now()-t0);bar.style.width=`${Math.max(0,el/(TIME*1000))*100}%`;document.getElementById('tm').classList.toggle('low',el<6000);if(el<=0)finish(null);else timer=requestAnimationFrame(tick)};tick();
 function finish(ans){done=true;cancelAnimationFrame(timer);reveal(ans)}
 document.getElementById('skip').onclick=()=>finish(null);
 document.getElementById('f').onsubmit=e=>{e.preventDefault();const r=match(inp.value,q.answers);
  if(r&&r!=='ambiguous')return finish(r);
  const x=norm(inp.value);
  msg.className='msg bad';msg.textContent=r==='ambiguous'?'More than one player fits. Add the first name.':(known.has(x)||knownLast.has(x))?'Real player, but not on this list.':"Didn't recognise that player.";
  inp.classList.remove('shake');void inp.offsetWidth;inp.classList.add('shake');inp.select()}})}"""
new = """function ask(){document.body.classList.add('playing');const q=Q[qi];if(qi===0)track('game_start',{question_count:Q.length,set_id:dailySetId()});track('question_view',{question_id:q.id||slug(q.prompt),prompt:q.prompt,position:qi+1,question_count:Q.length,difficulty:q.difficulty||'unknown',answer_count:q.answers.length,set_id:dailySetId()});let left=TIME*1000,t0,done=false;
 swap(`<div class="card"><div class="mute">Prompt ${qi+1} of ${Q.length} · ${q.sub}</div><div class="prompt">${q.prompt}</div>${q.by?`<div class="byline">🦄 Community question by ${q.by}</div>`:''}
 <div class="timer" id="tm"><i id="bar"></i></div>
 <form id="f" autocomplete="off"><div class="answer-row"><input id="in" placeholder="Type a player" aria-label="Your answer"><button type="submit" class="cta submitbtn">Submit</button></div></form>
 <div class="msg" id="msg"></div><div class="skiprow"><button class="skipbtn" id="skip">Skip this one</button></div></div>`,()=>{t0=performance.now();
 const inp=document.getElementById('in'),msg=document.getElementById('msg'),bar=document.getElementById('bar');inp.focus();
 const elapsed=()=>Math.max(0,Math.round(performance.now()-t0));
 const tick=()=>{if(done)return;const el=left-(performance.now()-t0);bar.style.width=`${Math.max(0,el/(TIME*1000))*100}%`;document.getElementById('tm').classList.toggle('low',el<6000);if(el<=0)finish(null,'timeout');else timer=requestAnimationFrame(tick)};tick();
 function finish(ans,outcome){done=true;cancelAnimationFrame(timer);track('question_result',{question_id:q.id||slug(q.prompt),prompt:q.prompt,position:qi+1,outcome,elapsed_ms:elapsed(),answer:ans?ans.name:null,points:ans?ans.pts:0,tier:ans?tierName(ans.pts):null,set_id:dailySetId()});reveal(ans)}
 document.getElementById('skip').onclick=()=>finish(null,'skip');
 document.getElementById('f').onsubmit=e=>{e.preventDefault();const r=match(inp.value,q.answers),x=norm(inp.value);
  if(r&&r!=='ambiguous'){track('answer_attempt',{question_id:q.id||slug(q.prompt),position:qi+1,outcome:'correct',elapsed_ms:elapsed(),answer:r.name,points:r.pts,tier:tierName(r.pts),set_id:dailySetId()});return finish(r,'correct')}
  const outcome=r==='ambiguous'?'ambiguous':(known.has(x)||knownLast.has(x))?'wrong_player':'unrecognised';
  track('answer_attempt',{question_id:q.id||slug(q.prompt),position:qi+1,outcome,elapsed_ms:elapsed(),input_length:inp.value.trim().length,set_id:dailySetId()});
  msg.className='msg bad';msg.textContent=r==='ambiguous'?'More than one player fits. Add the first name.':(known.has(x)||knownLast.has(x))?'Real player, but not on this list.':"Didn't recognise that player.";
  inp.classList.remove('shake');void inp.offsetWidth;inp.classList.add('shake');inp.select()}})}"""
rep(old, new, 'question analytics')

rep("function end(restored){document.body.classList.remove('playing');if(!restored)track('game_finish',{score});fillReport();", "function end(restored){document.body.classList.remove('playing');if(!restored)track('game_finish',{score,question_count:Q.length,correct:results.filter(r=>r.ans).length,missed:results.filter(r=>!r.ans).length,screamers:results.filter(r=>r.pts===100).length,tiers:results.map(r=>r.pts),set_id:dailySetId()});fillReport();", 'game finish analytics')
rep("document.getElementById('copy').onclick=async e=>{try{await navigator.clipboard.writeText(share);e.target.textContent='Copied'}catch{e.target.textContent='Copy failed'}};", "document.getElementById('copy').onclick=async e=>{track('share_click',{score,set_id:dailySetId()});try{await navigator.clipboard.writeText(share);e.target.textContent='Copied'}catch{e.target.textContent='Copy failed'}};", 'share analytics')
rep("document.getElementById('home').onclick=()=>{window.scrollTo({top:0,behavior:'smooth'});start()};", "document.getElementById('home').onclick=()=>{track('home_click',{from:'results',score,set_id:dailySetId()});window.scrollTo({top:0,behavior:'smooth'});start()};", 'home analytics')

old = """let SB_TOKEN=null;try{SB_TOKEN=sessionStorage.getItem('uc-admin-token')}catch{}
async function sb(path,opt={}){const r=await fetch(SB_URL+path,{...opt,headers:{apikey:SB_KEY,Authorization:'Bearer '+(SB_TOKEN||SB_KEY),'Content-Type':'application/json',...(opt.headers||{})}});
 if(!r.ok){let m='';try{m=(await r.json()).message}catch{}const e=new Error(m||('HTTP '+r.status));e.code=r.status;throw e}
 const t=await r.text();return t?JSON.parse(t):null}"""
new = """let SB_TOKEN=null,SB_REFRESH=null,SB_EXP=0;try{SB_TOKEN=sessionStorage.getItem('uc-admin-token');SB_REFRESH=sessionStorage.getItem('uc-admin-refresh');SB_EXP=+(sessionStorage.getItem('uc-admin-exp')||0)}catch{}
function saveAuth(j){SB_TOKEN=j.access_token;SB_REFRESH=j.refresh_token||SB_REFRESH;SB_EXP=Date.now()+Math.max(60,(j.expires_in||3600))*1000;try{sessionStorage.setItem('uc-admin-token',SB_TOKEN);if(SB_REFRESH)sessionStorage.setItem('uc-admin-refresh',SB_REFRESH);sessionStorage.setItem('uc-admin-exp',String(SB_EXP))}catch{}}
function clearAuth(){SB_TOKEN=null;SB_REFRESH=null;SB_EXP=0;try{sessionStorage.removeItem('uc-admin-token');sessionStorage.removeItem('uc-admin-refresh');sessionStorage.removeItem('uc-admin-exp')}catch{}}
async function refreshAdminToken(){if(!SB_REFRESH)throw new Error('Session expired — log in again');const r=await fetch(SB_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:SB_REFRESH})});const j=await r.json();if(!r.ok||!j.access_token){clearAuth();throw new Error('Session expired — log in again')}saveAuth(j);return SB_TOKEN}
async function sb(path,opt={},retried=false){const isAdmin=!!SB_TOKEN;if(isAdmin&&SB_EXP&&Date.now()>SB_EXP-60000)try{await refreshAdminToken()}catch{clearAuth()}
 const r=await fetch(SB_URL+path,{...opt,headers:{apikey:SB_KEY,Authorization:'Bearer '+(SB_TOKEN||SB_KEY),'Content-Type':'application/json',...(opt.headers||{})}});
 if(r.status===401&&SB_REFRESH&&!retried){await refreshAdminToken();return sb(path,opt,true)}
 if(!r.ok){let m='';try{m=(await r.json()).message}catch{}const e=new Error((r.status===401?'Session expired — log in again':m)||('HTTP '+r.status));e.code=r.status;throw e}
 const t=await r.text();return t?JSON.parse(t):null}"""
rep(old, new, 'admin token refresh')

old = "document.addEventListener('click',e=>{const inf=e.target.closest('[data-infinite]');if(inf){track('infinite_click');openDlg('dlg-infinite');dbP.then(db=>db&&db.collection('submissions').add({kind:'infinite-click',from:document.body.classList.contains('landing')?'landing':'results',sentAt:new Date().toISOString()})).catch(()=>{})}const o=e.target.closest('[data-open]');if(o){openDlg(o.dataset.open,o.dataset.q!==undefined?{question:o.dataset.q}:null)}const c=e.target.closest('[data-close]');if(c)c.closest('dialog').close()});"
new = "document.addEventListener('click',e=>{const inf=e.target.closest('[data-infinite]');if(inf){const from=document.body.classList.contains('landing')?'landing':'results';track('infinite_click',{from,set_id:dailySetId()});openDlg('dlg-infinite');dbP.then(db=>db&&db.collection('submissions').add({kind:'infinite-click',from,sentAt:new Date().toISOString()})).catch(()=>{})}const o=e.target.closest('[data-open]');if(o){track('dialog_open',{dialog:o.dataset.open,question_index:o.dataset.q!==undefined?+o.dataset.q:null});openDlg(o.dataset.open,o.dataset.q!==undefined?{question:o.dataset.q}:null)}const c=e.target.closest('[data-close]');if(c)c.closest('dialog').close()});"
rep(old, new, 'infinite/dialog analytics')
rep("if(!m&&sv)console.warn('email relay failed, saved to database only');\n  msg.textContent=", "if(!m&&sv)console.warn('email relay failed, saved to database only');track('form_success',{kind});\n  msg.textContent=", 'form success')
rep("catch(err){btn.disabled=false;msg.className='formmsg msg bad';const body=", "catch(err){track('form_error',{kind:f.dataset.kind,error:String(err.message||'unknown').slice(0,120)});btn.disabled=false;msg.className='formmsg msg bad';const body=", 'form error')

rep("// ---- score distribution\nconst TODAY=new Date().toISOString().slice(0,10);", "// ---- score distribution\nconst amsterdamDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());\nconst TODAY=amsterdamDay();", 'Amsterdam score day')

old = """// ---- privacy-friendly analytics (own database, no cookies)
const SID=(()=>{try{let v=sessionStorage.getItem('uc-sid');if(!v){v=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('uc-sid',v)}return v}catch{return 'anon'}})();
const T0=Date.now();let lastBeat=0;
function track(name,data){try{const body=JSON.stringify({name,session:SID,seconds:Math.round((Date.now()-T0)/1000),data:data||{}});
 if(navigator.sendBeacon){const url=SB_URL+'/rest/v1/events?apikey='+encodeURIComponent(SB_KEY);navigator.sendBeacon(url,new Blob([body],{type:'application/json'}))}
 else sb('/rest/v1/events',{method:'POST',headers:{Prefer:'return=minimal'},body}).catch(()=>{})}catch{}}
track('view',{ref:(document.referrer||'').slice(0,120),w:window.innerWidth});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&Date.now()-lastBeat>5000){lastBeat=Date.now();track('leave')}});
window.addEventListener('pagehide',()=>track('leave'));"""
new = """// ---- privacy-friendly analytics (own database, no cookies)
const SID=(()=>{try{let v=sessionStorage.getItem('uc-sid');if(!v){v=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('uc-sid',v)}return v}catch{return 'anon'}})();
const T0=Date.now();let lastBeat=0;
const dailySetId=()=>{try{return amsterdamDay()+':'+Q.map(q=>q.id||slug(q.prompt)).join('|')}catch{return amsterdamDay()}};
const DEVICE={w:window.innerWidth,h:window.innerHeight,screen_w:screen.width,screen_h:screen.height,dpr:window.devicePixelRatio||1,lang:navigator.language||'',tz:Intl.DateTimeFormat().resolvedOptions().timeZone||'',touch:navigator.maxTouchPoints||0};
function track(name,data){try{const body=JSON.stringify({name,session:SID,seconds:Math.round((Date.now()-T0)/1000),game_day:amsterdamDay(),event_version:2,data:{...(data||{})}});fetch(SB_URL+'/rest/v1/events',{method:'POST',keepalive:true,headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body}).catch(()=>{})}catch{}}
track('view',{ref:(document.referrer||'').slice(0,120),path:location.pathname,...DEVICE});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&Date.now()-lastBeat>5000){lastBeat=Date.now();track('leave',{reason:'hidden'})}});
window.addEventListener('pagehide',()=>track('leave',{reason:'pagehide'}));"""
rep(old, new, 'reliable analytics transport')

old = """const FAME_PTS={5:4,4:8,3:16,2:64,1:100};
const slug=t=>norm(t).replace(/ /g,'-').slice(0,120)||('q'+Date.now());
const toGame=b=>({id:b._id,prompt:b.prompt,sub:b.subtitle||'',by:b.by||'',clash:b.clash_note||'',answers:(b.answers||[]).map(a=>({name:a.name,aliases:a.aliases||[],detail:a.detail||'',pts:FAME_PTS[a.fame]||16}))});
function hashStr(t){let h=2166136261;for(const c of t){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function todaysSet(bank){const day=Math.floor(Date.now()/864e5);const srt=l=>[...l].sort((a,b)=>hashStr(a._id)-hashStr(b._id)||a._id.localeCompare(b._id));
 const by=d=>srt(bank.filter(b=>(b.difficulty||'hard')===d));const E=by('easy'),M=by('medium'),H=by('hard');
 if(E.length<2||M.length<2||!H.length){const list=srt(bank),n=list.length,off=(day*5)%n,out=[];for(let i=0;i<Math.min(5,n);i++)out.push(list[(off+i)%n]);return out}
 const pick=(l,i)=>l[((i%l.length)+l.length)%l.length];return[pick(E,day*2),pick(M,day*2),pick(E,day*2+1),pick(M,day)]}"""
# The live file has the fifth hard pick in the return. Use an exact second variant if needed.
if old not in s:
    old = """const FAME_PTS={5:4,4:8,3:16,2:64,1:100};
const slug=t=>norm(t).replace(/ /g,'-').slice(0,120)||('q'+Date.now());
const toGame=b=>({id:b._id,prompt:b.prompt,sub:b.subtitle||'',by:b.by||'',clash:b.clash_note||'',answers:(b.answers||[]).map(a=>({name:a.name,aliases:a.aliases||[],detail:a.detail||'',pts:FAME_PTS[a.fame]||16}))});
function hashStr(t){let h=2166136261;for(const c of t){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function todaysSet(bank){const day=Math.floor(Date.now()/864e5);const srt=l=>[...l].sort((a,b)=>hashStr(a._id)-hashStr(b._id)||a._id.localeCompare(b._id));
 const by=d=>srt(bank.filter(b=>(b.difficulty||'hard')===d));const E=by('easy'),M=by('medium'),H=by('hard');
 if(E.length<2||M.length<2||!H.length){const list=srt(bank),n=list.length,off=(day*5)%n,out=[];for(let i=0;i<Math.min(5,n);i++)out.push(list[(off+i)%n]);return out}
 const pick=(l,i)=>l[((i%l.length)+l.length)%l.length];return[pick(E,day*2),pick(M,day*2),pick(E,day*2+1),pick(M,day*2+1),pick(H,day)]}"""
new = """const FAME_PTS_V1={5:4,4:8,3:16,2:64,1:100},FAME_PTS_V2={6:4,5:8,4:16,3:32,2:64,1:100};
const famePoints=(q,f)=>((q?.scoring_version||1)>=2?FAME_PTS_V2:FAME_PTS_V1)[f]||16;
const slug=t=>norm(t).replace(/ /g,'-').slice(0,120)||('q'+Date.now());
const toGame=b=>({id:b._id,prompt:b.prompt,sub:b.subtitle||'',by:b.by||'',clash:b.clash_note||'',difficulty:b.difficulty||'unknown',scoring_version:b.scoring_version||1,answers:(b.answers||[]).map(a=>({name:a.name,aliases:a.aliases||[],detail:a.detail||'',pts:famePoints(b,a.fame)}))});
function hashStr(t){let h=2166136261;for(const c of t){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function gameDayNumber(){const [y,m,d]=amsterdamDay().split('-').map(Number);return Math.floor(Date.UTC(y,m-1,d)/864e5)}
function todaysSet(bank){const day=gameDayNumber();const srt=l=>[...l].sort((a,b)=>hashStr(a._id)-hashStr(b._id)||a._id.localeCompare(b._id));
 const E=srt(bank.filter(b=>(b.difficulty||'hard')==='easy')),M=srt(bank.filter(b=>(b.difficulty||'hard')==='medium'));
 if(E.length<4||M.length<1){const list=srt([...E,...M]),n=list.length;if(!n)return[];const off=(day*5)%n,out=[];for(let i=0;i<Math.min(5,n);i++)out.push(list[(off+i)%n]);return out}
 const pick=(l,i)=>l[((i%l.length)+l.length)%l.length];return[pick(E,day*4),pick(E,day*4+1),pick(M,day),pick(E,day*4+2),pick(E,day*4+3)]}"""
rep(old, new, 'six-tier scoring and 4E1M daily')

s = s.replace("${esc(tierName(FAME_PTS[a.fame]||16))}", "${esc(tierName(famePoints(b,a.fame)))}")
s = s.replace("${[1,2,3,4,5].map(v=>`<option value=\"${v}\">fame ${v} · ${tierName(FAME_PTS[v])}</option>`).join('')}", "${[1,2,3,4,5,6].map(v=>`<option value=\"${v}\">fame ${v} · ${tierName(FAME_PTS_V2[v]||FAME_PTS_V1[v]||16)}</option>`).join('')}")
s = s.replace("const q={...x,_id:id,approved:old?.approved||false};", "const q={...x,scoring_version:x.scoring_version||2,_id:id,approved:old?.approved||false};")

old = """  const j=await r.json();if(!r.ok||!j.access_token)throw new Error(j.error_description||j.msg||'Login failed');
  SB_TOKEN=j.access_token;try{sessionStorage.setItem('uc-admin-token',SB_TOKEN)}catch{}document.getElementById('dlg-login').close();openAdmin()}"""
new = """  const j=await r.json();if(!r.ok||!j.access_token)throw new Error(j.error_description||j.msg||'Login failed');
  saveAuth(j);document.getElementById('dlg-login').close();openAdmin()}"""
rep(old, new, 'login refresh storage')
rep("function adminRoute(){if(location.hash==='#admin'){if(SB_TOKEN)openAdmin().catch(()=>{SB_TOKEN=null;document.getElementById('dlg-login').showModal()});else document.getElementById('dlg-login').showModal()}}", "function adminRoute(){if(location.hash==='#admin'){if(SB_TOKEN)openAdmin().catch(()=>{clearAuth();document.getElementById('dlg-login').showModal()});else document.getElementById('dlg-login').showModal()}}", 'admin session fallback')

p.write_text(s, encoding='utf-8')
print('Unicorner analytics/auth/scoring upgrade applied')
