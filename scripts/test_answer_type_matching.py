from pathlib import Path
import subprocess

s = Path('index.html').read_text(encoding='utf-8')

# Pull the actual matcher helpers out of index.html so the tests exercise deployed logic.
norm_start = s.find('const norm=s=>')
lev_start = s.find('function lev(', norm_start)
tol_start = s.find('const tol=', lev_start)
matcher_start = s.find('const PERSON_ANSWER_TYPES=', tol_start)
known_start = s.find('\nlet known=', matcher_start)
if min(norm_start, lev_start, tol_start, matcher_start, known_start) < 0:
    raise SystemExit('Could not extract matcher code from index.html')

norm_src = s[norm_start:lev_start]
lev_src = s[lev_start:tol_start]
matcher_src = s[matcher_start:known_start]

# registerKnownQuestion refers to these globals but the matching tests do not call it.
js = norm_src + '\n' + lev_src + '\nlet known=new Set(),knownLast=new Set();\n' + matcher_src + r'''
function ok(cond,msg){if(!cond){throw new Error(msg)}}
function name(x){return x&&x!=='ambiguous'?x.name:x}

const player=[{name:'Lautaro Martínez',aliases:['Lautaro']}];
ok(name(match('Martinez',player,'player'))==='Lautaro Martínez','player surname should match');
ok(name(match('Lautaro',player,'player'))==='Lautaro Martínez','player alias should match');

const country=[{name:'South Korea',aliases:[]}];
ok(match('Korea',country,'country')===null,'country tail word must not auto-match');
ok(name(match('South Kora',country,'country'))==='South Korea','country full-name typo tolerance should work');
country[0].aliases=['Korea'];
ok(name(match('Korea',country,'country'))==='South Korea','explicit country alias should work');

const stadium=[{name:'Allianz Arena',aliases:[]}];
ok(match('Arena',stadium,'stadium')===null,'stadium generic tail word must not auto-match');
ok(name(match('Allianz Aren',stadium,'stadium'))==='Allianz Arena','stadium full-name typo tolerance should work');

const club=[{name:'Manchester City',aliases:[]}];
ok(match('City',club,'club')===null,'club last word must not auto-match');
club[0].aliases=['City'];
ok(name(match('City',club,'club'))==='Manchester City','explicit club alias should work');

const manager=[{name:'Pep Guardiola',aliases:[]}];
ok(name(match('Guardiola',manager,'manager'))==='Pep Guardiola','manager surname should match');

const unknown=[{name:'Allianz Arena',aliases:[]}];
ok(match('Arena',unknown,'venue')===null,'unknown future answer types should default to strict matching');

console.log('answer_type matcher regression tests passed');
'''
subprocess.run(['node', '-e', js], check=True)

# Structural safety checks for the rest of the integration.
assert "answer_type:String(b.answer_type||'player').toLowerCase()" in s
assert "match(typed,q.answers,q.answer_type)" in s
assert "isPersonAnswerType(q.answer_type)&&knownLast.has(x)" in s
assert "placeholder=\"${answerPlaceholder(q)}\"" in s
assert "answer_type:q.answer_type||'player'" in s
print('answer_type integration checks passed')
