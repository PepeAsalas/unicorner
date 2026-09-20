from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')


def rep(old, new, label, count=1):
    global s
    if new in s and old not in s:
        print('already applied', label)
        return
    if old not in s:
        raise SystemExit(f'MISSING {label}')
    s = s.replace(old, new, count)
    print('patched', label)


# Five visible scoring tiers. Header is retired; its legacy fame bucket is folded
# into Banger so existing researched question data remains compatible.
rep(
    "const TIERS=[[10,'Tap-in'],[20,'Finish'],[40,'Header'],[60,'Banger'],[80,'Worldie'],[100,'Screamer']];",
    "const TIERS=[[20,'Tap-in'],[40,'Finish'],[60,'Banger'],[80,'Worldie'],[100,'Screamer']];",
    'five tier ladder',
)
rep(
    "const TCOL={10:'#cfd8e6',20:'#7fe0a8',40:'#4fd7ff',60:'#b48cff',80:'#ff7ac8',100:'#ffd23f'};",
    "const TCOL={20:'#cfd8e6',40:'#7fe0a8',60:'#b48cff',80:'#ff7ac8',100:'#ffd23f'};",
    'five tier colors',
)
rep(
    "const FAME_PTS_V1={5:10,4:20,3:40,2:80,1:100},FAME_PTS_V2={6:10,5:20,4:40,3:60,2:80,1:100};",
    "const FAME_PTS_V1={5:20,4:40,3:60,2:80,1:100},FAME_PTS_V2={6:20,5:40,4:60,3:60,2:80,1:100};",
    'five tier fame maps',
)
rep(
    "const famePoints=(q,f)=>((q?.scoring_version||1)>=2?FAME_PTS_V2:FAME_PTS_V1)[f]||40;",
    "const famePoints=(q,f)=>((q?.scoring_version||1)>=2?FAME_PTS_V2:FAME_PTS_V1)[f]||60;",
    'default fame points',
)
rep(
    "${tierName(FAME_PTS_V2[v]||FAME_PTS_V1[v]||40)}",
    "${tierName(FAME_PTS_V2[v]||FAME_PTS_V1[v]||60)}",
    'admin fallback points',
)

# Landing page and stadium copy.
rep(
    "const COLS=['#cfd8e6','#7fe0a8','#4fd7ff','#b48cff','#ff7ac8','#f2c230'];",
    "const COLS=['#cfd8e6','#7fe0a8','#b48cff','#ff7ac8','#f2c230'];",
    'five landing colors',
)
s = s.replace('TAP-IN · FINISH · HEADER · BANGER · WORLDIE · SCREAMER', 'TAP-IN · FINISH · BANGER · WORLDIE · SCREAMER')
s = s.replace('The six tiers', 'The five tiers')
s = s.replace('Tap-in · 10', 'Tap-in · 20')
s = re.sub(r'Header · (?:16|40)', 'Banger · 60', s)
s = s.replace('COLS[5]', 'COLS[4]')

# Result rarity gauge: score values are real positions on a 0-100 bar.
# 20/40/60/80 sit on their exact marks and Screamer/100 reaches the right edge.
rep(
    ".gpts{display:grid;grid-template-columns:repeat(6,1fr);margin-top:10px}\n.gpts span{text-align:center;font:600 12px Barlow,sans-serif;color:rgba(255,255,255,.35);transition:color .25s}",
    ".gpts{position:relative;height:18px;margin-top:10px}\n.gpts span{position:absolute;top:0;transform:translateX(-50%);font:600 12px Barlow,sans-serif;color:rgba(255,255,255,.35);transition:color .25s}\n.gpts span:last-child{transform:translateX(-100%)}",
    'five tier gauge labels',
)
rep(
    "<div class=\"gbar\"><div class=\"gfill\" id=\"gfill\"></div>${TIERS.slice(1).map((t,i)=>`<i class=\"gdiv\" style=\"left:${(i+1)/TIERS.length*100}%\"></i>`).join('')}<div class=\"ghead hold\" id=\"ghead\"><span id=\"glabel\">Tap-in</span><em></em></div></div><div class=\"gpts\">${TIERS.map((t,i)=>`<span data-i=\"${i}\">${t[0]}</span>`).join('')}</div>",
    "<div class=\"gbar\"><div class=\"gfill\" id=\"gfill\"></div>${TIERS.slice(0,-1).map(t=>`<i class=\"gdiv\" style=\"left:${t[0]}%\"></i>`).join('')}<div class=\"ghead hold\" id=\"ghead\"><span id=\"glabel\">Tap-in</span><em></em></div></div><div class=\"gpts\">${TIERS.map((t,i)=>`<span data-i=\"${i}\" style=\"left:${t[0]}%\">${t[0]}</span>`).join('')}</div>",
    'five tier gauge marks',
)
rep(
    "document.getElementById('gfill').style.setProperty('--gw',document.querySelector('.gbar').offsetWidth+'px');const N=TIERS.length,end=(target+.5)/N,dur=700+target*430,t0=performance.now()+350;let shown=-1;",
    "document.getElementById('gfill').style.setProperty('--gw',document.querySelector('.gbar').offsetWidth+'px');const N=TIERS.length,end=pts/100,dur=700+target*430,t0=performance.now()+350;let shown=-1;",
    'five tier gauge endpoint',
)
rep(
    "const i=Math.min(N-1,Math.floor(x*N));if(i!==shown){shown=i;lab.textContent=TIERS[i][1];head.style.setProperty('--hc',COLS[i]);segs.forEach((sg,j)=>sg.classList.toggle('lit',j<=i));head.classList.remove('tick');void head.offsetWidth;head.classList.add('tick')}",
    "let i=TIERS.findIndex(t=>x*100<=t[0]);if(i<0)i=N-1;if(i!==shown){shown=i;lab.textContent=TIERS[i][1];head.style.setProperty('--hc',COLS[i]);segs.forEach((sg,j)=>sg.classList.toggle('lit',j<=i));head.classList.remove('tick');void head.offsetWidth;head.classList.add('tick')}",
    'five tier gauge active label',
)

# Anyone who already played today is rescored from their saved answer names using
# the current ladder, rather than keeping stale 6-tier point values.
old_restore = "function restore(p){results=p.picks.map(([i,name,pts])=>({q:Q[i],ans:name?Q[i].answers.find(a=>a.name===name)||null:null,pts}));score=p.score;qi=Q.length}"
new_restore = "function restore(p){results=p.picks.map(([i,name])=>{const q=Q[i],ans=name?q?.answers.find(a=>a.name===name)||null:null;return{q,ans,pts:ans?ans.pts:0}});score=results.reduce((n,r)=>n+r.pts,0);qi=Q.length;if(score!==p.score)setPlayed({...p,score,picks:results.map((r,i)=>[i,r.ans?.name||null,r.pts])})}"
rep(old_restore, new_restore, 'rescore saved daily result')

# Safety checks: no player-facing Header tier should remain.
if "'Header'" in s or 'Header ·' in s or 'The six tiers' in s:
    raise SystemExit('Header tier still present after patch')

p.write_text(s, encoding='utf-8')
print('five-tier scoring applied')
