from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

css_marker = '/* compact landing dashboard */'
if css_marker not in s:
    css = '''
/* compact landing dashboard */
.landing-wrap .lp-home-hero{margin-top:28px!important;padding:22px 8px 8px!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(150px,.62fr)!important;align-items:center!important;gap:18px!important;text-align:left!important}
.landing-wrap .lp-home-hero .lp-title{margin:0 0 12px!important}
.landing-wrap .lp-home-hero .lp-sub{margin:0!important;max-width:30ch}
.landing-wrap .lp-home-hero .lp-art{order:initial!important;height:180px!important;display:grid!important;place-items:center end!important}
.landing-wrap .lp-home-hero .lp-sprite{width:190px!important;height:158px!important;max-width:100%!important}
.lp-home-daily{padding:18px!important;text-align:left!important;background:linear-gradient(180deg,#1f5fd6,#163f9a)!important}
.lp-home-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:12px}
.lp-home-card-label{font-family:var(--px);font-size:27px;line-height:1;color:#fff}
.lp-home-card-date{font-family:var(--lab);font-size:13px;color:#d6ccff;text-align:right}
.lp-daily-actions{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:10px;margin-top:4px}
.lp-daily-actions .cta,.lp-daily-actions .ghost{width:100%;margin:0!important;display:flex;align-items:center;justify-content:center;min-height:56px;text-align:center}
.lp-home-daily .lp-meta{text-align:left;margin:10px 0 0!important;color:#d6ccff}
.lp-home-daily .played-result-card{margin:0!important;width:100%!important}
.lp-home-daily .played-result-kicker{margin-top:0}
.lp-final-played[data-home-infinite]{margin:0 0 22px!important;padding:22px!important;text-align:center!important;background:linear-gradient(180deg,#2c1d78 0%,#1b1250 100%)!important;border:3px solid #fff!important;border-radius:10px!important;box-shadow:0 0 0 3px #000,8px 8px 0 rgba(0,0,0,.35)!important}
.lp-final-played[data-home-infinite] .lp-h2{margin:0 0 16px!important}
.lp-final-played[data-home-infinite] .lp-infinite-cta{width:min(100%,430px)!important}
@media (max-width:560px){
 .landing-wrap .lp-home-hero{margin-top:16px!important;padding:14px 2px 8px!important;grid-template-columns:minmax(0,1fr) 112px!important;gap:10px!important}
 .landing-wrap .lp-home-hero .lp-title{font-size:clamp(36px,10.6vw,48px)!important;line-height:.94!important;margin-bottom:9px!important}
 .landing-wrap .lp-home-hero .lp-sub{font-size:16px!important;line-height:1.25!important}
 .landing-wrap .lp-home-hero .lp-art{height:112px!important;place-items:start end!important}
 .landing-wrap .lp-home-hero .lp-sprite{width:124px!important;height:103px!important}
 .lp-home-daily{padding:15px!important}
 .lp-home-card-head{margin-bottom:10px;align-items:center}
 .lp-home-card-label{font-size:24px}
 .lp-home-card-date{font-size:11px;max-width:120px;line-height:1.15}
 .lp-daily-actions{grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);gap:8px}
 .lp-daily-actions .cta,.lp-daily-actions .ghost{min-height:52px;padding:12px 9px!important;font-size:16px!important;line-height:1.05}
 .lp-final-played[data-home-infinite]{padding:18px 14px!important;margin-bottom:18px!important}
 .lp-final-played[data-home-infinite] .lp-h2{font-size:27px!important;margin-bottom:14px!important}
}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

# Refine the hero from the first dashboard pass: title and unicorn should read
# as one centered unit, and both should be more prominent on mobile and desktop.
refine_marker = '/* centered landing hero refinement */'
if refine_marker not in s:
    css = '''
/* centered landing hero refinement */
.landing-wrap .lp-home-hero{display:block!important;margin-top:22px!important;padding:20px 6px 10px!important;text-align:center!important}
.lp-home-title-row{display:grid;grid-template-columns:minmax(0,470px) 220px;align-items:center;justify-content:center;gap:18px;width:100%;margin:0 auto}
.lp-home-title-row .lp-title{margin:0!important;text-align:left!important;font-size:clamp(58px,7.8vw,78px)!important;line-height:.92!important}
.lp-home-title-row .lp-art{order:initial!important;height:190px!important;display:grid!important;place-items:center!important}
.lp-home-title-row .lp-sprite{width:225px!important;height:188px!important;max-width:100%!important}
.landing-wrap .lp-home-hero>.lp-sub{max-width:none!important;margin:2px auto 0!important;text-align:center!important;font-size:20px!important}
@media (max-width:560px){
 .landing-wrap .lp-home-hero{margin-top:10px!important;padding:12px 0 8px!important}
 .lp-home-title-row{grid-template-columns:minmax(0,1fr) 142px!important;gap:8px!important;max-width:100%!important}
 .lp-home-title-row .lp-title{font-size:clamp(42px,11.8vw,51px)!important;line-height:.91!important;text-align:center!important}
 .lp-home-title-row .lp-art{height:132px!important;place-items:center!important}
 .lp-home-title-row .lp-sprite{width:154px!important;height:128px!important}
 .landing-wrap .lp-home-hero>.lp-sub{margin-top:3px!important;font-size:17px!important;line-height:1.2!important}
 .lp-home-daily{margin-bottom:14px!important}
}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag for centered hero')
    s = s.replace('</style>', css + '</style>', 1)

