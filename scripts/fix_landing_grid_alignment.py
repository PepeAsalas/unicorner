from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = '/* landing grid alignment fix */'
if marker not in s:
    css = r'''
/* landing grid alignment fix */
.landing-wrap{width:100%}
.landing-wrap>section{width:100%;max-width:100%;margin-left:auto!important;margin-right:auto!important;box-sizing:border-box}
.landing-wrap .lp-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;width:100%;min-width:0}
.landing-wrap .lp-step{min-width:0;overflow:hidden;box-sizing:border-box}
.landing-wrap .lp-ico{min-width:0;width:100%}
.landing-wrap .fake-input{min-width:0!important;width:100%!important;max-width:100%!important}
.landing-wrap .mini-gauge{width:100%!important;max-width:170px}
.landing-wrap .lp-climb{min-width:0;max-width:100%}
@media (max-width:640px){
  .landing-wrap .lp-grid{grid-template-columns:1fr!important}
}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

p.write_text(s, encoding='utf-8')
print('Landing grid alignment fixed')
