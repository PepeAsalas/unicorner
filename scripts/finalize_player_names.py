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
packed = base64.b64decode(encoded)
print('parts:', len(parts), 'base64 chars:', len(encoded), 'packed bytes:', len(packed))

dec = lzma.LZMADecompressor()
out_chunks = []
error = None
pos = 0
step = 4096
while pos < len(packed):
    chunk = packed[pos:pos+step]
    try:
        out_chunks.append(dec.decompress(chunk))
    except lzma.LZMAError as exc:
        error = exc
        print('XZ error at packed byte', pos, 'of', len(packed), 'output bytes so far', sum(map(len,out_chunks)))
        break
    pos += len(chunk)

raw = b''.join(out_chunks)
if error is None and not dec.eof:
    print('XZ stream ended without EOF; output bytes:', len(raw))

try:
    data = json.loads(raw.decode('utf-8'))
except Exception as exc:
    print('JSON decode failed:', repr(exc))
    print('decoded tail:', raw[-200:])
    raise

if not isinstance(data, list) or not data or not all(isinstance(x, str) and x.strip() for x in data):
    raise SystemExit('Decoded payload is not a non-empty JSON array of names')

out.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'Wrote {len(data)} player names to {out}')
shutil.rmtree(parts_dir)
