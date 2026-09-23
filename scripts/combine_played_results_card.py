from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

css_marker = '/* expandable played results card */'
if css_marker not in s:
    css = '''
/* expandable played results card */
.played-results-box{padding:0!important;overflow:hidden}
.played-results-summary{display:block!important;list-style:none!important;padding:16px 18px!important;color:var(--ink)!important;cursor:pointer}
.played-results-summary::-webkit-details-marker{display:none}
.played-results-summary::marker{content:''}
.played-results-toggle{margin-top:14px;padding-top:10px;border-top:2px solid rgba(255,255,255,.24);display:flex;align-items:center;justify-content:space-between;gap:12px;color:#fff;font-family:var(--lab);font-size:14px;text-transform:uppercase;letter-spacing:.4px}
.played-results-toggle .played-results-arrow{font-size:22px;line-height:1;transition:transform .2s ease;transform-origin:center}
.played-results-box[open] .played-results-arrow{transform:rotate(180deg)}
.played-results-body{padding:0 18px 16px;border-top:2px solid rgba(255,255,255,.18)}
.played-results-hint{margin:14px 0 4px!important}
.played-results-body .res{animation:none!important}
@media (max-width:640px){.played-results-summary{padding:14px!important}.played-results-body{padding:0 14px 14px}.played-results-toggle{font-size:13px}}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

helper_marker = 'function landingResultsMarkup(p)'
if helper_marker not in s:
    helper = '''
function landingResultsMarkup(p){
 const picks=Array.isArray(p?.picks)?p.picks:[],byPos=new Map();
 picks.forEach(row=>{const i=Number(row?.[0]),name=row?.[1]||null;if(Number.isInteger(i)&&i>=0&&i<Q.length&&!byPos.has(i))byPos.set(i,name)});
 return Q.map((q,ri)=>{const savedName=byPos.get(ri)||null,ans=savedName?q.answers.find(a=>a.name===savedName)||null:null,pts=ans?ans.pts:0,all=[...q.answers].sort((a,b)=>b.pts-a.pts||a.name.localeCompare(b.name));return`<details class="res landing-res" style="--i:${ri}"><summary><span><b>${q.prompt}</b><br><span class="rtier" style="color:${ans?TCOL[pts]:'#ff8a7a'}">${ans?ans.name+' · '+(pts===100?'SCREAMER!!!':tierName(pts)):'Stinker'}</span></span><span class="plus">+${pts}</span></summary><p class="mute" style="margin:8px 0 0">${q.answers.length} answers</p><ul class="ans">${all.map(a=>`<li class="${a===ans?'you':''}" style="--tc:${TCOL[a.pts]}"><span class="an">${a.name}${a===ans?' ★':''}</span><span class="tchip">${tierName(a.pts)}</span></li>`).join('')}</ul></details>`}).join('');
}
'''
    anchor = 'function start(){document.body.classList.remove(\'playing\');'
    if anchor not in s:
        raise SystemExit('Could not find landing start function')
    s = s.replace(anchor, helper + anchor, 1)

if 'class="played-box played-results-box"' not in s:
    pattern = re.compile(r'''\$\{played\?`<div class="played-box">.*?<button class="ghost" id="go">See today's results</button></div>`\s*:``''', re.S)
    replacement = '''${played?`<details class="played-box played-results-box">
    <summary class="played-results-summary">
      <div class="mute">You've played today</div>
      <div class="played-home-stats"><div class="played-home-stat"><span>Score</span><b>${played.score}<small>/${MAX}</small></b></div><div class="played-home-stat"><span>Streak</span><b>🔥 ${currentStreak()}<small>day${currentStreak()===1?'':'s'}</small></b></div></div>
      <div class="mute">${zoneOf(played.score)} · next game in <b style="color:var(--ink)">${untilMidnight()}</b></div>
      <div class="played-results-toggle"><span>Today's results</span><span class="played-results-arrow" aria-hidden="true">⌄</span></div>
    </summary>
    <div class="played-results-body"><p class="mute played-results-hint">Tap a question to see every answer</p>${landingResultsMarkup(played)}</div>
   </details>
   <p class="inf-pitch">Want more? Play as many rounds as you like, whenever you like.</p>
   <div class="row"><button class="cta" data-infinite>∞ Unlock Infinite mode</button></div>`
   :`'''
    s, count = pattern.subn(replacement, s, count=1)
    if count != 1:
        raise SystemExit('Could not replace played landing summary/results button')

old_handler = "  document.getElementById('go').onclick=play;const g2=document.getElementById('go2');if(g2)g2.onclick=play;"
new_handler = "  const go=document.getElementById('go');if(go)go.onclick=play;const g2=document.getElementById('go2');if(g2)g2.onclick=play;"
if old_handler in s:
    s = s.replace(old_handler, new_handler, 1)
elif new_handler not in s:
    raise SystemExit('Could not make landing play button handler optional')

if "See today's results" in s:
    raise SystemExit('Separate played results button still remains')

p.write_text(s, encoding='utf-8')
print('Played summary and results combined into one expandable landing card')
