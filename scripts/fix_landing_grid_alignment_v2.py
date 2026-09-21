from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='/* landing grid alignment fix */'
if marker not in s:
    raise SystemExit('Primary landing alignment patch missing')
print('Landing grid alignment patch present')
