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

  it('never leaves an event with nothing to say ANYWHERE', () => {
    /* THE PREMISE OF THIS CHANGED, and the first version was wrong.

       It demanded every event have a usable line on every blend, which is
       right only while a craft tag is the exception. `coaching-through-it` is
       "{a} runs {b} lines or steps until {b} has it" — all four of its lines
       are a performance, and a design week has neither lines nor steps, so it
       SHOULD fall silent there. The event is not broken; it is inapplicable.

       The property that actually matters is that an event is never dead
       everywhere, and that the engine never PICKS a silent one — which
       `drawWerkScene` already refuses to do, and which the played-season
       check below measures rather than assumes. */
    const BLENDS = [{ design: 1 }, { acting: 1 }, { comedy: 1 }, { dance: 1 },
      { singing: 1 }, { runway: 1 }, { lipsync: 1 }];
    for (const e of WERK_EVENTS) {
      const reachable = BLENDS.some(b => usableLines(e, b).length > 0);
      expect(reachable, `${e.id} can never be said on any challenge`).toBe(true);
    }
    for (const t of CONFESSIONAL_TIERS) {
      if (!t.lines.length) continue;               // deliberately unwritten
      const reachable = BLENDS.some(b => usableConfessionalLines(t, b).length > 0);
      expect(reachable, `${t.id} can never be said on any challenge`).toBe(true);
    }
  });

  it('an event gated away from a night is gated for a REASON', () => {
    /* The counterpart, so the rule above cannot be satisfied by tagging
       carelessly: an event that goes silent on some challenge must have had
       every one of its lines tagged deliberately, not half of them. */
    const BLENDS = [{ design: 1 }, { acting: 1 }, { dance: 1 }, { singing: 1 }];
    for (const e of WERK_EVENTS) {
      for (const blend of BLENDS) {
        if (usableLines(e, blend).length) continue;
        if (e.needs) continue;                     // gated at the event level
        const tagged = (e.lines || []).filter(l => typeof l !== 'string').length;
        expect(tagged, `${e.id} is silent on ${Object.keys(blend)[0]} by accident`)
          .toBe((e.lines || []).length);
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
