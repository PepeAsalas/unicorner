from pathlib import Path
import base64
import gzip
import json

payload_dir = Path('scripts/schedule_payload')
encoded = ''.join((payload_dir / f'part{i}.txt').read_text(encoding='utf-8').strip() for i in range(1, 6))
bundle = json.loads(gzip.decompress(base64.b64decode(encoded)).decode('utf-8'))

daily = Path('daily')
daily.mkdir(exist_ok=True)
for filename, payload in bundle.items():
    (daily / filename).write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

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
