#!/usr/bin/env python3
"""Send the evening streak reminder (web push) to players who played yesterday but not yet today.

Reads public.push_subs (supabase/push.sql) with the service role key. One reminder per browser per day.
Subscriptions the browser has dropped (HTTP 404/410) are deleted.

Needs GitHub secrets SUPABASE_SERVICE_ROLE_KEY and VAPID_PRIVATE_KEY (see .github/workflows/streak-push.yml).
--dry-run lists who would get a reminder without sending anything.
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

SB_URL = 'https://yujhjepukzdahsppntua.supabase.co'
KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
VAPID = os.environ.get('VAPID_PRIVATE_KEY', '')
DRY = '--dry-run' in sys.argv


def sb(method, path, body=None):
    req = urllib.request.Request(SB_URL + '/rest/v1/' + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
                                          'Content-Type': 'application/json', 'Prefer': 'return=minimal'})
    with urllib.request.urlopen(req, timeout=30) as r:
        t = r.read()
        return json.loads(t) if t else None


def text(lang, streak):
    if lang == 'es':
        return ('🔥 Tu racha de %d días se acaba a medianoche' % streak if streak >= 2 else '⚽ El Daily 5 de hoy te espera',
                'Cinco preguntas, tres minutos. Juega antes de medianoche para no perder la racha.')
    return ('🔥 Your %d-day streak ends at midnight' % streak if streak >= 2 else "⚽ Today's Daily 5 is waiting",
            "Five questions, three minutes. Play before midnight to keep it going.")


def main():
    if not KEY or (not VAPID and not DRY):
        print('Set SUPABASE_SERVICE_ROLE_KEY and VAPID_PRIVATE_KEY (GitHub secrets).')
        sys.exit(1)
    now = datetime.now(ZoneInfo('Europe/Amsterdam'))
    today = now.date().isoformat()
    yday = (now.date() - timedelta(days=1)).isoformat()
    rows = sb('GET', 'push_subs?select=endpoint,sub,lang,streak,last_day,last_sent'
                     f'&last_day=eq.{yday}&or=(last_sent.is.null,last_sent.neq.{today})&limit=5000') or []
    print(f'{today}: {len(rows)} to remind')
    if DRY:
        for r in rows[:20]:
            print(' ', r['lang'], r['streak'], r['endpoint'][:60])
        return
    from pywebpush import webpush, WebPushException
    sent = gone = failed = 0
    for r in rows:
        title, body = text(r['lang'], r['streak'])
        url = '/es/' if r['lang'] == 'es' else '/'
        ep = urllib.parse.quote(r['endpoint'], safe='')
        try:
            webpush(subscription_info=r['sub'], data=json.dumps({'title': title, 'body': body, 'url': url, 'tag': 'streak-' + today}),
                    vapid_private_key=VAPID, vapid_claims={'sub': 'mailto:joseasalasnl@gmail.com'}, ttl=4 * 3600)
            sb('PATCH', f'push_subs?endpoint=eq.{ep}', {'last_sent': today})
            sent += 1
        except WebPushException as e:
            code = getattr(e.response, 'status_code', None)
            if code in (404, 410):
                sb('DELETE', f'push_subs?endpoint=eq.{ep}')
                gone += 1
            else:
                failed += 1
                print('failed', code, str(e)[:120])
    print(f'sent {sent}, removed {gone} expired, failed {failed}')


if __name__ == '__main__':
    main()
