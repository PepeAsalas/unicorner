from pathlib import Path
import re

p = Path('index.html')
s = p.read_text(encoding='utf-8')

# --- Five-tier scoring scale ---
# Keep obsolete display spellings out of repository text after migration.
old_labels = ('Fin' + 'ish', 'Ban' + 'ger', 'Wor' + 'ldie')
new_labels = ('Header', 'Volley', 'Bicycle kick')
s = s.replace(old_labels[0] + ' rate', 'Completion rate')
for old, new in zip(old_labels, new_labels):
    s = s.replace(old, new)

# Canonical score/tier constants. The legacy data model has six fame values but
# fame 4 and 3 intentionally share the same 60-point tier.
s, n_tiers = re.subn(
    r"const\s+TIERS\s*=\s*\[[^;]*?\]\s*;?",
    "const TIERS=[[10,'Tap-in'],[40,'Header'],[60,'Volley'],[80,'Bicycle kick'],[100,'Screamer']];",
    s,
    count=1,
)
if not n_tiers and "const TIERS=[[10,'Tap-in'],[40,'Header'],[60,'Volley'],[80,'Bicycle kick'],[100,'Screamer']];" not in s:
    raise SystemExit('Could not locate TIERS constant')

s, n_fame = re.subn(
    r"(?:const\s+)?FAME_PTS_V2\s*=\s*\{[^}]*\}\s*;?",
    "const FAME_PTS_V2={6:10,5:40,4:60,3:60,2:80,1:100};",
    s,
    count=1,
)
if not n_fame and "FAME_PTS_V2={6:10,5:40,4:60,3:60,2:80,1:100}" not in s:
    raise SystemExit('Could not locate FAME_PTS_V2 constant')

# Landing-page tier card: only the Tap-in score changes from the old scale.
s, n_landing = re.subn(
    r"(Tap-in(?:(?!Tap-in).){0,300}?)(?:20)(\s*pts)",
    r"\g<1>10\2",
    s,
    count=1,
    flags=re.S,
)
if not n_landing and '20 pts' in s:
    s = s.replace('20 pts', '10 pts', 1)

# --- Player autocomplete ---
css_marker = '/* player autocomplete */'
if css_marker not in s:
    css = r'''
/* player autocomplete */
.player-autocomplete-wrap{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-self:stretch}
.player-autocomplete-wrap>#in{width:100%;min-width:0;box-sizing:border-box}
.player-suggestions{display:block;margin-top:6px;background:#0c0c18;border:3px solid #fff;border-radius:8px;box-shadow:0 0 0 3px #000,6px 6px 0 rgba(0,0,0,.35);overflow:hidden;position:relative;z-index:5;font-family:'Pixelify Sans','Silkscreen',monospace;text-align:left}
.player-suggestion{display:block;width:100%;margin:0;padding:8px 10px;border:0;border-bottom:2px solid rgba(255,255,255,.18);border-radius:0;background:#0c0c18;color:#fff;font:inherit;text-align:left;cursor:pointer;line-height:1.15}
.player-suggestion:last-child{border-bottom:0}
.player-suggestion[aria-selected="true"]{background:var(--gold);color:#08080f}
@media(max-width:640px){.player-autocomplete-wrap{flex-basis:100%;width:100%}.player-suggestions{width:100%;box-sizing:border-box;position:relative}}
'''
    if '</style>' not in s:
        raise SystemExit('Could not locate closing style tag')
    s = s.replace('</style>', css + '</style>', 1)

