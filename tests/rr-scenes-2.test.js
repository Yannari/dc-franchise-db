// The Ridonculous Race: the catalogue's romance, locals, money, information, sabotage, body
// and place families (engine plan, Task 12).
import { describe, it, expect } from 'vitest';
import { SCENES, playScene } from '../js/rr/scenes.js';
import { mayScheme } from '../js/rr/state.js';
import { catalogueKinds, fixtureCtx } from './helpers/rr-catalogue.js';
import { streamFor } from '../js/dr/rng.js';
import { setPlayers, players } from '../js/core.js';

const FAMS = [4, 5, 6, 7, 8, 9, 10];
const ARCH = ['villain', 'mastermind', 'schemer', 'hero', 'loyal-soldier', 'floater', 'wildcard', 'hothead', 'underdog', 'goat'];

describe('rr scene catalogue, families 4-10', () => {
  it('has every kind the catalogue lists for families 4 to 10', () => {
    for (const f of FAMS) {
      expect(catalogueKinds(f).length, `family ${f}`).toBeGreaterThan(4);
      for (const k of catalogueKinds(f)) { expect(SCENES[k], k).toBeTruthy(); expect(SCENES[k].family, k).toBe(f); }
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
      }
    }
  });

  it('sabotage is only ever done by someone who may scheme, and a caught one costs an hour', () => {
    const sab = catalogueKinds(8).filter(k => SCENES[k].scheme);
    expect(sab.length).toBeGreaterThan(5);
    let caught = 0, played = 0;
    for (let s = 1; s <= 300; s++) {
      const k = sab[s % sab.length];
      const ctx = fixtureCtx(k, { doerArchetype: ARCH[s % ARCH.length], seed: 3 + (s % 5) });
      ctx.moment = 'overlap';
      ctx.state.rivalry = Object.fromEntries([[[ctx.team.id, ctx.other.id].sort().join('|'), 3]]);
      const before = ctx.state.pending[ctx.team.id] || 0;
      const sc = playScene(ctx, k, streamFor(s, 'sab'));
      if (!sc) continue;
      played++;
      expect(mayScheme(sc.who[0]), `${k} by ${sc.who[0]}`).toBe(true);
      if (sc.data.facts?.caught) { caught++; expect((ctx.state.pending[ctx.team.id] || 0) - before).toBeGreaterThanOrEqual(60); }
    }
    expect(played).toBeGreaterThan(0);
    expect(caught).toBeGreaterThan(0);
  });

  it('no romance between two people of a family team, and none without romantic compatibility', () => {
    for (const k of catalogueKinds(4)) {
      for (let s = 1; s <= 30; s++) {
        const ctx = fixtureCtx(k, { seed: s });
        const t = ctx.state.teams[ctx.team.id];
        t.rel = 'siblings';
        ctx.people = [t.a, t.b];
        ctx.moment = SCENES[k].moments[0];
        expect(playScene(ctx, k, streamFor(s, 'r')), `${k} seed ${s}`).toBeNull();
      }
    }
  });

  it('begging never plays where it is forbidden', () => {
    const ctx = fixtureCtx('beg');
    ctx.moment = 'fare';
    ctx.state.money[ctx.team.id] = 0;
    ctx.stretch = { id: 'air', kind: 'travel', mode: 'flight', base: 300, cost: 40, noBeg: true };
    expect(playScene(ctx, 'beg', streamFor(1, 'b'))).toBeNull();
    const ctx2 = fixtureCtx('beg');
    ctx2.moment = 'fare';
    ctx2.state.money[ctx2.team.id] = 0;
    ctx2.stretch = { id: 'boat', kind: 'travel', mode: 'boat', base: 30, cost: 40 };
    expect(playScene(ctx2, 'beg', streamFor(1, 'b'))).toBeTruthy();
  });
});
