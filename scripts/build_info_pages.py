#!/usr/bin/env python3
"""Build about.html, contact.html and how-to-play.html in the same look as privacy.html.

Static pages with real text about the site, for players and for reviewers (AdSense, search engines).
Run after editing the text below; it rewrites the three files and adds them to sitemap.xml.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMAIL = 'joseasalasnl@gmail.com'

head_src = open(os.path.join(ROOT, 'privacy.html'), encoding='utf-8').read()
STYLE = re.search(r'<style>.*?</style>', head_src, re.S).group(0)

FOOT = '''<p class="small" style="margin-top:28px">
<a href="/about.html">About</a> · <a href="/how-to-play.html">How to play</a> · <a href="/contact.html">Contact</a> ·
<a href="/answers/">Past answers</a> · <a href="/privacy.html">Privacy</a> · <a href="/terms.html">Terms</a></p>'''


def page(slug, title, desc, body):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Unicorner</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://unicornergame.lol/{slug}">
{STYLE}
</head>
<body><a class="quick-home-x" href="./" aria-label="Back to home" title="Back to home">×</a><div class="wrap">
<div class="top"><div class="brand">🦄 Unicorner</div><a class="back" href="./">Back to game</a></div>
<main class="card">
{body}
{FOOT}
</main></div></body></html>
'''


ABOUT = f'''<h1>About Unicorner</h1>
<p>Unicorner is a free football trivia site with a new game every day. The name comes from the idea at its heart:
the best answer isn't the one everybody knows, it's the rare one, the unicorn. Name a player half the world has
forgotten and you score more than with the obvious pick.</p>

<h2>What you can play</h2>
<ul>
<li><strong>Daily 5:</strong> five football questions a day, 30 seconds each. Every question has many right answers, and the rarer yours is, the more it scores.</li>
<li><strong>Rosco:</strong> a daily football alphabet. One clue per letter, five minutes on the clock.</li>
<li><strong>Millions:</strong> start with 1,000,000 and spread it over the answers to eight questions. Only the money on the right answer stays.</li>
<li><strong>Duels:</strong> one-on-one matches against a friend or another player. Rare answers hit harder.</li>
<li><strong>Chairman:</strong> an idle game where you build a football club from a muddy pitch to a golden stadium.</li>
<li><strong>Infinity:</strong> an optional paid mode with every past daily question and every past Rosco and Millions game.</li>
</ul>
<p>Everything is in English and Spanish. The daily games are free and always will be.</p>

<h2>How the questions are made</h2>
<p>Every question is written for Unicorner and checked against public football records: league tables, cup finals,
squad lists and award winners. Each daily question comes with the full list of valid answers, the names people
usually type for them (nicknames, surnames, spellings with and without accents), and how well known each answer is,
which decides how many points it is worth.</p>
<p>We also list the "trap" answers people often give that are wrong, with a short explanation, so the game can tell
you why. Players report mistakes through the game, and we read every report: wrong or missing answers are fixed,
usually within a day. You can see the questions and every accepted answer from recent days on the
<a href="/answers/">past answers page</a>.</p>

<h2>Who makes it</h2>
<p>Unicorner is an independent project made and run by Pepo, a football fan from Madrid, with no club, league or
betting company behind it. It is paid for by a few ads and by the players who choose Infinity mode.</p>

<h2>Get in touch</h2>
<p>Questions, ideas, corrections or partnership requests: see the <a href="/contact.html">contact page</a> or email
<a href="mailto:{EMAIL}">{EMAIL}</a>.</p>
<p>Follow Unicorner on <a href="https://www.instagram.com/unicornergame.lol/">Instagram</a>, <a href="https://www.tiktok.com/@unicornergame.lol">TikTok</a> and <a href="https://www.reddit.com/r/Unicorner_Game/">Reddit</a>.</p>'''

CONTACT = f'''<h1>Contact</h1>
<p>The quickest way to reach us is by email: <a href="mailto:{EMAIL}">{EMAIL}</a>. We read everything and usually
reply within two working days.</p>

<h2>What to write about</h2>
<ul>
<li><strong>A wrong or missing answer:</strong> tell us the date, the game and the answer. You can also use the
report button inside the game, which sends us the question automatically.</li>
<li><strong>Your account, rankings or leagues:</strong> include the email address you signed in with.</li>
<li><strong>Infinity mode payments, refunds or cancelling:</strong> see the <a href="/terms.html">terms</a>, or email
us with the email address you paid with. Monthly players can also cancel themselves from the link in Infinity mode.</li>
<li><strong>Privacy:</strong> to see or delete your data, email us; the <a href="/privacy.html">privacy policy</a>
explains what we keep and why.</li>
<li><strong>Question ideas, partnerships and press:</strong> always welcome.</li>
</ul>

<h2>About the site</h2>
<p>Unicorner is an independent football trivia site at unicornergame.lol. Read more on the
<a href="/about.html">about page</a>.</p>'''

HOW = '''<h1>How to play Unicorner</h1>
<p>Unicorner has a few different games. The Daily 5, Rosco and Millions are new every day at midnight
(Amsterdam time), and everyone in the world gets the same questions. Duels and Chairman can be played any time.</p>

<h2>Daily 5</h2>
<p>Five football questions, 30 seconds each. Every question has lots of correct answers, for example
"Name a player who won the Golden Boy award". Type one answer before the clock runs out.</p>
<p>The rarer your answer, the more it scores. Each answer is worth one of five shots:</p>
<ul>
<li><strong>Tap-in, 10 points:</strong> the answer almost everybody gives.</li>
<li><strong>Header, 30 points:</strong> well known.</li>
<li><strong>Volley, 60 points:</strong> a good pick.</li>
<li><strong>Bicycle kick, 85 points:</strong> a deep cut.</li>
<li><strong>Screamer, 100 points:</strong> a real unicorn, an answer very few people would think of.</li>
</ul>
<p>A wrong answer or no answer scores 0. The best possible day is 500. After the game you can see what you scored,
how you compare with everyone else who played, and every answer you could have given. Keep playing day after day
to build a streak and unlock new kits for your unicorn.</p>
<p>Sign in (free, with Google or an email link) to appear on the global ranking and to make private leagues with friends.</p>

<h2>Rosco</h2>
<p>A football alphabet. There is one clue for each letter, for example "A: Dutch club from Amsterdam". The answer
starts with that letter. Some letters are purple: for those the answer only has to <em>contain</em> the letter.</p>
<p>You have five minutes in total. Type the answer, or press Pass to come back to that letter later. Tap any letter on
the wheel to jump to it. Stuck? The Hint button shows the first two letters and the length of an answer, and costs
15 seconds. For players, the surname is enough, and for clubs the first word usually is. Your score is the number of
letters you got right.</p>

<h2>Millions</h2>
<p>You start with 1,000,000. Each of the eight questions shows a few possible answers. Spread your money over them with
the + and − buttons, then press Lock it in. The trapdoors under the wrong answers open, and only the money on the right
answer stays with you for the next question.</p>
<p>You must always leave at least one answer empty, so you can never cover every option. Questions start with four
answers and drop to three and then two. You have 60 seconds per question; any money you haven't placed when time runs
out goes on the answer you backed most. Keep as much of the million as you can to the end.</p>

<h2>Duels</h2>
<p>A one-on-one match against a friend or another player. Create a duel and send the link, search for a player by
nickname, or use Quick match to be paired with someone. Both players start on 300 HP and answer the same football
questions, each on their own time.</p>
<p>Every answer you get right hits your rival for the points it is worth, so rare answers hit harder. If you both give
the same answer, it is blocked and nobody takes damage. After each round you watch the battle. The duel ends with a KO
at 0 HP, or after 15 questions, when the higher HP wins. If it is still level, it goes to extra time, one question at a time:
if you both get it right and are still level, the faster answer wins. You can
choose how many questions per round and how many seconds per question when you create a duel. Duels open once you have
played the day's Daily 5.</p>

<h2>Chairman</h2>
<p>An idle football club game. Kick the unicorn to earn money, then spend it on your club: better pitches, stands,
staff and finally a golden stadium. The club keeps earning while you are away.</p>

<h2>Infinity mode</h2>
<p>An optional paid mode for players who don't want to wait for tomorrow. It unlocks every question from past Daily 5
games, shuffled, plus every past Rosco and Millions game. Archive games don't count for the rankings. The daily games
stay free.</p>

<h2>Spotted a mistake?</h2>
<p>Use the report button in the game, or write to us from the <a href="/contact.html">contact page</a>. We fix
wrong and missing answers quickly.</p>'''

PAGES = [
    ('about.html', 'About', 'Unicorner is a free daily football trivia site where rare answers score more. Who makes it and how the questions are written and checked.', ABOUT),
    ('contact.html', 'Contact', 'How to contact Unicorner, the free daily football trivia game: answers, accounts, payments, privacy and ideas.', CONTACT),
    ('how-to-play.html', 'How to play', 'How to play every Unicorner game: the Daily 5, Rosco, Millions, Duels, Chairman and Infinity mode. Rules, scoring and tips.', HOW),
]

for slug, title, desc, body in PAGES:
    open(os.path.join(ROOT, slug), 'w', encoding='utf-8').write(page(slug, title, desc, body))

# sitemap: add the pages once
sm_path = os.path.join(ROOT, 'sitemap.xml')
sm = open(sm_path, encoding='utf-8').read()
for slug, *_ in PAGES:
    loc = f'https://unicornergame.lol/{slug}'
    if f'<loc>{loc}</loc>' not in sm:
        sm = sm.replace('</urlset>', f'  <url>\n    <loc>{loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n</urlset>')
open(sm_path, 'w', encoding='utf-8').write(sm)
print('ok')
