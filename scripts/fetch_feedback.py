#!/usr/bin/env python3
"""Print the last N days of player feedback (emails and names removed) for the weekly feedback routine.

Needs FEEDBACK_KEY in the environment (the same key whose md5 is in public.feedback_keys; see supabase/feedback_digest.sql).
Prints JSON to stdout. Never save the output into the repo: it is player feedback and the repo is public.
Usage: python scripts/fetch_feedback.py [days, default 7]
"""
import json
import os
import sys
import urllib.request

SB_URL = 'https://yujhjepukzdahsppntua.supabase.co'
SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1amhqZXB1a3pkYWhzcHBudHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDMzNDcsImV4cCI6MjEwNTIxOTM0N30.YIOdtL7tJnNLPFPy19QuXe6w3Dcnz6Xedw0tFGdV_CE'  # the public anon key the site already uses; the feedback key is what unlocks the data


def main():
    key = os.environ.get('FEEDBACK_KEY')
    if not key:
        sys.exit('FEEDBACK_KEY is not set in this environment')
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    req = urllib.request.Request(SB_URL + '/rest/v1/rpc/feedback_digest', method='POST',
                                 data=json.dumps({'p_key': key, 'p_days': days}).encode(),
                                 headers={'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        print(json.dumps(json.load(r), ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
