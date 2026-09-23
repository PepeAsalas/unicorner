from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

legacy = [
    ('Fin' + 'ish', 'Header'),
    ('Ban' + 'ger', 'Volley'),
    ('Wor' + 'ldie', 'Bicycle kick'),
]

for old, new in legacy:
    pattern = rf'(?i)\b{re.escape(old)}\b'
    s = re.sub(pattern, lambda m, new=new: new.upper() if m.group(0).isupper() else new, s)

for old, _ in legacy:
    if re.search(rf'(?i)\b{re.escape(old)}\b', s):
        raise SystemExit('A legacy tier label still remains')

required = "const TIERS=[[20,'Tap-in'],[40,'Header'],[60,'Volley'],[80,'Bicycle kick'],[100,'Screamer']];"
if required not in s:
    raise SystemExit('The five-tier scale is not using the required names')

p.write_text(s, encoding='utf-8')
print('Tier labels normalized everywhere')
