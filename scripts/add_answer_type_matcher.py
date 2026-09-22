from pathlib import Path
import json

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# 1) Replace the old player-only matcher with answer-type-aware matching.
start = s.find('function match(input,answers){')
end = s.find('\nlet known=', start)
if start < 0 or end < 0:
    raise SystemExit('Could not locate matcher block')

new_matcher = r'''const PERSON_ANSWER_TYPES=new Set(['player','person','manager','coach','referee']);
const ANSWER_TYPE_LABELS={player:'player',person:'person',manager:'manager',coach:'coach',referee:'referee',club:'club',country:'country',stadium:'stadium',city:'city',competition:'competition',league:'league',team:'team'};
const answerType=q=>String(q?.answer_type||'player').toLowerCase();
const isPersonAnswerType=t=>PERSON_ANSWER_TYPES.has(String(t||'player').toLowerCase());
const answerLabel=q=>ANSWER_TYPE_LABELS[answerType(q)]||'answer';
const answerPlaceholder=q=>`Type a ${answerLabel(q)}`;
function match(input,answers,type='player'){const x=norm(input);if(!x)return null;const person=isPersonAnswerType(type);
 const keys=answers.map(a=>{const n=norm(a.name),parts=n.split(' ');const al=(a.aliases||[]).map(a=>a.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()).filter(v=>v.length>=2);return{a,n,al,last:parts.length>1?parts.slice(1).join(' '):n,lastWord:parts[parts.length-1]}});
 const uniq=arr=>[...new Set(arr.map(k=>k.a))];
 let hit=uniq(keys.filter(k=>k.n===x||k.al.includes(x)));if(hit.length===1)return hit[0];if(hit.length>1)return'ambiguous';
 // Only person-like answers get surname/tail matching. Clubs, countries, stadiums, etc. must use the full name or an explicit alias.
 if(person){hit=uniq(keys.filter(k=>k.last===x||k.lastWord===x));if(hit.length===1)return hit[0];if(hit.length>1)return'ambiguous'}
 const t=v=>v.length<6?0:v.length<9?1:2;
 hit=uniq(keys.filter(k=>lev(k.n,x)<=t(k.n)||k.al.some(v=>v.length>=6&&lev(v,x)<=t(v))));if(hit.length===1)return hit[0];if(hit.length>1)return'ambiguous';
 if(person){hit=uniq(keys.filter(k=>k.last!==k.n&&k.last.length>=6&&lev(k.last,x)<=t(k.last)));if(hit.length===1)return hit[0];if(hit.length>1)return'ambiguous'}
 return null}
function registerKnownQuestion(q){const person=isPersonAnswerType(q?.answer_type||'player');for(const a of q?.answers||[]){for(const raw of [a.name,...(a.aliases||[])]){if(raw)known.add(norm(raw))}if(person&&a.name)knownLast.add(norm(a.name).split(' ').pop())}}
'''
s = s[:start] + new_matcher + s[end:]

# 2) Preserve answer_type when bank/scheduled questions become playable questions.
old = "const toGame=b=>({id:b._id,prompt:b.prompt,sub:b.subtitle||'',by:b.by||'',clash:b.clash_note||'',difficulty:b.difficulty||'unknown',scoring_version:b.scoring_version||1,answers:"
new = "const toGame=b=>({id:b._id,prompt:b.prompt,sub:b.subtitle||'',by:b.by||'',clash:b.clash_note||'',difficulty:b.difficulty||'unknown',answer_type:String(b.answer_type||'player').toLowerCase(),scoring_version:b.scoring_version||1,answers:"
if old not in s:
    if 'answer_type:String(b.answer_type' not in s:
        raise SystemExit('Could not locate toGame mapper')
else:
    s = s.replace(old, new, 1)

# 3) Pass the type into the matcher and keep known-last-name logic person-only.
s = s.replace("r=match(typed,q.answers),x=norm(typed);", "r=match(typed,q.answers,q.answer_type),x=norm(typed);", 1)
s = s.replace("const matchedKnown=r==='ambiguous'||known.has(x)||knownLast.has(x);", "const matchedKnown=r==='ambiguous'||known.has(x)||(isPersonAnswerType(q.answer_type)&&knownLast.has(x));", 1)

