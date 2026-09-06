// ══════════════════════════════════════════════════════════════════════
// dr-werk-events.test.js — the contract the pool has to keep
// ══════════════════════════════════════════════════════════════════════
//
// This file exists to be run by whoever writes the lines. Every rule in the
// header of js/dr/data/werk-events.js is checked here, so filling the pool is
// a job with a green light at the end of it rather than a guess.
import { describe, expect, it } from 'vitest';
import { WERK_EVENTS, WERK_IDS, SLOTS, unwrittenWerkEvents } from '../js/dr/data/werk-events.js';
import { showWords } from '../js/shows.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
  ...over,
});

describe('the schema', () => {
  it('every event is complete and uniquely named', () => {
    expect(WERK_EVENTS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(WERK_IDS).size).toBe(WERK_IDS.length);
    for (const e of WERK_EVENTS) {
      expect(e.id, 'an event with no id').toBeTruthy();
      expect(SLOTS, `${e.id} sits in no known slot`).toContain(e.slot);
      expect(['solo', 'pair'], `${e.id} has cast "${e.cast}"`).toContain(e.cast);
      expect(e.note, `${e.id} has no note for the writer`).toBeTruthy();
      expect(typeof e.when, `${e.id} has no eligibility test`).toBe('function');
      expect(Array.isArray(e.lines), `${e.id} lines is not an array`).toBe(true);
      expect(Array.isArray(e.arcs), `${e.id} arcs is not an array`).toBe(true);
    }
  });

  it('NOTHING IS COSMETIC: every event changes something', () => {
    // The project's oldest broken rule. An event with no consequence is a
    // scene the viewer is shown that the season does not remember.
    for (const e of WERK_EVENTS) {
      const changes = (e.effects?.bond ? 1 : 0)
        + Object.keys(e.effects?.pop || {}).length
        + (e.effects?.state ? 1 : 0);
      expect(changes, `${e.id} has no consequence`).toBeGreaterThan(0);
    }
  });

  it('a solo event never moves a bond, because there is nobody to move it with', () => {
    for (const e of WERK_EVENTS.filter(x => x.cast === 'solo')) {
      expect(e.effects.bond, `${e.id} is solo but moves a bond`).toBeFalsy();
      expect(e.effects.pop?.b, `${e.id} is solo but pays {b}`).toBeUndefined();
    }
  });

  it('every slot has enough events to fill a season without repeating itself', () => {
    // ~45 werk room draws a season across four slots. A slot with a handful of
    // events shows the same scene every week, which is the repetition ceiling
    // the Traitors pool hit — and it hit it with plenty written, because the
    // filters had shrunk what was eligible.
    for (const slot of SLOTS) {
      const n = WERK_EVENTS.filter(e => e.slot === slot).length;
      expect(n, `slot "${slot}" has only ${n} events`).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('the lines', () => {
  const written = WERK_EVENTS.filter(e => e.lines.length);

  it('there are exemplars to write against', () => {
    expect(written.length, 'nothing is written at all').toBeGreaterThanOrEqual(4);
  });

  it('a written event has at least four genuinely different variants', () => {
    for (const e of written) {
      expect(e.lines.length, `${e.id} has ${e.lines.length} variants`).toBeGreaterThanOrEqual(4);
      expect(new Set(e.lines).size, `${e.id} repeats a line verbatim`).toBe(e.lines.length);
      // Four rewordings of one sentence is not four variants.
      const openings = e.lines.map(l => l.slice(0, 18));
      expect(new Set(openings).size, `${e.id}: variants all open the same way`).toBe(e.lines.length);
    }
  });

  it('uses {a} and {b} correctly, and never a name', () => {
    for (const e of written) {
      for (const l of e.lines) {
        expect(l, `${e.id} never names its subject`).toMatch(/\{a\}/);
        if (e.cast === 'solo') {
          // The Traitors failure exactly: a {b} in a solo pool makes the line
          // ineligible forever and the pool silently shrinks.
          expect(l, `${e.id} is solo but the line uses {b}`).not.toMatch(/\{b\}/);
        }
        const bad = l.match(/\{(?!a\}|b\})[^}]*\}/);
        expect(bad, `${e.id} uses an unknown placeholder ${bad?.[0]}`).toBeNull();
      }
    }
  });

  it('speaks this show and not another one', () => {
    // The recurring bug class the whole registry exists for: one show's
    // vocabulary printed over another's.
    const FOREIGN = /\b(houseguest|houseguests|castaway|castaways|tribe|tribal council|eviction|evicted|nominee|nominated|veto|head of household|traitor|faithful|banish\w*|murder\w*|the circle)\b/i;
    for (const e of written) {
      for (const l of e.lines) {
        const hit = l.match(FOREIGN);
        expect(hit, `${e.id} says "${hit?.[0]}", which belongs to another show`).toBeNull();
      }
    }
  });

  it('uses the drag vocabulary where it uses any', () => {
    const w = showWords('drag-race');
    expect(w.player).toBe('queen');
    // If a line names the contest at all it has to call it the right thing.
    for (const e of written) {
      for (const l of e.lines) {
        expect(l, `${e.id} calls it a competition`).not.toMatch(/\bcompetition\b/i);
      }
    }
  });

  it('never quotes a stat by name', () => {
    const NUMBERS = /\b(design|runway|lipsync|acting|comedy|singing|dance) (is|of|at) \d/i;
    for (const e of written) {
      for (const l of e.lines) {
        expect(l.match(NUMBERS), `${e.id} quotes a stat`).toBeNull();
      }
    }
  });

  it('writes prose, not a caption', () => {
    for (const e of written) {
      for (const l of e.lines) {
        expect(l.length, `${e.id} has a one-liner where a scene should be`).toBeGreaterThan(80);
      }
    }
  });
});

describe('eligibility', () => {
  const facts = over => ({
    a: mk('Ada'), b: mk('Bee'), bond: 0, canScheme: false, sameTeam: false,
    lastCall: 'SAFE', winsA: 0, winsB: 0, safesA: 0, phase: 0.5, episode: 3,
    roomSize: 8, someoneLeft: true, lostAFriend: false, lostAnEnemy: false,
    ...over,
  });

  it('no eligibility test throws, on any shape of week', () => {
    const shapes = [
      facts({}),
      facts({ bond: -9, canScheme: true, lastCall: 'BTM', phase: 0.1, roomSize: 13 }),
      facts({ bond: 9, winsA: 4, winsB: 3, safesA: 6, phase: 0.95, roomSize: 4 }),
      facts({ a: mk('Ada', { comedy: 10, design: 10, runway: 10 }), lostAFriend: true }),
      facts({ a: mk('Ada', { comedy: 1, design: 1, runway: 1 }), lostAnEnemy: true }),
    ];
    for (const e of WERK_EVENTS) {
      for (const f of shapes) {
        expect(() => e.when(f), `${e.id} threw on a legal week`).not.toThrow();
      }
    }
  });

  it('an ordinary night has plenty eligible in every slot', () => {
    // THE NUMBER THAT ACTUALLY DECIDES REPETITION. A pool of forty-five that
    // filters to three on a normal night reads worse than a pool of twenty
    // that all apply, which is what the Traitors post-mortem found.
    const ordinary = facts({});
    for (const slot of SLOTS) {
      const n = WERK_EVENTS.filter(e => e.slot === slot && e.when(ordinary)).length;
      expect(n, `slot "${slot}" offers only ${n} events on an ordinary night`)
        .toBeGreaterThanOrEqual(4);
    }
  });
});

describe('what is left to write', () => {
  it('reports the gap rather than hiding it', () => {
    const left = unwrittenWerkEvents();
    // eslint-disable-next-line no-console
    console.log(`werk room: ${WERK_EVENTS.length - left.length} of ${WERK_EVENTS.length} events written.`
      + `\nstill to write (${left.length}): ${left.join(', ')}`);
    expect(Array.isArray(left)).toBe(true);
  });
});
