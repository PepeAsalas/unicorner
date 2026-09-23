from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# Keep the five tier labels on a shared baseline on small screens.
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

# Make the completed-player Infinite Mode invitation a prominent, shiny CTA,
# while keeping the unicorn itself as the visual ending of the landing page.
polish_marker = '/* completed landing retention polish */'
if polish_marker not in s:
    css = '''
/* completed landing retention polish */
.lp-final-played{padding:18px 0 14px!important;margin:8px 0 12px!important;text-align:center}
.lp-final-played .lp-h2{margin-bottom:14px!important}
.lp-infinite-cta{position:relative!important;overflow:hidden!important;min-width:min(100%,430px)!important;padding:18px 28px!important;font-size:20px!important;border:3px solid #fff4ad!important;box-shadow:0 0 0 3px #000,0 0 0 6px rgba(255,209,90,.34),0 0 22px rgba(255,209,90,.58),0 5px 0 #000!important;animation:infiniteCtaPulse 1.8s ease-in-out infinite!important}
.lp-infinite-cta:after{content:'';position:absolute;top:-35%;bottom:-35%;width:34%;left:-45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.68),transparent);transform:skewX(-18deg);animation:infiniteCtaShine 2.8s ease-in-out infinite;pointer-events:none}
.lp-final-unicorn{padding:24px 0 8px!important;margin-top:14px!important;text-align:center}
.lp-final-unicorn .lp-sprite-sm{margin-left:auto!important;margin-right:auto!important}
.lp-final-unicorn .lp-meta{margin-top:12px!important}
@keyframes infiniteCtaPulse{0%,100%{filter:brightness(1);transform:scale(1)}50%{filter:brightness(1.09);transform:scale(1.018)}}
@keyframes infiniteCtaShine{0%,56%{left:-45%;opacity:0}62%{opacity:1}82%{left:120%;opacity:.9}83%,100%{left:120%;opacity:0}}
@media (max-width:560px){
  .lp-final-played{padding:14px 0 12px!important;margin:4px 0 8px!important}
  .lp-infinite-cta{width:100%!important;min-width:0!important;padding:18px 14px!important;font-size:19px!important}
  .lp-final-unicorn{padding:22px 0 6px!important}
}
@media (prefers-reduced-motion:reduce){.lp-infinite-cta,.lp-infinite-cta:after{animation:none!important}}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag for retention polish')
    s = s.replace('</style>', css + '</style>', 1)

# After a completed daily game, keep one Infinite Mode invitation rather than
# repeating it directly beneath the score/results launch card.
old_played_extra = '''   </div>\n   <p class="inf-pitch">Want more? Play as many rounds as you like, whenever you like.</p>\n   <div class="row"><button class="cta" data-infinite>∞ Unlock Infinite mode</button></div>`\n   :`'''
new_played_extra = '''   </div>`\n   :`'''
if old_played_extra in s:
    s = s.replace(old_played_extra, new_played_extra, 1)
elif 'Want more? Play as many rounds as you like, whenever you like.' in s:
    raise SystemExit('Could not remove duplicate completed Infinite Mode pitch')

# Put the retention message high on the completed landing page, but do not put
# the unicorn here: the unicorn should remain the final visual at the bottom.
old_top = ''' ${played?`<section class="lp-final lp-final-played">\n  <div class="sprite lp-sprite-sm bob" data-mood="happy"></div>\n  <h2 class="lp-h2">Can't wait until tomorrow?</h2><button class="cta" data-infinite>∞ Try Infinite mode</button>\n  <p class="lp-meta">New game every day</p>\n </section>`:''}\n'''
new_top = ''' ${played?`<section class="lp-final lp-final-played">\n  <h2 class="lp-h2">Can't wait until tomorrow?</h2>\n  <button class="cta lp-infinite-cta" data-infinite>∞ Try Infinite mode</button>\n </section>`:''}\n'''
if old_top in s:
    s = s.replace(old_top, new_top, 1)
elif 'class="cta lp-infinite-cta"' not in s:
    played_cta = new_top
    hero_anchor = '''  <div class="lp-art"><div class="lp-halo"></div><div class="sprite lp-sprite bob" data-mood="wow"></div></div>\n </section>\n\n <section class="lp-steps" id="steps">'''
    hero_replacement = '''  <div class="lp-art"><div class="lp-halo"></div><div class="sprite lp-sprite bob" data-mood="wow"></div></div>\n </section>\n\n''' + played_cta + '''\n <section class="lp-steps" id="steps">'''
    if hero_anchor not in s:
        raise SystemExit('Could not place completed Infinite Mode invitation')
    s = s.replace(hero_anchor, hero_replacement, 1)

# End the landing page with the unicorn for completed players. Unplayed users
# keep the existing Kick off ending.
old_bottom = ''' ${!played?`<section class="lp-final">\n  <div class="sprite lp-sprite-sm bob" data-mood="happy"></div>\n  <h2 class="lp-h2">Today's five prompts are waiting</h2><button class="cta" id="go2">Kick off</button>\n  <p class="lp-meta">New game every day</p>\n </section>`:''}'''
new_bottom = ''' ${!played?`<section class="lp-final">\n  <div class="sprite lp-sprite-sm bob" data-mood="happy"></div>\n  <h2 class="lp-h2">Today's five prompts are waiting</h2><button class="cta" id="go2">Kick off</button>\n  <p class="lp-meta">New game every day</p>\n </section>`:`<section class="lp-final lp-final-unicorn">\n  <div class="sprite lp-sprite-sm bob" data-mood="happy"></div>\n  <p class="lp-meta">New game every day</p>\n </section>`}'''
if old_bottom in s:
    s = s.replace(old_bottom, new_bottom, 1)
elif 'class="lp-final lp-final-unicorn"' not in s:
    raise SystemExit('Could not restore bottom unicorn for completed players')

# Results are a dedicated screen: hide the global progress meter there and
# always open the result from the top, rather than inheriting landing scroll.
result_marker = '/* results viewport cleanup */'
if result_marker not in s:
    css = '''
