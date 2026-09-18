from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

if 'name="what_happened"' in s and 'class="linkish report-quick"' in s and 'data.questionId=' in s:
    print('Fast problem reporting already applied')
    raise SystemExit(0)


def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'MISSING {label}')
    s = s.replace(old, new, 1)
    print('patched', label)

# Add a small report shortcut beside every question on the results screen.
rep(
    '<b>${r.q.prompt}</b><br><span class="rtier"',
    '<b>${r.q.prompt}</b> <button type="button" class="linkish report-quick" data-open="dlg-report" data-q="${ri}" aria-label="Report a problem with this question">Wrong?</button><br><span class="rtier"',
    'results Wrong link',
)

# Keep the shortcut visually small even though it reuses the shared link-button style.
rep(
    '.linkish,footer.site button,.ghost.linkish{background:none!important;border:0!important;box-shadow:none!important;text-transform:none;color:var(--gold)!important;padding:0!important;transform:none!important}',
    '.linkish,footer.site button,.ghost.linkish{background:none!important;border:0!important;box-shadow:none!important;text-transform:none;color:var(--gold)!important;padding:0!important;transform:none!important}\n.report-quick{font-size:12px!important;margin-left:7px!important;vertical-align:1px!important;text-decoration:underline!important;white-space:nowrap}',
    'Wrong link styling',
)

# Put the issue type first in the report form.
rep(
    '<dialog id="dlg-report"><form data-kind="report"><h2>Problem with a question?</h2><p class="mute">Think we missed a valid answer, or got one wrong? Tell us and we\'ll check it.</p>\n<label for="r-q">Which question</label>',
    '<dialog id="dlg-report"><form data-kind="report"><h2>Problem with a question?</h2><p class="mute">Think we missed a valid answer, or got one wrong? Tell us and we\'ll check it.</p>\n<label for="r-what">What happened?</label><select id="r-what" name="what_happened" required><option value="">Choose one</option><option>An answer I knew was rejected</option><option>An answer is wrong</option><option>The question was confusing</option><option>Something looked broken</option><option>Other</option></select>\n<label for="r-q">Which question</label>',
    'report issue type',
)

# Do not let clicking Wrong? toggle the surrounding <details>; just open the report dialog.
rep(
    "const o=e.target.closest('[data-open]');if(o){track('dialog_open',{dialog:o.dataset.open,question_index:o.dataset.q!==undefined?+o.dataset.q:null});openDlg(o.dataset.open,o.dataset.q!==undefined?{question:o.dataset.q}:null)}",
    "const o=e.target.closest('[data-open]');if(o){if(o.classList.contains('report-quick')){e.preventDefault();e.stopPropagation()}track('dialog_open',{dialog:o.dataset.open,question_index:o.dataset.q!==undefined?+o.dataset.q:null});openDlg(o.dataset.open,o.dataset.q!==undefined?{question:o.dataset.q}:null)}",
    'quick report click behavior',
)

# Attach score and stable question id automatically to problem reports.
rep(
    "if(f.dataset.kind==='report')data.question=Q[+data.question]?.prompt||'earlier question';",
    "if(f.dataset.kind==='report'){const qIndex=+data.question,q=Q[qIndex];data.question=q?.prompt||'earlier question';data.questionId=q?.id||q?._id||null;data.score=Number.isFinite(score)?score:null;}",
    'report metadata',
)

p.write_text(s, encoding='utf-8')
print('Fast problem reporting applied')
