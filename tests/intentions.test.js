import { describe, it, expect, beforeEach } from 'vitest';
import { seedGame } from './helpers/setup.js';
import { gs, setGs } from '../js/core.js';
import { setRelationshipDimension } from '../js/relationships.js';
import { setBond } from '../js/bonds.js';
import {
  formIntentions, getIntentions, ensureIntentions, evolveIntentions,
  describeIntentions, describeIntentionsPlan, removeIntentionsFor, resetIntentions,
  intentionBallotMod, betrayalConditionActive, prepareIntentionsForVote,
  tickIntentions,
  assessBallotAgainstPlan,
  evaluateEndgameBeatability,
} from '../js/intentions.js';
import { intentionTargetMod } from '../js/alliances.js';

// A trusts B>C>D>E; E/F are strategic threats A distrusts.
function seed() {
  seedGame(
    [{ name: 'A', stats: { strategic: 6 } }, { name: 'B', stats: { strategic: 4 } },
     { name: 'C', stats: { strategic: 3 } }, { name: 'D', stats: { strategic: 4 } },
     { name: 'E', stats: { strategic: 9, social: 8 } }, { name: 'F', stats: { strategic: 9, boldness: 8 } }],
    { episode: 6, isMerged:true, intentions: {}, relationshipDimensions: {}, bonds: {},
      sideDeals:[
        { players:['A','B'], initiator:'A', madeEp:5, type:'f3', active:true, genuine:true },
        { players:['A','C'], initiator:'A', madeEp:5, type:'f3', active:true, genuine:true },
      ] },
  );
  setRelationshipDimension('A', 'B', 'trust', 8);
  setRelationshipDimension('A', 'C', 'trust', 6);
  setRelationshipDimension('A', 'D', 'trust', 2);
  setRelationshipDimension('A', 'E', 'trust', -4);
  setRelationshipDimension('A', 'F', 'trust', -5);
}
beforeEach(seed);

describe('intentions: formation', () => {
  it('seeds a coherent first plan from the social landscape', () => {
    const p = formIntentions('A', 6);
    expect(p.finalThree).toEqual(['A', 'B', 'C']);        // self + 2 most trusted
    expect(p.backupAllies).toContain('D');
    expect(p.targets.every(n => ['E', 'F'].includes(n))).toBe(true);  // distrusted threats
    expect(p.formedEp).toBe(6);
    expect(getIntentions('A')).toBe(p);
    expect(ensureIntentions('A')).toBe(p);                 // idempotent
  });

  it('gives low-planning players a reactive plan instead of universal mastermind structure', () => {
    const p = formIntentions('B', 6);
    expect(p.planStyle).toBe('reactive');
    expect(p.shield).toBeNull();
    expect(p.goat).toBeNull();
    expect(p.juryPlan).toEqual([]);
  });

  it('uses observed FTC evidence instead of equating challenge weakness with goat status', () => {
    gs.jury = ['J1', 'J2', 'J3'];
    gs.chalRecord = { B:{ wins:0, bombs:5 }, C:{ wins:0, bombs:0 } };
    ['J1','J2','J3'].forEach(j => {
      setBond('A', j, 5);       // planner has a credible winning résumé
      setBond('B', j, 5);       // weak challenger, but a jury threat
      setBond('C', j, -3);      // genuinely weak jury position
    });
    const socialThreat = evaluateEndgameBeatability('A', 'B');
    const beatable = evaluateEndgameBeatability('A', 'C');
    expect(socialThreat.warnings.some(w => /social or jury support/.test(w))).toBe(true);
    expect(beatable.beatability).toBeGreaterThan(socialThreat.beatability);
    const p = formIntentions('A', 6);
    expect(p.goat).toBe('C');
    expect(p.goatAssessment.reasons.some(r => /jurors/.test(r))).toBe(true);
    expect(p.origins.goat.C).toMatch(/FTC beatability read/);
  });

  it('forms a pre-merge survival read only from the current tribe and invents no pact', () => {
    resetIntentions();
    gs.isMerged = false;
    gs.sideDeals = [];
    gs.tribes = [{ name:'Red', members:['A','B','C'] }, { name:'Blue', members:['D','E','F'] }];
    const p = formIntentions('A', 3);
    expect(p.stage).toBe('survival');
    expect(p.finalThree).toEqual(['A']);
    expect([...p.preferredCore, ...p.backupAllies, ...p.targets]).not.toContain('E');
    expect(p.goat).toBeNull();
    expect(p.juryPlan).toEqual([]);
  });

  it('expands selectively at merge while keeping preferences separate from deals', () => {
    resetIntentions();
    gs.isMerged = false;
    gs.sideDeals = [];
    gs.tribes = [{ name:'Red', members:['A','B','C'] }, { name:'Blue', members:['D','E','F'] }];
    const p = formIntentions('A', 3);
    gs.isMerged = true;
    evolveIntentions('A', 4);
    expect(p.mergeExpanded).toBe(true);
    expect(['adaptation','endgame']).toContain(p.stage);
    expect(p.finalThree).toEqual(['A']);
    expect(p.preferredCore.length).toBeGreaterThan(0);
    expect(p.history.some(h => h.field === 'stage' && /merge/.test(h.reason))).toBe(true);
  });
});

