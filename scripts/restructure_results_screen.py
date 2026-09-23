from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

css_marker = '/* social-first result screen */'
if css_marker not in s:
    css = r'''
/* social-first result screen */
.result-screen .result-share-row{margin:14px 0 24px}
.result-screen .result-share-row .cta{width:100%;justify-content:center;font-size:20px;padding:14px 18px}
.result-screen .result-share-note{text-align:center;margin:7px 0 0;font-size:13px}
.result-section{margin-top:22px}
.result-section-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:10px}
.result-section-head h2{margin:0;font-size:27px}
.result-section-head p{margin:0;text-align:right;font-size:12px}
.result-list{display:grid;gap:10px}
.result-screen details.result-item{margin:0!important;padding:0 13px!important;border:2px solid rgba(255,255,255,.22)!important;border-radius:8px!important;background:#140c38!important;box-shadow:none!important}
.result-screen details.result-item summary{padding:12px 0!important;align-items:center!important;border:0!important}
.result-screen .result-item-copy{display:grid;gap:2px;min-width:0}
.result-screen .result-item-copy small{font-family:var(--lab);font-size:12px;line-height:1.25;color:var(--mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.result-screen .result-item-copy b{font-family:var(--px);font-size:19px;line-height:1.15;color:#fff}
.result-screen .result-item-copy em{font-family:var(--lab);font-style:normal;font-size:12px;text-transform:uppercase;letter-spacing:.4px}
.result-verdict{flex:none;display:flex;align-items:center;gap:7px;font-family:var(--px);font-size:18px}
.result-verdict.ok{color:#7fe0a8}.result-verdict.miss{color:#ff8a7a}
.result-screen .result-item ul.ans{margin-bottom:10px}
.result-nearly{margin-top:24px;padding:16px;border:2px solid rgba(255,138,122,.55);border-radius:9px;background:rgba(70,18,45,.55)}
.result-nearly .result-section{margin-top:0}
.result-progress{margin-top:24px;padding:18px;border:3px solid #fff;border-radius:10px;background:linear-gradient(180deg,#1f5fd6,#163f9a);box-shadow:0 0 0 3px #000,8px 8px 0 rgba(0,0,0,.35)}
.result-progress-top{display:flex;align-items:end;justify-content:space-between;gap:12px}
.result-progress-top span{font-family:var(--lab);color:#d6ccff;text-transform:uppercase;font-size:12px}
.result-progress-top b{font-family:var(--px);font-size:34px;line-height:1;color:#fff}.result-progress-top small{font-size:17px;color:#d6ccff}
.result-progress-bar{height:12px;margin:12px 0;background:#0e2a66;border:2px solid #000;border-radius:4px;overflow:hidden}
.result-progress-bar i{display:block;height:100%;background:linear-gradient(90deg,#7fe0a8,#f2c230)}
.result-progress-goal{margin:0;font-family:var(--px);font-size:18px}.result-progress-return{margin:7px 0 0;color:#d6ccff}
.result-home-row{margin-top:18px!important;justify-content:center}.result-home-row .ghost{min-width:180px}
@media (max-width:640px){
 .result-section-head{display:block}.result-section-head p{text-align:left;margin-top:4px}
 .result-screen .result-item-copy small{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
 .result-progress{padding:15px}.result-home-row .ghost{width:100%}
}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

js_marker = '/* result screen social loop */'
if js_marker not in s:
    new_end = r'''/* result screen social loop */
