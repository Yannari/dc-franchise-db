// Parts one and two of the final Head of Household.
//
// These were three draws from the weekly library until now, which meant the
// last competition of the season was narrated by the code that narrates week
// four. What is being asserted here is the two things that make them set
// pieces rather than renamed HOH comps:
//
//   1. The RULES. All three play part one; only the two who lost it play part
//      two; neither can ever be drawn for a weekly slot.
//   2. The two ways they can be LOST that a stat sort cannot produce — coming
//      off the wall on purpose in exchange for a promise, and losing a run you
//      were winning because you did not read the instructions.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition, BB_COMP_TYPES } from '../js/bb/comps.js';
import { BB_COMPETITIONS, FINAL_HOH_COMPS } from '../js/bb-comps/index.js';
import { endgameDealsOf } from '../js/bb/deals.js';
import { simulateBBFinale } from '../js/bb-finale.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
].map(([name, archetype, gender], i) =>
  ({ name, archetype, gender, sexuality: 'straight', stats: spread(i + 1) }));

const seededRng = (seed = 7) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function reset(active = ['A', 'B', 'C']) {
  seedGame(CAST, { episode: 0, eliminated: CAST.map(p => p.name).filter(n => !active.includes(n)) });
  gs.activePlayers = [...active];
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {};
  gs.jury = [];
  seasonConfig.jurySize = 3;
  seasonConfig.finaleSize = 3;
}

const runPart = (id, participants, rng) => runBBCompetition({
  type: 'final', participants, house: participants,
  week: { num: 12 }, rng, library: BB_COMPETITIONS, forcedId: id, allowThrowing: false,
});

beforeEach(() => reset());

describe('the final HOH set pieces', () => {
  it('declares a slot no weekly draw can reach', () => {
    expect(BB_COMP_TYPES).toContain('final');
    for (const comp of FINAL_HOH_COMPS) {
      expect(comp.types).toEqual(['final']);
      // Belt and braces: nothing weekly may serve from this pair.
      expect(comp.types.includes('hoh') || comp.types.includes('veto')).toBe(false);
    }
    // And the weekly slots still have a library without them.
    expect(BB_COMPETITIONS.filter(c => c.types.includes('hoh')).length).toBeGreaterThan(10);
  });

  it('the wall runs to a single winner over a real stretch of time', () => {
    const result = runPart('bb-final-part-one', ['A', 'B', 'C'], seededRng(3));
    expect(result.placements).toHaveLength(3);
    expect(new Set(result.placements).size).toBe(3);
    expect(result.winner).toBe(result.placements[0]);
    const held = Math.max(...Object.values(result.breakdown).map(b => b.hoursHeld || 0));
    expect(held).toBeGreaterThanOrEqual(1);
    // Scores must strictly decrease down the placements — the dispatcher's
    // contract, and the reason order has to be converted rather than reported.
    const scores = result.placements.map(n => result.scores[n]);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('a deliberate drop on the wall creates a deal the finale has to honour', () => {
    // Over many seeds somebody takes the offer at least once, and when they do
    // it is a real deal object rather than a line of narration.
    let found = null;
    for (let seed = 1; seed <= 60 && !found; seed++) {
      reset();
      const result = runPart('bb-final-part-one', ['A', 'B', 'C'], seededRng(seed));
      const drop = (result.events || []).find(e => e.type === 'wall-deal');
      if (drop) found = { drop, result };
    }
    expect(found, 'no wall deal in 60 seeded runs').toBeTruthy();
    expect(found.drop.made).toBe(true);
    expect(endgameDealsOf(found.drop.from).some(d => d.members?.includes(found.drop.to)
      || d.a === found.drop.to || d.b === found.drop.to)).toBe(true);
    // The person who dropped is not the winner, and the record says they chose to.
    expect(found.result.winner).not.toBe(found.drop.to);
    expect(found.result.breakdown[found.drop.to].droppedDeliberately).toBe(true);
  });

  it('the run can be lost by somebody who was faster', () => {
    // The signature failure: a rules penalty big enough to erase a lead built
    // on legs. Asserted across seeds because it must be possible, not certain.
    let stolen = 0;
    let runs = 0;
    for (let seed = 1; seed <= 80; seed++) {
      reset();
      const result = runPart('bb-final-part-two', ['A', 'B'], seededRng(seed));
      runs++;
      const rows = Object.entries(result.breakdown);
      const loser = rows.find(([n]) => n !== result.winner);
      const winnerRow = rows.find(([n]) => n === result.winner);
      if (loser[1].misread && !winnerRow[1].misread
        && loser[1].totalSeconds - loser[1].misread.penalty < winnerRow[1].totalSeconds) stolen++;
      // Whoever wins posted the lower clock — the narration can never disagree.
      expect(winnerRow[1].totalSeconds).toBeLessThanOrEqual(loser[1].totalSeconds);
    }
    expect(runs).toBe(80);
    expect(stolen, 'nobody ever lost the run on the rules').toBeGreaterThan(0);
  });

  it('both parts are seeded — same rng, same night', () => {
    const a = runPart('bb-final-part-one', ['A', 'B', 'C'], seededRng(11));
    reset();
    const b = runPart('bb-final-part-one', ['A', 'B', 'C'], seededRng(11));
    expect(b.placements).toEqual(a.placements);
    expect(b.beats.map(x => x.text)).toEqual(a.beats.map(x => x.text));
  });

  it('the finale plays the wall, then the run, with the right fields', () => {
    reset();
    const ep = simulateBBFinale(seededRng(21));
    const parts = ep.acts.filter(a => a.type === 'final-hoh-part');
    expect(parts).toHaveLength(3);

    const [one, two, three] = parts;
    expect(one.competition.variant).toBe('final-wall');
    expect(one.participants).toHaveLength(3);

    expect(two.competition.variant).toBe('final-run');
    expect(two.participants).toHaveLength(2);
    // The wall winner sits part two out. This is the rule, and it is the one
    // an ordinary "everybody plays" loop would silently break.
    expect(two.participants).not.toContain(one.winner);

    // Part three is the two winners and nobody else.
    expect(new Set(three.participants)).toEqual(new Set([one.winner, two.winner]));
    expect([one.winner, two.winner]).toContain(three.winner);
    expect(ep.finalTwo).toContain(three.winner);
  });

  it('every beat names somebody and carries a badge', () => {
    const result = runPart('bb-final-part-one', ['A', 'B', 'C'], seededRng(5));
    for (const b of result.beats) {
      expect(b.text.length).toBeGreaterThan(20);
      expect(b.players.length).toBeGreaterThan(0);
      expect(b.badgeText).toBeTruthy();
      expect(b.text).not.toMatch(/undefined|NaN|\[object/);
    }
  });
});
