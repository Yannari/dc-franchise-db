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
import { addBond } from '../js/bonds.js';
import { simulateBBFinale } from '../js/bb-finale.js';
import { bbCompetitionsForSlot } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));

const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
].map(([name, archetype, gender], i) =>
  ({ name, archetype, gender, sexuality: 'straight', stats: spread(i + 1) }));

/**
 * A seeded rng, WARMED.
 *
 * This LCG's first output is dominated by its additive constant, so for small
 * consecutive seeds every stream starts at roughly the same number — which made
 * "part one drew the same competition twenty-five times" look like a broken
 * pool when it was really twenty-five identical first draws. Burning a few
 * values decorrelates the streams. Anything that consumes the very first roll
 * of a fresh seed is reading a near-constant.
 */
const seededRng = (seed = 7) => {
  let s = seed;
  const next = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 8; i++) next();
  return next;
};

function reset(active = ['A', 'B', 'C']) {
  seedGame(CAST, { episode: 0, eliminated: CAST.map(p => p.name).filter(n => !active.includes(n)) });
  gs.activePlayers = [...active];
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {};
  gs.jury = [];
  gs.episodeHistory = [];
  seasonConfig.jurySize = 3;
  seasonConfig.finaleSize = 3;
}

const runPart = (id, participants, rng) => runBBCompetition({
  type: 'final', participants, house: participants,
  week: { num: 12 }, rng, library: BB_COMPETITIONS, forcedId: id, allowThrowing: false,
});

/** The dispatcher files a competition's own rows under debug.scoreBreakdown. */
const rowsOf = result => result.debug?.scoreBreakdown || {};

beforeEach(() => reset());

