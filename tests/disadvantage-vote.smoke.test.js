import { describe, it, expect } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { gs, players } from '../js/core.js';
import { simulateDisadvantageVote, applyDisadvantagePenalty } from '../js/disadvantage-vote.js';
import { addBond, getBond } from '../js/bonds.js';

const CAST = [
  { name: 'Anastasia', archetype: 'villain', gender: 'f' },
  { name: 'Jade', archetype: 'schemer', gender: 'f' },
  { name: 'Logan', archetype: 'loyal-soldier', gender: 'm' },
];
const CAST7 = [
  ...CAST,
  { name: 'Isabel', archetype: 'social-butterfly', gender: 'f' },
  { name: 'Zaid', archetype: 'mastermind', gender: 'm' },
  { name: 'Hannah', archetype: 'floater', gender: 'f' },
  { name: 'Amelie', archetype: 'perceptive-player', gender: 'f' },
];

function seed(cast) {
  seedGame(cast, { isMerged: true, phase: 'post-merge', mergeName: 'merge', episode: 24,
    popularity: {}, episodeHistory: [], showmances: [], romanticSparks: [], survival: {}, tribes: [] });
}
function freshEp() { return { num: 24, twists: [{ type: 'disadvantage-vote', catalogId: 'disadvantage-vote', name: 'The Disadvantage Vote' }] }; }

describe('The Disadvantage Vote', () => {
  it('runs a campaign + vote and hands one player the disadvantage', () => {
    seed(CAST7);
    const ep = freshEp();
    const trial = simulateDisadvantageVote(ep);
    expect(trial).toBeTruthy();
    const tw = ep.twists.find(t => t.type === 'disadvantage-vote');
    expect(tw.trial).toBe(trial);
    // a real back-and-forth debate happened (accusations + rebuttals), not monologues
    expect(trial.debate.length).toBeGreaterThan(3);
    const dTypes = new Set(trial.debate.map(b => b.type));
    expect(dTypes.has('accuse')).toBe(true);
    expect([...dTypes].some(t => ['rebut', 'reveal'].includes(t))).toBe(true);
    // every vote has a grounded reason
    Object.keys(trial.votes).forEach(v => expect(trial.voteReasons[v]).toBeTruthy());
    // everyone voted, no self-votes, tally sums to the field
    expect(Object.keys(trial.votes).length).toBe(CAST7.length);
    Object.entries(trial.votes).forEach(([v, t]) => expect(v).not.toBe(t));
    const total = Object.values(trial.tally).reduce((a, b) => a + b, 0);
    expect(total).toBe(CAST7.length);
    // target is a real player who got the most votes
    expect(CAST7.map(c => c.name)).toContain(trial.target);
    expect(trial.tally[trial.target]).toBe(Math.max(...Object.values(trial.tally)));
    // handicap registered for the challenge
    expect(gs._disadvantage).toEqual({ target: trial.target, factor: 0.65 });
  });

  it('docks ~35% of the target\'s margin and can flip the immunity winner', () => {
    seed(CAST);
    const ep = freshEp();
    const trial = simulateDisadvantageVote(ep);
    const target = trial.target;
    const others = CAST.map(c => c.name).filter(n => n !== target);
    // set up a challenge where the target was WINNING by a hair
    ep.chalMemberScores = { [target]: 10, [others[0]]: 9, [others[1]]: 4 };
    ep.immunityWinner = target;
    ep.chalPlacements = [target, others[0], others[1]];
    applyDisadvantagePenalty(ep);
    // target lost points (min=4 → 4 + (10-4)*0.65 = 7.9)
    expect(ep.chalMemberScores[target]).toBeCloseTo(7.9, 5);
    expect(ep.chalMemberScores[target]).toBeLessThan(10);
    // the 9 now beats 7.9 → winner flipped away from the disadvantaged player
    expect(ep.immunityWinner).toBe(others[0]);
    expect(trial.flipped).toEqual({ from: target, to: others[0] });
    expect(ep.chalPlacements[0]).toBe(others[0]);
  });

  it('a dominant leader survives the ~35% handicap (meaningful, not fatal)', () => {
    seed(CAST);
    const ep = freshEp();
    const trial = simulateDisadvantageVote(ep);
    const target = trial.target;
    const others = CAST.map(c => c.name).filter(n => n !== target);
    ep.chalMemberScores = { [target]: 20, [others[0]]: 8, [others[1]]: 5 };
    ep.immunityWinner = target;
    ep.chalPlacements = [target, others[0], others[1]];
    applyDisadvantagePenalty(ep);
    // 5 + (20-5)*0.65 = 14.75 → rounded 14.8 — still clear of 8
    expect(ep.chalMemberScores[target]).toBeCloseTo(14.8, 5);
    expect(ep.immunityWinner).toBe(target);
    expect(trial.flipped).toBeNull();
  });

  it('reveals are grounded in real betrayals (never fabricated) and grudges bite', () => {
    let sawGroundedReveal = false, sawFabricated = false, sawGrudge = false;
    for (let i = 0; i < 40 && !(sawGroundedReveal && sawGrudge); i++) {
      seed(CAST7);
      // real data: Logan is a proven comp threat, and Jade actually flipped on Isabel in The Pact
      gs.chalRecord = { Logan: { wins: 2, podiums: 1, bombs: 0 } };
      gs.namedAlliances = [{ name: 'The Pact', members: ['Jade', 'Isabel'], active: true, formed: 2,
        betrayals: [{ player: 'Jade', votedFor: 'Isabel', ep: 5, alliance: 'The Pact' }] }];
      addBond('Jade', 'Logan', -4);
      const ep = freshEp();
      const trial = simulateDisadvantageVote(ep);
      trial.debate.filter(b => b.type === 'reveal').forEach(b => {
        if (b.text.includes('The Pact') && b.text.includes('Isabel')) sawGroundedReveal = true;
        if (/drown|sink|pulled you out|left you to/i.test(b.text)) sawFabricated = true; // the old fabricated event
      });
      const voters = Object.entries(trial.votes).filter(([v, t]) => t === trial.target).map(([v]) => v);
      if (voters.some(v => getBond(trial.target, v) < 0)) sawGrudge = true;
    }
    expect(sawGroundedReveal).toBe(true);   // it cites the ACTUAL alliance + victim
    expect(sawFabricated).toBe(false);       // never invents an event that didn't happen
    expect(sawGrudge).toBe(true);
  });

  it('accusations cite real challenge wins from chalRecord', () => {
    let sawWinsCited = false;
    for (let i = 0; i < 20 && !sawWinsCited; i++) {
      seed(CAST);
      gs.chalRecord = { Anastasia: { wins: 3, podiums: 2, bombs: 0 } };
      const ep = freshEp();
      const trial = simulateDisadvantageVote(ep);
      if (trial.debate.some(b => /won 3 immunities/.test(b.text)) ||
          Object.values(trial.voteReasons).some(r => /won 3/.test(r))) sawWinsCited = true;
    }
    expect(sawWinsCited).toBe(true);
  });
});
