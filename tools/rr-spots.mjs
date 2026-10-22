// Where each stage of a staged challenge happens, for the engine: js/rr/spots.js.
//
//   node tools/rr-spots.mjs
//
// Two teams at one challenge meet only in the same spot (2026-10-21, the user: "FINN and Manu are outside then right
// after inside again"). A spot is the shot the viewer draws a stage in (js/vp-rr-ep/plates.js STAGE_SHOTS): the three
// stages of the stairs are one stairwell, the clip-on and the rail are one outside deck. The engine never reads the
// viewer's art while it races: a plate job coming back would change who meets whom and every season after it. So the
// spots are written here once, with every plate job counted as back (a stand-in is not where the stage happens: the
// zipline's clip-in is on its launch platform, not in the corridor meanwhile). Run it again when a place's stages change;
// tests/rr-stage-spots.test.js fails until then.
import { readFileSync, writeFileSync } from 'node:fs';
import { REPAINTED } from '../js/vp-rr-ep/repainted.js';

const jobs = JSON.parse(readFileSync('tools/rr-vp-jobs.json', 'utf8')).jobs;
for (const j of jobs) REPAINTED.add(j.file);
const { STAGE_SHOTS } = await import('../js/vp-rr-ep/plates.js');

const fileOf = p => (Array.isArray(p) ? p[0] : p?.f) || null;
const out = {};
for (const [place, stretches] of Object.entries(STAGE_SHOTS)) {
  for (const [stretch, stages] of Object.entries(stretches)) {
    for (const [stage, sg] of Object.entries(stages)) {
      const f = fileOf(sg.plate);
      if (f) ((out[place] ||= {})[stretch] ||= {})[stage] = f;
    }
  }
}
const body = JSON.stringify(out, null, 1).replace(/\n {3,}/g, ' ').replace(/\n  \}/g, ' }');
writeFileSync('js/rr/spots.js', `// Written by tools/rr-spots.mjs: where each stage of a staged challenge happens (the shot it is drawn in, every plate
// job counted as back). Two teams at one challenge meet only in the same spot (leg.js).
export const SPOTS = ${body};

/** The spot of stage \`stage\` of stretch \`stretch\` at \`place\`, or null (a stage the place doesn't shoot). */
export const spotOfStage = (place, stretch, stage) => SPOTS[place]?.[stretch]?.[stage] ?? null;
`);
console.log('spots:', Object.values(out).reduce((n, p) => n + Object.values(p).reduce((m, s) => m + Object.keys(s).length, 0), 0));
