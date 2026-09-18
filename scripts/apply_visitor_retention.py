from pathlib import Path

index_path = Path('index.html')
s = index_path.read_text(encoding='utf-8')

# Persistent anonymous visitor ID. Stored only in first-party localStorage.
if "const VISITOR=" not in s:
    marker = "const SID=(()=>{try{let v=sessionStorage.getItem('uc-sid');if(!v){v=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('uc-sid',v)}return v}catch{return 'anon'}})();"
    replacement = """function newVisitorId(){try{if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();if(globalThis.crypto?.getRandomValues){const a=new Uint8Array(16);globalThis.crypto.getRandomValues(a);return 'v_'+[...a].map(x=>x.toString(16).padStart(2,'0')).join('')}}catch{}return 'v_'+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)}
const VISITOR=(()=>{try{let v=localStorage.getItem('uc-visitor');if(!v){v=newVisitorId();localStorage.setItem('uc-visitor',v)}return v}catch{return newVisitorId()}})();
const SID=(()=>{try{let v=sessionStorage.getItem('uc-sid');if(!v){v=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('uc-sid',v)}return v}catch{return 'anon'}})();"""
    if marker not in s:
        raise SystemExit('Could not locate session analytics marker')
    s = s.replace(marker, replacement, 1)

old_track = "JSON.stringify({name,session:SID,seconds:Math.round((Date.now()-T0)/1000),game_day:amsterdamDay(),event_version:2,data:{...(data||{})}})"
new_track = "JSON.stringify({name,session:SID,visitor:VISITOR,seconds:Math.round((Date.now()-T0)/1000),game_day:amsterdamDay(),event_version:2,data:{...(data||{})}})"
if new_track not in s:
    if old_track not in s:
        raise SystemExit('Could not locate analytics payload')
    s = s.replace(old_track, new_track, 1)

start = s.find('async function loadStats(){')
end_marker = "\ndocument.getElementById('stats-range').onchange=loadStats;"
end = s.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit('Could not locate Stats loader')

