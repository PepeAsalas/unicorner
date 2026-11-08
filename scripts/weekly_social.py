#!/usr/bin/env python3
"""Monday email to the person who makes the Instagram post: last week's Hall of Fame, Screamer and numbers.

One Instagram post with 3 pictures, made from the Canva templates "Hall of Fame", "Screamer" and "Numbers".
The data comes from the Supabase function social_weekly (supabase/social_weekly.sql); kit names and file numbers
come from the KITS list in index.html, so they match the kits zip (NN-id-mood.png).

Environment (GitHub secrets, never in the repo, which is public):
  SUPABASE_SERVICE_ROLE_KEY  reads the data
  RESEND_API_KEY             sends the email
  SOCIAL_EMAIL_TO            who gets it (comma-separated for several)
  SOCIAL_EMAIL_FROM          optional, default "Unicorner <hello@unicornergame.lol>" (must be on a domain verified in Resend)
Usage: python scripts/weekly_social.py [--dry-run] [YYYY-MM-DD monday of the week]
--dry-run prints the email instead of sending it.
"""
import html
import json
import os
import re
import sys
import urllib.request
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SB_URL = 'https://yujhjepukzdahsppntua.supabase.co'
FALLBACK = ['gold', 'ice', 'fire']  # when a player wears no kit: gold, silver and bronze look


def kits():
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    block = src[src.index('const KITS=['):]
    block = block[:block.index('\n];')]
    found = re.findall(r"\{id:'([^']+)',en:(?:'((?:[^'\\]|\\.)*)'|\"([^\"]*)\")", block)
    return {kid: (f'{i:02d}', (a or b).replace("\\'", "'")) for i, (kid, a, b) in enumerate(found, 1)}


def fetch(week):
    key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    req = urllib.request.Request(SB_URL + '/rest/v1/rpc/social_weekly', method='POST',
                                 data=json.dumps({'p_week': week} if week else {}).encode(),
                                 headers={'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def n(x):
    return f'{x:,}' if isinstance(x, int) else str(x)


def build(d, K):
    w0, w1 = date.fromisoformat(d['week_start']), date.fromisoformat(d['week_end'])
    wk = d['week_number']
    span = f"{w0.day} {w0:%b}–{w1.day} {w1:%b}" if w0.month != w1.month else f"{w0.day}–{w1.day} {w1:%b}"
    lines, warn = [], []
    lines.append(f'Hi Laken! Here is everything for this Monday\'s post: ONE post with 3 pictures, in this order.')
    lines.append('Templates are in Canva. Kit pictures are in the kits folder (file names below).')
    lines.append('')
    lines.append(f'PICTURE 1 · HALL OF FAME (Canva: "Hall of Fame")')
    lines.append(f'  Week line: WEEK {wk} · DAILY 5')
    top = d.get('top3') or []
    if len(top) < 3:
        warn.append('fewer than 3 players with a nickname scored last week')
    for i, p in enumerate(top):
        kid = p.get('kit') or 'classic'
        note = ''
        if kid in ('classic', 'og') or kid not in K:
            kid, note = FALLBACK[i], ' (no kit chosen, use this one)'
        num, name = K[kid]
        mood = 'wow' if i == 0 else 'happy'
        lines.append(f"  #{i + 1}  {p['nickname']}  ·  {n(p['points'])} PTS  ·  kit: {name}{note}  ·  file: {num}-{kid}-{mood}.png")
    lines.append('')
    s = d.get('screamer')
    lines.append('PICTURE 2 · SCREAMER OF THE WEEK (Canva: "Screamer")')
    if s:
        lines.append(f"  Week line: WEEK {wk} · DAILY 5")
        lines.append(f"  Question: {s['question']}")
        lines.append(f"  Answer: {s['answer'].upper()}")
        lines.append(f"  Line: Only 1 in {s['one_in']} players said it")
    else:
        warn.append('no Screamer with enough players last week: skip picture 2')
        lines.append('  (not enough data this week: skip this picture)')
    lines.append('')
    m = d.get('numbers') or {}
    h = m.get('hardest') or {}
    lines.append('PICTURE 3 · THE WEEK IN NUMBERS (Canva: "Numbers")')
    lines.append(f"  Week line: WEEK {wk} · DAILY 5")
    lines.append(f"  {n(m.get('games', 0))}  games played")
    lines.append(f"  {n(m.get('average_score', 0))}  average score out of 500")
    lines.append(f"  {n(m.get('screamers', 0))}  Screamers found")
    if h:
        lines.append(f"  {h['pct_right']}%  got {h['weekday']}'s Q{h['position']} right")
        lines.append(f"  Hardest question: {h['question']}")
    lines.append('')
    champ = top[0]['nickname'] if top else 'our champion'
    rest = ' and '.join(p['nickname'] for p in top[1:]) if len(top) > 1 else ''
    cap = f"Week {wk} belongs to {champ} 👑" + (f" with {rest} right behind." if rest else '.')
    if s:
        cap += f" Screamer of the week: {s['answer']}, only 1 in {s['one_in']} said it 🔥"
    cap += ' Can you top it? Link in bio 🦄'
    lines.append('CAPTION (copy and paste)')
    lines.append('  ' + cap)
    lines.append('  #football #footballquiz #footballtrivia #soccer #unicorner')
    lines.append('')
    lines.append('Nicknames are written exactly as players chose them: keep capitals, numbers and underscores.')
    if warn:
        lines.insert(0, '⚠️ Heads up: ' + '; '.join(warn) + '.\n')
    subject = f'🦄 Unicorner Monday post · Week {wk} ({span})'
    text = '\n'.join(lines)
    body = '<div style="font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#1d1a2b;max-width:620px">' + ''.join(
        (f'<h3 style="margin:22px 0 6px;font-size:16px">{html.escape(l)}</h3>' if l.startswith(('PICTURE', 'CAPTION'))
         else f'<div style="padding-left:12px">{html.escape(l.strip())}</div>' if l.startswith('  ')
         else f'<p style="margin:6px 0">{html.escape(l)}</p>' if l else '') for l in lines) + '</div>'
    return subject, text, body


def send(subject, text, body):
    to = [x.strip() for x in os.environ['SOCIAL_EMAIL_TO'].split(',') if x.strip()]
    sender = os.environ.get('SOCIAL_EMAIL_FROM') or 'Unicorner <hello@unicornergame.lol>'
    req = urllib.request.Request('https://api.resend.com/emails', method='POST',
                                 data=json.dumps({'from': sender, 'to': to, 'subject': subject, 'text': text, 'html': body}).encode(),
                                 headers={'Authorization': 'Bearer ' + os.environ['RESEND_API_KEY'], 'Content-Type': 'application/json',
                                          'User-Agent': 'unicorner-weekly-social'})
    with urllib.request.urlopen(req, timeout=60) as r:
        print('sent', r.status)


def main():
    args = [a for a in sys.argv[1:] if a != '--dry-run']
    d = fetch(args[0] if args else None)
    subject, text, body = build(d, kits())
    if '--dry-run' in sys.argv:
        print(subject + '\n\n' + text)
    else:
        send(subject, text, body)


if __name__ == '__main__':
    main()
