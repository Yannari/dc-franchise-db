// The Ridonculous Race: the scene catalogue as data, families 1-3 (engine plan, Task 11).
import { describe, it, expect } from 'vitest';
import { SCENES, playScene } from '../js/rr/scenes.js';
import { catalogueKinds, fixtureCtx } from './helpers/rr-catalogue.js';

const FAMS = [1, 2, 3];

describe('rr scene catalogue, families 1-3', () => {
  it('the document lists the families', () => {
    for (const f of FAMS) expect(catalogueKinds(f).length, `family ${f}`).toBeGreaterThan(5);
  });

  it('has every kind the catalogue lists for families 1, 2, 3', () => {
    for (const f of FAMS) for (const k of catalogueKinds(f)) {
      expect(SCENES[k], k).toBeTruthy();
      expect(SCENES[k].family, k).toBe(f);
    }
  });

  it('every kind has two or more endings, and every ending changes something', () => {
    for (const f of FAMS) for (const k of catalogueKinds(f)) {
      const kind = SCENES[k];
      expect(kind.endings.length, k).toBeGreaterThanOrEqual(2);
      for (const e of kind.endings) {
        const ctx = fixtureCtx(k, { doerArchetype: kind.scheme ? 'villain' : null });
        const sc = playScene(ctx, k, () => 0.5, { ending: e });
        expect(sc, `${k}/${e}`).toBeTruthy();
        expect(sc.data.effects.length, `${k}/${e}`).toBeGreaterThan(0);
        expect(sc.data.ending).toBe(e);
        for (const n of sc.who) expect(sc.seenBy, `${k}/${e} ${n}`).toContain(n);
      }
    }
  });

  it('a scheme kind never plays with a nice doer, even with its ending forced', () => {
    const schemes = Object.keys(SCENES).filter(x => SCENES[x].scheme && FAMS.includes(SCENES[x].family));
    expect(schemes.length).toBeGreaterThan(0);
    for (const k of schemes) {
      const ctx = fixtureCtx(k, { doerArchetype: 'hero' });
      expect(playScene(ctx, k, () => 0.5, { ending: SCENES[k].endings[0] }), k).toBeNull();
    }
  });

  it('a decided ending is one of the kind\'s endings, and a when of 0 plays nothing', () => {
    const ctx = fixtureCtx('blame');
    ctx.moment = 'fail';
    const sc = playScene(ctx, 'blame', () => 0.3);
    if (sc) expect(SCENES.blame.endings).toContain(sc.data.ending);
    const ctx2 = fixtureCtx('console');
    ctx2.moment = 'nothing-matches';
    expect(playScene(ctx2, 'console', () => 0.3)).toBeNull();
  });
});
