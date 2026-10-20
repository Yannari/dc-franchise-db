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

  // listed is not shown: the polar bear was in Ice River's cut-outs from the start and no shot ever drew it (2026-10-20,
  // the user: "how are u suppose to include a cutout of a polar bear if u dont tweak the challenge"); 39 more were the same
  it('every cut-out a place lists is drawn by one of its shots (a prop, a judge, a passer-by or scenery)', () => {
    const placed = new Set();
    const add = (id, k) => { if (!k) return; const [key, at] = String(k).split('@'); placed.add(`${at || id}/${key}`); };
    for (const [id, pl] of Object.entries(PLACE_PLATES)) {
      const all = [pl.opener, ...(pl.arrive || []), ...(pl.views || [])];
      for (const s of Object.values(pl.st)) {
        all.push(...(s.talk || []), s.act, s.act2, ...(s.alt || []), ...(s.alt2 || []));
        for (const sd of Object.values(s.sides || {})) all.push(...(sd.talk || []), sd.act, sd.act2, ...(sd.alt || []), ...(sd.alt2 || []));
      }
      for (const p of all.filter(Boolean)) { add(id, p.prop); add(id, p.judge?.[0]); add(id, p.pass); for (const d of p.deco || []) add(id, d[0]); }
    }
    const never = [];
    for (const [id, pl] of Object.entries(PLACE_PLATES)) for (const k of Object.keys(pl.props || {})) if (!placed.has(`${id}/${k}`)) never.push(`${id}/${k}`);
    expect(never).toEqual([]);
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
