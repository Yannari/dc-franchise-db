// ══════════════════════════════════════════════════════════════════════
// dr-craft-lines.test.js — nobody sews on an acting week
// ══════════════════════════════════════════════════════════════════════
//
// Reported from a rendered episode, on an ACTING challenge:
//
//   "Minnie Skurr is in the room before anybody else. Garment already on
//    the form, tools already out. She sews for twenty straight minutes..."
//
// There was nothing to sew. `ev.needs` already gated a whole EVENT to a
// challenge using that craft — and it was the wrong tool, because the audit
// found twenty events carrying a line like that and NOT ONE of them is a
// sewing event. Every single one was one or two lines out of four, the rest
// of the pool being about the room, so gating the event would have deleted a
// good scene from every non-design week to fix one sentence inside it.
//
// A line may now declare its own craft: `{ needs: 'design', line: '...' }`
// beside plain strings that assume nothing. Same mechanism in the werk room
// and in the confessionals, which had ten of their own.
import { describe, expect, it } from 'vitest';
import { WERK_EVENTS } from '../js/dr/data/werk-events.js';
import { usableLines } from '../js/dr/werk.js';
import { CONFESSIONAL_TIERS } from '../js/dr/data/confessional-lines.js';
import { usableConfessionalLines } from '../js/dr/confessional.js';
import { playDragSeason } from '../js/dr/season.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

/* The vocabulary that can only be true when there is something to make. */
const SEWING = /\b(sew|sews|sewing|sewn|garment|fabric|bodice|hemline|mannequin|glue gun|pinning|needle|stitch)\b/i;
const textOf = l => (typeof l === 'string' ? l : (l && l.line) || '');

describe('a line that assumes a craft says so', () => {
  it('no untagged werk line talks about sewing', () => {
    const loose = [];
    for (const e of WERK_EVENTS) {
      if (e.needs === 'design') continue;          // the whole event is gated
      for (const l of e.lines || []) {
        if (typeof l === 'string' && SEWING.test(l)) loose.push(e.id);
      }
    }
    expect([...new Set(loose)], 'untagged sewing prose').toEqual([]);
  });

  it('no untagged confessional line talks about sewing', () => {
    const loose = [];
    for (const t of CONFESSIONAL_TIERS) {
      for (const l of t.lines || []) {
        if (typeof l === 'string' && SEWING.test(l)) loose.push(t.id);
      }
    }
    expect([...new Set(loose)], 'untagged sewing prose').toEqual([]);
  });

  it('drops a tagged line on a challenge that does not use the craft', () => {
    const e = WERK_EVENTS.find(x => x.id === 'alone-in-the-room-early');
    expect(usableLines(e, { design: 0.6 }).length).toBe(e.lines.length);
    expect(usableLines(e, { acting: 0.6 }).length).toBeLessThan(e.lines.length);
    // And with no blend at all, nothing is filtered — the old behaviour.
    expect(usableLines(e, null).length).toBe(e.lines.length);
  });

  it('never leaves an event with nothing to say', () => {
    /* The failure this would cause is a card with a portrait, a border and
       no words in it — the blank-plate bug. `drawWerkScene` also refuses to
       pick such an event, but a pool that empties is a writing problem and
       the guard belongs on the data. */
    for (const e of WERK_EVENTS) {
      for (const blend of [{ design: 1 }, { acting: 1 }, { comedy: 1 }, { dance: 1 }]) {
        /* Skip a blend the EVENT itself is gated away from — `sewing-rescue`
           is `needs: 'design'` and never runs on an acting week at all, so
           having no acting-safe line is correct rather than a hole. */
        if (e.needs && !blend[e.needs]) continue;
        expect(usableLines(e, blend).length, `${e.id} is silent on ${Object.keys(blend)[0]}`)
          .toBeGreaterThan(0);
      }
    }
    for (const t of CONFESSIONAL_TIERS) {
      if (!t.lines.length) continue;               // deliberately unwritten
      for (const blend of [{ design: 1 }, { acting: 1 }]) {
        expect(usableConfessionalLines(t, blend).length,
          `${t.id} is silent on ${Object.keys(blend)[0]}`).toBeGreaterThan(0);
      }
    }
  });

  it('every tagged line names a craft the engine knows', () => {
    const CRAFTS = new Set(['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing']);
    const all = [...WERK_EVENTS.flatMap(e => e.lines || []),
      ...CONFESSIONAL_TIERS.flatMap(t => t.lines || [])];
    for (const l of all) {
      if (typeof l === 'string') continue;
      expect(CRAFTS, `unknown craft "${l.needs}"`).toContain(l.needs);
      expect(textOf(l).length, 'a tagged line with no text').toBeGreaterThan(40);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// AND ON A REAL SEASON
// ══════════════════════════════════════════════════════════════════════
const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ['villain', 'hero', 'schemer', 'floater', 'mastermind', 'goat',
      'wildcard', 'underdog'][i % 8],
    age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};

describe('a played season never sews on the wrong night', () => {
  it('finds no sewing prose on a challenge with nothing to make', () => {
    let weeks = 0; const leaks = [];
    for (let s = 1; s <= 25; s++) {
      const season = playDragSeason({
        cast: cast(12, s * 7919 + 13), seed: s * 31 + 5, config: {},
        bond: () => 0, addBond: () => {}, popDelta: () => {},
      });
      for (const row of season.rows) {
        const maxi = maxiById(row.dr.challenge?.id);
        if (!maxi) continue;                       // the finale has no blend
        if (maxi.blend && maxi.blend.design) continue;
        weeks++;
        for (const sc of row.dr.scenes) {
          const k = sc.kind || '';
          if (!k.startsWith('werk:') && !k.startsWith('confess:')) continue;
          if (SEWING.test(sc.text || '')) {
            leaks.push(`${maxi.id} · ${k} · ${(sc.text || '').slice(0, 70)}`);
          }
        }
      }
    }
    expect(weeks, 'no non-design weeks were even checked').toBeGreaterThan(50);
    expect(leaks.slice(0, 5), `${leaks.length} leaks over ${weeks} weeks`).toEqual([]);
  });
});
