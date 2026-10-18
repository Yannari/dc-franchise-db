// The Ridonculous Race: Don, the twists and the interviews as catalogue scenes (engine plan, Task 13).
import { describe, it, expect } from 'vitest';
import { SCENES, playScene, emit, interviewAfter } from '../js/rr/scenes.js';
import { catalogueKinds, fixtureCtx } from './helpers/rr-catalogue.js';
import { streamFor } from '../js/dr/rng.js';

describe('rr scene catalogue, families 11-13', () => {
  it('the whole catalogue (families 1-13) is in the registry', () => {
    const all = catalogueKinds();
    expect(all.length).toBeGreaterThan(130);
    for (let f = 1; f <= 13; f++) expect(catalogueKinds(f).length, `family ${f}`).toBeGreaterThan(4);
    for (const k of all) expect(SCENES[k], k).toBeTruthy();
  });

  it('every Don, twist and interview ending changes something', () => {
    for (const f of [11, 12, 13]) for (const k of catalogueKinds(f)) {
      expect(SCENES[k].endings.length, k).toBeGreaterThanOrEqual(2);
      for (const e of SCENES[k].endings) {
        const sc = playScene(fixtureCtx(k), k, () => 0.5, { ending: e });
        expect(sc.data.effects.length, `${k}/${e}`).toBeGreaterThan(0);
      }
    }
  });

  it('emit records a system-decided moment with the system\'s own effects', () => {
    const ctx = fixtureCtx('don-place');
    const sc = emit(ctx.state, 'don-place', [ctx.state.teams[ctx.team.id].a], 'plain', { team: ctx.team.id, place: 3, effects: [['placed', ctx.team.id, 3]] });
    expect(sc.kind).toBe('don-place');
    expect(sc.data.place).toBe(3);
    expect(sc.data.effects.some(e => e[0] === 'placed')).toBe(true);
  });

  it('an interview is only ever about a scene its interviewee saw, and a team gets at most three a leg', () => {
    const ctx = fixtureCtx('snap');
    const st = ctx.state;
    let made = 0;
    for (let s = 1; s <= 60; s++) {
      const c = fixtureCtx('snap', { seed: 5 });
      Object.assign(c, { state: st, _ready: false });
      const big = playScene(c, 'blame', streamFor(s, 'b'), { ending: 'blow-up' });
      const iv = interviewAfter(st, big, streamFor(s, 'i'));
      if (!iv) continue;
      made++;
      for (const n of iv.who) expect(big.seenBy).toContain(n);
      expect(iv.data.about).toBe(big.id);
    }
    expect(made).toBeGreaterThan(0);
    const per = {};
    for (const sc of st.scenes.filter(x => x.kind.startsWith('int-'))) per[`${sc.leg}|${sc.data.team}`] = (per[`${sc.leg}|${sc.data.team}`] || 0) + 1;
    for (const v of Object.values(per)) expect(v).toBeLessThanOrEqual(3);
  });
});
