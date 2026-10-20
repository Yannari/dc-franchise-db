// Every plate the Ridonculous Race viewer shows is Full HD at least (the user, 2026-10-19: "make sure the bg are
// fullhd at least"), and every plate that moves has its life map beside it. tools/rr-vp-upscale.py remakes a small one.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { PLACE_PLATES, RACE, placeFiles, plateUrl, raceUrl } from '../js/vp-rr-ep/plates.js';
import { LIFE } from '../js/vp-rr-ep/life-have.js';

// the width and height in a webp's header (VP8, VP8L or VP8X)
function webpSize(file) {
  const b = readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`${file} is not a webp`);
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (kind === 'VP8L') { const n = b.readUInt32LE(21); return [(n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1]; }
  if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  throw new Error(`${file}: unknown webp chunk ${kind}`);
}

describe('rr viewer plates', () => {
  const used = [...new Set([
    ...Object.keys(PLACE_PLATES).flatMap(id => placeFiles(id).map(f => plateUrl(id, f))),
    ...['gate', 'cabin', 'galley', 'runway'].map(k => raceUrl(RACE[k].f)), raceUrl(RACE.confess), raceUrl(RACE.map),
  ])];

  it('shows no plate under 1920 x 1080', () => {
    const small = used.map(u => [u, webpSize(u)]).filter(([, [w, h]]) => w < 1920 || h < 1080).map(([u, s]) => `${u} ${s.join('x')}`);
    expect(small).toEqual([]);
    expect(used.length).toBeGreaterThan(120);
  });

  it('has a life map beside every plate that moves, and only real plates move', () => {
    for (const url of Object.keys(LIFE)) {
      expect(existsSync(url), url).toBe(true);
      expect(existsSync(url.replace(/\.webp$/, '-life.webp')), url).toBe(true);
      for (const k of LIFE[url]) expect(['wind', 'water', 'lava']).toContain(k);
    }
    // the plates the user saw shake: a museum wall of painted maps, an elevator lobby, the stall close-ups
    for (const still of ['treasure-isles/task-9449549', 'home-city/task-9434876', 'red-sand-desert/task-9435287'])
      expect(LIFE[`assets/sets/rr/${still}.webp`], still).toBeFalsy();
  });
});

describe('rr viewer repaint jobs', () => {
  it('has every job (tools/rr-vp-jobs.json) wired: its repaint once it is back, a stand-in until then', () => {
    const jobs = JSON.parse(readFileSync('tools/rr-vp-jobs.json', 'utf8')).jobs;
    const src = readFileSync('js/vp-rr-ep/plates.js', 'utf8');
    expect(jobs.length).toBeGreaterThan(0);
    for (const j of jobs) {
      expect(src, j.file).toContain(`repaint('${j.file}'`);
      // a repaint of an existing frame is hashed; a NEW view or cut-out switches on when its file appears
      if (!j.new) expect(j.sha256, `${j.file}: run python tools/rr-vp-repaints.py --jobs`).toMatch(/^[0-9a-f]{64}$/);
      else expect(j.why, j.file).toBeTruthy();
      expect(PLACE_PLATES[j.place], j.place).toBeTruthy();
    }
  });
});
