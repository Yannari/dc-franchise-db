// Batch two: the body half of the competition expansion.
//
// Three endurance/physical comps and three precision ones, and the thing worth
// testing is not that they run — the library smoke test covers that — but that
// they are NOT the same competition six times. Each one has a rule that only it
// has, and each of those rules is asserted here.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const NAMES = ['Wayne', 'Priya', 'Cole', 'Dara', 'Eli', 'Fern', 'Gus', 'Hana'];
const CAST = NAMES.map((name, i) => ({
  name, archetype: 'floater', gender: i % 2 ? 'f' : 'm', sexuality: 'straight', stats: spread(i + 2),
}));

const seededRng = (seed = 7) => {
  let s = seed;
  const next = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 8; i++) next();
  return next;
};

const BATCH = ['bb-stamina-dizzy-discs', 'bb-stamina-log-roll', 'bb-stamina-hold-up',
  'bb-hand-caged-eggs', 'bb-hand-laser-maze', 'bb-hand-water-rescue'];

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [] });
  gs.activePlayers = [...NAMES];
  gs.popularity = {};
  gs.bb = { stats: {}, weeks: [] };
  seasonConfig.jurySize = 4;
}

const run = (id, { type = 'hoh', field = null, rng = seededRng(9) } = {}) => runBBCompetition({
  type, participants: field || NAMES.slice(0, 6), house: NAMES,
  week: { num: 4, houseAtStart: NAMES }, rng, library: BB_COMPETITIONS, forcedId: id,
});

beforeEach(reset);

