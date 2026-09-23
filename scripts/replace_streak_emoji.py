from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = '/* pixel streak flame */'
if marker not in s:
    css = '''
/* pixel streak flame */
.pixel-flame{position:relative;display:inline-block;width:22px;height:28px;flex:0 0 22px;background:#ff5a2e;clip-path:polygon(45% 0,64% 0,64% 18%,82% 18%,82% 36%,100% 36%,100% 82%,82% 82%,82% 100%,18% 100%,18% 82%,0 82%,0 45%,18% 45%,18% 27%,36% 27%,36% 9%,45% 9%);filter:drop-shadow(2px 2px 0 #000)}
.pixel-flame:after{content:'';position:absolute;left:7px;bottom:4px;width:9px;height:13px;background:#ffd84d;clip-path:polygon(34% 0,67% 0,67% 25%,100% 25%,100% 100%,0 100%,0 50%,34% 50%)}
.played-result-streak>b .pixel-flame{margin-right:2px}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

old = '<i>🔥</i>${currentStreak()}'
new = '<i class="pixel-flame" aria-hidden="true"></i>${currentStreak()}'
if old in s:
    s = s.replace(old, new)

# Also handle the markup if it has already been partly styled differently.
s = s.replace('<i class="streak-fire">🔥</i>${currentStreak()}', new)

if '🔥' in s:
    raise SystemExit('A fire emoji is still present in index.html')
if 'class="pixel-flame"' not in s:
    raise SystemExit('Pixel streak flame markup is missing')
if marker not in s:
    raise SystemExit('Pixel streak flame CSS is missing')

p.write_text(s, encoding='utf-8')
print('Streak fire emoji replaced with pixel-style flame')
