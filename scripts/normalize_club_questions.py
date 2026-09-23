from pathlib import Path
import json
import re

# Legacy format families where the expected answer is not a player. New questions
# should always provide answer_type explicitly; these mappings keep older/frozen
# inventory safe and correctly labelled too.
FAMILY_ANSWER_TYPES = {
    # clubs
    'club_career': 'club',
    'player_club_history': 'club',
    'shared_club_history': 'club',
    'league_participation': 'club',
    'competition_participation': 'club',
    'competition_winner': 'club',
    'cup_winner': 'club',
    'promotion_history': 'club',
    'competition_stage': 'club',
    # managers
    'manager': 'manager',
    'club_manager_history': 'manager',
    'competition_winning_manager': 'manager',
    # countries
    'tournament_participant_country': 'country',
    'tournament_semifinal_country': 'country',
    # stadiums
    'competition_final_stadium': 'stadium',
}

TYPE_LABELS = {
    'club': 'club',
    'country': 'country',
    'stadium': 'stadium',
    'manager': 'manager',
    'coach': 'coach',
    'referee': 'referee',
    'city': 'city',
    'competition': 'competition',
    'league': 'league',
    'team': 'team',
}

PERSON_TYPES = {'manager', 'coach', 'referee'}

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
    'u033': 'Name a manager who managed a Premier League match in 2024-25',
}


def qid_of(q):
    return q.get('id') or q.get('_id') or ''


def type_is_explicit(prompt, answer_type):
    """True when the opening 'Name a ...' phrase already makes the type clear."""
    label = TYPE_LABELS.get(answer_type, answer_type)
    text = (prompt or '').strip().lower()
    if not text.startswith(('name a ', 'name an ')):
        return False
    # Allow useful modifiers: "Name a permanent Chelsea manager ...".
    opening = text[:60]
    return re.search(rf'\b{re.escape(label)}\b', opening) is not None


def explicit_prompt(prompt, answer_type):
    prompt = (prompt or '').strip()
    if not prompt or answer_type not in TYPE_LABELS:
        return prompt
    if type_is_explicit(prompt, answer_type):
        return prompt

    label = TYPE_LABELS[answer_type]
    lower = prompt.lower()
    connector = 'who' if answer_type in PERSON_TYPES else 'that'

    # Keep the original football criterion intact; just make the requested
    # answer type explicit. A few common noun/participle forms read better
    # without "that/who".
    if answer_type == 'club' and lower.startswith('promoted '):
        return 'Name a club ' + prompt[0].lower() + prompt[1:]

    verb_starts = (
        'played ', 'won ', 'reached ', 'finished ', 'has ', 'was ', 'were ',
        'hosted ', 'managed ', 'coached ', 'refereed ', 'signed ', 'scored ',
        'qualified ', 'appeared ', 'featured ', 'competed ', 'left ', 'joined ',
    )
    if lower.startswith(verb_starts):
        return f'Name a {label} {connector} ' + prompt[0].lower() + prompt[1:]

    # Safe fallback: preserve the complete original criterion verbatim.
    return f'Name a {label}: ' + prompt


def normalize_question(q):
    changed = False
    qid = qid_of(q)
    family = str(q.get('format_family') or '').lower()
    answer_type = str(q.get('answer_type') or '').lower()

    inferred = FAMILY_ANSWER_TYPES.get(family)
    if not answer_type and inferred:
        q['answer_type'] = inferred
        answer_type = inferred
        changed = True

    # Also recover obvious typed prompts in legacy data that predate answer_type.
    if not answer_type:
        prompt_lower = str(q.get('prompt', '')).lower()
        for candidate in TYPE_LABELS:
            if type_is_explicit(prompt_lower, candidate):
                q['answer_type'] = candidate
                answer_type = candidate
                changed = True
                break

    # Player remains the backwards-compatible default and keeps the game's
    # natural player-question wording. Every other supported type is explicit.
    if answer_type in TYPE_LABELS:
        wanted = PROMPT_OVERRIDES.get(qid, explicit_prompt(q.get('prompt', ''), answer_type))
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

print('Normalized typed questions:', ', '.join(changed_files) if changed_files else 'no changes')