# 4) Make the gameplay copy type-aware.
s = s.replace('<input id="in" placeholder="Type a player" aria-label="Your answer">', '<input id="in" placeholder="${answerPlaceholder(q)}" aria-label="Your ${answerLabel(q)} answer">', 1)
old_msg = "msg.className='msg bad';msg.textContent=r==='ambiguous'?'More than one player fits. Add the first name.':matchedKnown?'Real player, but not on this list.':\"Didn't recognise that player.\";"
new_msg = "msg.className='msg bad';msg.textContent=r==='ambiguous'?(isPersonAnswerType(q.answer_type)?'More than one person fits. Add more of the name.':'More than one answer fits. Be more specific.'):matchedKnown?`Recognised ${answerLabel(q)}, but not on this list.`:`Didn't recognise that ${answerLabel(q)}.`;"
if old_msg not in s:
    if 'Recognised ${answerLabel(q)}' not in s:
        raise SystemExit('Could not locate rejected-answer message')
else:
    s = s.replace(old_msg, new_msg, 1)

# 5) Register known names/aliases by question type so club/stadium tail words never become pseudo-surnames.
old_sched = "scheduled.flatMap(b=>b.answers||[]).forEach(a=>{known.add(norm(a.name));knownLast.add(norm(a.name).split(' ').pop())});"
if old_sched in s:
    s = s.replace(old_sched, "scheduled.forEach(registerKnownQuestion);", 1)
old_bank = "if(ok.length>=5){Q=todaysSet(ok).map(toGame);const names=ok.flatMap(b=>b.answers.map(a=>a.name));names.forEach(n=>{known.add(norm(n));knownLast.add(norm(n).split(' ').pop())})}"
if old_bank in s:
    s = s.replace(old_bank, "if(ok.length>=5){Q=todaysSet(ok).map(toGame);ok.forEach(registerKnownQuestion)}", 1)

# 6) Include answer_type in analytics so rejected-answer reviews have context.
old_track = "difficulty:q.difficulty||'unknown',answer_count:q.answers.length,set_id:dailySetId()"
if old_track in s:
    s = s.replace(old_track, "difficulty:q.difficulty||'unknown',answer_type:q.answer_type||'player',answer_count:q.answers.length,set_id:dailySetId()", 1)

# 7) Generic landing/report wording now that answers can be clubs, countries, stadiums, etc.
s = s.replace('Name the player nobody else thinks of.', 'Find the answer nobody else thinks of.')
s = s.replace('<h3>Name one player</h3><p>${TIME} seconds. One player.</p>', '<h3>Name one answer</h3><p>${TIME} seconds. One answer.</p>')
s = s.replace('Player <span class="opt">(if an answer is missing or wrong)</span>', 'Answer <span class="opt">(if an answer is missing or wrong)</span>')

# 8) Warn admin imports that omit answer_type. Legacy data still defaults to player for backwards compatibility.
needle = "for(const q of qs){if(!q.prompt||!Array.isArray(q.answers)){warn.push('skipped one without prompt/answers');continue}"
if needle in s and 'missing answer_type; defaults to player' not in s:
    repl = needle + "\n  if(!q.answer_type)warn.push(`\\\"${q.prompt.slice(0,40)}…\\\" missing answer_type; defaults to player`);"
    s = s.replace(needle, repl, 1)

p.write_text(s, encoding='utf-8')

# 9) Tag the existing RETRO inventory explicitly. Club-answer questions must not inherit player surname matching.
retro_files = [
    Path('scripts/question_intake_2026-09-22_retro_r001_r005.json'),
    Path('scripts/question_intake_2026-09-22_retro_r006_r010.json'),
    Path('scripts/question_intake_2026-09-22_retro_r011_r015.json'),
    Path('scripts/question_intake_2026-09-22_retro_r016_r020.json'),
]
club_ids = {'r001','r002','r003','r011','r012','r013'}
for path in retro_files:
    if not path.exists():
        raise SystemExit(f'Missing retro inventory file: {path}')
    data = json.loads(path.read_text(encoding='utf-8'))
    for q in data.get('questions', []):
        qid = q.get('id') or q.get('_id')
        q['answer_type'] = 'club' if qid in club_ids else 'player'
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

print('Answer-type-aware matching and RETRO answer types applied')
