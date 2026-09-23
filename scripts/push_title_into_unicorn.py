from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = '/* title overlaps unicorn space */'
if marker not in s:
    css = '''
/* title overlaps unicorn space */
.lp-home-title-row{overflow:visible!important}
.lp-home-title-row .lp-title{position:relative!important;z-index:3!important;width:calc(100% + 52px)!important;max-width:none!important}
.lp-home-title-row .lp-art{position:relative!important;z-index:1!important;transform:translateX(-42px)!important}
@media (max-width:560px){
 .lp-home-title-row .lp-title{width:calc(100% + 34px)!important}
 .lp-home-title-row .lp-art{transform:translateX(-32px)!important}
}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

if marker not in s:
    raise SystemExit('Title/unicorn overlap CSS was not applied')

p.write_text(s, encoding='utf-8')
print('Title now reaches into the unicorn space')