describe('batch two runs and ranks', () => {
  it('every competition produces a winner, narration and an order', () => {
    for (const id of BATCH) {
      reset();
      const comp = BB_COMPETITIONS.find(c => c.id === id);
      expect(comp, `${id} missing from the library`).toBeTruthy();
      const type = comp.types.includes('hoh') ? 'hoh' : 'veto';
      const result = run(id, { type });
      expect(result.winner).toBeTruthy();
      expect(result.beats.length).toBeGreaterThan(2);
      const scores = result.placements.map(n => result.scores[n]);
      expect(scores, `${id} did not rank`).toEqual([...scores].sort((a, b) => b - a));
      for (const b of result.beats) {
        expect(b.text).not.toMatch(/undefined|NaN|\[object/);
        expect(b.badgeText).toBeTruthy();
      }
    }
  });

  it('keeps the slot split the wiki describes', () => {
    const of = id => BB_COMPETITIONS.find(c => c.id === id);
    // The Wall is HOH-side in the show and so are these two.
    expect(of('bb-stamina-log-roll').types).not.toContain('veto');
    expect(of('bb-stamina-hold-up').types).not.toContain('veto');
    // Laser Maze is a veto competition and never an HOH.
    expect(of('bb-hand-laser-maze').types).not.toContain('hoh');
  });
});

describe('each one is lost its own way', () => {
  it('Log Roll ends people on TWO different clocks', () => {
    // The rule that makes this not another wall: you go out by falling off OR
    // by dropping the string, and over a field both have to actually happen.
    const causes = new Set();
    for (let seed = 1; seed <= 40; seed++) {
      reset();
      const rows = run('bb-stamina-log-roll', { rng: seededRng(seed) }).debug.scoreBreakdown;
      Object.values(rows).forEach(r => causes.add(r.endedBy));
    }
    expect(causes.has('fell'), 'nobody ever fell off the log').toBe(true);
    expect(causes.has('dropped'), 'nobody ever dropped the string').toBe(true);
  });

  it('Log Roll ends each houseguest on whichever of their clocks ran out first', () => {
    reset();
    const rows = run('bb-stamina-log-roll').debug.scoreBreakdown;
    for (const [name, r] of Object.entries(rows)) {
      const shorter = Math.min(r.feetClock, r.stringClock);
      expect(r.minutes, `${name} survived past their own shorter clock`).toBeCloseTo(shorter, 1);
      expect(r.endedBy).toBe(r.feetClock <= r.stringClock ? 'fell' : 'dropped');
    }
  });

  it('Dizzy Discs eliminates round by round rather than sorting once', () => {
    reset();
    const result = run('bb-stamina-dizzy-discs');
    const rows = result.debug.scoreBreakdown;
    const rounds = new Set(Object.values(rows).map(r => r.rounds));
    expect(rounds.size, 'everybody went out on the same round').toBeGreaterThan(1);
    // The winner lasted at least as long as everybody else.
    const best = Math.max(...Object.values(rows).map(r => r.rounds || 0));
    expect(rows[result.winner].rounds).toBe(best);
  });

  it('Caged Eggs punishes hurrying, and a broken egg costs real time', () => {
    let cleanTotal = 0;
    let cleanCount = 0;
    let messyTotal = 0;
    let messyCount = 0;
    for (let seed = 1; seed <= 40; seed++) {
      reset();
      const rows = run('bb-hand-caged-eggs', { rng: seededRng(seed) }).debug.scoreBreakdown;
      for (const r of Object.values(rows)) {
        if (r.broken === 0) { cleanTotal += r.seconds; cleanCount++; }
        else { messyTotal += r.seconds; messyCount++; }
      }
    }
    expect(cleanCount, 'nobody ever had a clean run').toBeGreaterThan(0);
    expect(messyCount, 'nobody ever broke one').toBeGreaterThan(0);
    expect(messyTotal / messyCount).toBeGreaterThan(cleanTotal / cleanCount);
  });

  it('Water Rescue can be lost by the fastest swimmer', () => {
    // The whole reason for a two-part competition. If leading out of the water
    // always won it, the puzzle would be scenery.
    let stolen = 0;
    let runs = 0;
    for (let seed = 1; seed <= 60; seed++) {
      reset();
      const result = run('bb-hand-water-rescue', { type: 'veto', rng: seededRng(seed) });
      runs++;
      if (result.detail.outFirst !== result.winner) stolen++;
      // And the winner really did post the lowest total.
      const rows = result.debug.scoreBreakdown;
      const best = Math.min(...Object.values(rows).map(r => r.seconds));
      expect(rows[result.winner].seconds).toBe(best);
    }
    expect(stolen, 'the fastest swimmer always won').toBeGreaterThan(runs * 0.2);
    expect(stolen, 'leading out of the water never mattered at all').toBeLessThan(runs * 0.9);
  });

  it('Laser Maze is decided by beams touched, not by fatigue', () => {
    reset();
    const result = run('bb-hand-laser-maze', { type: 'veto' });
    const rows = result.debug.scoreBreakdown;
    // Somebody clean should beat somebody who broke beams, all else equal:
    // every break carries a real penalty, so more breaks is a slower clock.
    const byBreaks = Object.values(rows).sort((a, b) => a.beamsBroken - b.beamsBroken);
    if (byBreaks[0].beamsBroken < byBreaks[byBreaks.length - 1].beamsBroken) {
      expect(byBreaks[0].seconds).toBeLessThan(byBreaks[byBreaks.length - 1].seconds);
    }
    for (const r of Object.values(rows)) {
      expect(r.beamsBroken).toBeGreaterThanOrEqual(0);
      expect(r.beamsBroken).toBeLessThanOrEqual(result.detail.sections);
    }
  });

  it("What's The Hold Up rewards a steady hand over a strong one", () => {
    // Two houseguests, one strong and rattled, one weaker and calm. Over many
    // seeds the calm one has to win more often, or the flexible pole is a prop.
    let calmWins = 0;
    for (let seed = 1; seed <= 60; seed++) {
      seedGame([
        { name: 'Strong', archetype: 'challenge-beast', gender: 'm', sexuality: 'straight',
          stats: { ...spread(3), physical: 10, endurance: 9, temperament: 2, intuition: 3 } },
        { name: 'Calm', archetype: 'floater', gender: 'f', sexuality: 'straight',
          stats: { ...spread(4), physical: 4, endurance: 4, temperament: 10, intuition: 9 } },
      ], { episode: 0, eliminated: [] });
      gs.activePlayers = ['Strong', 'Calm'];
      gs.bb = { stats: {}, weeks: [] };
      gs.popularity = {};
      const result = runBBCompetition({
        type: 'hoh', participants: ['Strong', 'Calm'], house: ['Strong', 'Calm'],
        week: { num: 4 }, rng: seededRng(seed), library: BB_COMPETITIONS, forcedId: 'bb-stamina-hold-up',
      });
      if (result.winner === 'Calm') calmWins++;
    }
    expect(calmWins, 'steadiness counted for nothing').toBeGreaterThan(30);
    expect(calmWins, 'strength counted for nothing at all').toBeLessThan(58);
  });
});
