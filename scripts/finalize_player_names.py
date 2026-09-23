from pathlib import Path
import base64
import json
import lzma
import shutil

payload = Path('scripts/player_names_payload.b64')
parts_dir = Path('scripts/player_names_payload_final')
out = Path('player-names.json')

if payload.exists():
    encoded = payload.read_text(encoding='utf-8').strip()
elif parts_dir.exists():
    parts = sorted(parts_dir.glob('part*.txt'))
    encoded = ''.join(p.read_text(encoding='utf-8').strip() for p in parts)
elif out.exists():
    print('player-names.json already finalized')
    raise SystemExit(0)
else:
    raise SystemExit('No staged player-name payload found')

raw = lzma.decompress(base64.b64decode(encoded))
data = json.loads(raw.decode('utf-8'))
if not isinstance(data, list) or len(data) < 20000 or not all(isinstance(x, str) and x.strip() for x in data):
    raise SystemExit('Decoded payload is not a valid player-name array')

out.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'Wrote {len(data)} player names to {out}')

if payload.exists():
    payload.unlink()
if parts_dir.exists():
    shutil.rmtree(parts_dir)
