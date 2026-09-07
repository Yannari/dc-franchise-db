// ══════════════════════════════════════════════════════════════════════
// dr-untucked-events.test.js — the contract for the Untucked pool
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import {
  UNTUCKED_EVENTS, UNTUCKED_IDS, UNTUCKED_PHASES, unwrittenUntuckedEvents,
} from '../js/dr/data/untucked-events.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

/**
 * Are two lines the same beat reworded?
 *
 * Measured on the WHOLE line rather than its opening, and that distinction is
 * the whole point. The first version compared the first eighteen characters
 * and demanded all four differ, which is right for an ordinary scene and wrong
 * for a ritual: three of the winner's lines open with "Condragulations"
 * because that is the word the show says every single week, and the guard
 * called correct prose a failure.
 *
 * Shared vocabulary across a whole line is the real signal for a reworded
 * sentence, and a shared catchphrase at the front is not.
 */
function tooSimilar(x, y) {
  const words = t => new Set(String(t).toLowerCase().match(/[a-z']+/g) || []);
  const a = words(x);
  const b = words(y);
  if (!a.size || !b.size) return false;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size) > 0.6;
}

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
  ...over,
});

describe('the schema', () => {
  it('every event is complete and uniquely named', () => {
    expect(UNTUCKED_EVENTS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(UNTUCKED_IDS).size).toBe(UNTUCKED_IDS.length);
    for (const e of UNTUCKED_EVENTS) {
      expect(e.id, 'an event with no id').toBeTruthy();
      expect(UNTUCKED_PHASES, `${e.id} is in phase "${e.phase}"`).toContain(e.phase);
      expect(['solo', 'pair'], `${e.id} has cast "${e.cast}"`).toContain(e.cast);
      expect(e.note, `${e.id} has no note for the writer`).toBeTruthy();
      expect(typeof e.when, `${e.id} has no eligibility test`).toBe('function');
      expect(Array.isArray(e.lines), `${e.id} lines is not an array`).toBe(true);
    }
  });

  it('NOTHING IS COSMETIC: every event changes something', () => {
    for (const e of UNTUCKED_EVENTS) {
      const changes = (e.effects?.bond ? 1 : 0)
        + Object.keys(e.effects?.pop || {}).length
        + (e.effects?.state ? 1 : 0);
      expect(changes, `${e.id} has no consequence`).toBeGreaterThan(0);
    }
  });

  it('a solo event never moves a bond or pays {b}', () => {
    for (const e of UNTUCKED_EVENTS.filter(x => x.cast === 'solo')) {
      expect(e.effects.bond, `${e.id} is solo but moves a bond`).toBeFalsy();
      expect(e.effects.pop?.b, `${e.id} is solo but pays {b}`).toBeUndefined();
    }
  });

  it('every phase of the segment has enough to draw from', () => {
    // Untucked has an arc: off the stage, the long wait, called back. A phase
    // with two events shows the same beat every week.
    for (const phase of UNTUCKED_PHASES) {
      const n = UNTUCKED_EVENTS.filter(e => e.phase === phase).length;
      expect(n, `phase "${phase}" has only ${n} events`).toBeGreaterThanOrEqual(6);
    }
  });
});

describe('eligibility', () => {
  const facts = over => ({
    a: mk('Ada'), b: mk('Bee'), bond: 0, canScheme: false,
    lastCall: 'SAFE', callA: 'SAFE', callB: 'SAFE',
    inBottom: false, bInBottom: false, bothInBottom: false,
    namedOnStage: false, tension: false, winsA: 0, phase: 0.5, episode: 3,
    ...over,
  });

  it('no eligibility test throws, on any shape of night', () => {
    const shapes = [
      facts({}),
      facts({ bond: -9, canScheme: true, lastCall: 'BTM', inBottom: true, bothInBottom: true, tension: true, namedOnStage: true }),
      facts({ bond: 9, lastCall: 'WIN', callA: 'WIN', winsA: 4 }),
      facts({ a: mk('Ada', { comedy: 10 }, { stats: { ...Object.fromEntries(STATS.map(k => [k, 2])) } }) }),
    ];
    for (const e of UNTUCKED_EVENTS) {
      for (const f of shapes) {
        expect(() => e.when(f), `${e.id} threw on a legal night`).not.toThrow();
      }
    }
  });

  it('an ordinary night has plenty eligible in every phase', () => {
    // THE NUMBER THAT DECIDES REPETITION — measured on what is eligible, not
    // on what is written. The werk room pool failed this exact check first
    // time round with sixty events in it.
    const ordinary = facts({});
    for (const phase of UNTUCKED_PHASES) {
      const n = UNTUCKED_EVENTS.filter(e => e.phase === phase && e.when(ordinary)).length;
      expect(n, `phase "${phase}" offers only ${n} on an ordinary night`).toBeGreaterThanOrEqual(4);
    }
  });

  it('a bottom-two night unlocks the beats that are about it', () => {
    const bottom = facts({ inBottom: true, bothInBottom: true, lastCall: 'BTM' });
    const unlocked = UNTUCKED_EVENTS.filter(e => e.when(bottom)).length;
    const ordinary = UNTUCKED_EVENTS.filter(e => e.when(facts({}))).length;
    expect(unlocked).toBeGreaterThan(ordinary);
  });
});

describe('the lines', () => {
  const written = UNTUCKED_EVENTS.filter(e => e.lines.length);

  it('there are exemplars to write against', () => {
    expect(written.length).toBeGreaterThanOrEqual(2);
  });

  it('a written event has four genuinely different variants', () => {
    for (const e of written) {
      expect(e.lines.length, `${e.id} has ${e.lines.length}`).toBeGreaterThanOrEqual(4);
      expect(new Set(e.lines).size, `${e.id} repeats a line`).toBe(e.lines.length);
      for (let i = 0; i < e.lines.length; i++) {
        for (let k = i + 1; k < e.lines.length; k++) {
          expect(tooSimilar(e.lines[i], e.lines[k]),
            `${e.id}: variants ${i + 1} and ${k + 1} are the same beat reworded`).toBe(false);
        }
      }
    }
  });

  it('uses {a} and {b} correctly, and never a name', () => {
    for (const e of written) {
      for (const l of e.lines) {
        expect(l, `${e.id} never names its subject`).toMatch(/\{a\}/);
        if (e.cast === 'solo') expect(l, `${e.id} is solo but uses {b}`).not.toMatch(/\{b\}/);
        const bad = l.match(/\{(?!a\}|b\})[^}]*\}/);
        expect(bad, `${e.id} uses unknown placeholder ${bad?.[0]}`).toBeNull();
      }
    }
  });

  it('speaks this show and no other', () => {
    for (const e of written) {
      for (const l of e.lines) {
        const bad = foreignWordsIn(l, 'drag-race');
        expect(bad, `${e.id} says "${bad[0]}", which belongs to another show`).toEqual([]);
      }
    }
  });

  it('writes prose, not a caption', () => {
    for (const e of written) {
      for (const l of e.lines) {
        expect(l.length, `${e.id} has a one-liner`).toBeGreaterThan(80);
      }
    }
  });
});

describe('what is left to write', () => {
  it('reports the gap rather than hiding it', () => {
    const left = unwrittenUntuckedEvents();
    // eslint-disable-next-line no-console
    console.log(`untucked: ${UNTUCKED_EVENTS.length - left.length} of ${UNTUCKED_EVENTS.length} written.`
      + `\nstill to write (${left.length}): ${left.join(', ')}`);
    expect(Array.isArray(left)).toBe(true);
  });
});
