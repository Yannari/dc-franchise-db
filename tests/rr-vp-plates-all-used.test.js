// Every plate and cut-out the user finished is on screen, or says why it can't be (plates-more.js LEFT_OUT). Found
// 2026-10-20 by the user ("ur ice-river challenge barely use the plates ... why did i do all that work if u dont even
// use them all"): 420 of 642 finished plates were in the viewer; a challenge had one standing shot and one angle on the
// action whatever the user made for it, and every Chill Zone check-in used the first of its angles.
// The frames folder is the user's (Downloads); on a machine without it this checks what it can.
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { PLACE_PLATES, placeFiles, propFiles, stretchPlates } from '../js/vp-rr-ep/plates.js';
import { LEFT_OUT } from '../js/vp-rr-ep/plates-more.js';
import { REPAINTED } from '../js/vp-rr-ep/repainted.js';

const DONE = join(homedir(), 'Downloads', 'RidonculousRace-frames', 'done');
const stem = f => f.replace(/\.(png|jpe?g|webp)$/i, '');
const images = dir => (existsSync(dir) ? readdirSync(dir).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).map(stem) : []);

describe('rr viewer: every finished plate is used', () => {
  it.skipIf(!existsSync(DONE))('each plate and cut-out in the frames folder is on screen, or left out with a reason', () => {
    const unaccounted = [];
    for (const [id, pl] of Object.entries(PLACE_PLATES)) {
      const used = new Set(placeFiles(id));
      const props = new Set(propFiles(id).map(x => x.file));
      const left = LEFT_OUT[id] || {};
      for (const f of images(join(DONE, pl.src))) {
        if (f.startsWith('reference-') || used.has(f) || REPAINTED.has(f) || left[f]) continue;
        unaccounted.push(`${id}/${f}`);
      }
      for (const f of images(join(DONE, pl.src, 'cutout'))) {
        if (props.has(f) || REPAINTED.has(f) || left[`cutout/${f}`]) continue;
        unaccounted.push(`${id}/cutout/${f}`);
      }
    }
    expect(unaccounted).toEqual([]);
  });

  it('a reason given for leaving one out is a sentence, not a shrug', () => {
    for (const [id, m] of Object.entries(LEFT_OUT)) for (const [f, why] of Object.entries(m)) expect(why.length, `${id}/${f}`).toBeGreaterThan(15);
  });

  it('the extra angles reach the screen: action plates per team, views for Don', () => {
    expect(stretchPlates('ice-river', 'ice-floes').alt.length).toBeGreaterThan(0);
    expect(PLACE_PLATES['fire-mountain-isle'].views.length).toBeGreaterThan(2);
    // a view is Don's: nobody stands on it
    for (const pl of Object.values(PLACE_PLATES)) for (const v of pl.views || []) expect(v.people).toBe(false);
  });
});
