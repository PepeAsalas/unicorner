#!/usr/bin/env python3
"""Copy the kit list (const KITS=[...]) from index.html into duel/sprites.js, so Duels always draws
every kit the main game has. Run by build_es.py, which runs after every index.html change."""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KITS = re.compile(r'^const KITS=\[\n.*?^\];\n', re.S | re.M)


def main():
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    path = os.path.join(ROOT, 'duel', 'sprites.js')
    dst = open(path, encoding='utf-8').read()
    a, b = KITS.search(src), KITS.search(dst)
    if not a or not b:
        sys.exit('build_sprites: could not find const KITS=[ ... ]; in index.html or duel/sprites.js')
    out = dst[:b.start()] + a.group(0) + dst[b.end():]
    if out != dst:
        open(path, 'w', encoding='utf-8').write(out)
        print('updated duel/sprites.js kits')


if __name__ == '__main__':
    main()
