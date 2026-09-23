from pathlib import Path
import json

# Legacy format families whose ANSWERS are clubs rather than players.
CLUB_ANSWER_FAMILIES = {
    'club_career',
    'player_club_history',
    'shared_club_history',
    'league_participation',
    'competition_participation',
    'competition_winner',
    'cup_winner',
    'promotion_history',
    'competition_stage',
}

# Editorial wording for known legacy/frozen questions. These keep the meaning
# unchanged while making the expected answer type unmistakable to players.
PROMPT_OVERRIDES = {
    'c003': 'Name a club that played in the Premier League, 2020-21 to 2026-27',
    'c009': 'Name a club that won the Europa League, 2010-2026',
    'c022': 'Name a club promoted to the Premier League, 2015-16 to 2026-27',
    'c020': 'Name a club that won the Copa del Rey, 2010 to 2026',
    'c019': 'Name a club that played in the Champions League group stage, 2020-21 to 2021-22',
    'c006': 'Name a club that reached a Champions League semi-final, 2015-16 to 2024-25',
    'r003': 'Name a club that won the Champions League, 1995–2012',
    'r013': 'Name a club that won the Premier League or LaLiga, 1995–2012',
}


def qid_of(q):
    return q.get('id') or q.get('_id') or ''


def club_prompt(prompt):
    prompt = (prompt or '').strip()
    if prompt.lower().startswith('name a club'):
        return prompt
    lower = prompt.lower()
    for verb in ('played ', 'won ', 'reached ', 'finished ', 'has ', 'was '):
        if lower.startswith(verb):
            return 'Name a club that ' + prompt[0].lower() + prompt[1:]
    if lower.startswith('promoted '):
        return 'Name a club ' + prompt[0].lower() + prompt[1:]
    # Safe fallback: preserve the original wording verbatim while making the
    # expected answer type explicit.
    return 'Name a club: ' + prompt


def normalize_question(q):
    changed = False
    qid = qid_of(q)
    family = q.get('format_family')
    answer_type = str(q.get('answer_type') or '').lower()

    if not answer_type and (family in CLUB_ANSWER_FAMILIES or str(q.get('prompt', '')).lower().startswith('name a club')):
        q['answer_type'] = 'club'
        answer_type = 'club'
        changed = True

    if answer_type == 'club':
        wanted = PROMPT_OVERRIDES.get(qid, club_prompt(q.get('prompt', '')))
        if q.get('prompt') != wanted:
            q['prompt'] = wanted
            changed = True

    return changed


def normalize_file(path):
    data = json.loads(path.read_text(encoding='utf-8'))
    changed = False
    questions = data.get('questions', []) if isinstance(data, dict) else []
    for q in questions:
        changed |= normalize_question(q)
    if changed:
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    return changed


changed_files = []
for path in sorted(Path('daily').glob('*.json')):
    if normalize_file(path):
        changed_files.append(str(path))

for path in sorted(Path('scripts').glob('question_intake_*.json')):
    if normalize_file(path):
        changed_files.append(str(path))

print('Normalized club questions:', ', '.join(changed_files) if changed_files else 'no changes')