/* results viewport cleanup */
body.results-view .meter{display:none!important}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag for results cleanup')
    s = s.replace('</style>', css + '</style>', 1)

if "function start(){document.body.classList.remove('playing','results-view');" not in s:
    old = "function start(){document.body.classList.remove('playing');"
    new = "function start(){document.body.classList.remove('playing','results-view');"
    if old not in s:
        raise SystemExit('Could not make start() leave results view')
    s = s.replace(old, new, 1)

if "function ask(){document.body.classList.remove('results-view');document.body.classList.add('playing');" not in s:
    old = "function ask(){document.body.classList.add('playing');"
    new = "function ask(){document.body.classList.remove('results-view');document.body.classList.add('playing');"
    if old not in s:
        raise SystemExit('Could not make ask() leave results view')
    s = s.replace(old, new, 1)

if "function end(restored){\n document.body.classList.add('results-view');" not in s:
    old = "function end(restored){\n document.body.classList.remove('playing');"
    new = "function end(restored){\n document.body.classList.add('results-view');\n document.body.classList.remove('playing');"
    if old not in s:
        raise SystemExit('Could not mark result screen view')
    s = s.replace(old, new, 1)

# The result swap happens after the outgoing screen animation, so scroll once
# the new result DOM is actually mounted. This avoids Safari preserving the
# previous landing-page scroll position.
if "window.scrollTo({top:0,left:0,behavior:'auto'});\n  setTimeout(()=>countUp" not in s:
    old = " </div>`,()=>{\n  setTimeout(()=>countUp(document.getElementById('fs'),score,2000),400);"
    new = " </div>`,()=>{\n  window.scrollTo({top:0,left:0,behavior:'auto'});\n  setTimeout(()=>countUp(document.getElementById('fs'),score,2000),400);"
    if old not in s:
        raise SystemExit('Could not add top scroll to result swap')
    s = s.replace(old, new, 1)

# Guard the intended structure.
if 'class="cta lp-infinite-cta"' not in s:
    raise SystemExit('Infinite Mode CTA polish missing')
if 'class="lp-final lp-final-unicorn"' not in s:
    raise SystemExit('Bottom unicorn missing')
if s.find('class="lp-final lp-final-played"') > s.find('<section class="lp-steps" id="steps">'):
    raise SystemExit('Completed Infinite Mode invitation is too low')
if 'body.results-view .meter{display:none!important}' not in s:
    raise SystemExit('Result meter is still visible')
if "window.scrollTo({top:0,left:0,behavior:'auto'});" not in s:
    raise SystemExit('Result screen does not reset scroll to top')

p.write_text(s, encoding='utf-8')
print('Completed landing polished; results open at top without the progress meter')
