from pathlib import Path


def rep(text, old, new, label):
    if old not in text:
        raise SystemExit(f'MISSING {label}')
    print('patched', label)
    return text.replace(old, new, 1)

# ---- Game + admin stats
p = Path('index.html')
s = p.read_text(encoding='utf-8')

if "track('rejected'" not in s:
    old = """document.getElementById('f').onsubmit=e=>{e.preventDefault();const r=match(inp.value,q.answers),x=norm(inp.value);\n  if(r&&r!=='ambiguous'){track('answer_attempt',{question_id:q.id||slug(q.prompt),position:qi+1,outcome:'correct',elapsed_ms:elapsed(),answer:r.name,points:r.pts,tier:tierName(r.pts),set_id:dailySetId()});return finish(r,'correct')}\n  const outcome=r==='ambiguous'?'ambiguous':(known.has(x)||knownLast.has(x))?'wrong_player':'unrecognised';\n  track('answer_attempt',{question_id:q.id||slug(q.prompt),position:qi+1,outcome,elapsed_ms:elapsed(),input_length:inp.value.trim().length,set_id:dailySetId()});\n  msg.className='msg bad';msg.textContent=r==='ambiguous'?'More than one player fits. Add the first name.':(known.has(x)||knownLast.has(x))?'Real player, but not on this list.':\"Didn't recognise that player.\";"""
    new = """document.getElementById('f').onsubmit=e=>{e.preventDefault();const typed=inp.value,r=match(typed,q.answers),x=norm(typed);\n  if(r&&r!=='ambiguous'){track('answer_attempt',{question_id:q.id||slug(q.prompt),position:qi+1,outcome:'correct',elapsed_ms:elapsed(),answer:r.name,points:r.pts,tier:tierName(r.pts),set_id:dailySetId()});return finish(r,'correct')}\n  const matchedKnown=r==='ambiguous'||known.has(x)||knownLast.has(x);\n  const outcome=r==='ambiguous'?'ambiguous':matchedKnown?'wrong_player':'unrecognised';\n  track('answer_attempt',{question_id:q.id||slug(q.prompt),position:qi+1,outcome,elapsed_ms:elapsed(),input_length:typed.trim().length,set_id:dailySetId()});\n  track('rejected',{question_id:q.id||slug(q.prompt),prompt:q.prompt,input:typed,matched_known_player:matchedKnown,outcome,position:qi+1,set_id:dailySetId()});\n  msg.className='msg bad';msg.textContent=r==='ambiguous'?'More than one player fits. Add the first name.':matchedKnown?'Real player, but not on this list.':\"Didn't recognise that player.\";"""
    s = rep(s, old, new, 'rejected event logging')

if 'const rejectedRows=rows.filter(r=>r.name===\'rejected\')' not in s:
    marker = """  const byDay={};for(const r of rows){if(r.name!=='view')continue;const d=r.game_day||r.created_at.slice(0,10);byDay[d]=(byDay[d]||0)+1}\n"""
    insert = """  const rejectedRows=rows.filter(r=>r.name==='rejected');\n  const rejectedByQuestion=new Map();\n  for(const r of rejectedRows){const d=r.data||{},prompt=d.prompt||'Unknown question',raw=typeof d.input==='string'?d.input:'';if(!raw)continue;let qg=rejectedByQuestion.get(prompt);if(!qg){qg={total:0,items:new Map()};rejectedByQuestion.set(prompt,qg)}qg.total++;const key=raw.trim().toLocaleLowerCase();let item=qg.items.get(key);if(!item){item={label:raw,count:0,known:false};qg.items.set(key,item)}item.count++;item.known=item.known||!!d.matched_known_player}\n  const rejectedHtml=[...rejectedByQuestion.entries()].sort((a,b)=>b[1].total-a[1].total||a[0].localeCompare(b[0])).map(([prompt,g])=>{const items=[...g.items.values()].sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label)).slice(0,12);return `<details class=\"msg-card\" style=\"margin:8px 0\"><summary><b>${esc(prompt)}</b> <span class=\"mute\">· ${g.total} rejected</span></summary><div style=\"margin-top:8px\">${items.map(i=>`<div style=\"display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px solid var(--line)\"><span>${esc(i.label)}${i.known?' <span class=\"mute\">· known player</span>':''}</span><b>${i.count}</b></div>`).join('')}</div></details>`}).join('');\n\n  const byDay={};for(const r of rows){if(r.name!=='view')continue;const d=r.game_day||r.created_at.slice(0,10);byDay[d]=(byDay[d]||0)+1}\n"""
    s = rep(s, marker, insert, 'rejected grouping')

if '<h3 style="margin:18px 0 6px">Rejected answers</h3>' not in s:
    marker = """   <p class=\"mute\" style=\"font-size:12px;margin:10px 0 0\">Visitor metrics use the anonymous random <code>uc-visitor</code> browser ID. Older events without this ID are excluded.</p>\n   <h3 style=\"margin:18px 0 6px\">Visits per day</h3>\n"""
    insert = """   <p class=\"mute\" style=\"font-size:12px;margin:10px 0 0\">Visitor metrics use the anonymous random <code>uc-visitor</code> browser ID. Older events without this ID are excluded.</p>\n   <h3 style=\"margin:18px 0 6px\">Rejected answers</h3>\n   <p class=\"mute\" style=\"font-size:12px;margin:0 0 8px\">Most common refused inputs in this date range, grouped by question. “Known player” means the input matched a player name already known to the game.</p>\n   <div>${rejectedHtml||'<p class=\"mute\">No rejected answers yet.</p>'}</div>\n   <h3 style=\"margin:18px 0 6px\">Visits per day</h3>\n"""
    s = rep(s, marker, insert, 'rejected stats section')

p.write_text(s, encoding='utf-8')

# ---- Privacy copy: rejected typed inputs are now intentionally stored during testing.
pp = Path('privacy.html')
privacy = pp.read_text(encoding='utf-8')
old_priv = 'We do not intentionally store names, email addresses or the raw text of incorrect answers in analytics events.'
new_priv = 'We do not intentionally store names or email addresses in analytics events. During testing, when an answer is rejected, we store the exact typed answer together with the question so we can find missing valid answers and improve typo/name matching.'
if new_priv not in privacy:
    privacy = rep(privacy, old_priv, new_priv, 'privacy rejected-answer disclosure')
    pp.write_text(privacy, encoding='utf-8')

print('Rejected answer analytics applied')