describe('intentions: persistence', () => {
  it('does NOT rebuild the plan when nothing changes', () => {
    const p = formIntentions('A', 6);
    const f3 = [...p.finalThree];
    evolveIntentions('A', 7);
    evolveIntentions('A', 8);
    expect(getIntentions('A').finalThree).toEqual(f3);     // unchanged across episodes
    expect(getIntentions('A').history.length).toBe(0);
  });
});

describe('intentions: evolution on believable triggers', () => {
  it('does not invent a replacement deal when a confirmed partner is eliminated', () => {
    formIntentions('A', 6);
    setGs({ ...gs, activePlayers: gs.activePlayers.filter(n => n !== 'C') });   // C voted out
    evolveIntentions('A', 7);
    const p = getIntentions('A');
    expect(p.finalThree).not.toContain('C');
    expect(p.finalThree).toEqual(['A', 'B']);
    expect(p.finalThree).not.toContain('D');
  });

  it('keeps a strained confirmed deal until an event ends it, then records revenge', () => {
    formIntentions('A', 6);
    setRelationshipDimension('A', 'B', 'resentment', 6);   // B crossed A
    evolveIntentions('A', 7);
    const p = getIntentions('A');
    expect(p.finalThree).toContain('B');
    expect(p.dealStrain.B).toMatch(/promise has not been ended/);
    const deal = gs.sideDeals.find(d => d.players.includes('A') && d.players.includes('B'));
    deal.active = false; deal.brokenEp = 8; deal.brokenBy = 'B'; deal.brokenAgainst = 'A';
    deal.breakReason = 'voted against endgame partner';
    evolveIntentions('A', 8);
    expect(p.revenge).toContain('B');
    expect(p.targets).toContain('B');
    expect(p.finalThree).not.toContain('B');
    expect(p.history.some(h => h.field === 'dealBreak' && /revenge/.test(h.reason))).toBe(true);
  });

  it('allows an old grudge to heal after resentment falls and trust is repaired', () => {
    gs.sideDeals.forEach(d => { d.active = false; });
    formIntentions('A', 6);
    setRelationshipDimension('A', 'B', 'resentment', 6);
    evolveIntentions('A', 7);
    setRelationshipDimension('A', 'B', 'resentment', 0.5);
    setRelationshipDimension('A', 'B', 'trust', 8);
    evolveIntentions('A', 8);
    evolveIntentions('A', 9);
    expect(getIntentions('A').revenge).not.toContain('B');
    expect(getIntentions('A').history.some(h => /repaired enough trust/.test(h.reason))).toBe(true);
  });

  it('never lets the final three contain duplicates across repeated evolutions', () => {
    formIntentions('A', 6);
    // eliminate members repeatedly, forcing multiple backup promotions
    setGs({ ...gs, activePlayers: gs.activePlayers.filter(n => n !== 'B') });
    evolveIntentions('A', 7);
    setGs({ ...gs, activePlayers: gs.activePlayers.filter(n => n !== 'C') });
    evolveIntentions('A', 8);
    evolveIntentions('A', 9);
    const f3 = getIntentions('A').finalThree;
    expect(new Set(f3).size).toBe(f3.length);   // no duplicates
    expect(f3[0]).toBe('A');
  });

  it('tracks an advantage plan when they hold one', () => {
    formIntentions('A', 6);
    gs.advantages = [{ holder: 'A', type: 'idol', used: false }];
    evolveIntentions('A', 7);
    expect(getIntentions('A').advantagePlan).toBe('play-if-threatened');
    gs.advantages = [];
    evolveIntentions('A', 8);
    expect(getIntentions('A').advantagePlan).toBeNull();
  });
});

