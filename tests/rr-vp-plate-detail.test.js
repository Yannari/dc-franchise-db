// Every plate somebody stands on shows a place (the user, 2026-10-20: Pampas Ranch's tango was danced on a close-up of
// a red wall, no floor, no room). A frame like that is only a wall, a door or a blur, and it measures as one: almost
// no edges. Each standing plate (not a water or sky path) must clear an edge-density floor, or be on the reviewed
// list below with the reason it is fine. A frame that fails gets an edit job and a stand-in, never a place in the list
// just to go green.
//
// Edge density: the plate in grey at 480 x 270, a 3x3 edge filter (the same kernel as PIL's FIND_EDGES), the share of
// pixels at 40 or more. The two frames that were found by eye measure 0.004 (the red wall) and 0.012 (a tree trunk
// and a log). A plain place can measure as low (a snowfield, dunes, a night desert, one ice floe): those are the
// reviewed list, each looked at. Everything else in use measures 0.0136 and up (the 349 standing plates, 2026-10-20).
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import sharp from 'sharp';
import { PLACE_PLATES, plateUrl } from '../js/vp-rr-ep/plates.js';

// (0.013 until 2026-10-20; every plate through ESRGAN sharpens its edges: the bare jungle floor found by eye went from
// under 0.013 to 0.0136, the lowest real places to 0.0140)
export const DETAIL_FLOOR = 0.0138;

// reviewed: low on edges, but a real place with ground (the scan, 2026-10-20). place/file: why it is fine
const REVIEWED = {
  'dragon-isle/task-9445378': 'the jungle floor, soft-focus: packed earth across the whole lower half, rocks and leaves behind',
  'tomb-sands/present-22410572': 'open dunes under the sky: sand to stand on from edge to edge',
  'snow-peaks/present-22413612': 'a snowfield with a rock and the peaks behind: snow to stand on from edge to edge',
  'secret-base-desert/task-22419058': 'the desert at night by the base: flat ground, cacti and mesas, dark so few edges',
  'secret-base-desert/chill-22419058': 'the same night desert frame, its Chill Zone copy',
};

// the two found by eye: they must stay under the floor, or the floor has drifted
const KNOWN_BAD = ['pampas-ranch/task-9448962', 'dragon-isle/task-9445351'];

export async function detailOf(file) {
  const W = 480, H = 270;
  const { data } = await sharp(file).resize(W, H, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true });
  let strong = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    // PIL's FIND_EDGES: 8 * centre - the eight around it; the frame's edge pixels repeat the edge
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const v = data[Math.min(H - 1, Math.max(0, y + dy)) * W + Math.min(W - 1, Math.max(0, x + dx))];
      sum += dx === 0 && dy === 0 ? 8 * v : -v;
    }
    if (sum >= 40) strong++;
  }
  return strong / (W * H);
}

function standingPlates() {
  const out = new Map();
  for (const [id, pl] of Object.entries(PLACE_PLATES)) {
    const add = x => { if (x?.f && !x.water && x.people !== false) out.set(`${id}/${x.f}`, plateUrl(id, x.f)); };
    add(pl.opener);
    (pl.arrive || []).forEach(add);
    for (const s of Object.values(pl.st)) {
      (s.talk || []).forEach(add); add(s.act); add(s.act2);
      for (const side of Object.values(s.sides || {})) { (side.talk || []).forEach(add); add(side.act); add(side.act2); }
    }
  }
  return out;
}

describe('rr viewer: every standing plate shows a place', () => {
  it('measures the two frames found by eye under the floor (the measure still tells a wall from a place)', async () => {
    for (const key of KNOWN_BAD) {
      const [id, f] = key.split('/');
      expect(await detailOf(plateUrl(id, f)), key).toBeLessThan(DETAIL_FLOOR);
    }
  }, 60000);

  it('puts nobody on a plate with no detail, unless it was reviewed', async () => {
    const bad = [];
    const plates = standingPlates();
    expect(plates.size).toBeGreaterThan(300);
    for (const [key, file] of plates) {
      if (!fs.existsSync(file)) continue;
      const d = await detailOf(file);
      if (d < DETAIL_FLOOR && !REVIEWED[key]) bad.push(`${key} ${d.toFixed(4)}`);
    }
    expect(bad).toEqual([]);
  }, 300000);

  it('keeps the reviewed list honest: each entry is in use and still under the floor', async () => {
    const plates = standingPlates();
    for (const key of Object.keys(REVIEWED)) {
      expect(plates.has(key), `${key} is no longer stood on`).toBe(true);
      expect(await detailOf(plates.get(key)), `${key} is over the floor now`).toBeLessThan(DETAIL_FLOOR);
    }
  }, 60000);
});
