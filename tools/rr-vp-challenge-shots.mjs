// Every challenge, looked at: for each place, a season with the place booked on leg 2, and a screenshot of each of its
// challenges' action shots (every angle: the action plate and the alternates), then one contact sheet per place.
// The user, 2026-10-20: "do u improve the challenges at the same time ... a cutout of a polar bear ... if u dont tweak
// the challenge to include it". Read the sheets; fix what a challenge doesn't show.
//   (serve the repo on RR_URL's port)   node tools/rr-vp-challenge-shots.mjs [place,...]
// Sheets land in shots/rr-vp/challenges/<place>.png.
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { PLACES } from '../js/rr/places.js';
import { stretchPlates } from '../js/vp-rr-ep/plates.js';

const TASK = new Set(['either', 'botch', 'allin', 'route', 'superteam']);
const only = (process.argv[2] || '').split(',').filter(Boolean);
mkdirSync('shots/rr-vp/challenges', { recursive: true });
for (const p of Object.values(PLACES)) {
  if (p.start || p.finale || (only.length && !only.includes(p.id))) continue;
  const acts = new Set();
  for (const s of p.stretches.filter(x => TASK.has(x.kind))) {
    for (const side of [null, ...(s.sides || []).map(x => x.id)]) {
      const sp = stretchPlates(p.id, s.id, side);
      for (const a of [sp?.act, sp?.act2, ...(sp?.alt || []), ...(sp?.alt2 || [])]) if (a?.f) acts.add(a.f);
    }
  }
  if (!acts.size) continue;
  try {
    execFileSync('node', ['tools/rr-vp-look.mjs', '41', '12', 'none'], {
      env: { ...process.env, RR_PINS: `2:${p.id}`, RR_ACTS: [...acts].join(',') }, stdio: 'pipe', timeout: 600000 });
  } catch (e) { console.log(p.id, 'failed', String(e.stderr || e.message).slice(0, 200)); continue; }
  const shots = [...acts].map(f => `shots/rr-vp/look-act-${f}.png`).filter(existsSync);
  execFileSync('python', ['-c', `
import sys
from PIL import Image, ImageDraw
fs = sys.argv[2:]
W, H = 800, 450
cols = 2
rows = (len(fs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * (H + 20)), 'black')
d = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((W, H))
    x, y = (i % cols) * W, (i // cols) * (H + 20)
    sheet.paste(im, (x, y)); d.text((x + 4, y + H + 4), f.split('look-act-')[-1], fill='white')
sheet.save(sys.argv[1])
`, `shots/rr-vp/challenges/${p.id}.png`, ...shots]);
  console.log(p.id, shots.length, 'shots');
}
