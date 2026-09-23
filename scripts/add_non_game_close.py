from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

css_marker = '/* quick non-game home exit */'
css = '''
/* quick non-game home exit */
.result-screen{position:relative!important}
.result-screen .quick-home-x{display:flex;position:absolute;top:14px;right:14px;width:42px;height:42px;align-items:center;justify-content:center;z-index:20;padding:0!important;background:#0c0c18!important;color:#fff!important;border:3px solid #fff!important;border-radius:7px!important;box-shadow:0 0 0 3px #000,4px 4px 0 rgba(0,0,0,.4)!important;font-family:var(--px)!important;font-size:31px!important;line-height:1!important;cursor:pointer}
.result-screen .quick-home-x:hover,.result-screen .quick-home-x:focus-visible{color:var(--gold)!important;border-color:var(--gold)!important;outline:none}
body.playing .quick-home-x{display:none!important}
@media (max-width:560px){.result-screen .quick-home-x{top:12px;right:12px;width:40px;height:40px;font-size:29px!important}}
'''

if css_marker not in s:
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)
else:
    start = s.find(css_marker)
    end = s.find('</style>', start)
    if end < 0:
        raise SystemExit('Could not find end of quick-exit style block')
    s = s[:start] + css.strip() + '\n' + s[end:]

# Remove the old viewport-level close button if present.
old_global = '\n<button type="button" class="quick-home-x" id="quick-home-x" aria-label="Back to home" title="Back to home">×</button>'
s = s.replace(old_global, '', 1)

# Put the close control inside the purple result card itself.
result_open = '<div class="card result-screen">'
result_with_close = result_open + '<button type="button" class="quick-home-x" id="quick-home-x" aria-label="Back to home" title="Back to home">×</button>'
if result_with_close not in s:
    if result_open not in s:
        raise SystemExit('Could not find result card')
    s = s.replace(result_open, result_with_close, 1)

# The result card is rendered dynamically, so use delegated click handling.
js_marker = '/* quick non-game exit */'
anchor = '/* brand home navigation */'
js = '''/* quick non-game exit */
document.addEventListener('click',e=>{
 const quickHomeX=e.target.closest?.('#quick-home-x');
 if(!quickHomeX)return;
 if(document.body.classList.contains('playing'))return;
 track('home_click',{from:'quick_exit',set_id:dailySetId()});
 window.scrollTo({top:0,left:0,behavior:'auto'});
 start();
});

'''
if js_marker in s:
    start = s.find(js_marker)
    end = s.find(anchor, start)
    if end < 0:
        raise SystemExit('Could not replace existing quick-exit JS')
    s = s[:start] + js + s[end:]
else:
    if anchor not in s:
        raise SystemExit('Could not find brand navigation anchor')
    s = s.replace(anchor, js + anchor, 1)

for required in (
    css_marker,
    result_with_close,
    js_marker,
    '.result-screen .quick-home-x{display:flex;position:absolute;top:14px;right:14px',
    'body.playing .quick-home-x{display:none!important}',
):
    if required not in s:
        raise SystemExit(f'Missing quick exit requirement: {required}')

if s.count('id="quick-home-x"') != 1:
    raise SystemExit('Quick result close button should exist exactly once')

p.write_text(s, encoding='utf-8')
print('Moved the quick home exit into the top-right of the result card')
