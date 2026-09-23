from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

css_marker = '/* quick non-game home exit */'
if css_marker not in s:
    css = '''
/* quick non-game home exit */
.quick-home-x{display:none;position:fixed;top:72px;right:14px;width:42px;height:42px;align-items:center;justify-content:center;z-index:1200;padding:0!important;background:#0c0c18!important;color:#fff!important;border:3px solid #fff!important;border-radius:7px!important;box-shadow:0 0 0 3px #000,4px 4px 0 rgba(0,0,0,.4)!important;font-family:var(--px)!important;font-size:31px!important;line-height:1!important;cursor:pointer}
.quick-home-x:hover,.quick-home-x:focus-visible{color:var(--gold)!important;border-color:var(--gold)!important;outline:none}
body.results-view .quick-home-x{display:flex}
body.playing .quick-home-x{display:none!important}
@media (max-width:560px){.quick-home-x{top:66px;right:10px;width:40px;height:40px;font-size:29px!important}}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

if 'id="quick-home-x"' not in s:
    if '</header>' not in s:
        raise SystemExit('Could not find top header')
    s = s.replace('</header>', '</header>\n<button type="button" class="quick-home-x" id="quick-home-x" aria-label="Back to home" title="Back to home">×</button>', 1)

js_marker = '/* quick non-game exit */'
if js_marker not in s:
    anchor = '/* brand home navigation */'
    if anchor not in s:
        raise SystemExit('Could not find brand navigation anchor')
    js = '''/* quick non-game exit */
const quickHomeX=document.getElementById('quick-home-x');
if(quickHomeX){quickHomeX.addEventListener('click',()=>{
 if(document.body.classList.contains('playing'))return;
 track('home_click',{from:'quick_exit',set_id:dailySetId()});
 window.scrollTo({top:0,left:0,behavior:'auto'});
 start();
});}

'''
    s = s.replace(anchor, js + anchor, 1)

for required in (css_marker, 'id="quick-home-x"', js_marker, 'body.playing .quick-home-x{display:none!important}'):
    if required not in s:
        raise SystemExit(f'Missing quick exit requirement: {required}')

p.write_text(s, encoding='utf-8')
print('Added top-right home exit to non-game result screens; hidden during active games')
