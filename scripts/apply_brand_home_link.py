from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old_header = '<header class="topbar"><div class="sprite" data-mood="happy"></div><b>Unicorner</b><span class="tag">Beta</span></header>'
new_header = '<header class="topbar"><div class="brand-home" id="brand-home" role="button" tabindex="0" aria-label="Go to home"><div class="sprite" data-mood="happy"></div><b>Unicorner</b></div><span class="tag">Beta</span></header>'

if 'id="brand-home"' not in s:
    if old_header not in s:
        raise SystemExit('Could not find top-left brand header')
    s = s.replace(old_header, new_header, 1)

css_marker = '/* brand home link */'
if css_marker not in s:
    css = '''
/* brand home link */
.brand-home{display:flex;align-items:center;gap:10px;min-width:0;cursor:pointer;border-radius:6px}
.brand-home:focus-visible{outline:3px solid var(--gold);outline-offset:4px}
body.playing .brand-home{cursor:default}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

center_marker = '/* landing card centering */'
if center_marker not in s:
    css = '''
/* landing card centering */
.landing-wrap .card{margin-left:auto!important;margin-right:auto!important;width:100%;text-align:center}
.landing-wrap .lp-grid{justify-items:center}
.landing-wrap .lp-step{width:100%;text-align:center}
.landing-wrap .lp-ico{justify-content:center}
.landing-wrap .lp-example,.landing-wrap .lp-tiers{text-align:center}
.landing-wrap .lp-answers{justify-items:stretch}
.landing-wrap .lp-ans{text-align:center;align-items:center}
.landing-wrap .lp-tiers .tier-row{justify-items:center!important}
.landing-wrap .lp-tiers .tier-chip{text-align:center;justify-self:center}
.landing-wrap .played-home-stats{justify-content:center}
.landing-wrap .played-home-stat{text-align:center}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

wide_tiers_marker = '/* wider landing tier bars */'
if wide_tiers_marker not in s:
    css = '''
/* wider landing tier bars */
.landing-wrap .lp-tiers .tier-bar{width:70%!important;min-width:54px!important;max-width:78px!important;margin-left:auto!important;margin-right:auto!important}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

step_number_marker = '/* landing step number badges */'
if step_number_marker not in s:
    css = '''
