// Don talks in whole sentences, the joke built before it lands. The user, 2026-10-20: "FIX don dialogue so it speak with
// actual sentence not cut bs like its warm in here and stop there i u want to do comedy dont start with the punchline".
// A clipped fragment is allowed once in a line, and only as its last beat (the punchline after the setup).
import { describe, it, expect } from 'vitest';
import { POOLS, DON_REWRITE, DON_BEFORE } from '../js/rr/script/lines/index.js';
import { donFlowProblem } from '../js/rr/script/don-flow.js';
import RECAP from '../js/rr/script/lines/recap.js';
import RECAP_PLACES from '../js/rr/script/lines/recap-places.js';

const slots = s => [...String(s).matchAll(/\{[\w.]+\}/g)].map(m => m[0]).sort();

describe('rr Don speaks in whole sentences', () => {
  it('has no Don line of stacked fragments, and no fragment before its setup', () => {
    const bad = [];
    for (const [k, list] of Object.entries(POOLS)) for (const e of list) e.turns.forEach((t, i) => {
      if (t.by === 'don' && t.say && donFlowProblem(t.say)) bad.push(`${e.id}:${i} ${k} (${donFlowProblem(t.say)}): ${t.say}`);
    });
    expect(bad).toEqual([]);
  });

  it("says the 'last time on' recaps in whole sentences too", () => {
    const bad = [];
    const walk = (o, k) => { if (typeof o === 'string') { if (donFlowProblem(o.replace('{summary}', 'racing up a tower'))) bad.push(`${k}: ${o}`); }
      else if (o && typeof o === 'object') for (const [kk, v] of Object.entries(o)) walk(v, `${k}.${kk}`); };
    walk(RECAP, 'recap'); walk(RECAP_PLACES, 'place');
    expect(bad).toEqual([]);
  });

  it('knows the line it means: "Ice River. It\'s warm in here. It is not warm out there."', () => {
    expect(donFlowProblem("Ice River. It's warm in here. It is not warm out there. The plane's on the snow.")).toBeTruthy();
    expect(donFlowProblem("Mostly. Racers, your train leaves in five minutes.")).toBeTruthy();
    expect(donFlowProblem("Welcome to Ice River! I'm in here by the fire, and you're about to be out there in the snow.")).toBeNull();
    expect(donFlowProblem("I asked for the sauna half of this leg. I got the frozen half.")).toBeNull();
  });

  it('keeps every rewritten line on the same names as the line it replaced', async () => {
    const before = {};
    // the rewrite map names lines that exist, and every one is Don's
    let n = 0;
    for (const list of Object.values(POOLS)) for (const e of list) e.turns.forEach((t, i) => { if (DON_REWRITE[`${e.id}:${i}`] != null) { n++; expect(t.by).toBe('don'); before[`${e.id}:${i}`] = t.say; } });
    expect(n).toBe(Object.keys(DON_REWRITE).length);
    // (a name the old line never used might not be filled where it plays)
    const added = [];
    for (const [k, now] of Object.entries(DON_REWRITE)) {
      const was = new Set(slots(DON_BEFORE[k]));
      for (const sl of slots(now)) if (!was.has(sl)) added.push(`${k}: ${sl}`);
    }
    expect(added).toEqual([]);
  });
});
