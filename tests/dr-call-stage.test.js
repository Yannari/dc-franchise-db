// ══════════════════════════════════════════════════════════════════════
// tests/dr-call-stage.test.js — the call, staged (js/vp-dr/call-stage.js)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { rpBuildResults } from '../js/vp-dr/results.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer', 'mastermind', 'underdog'];

function season(seed, config = {}) {
  const rng = rngFor(seed * 7919 + 13); const r = () => 1 + Math.floor(rng() * 10);
  const cast = Array.from({ length: 13 }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', archetype: ARCH[i % ARCH.length],
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  return playDragSeason({
    cast, seed: seed * 101 + 7, config,
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = (bonds[k] || 0) + d; },
    popDelta: () => {},
  }).rows.filter(x => x.dr && !x.dr.finale);
}

const cards = html => [...html.matchAll(/id="dr-step-results-(\d+)"/g)].map(m => Number(m[1]));
const total = html => Number(/drRevealNext\('results', (\d+)/.exec(html)?.[1]);

describe('the call stage', () => {
  it('draws the line once, with one card per step and a count that matches', () => {
    for (const s of [1, 2, 3]) {
      for (const row of season(s)) {
        const html = rpBuildResults(row);
        if (!html) continue;
        expect(html.match(/id="csx"/g) || []).toHaveLength(1);
        const ids = cards(html);
        expect(ids, `ep ${row.num}`).toEqual(ids.map((_, i) => i));
        expect(total(html)).toBe(ids.length);
      }
    }
  });

  it('puts the call confessionals on the screen, right after the call they answer', () => {
    let seen = 0;
    for (const s of [1, 2, 3, 4]) {
      for (const row of season(s)) {
        const confs = row.dr.scenes.filter(x => x.step === 'results' && String(x.kind).startsWith('confess:'));
        const html = rpBuildResults(row);
        for (const c of confs) {
          expect(html, `ep ${row.num}`).toContain(c.text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').slice(0, 30));
          seen++;
        }
        for (const c of confs) expect(c.text).not.toMatch(/\{[a-z]\}/);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('never stamps BTM2 before a holder has chosen', () => {
    let nights = 0;
    for (const s of [1, 2, 3]) {
      for (const row of season(s, { drSave: 'beaver' }).filter(r => r.dr.save?.hold)) {
        nights++;
        const html = rpBuildResults(row);
        const stage = html.slice(html.indexOf('id="csx"'), html.indexOf('<!--/dr-chrome-->', html.indexOf('id="csx"')));
        expect(stage).not.toMatch(/Lip sync for your life/);
        expect(html).not.toMatch(/dr-stamp[^>]*>BTM2/);
      }
    }
    expect(nights).toBeGreaterThan(0);
  });
});
