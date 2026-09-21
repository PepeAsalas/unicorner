from pathlib import Path

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
    css = '''\n/* brand home link */\n.brand-home{display:flex;align-items:center;gap:10px;min-width:0;cursor:pointer;border-radius:6px}\n.brand-home:focus-visible{outline:3px solid var(--gold);outline-offset:4px}\nbody.playing .brand-home{cursor:default}\n'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

js_marker = '/* brand home navigation */'
if js_marker not in s:
    boot = "(async()=>{[BANK,DAILY_SCHEDULE]=await Promise.all([loadBank(),loadDailySchedule()]);applyBank();start();paint();setMeter()})();"
    if boot not in s:
        raise SystemExit('Could not find app boot sequence')
    js = '''/* brand home navigation */\nconst brandHome=document.getElementById('brand-home');\nconst goBrandHome=()=>{\n if(document.body.classList.contains('playing'))return;\n track('home_click',{from:'brand',set_id:dailySetId()});\n window.scrollTo({top:0,behavior:'smooth'});\n start();\n};\nif(brandHome){\n brandHome.addEventListener('click',goBrandHome);\n brandHome.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();goBrandHome()});\n}\n\n'''
    s = s.replace(boot, js + boot, 1)

p.write_text(s, encoding='utf-8')
print('Brand home navigation applied')
