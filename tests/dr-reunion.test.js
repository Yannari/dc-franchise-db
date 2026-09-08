// ══════════════════════════════════════════════════════════════════════
// tests/dr-reunion.test.js — the season, argued about by the people in it
// ══════════════════════════════════════════════════════════════════════
//
// The reunion is the only episode that reads the WHOLE season rather than the
// row in front of it, which is why it was deferred out of the plan that built
// the weekly screens. The thing it must never become is a format: a fixed
// running order of five confrontations, produced whether or not the season
// had them.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { reunionTopics } from '../js/dr/reunion.js';
import { REUNION_BEATS, unwrittenReunionTiers } from '../js/dr/data/reunion-beats.js';
import { dragScreens } from '../js/vp-dr/screens.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer'];

function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: ARCH[i % ARCH.length], age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

function season(seed, config = {}) {
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  return playDragSeason({
    cast: cast(12, 9 + seed), seed, config: { drReunion: true, ...config },
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
    popDelta: () => {},
  });
}

describe('the reunion', () => {
  it('has no unwritten pools', () => {
    expect(unwrittenReunionTiers()).toEqual([]);
    for (const b of REUNION_BEATS) {
      for (const t of b.tiers) {
        expect(t.lines.length, `${b.id} has too few variants`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('is opt-in and sits before the crowning, eliminating nobody', () => {
    const off = season(3, { drReunion: false });
    expect(off.rows.some(r => r.dr.reunion), 'a reunion appeared unasked').toBe(false);

    const on = season(3);
    const i = on.rows.findIndex(r => r.dr.reunion);
    expect(i, 'no reunion').toBeGreaterThan(-1);
    expect(on.rows[i].exits.length, 'the reunion sent somebody home').toBe(0);
    // Between the last elimination and the finale, which is where the real
    // show's own track record chart puts its Reunion column.
    expect(on.rows[i + 1]?.dr?.finale, 'the reunion is not before the finale').toBeTruthy();
  });

  /* THE TEST THAT SEPARATES A MEMORY FROM A FORMAT. Every topic has to come
     out of the season: a reunion that always produced the same five
     confrontations would be a running order, not a reading. */
  it('derives every topic, and quiet seasons get fewer', () => {
    const counts = new Set();
    const kinds = {};
    for (let s = 0; s < 30; s++) {
      const out = season(s);
      const ru = out.rows.find(r => r.dr.reunion);
      const t = ru.dr.reunion.topics;
      counts.add(t.length);
      for (const x of t) kinds[x.kind] = (kinds[x.kind] || 0) + 1;
      // Nothing is invented: every topic names queens who were in this cast.
      for (const x of t) {
        for (const n of x.players) expect(out.state.castOrder).toContain(n);
      }
    }
    expect(counts.size, 'every season produced exactly the same number of topics')
      .toBeGreaterThan(1);
    // And every topic must be REACHABLE, or it is prose nothing draws.
    for (const id of ['feud', 'shock-exit', 'the-invisible', 'the-friendship',
      'the-frontrunner', 'congeniality']) {
      expect(kinds[id], `${id} never fired in 30 seasons`).toBeGreaterThan(0);
    }
  });

  it('the feud is a pair who actually shared scenes', () => {
    // A low bond between two queens who never appeared together is not a
    // feud, whatever the graph says — they have never been in a room.
    for (let s = 0; s < 15; s++) {
      const out = season(s);
      const ru = out.rows.find(r => r.dr.reunion);
      const feud = ru.dr.reunion.topics.find(t => t.kind === 'feud');
      if (!feud) continue;
      expect(feud.data.shared, `seed ${s}: a feud between strangers`).toBeGreaterThan(0);
      expect(feud.data.bond).toBeLessThanOrEqual(-3);
    }
  });

  it('the winner never also takes Miss Congeniality', () => {
    // The vote runs before the crowning so it can be announced at the
    // reunion, which means it cannot exclude a winner nobody knows yet.
    for (let s = 0; s < 25; s++) {
      const out = season(s);
      expect(out.congeniality, `seed ${s}`).toBeTruthy();
      expect(out.congeniality, `seed ${s}: crowned and sashed`).not.toBe(out.winner);
    }
  });

  it('draws a screen, and the arguments change the room', () => {
    const out = season(4);
    const ru = out.rows.find(r => r.dr.reunion);
    const screens = dragScreens(ru);
    expect(screens.map(s => s.label)).toContain('The Reunion');
    const html = screens.find(s => s.label === 'The Reunion').html;
    for (const sc of ru.dr.scenes) {
      if (!sc.text) continue;
      const run = sc.text.split(/["'“”’]/).sort((a, b) => b.length - a.length)[0].trim();
      expect(html, `${sc.kind} is on the row and not on the screen`).toContain(run);
    }
  });
});
