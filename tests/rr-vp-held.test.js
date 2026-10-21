// A cut-out a challenge has them hold is in their hands (the user, 2026-10-21, at the dragon drool: "theyre not even
// holding the bottle i told u to make sure your cutout are used and placed correctly for all the challenges"): the vial
// stood on the sand beside the team, like a sand palace. Held things (a vial, a bottle, a racket, a torch, a spoon, a
// bowl, a balance pole, a canteen) are drawn in the hands of the one doing it; and no challenge's cut-out goes
// undrawn: on a walk, a climb or a swim a cut-out was drawn only if it was a raft, so the tightrope's pole, the milk
// canteen, the eggs up the spire and the mummy in the tomb never appeared.
import { describe, it, expect, beforeAll } from 'vitest';
import { PLACES } from '../js/rr/places.js';
import { stretchPlates, HELD } from '../js/vp-rr-ep/plates.js';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';

// the modes whose cut-out is drawn as what they ride, push or stand in (stage.js VEH), or that the stage handles itself
const DRAWN = new Set(['ride', 'zip', 'para', 'swing', 'push', 'coals', 'roll', 'dive']);
const PATH = new Set(['walk', 'climb', 'run', 'hop', 'swim']);
const plates = [];
for (const pl of Object.values(PLACES)) for (const st of pl.stretches) for (const side of [null, ...(st.sides || []).map(d => d.id)]) {
  const sp = stretchPlates(pl.id, st.id, side);
  if (!sp) continue;
  const add = (where, p) => { if (p?.prop) plates.push({ place: pl.id, stretch: st.id, where, p }); };
  add('act', sp.act);
  for (const [sid, sg] of Object.entries(sp.stages || {})) { add(sid, sg.plate); add(sid + ':fail', sg.fail); }
}

describe('rr viewer: what a challenge has them hold', () => {
  it('names the held cut-outs, and each is one a place has', () => {
    for (const key of ['dragon-isle/vial', 'fishing-cove/vinegar', 'glass-tower-gulf/racket', 'grass-savanna/bat', 'stilt-river/torch',
      'swamp-prison/spoon', 'great-falls/pole', 'pyramid-coast/canteen', 'stone-head-island/basket']) expect(HELD.has(key), key).toBe(true);
    for (const key of HELD) {
      const [place, prop] = key.split('/');
      expect(plates.some(x => x.place === place && x.p.prop === prop), key).toBe(true);
    }
  });

  it('leaves no challenge\'s cut-out undrawn on a walk, a climb or a swim', () => {
    const lost = plates.filter(({ place, p }) => PATH.has(p.mode) && !DRAWN.has(p.mode) && !p.carry && !/^raft/.test(p.prop) && !HELD.has(`${place}/${p.prop}`))
      .map(({ place, stretch, where, p }) => `${place} ${stretch} ${where}: ${p.mode} ${p.prop}`);
    expect([...new Set(lost)]).toEqual([]);
  });
});

describe('rr viewer: in their hands', () => {
  const held = [];
  beforeAll(() => {
    const { cast, teams } = raceCast(10, 8);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed: 8, options: { pins: { 2: 'dragon-isle', 3: 'fishing-cove', 4: 'swamp-prison' } } });
    const aired = airSeason(res);
    for (let i = 1; i < 4; i++) for (const s of episodeScreens(res, aired, i).screens) if (s.workProp && HELD.has(`${s.place}/${s.plate?.prop}`)) held.push(s);
  }, 600000);
  it('draws a held cut-out at the hands of the team doing it, not on the ground beside it', () => {
    expect(held.length).toBeGreaterThan(3);
    for (const s of held) {
      const at = s.marks[s.teams[0]];
      expect(s.workProp.held, s.id).toBe(true);
      expect(Math.abs(s.workProp.at[0] - at[0]), `${s.id} x`).toBeLessThan(s.size * 1.2);
      expect(s.workProp.at[1], `${s.id} y: above the feet`).toBeLessThan(at[1]);
    }
  });
});