function end(restored){
 document.body.classList.remove('playing');
 if(!restored)track('game_finish',{score,question_count:Q.length,correct:results.filter(r=>r.ans).length,missed:results.filter(r=>!r.ans).length,screamers:results.filter(r=>r.pts===100).length,tiers:results.map(r=>r.pts),set_id:dailySetId()});
 fillReport();
 if(!restored){setPlayed({score,picks:results.map(r=>[Q.indexOf(r.q),r.ans?r.ans.name:null,r.pts])});submitScore(score)}
 setTimeout(()=>renderDist(score),restored?900:1600);
 const rows=results.map((r,ri)=>r?{...r,ri}:null).filter(Boolean);
 const hits=rows.filter(r=>r.ans).sort((a,b)=>b.pts-a.pts||a.ri-b.ri);
 const misses=rows.filter(r=>!r.ans);
 const scoreGrid=rows.map(r=>r.pts?['🟫','🟩','🟦','🟪','🟧','🟨'][TIERS.findIndex(t=>t[0]===r.pts)]:'⬛').join('');
 const nextZone=ZONES.find(([f])=>score/MAX<f);
 const toNext=nextZone?Math.max(0,Math.ceil(nextZone[0]*MAX-score)):0;
 const resultItem=(r,miss=false)=>{const all=[...r.q.answers].sort((a,b)=>b.pts-a.pts||a.name.localeCompare(b.name));const label=miss?'Stinker':(r.pts===100?'SCREAMER!!!':tierName(r.pts));const color=miss?'#ff8a7a':TCOL[r.pts];return`<details class="res result-item ${miss?'result-miss':'result-hit'}"><summary><span class="result-item-copy"><small>${r.q.prompt}</small><b>${miss?'No answer':r.ans.name}</b><em style="color:${color}">${label}</em></span><span class="result-verdict ${miss?'miss':'ok'}">${miss?'✕':'✓'} <b>+${r.pts}</b></span></summary><p class="mute" style="margin:8px 0 0">${r.q.answers.length} valid answers</p><ul class="ans">${all.map(a=>`<li class="${a===r.ans?'you':''}" style="--tc:${TCOL[a.pts]}"><span class="an">${a.name}${a===r.ans?' ★':''}</span><span class="tchip">${tierName(a.pts)}</span></li>`).join('')}</ul><p style="margin:10px 0;font-size:14px" class="mute">Think we missed one? <button class="linkish" data-open="dlg-report" data-q="${r.ri}">Tell us</button></p></details>`};
 const shareText=()=>{const pct=document.getElementById('pctn');const rank=pct?`\nBetter than ${pct.textContent}% of players`:'';return`🦄 Unicorner — ${score}/${MAX}\nReached: ${zoneOf(score)}${rank}\n${scoreGrid}\nCan you beat me?`};
 swap(`<div class="card result-screen">
  <div class="hero"><div class="sprite big-sprite bob" data-mood="${results.some(r=>r.pts===100)?'scream':score/MAX>=.44?'wow':score/MAX>=.15?'happy':'sad'}"></div><div><div class="mute">Final whistle</div><div class="tier" id="fs">0</div></div></div>
  <div class="pts">You reached: ${zoneOf(score)}</div>
  <div class="dist" id="dist"><div class="mute">Comparing with today's players…</div></div>
  <div class="result-share-row"><button class="cta" id="share-result">Share result</button><p class="mute result-share-note">Challenge a mate while the result is fresh.</p></div>
  ${hits.length?`<section class="result-section"><div class="result-section-head"><h2>Your match highlights</h2><p class="mute">Best answers first</p></div><div class="result-list">${hits.map(r=>resultItem(r,false)).join('')}</div></section>`:''}
  ${misses.length?`<div class="result-nearly"><section class="result-section"><div class="result-section-head"><h2>Nearly had it</h2><p class="mute">${misses.length===1?'1 answer':misses.length+' answers'} to learn for tomorrow</p></div><div class="result-list">${misses.map(r=>resultItem(r,true)).join('')}</div></section></div>`:''}
  <section class="result-progress"><div class="result-progress-top"><span>Unicorner progress</span><b>${score}<small>/${MAX}</small></b></div><div class="result-progress-bar"><i style="width:${Math.min(100,Math.round(score/MAX*100))}%"></i></div><p class="result-progress-goal">${nextZone?`${toNext} points from ${nextZone[1]}`:"Ballon d'Or reached"}</p><p class="result-progress-return">Return tomorrow to climb the ladder · next game in <b style="color:#fff">${untilMidnight()}</b></p></section>
  <div class="row result-home-row"><button class="ghost" id="home">Back to home</button></div>
 </div>`,()=>{
  setTimeout(()=>countUp(document.getElementById('fs'),score,2000),400);
  document.getElementById('share-result').onclick=async e=>{const share=shareText();track('share_click',{score,set_id:dailySetId(),native_share:!!navigator.share});const copyP=navigator.clipboard?.writeText?navigator.clipboard.writeText(share).then(()=>true).catch(()=>false):Promise.resolve(false);if(navigator.share){try{await navigator.share({title:'Unicorner',text:share});const copied=await copyP;e.target.textContent=copied?'Shared + copied':'Shared';return}catch(err){const copied=await copyP;if(err?.name==='AbortError'){e.target.textContent=copied?'Copied':'Share';return}e.target.textContent=copied?'Copied':'Share failed';return}}const copied=await copyP;e.target.textContent=copied?'Copied':'Copy failed'};
  document.getElementById('home').onclick=()=>{track('home_click',{from:'results',score,set_id:dailySetId()});window.scrollTo({top:0,behavior:'smooth'});start()};
 })}
'''
    pattern = re.compile(r'function end\(restored\)\{.*?\}\)}\n\n// ---- community forms', re.S)
    s, count = pattern.subn(new_end + '\n// ---- community forms', s, count=1)
    if count != 1:
        raise SystemExit('Could not replace existing result screen function')

# Keep already-patched result screens in sync when this script runs again.
s = s.replace("${misses.length} ${misses.length===1?'one':'answers'} to learn for tomorrow", "${misses.length===1?'1 answer':misses.length+' answers'} to learn for tomorrow")

p.write_text(s, encoding='utf-8')
print('Result screen reordered around achievement, sharing, highlights, misses, and progression')
