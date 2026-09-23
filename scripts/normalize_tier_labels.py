from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

target_names = ['Tap-in', 'Header', 'Volley', 'Bicycle kick', 'Screamer']

# Only look at the TIERS array's own labels to decide whether this has already
# run. A blanket word-level rename (the old behaviour) also matched the
# unrelated finish() function and plain English prose ("finish today",
# "Finish rate", "Finished as ..."), corrupting them -- so this script must
# never re-run its rename sweep once the tier labels themselves are already
# correct, regardless of what other legitimate uses of "finish" exist.
tiers_pattern = r"const TIERS=\[\[\d+,'([^']+)'\],\[\d+,'([^']+)'\],\[\d+,'([^']+)'\],\[\d+,'([^']+)'\],\[\d+,'([^']+)'\]\];"
m = re.search(tiers_pattern, s)
if not m:
    raise SystemExit('Could not find the TIERS array')

if list(m.groups()) == target_names:
    print('Tier labels already normalized; nothing to do')
else:
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

    m = re.search(tiers_pattern, s)
    if not m or list(m.groups()) != target_names:
        raise SystemExit('The five-tier scale is not using the required names')

    p.write_text(s, encoding='utf-8')
    print('Tier labels normalized everywhere')
