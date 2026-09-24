from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = '/* aligned landing podium */'
if marker not in s:
    css = '''
/* aligned landing podium */
@media (min-width:641px){
  .landing-wrap .lp-example .lp-answers{align-items:end!important;gap:16px!important;padding:28px 0 12px!important}
  .landing-wrap .lp-example .lp-ans{box-sizing:border-box!important;display:flex!important;flex-direction:column!important;justify-content:center!important;transform:none!important}
  .landing-wrap .lp-example .podium-low{height:96px!important}
  .landing-wrap .lp-example .podium-mid{height:116px!important}
  .landing-wrap .lp-example .podium-top{height:140px!important;transform:none!important}
}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

mobile_marker = '/* mobile landing podium */'
if mobile_marker not in s:
    css = '''
/* mobile landing podium */
@media (max-width:640px){
  .landing-wrap .lp-example .lp-answers{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;align-items:end!important;padding:18px 0 8px!important}
  .landing-wrap .lp-example .lp-ans{min-width:0!important;width:100%!important;padding:10px 5px!important;box-sizing:border-box!important;display:flex!important;flex-direction:column!important;justify-content:center!important;transform:none!important}
  .landing-wrap .lp-example .podium-low{height:108px!important}
  .landing-wrap .lp-example .podium-mid{height:132px!important}
  .landing-wrap .lp-example .podium-top{height:156px!important;transform:none!important}
  .landing-wrap .lp-example .lp-ans b{font-size:clamp(13px,3.6vw,17px)!important;line-height:1.08!important;overflow-wrap:anywhere}
  .landing-wrap .lp-example .lp-ans span{font-size:clamp(10px,2.7vw,13px)!important;line-height:1.15!important}
}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

p.write_text(s, encoding='utf-8')
print('Landing podium aligned on desktop and presented as a stepped podium on mobile')
