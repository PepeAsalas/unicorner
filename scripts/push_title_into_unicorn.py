from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = '/* title overlaps unicorn space */'
css = '''
/* title overlaps unicorn space */
.lp-home-title-row{overflow:visible!important}
.lp-home-title-row .lp-title{position:relative!important;z-index:3!important;width:calc(100% - 6px)!important;max-width:none!important}
.lp-home-title-row .lp-art{position:relative!important;z-index:1!important;transform:translateX(12px)!important}
@media (max-width:560px){
 .lp-home-title-row .lp-title{width:calc(100% - 6px)!important}
 .lp-home-title-row .lp-art{transform:translateX(12px)!important}
}
'''

if marker not in s:
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)
else:
    start = s.find(marker)
    end = s.find('</style>', start)
    block = s[start:end]
    old_end = block.find('\n}\n', block.find('@media'))
    if old_end < 0:
        raise SystemExit('Could not locate existing overlap CSS block')
    old_end += 3
    s = s[:start] + css.strip() + '\n' + block[old_end:] + s[end:]

if 'width:calc(100% - 6px)!important' not in s:
    raise SystemExit('Small title/unicorn gap CSS was not applied')
if 'transform:translateX(12px)!important' not in s:
    raise SystemExit('Unicorn position changed unexpectedly')

p.write_text(s, encoding='utf-8')
print('Title gap tightened without moving the unicorn')
