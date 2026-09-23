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

p.write_text(s, encoding='utf-8')
print('Landing podium aligned with stepped card heights and spacing')
