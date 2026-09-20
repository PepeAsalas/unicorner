from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = '/* five-tier centering fix */'
css = '''
/* five-tier centering fix */
.lp-tiers .tier-row{
  display:grid!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  justify-content:center!important;
  align-items:end!important;
  width:100%!important;
}
@media (max-width:560px){
  .lp-tiers .tier-row{gap:8px!important}
}
'''

if marker in s:
    print('five-tier centering already applied')
    raise SystemExit(0)

if '</style>' not in s:
    raise SystemExit('MISSING </style>')

s = s.replace('</style>', css + '\n</style>', 1)
p.write_text(s, encoding='utf-8')
print('patched five-tier centering')