describe('intentions: hints + cleanup', () => {
  it('describes the plan in plain language', () => {
    formIntentions('A', 6);
    const hints = describeIntentions('A');
    expect(hints.some(h => /confirmed endgame deal with B & C/.test(h))).toBe(true);
    expect(hints.some(h => /target/.test(h))).toBe(true);
  });

  it('the plan drives targeting: grudges/targets pull up, endgame partners push down', () => {
    const p = formIntentions('A', 6);            // finalThree [A,B,C], targets include E/F
    expect(intentionTargetMod(['A'], 'X-nobody')).toBe(0);      // not on the radar
    expect(intentionTargetMod(['A'], p.targets[0])).toBeGreaterThan(0);   // long-term target → up
    expect(intentionTargetMod(['A'], 'B')).toBeLessThan(0);     // final-three partner → protected
    getIntentions('A').revenge = ['E'];
    expect(intentionTargetMod(['A'], 'E')).toBeGreaterThan(intentionTargetMod(['A'], p.targets[0]) - 0.001); // grudge weighs heaviest
    formIntentions('B', 6);
    getIntentions('B').revenge = ['E'];
    expect(intentionTargetMod(['A', 'B'], 'E')).toBe(intentionTargetMod(['A'], 'E')); // private plans do not aggregate telepathically
  });

  it('has no effect when there is no plan (calibration-safe)', () => {
    expect(intentionTargetMod(['A'], 'B')).toBe(0);
  });

  it('uses personal intention for ballots and activates betrayal conditions only on evidence', () => {
    const p = formIntentions('A', 6);
    p.revenge = ['E'];
    p.betrayalConditions = [{ ally:'B', condition:'if the numbers turn or they move on me' }];
    expect(intentionBallotMod('A', 'E')).toBeGreaterThan(0);
    expect(intentionBallotMod('A', 'B')).toBeLessThan(0);
    expect(betrayalConditionActive('A', 'B')).toBe(false);
    expect(betrayalConditionActive('A', 'B', { targetedByAlly:true })).toBe(true);
  });

  it('labels votes that abandon an endgame role and persists the resulting revision', () => {
    const p = formIntentions('A', 6);
    const partner = p.finalThree.find(n => n !== 'A');
    const contradiction = assessBallotAgainstPlan('A', partner, 'personal preference');
    expect(contradiction.label).toBe('BROKE ENDGAME PACT');
    const revision = assessBallotAgainstPlan('A', partner, '[LATE CONSENSUS] numbers changed');
    expect(revision.label).toBe('BROKE ENDGAME PACT');

    gs.isMerged = true;
    const ep = { num:7, votingLog:[{ voter:'A', voted:partner, planBreak:revision }] };
    tickIntentions(ep);
    expect(getIntentions('A').finalThree).not.toContain(partner);
    expect(getIntentions('A').history.some(h => h.field === 'ballotPlan')).toBe(true);
  });

  it('treats abandoning a shield as a plan revision, never a broken pact', () => {
    const p = formIntentions('A', 6);
    p.shield = 'D';
    const change = assessBallotAgainstPlan('A', p.shield, 'the numbers changed');
    expect(change.label).toBe('ENDGAME PLAN REVISION');
    expect(change.classification).toBe('plan-revision');
    expect(change.pactBroken).toBe(false);
    expect(change.explanation).toMatch(/no pact was broken/i);
  });

  it('captures a stable pre-vote snapshot without evolving it twice', () => {
    gs.isMerged = true;
    const ep = { num:7 };
    const first = prepareIntentionsForVote(ep);
    expect(first.A).toBeTruthy();
    first.A.finalThree.push('tampered');
    expect(getIntentions('A').finalThree).not.toContain('tampered');
    expect(ep.intentionsPreVoteSnapshot.A).toBeTruthy();
    tickIntentions(ep);
    const historyCount = getIntentions('A').history.length;
    tickIntentions(ep);
    expect(getIntentions('A').history.length).toBe(historyCount);
    expect(ep.intentionsPostVoteSnapshot.A).toBeTruthy();
  });

  it('renders hints from a snapshot plan object (for the text backlog)', () => {
    const plan = { finalThree: ['A', 'B'], goat: 'C', revenge: ['E'], targets: [], backupAllies: [], juryPlan: [], betrayalConditions: [], advantagePlan: 'hold' };
    const hints = describeIntentionsPlan(plan, 'A');
    expect(hints.some(h => /confirmed endgame deal with B/.test(h))).toBe(true);
    expect(hints.some(h => /goat/.test(h) && /C/.test(h))).toBe(true);
    expect(hints.some(h => /grudge against E/.test(h))).toBe(true);
    expect(describeIntentionsPlan(null, 'A')).toEqual([]);
  });

  it('scrubs a departed contestant from everyone\'s plans', () => {
    formIntentions('A', 6);
    expect(getIntentions('A').finalThree).toContain('B');
    removeIntentionsFor('B');
    expect(getIntentions('A').finalThree).not.toContain('B');
    resetIntentions();
    expect(getIntentions('A')).toBeNull();
  });
});