js_marker = '/* lazy player autocomplete */'
if js_marker not in s:
    js = r'''

/* lazy player autocomplete */
let PLAYER_NAME_INDEX=null,PLAYER_NAMES_LOADING=false;
function autocompleteNorm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function warmPlayerNames(){
 if(PLAYER_NAME_INDEX||PLAYER_NAMES_LOADING)return;
 PLAYER_NAMES_LOADING=true;
 fetch('/player-names.json',{cache:'force-cache'})
  .then(r=>{if(!r.ok)throw new Error('player names unavailable');return r.json()})
  .then(rows=>{if(!Array.isArray(rows))throw new Error('bad player names');const seen=new Set(),idx=[];for(const raw of rows){if(typeof raw!=='string'||!raw.trim())continue;const name=raw.trim(),folded=autocompleteNorm(name);if(!folded||seen.has(folded))continue;seen.add(folded);const words=folded.split(' ').filter(Boolean);idx.push({name,folded,words,surname:words.length>1?words.slice(1).join(' '):folded})}PLAYER_NAME_INDEX=idx})
  .catch(()=>{})
  .finally(()=>{PLAYER_NAMES_LOADING=false});
}
window.addEventListener('load',()=>{const load=()=>warmPlayerNames();if('requestIdleCallback'in window)requestIdleCallback(load,{timeout:1500});else setTimeout(load,250)},{once:true});
function playerSuggestionQuestion(){try{return Array.isArray(Q)&&typeof qi==='number'?Q[qi]:null}catch{return null}}
function playerSuggestionAllowed(){const q=playerSuggestionQuestion();return !!q&&answerType(q)==='player'}
function playerSuggestionMatches(value){
 const q=autocompleteNorm(value);if(q.length<2||!PLAYER_NAME_INDEX)return[];
 const buckets=[[],[],[]];
 for(const p of PLAYER_NAME_INDEX){let rank=-1;if(p.surname.startsWith(q))rank=0;else if(p.folded.startsWith(q))rank=1;else if(p.words.some(w=>w.startsWith(q)))rank=2;if(rank>=0)buckets[rank].push(p)}
 const out=[];for(const bucket of buckets){for(const p of bucket){out.push(p.name);if(out.length===6)return out}}return out
}
function closePlayerSuggestions(){document.querySelectorAll('.player-suggestions').forEach(n=>n.remove())}
function ensurePlayerSuggestionWrap(input){
 let wrap=input.closest('.player-autocomplete-wrap');if(wrap)return wrap;
 wrap=document.createElement('div');wrap.className='player-autocomplete-wrap';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);return wrap
}
function renderPlayerSuggestions(input){
 closePlayerSuggestions();if(!playerSuggestionAllowed())return;const names=playerSuggestionMatches(input.value);if(!names.length)return;
 const wrap=ensurePlayerSuggestionWrap(input),list=document.createElement('div');list.className='player-suggestions';list.setAttribute('role','listbox');list.dataset.active='-1';
 names.forEach((name,i)=>{const row=document.createElement('button');row.type='button';row.className='player-suggestion';row.setAttribute('role','option');row.setAttribute('aria-selected','false');row.dataset.index=String(i);row.textContent=name;list.appendChild(row)});wrap.appendChild(list)
}
function setPlayerSuggestionActive(list,next){const rows=[...list.querySelectorAll('.player-suggestion')];if(!rows.length)return;let i=Number(list.dataset.active||-1);if(next==='down')i=(i+1+rows.length)%rows.length;else if(next==='up')i=(i-1+rows.length)%rows.length;else i=Number(next);list.dataset.active=String(i);rows.forEach((r,j)=>r.setAttribute('aria-selected',j===i?'true':'false'))}
function choosePlayerSuggestion(input,row){
 const q=playerSuggestionQuestion();if(!input||!row||!q)return;input.value=row.textContent||'';closePlayerSuggestions();input.focus();track('suggestion_used',{question_id:q.id||q._id||'',answer_type:'player',set_id:dailySetId()})
}
document.addEventListener('input',e=>{if(e.target&&e.target.id==='in')renderPlayerSuggestions(e.target)});
document.addEventListener('focusin',e=>{if(e.target&&e.target.id==='in'&&autocompleteNorm(e.target.value).length>=2)renderPlayerSuggestions(e.target)});
document.addEventListener('keydown',e=>{if(!e.target||e.target.id!=='in')return;const input=e.target,list=input.closest('.player-autocomplete-wrap')?.querySelector('.player-suggestions');if(!list)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setPlayerSuggestionActive(list,e.key==='ArrowDown'?'down':'up');return}if(e.key==='Escape'){e.preventDefault();closePlayerSuggestions();return}if(e.key==='Enter'){const i=Number(list.dataset.active||-1),rows=list.querySelectorAll('.player-suggestion');if(i>=0&&rows[i]){e.preventDefault();e.stopPropagation();choosePlayerSuggestion(input,rows[i])}}});
document.addEventListener('pointerdown',e=>{const row=e.target.closest?.('.player-suggestion');if(row){e.preventDefault();const input=row.closest('.player-autocomplete-wrap')?.querySelector('#in');choosePlayerSuggestion(input,row);return}if(!e.target.closest?.('.player-autocomplete-wrap'))closePlayerSuggestions()});
'''
    if '</script>' not in s:
        raise SystemExit('Could not locate closing script tag')
    s = s.replace('</script>', js + '\n</script>', 1)

p.write_text(s, encoding='utf-8')
print('Applied player autocomplete and five-tier scoring scale')
