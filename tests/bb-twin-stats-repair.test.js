// @vitest-environment jsdom
// A season that froze the wrong stat line cannot be edited back into shape.
//
// `statsA` is captured when the twist installs and stored on the season, and
// the Changeover screen reads it from there. So a season that installed while
// the front's roster entry was still wearing the other twin's numbers has those
// numbers baked in — both panels showing one person twice, under two names, and
// no amount of correcting the cast afterwards reaches it.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, setPlayers } from '../js/core.js';
import { twinState, repairTwinStats } from '../js/bb/twin-twist.js';
import { seedGame } from './helpers/setup.js';

const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const line = nums => Object.fromEntries(KEYS.map((k, i) => [k, nums[i]]));

// Straight off the report: Harriett's real line, and Jane's.
const HARRIETT = line([5, 5, 7, 7, 6, 3, 9, 4, 3]);
const JANE = line([2, 3, 9, 2, 6, 9, 2, 9, 9]);

/** Only the nine that matter — seedGame normalises the rest of the shape. */
const nine = st => Object.fromEntries(KEYS.map(k => [k, Number(st?.[k])]));

function season({ frontStats, statsA, real = null }) {
  seedGame([
    { name: 'Harriett', archetype: 'villain', gender: 'f', stats: { ...frontStats } },
    { name: 'Jane', archetype: 'underdog', gender: 'f', stats: { ...JANE } },
  ], { episode: 1, eliminated: [], namedAlliances: [] });
  // Set after seeding: seedGame builds canonical players and drops anything
  // it does not know about, including the stash this repair reads.
  if (real) players.find(p => p.name === 'Harriett')._twinRealStats = { ...real };
  seasonConfig.format = 'big-brother';
  gs.bb = { weeks: [], stats: {}, twins: {
    front: 'Harriett', other: 'Jane', declared: true,
    statsA: { ...statsA }, statsB: { ...JANE }, active: 'a',
  } };
}

describe('the frozen stat line', () => {
  beforeEach(() => setPlayers([]));

  it('puts the front back when the season froze the other twin', () => {
    // The reported state: both panels reading 2/3/9/2/6/9/2/9/9.
    season({ frontStats: { ...HARRIETT }, statsA: { ...JANE } });
    expect(repairTwinStats()).toBe(true);
    expect(nine(twinState().statsA)).toEqual(HARRIETT);
    // And the live entry too, since twin A is the one in the building.
    expect(nine(players.find(p => p.name === 'Harriett').stats)).toEqual(HARRIETT);
  });

  it('uses the stash when the cast entry was overwritten as well', () => {
    season({ frontStats: { ...JANE }, statsA: { ...JANE }, real: HARRIETT });
    expect(repairTwinStats()).toBe(true);
    expect(nine(twinState().statsA)).toEqual(HARRIETT);
  });

  it('leaves a healthy season alone', () => {
    season({ frontStats: { ...HARRIETT }, statsA: { ...HARRIETT } });
    expect(repairTwinStats()).toBe(false);
    expect(nine(twinState().statsA)).toEqual(HARRIETT);
  });

  it('does not "correct" two twins who genuinely rolled the same line', () => {
    // Only the specific fault is repaired: the front carrying the OTHER twin's
    // numbers while its own copy says otherwise. Identical twins are legal.
    season({ frontStats: { ...JANE }, statsA: { ...JANE } });
    expect(repairTwinStats()).toBe(false);
    expect(nine(twinState().statsA)).toEqual(JANE);
  });

  it('does nothing on a season with no twins', () => {
    seedGame([{ name: 'Bowie', archetype: 'floater', gender: 'm', stats: line([5,5,5,5,5,5,5,5,5]) }],
      { episode: 1, eliminated: [], namedAlliances: [] });
    gs.bb = { weeks: [], stats: {} };
    expect(repairTwinStats()).toBe(false);
  });

  it('reaches the episodes that already aired', () => {
    // The Changeover reads `act.twins`, a copy taken when the act was built —
    // so repairing the season alone leaves every week already played showing
    // the same wrong nine numbers forever. Reported exactly that way: fixed in
    // the builder, unchanged on the screen.
    season({ frontStats: { ...HARRIETT }, statsA: { ...JANE } });
    const twinAct = { type: 'twin-open', front: 'Harriett',
      twins: { other: 'Jane', active: 'a', statsA: { ...JANE }, statsB: { ...JANE } } };
    gs.bb.weeks = [{ num: 1, acts: [twinAct] }];
    gs.episodeHistory = [{ num: 1, acts: [twinAct] }];

    expect(repairTwinStats()).toBe(true);
    expect(nine(twinAct.twins.statsA), 'the aired episode still shows the other twin')
      .toEqual(HARRIETT);
    // The other twin's own panel is untouched.
    expect(nine(twinAct.twins.statsB)).toEqual(JANE);
  });

  it('leaves an act that was never damaged alone', () => {
    season({ frontStats: { ...HARRIETT }, statsA: { ...JANE } });
    const healthy = { type: 'twin-open', front: 'Harriett',
      twins: { other: 'Jane', active: 'a', statsA: { ...HARRIETT }, statsB: { ...JANE } } };
    gs.bb.weeks = [{ num: 1, acts: [healthy] }];
    repairTwinStats();
    expect(nine(healthy.twins.statsA)).toEqual(HARRIETT);
  });
});
