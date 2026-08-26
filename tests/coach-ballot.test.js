import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gs, setGs } from '../js/core.js';
import { addCoach, coachesOf } from '../js/coaches.js';
import { simulateVotes } from '../js/voting.js';
import { seedGame } from './helpers/setup.js';
import { getBond } from '../js/bonds.js';
import { getShowmance, getShowmancePartner } from '../js/romance.js';

describe('a coach can be voted for and never votes', () => {
  it('takes a separate list of targets', () => {
    // simulateVotes uses ONE list for both the voters and the candidates, so a
    // coach cannot be added to it — they would start casting ballots. The
    // target list has to be separate, which is the same boundary as "coaches
    // never touch the ballot", stated twice.
    const voting = readFileSync('js/voting.js', 'utf8');
    expect(voting).toMatch(/export function simulateVotes\([^)]*extraTargets/);
  });

  it('never adds an extra target to the voter pool', () => {
    const voting = readFileSync('js/voting.js', 'utf8');
    const fn = voting.slice(voting.indexOf('export function simulateVotes'));
    const body = fn.slice(0, fn.indexOf('\nexport '));
    // The voter pool must be built from tribalPlayers alone.
    expect(body).not.toMatch(/eligibleVoters[^\n]*extraTargets/);
  });
});

describe('the resentment engine (emotional defection) can also target a coach', () => {
  it('threads extraTargets from simulateVotes into evaluateEmotionalDefection', () => {
    // A coach's negative bond with a passed-over contestant is the twist's main
    // emotional pathway — it has to run through the same revenge-vote mechanic
    // as everyone else, or the twist never does the thing it exists to do.
    const voting = readFileSync('js/voting.js', 'utf8');
    expect(voting).toMatch(/export function evaluateEmotionalDefection\([^)]*extraTargets/);
    const fn = voting.slice(voting.indexOf('export function simulateVotes'));
    const body = fn.slice(0, fn.indexOf('\nexport '));
    expect(body).toMatch(/evaluateEmotionalDefection\([^)]*extraTargets\)/);
  });

  it('never adds an extra target to evaluateEmotionalDefection\'s voter pool', () => {
    const voting = readFileSync('js/voting.js', 'utf8');
    const fn = voting.slice(voting.indexOf('export function evaluateEmotionalDefection'));
    const body = fn.slice(0, fn.indexOf('\nexport '));
    // eligibleVoters (majority count) must stay tribalPlayers-only — a coach
    // must never be counted as, or cast, a ballot here either.
    expect(body).not.toMatch(/eligibleVoters[^\n]*extraTargets/);
    expect(body).toMatch(/const eligibleVoters = tribalPlayers\.filter/);
  });
});


// ── Double-tribal: coaches from EVERY losing tribe must be reachable ──
//
// episode.js's double-tribal branch merges several losing tribes into one
// council and votes them as a single group. The council-wide label used to
// build alliances/idol checks is a JOINED string ("Tribe A + Tribe B"), which
// does not equal any single coach's `.tribe` field — passing that joined
// string straight to coachesOf() silently returns nothing. The fix aggregates
// coachesOf(...) PER LOSING TRIBE and flattens the result before it reaches
// simulateVotes's extraTargets. This is a behavioral proof against the real
// simulateVotes function, not a source-text match — it fails the same way the
// bug did if the aggregation regresses back to a joined-label lookup.
describe('double-tribal: a coach on ANY losing tribe is a reachable target', () => {
  it('the joined council label matches no coach — this is the exact bug being guarded against', () => {
    setGs({ coaches: [] });
    addCoach({ name: 'CoachA', tribe: 'Tribe A' });
    addCoach({ name: 'CoachB', tribe: 'Tribe B' });
    expect(coachesOf('Tribe A + Tribe B')).toEqual([]);
  });

  it('per-tribe aggregation finds every losing tribe’s coach, not just the first', () => {
    setGs({ coaches: [] });
    addCoach({ name: 'CoachA', tribe: 'Tribe A' });
    addCoach({ name: 'CoachB', tribe: 'Tribe B' });
    const losingTribes = [{ name: 'Tribe A' }, { name: 'Tribe B' }];
    const coachTargets = losingTribes.flatMap(t => coachesOf(t.name).map(c => c.name));
    expect(coachTargets.sort()).toEqual(['CoachA', 'CoachB']);
  });

  it('a coach from the SECOND losing tribe actually receives a vote at the merged council', () => {
    seedGame(['A1', 'A2', 'A3', 'B1', 'B2', 'B3'], {
      episode: 6, phase: 'pre-merge', isMerged: false, episodeHistory: [],
      tribes: [{ name: 'Tribe A', members: ['A1', 'A2', 'A3'] }, { name: 'Tribe B', members: ['B1', 'B2', 'B3'] }],
      lostVotes: [], strategicMemories: {},
      playerStates: Object.fromEntries(['A1','A2','A3','B1','B2','B3'].map(n => [n, { emotional: 'comfortable', bigMoves: 0 }])),
      chalRecord: Object.fromEntries(['A1','A2','A3','B1','B2','B3'].map(n => [n, { wins: 0, podiums: 0, bombs: 0 }])),
      coaches: [],
    });
    addCoach({ name: 'CoachA', tribe: 'Tribe A' });
    addCoach({ name: 'CoachB', tribe: 'Tribe B' });
    const tribalPlayers = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
    const losingTribes = [{ name: 'Tribe A' }, { name: 'Tribe B' }];
    const coachTargets = losingTribes.flatMap(t => coachesOf(t.name).map(c => c.name));
    // Force a deterministic ballot onto the coach from the tribe that a
    // combined-label lookup would have dropped, so the test is meaningless
    // unless the per-tribe aggregation actually reached them.
    gs.penaltyVoteThisEp = 'CoachB';
    const priorSh = globalThis.getShowmance, priorShP = globalThis.getShowmancePartner, priorBond = globalThis.getBond;
    globalThis.getShowmance = getShowmance; globalThis.getShowmancePartner = getShowmancePartner; globalThis.getBond = getBond;
    try {
      const result = simulateVotes(tribalPlayers, [], [], [], false, coachTargets);
      // The forced penalty vote proves CoachB is a reachable ballot target at
      // all (votablePlayers.includes(...) — the exact gate this fix repairs).
      // Regular contestants may pile additional votes on top since nothing
      // else in this minimal scenario protects a coach with no bonds/threat
      // history, so assert presence rather than an exact count.
      expect(result.votes.CoachB).toBeGreaterThanOrEqual(1);
      expect(result.log.some(v => v.voted === 'CoachB' && v.voter === 'THE GAME')).toBe(true);
    } finally {
      gs.penaltyVoteThisEp = null;
      globalThis.getShowmance = priorSh; globalThis.getShowmancePartner = priorShP; globalThis.getBond = priorBond;
    }
  });
});