new_stats = r'''async function loadStats(){const el=document.getElementById('stats-body');el.innerHTML='<p class="mute">Loading…</p>';
 const days=+document.getElementById('stats-range').value;const since=new Date(Date.now()-days*864e5).toISOString();
 try{const [rows,allPlays]=await Promise.all([
   sb('/rest/v1/events?select=name,session,visitor,seconds,data,game_day,created_at&created_at=gte.'+encodeURIComponent(since)+'&order=created_at.desc&limit=20000'),
   sb('/rest/v1/events?select=visitor,game_day,created_at&name=eq.game_start&visitor=not.is.null&order=created_at.asc&limit=50000')
  ]);
  const sess=new Map();for(const r of rows){const k=r.session;if(!k)continue;const o=sess.get(k)||{sec:0,names:new Set()};o.sec=Math.max(o.sec,r.seconds||0);o.names.add(r.name);sess.set(k,o)}
  const S=[...sess.values()];const n=S.length||1;
  const cnt=nm=>rows.filter(r=>r.name===nm).length;
  const started=S.filter(o=>o.names.has('game_start')).length,finished=S.filter(o=>o.names.has('game_finish')).length;
  const med=(()=>{const a=S.map(o=>o.sec).sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:0})();
  const avg=Math.round(S.reduce((a,o)=>a+o.sec,0)/n);
  const bounce=Math.round(S.filter(o=>o.sec<10&&!o.names.has('game_start')).length/n*100);
  const scores=rows.filter(r=>r.name==='game_finish').map(r=>(r.data||{}).score).filter(v=>typeof v==='number');
  const fmt=x=>x>=60?Math.floor(x/60)+'m '+(x%60)+'s':x+'s';

  // Retention is based only on anonymous persistent visitor IDs and game starts.
  const plays=allPlays.filter(r=>r.visitor&&r.game_day&&r.created_at);
  const rangeStart=Date.parse(since),rangePlays=plays.filter(r=>Date.parse(r.created_at)>=rangeStart);
  const firstPlay=new Map();for(const r of plays){if(!firstPlay.has(r.visitor))firstPlay.set(r.visitor,r)}
  const activeVisitors=[...new Set(rangePlays.map(r=>r.visitor))];
  const newVisitors=activeVisitors.filter(v=>Date.parse(firstPlay.get(v).created_at)>=rangeStart).length;
  const returningVisitors=activeVisitors.length-newVisitors;
  const daysByVisitor=new Map();for(const r of rangePlays){let ds=daysByVisitor.get(r.visitor);if(!ds){ds=new Set();daysByVisitor.set(r.visitor,ds)}ds.add(r.game_day)}
  const averageDays=activeVisitors.length?[...daysByVisitor.values()].reduce((sum,ds)=>sum+ds.size,0)/activeVisitors.length:0;
  const addDay=d=>{const [y,m,dd]=d.split('-').map(Number),x=new Date(Date.UTC(y,m-1,dd)+864e5);return x.toISOString().slice(0,10)};
  const allVisitorDays=new Set(plays.map(r=>r.visitor+'|'+r.game_day));
  const today=amsterdamDay();
  const eligibleNew=[...firstPlay.entries()].filter(([,r])=>Date.parse(r.created_at)>=rangeStart&&r.game_day<today);
  const retainedD1=eligibleNew.filter(([v,r])=>allVisitorDays.has(v+'|'+addDay(r.game_day))).length;
  const d1=eligibleNew.length?Math.round(retainedD1/eligibleNew.length*100)+'%':'—';

  const byDay={};for(const r of rows){if(r.name!=='view')continue;const d=r.game_day||r.created_at.slice(0,10);byDay[d]=(byDay[d]||0)+1}
  const dayRows=Object.entries(byDay).sort().slice(-14);const mx=Math.max(1,...dayRows.map(d=>d[1]));
  el.innerHTML=`<div class="statgrid">
   ${[['Visits',cnt('view')],['Sessions',S.length],['New visitors',newVisitors],['Returning visitors',returningVisitors],
      ['Day-1 retention',d1],['Avg days played / visitor',activeVisitors.length?averageDays.toFixed(1):'—'],
      ['Games started',started],['Games finished',finished],['Finish rate',started?Math.round(finished/started*100)+'%':'—'],['Infinite clicks',cnt('infinite_click')],
      ['Median time on site',fmt(med)],['Average time',fmt(avg)],['Bounced',bounce+'%'],
      ['Average score',scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):'—'],['Messages sent',cnt('form_submit')]]
     .map(([k,v])=>`<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('')}</div>
   <p class="mute" style="font-size:12px;margin:10px 0 0">Visitor metrics use the anonymous random <code>uc-visitor</code> browser ID. Older events without this ID are excluded.</p>
   <h3 style="margin:18px 0 6px">Visits per day</h3>
   <div class="bars">${dayRows.map(([d,v])=>`<div class="barrow"><span>${d.slice(5)}</span><i style="width:${Math.round(v/mx*100)}%"></i><b>${v}</b></div>`).join('')||'<p class="mute">No data yet.</p>'}</div>`}
 catch(e){el.innerHTML='<p class="msg bad">Could not load: '+esc(e.message)+'</p>'}}'''
s = s[:start] + new_stats + s[end:]

assert "localStorage.getItem('uc-visitor')" in s
assert 'visitor:VISITOR' in s
assert "['New visitors',newVisitors]" in s
assert "['Returning visitors',returningVisitors]" in s
assert "['Day-1 retention',d1]" in s
assert "['Avg days played / visitor'" in s
index_path.write_text(s, encoding='utf-8')

# Keep the privacy page accurate about the first-party retention identifier.
privacy_path = Path('privacy.html')
if privacy_path.exists():
    p = privacy_path.read_text(encoding='utf-8')
    p = p.replace(
        'referrer/path and a random session identifier. We do not intentionally store names, email addresses or the raw text of incorrect answers in analytics events.',
        'referrer/path, a random session identifier and a random persistent visitor identifier used to measure return visits and retention. We do not intentionally store names, email addresses or the raw text of incorrect answers in analytics events.'
    )
    p = p.replace(
        'We use browser local storage and session storage for core functionality such as remembering daily game state, preventing accidental repeat play and maintaining a temporary session identifier. We therefore do not currently show a cookie-consent banner. If we add non-essential tracking later, we will update this policy and consent flow.',
        'We use browser local storage and session storage for game state and analytics. A random first-party visitor identifier is stored in local storage so we can count new and returning players and measure retention across days. It is not linked to a name or email and is not used for advertising or cross-site tracking. We also keep a temporary session identifier in session storage.'
    )
    privacy_path.write_text(p, encoding='utf-8')

print('Applied persistent visitor analytics and retention stats')
