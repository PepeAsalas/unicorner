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

center_marker = '/* landing card centering */'
if center_marker not in s:
    css = '''\n/* landing card centering */\n.landing-wrap .card{margin-left:auto!important;margin-right:auto!important;width:100%;text-align:center}\n.landing-wrap .lp-grid{justify-items:center}\n.landing-wrap .lp-step{width:100%;text-align:center}\n.landing-wrap .lp-ico{justify-content:center}\n.landing-wrap .lp-example,.landing-wrap .lp-tiers{text-align:center}\n.landing-wrap .lp-answers{justify-items:stretch}\n.landing-wrap .lp-ans{text-align:center;align-items:center}\n.landing-wrap .lp-tiers .tier-row{justify-items:center!important}\n.landing-wrap .lp-tiers .tier-chip{text-align:center;justify-self:center}\n.landing-wrap .played-home-stats{justify-content:center}\n.landing-wrap .played-home-stat{text-align:center}\n'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

wide_tiers_marker = '/* wider landing tier bars */'
if wide_tiers_marker not in s:
    css = '''\n/* wider landing tier bars */\n.landing-wrap .lp-tiers .tier-bar{width:70%!important;min-width:54px!important;max-width:78px!important;margin-left:auto!important;margin-right:auto!important}\n'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

step_number_marker = '/* landing step number badges */'
if step_number_marker not in s:
    css = '''\n/* landing step number badges */\n.landing-wrap .lp-step{padding-top:58px!important}\n.landing-wrap .lp-step .lp-num{top:12px!important;right:12px!important;z-index:3!important;min-width:38px!important;height:38px!important;padding:1px 8px 0!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#0c0c18!important;border:2px solid #fff!important;border-radius:6px!important;box-shadow:0 3px 0 #000!important;color:var(--gold)!important;font-size:30px!important;line-height:1!important;opacity:1!important}\n.landing-wrap .lp-step .lp-ico{position:relative;z-index:1}\n'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

step_number_center_marker = '/* landing step number centering fix */'
if step_number_center_marker not in s:
    css = '''\n/* landing step number centering fix */\n.landing-wrap .lp-step .lp-num{width:40px!important;min-width:40px!important;height:40px!important;padding:0!important;display:grid!important;place-items:center!important;text-align:center!important;line-height:40px!important;font-family:var(--lab)!important;font-size:26px!important;letter-spacing:0!important;text-indent:0!important}\n.landing-wrap .lp-step .lp-num{padding-top:2px!important}\n'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

step_number_small_marker = '/* smaller centered landing step numbers */'
if step_number_small_marker not in s:
    css = '''\n/* smaller centered landing step numbers */\n.landing-wrap .lp-step .lp-num{width:38px!important;min-width:38px!important;height:38px!important;box-sizing:border-box!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;line-height:1!important;font-size:20px!important;letter-spacing:0!important;text-indent:0!important}\n'''
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
print('Brand home navigation and landing layout fixes applied')