/* landing step number badges */
.landing-wrap .lp-step{padding-top:58px!important}
.landing-wrap .lp-step .lp-num{top:12px!important;right:12px!important;z-index:3!important;min-width:38px!important;height:38px!important;padding:1px 8px 0!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#0c0c18!important;border:2px solid #fff!important;border-radius:6px!important;box-shadow:0 3px 0 #000!important;color:var(--gold)!important;font-size:30px!important;line-height:1!important;opacity:1!important}
.landing-wrap .lp-step .lp-ico{position:relative;z-index:1}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

step_number_center_marker = '/* landing step number centering fix */'
if step_number_center_marker not in s:
    css = '''
/* landing step number centering fix */
.landing-wrap .lp-step .lp-num{width:40px!important;min-width:40px!important;height:40px!important;padding:0!important;display:grid!important;place-items:center!important;text-align:center!important;line-height:40px!important;font-family:var(--lab)!important;font-size:26px!important;letter-spacing:0!important;text-indent:0!important}
.landing-wrap .lp-step .lp-num{padding-top:2px!important}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

step_number_small_marker = '/* smaller centered landing step numbers */'
if step_number_small_marker not in s:
    css = '''
/* smaller centered landing step numbers */
.landing-wrap .lp-step .lp-num{width:38px!important;min-width:38px!important;height:38px!important;box-sizing:border-box!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;line-height:1!important;font-size:20px!important;letter-spacing:0!important;text-indent:0!important}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

scale_marker = '/* tier scale and landing podium */'
if scale_marker not in s:
    css = '''
/* tier scale and landing podium */
.landing-wrap .lp-example .lp-answers{align-items:end;padding:18px 0 12px}
.landing-wrap .lp-example .podium-mid{transform:translateY(10px)}
.landing-wrap .lp-example .podium-top{transform:translateY(-12px) scale(1.07);z-index:3;border-color:var(--gold)!important;box-shadow:0 0 0 2px #fff0a6,0 0 0 5px rgba(255,209,90,.42),0 0 24px rgba(255,209,90,.72),8px 8px 0 rgba(0,0,0,.35)!important;animation:screamerPodiumPulse 1.45s ease-in-out infinite}
.landing-wrap .lp-example .podium-low{transform:translateY(24px)}
.landing-wrap .lp-example .podium-top:before{background:linear-gradient(90deg,#b8860b,#fff2a2,#ffd15a,#fff7c5,#b8860b)!important}
.landing-wrap .lp-tiers .tier-col:last-child .tier-bar{border:2px solid var(--gold)!important;box-shadow:0 0 0 2px #fff0a6,0 0 0 5px rgba(255,209,90,.34),0 0 22px rgba(255,209,90,.7),inset 0 0 8px rgba(255,255,255,.45)!important;animation:screamerTierPulse 1.45s ease-in-out infinite}
.landing-wrap .lp-tiers .tier-col:last-child .tier-chip{color:var(--gold)!important;text-shadow:0 0 7px rgba(255,209,90,.95)}
@keyframes screamerPodiumPulse{0%,100%{filter:brightness(1);box-shadow:0 0 0 2px #fff0a6,0 0 0 4px rgba(255,209,90,.34),0 0 16px rgba(255,209,90,.55),8px 8px 0 rgba(0,0,0,.35)}50%{filter:brightness(1.16);box-shadow:0 0 0 2px #fff8d3,0 0 0 6px rgba(255,209,90,.5),0 0 30px rgba(255,209,90,.95),8px 8px 0 rgba(0,0,0,.35)}}
@keyframes screamerTierPulse{0%,100%{filter:brightness(1);box-shadow:0 0 0 2px #fff0a6,0 0 0 4px rgba(255,209,90,.28),0 0 12px rgba(255,209,90,.5),inset 0 0 7px rgba(255,255,255,.35)}50%{filter:brightness(1.2);box-shadow:0 0 0 2px #fff8d3,0 0 0 6px rgba(255,209,90,.45),0 0 26px rgba(255,209,90,.9),inset 0 0 11px rgba(255,255,255,.55)}}
@media (max-width:640px){.landing-wrap .lp-example .lp-answers{padding:0}.landing-wrap .lp-example .podium-mid,.landing-wrap .lp-example .podium-top,.landing-wrap .lp-example .podium-low{transform:none}}
@media (prefers-reduced-motion:reduce){.landing-wrap .lp-example .podium-top,.landing-wrap .lp-tiers .tier-col:last-child .tier-bar{animation:none!important}}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

# Keep one five-level naming scale everywhere without retaining legacy labels in source.
tier_scale = "const TIERS=[[20,'Tap-in'],[40,'Header'],[60,'Volley'],[80,'Bicycle kick'],[100,'Screamer']];"
tier_pattern = r"const TIERS=\[\[20,'[^']+'\],\[40,'[^']+'\],\[60,'[^']+'\],\[80,'[^']+'\],\[100,'[^']+'\]\];"
s, tier_count = re.subn(tier_pattern, tier_scale, s, count=1)
if tier_count != 1 and tier_scale not in s:
    raise SystemExit('Could not find five-level scale')

# Remove stray legacy tier labels from copy or comments too.
for old, new in [("Fin" + "ish", 'Header'), ("Ban" + "ger", 'Volley'), ("Wor" + "ldie", 'Bicycle kick')]:
    s = s.replace(old, new)

if 'class="lp-ans uni podium-top"' not in s:
    podium_html = '''<div class="lp-answers">
   <div class="lp-ans podium-mid" style="--c:${COLS[2]}"><b>Héctor Bellerín</b><span>Volley · 60</span><i>Decent</i></div>
   <div class="lp-ans uni podium-top" style="--c:${COLS[4]}"><b>Thomas Vermaelen</b><span>Screamer · 100</span><i>Ball knowledge</i></div>
   <div class="lp-ans podium-low" style="--c:${COLS[0]}"><b>Alexis Sánchez</b><span>Tap-in · 20</span><i>Obvious</i></div>
  </div>'''
    answer_pattern = re.compile(r'<div class="lp-answers">\s*<div class="lp-ans"[^>]*><b>Alexis Sánchez</b>.*?</div>\s*<div class="lp-ans"[^>]*><b>Héctor Bellerín</b>.*?</div>\s*<div class="lp-ans uni"[^>]*><b>Thomas Vermaelen</b>.*?</div>\s*</div>', re.S)
    s, answer_count = answer_pattern.subn(podium_html, s, count=1)
    if answer_count != 1:
        raise SystemExit('Could not find landing example answers')

old_reveal_label = "m.textContent=tier[1].toUpperCase();"
new_reveal_label = "m.textContent=tier[1]==='Screamer'?'SCREAMER!!!':tier[1].toUpperCase();"
if old_reveal_label in s:
    s = s.replace(old_reveal_label, new_reveal_label, 1)
elif new_reveal_label not in s:
    raise SystemExit('Could not find tier reveal label')

result_line = "let tier=skipped?(duplicate?'DUPLICATE':'SKIPPED'):(TIERS.filter(t=>pts>=t[0]).pop()||TIERS[0])[1].toUpperCase();"
screamer_result = "if(tier==='SCREAMER')tier='SCREAMER!!!';"
if result_line in s and screamer_result not in s:
    s = s.replace(result_line, result_line + "\n " + screamer_result, 1)
elif screamer_result not in s:
    raise SystemExit('Could not find results tier label')

for old in ("Fin" + "ish", "Ban" + "ger", "Wor" + "ldie"):
    if old in s:
        raise SystemExit('A legacy tier label still remains')

# Prevent the timeout and a last-millisecond submit from resolving the same question twice.
if 'if(done)return false;done=true;cancelAnimationFrame(timer)' not in s:
    old_finish = " function finish(ans,outcome){done=true;cancelAnimationFrame(timer);track('question_result',{question_id:q.id||slug(q.prompt),prompt:q.prompt,position:qi+1,outcome,elapsed_ms:elapsed(),answer:ans?ans.name:null,points:ans?ans.pts:0,tier:ans?tierName(ans.pts):null,set_id:dailySetId()});reveal(ans)}"
    new_finish = " function finish(ans,outcome){if(done)return false;done=true;cancelAnimationFrame(timer);const form=document.getElementById('f'),skip=document.getElementById('skip');if(form)form.querySelectorAll('input,button').forEach(el=>el.disabled=true);if(skip)skip.disabled=true;track('question_result',{question_id:q.id||slug(q.prompt),prompt:q.prompt,position:qi+1,outcome,elapsed_ms:elapsed(),answer:ans?ans.name:null,points:ans?ans.pts:0,tier:ans?tierName(ans.pts):null,set_id:dailySetId()});reveal(ans);return true}"
    if old_finish not in s:
        raise SystemExit('Could not find question finish function')
    s = s.replace(old_finish, new_finish, 1)

if "document.getElementById('f').onsubmit=e=>{e.preventDefault();if(done)return;" not in s:
    old_submit = "document.getElementById('f').onsubmit=e=>{e.preventDefault();const typed=inp.value"
    new_submit = "document.getElementById('f').onsubmit=e=>{e.preventDefault();if(done)return;const typed=inp.value"
    if old_submit not in s:
        raise SystemExit('Could not find answer submit handler')
    s = s.replace(old_submit, new_submit, 1)

# Store the result by question position instead of blindly appending.
if 'results[qi]={q,ans,pts}' not in s:
    old_reveal = "function reveal(ans){const q=Q[qi];const pts=ans?ans.pts:0;const before=zoneOf(score);score+=pts;results.push({q,ans,pts});const after=zoneOf(score);"
    new_reveal = "function reveal(ans){if(results[qi])return;const q=Q[qi];const pts=ans?ans.pts:0;const before=zoneOf(score);score+=pts;results[qi]={q,ans,pts};const after=zoneOf(score);"
    if old_reveal not in s:
        raise SystemExit('Could not find reveal result insertion')
    s = s.replace(old_reveal, new_reveal, 1)

# Repair any previously saved duplicate result rows when a completed game is restored.
if 'const savedPicks=Array.isArray(p.picks)?p.picks:[]' not in s:
    old_restore_start = "function restore(p){results=p.picks.map(([i,name])=>{const q=Q[i],ans=name?q?.answers.find(a=>a.name===name)||null:null;return{q,ans,pts:ans?ans.pts:0}});"
    new_restore_start = "function restore(p){const savedPicks=Array.isArray(p.picks)?p.picks:[],byPos=new Map();savedPicks.forEach(([i,name])=>{if(Number.isInteger(i)&&i>=0&&i<Q.length&&!byPos.has(i))byPos.set(i,name||null)});results=Q.map((q,i)=>{const name=byPos.get(i)||null,ans=name?q?.answers.find(a=>a.name===name)||null:null;return{q,ans,pts:ans?ans.pts:0}});"
    if old_restore_start not in s:
        raise SystemExit('Could not find restore function')
    s = s.replace(old_restore_start, new_restore_start, 1)

js_marker = '/* brand home navigation */'
if js_marker not in s:
    boot = "(async()=>{[BANK,DAILY_SCHEDULE]=await Promise.all([loadBank(),loadDailySchedule()]);applyBank();start();paint();setMeter()})();"
    if boot not in s:
        raise SystemExit('Could not find app boot sequence')
    js = '''/* brand home navigation */
const brandHome=document.getElementById('brand-home');
const goBrandHome=()=>{
 if(document.body.classList.contains('playing'))return;
 track('home_click',{from:'brand',set_id:dailySetId()});
 window.scrollTo({top:0,behavior:'smooth'});
 start();
};
if(brandHome){
 brandHome.addEventListener('click',goBrandHome);
 brandHome.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();goBrandHome()});
}

'''
    s = s.replace(boot, js + boot, 1)

p.write_text(s, encoding='utf-8')
print('Brand home, landing layout, tier scale, podium feedback, and one-shot question resolution applied')
