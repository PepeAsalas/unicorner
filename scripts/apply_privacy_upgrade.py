from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
changed = False

def rep(old, new, label):
    global s, changed
    if new in s:
        print('already', label)
        return
    if old not in s:
        raise SystemExit(f'MISSING {label}')
    s = s.replace(old, new, 1)
    changed = True
    print('patched', label)

rep(
    '@media (max-width:560px){.wrap{padding-left:16px;padding-right:16px}.card{padding:18px}}',
    '@media (max-width:560px){.wrap{padding-left:16px;padding-right:16px}.card{padding:18px}}\n.privacy-link{color:var(--mute);font-size:16px;text-decoration:underline;text-underline-offset:4px;padding:6px 2px}.privacy-link:hover{color:#fff}.privacy-note{font-size:13px!important;margin:8px 0 0}.privacy-note a{color:var(--gold)}',
    'privacy styles'
)

rep(
    '<footer class="site"><button data-open="dlg-submit">Submit a question</button><button data-open="dlg-report">Problem with a question</button><button data-open="dlg-contact">Contact</button></footer>',
    '<footer class="site"><button data-open="dlg-submit">Submit a question</button><button data-open="dlg-report">Problem with a question</button><button data-open="dlg-contact">Contact</button><a class="privacy-link" href="privacy.html">Privacy</a></footer>',
    'footer privacy link'
)

rep(
    '<label class="check"><input type="checkbox" name="newsletter"> <span>Also send me Unicorner news and new features.</span></label>\n<input type="text" name="_honey"',
    '<label class="check"><input type="checkbox" name="newsletter"> <span>Also send me Unicorner news and new features.</span></label>\n<p class="hint mute privacy-note">How we use your information: <a href="privacy.html">Privacy policy</a>.</p>\n<input type="text" name="_honey"',
    'infinite privacy notice'
)

rep(
    '<label for="c-msg">Message</label><textarea id="c-msg" name="message" required maxlength="2000"></textarea>\n<input type="text" name="_honey"',
    '<label for="c-msg">Message</label><textarea id="c-msg" name="message" required maxlength="2000"></textarea>\n<p class="hint mute privacy-note">We use this information to reply to you. <a href="privacy.html">Privacy policy</a>.</p>\n<input type="text" name="_honey"',
    'contact privacy notice'
)

rep(
    '<label for="r-email">Email <span class="opt">(optional, if you\'d like a reply)</span></label><input id="r-email" name="email" type="email" maxlength="120">\n<input type="text" name="_honey"',
    '<label for="r-email">Email <span class="opt">(optional, if you\'d like a reply)</span></label><input id="r-email" name="email" type="email" maxlength="120">\n<p class="hint mute privacy-note">We use this information to review the report and reply if requested. <a href="privacy.html">Privacy policy</a>.</p>\n<input type="text" name="_honey"',
    'report privacy notice'
)

rep(
    '<label class="check"><input type="checkbox" name="newsletter"> <span>Send me Unicorner news, new features and early access. Unsubscribe anytime.</span></label>\n<input type="text" name="_honey"',
    '<label class="check"><input type="checkbox" name="newsletter"> <span>Send me Unicorner news, new features and early access. Unsubscribe anytime.</span></label>\n<p class="hint mute privacy-note">We use your email to manage your submission. Marketing is only sent if you tick the box above. <a href="privacy.html">Privacy policy</a>.</p>\n<input type="text" name="_honey"',
    'question privacy notice'
)

rep(
    "const data=Object.fromEntries(new FormData(f));if(data._honey){f.closest('dialog').close();return}delete data._honey;data.newsletter=!!f.elements.newsletter?.checked;if(f.dataset.kind==='report')data.question=Q[+data.question]?.prompt||'earlier question';",
    "const data=Object.fromEntries(new FormData(f));if(data._honey){f.closest('dialog').close();return}delete data._honey;data.newsletter=!!f.elements.newsletter?.checked;data.privacyNoticeVersion='2026-09-18';if(data.newsletter)data.newsletterConsentAt=new Date().toISOString();if(f.dataset.kind==='report')data.question=Q[+data.question]?.prompt||'earlier question';",
    'newsletter consent audit trail'
)

if changed:
    p.write_text(s, encoding='utf-8')
    print('privacy upgrade applied')
else:
    print('privacy upgrade already applied')
