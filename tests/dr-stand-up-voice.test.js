// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-stand-up-voice.test.js — the roast printed over a stand-up
// ══════════════════════════════════════════════════════════════════════
//
// "It keeps using roast card, it's a stand-up challenge."
//
// The screen was correctly headed "Stand-Up Challenge · five minutes, no net"
// and then narrated five queens roasting: "a polite smile during a ROAST",
// "a good ROAST from {a}", "the worst place a queen can be on ROAST night".
// `serves: ['roast', 'stand-up']` — one voice for both.
//
// And under it, the slot picks were the GIRL GROUP's. Both challenges declare
// `roles: 'slots'` and the `slots` pick pool is written about a verse in a
// group number, so a queen choosing her place on a comedy bill was handed
// "the verse with the most bars" and "the position with the most real estate,
// the best placement in the number", then sent off "counting her bars".
//
// A roast has a TARGET — a guest, the panel, each other, sitting in the room
// hearing it. A stand-up has nobody to aim at: five minutes of her own
// material with no victim to hide behind. Different nights, and the whole job
// is the difference. Both pools are empty for now and fall back to neutral
// generic wording; docs/PROSE-PROMPT-dr-stand-up.md is the brief.
//
// The bug class CLAUDE.md opens with: one challenge's vocabulary printed over
// another.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { familyForChallenge } from '../js/dr/data/maxi-performance.js';
import { pickKindFor } from '../js/dr/data/maxi-voices.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const r = rngFor(seed); const d = () => 1 + Math.floor(r() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, d()])),
    drag: { acting: d(), comedy: d(), dance: d(), design: d(), runway: d(), lipsync: d(), singing: d() },
  }));
};

/** A stand-up night, booked rather than hoped for. */
function standUp(seed) {
  const s = playDragSeason({
    cast: cast(12, 700 + seed), seed,
    config: { drSchedule: [{ episode: 5, maxiId: 'stand-up' }] },
  });
  return s.rows.find(r => r.dr?.challenge?.id === 'stand-up');
}
const words = row => (row.dr.scenes || [])
  .filter(sc => sc.text && sc.step !== 'lipsync' && sc.step !== 'mini')
  .map(sc => `[${sc.kind}] ${sc.text}`);

describe('the stand-up speaks for itself', () => {
  it('does not borrow the roast', () => {
    expect(familyForChallenge('stand-up').family).toBe('stand-up');
    expect(familyForChallenge('roast').family).toBe('roast');
  });

  it('does not pick a verse in a group number', () => {
    // The girl group keeps `slots`; a comedy bill is a running order.
    expect(pickKindFor('stand-up')).toBe('running-order');
    expect(pickKindFor('roast')).toBe('running-order');
    expect(pickKindFor('girl-group')).not.toBe('running-order');
  });

  /* READ THE OUTPUT. Every real defect on this show came from printing a
     season and reading it, so the case is the reading, done over seeds. */
  for (const seed of [3, 11, 27]) {
    it(`says nothing about a roast or a verse, seed ${seed}`, () => {
      const row = standUp(seed);
      expect(row, 'the stand-up was pinned and did not happen').toBeTruthy();
      const lines = words(row);
      expect(lines.length, 'the night narrated nothing').toBeGreaterThan(5);

      /* The vocabulary of the two challenges it was borrowing, verbatim off
         the reported screen. `verse`/`bars` are excluded from the lip sync and
         the mini above, where a song and an eight-count are real. And it is
         "in the number", not "the number": a queen counting how many of them
         are left says a number into the werk room, and that is a sentence
         about the season rather than about a girl group. */
      const BORROWED = /\broast(ing|ed|s)?\b|\bverse\b|\bbars\b|eight-count|in the number\b|real estate/i;
      const bad = lines.filter(l => BORROWED.test(l));
      expect(bad, `borrowed vocabulary on a stand-up:\n${bad.join('\n')}`).toEqual([]);
    });
  }

  it('still lets the roast be a roast', () => {
    /* The fix must not neuter the challenge it was borrowed FROM. The roast's
       own family keeps its own words. */
    const s = playDragSeason({
      cast: cast(12, 703), seed: 3,
      config: { drSchedule: [{ episode: 5, maxiId: 'roast' }] },
    });
    const row = s.rows.find(r => r.dr?.challenge?.id === 'roast');
    expect(row).toBeTruthy();
    expect(familyForChallenge('roast').family).toBe('roast');
    const said = words(row).join('\n');
    expect(said, 'the roast lost its own voice').toMatch(/roast/i);
  });

  it('narrates a solo draft without sending her to a team', () => {
    /* The fallback beat every unwritten draft lands on. Two of its four
       `picked-last` lines walked her over to "her team" and a third sat her
       with "the queens already seated" — on a night with no teams in it. */
    for (const seed of [3, 11, 27]) {
      const row = standUp(seed);
      if (!row) continue;
      const said = words(row).join('\n');
      expect(said, `a solo challenge put her on a team (seed ${seed})`)
        .not.toMatch(/her team|already seated/i);
    }
  });
});