describe('the final HOH set pieces', () => {
  it('parts one and two draw from the whole roster, not just the set pieces', () => {
    // The set pieces are options, not the format. Over many seeds the finale
    // should reach ordinary library competitions for both slots as well as the
    // two written for finale night — otherwise every season's last night is the
    // same two competitions with a bigger light rig.
    const seenOne = new Set();
    const seenTwo = new Set();
    for (let seed = 1; seed <= 25; seed++) {
      reset();
      const ep = simulateBBFinale(seededRng(seed));
      const parts = ep.acts.filter(a => a.type === 'final-hoh-part');
      seenOne.add(parts[0].competition.id);
      seenTwo.add(parts[1].competition.id);
    }
    expect(seenOne.size, 'part one always drew the same competition').toBeGreaterThan(2);
    expect(seenTwo.size, 'part two always drew the same competition').toBeGreaterThan(2);
    // And the written set pieces are genuinely in those pools.
    expect([...seenOne, ...seenTwo].some(id => id.startsWith('bb-final-part'))).toBe(true);
  });

  it('the designer can pin parts one and two, and part three is not a choice', () => {
    // The Season Timeline's finale row offers exactly what the night can run,
    // so the picker's list and the draw pool must be the same list.
    const onePool = bbCompetitionsForSlot('final-1').map(c => c.id);
    const twoPool = bbCompetitionsForSlot('final-2').map(c => c.id);
    expect(onePool).toContain('bb-final-part-one');
    expect(twoPool).toContain('bb-final-part-two');
    expect(onePool.length).toBeGreaterThan(1);
    expect(twoPool.length).toBeGreaterThan(1);
    // Part three is never offered: it is the format, not a default.
    expect([...onePool, ...twoPool]).not.toContain('bb-final-part-three');

    // Pinned, the finale runs exactly that — on every seed.
    for (const seed of [2, 40, 77]) {
      reset();
      seasonConfig.bbFinalComps = { one: 'bb-endurance-soak', two: 'bb-final-part-two' };
      const parts = simulateBBFinale(seededRng(seed)).acts.filter(a => a.type === 'final-hoh-part');
      expect(parts[0].competition.id).toBe('bb-endurance-soak');
      expect(parts[1].competition.id).toBe('bb-final-part-two');
      expect(parts[2].competition.id).toBe('bb-final-part-three');
    }
    delete seasonConfig.bbFinalComps;
  });

  it('a pin for a competition that no longer exists is ignored, not fatal', () => {
    // A saved season should not stop playing because a comp was renamed.
    reset();
    seasonConfig.bbFinalComps = { one: 'bb-comp-that-was-deleted' };
    const parts = simulateBBFinale(seededRng(5)).acts.filter(a => a.type === 'final-hoh-part');
    expect(parts).toHaveLength(3);
    expect(parts[0].competition.id).toBeTruthy();
    delete seasonConfig.bbFinalComps;
  });

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
    const held = Math.max(...Object.values(rowsOf(result)).map(b => b.hoursHeld || 0));
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
      const entry = Object.entries(rowsOf(result)).find(([, row]) => row.droppedDeliberately);
      if (entry) found = { dropper: entry[0], row: entry[1], result };
    }
    expect(found, 'no wall deal in 60 seeded runs').toBeTruthy();
    const partner = found.row.dealWith;
    expect(partner).toBeTruthy();
    // A real deal object, not a line of narration: the final cut reads exactly
    // this and has to honour or break it in front of the jury.
    const deal = endgameDealsOf(partner).find(d => (d.players || []).includes(found.dropper));
    expect(deal, 'the promise on the wall was never filed as a deal').toBeTruthy();
    expect(deal.tier).toBe('final-two');
    expect(Number.isFinite(deal.madeEp)).toBe(true);
    expect(found.result.winner).not.toBe(found.dropper);
    // And the beat says so out loud.
    expect(found.result.beats.some(b => b.badgeText === 'DEAL ON THE WALL')).toBe(true);
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
      const rows = Object.entries(rowsOf(result));
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

  it('the finale plays three parts with the right fields', () => {
    reset();
    const ep = simulateBBFinale(seededRng(21));
    const parts = ep.acts.filter(a => a.type === 'final-hoh-part');
    expect(parts).toHaveLength(3);

    const [one, two, three] = parts;
    expect(one.participants).toHaveLength(3);
    expect(two.participants).toHaveLength(2);
    // Part three is the jury quiz every season — it does not draw.
    expect(three.competition.id).toBe('bb-final-part-three');
    // The wall winner sits part two out. This is the rule, and it is the one
    // an ordinary "everybody plays" loop would silently break.
    expect(two.participants).not.toContain(one.winner);

    // Part three is the two winners and nobody else.
    expect(new Set(three.participants)).toEqual(new Set([one.winner, two.winner]));
    expect([one.winner, two.winner]).toContain(three.winner);
    expect(ep.finalTwo).toContain(three.winner);
  });

  // ── part three ──

  /** A season the jury quiz can quote: three evictions with real ballots. */
  function seasonWithJury() {
    reset(['A', 'B', 'C']);
    gs.bb.weeks = [
      { num: 1, houseAtStart: ['A', 'B', 'C', 'D', 'E', 'F'], hoh: 'A', vetoWinner: 'C',
        nominees: ['D', 'E'], evicted: 'D',
        ballots: [{ voter: 'B', evict: 'D' }, { voter: 'C', evict: 'D' }, { voter: 'F', evict: 'E' }] },
      { num: 2, houseAtStart: ['A', 'B', 'C', 'E', 'F'], hoh: 'B', vetoWinner: 'A',
        nominees: ['E', 'F'], evicted: 'E',
        ballots: [{ voter: 'A', evict: 'E' }, { voter: 'C', evict: 'E' }] },
      { num: 3, houseAtStart: ['A', 'B', 'C', 'F'], hoh: 'C', vetoWinner: 'B',
        nominees: ['F', 'A'], evicted: 'F',
        ballots: [{ voter: 'A', evict: 'F' }, { voter: 'B', evict: 'F' }] },
    ];
    gs.jury = ['D', 'E', 'F'];
  }

  it('the jury quiz asks about things that actually happened', () => {
    seasonWithJury();
    const result = runBBCompetition({
      type: 'final', participants: ['A', 'B'], house: ['A', 'B'], jury: ['D', 'E', 'F'],
      week: { num: 4 }, rng: seededRng(9), library: BB_COMPETITIONS, forcedId: 'bb-final-part-three',
    });
    const qs = result.detail?.questions || [];
    expect(qs.length, 'no statements were built from a season that has three').toBe(3);
    for (const q of qs) {
      expect(['D', 'E', 'F']).toContain(q.juror);
      // The true ending is a real person, and it is one of the options offered.
      expect(q.options[q.truthIndex]).toBeTruthy();
      expect(q.options).toContain(q.options[q.truthIndex]);
      // Nobody is asked about themselves, and the finalists are never an option
      // for a question whose answer they are supposed to have to know.
      expect(q.options).not.toContain(q.juror);
      // Both finalists answered, and an answer is an index into the options.
      for (const f of ['A', 'B']) {
        expect(q.answers[f].answer).toBeGreaterThanOrEqual(0);
        expect(q.answers[f].answer).toBeLessThan(q.options.length);
        expect(q.answers[f].right).toBe(q.answers[f].answer === q.truthIndex);
      }
    }
  });

  it('the quiz rewards knowing the jury, not being clever', () => {
    // Two finalists with identical stats, one of whom actually lived with the
    // jury. Over many seeded runs the one with the read has to win more.
    let withRead = 0;
    let without = 0;
    for (let seed = 1; seed <= 120; seed++) {
      seasonWithJury();
      // A is in every week with the jurors and voted them out; B is a stranger.
      ['D', 'E', 'F'].forEach(j => { addBond('A', j, 5); addBond('B', j, 0); });
      gs.bb.weeks.forEach(w => { w.houseAtStart = w.houseAtStart.filter(n => n !== 'B'); });
      const result = runBBCompetition({
        type: 'final', participants: ['A', 'B'], house: ['A', 'B'], jury: ['D', 'E', 'F'],
        week: { num: 4 }, rng: seededRng(seed), library: BB_COMPETITIONS, forcedId: 'bb-final-part-three',
      });
      if (result.winner === 'A') withRead++; else without++;
    }
    expect(withRead).toBeGreaterThan(without);
    // But never a certainty — the last question of the season has to be losable.
    expect(without).toBeGreaterThan(0);
  });

  it('a tie goes to a number question', () => {
    let sawTiebreak = false;
    for (let seed = 1; seed <= 120 && !sawTiebreak; seed++) {
      seasonWithJury();
      const result = runBBCompetition({
        type: 'final', participants: ['A', 'B'], house: ['A', 'B'], jury: ['D', 'E', 'F'],
        week: { num: 4 }, rng: seededRng(seed), library: BB_COMPETITIONS, forcedId: 'bb-final-part-three',
      });
      if (result.detail?.tiebreak) {
        sawTiebreak = true;
        expect(Number.isFinite(result.detail.tiebreak.target)).toBe(true);
        expect(result.winner).toBe(result.detail.tiebreak.winner);
        expect(result.beats.some(b => b.badgeText === 'THE TIEBREAKER')).toBe(true);
      }
    }
    expect(sawTiebreak, 'no tie in 120 runs of a three-question quiz').toBe(true);
  });

  it('the designer can pin anything the night can actually stage', () => {
    // The picker used to offer only comps declaring `hoh`, which is a statement
    // about which NIGHT a competition airs on and has nothing to do with
    // whether three finalists can play it — so roughly half the library was
    // withheld from a dropdown for no reason a user could see.
    for (const slot of ['final-1', 'final-2']) {
      const list = bbCompetitionsForSlot(slot);
      expect(list.length, `${slot} offers ${list.length} competitions`).toBeGreaterThan(25);
      // Both groups are present: what the night would draw, and everything else.
      expect(list.some(c => !c.generic)).toBe(true);
      expect(list.some(c => c.generic)).toBe(true);
      // Part Three is not pinnable — offering it here stages the same
      // competition twice in one night.
      expect(list.some(c => c.id === 'bb-final-part-three')).toBe(false);
    }
  });

  it('and pinning one outside the usual shape actually runs', () => {
    // The pool and the dispatcher have to agree. They did not: the pool was
    // widened while `finalPart` still asked for the `hoh` slot, so pinning a
    // veto-only competition offered by the dropdown threw on the night.
    const vetoOnly = bbCompetitionsForSlot('final-2')
      .map(c => BB_COMPETITIONS.find(x => x.id === c.id))
      .find(c => c && !c.types.includes('hoh') && !c.types.includes('final'));
    expect(vetoOnly, 'no slot-exclusive competition in the picker to test with').toBeTruthy();

    seasonWithJury();
    seasonConfig.bbFinalComps = { two: vetoOnly.id };
    const ep = simulateBBFinale(seededRng(12));
    delete seasonConfig.bbFinalComps;
    const two = ep.acts.find(a => a.type === 'final-hoh-part' && a.partNum === 2);
    expect(two.competition.name).toBe(vetoOnly.name);
    expect(two.winner).toBeTruthy();
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
