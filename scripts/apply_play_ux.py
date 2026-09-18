from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
changed = False


def rep(old, new, label):
    global s, changed
    if new in s:
        print('already', label)
        return
    if old not in s:
        raise SystemExit(f'MISSING {label}')
    s = s.replace(old, new, 1)
    changed = True
    print('patched', label)


# Stronger question progress treatment during play.
if '/* play ux upgrade */' not in s:
    rep(
        '</style>',
        '''/* play ux upgrade */
.q-progress{display:inline-flex;align-items:baseline;gap:9px;margin:0 0 8px;padding:7px 10px;border:2px solid var(--gold);border-radius:7px;background:#000;color:var(--gold);font-family:var(--px,"Pixelify Sans",monospace);text-transform:uppercase;letter-spacing:.04em;box-shadow:0 3px 0 #000}
.q-progress span{font-size:11px}.q-progress b{font-size:20px;color:#fff;line-height:1}.q-sub{font-size:13px;margin-bottom:3px}
.played-home-stats{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0}.played-home-stat{min-width:120px;padding:9px 11px;border:2px solid rgba(255,255,255,.22);border-radius:7px;background:rgba(0,0,0,.28)}.played-home-stat span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--mute)}.played-home-stat b{display:block;margin-top:2px;font:800 28px "Barlow Condensed",sans-serif;color:#fff}.played-home-stat small{font-size:14px;color:var(--mute);margin-left:3px}
</style>''',
        'play UX styles',
    )

rep(
    '<div class="mute">Prompt ${qi+1} of ${Q.length} · ${q.sub}</div><div class="prompt">${q.prompt}</div>',
    '<div class="q-progress" aria-label="Question ${qi+1} of ${Q.length}"><span>Question</span><b>${qi+1} of ${Q.length}</b></div><div class="mute q-sub">${q.sub}</div><div class="prompt">${q.prompt}</div>',
    'question progress',
)

# Keep played-day state aligned with the Amsterdam game day and derive a browser streak
# from the existing per-day localStorage records. No new personal identifier is needed.
rep(
    "const DAYKEY='unicorner-played-'+new Date().toISOString().slice(0,10);",
    "const DAYKEY='unicorner-played-'+amsterdamDay();",
    'Amsterdam played key',
)
rep(
    "const setPlayed=v=>{try{localStorage.setItem(DAYKEY,JSON.stringify(v))}catch{}};",
    "const setPlayed=v=>{try{localStorage.setItem(DAYKEY,JSON.stringify(v))}catch{}};\nconst previousGameDay=d=>{const [y,m,dd]=d.split('-').map(Number);return new Date(Date.UTC(y,m-1,dd)-864e5).toISOString().slice(0,10)};\nconst currentStreak=()=>{try{let d=amsterdamDay(),n=0;while(localStorage.getItem('unicorner-played-'+d)){n++;d=previousGameDay(d)}return n}catch{return getPlayed()?1:0}};",
    'streak helper',
)

rep(
    '''${played?`<div class="played-box"><div class="mute">You've played today</div><div class="played-score">${played.score}<small>/${MAX}</small></div><div class="mute">${zoneOf(played.score)} · next game in <b style="color:var(--ink)">${untilMidnight()}</b></div></div>
   <p class="inf-pitch">''',
    '''${played?`<div class="played-box"><div class="mute">You've played today</div><div class="played-home-stats"><div class="played-home-stat"><span>Score</span><b>${played.score}<small>/${MAX}</small></b></div><div class="played-home-stat"><span>Streak</span><b>🔥 ${currentStreak()}<small>day${currentStreak()===1?'':'s'}</small></b></div></div><div class="mute">${zoneOf(played.score)} · next game in <b style="color:var(--ink)">${untilMidnight()}</b></div></div>
   <p class="inf-pitch">''',
    'home score and streak',
)

# Share result: copy every time; use the native share sheet where supported.
rep(
    '<div class="row"><button id="copy">Copy result</button><button class="ghost" id="home">Back to home</button></div>',
    '<div class="row"><button id="share-result">Share result</button><button class="ghost" id="home">Back to home</button></div>',
    'share button',
)
rep(
    "document.getElementById('copy').onclick=async e=>{track('share_click',{score,set_id:dailySetId()});try{await navigator.clipboard.writeText(share);e.target.textContent='Copied'}catch{e.target.textContent='Copy failed'}};",
    "document.getElementById('share-result').onclick=async e=>{track('share_click',{score,set_id:dailySetId(),native_share:!!navigator.share});const copyP=navigator.clipboard?.writeText?navigator.clipboard.writeText(share).then(()=>true).catch(()=>false):Promise.resolve(false);if(navigator.share){try{await navigator.share({title:'Unicorner',text:share});const copied=await copyP;e.target.textContent=copied?'Shared + copied':'Shared';return}catch(err){const copied=await copyP;if(err?.name==='AbortError'){e.target.textContent=copied?'Copied':'Share';return}e.target.textContent=copied?'Copied':'Share failed';return}}const copied=await copyP;e.target.textContent=copied?'Copied':'Copy failed'};",
    'native share behavior',
)

if changed:
    p.write_text(s, encoding='utf-8')
    print('play UX upgrade applied')
else:
    print('play UX upgrade already applied')
