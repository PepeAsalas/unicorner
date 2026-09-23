from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

css_marker = '/* completed landing mobile refinements */'
if css_marker not in s:
    css = '''
/* completed landing mobile refinements */
.lp-final-played{padding:16px 0 10px!important;margin:4px 0 8px!important}
@media (max-width:560px){
  .landing-wrap .lp-tiers .tier-row{gap:6px!important}
  .landing-wrap .lp-tiers .tier-chip b{min-height:34px!important;display:flex!important;align-items:center!important;justify-content:center!important;line-height:1.02!important;font-size:14px!important}
  .landing-wrap .lp-tiers .tier-chip span{line-height:1!important}
  .lp-final-played{padding:12px 0 8px!important;margin:0 0 6px!important}
}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

# After a completed daily game, keep one Infinite Mode invitation rather than
# repeating it directly beneath the score/results launch card.
old_played_extra = '''   </div>
   <p class="inf-pitch">Want more? Play as many rounds as you like, whenever you like.</p>
   <div class="row"><button class="cta" data-infinite>∞ Unlock Infinite mode</button></div>`
   :`'''
new_played_extra = '''   </div>`
   :`'''
if old_played_extra in s:
    s = s.replace(old_played_extra, new_played_extra, 1)
elif 'Want more? Play as many rounds as you like, whenever you like.' in s:
    raise SystemExit('Could not remove duplicate completed Infinite Mode pitch')

# Put the completed-player retention CTA immediately after the hero/result card.
played_cta = ''' ${played?`<section class="lp-final lp-final-played">
  <div class="sprite lp-sprite-sm bob" data-mood="happy"></div>
  <h2 class="lp-h2">Can't wait until tomorrow?</h2><button class="cta" data-infinite>∞ Try Infinite mode</button>
  <p class="lp-meta">New game every day</p>
 </section>`:''}
'''
hero_anchor = '''  <div class="lp-art"><div class="lp-halo"></div><div class="sprite lp-sprite bob" data-mood="wow"></div></div>
 </section>

 <section class="lp-steps" id="steps">'''
hero_replacement = '''  <div class="lp-art"><div class="lp-halo"></div><div class="sprite lp-sprite bob" data-mood="wow"></div></div>
 </section>

''' + played_cta + '''
 <section class="lp-steps" id="steps">'''
if 'class="lp-final lp-final-played"' not in s:
    if hero_anchor not in s:
        raise SystemExit('Could not find landing hero/steps boundary')
    s = s.replace(hero_anchor, hero_replacement, 1)

# Keep the bottom CTA only for people who have not played yet.
old_final = ''' <section class="lp-final">
  <div class="sprite lp-sprite-sm bob" data-mood="happy"></div>
  ${played?`<h2 class="lp-h2">Can't wait until tomorrow?</h2><button class="cta" data-infinite>∞ Try Infinite mode</button>`:`<h2 class="lp-h2">Today's five prompts are waiting</h2><button class="cta" id="go2">Kick off</button>`}
  <p class="lp-meta">New game every day</p>
 </section>'''
new_final = ''' ${!played?`<section class="lp-final">
  <div class="sprite lp-sprite-sm bob" data-mood="happy"></div>
  <h2 class="lp-h2">Today's five prompts are waiting</h2><button class="cta" id="go2">Kick off</button>
  <p class="lp-meta">New game every day</p>
 </section>`:''}'''
if old_final in s:
    s = s.replace(old_final, new_final, 1)
elif '${played?`<h2 class="lp-h2">Can\'t wait until tomorrow?</h2>' in s:
    raise SystemExit('Could not move completed final CTA from bottom')

p.write_text(s, encoding='utf-8')
print('Mobile five-tier alignment fixed and completed Infinite Mode CTA moved upward')
