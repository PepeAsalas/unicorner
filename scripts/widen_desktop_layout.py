from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = '/* wider desktop layout */'
if marker not in s:
    css = '''
/* wider desktop layout */
@media (min-width:700px){
  .wrap{max-width:736px!important}
}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

extra_marker = '/* desktop layout extra 5 percent */'
if extra_marker not in s:
    css = '''
/* desktop layout extra 5 percent */
@media (min-width:700px){
  .wrap{max-width:773px!important}
}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

p.write_text(s, encoding='utf-8')
print('Desktop layout widened to 773px')
