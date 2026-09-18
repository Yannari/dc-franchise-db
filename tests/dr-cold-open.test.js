// ══════════════════════════════════════════════════════════════════════
// tests/dr-cold-open.test.js — the room, minutes after
// ══════════════════════════════════════════════════════════════════════
//
// The cold open was ONE werk event drawn off a single fact — somebody left —
// so a night with a challenge, a winner, a bottom and a song in it produced a
// card about an empty chair, and the episode that had just happened was never
// discussed by the people it happened to. It is a written scene now, built
// from `state.lastWeek`.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { mirrorMessage, coldOpen } from '../js/dr/coldopen.js';
import { MIRROR, COLD_BEATS } from '../js/dr/data/cold-open-beats.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer', 'mastermind', 'underdog'];

function bareCast(n, seed) {
  const rng = rngFor(seed * 7919 + 13); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: ARCH[i % ARCH.length], age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
  }));
}
function season(seed, config = {}) {
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  return Object.assign({ bonds }, playDragSeason({
    cast: bareCast(12, seed), seed: seed * 101 + 7, config,
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
    popDelta: () => {},
  }));
}
const mornings = res => res.rows
  .map(r => (r.dr.scenes || []).filter(s => String(s.kind).startsWith('cold:')))
  .filter(l => l.length);

describe('the cold open talks about the episode that just happened', () => {
  it('reads the mirror message out loud, and somebody wrote it', () => {
    for (const list of mornings(season(5)).slice(0, 4)) {
      const read = list.find(s => s.kind === 'cold:read');
      const msg = list.find(s => s.kind === 'cold:mirror');
      expect(read, 'nobody read it').toBeTruthy();
      expect(msg).toBeTruthy();
      // Signed by the queen who left, and read by somebody still in the room.
      expect(msg.text).toContain(msg.data.wrote);
      expect(list.indexOf(read)).toBeLessThan(list.indexOf(msg));
    }
  });

  it('names the challenge, congratulates the winner and hears the bottom', () => {
    const kinds = new Set();
    for (const list of mornings(season(5))) for (const s of list) kinds.add(s.kind);
    expect(kinds.has('cold:challenge')).toBe(true);
    expect(kinds.has('cold:congrats')).toBe(true);
    expect([...kinds].some(k => k.startsWith('cold:winner-'))).toBe(true);
    expect([...kinds].some(k => k.startsWith('cold:bottom-'))).toBe(true);
  });

  it('gives the bottom four different ways to feel about it', () => {
    const moods = new Set();
    for (const seed of [5, 6, 7, 19, 42]) {
      for (const list of mornings(season(seed))) {
        for (const s of list) if (s.data?.mood) moods.add(s.data.mood);
      }
    }
    /* Sad, angry, fine, or genuinely not bothered — the ask, and the thing a
       single pool could never say. */
    expect(moods).toEqual(new Set(['sad', 'angry', 'fine', 'dont-care']));
  });

  it('lets a queen say what being safe costs her', () => {
    const safe = mornings(season(5)).flat().filter(s => s.kind === 'cold:safe');
    expect(safe.length).toBeGreaterThan(0);
  });

  it('moves bonds — it is a scene, not a caption', () => {
    const res = season(5);
    const types = new Set();
    for (const row of res.rows) {
      for (const e of row.dr.events || []) if (String(e.type).startsWith('cold:')) types.add(e.type);
    }
    expect(types.size).toBeGreaterThan(1);
  });

  it('says nothing at all on the premiere: nobody has left', () => {
    const first = season(5).rows[0];
    expect((first.dr.scenes || []).some(s => String(s.kind).startsWith('cold:'))).toBe(false);
  });
});

describe('the mirror message', () => {
  const players = Object.fromEntries(['A', 'B', 'C'].map(n => [n, {
    name: n, archetype: 'hero', stats: Object.fromEntries(STATS.map(k => [k, 5])),
  }]));

  it('is signed, and only names somebody when the line has a name in it', () => {
    for (let i = 0; i < 40; i += 1) {
      const m = mirrorMessage({
        gone: 'A', living: ['B', 'C'], players, record: { B: ['WIN'], C: [] },
        bond: (x, y) => (x === 'A' && y === 'B' ? 6 : 0), rng: rngFor(i + 1),
      });
      expect(m.text).toContain('A');
      expect(m.text).not.toContain('{');
      if (m.at) expect(m.text).toContain(m.at);
    }
  });

  it('has every kind the wiki has, and writes all of them', () => {
    expect(Object.keys(MIRROR).sort())
      .toEqual(['blessing', 'defiant', 'joke', 'shade', 'warm']);
    /* ONE STREAM, NOT TWO HUNDRED. `rngFor(n)` seeds a fresh sequence and
       the first draw of a fresh sequence is what picks the kind — so seeding
       per call measured the seeder, not the chooser, and reported one kind
       out of two hundred rolls. */
    const rng = rngFor(11);
    const seen = new Set();
    for (let i = 0; i < 200; i += 1) {
      seen.add(mirrorMessage({
        gone: 'A', living: ['B', 'C'], players, record: {},
        bond: (x, y) => (y === 'B' ? 6 : -6), rng, endedBy: 'C',
      }).kind);
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('does not name a queen who is not in the room', () => {
    const { scenes } = coldOpen({
      last: { gone: ['A'], winner: 'B', maxi: 'The Ball', bottom: ['C'] },
      living: ['B', 'C'], players, record: {}, bond: () => 0, rng: rngFor(3),
    });
    for (const s of scenes) expect(s.text).not.toContain('A ');
  });
});

describe('a bottom queen did not necessarily sing', () => {
  /* THE BUG docs/drag-race.md WARNS ABOUT, reported off a played All Stars
     season: "I sang for my life and I am still in this competition", said by
     a queen who never took the stage, because on a legacy night the TOP TWO
     sing and the bottom simply waits to hear a name. */
  const SINGS = /\b(sang|sings?|sung|lip ?sync|song)\b/i;

  /* THE REGEX IS WRITTEN OUT, NOT PATCHED IN. The first version of this
     guard was assembled by a script and its word boundaries arrived as
     literal backspace characters — the pattern matched nothing, the test
     passed on a pool that had an untagged offender in it, and it would have
     gone on passing forever. An unfailable guard is worse than no guard. */
  it('tags every line that assumes a song', () => {
    const loose = [];
    for (const [mood, pool] of Object.entries(COLD_BEATS.bottom)) {
      for (const l of pool) {
        const text = typeof l === 'string' ? l : l.line;
        const tagged = typeof l !== 'string' && !!l.when;
        if (SINGS.test(text) && !tagged) loose.push(`${mood}: ${text.slice(0, 60)}`);
      }
    }
    expect(loose, 'these claim a song on a night that may not have had one').toEqual([]);
  });

  it('never tells a spared queen she sang', () => {
    for (const seed of [7, 19, 42, 300]) {
      for (const row of season(seed, { drAllStars: true }).rows) {
        if (!row.dr.lipsync?.legacy) continue;
        const sang = new Set(row.dr.lipsync.queens || []);
        for (const sc of (row.dr.scenes || []).filter(x => String(x.kind).startsWith('cold:bottom-'))) {
          const who = (sc.data?.players || [])[0];
          if (sang.has(who)) continue;
          expect(SINGS.test(sc.text) && sc.data.when !== 'spared',
            `${who} never sang: ${sc.text.slice(0, 70)}`).toBe(false);
        }
      }
    }
  });
});
