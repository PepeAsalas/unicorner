#!/usr/bin/env python3
"""Put the Google tag (Tag Manager container GTM-PPT4FJC4) right after <head> on every page of the site.

Safe to run again: pages that already have it are left alone. The page builders (build_es, build_answers,
build_trivia, build_myths, build_info_pages) run it at the end, so regenerated pages keep the tag.
Usage: python3 scripts/add_gtag.py
"""
import glob
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAG = '''<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-PPT4FJC4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
</script>
'''
SKIP = ('mockups' + os.sep, 'emails' + os.sep, 'node_modules' + os.sep, '.git' + os.sep)  # emails: no scripts in email HTML


def main():
    n = 0
    for path in glob.glob(os.path.join(ROOT, '**', '*.html'), recursive=True):
        rel = os.path.relpath(path, ROOT)
        if rel.startswith(SKIP) or os.path.basename(path).startswith('google'):
            continue
        s = open(path, encoding='utf-8').read()
        if 'GTM-PPT4FJC4' in s or '<head>' not in s:
            continue
        i = s.index('<head>') + len('<head>')
        s = s[:i] + '\n' + TAG + s[i:].lstrip('\n')
        open(path, 'w', encoding='utf-8').write(s)
        n += 1
    print(f'Google tag added to {n} page(s)')


if __name__ == '__main__':
    main()
