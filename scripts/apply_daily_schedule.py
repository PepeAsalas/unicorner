from pathlib import Path
from collections import Counter
import base64
import gzip
import json

payload_dir = Path('scripts/schedule_payload')
encoded = ''.join((payload_dir / f'part{i}.txt').read_text(encoding='utf-8').strip() for i in range(1, 6))
bundle = json.loads(gzip.decompress(base64.b64decode(encoded)).decode('utf-8'))

# Build a reusable pool from the already-researched scheduled questions.
pool = {}
for payload in bundle.values():
    for q in payload.get('questions', []):
        qid = q.get('id') or q.get('_id')
        if qid:
            pool[qid] = q

# Add a small set of separately verified questions used to give the nine-day run
# more variety without bringing the legacy SEED questions back into production.
extras_path = Path('scripts/schedule_extras.json')
if extras_path.exists():
    extras = json.loads(extras_path.read_text(encoding='utf-8')).get('questions', [])
    for q in extras:
        qid = q.get('id') or q.get('_id')
        if not qid:
            raise SystemExit('Scheduled extra question is missing an id')
        q.setdefault('_id', qid)
        q.setdefault('scoring_version', 2)
        q.setdefault('answer_count', len(q.get('answers', [])))
        for a in q.get('answers', []):
            a.setdefault('aliases', [])
            a.setdefault('confidence', 'high')
        pool[qid] = q

# Editorial format families. No daily game may contain more than two prompts from
# the same family, so the five questions feel different even when topics overlap.
FORMAT_FAMILY = {
    **{f'e{i:03d}': 'club_league_threshold' for i in range(1, 11)},
    'e011': 'tournament_appearance', 'e012': 'tournament_appearance',
    'u001': 'club_league_window', 'u002': 'club_league_window', 'u003': 'club_league_window', 'u004': 'club_league_window',
    'u005': 'tournament_scorer', 'u006': 'club_competition_scorer', 'u007': 'dual_club', 'u008': 'manager_players',
    'u009': 'national_scorer', 'u010': 'transfer_path', 'u011': 'club_competition_scorer', 'u012': 'title_squad',
    'u013': 'national_scorer', 'u014': 'transfer_path', 'u015': 'title_squad', 'u016': 'dual_club', 'u017': 'club_cup_scorer',
    'u018': 'captain', 'u019': 'scoring_ranking', 'u020': 'club_league_threshold',
    'u031': 'hat_trick', 'u032': 'award', 'u033': 'manager', 'u035': 'award',
    'u041': 'physical_trait', 'u042': 'shirt_number', 'u045': 'family_trait', 'u046': 'career_path',
    'u048': 'national_scorer', 'u049': 'title_squad',
    'x001': 'tournament_squad', 'x002': 'league_scorer_threshold', 'x003': 'final_appearance',
}

# Freeze today as well, and rebalance the future days that leaned too heavily on
# the same prompt format. The remaining dates keep their set.
OVERRIDE_IDS = {
    '2026-09-18.json': ['u035', 'x001', 'x002', 'x003', 'u017'],
    '2026-09-22.json': ['e005', 'e006', 'u002', 'u005', 'u008'],
    '2026-09-24.json': ['e010', 'u032', 'u033', 'u049', 'u020'],
    '2026-09-25.json': ['u031', 'u004', 'u041', 'u048', 'u007'],
    '2026-09-26.json': ['u003', 'u042', 'u045', 'u046', 'u009'],
}

for filename, ids in OVERRIDE_IDS.items():
    missing = [qid for qid in ids if qid not in pool]
    if missing:
        raise SystemExit(f'{filename}: missing scheduled questions {missing}')
    payload = dict(bundle.get(filename, {}))
    payload['date'] = filename.removesuffix('.json')
    payload['questions'] = [pool[qid] for qid in ids]
    bundle[filename] = payload

