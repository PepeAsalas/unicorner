from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')


def rep(old, new, label):
    global s
    if new in s:
        print('already applied', label)
        return
    if old not in s:
        raise SystemExit(f'MISSING {label}')
    s = s.replace(old, new, 1)
    print('patched', label)


rep(
    "const TIERS=[[4,'Tap-in'],[8,'Finish'],[16,'Header'],[32,'Banger'],[64,'Worldie'],[100,'Screamer']];",
    "const TIERS=[[10,'Tap-in'],[20,'Finish'],[40,'Header'],[60,'Banger'],[80,'Worldie'],[100,'Screamer']];",
    'tier points',
)
rep(
    "const TCOL={4:'#cfd8e6',8:'#7fe0a8',16:'#4fd7ff',32:'#b48cff',64:'#ff7ac8',100:'#ffd23f'};",
    "const TCOL={10:'#cfd8e6',20:'#7fe0a8',40:'#4fd7ff',60:'#b48cff',80:'#ff7ac8',100:'#ffd23f'};",
    'tier colors',
)
rep(
    "const FAME_PTS_V1={5:4,4:8,3:16,2:64,1:100},FAME_PTS_V2={6:4,5:8,4:16,3:32,2:64,1:100};",
    "const FAME_PTS_V1={5:10,4:20,3:40,2:80,1:100},FAME_PTS_V2={6:10,5:20,4:40,3:60,2:80,1:100};",
    'fame point maps',
)
rep(
    "const famePoints=(q,f)=>((q?.scoring_version||1)>=2?FAME_PTS_V2:FAME_PTS_V1)[f]||16;",
    "const famePoints=(q,f)=>((q?.scoring_version||1)>=2?FAME_PTS_V2:FAME_PTS_V1)[f]||40;",
    'default fame points',
)
rep(
    "${tierName(FAME_PTS_V2[v]||FAME_PTS_V1[v]||16)}",
    "${tierName(FAME_PTS_V2[v]||FAME_PTS_V1[v]||40)}",
    'admin fallback points',
)
rep('Tap-in · 4', 'Tap-in · 10', 'landing tap-in example')
rep('Header · 16', 'Header · 40', 'landing header example')

p.write_text(s, encoding='utf-8')
print('friendlier scoring applied')
