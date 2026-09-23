from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

css_marker = '/* played result launch card */'
if css_marker not in s:
    css = '''
/* played result launch card */
.played-result-card{position:relative;overflow:hidden;padding:18px!important;text-align:left!important;background:linear-gradient(145deg,#2a176f 0%,#181046 58%,#0d1739 100%)!important;border:3px solid #fff!important;border-radius:10px!important;box-shadow:0 0 0 3px #000,8px 8px 0 rgba(0,0,0,.35)!important}
.played-result-card:before{content:'';position:absolute;left:0;right:0;top:0;height:5px;background:linear-gradient(90deg,#7fe0a8,#b48cff,#ff7ac8,#f2c230)}
.played-result-kicker{margin:2px 0 12px;color:var(--gold);font-family:var(--lab);font-size:13px;font-weight:700;letter-spacing:.6px;text-transform:uppercase}
.played-result-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,.85fr);gap:12px}
.played-result-score,.played-result-streak{min-width:0;padding:14px;border:2px solid rgba(255,255,255,.2);border-radius:8px;background:rgba(5,8,28,.42)}
.played-result-score>span,.played-result-streak>span{display:block;color:#d6ccff;font-family:var(--lab);font-size:12px;text-transform:uppercase;letter-spacing:.5px}
.played-result-score>b{display:block;margin-top:2px;color:#fff;font-family:var(--px);font-size:54px;line-height:.95;letter-spacing:.5px}
.played-result-score>b small{margin-left:4px;color:#d6ccff;font-size:20px}
.played-result-score>em{display:block;margin-top:8px;color:var(--gold);font-family:var(--lab);font-size:14px;font-style:normal;font-weight:700}
.played-result-streak{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.played-result-streak>b{display:flex;align-items:center;gap:7px;margin-top:5px;color:#fff;font-family:var(--px);font-size:40px;line-height:1}
.played-result-streak>b i{font-family:system-ui,sans-serif;font-size:27px;font-style:normal}
.played-result-streak>small{margin-top:5px;color:#d6ccff;font-family:var(--lab);font-size:12px;text-transform:uppercase}
.played-result-cta{width:100%;margin-top:13px!important;padding:13px 16px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;background:var(--gold)!important;color:#16102f!important;border:2px solid #fff!important;box-shadow:0 3px 0 #000!important;text-align:left!important}
.played-result-cta>span{font-family:var(--px);font-size:20px;line-height:1}
.played-result-cta>small{font-family:var(--lab);font-size:12px;font-weight:700;text-transform:uppercase;white-space:nowrap}
.played-result-next{margin-top:10px;color:#d6ccff;font-size:13px;text-align:center}.played-result-next b{color:#fff}
@media (max-width:560px){.played-result-card{padding:15px!important}.played-result-grid{grid-template-columns:minmax(0,1fr) 108px;gap:9px}.played-result-score,.played-result-streak{padding:12px}.played-result-score>b{font-size:46px}.played-result-score>b small{font-size:17px}.played-result-streak>b{font-size:34px}.played-result-cta{display:block!important;text-align:center!important}.played-result-cta>small{display:block;margin-top:4px;white-space:normal}}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

# The landing page is now only a launch point for the full results screen.
helper_pattern = re.compile(r'\nfunction landingResultsMarkup\(p\)\{.*?\n\}\n(?=function start\(\))', re.S)
s = helper_pattern.sub('\n', s, count=1)

new_markup = '''${played?`<div class="played-box played-result-card">
    <div class="played-result-kicker">Today's final whistle</div>
    <div class="played-result-grid">
      <div class="played-result-score"><span>Score</span><b>${played.score}<small>/${MAX}</small></b><em>${zoneOf(played.score)}</em></div>
      <div class="played-result-streak"><span>Streak</span><b><i>🔥</i>${currentStreak()}</b><small>day${currentStreak()===1?'':'s'}</small></div>
    </div>
    <button type="button" class="cta played-result-cta" id="go"><span>View today's result</span><small>Score, rank & answers →</small></button>
    <div class="played-result-next">Next daily game in <b>${untilMidnight()}</b></div>
   </div>
   <p class="inf-pitch">Want more? Play as many rounds as you like, whenever you like.</p>
   <div class="row"><button class="cta" data-infinite>∞ Unlock Infinite mode</button></div>`
   :'''

if 'class="played-box played-result-card"' not in s:
    old_details = re.compile(r'''\$\{played\?`<details class="played-box played-results-box">.*?<div class="row"><button class="cta" data-infinite>∞ Unlock Infinite mode</button></div>`\s*:''', re.S)
    s, count = old_details.subn(new_markup, s, count=1)
    if count != 1:
        old_simple = re.compile(r'''\$\{played\?`<div class="played-box">.*?<button class="ghost" id="go">See today's results</button></div>`\s*:''', re.S)
        s, count = old_simple.subn(new_markup, s, count=1)
    if count != 1:
        raise SystemExit('Could not replace played landing summary with result launch card')

old_handler = "  document.getElementById('go').onclick=play;const g2=document.getElementById('go2');if(g2)g2.onclick=play;"
new_handler = "  const go=document.getElementById('go');if(go)go.onclick=play;const g2=document.getElementById('go2');if(g2)g2.onclick=play;"
if old_handler in s:
    s = s.replace(old_handler, new_handler, 1)
elif new_handler not in s:
    raise SystemExit('Could not make landing results button handler optional')

# Remove the old in-card expansion-only handler if it is still present.
s = re.sub(r"\n\s*const backHome=document\.querySelector\('\.played-results-home'\);if\(backHome\)backHome\.onclick=.*?\};", '', s, count=1)

if '<details class="played-box played-results-box">' in s:
    raise SystemExit('Played result still expands on the landing page')
if 'class="played-box played-result-card"' not in s or 'id="go"' not in s:
    raise SystemExit('Played result launch card is missing')

p.write_text(s, encoding='utf-8')
print('Played summary redesigned as a direct launch card for the full results screen')
