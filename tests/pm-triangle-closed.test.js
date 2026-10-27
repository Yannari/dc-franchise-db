// A triangle's suitor is free to be one (user, 2026-10-26, season 1: Malik,
// official with Ayesha, stood as Anna's second suitor — "why closed off if he
// had feelings for someone else"). Measured on the old code: 63 of 165
// triangle scenes over 12 seasons had a suitor closed off with somebody else.
import { describe, it, expect } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

const CLOSED = ['closed-off', 'exclusive', 'official'];

describe('love triangles', () => {
  it('never have a suitor closed off with somebody else', () => {
    const bad = [];
    let scenes = 0;
    for (const seed of [1, 2, 3]) {
      const cast = makeIslanders(22, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
      for (const r of rows) {
        const ladder = r.pm.ladder || {};
        const couples = r.pm.couplesBefore || r.pm.couples || [];
        const partner = n => (couples.find(c => c.includes(n)) || []).find(m => m !== n);
        for (const e of r.pm.events.filter(x => x.kind.startsWith('triangle-') && x.extra?.tri)) {
          scenes++;
          const { h, x, y } = e.extra.tri;
          for (const s of [x, y]) {
            const p = partner(s);
            if (p && p !== h && CLOSED.includes(ladder[`${s}→${p}`])) bad.push(`seed ${seed} ep ${r.num} ${e.kind}: ${s} ${ladder[`${s}→${p}`]} with ${p}`);
          }
        }
      }
    }
    expect(scenes, 'triangles to test against').toBeGreaterThan(5);
    expect(bad).toEqual([]);
  }, 300000);
});
