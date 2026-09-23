from pathlib import Path
import base64
import json
import lzma
import shutil

parts_dir = Path('scripts/player_names_payload_final')
out = Path('player-names.json')

parts = sorted(parts_dir.glob('part*.txt')) if parts_dir.exists() else []
if not parts:
    if out.exists():
        print('player-names.json already finalized')
        raise SystemExit(0)
    raise SystemExit('No staged player-name payload found')

encoded = ''.join(p.read_text(encoding='utf-8').strip() for p in parts)
raw = lzma.decompress(base64.b64decode(encoded))
data = json.loads(raw.decode('utf-8'))

if not isinstance(data, list) or not data or not all(isinstance(x, str) and x.strip() for x in data):
    raise SystemExit('Decoded payload is not a non-empty JSON array of names')

out.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'Wrote {len(data)} player names to {out}')

# The chunk files were only a transport mechanism for the large chat payload.
shutil.rmtree(parts_dir)
