"""Exercise the real Duels submit handler and event sender without network writes."""
from pathlib import Path
import re
import subprocess

html = Path('duel.html').read_text(encoding='utf-8')
matcher = html[html.index('const norm=s=>'):html.index('// questions come from')]
sender = html[html.index('function track('):html.index('// signed-in players')]
submit = html[html.index('function rejectedAnswer('):html.index("$('q-skip').onclick")]
loader = html[html.index('async function loadQ('):html.index('async function pickQs(')]
js = r'''
const assert=require('node:assert/strict');
const SB_URL='https://example.invalid',SB_KEY='test',SID='session',VISITOR='visitor',DAY='2026-10-22';
let requests=[],offline=false,locks=[],locked=false,base=5,qi=1,picks=[];
const code='TEST',D={me:2},roundNo=n=>n<15?Math.floor(n/5)+1:4+n-15;
const q={id:'test-question',prompt:'Name a player',type:'player',answers:[
 {name:'Lionel Messi',pts:10},{name:'Emiliano Martinez',pts:30},{name:'Lisandro Martinez',pts:60}]};
const Q=[q,q],els={'q-form':{},'q-in':{value:'',select(){}},'q-msg':{}};
const $=id=>els[id],nope=()=>{},lock=r=>locks.push(r);
const fetch=(url,options)=>{if(offline)return Promise.reject(new Error('offline'));
 requests.push({url,body:JSON.parse(options.body)});return Promise.resolve({ok:true})};
function send(input){els['q-in'].value=input;els['q-form'].onsubmit({preventDefault(){}})}
''' + matcher + sender + submit + loader + r'''
send('Missing Player');
assert.equal(requests.length,1);
const event=requests[0].body;
assert.equal(event.name,'rejected');assert.equal(event.data.page,'duel');
assert.equal(event.data.code,code);assert.equal(event.data.slot,2);
assert.equal(event.data.question_id,q.id);assert.equal(event.data.prompt,q.prompt);
assert.equal(event.data.answer_type,'player');assert.equal(event.data.input,'Missing Player');
assert.equal(event.data.position,7);assert.equal(event.data.round,2);
assert.equal(event.data.outcome,'not_on_list');assert.equal(locks.length,0);
send('Martinez');assert.equal(requests.at(-1).body.data.outcome,'ambiguous');
picks=[['Lionel Messi',10]];
send('Messi');assert.equal(requests.at(-1).body.data.outcome,'duplicate');
picks=[];const before=requests.length;
send('Messi');assert.equal(locks.at(-1).name,'Lionel Messi');assert.equal(requests.length,before);
send('  ');assert.equal(requests.length,before);
locked=true;send('Unknown');assert.equal(requests.length,before);locked=false;
send('x'.repeat(700));assert.equal(requests.at(-1).body.data.input.length,500);
base=15;qi=0;send('Another Player');assert.equal(requests.at(-1).body.data.position,16);
assert.equal(requests.at(-1).body.data.round,4);
offline=true;send('Unknown Again');send('Messi');assert.equal(locks.length,2);
const FAME_V2={6:10};const bank=async()=>({'test-question':{id:q.id,prompt:q.prompt,answers:[{name:'Lionel Messi',fame:6}]}});
loadQ('test-question').then(loaded=>{assert.equal(loaded.id,q.id);console.log('Duels rejection logging tests passed')});
'''
subprocess.run(['node', '-e', js], check=True)

# Parse every inline script, including the complete integration around the handler.
scripts = re.findall(r'<script\b[^>]*>(.*?)</script>', html, re.S | re.I)
subprocess.run(['node', '--check'], input='\n;\n'.join(scripts), text=True, check=True)
print('Duels inline JavaScript syntax passed')