# Tighten the title/unicorn pair so the mascot sits immediately beside the
# title instead of feeling detached on the right. The mascot is intentionally
# allowed to overhang its grid cell a little so the combined lockup stays centered.
lockup_marker = '/* tighter title unicorn lockup */'
if lockup_marker not in s:
    css = '''
/* tighter title unicorn lockup */
.lp-home-title-row{grid-template-columns:minmax(0,455px) 225px!important;gap:0!important;max-width:680px!important}
.lp-home-title-row .lp-art{height:205px!important;transform:translateX(-18px)!important}
.lp-home-title-row .lp-sprite{width:250px!important;height:208px!important;max-width:none!important}
@media (max-width:560px){
 .lp-home-title-row{grid-template-columns:minmax(0,1fr) 154px!important;gap:0!important}
 .lp-home-title-row .lp-art{height:145px!important;transform:translateX(-14px)!important}
 .lp-home-title-row .lp-sprite{width:180px!important;height:150px!important;max-width:none!important}
}
'''
    if '</style>' not in s:
        raise SystemExit('Could not find closing style tag for title/unicorn lockup')
    s = s.replace('</style>', css + '</style>', 1)

# Always normalize the hero markup so title + unicorn sit beside one another,
# with the supporting line beneath the pair.
hero_pattern = re.compile(
    r' <section class="lp-hero lp-home-hero">.*?</section>\s*(?= <section class="card lp-home-daily">)',
    re.S,
)
hero_replacement = ''' <section class="lp-hero lp-home-hero">
  <div class="lp-home-title-row">
   <h1 class="lp-title">How deep is your <span class="uni-word">ball knowledge</span>?</h1>
   <div class="lp-art"><div class="lp-halo"></div><div class="sprite lp-sprite bob" data-mood="wow"></div></div>
  </div>
  <p class="lp-sub">Find the answer nobody else thinks of.</p>
 </section>

'''
s, hero_count = hero_pattern.subn(hero_replacement, s, count=1)

# First-time upgrade path if the dashboard has not been built yet.
if hero_count != 1 and 'class="lp-hero lp-home-hero"' not in s:
    pattern = re.compile(
        r' <section class="lp-hero">.*?(?= <section class="lp-steps" id="steps">)',
        re.S,
    )
    replacement = hero_replacement + ''' <section class="card lp-home-daily">
  <div class="lp-home-card-head"><div class="lp-home-card-label">Daily game</div><div class="lp-home-card-date">${today}</div></div>
  ${played?`<div class="played-box played-result-card">
    <div class="played-result-kicker">Today's final whistle</div>
    <div class="played-result-grid">
      <div class="played-result-score"><span>Score</span><b>${played.score}<small>/${MAX}</small></b><em>${zoneOf(played.score)}</em></div>
      <div class="played-result-streak"><span>Streak</span><b><i>🔥</i>${currentStreak()}</b><small>day${currentStreak()===1?'':'s'}</small></div>
    </div>
    <button type="button" class="cta played-result-cta" id="go"><span>View today's result</span><small>Score, rank & answers →</small></button>
    <div class="played-result-next">Next daily game in <b>${untilMidnight()}</b></div>
   </div>`
   :`<div class="lp-daily-actions"><button id="go" class="cta">Play today's game</button><button class="ghost" id="how">How it works</button></div>
   <p class="lp-meta">5 prompts · about 3 minutes · free, no sign-up</p>`}
 </section>

 ${played?`<section class="lp-final lp-final-played" data-home-infinite>
  <h2 class="lp-h2">Can't wait until tomorrow?</h2>
  <button class="cta lp-infinite-cta" data-infinite>∞ Try Infinite mode</button>
 </section>`:''}

'''
    s, count = pattern.subn(replacement, s, count=1)
    if count != 1:
        raise SystemExit('Could not rebuild the landing dashboard')

# Infinite Mode only makes sense after the daily game has been completed.
unconditional_infinite = ''' <section class="lp-final lp-final-played" data-home-infinite>
  <h2 class="lp-h2">Can't wait until tomorrow?</h2>
  <button class="cta lp-infinite-cta" data-infinite>∞ Try Infinite mode</button>
 </section>'''
conditional_infinite = ''' ${played?`<section class="lp-final lp-final-played" data-home-infinite>
  <h2 class="lp-h2">Can't wait until tomorrow?</h2>
  <button class="cta lp-infinite-cta" data-infinite>∞ Try Infinite mode</button>
 </section>`:''}'''
if unconditional_infinite in s:
    s = s.replace(unconditional_infinite, conditional_infinite, 1)
elif '${played?`<section class="lp-final lp-final-played" data-home-infinite>' not in s:
    raise SystemExit('Could not make Infinite Mode completed-only')

# Guard the requested order and state behavior.
hero = s.find('class="lp-hero lp-home-hero"')
daily = s.find('class="card lp-home-daily"')
infinite = s.find('class="lp-final lp-final-played" data-home-infinite')
steps = s.find('<section class="lp-steps" id="steps">')
if min(hero, daily, infinite, steps) < 0 or not hero < daily < infinite < steps:
    raise SystemExit('Landing dashboard order is incorrect')
if 'class="lp-home-title-row"' not in s:
    raise SystemExit('Centered title/unicorn row is missing')
if lockup_marker not in s:
    raise SystemExit('Tighter title/unicorn lockup is missing')
if 'class="lp-daily-actions"' not in s or 'class="played-box played-result-card"' not in s:
    raise SystemExit('Daily game state swap is missing')
if 'id="how"' not in s or 'id="go"' not in s:
    raise SystemExit('Daily game actions are missing')
if '${played?`<section class="lp-final lp-final-played" data-home-infinite>' not in s:
    raise SystemExit('Infinite card is not limited to completed players')

p.write_text(s, encoding='utf-8')
print('Landing hero centered and enlarged; title and unicorn tightened into one lockup')
