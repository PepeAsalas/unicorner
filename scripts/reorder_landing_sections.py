from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Landing order should be: hero -> How it works -> For example -> five tiers.
# Only swap these two adjacent sections; keep their contents/styles untouched.
example_then_steps = re.compile(
    r'(?P<example><section class="lp-example card">.*?</section>)\s*'
    r'(?P<steps><section class="lp-steps" id="steps">.*?</section>)',
    re.S,
)

if example_then_steps.search(s):
    s = example_then_steps.sub(r'\g<steps>\n\n\g<example>', s, count=1)
else:
    # Already-correct order is fine; anything else should fail loudly.
    steps_pos = s.find('<section class="lp-steps" id="steps">')
    example_pos = s.find('<section class="lp-example card">')
    if steps_pos < 0 or example_pos < 0:
        raise SystemExit('Could not find landing How it works / example sections')
    if not steps_pos < example_pos:
        raise SystemExit('Landing sections were found in an unexpected order')

p.write_text(s, encoding='utf-8')
print('Landing reordered: How it works before For example')
