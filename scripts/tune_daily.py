# Keeps every upcoming Daily 5 near the best average score (about 210 of 500: hard days lose ~5 points of
# completion rate per 50 points of average). Predicts each question's average from real results
# (question_stats in Supabase: the question itself if it ran before, else its format family, else its answer type),
# and on a day predicted under 195 swaps the weakest question (up to 3) for a proven old question, 30+ days after
# its last use, as a reuse copy (id + "r1", reuse_of, first_used). Orders the day easiest first, hardest 4th.
# New questions taken out go to daily/held.json for later days.  Usage: python3 scripts/tune_daily.py [--apply]
import json,glob,statistics as st,datetime,copy,sys,os
from collections import defaultdict
sys.path.insert(0,os.path.dirname(__file__));import upkeep
APPLY='--apply' in sys.argv
TARGET,LO=210,195
rows=upkeep.supabase_rpc('question_stats_all',{})
files={json.load(open(f))['date']:f for f in glob.glob('daily/2026-*.json')}
D={d:json.load(open(f)) for d,f in files.items()}
where={}  # id -> (date, q)
for d,x in sorted(D.items()):
  for q in x['questions']:where[q['id']]=(d,q)
known={}  # original id -> avg
for r in rows:
  i=r['question_id'];o=where.get(i,(None,{}))[1].get('reuse_of') or i
  known.setdefault(o,[]).append(float(r['avg_pts']))
known={k:st.mean(v) for k,v in known.items()}
fam=defaultdict(list);typ=defaultdict(list)
for r in rows:
  q=where.get(r['question_id'],(0,{}))[1]
  fam[q.get('format_family')].append(float(r['avg_pts']));typ[q.get('answer_type')].append(float(r['avg_pts']))
def pred(q):
  o=q.get('reuse_of') or q['id']
  if o in known:return known[o],'known'
  f=fam.get(q.get('format_family'))
  if f:return st.mean(f),'family'
  t=typ.get(q.get('answer_type'));return (st.mean(t) if t else 35),'type'
# last use date of each original
last=defaultdict(str)
for d,x in D.items():
  for q in x['questions']:
    o=q.get('reuse_of') or q['id'];last[o]=max(last[o],d)
today=upkeep.today().isoformat() if hasattr(upkeep.today(),'isoformat') else str(upkeep.today())
future=sorted(d for d in D if d>today)
held=[];used_now=set()
for day in future:
  qs=D[day]['questions']
  P=[pred(q)[0] for q in qs]
  before=sum(P);changes=[]
  while sum(P)<LO and len(changes)<3:
    k=min(range(5),key=lambda j:(P[j]-(6 if qs[j].get('reuse_of') else 0)))
    need=TARGET-(sum(P)-P[k])
    fams={q.get('format_family') for j,q in enumerate(qs) if j!=k}
    cut=(datetime.date.fromisoformat(day)-datetime.timedelta(days=30)).isoformat()
    pool=[(o,a) for o,a in known.items() if last[o]<=cut and o not in used_now and o in where and where[o][1].get('format_family') not in fams and a>P[k]+5 and 10<=len(where[o][1]['answers'])<=80]
    if not pool:break
    o,a=min(pool,key=lambda t:abs(t[1]-need))
    orig=copy.deepcopy(where[o][1]);n=1
    ids={q['id'] for x in D.values() for q in x['questions']}
    while f'{o}r{n}' in ids:n+=1
    orig['id']=orig['_id']=f'{o}r{n}';orig['reuse_of']=o;orig['first_used']=min(dd for dd,x in D.items() for q in x['questions'] if (q.get('reuse_of') or q['id'])==o)
    out=qs[k]
    if not out.get('reuse_of'):held.append(out)
    changes.append(f"{out['id']}({P[k]:.0f}) -> {orig['id']}({a:.0f})")
    qs[k]=orig;P[k]=a;used_now.add(o);last[o]=day
  # order: two highest first, lowest fourth
  order=sorted(range(5),key=lambda j:-P[j]);new=[order[0],order[1],order[2],order[4],order[3]]
  D[day]['questions']=[qs[j] for j in new]
  print(day,round(before),'->',round(sum(P)),'; '.join(changes),'|',' '.join(f"{qs[j]['id']}:{P[j]:.0f}{pred(qs[j])[1][0]}" for j in new))
if APPLY:
  for day in future:json.dump(D[day],open(files[day],'w'),ensure_ascii=False,indent=2)
  hp='daily/held.json';h=json.load(open(hp)) if glob.glob(hp) else []
  json.dump(h+held,open(hp,'w'),ensure_ascii=False,indent=2);print('held',len(held))