# Stamp every frozen question with a format family and validate the nine-day run.
expected_files = [f'2026-09-{day:02d}.json' for day in range(18, 27)]
seen_ids = set()
for filename in expected_files:
    if filename not in bundle:
        raise SystemExit(f'Missing daily schedule {filename}')
    questions = bundle[filename].get('questions', [])
    if len(questions) != 5:
        raise SystemExit(f'{filename}: expected 5 questions')
    if sum(q.get('difficulty') == 'easy' for q in questions) != 4 or sum(q.get('difficulty') == 'medium' for q in questions) != 1:
        raise SystemExit(f'{filename}: expected 4 easy + 1 medium')
    families = []
    for q in questions:
        qid = q.get('id') or q.get('_id')
        if qid not in FORMAT_FAMILY:
            raise SystemExit(f'{filename}: no format family for {qid}')
        q['format_family'] = FORMAT_FAMILY[qid]
        q.setdefault('scoring_version', 2)
        q.setdefault('answer_count', len(q.get('answers', [])))
        tiers = {int(a.get('fame', 0)) for a in q.get('answers', [])}
        if tiers != {1, 2, 3, 4, 5, 6}:
            raise SystemExit(f'{filename}: {qid} is missing a fame tier: {tiers}')
        families.append(FORMAT_FAMILY[qid])
        if qid in seen_ids:
            raise SystemExit(f'{filename}: repeated question across run: {qid}')
        seen_ids.add(qid)
    if max(Counter(families).values()) > 2:
        raise SystemExit(f'{filename}: too many questions from one format family: {Counter(families)}')

# Write all frozen schedules.
daily = Path('daily')
daily.mkdir(exist_ok=True)
for filename, payload in bundle.items():
    (daily / filename).write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

# Ensure the frontend always prefers a frozen Amsterdam-date schedule. Legacy
# embedded SEED questions remain blocked from 19 September onward; 18 September
# is now frozen too, so they are not reached today either.
p = Path('index.html')
s = p.read_text(encoding='utf-8')
loader = r'''
let DAILY_SCHEDULE=null;
async function loadDailySchedule(){
  const day=amsterdamDay();
  try{
    const r=await fetch(`daily/${day}.json`,{cache:'no-store'});
    if(!r.ok)return null;
    const j=await r.json();
    return j?.date===day&&Array.isArray(j.questions)?j.questions:null
  }catch{return null}
}
function scheduledSet(){
  return Array.isArray(DAILY_SCHEDULE)&&DAILY_SCHEDULE.length===5?DAILY_SCHEDULE.map((q,i)=>({...q,_id:q._id||q.id||`scheduled-${amsterdamDay()}-${i}`,approved:true})):null
}
'''
if 'async function loadDailySchedule()' not in s:
    needle = 'let BANK=[];'
    if needle not in s:
        raise SystemExit('Could not find BANK declaration')
    s = s.replace(needle, needle + loader, 1)

start = s.find('function applyBank(){')
end = s.find('\n\n// ---- admin', start)
if start < 0 or end < 0:
    raise SystemExit('Could not locate applyBank block')
new_apply = r'''function applyBank(){
 const scheduled=scheduledSet();
 if(scheduled){
   Q=scheduled.map(toGame);
   scheduled.flatMap(b=>b.answers||[]).forEach(a=>{known.add(norm(a.name));knownLast.add(norm(a.name).split(' ').pop())});
   fillReport();return
 }
 const seen=new Set(),allowLegacySeed=amsterdamDay()<'2026-09-19';
 const ok=[...BANK.filter(b=>b.approved&&(b.answers||[]).length>=5),...(allowLegacySeed?SEED:[])].filter(b=>{if(seen.has(b._id))return false;seen.add(b._id);return true});
 if(ok.length>=5){Q=todaysSet(ok).map(toGame);const names=ok.flatMap(b=>b.answers.map(a=>a.name));names.forEach(n=>{known.add(norm(n));knownLast.add(norm(n).split(' ').pop())})}
 fillReport()
}'''
s = s[:start] + new_apply + s[end:]
old_boot = "(async()=>{BANK=await loadBank();applyBank();start();paint();setMeter()})();"
new_boot = "(async()=>{[BANK,DAILY_SCHEDULE]=await Promise.all([loadBank(),loadDailySchedule()]);applyBank();start();paint();setMeter()})();"
if old_boot in s:
    s = s.replace(old_boot, new_boot, 1)
elif new_boot not in s:
    raise SystemExit('Could not locate app boot sequence')
assert 'daily/${day}.json' in s
assert "allowLegacySeed=amsterdamDay()<'2026-09-19'" in s
p.write_text(s, encoding='utf-8')
