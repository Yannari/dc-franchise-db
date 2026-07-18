import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gs } from '../js/core.js';
import { setBond } from '../js/bonds.js';
import { buildObservedVoteCommitments, buildViewerVoteCommitments, compareObservedCommitments, consolidateFringeBallots, evaluateLateBallotTransition, resolveLateBallotTransitions, summarizePlanReliability } from '../js/vote-planning.js';
import { applyResolvedPitchesToForecast, checkShotInDark, describePitchReaction, evaluatePitchResponse, propagatePitchLeaks, resolveCompetingPitches, resolvePitchCounterplay, summarizePitchReactions } from '../js/voting.js';
import { seedGame } from './helpers/setup.js';
import { resolveAllianceRepair } from '../js/alliances.js';

const tribe = ['Alice', 'Bob', 'Cara', 'Dave', 'Eve'];
const alliances = [
  { type: 'alliance', label: 'The Core', members: ['Alice', 'Cara', 'Eve'], target: 'Bob', challengeLabel: 'puzzle' },
  { type: 'consensus', label: "Dave's counter", members: ['Dave', 'Bob'], target: 'Alice', challengeLabel: 'puzzle' },
];

describe('observational vote commitments', () => {
  beforeEach(() => {
    seedGame([
      { name: 'Alice', stats: { loyalty: 8, strategic: 7, intuition: 7, social: 7 } },
      { name: 'Bob', stats: { strategic: 9, social: 8, physical: 8 } },
      { name: 'Cara', stats: { loyalty: 7, social: 7 } },
      { name: 'Dave', stats: { loyalty: 5, strategic: 6 } },
      { name: 'Eve', stats: { loyalty: 7, social: 6 } },
    ], { episode: 4, phase: 'post-merge', isMerged: true, strategicMemories: {}, playerStates: {} });
    setBond('Alice', 'Cara', 3);
    setBond('Alice', 'Eve', 3);
    setBond('Alice', 'Bob', -2);
  });

  it('builds preferences, proposals, commitments, and perceived numbers without affecting votes', () => {
    const random = vi.spyOn(Math, 'random');
    const records = buildObservedVoteCommitments(tribe, [], alliances, []);

    expect(random).not.toHaveBeenCalled();
    random.mockRestore();
    const alice = records.find(r => r.voter === 'Alice');
    expect(alice).toMatchObject({ proposedTarget: 'Bob', committedTarget: 'Bob', source: 'The Core', majority: 3 });
    expect(alice.commitmentStrength).toBeGreaterThan(0.5);
    expect(alice.actualCommittedVotes).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(alice.projectedVoters)).toBe(true);
    expect(typeof alice.planAppearsViable).toBe('boolean');
  });

  it('is deterministic for the same episode state', () => {
    const first = buildObservedVoteCommitments(tribe, [], alliances, []);
    const second = buildObservedVoteCommitments(tribe, [], alliances, []);
    expect(second).toEqual(first);
  });

  it('excludes lost voters and immune targets', () => {
    const records = buildObservedVoteCommitments(tribe, ['Bob'], alliances, ['Eve']);
    expect(records.some(r => r.voter === 'Eve')).toBe(false);
    expect(records.every(r => r.preferredTarget !== 'Bob' && r.proposedTarget !== 'Bob')).toBe(true);
    expect(records[0].majority).toBe(3); // four eligible voters still require three
  });

  it('compares predictions with actual ballots without rewriting either', () => {
    const records = buildObservedVoteCommitments(tribe, [], alliances, []);
    const alicePrediction = records.find(r => r.voter === 'Alice').predictedBallot;
    const compared = compareObservedCommitments(records, [
      { voter: 'Alice', voted: alicePrediction },
      { voter: 'Cara', voted: 'Dave' },
    ]);
    expect(compared.find(r => r.voter === 'Alice')).toMatchObject({ actualBallot: alicePrediction, predictionMatched: true });
    expect(compared.find(r => r.voter === 'Cara')).toMatchObject({ actualBallot: 'Dave', predictionMatched: false });
  });

  it('does not score a Shot in the Dark sacrifice as an actual ballot', () => {
    const records = buildObservedVoteCommitments(tribe, [], alliances, []);
    const compared = compareObservedCommitments(records, [{ voter: 'Alice', voted: 'Bob', sitdSacrificed: true }]);
    expect(compared.find(r => r.voter === 'Alice')).toMatchObject({ actualBallot: null, voteSacrificed: true, sacrificedTarget: 'Bob', predictionMatched: false });
  });

  it('does not let a player without a live ballot use Shot in the Dark', () => {
    gs.shotInDarkEnabledThisEp = true;
    gs.shotInDarkUsed = new Set();
    const ep = {};
    checkShotInDark(tribe, { Bob: 4, Alice: 1 }, [{ voter: 'Alice', voted: 'Bob' }], ep);
    expect(ep.shotInDark).toBeUndefined();
  });

  it('holds a short alliance plan when private preference has no actionable coalition', () => {
    const merge = ['Bowie', 'MK', 'Axel', 'A1', 'A2', 'A3', 'A4', 'X', 'Y', 'Z'];
    seedGame(merge.map(name => ({
      name,
      stats: ['Bowie', 'A1', 'A2', 'A3', 'A4'].includes(name)
        ? { loyalty: 9, social: 7, strategic: 7 }
        : name === 'Axel' ? { strategic: 10, social: 9, physical: 9 }
        : {},
    })), { episode: 9, phase: 'post-merge', isMerged: true, strategicMemories: {}, playerStates: {} });
    setBond('Bowie', 'Axel', -5);
    ['A1', 'A2', 'A3', 'A4'].forEach(name => setBond('Bowie', name, 3));
    const mergePlans = [{ type: 'alliance', label: 'The Engine', members: ['Bowie', 'A1', 'A2', 'A3', 'A4'], target: 'MK' }];
    const records = buildObservedVoteCommitments(merge, [], mergePlans, []);
    const bowie = records.find(r => r.voter === 'Bowie');

    expect(bowie).toMatchObject({ preferredTarget: 'Axel', proposedTarget: 'MK', majority: 6 });
    expect(bowie.believedVotes).toBeLessThan(6);
    expect(bowie.predictedBallot).toBe('MK');
    expect(bowie.predictionReason).toBe('held-plan-no-better-coalition');
  });

  it('blocks an unsupported third target', () => {
    const record = { preferredTarget: 'A', proposedTarget: 'B', committedTarget: 'B', predictedBallot: 'B', commitmentStrength: 0.9 };
    expect(evaluateLateBallotTransition(record, 'C', { existingSupport: 0 })).toMatchObject({
      target: 'B', lateTrigger: 'no-credible-late-trigger', prevented: true, rejectedTarget: 'C',
    });
  });

  it('allows a documented late trigger', () => {
    const record = { preferredTarget: 'A', proposedTarget: 'B', committedTarget: 'B', predictedBallot: 'B', commitmentStrength: 0.9 };
    expect(evaluateLateBallotTransition(record, 'C', { explicitTrigger: 'late-pitch' })).toMatchObject({ target: 'C', lateTrigger: 'late-pitch', prevented: false });
  });

  it('shows an explicit motive instead of hiding it behind a modeled option', () => {
    const record = { preferredTarget: 'C', proposedTarget: 'B', committedTarget: 'C', predictedBallot: 'B', commitmentStrength: 0.3 };
    expect(evaluateLateBallotTransition(record, 'C', { explicitTrigger: 'personal-grudge' }))
      .toMatchObject({ target: 'C', lateTrigger: 'personal-grudge', prevented: false });
  });

  it('requires more live support to break a strong commitment', () => {
    const strong = { preferredTarget: 'A', proposedTarget: 'B', committedTarget: 'B', predictedBallot: 'B', commitmentStrength: 0.9 };
    expect(evaluateLateBallotTransition(strong, 'C', { existingSupport: 1 }).prevented).toBe(true);
    expect(evaluateLateBallotTransition({ ...strong, commitmentStrength: 0.3 }, 'C', { existingSupport: 1 }))
      .toMatchObject({ target: 'C', lateTrigger: 'live-coalition-2', prevented: false });
  });

  it('resolves live coalitions independently of ballot order', () => {
    const records = ['One', 'Two', 'Three'].map(voter => ({ voter, preferredTarget: 'A', proposedTarget: 'B', committedTarget: 'B', predictedBallot: 'B', commitmentStrength: 0.3 }));
    const ballots = records.map(record => ({ voter: record.voter, target: 'C' }));
    const forward = resolveLateBallotTransitions(records, ballots);
    const reverse = resolveLateBallotTransitions(records, [...ballots].reverse());
    const byVoter = rows => Object.fromEntries(rows.map(row => [row.voter, [row.transition.target, row.transition.lateTrigger, row.provisionalSupport]]));
    expect(byVoter(reverse)).toEqual(byVoter(forward));
    expect(forward.every(row => row.transition.lateTrigger === 'live-coalition-3')).toBe(true);
  });

  it('predicts the assigned backup target in an idol split', () => {
    const splitPlans = [{ type: 'alliance', label: 'The Core', members: ['Alice', 'Cara', 'Eve'], target: 'Bob',
      splitTarget: 'Dave', splitPrimary: ['Alice', 'Cara'], splitSecondary: ['Eve'] }];
    const records = buildObservedVoteCommitments(tribe, [], splitPlans, []);
    const eve = records.find(record => record.voter === 'Eve');
    expect(eve).toMatchObject({ proposedTarget: 'Dave', splitVoteAssignment: 'backup', splitPrimaryTarget: 'Bob', splitBackupTarget: 'Dave' });
    expect(eve.predictedBallot).toBe('Dave');
  });

  it('separates alliance membership from dependable ballots', () => {
    const summary = summarizePlanReliability([
      { voter:'A', source:'Core', proposedTarget:'X', committedTarget:'X', predictedBallot:'X', commitmentStrength:0.8, majority:3 },
      { voter:'B', source:'Core', proposedTarget:'X', committedTarget:'Y', predictedBallot:'X', commitmentStrength:0.55, majority:3 },
      { voter:'C', source:'Core', proposedTarget:'X', committedTarget:'Y', predictedBallot:'Y', commitmentStrength:0.3, majority:3 },
    ], 'Core');
    expect(summary).toMatchObject({ dependable:['A'], tentative:['B'], drifting:['C'], initialReservations:['B'], dependableVotes:1, projectedVotes:2, hasDependableControl:false });
  });
});

describe('flip negotiation', () => {
  it('rejects impossible claimed numbers', () => {
    expect(evaluatePitchResponse({ claimedSupport:8, eligibleVoters:6, confirmedSupport:1 }, () => 0))
      .toMatchObject({ accepted:false, reason:'impossible-numbers' });
  });

  it('lets a trusted recipient join after numbers are confirmed', () => {
    const rolls = [0.01, 0.99];
    expect(evaluatePitchResponse({ trust:4, loyalty:4, targetBond:-1, claimedSupport:4, eligibleVoters:8,
      confirmedSupport:3, strategic:7, intuition:7 }, () => rolls.shift()))
      .toMatchObject({ accepted:true, reason:'numbers-confirmed' });
  });

  it('lets a distrusted but respected strategist coordinate a confirmed vote', () => {
    const rolls = [0.20, 0.99];
    expect(evaluatePitchResponse({ trust:-4, tacticalCredibility:4, loyalty:4, targetBond:-1,
      claimedSupport:4, eligibleVoters:8, confirmedSupport:3, strategic:8, intuition:7 }, () => rolls.shift()))
      .toMatchObject({ accepted:true, reason:'numbers-confirmed' });
  });

  it('refuses to sacrifice a close ally for the pitch', () => {
    expect(evaluatePitchResponse({ trust:5, targetBond:5, claimedSupport:5, eligibleVoters:8, confirmedSupport:4 }, () => 0))
      .toMatchObject({ accepted:false, reason:'protecting-target' });
  });

  it('does not treat the proposed target as a valid recipient', () => {
    expect(evaluatePitchResponse({ targetBond:10, claimedSupport:4, eligibleVoters:8, confirmedSupport:3 }, () => 0))
      .toMatchObject({ accepted:false, reason:'protecting-target' });
  });

  it('rejects a pitch that cannot save a recipient facing more votes', () => {
    expect(evaluatePitchResponse({ claimedSupport:2, confirmedSupport:2, eligibleVoters:10,
      selfTargeted:true, competingSupport:6, commitmentStrength:0.81 }, () => 0))
      .toMatchObject({ accepted:false, reason:'does-not-save-me' });
  });

  it('does not let an inflated claim make a hopeless self-preservation pitch viable', () => {
    expect(evaluatePitchResponse({ claimedSupport:6, confirmedSupport:1, eligibleVoters:10,
      selfTargeted:true, competingSupport:6, commitmentStrength:0.81, liar:true }, () => 0.99))
      .toMatchObject({ accepted:false, reason:'does-not-save-me' });
  });

  it('does not abandon a strong plan for an unconfirmed minority pitch', () => {
    expect(evaluatePitchResponse({ claimedSupport:2, confirmedSupport:1, eligibleVoters:10,
      commitmentStrength:0.81 }, () => 0))
      .toMatchObject({ accepted:false, reason:'strong-plan-not-replaced' });
  });
});

describe('competing flip coalitions', () => {
  it('keeps a voter in only the stronger confirmed coalition', () => {
    const pitches = [
      { pitcher:'A', pitchTarget:'X', success:true, existingSupporters:['A','B'], flipped:['C'], confirmedCoalition:['A','B','C'], responses:[{ voter:'C', accepted:true, acceptChance:0.4 }] },
      { pitcher:'D', pitchTarget:'Y', success:true, existingSupporters:['D'], flipped:['C'], confirmedCoalition:['D','C'], responses:[{ voter:'C', accepted:true, acceptChance:0.8 }] },
    ];
    resolveCompetingPitches(pitches, [{ voter:'C', predictedBallot:'Z', commitmentStrength:0.4 }]);
    expect(pitches[0]).toMatchObject({ success:true, flipped:['C'], resolution:'resolved-working-coalition' });
    expect(pitches[1]).toMatchObject({ success:false, flipped:[], resolution:'dissolved-after-conflict-check' });
    expect(pitches[1].responses[0]).toMatchObject({ accepted:false, reason:'chose-stronger-coalition', supersededBy:'X' });
  });

  it('does not count an organizer inside a rival pitch', () => {
    const pitches = [
      { pitcher:'A', pitchTarget:'X', success:true, existingSupporters:['A'], flipped:['D'], confirmedCoalition:['A','D'], responses:[{ voter:'D', accepted:true }] },
      { pitcher:'D', pitchTarget:'Y', success:true, existingSupporters:['D'], flipped:['C'], confirmedCoalition:['D','C'], responses:[{ voter:'C', accepted:true }] },
    ];
    resolveCompetingPitches(pitches, []);
    expect(pitches[0]).toMatchObject({ success:false, flipped:[], confirmedCoalition:['A'] });
    expect(pitches[1]).toMatchObject({ success:true, flipped:['C'], confirmedCoalition:['D','C'] });
  });

  it('rebuilds the observable forecast from the resolved coalition', () => {
    const records = [
      { voter:'A', proposedTarget:'X', predictedBallot:'X', predictionReason:'plan-held', commitmentStrength:0.8 },
      { voter:'B', proposedTarget:'Y', predictedBallot:'Y', predictionReason:'plan-held', commitmentStrength:0.4 },
      { voter:'C', proposedTarget:'Z', predictedBallot:'Z', predictionReason:'plan-held', commitmentStrength:0.3 },
    ];
    const pitches = [{ pitcher:'A', pitchTarget:'Q', success:true, claimedSupport:3, confirmedCoalition:['A','B','C'] }];
    applyResolvedPitchesToForecast(pitches, records);
    expect(records.map(r => r.predictedBallot)).toEqual(['Q','Q','Q']);
    expect(records[1]).toMatchObject({ preNegotiationPredictedBallot:'Y', predictionReason:'resolved-pitch-coalition-3', pitchOrganizer:'A' });
    expect(records[0].projectedVoters).toEqual([]);
  });
});

describe('viewer-safe vote forecast', () => {
  it('keeps private recruits hidden while showing the organizer move', () => {
    const exact = [
      { voter:'A', predictedBallot:'Q', preNegotiationPredictedBallot:'X', preNegotiationPredictionReason:'old-plan', pitchOrganizer:'A', proposedTarget:'X' },
      { voter:'B', predictedBallot:'Q', preNegotiationPredictedBallot:'Y', preNegotiationPredictionReason:'old-plan', pitchOrganizer:'A', proposedTarget:'Y' },
    ];
    const visible = buildViewerVoteCommitments(exact);
    expect(visible[0].predictedBallot).toBe('Q');
    expect(visible[1]).toMatchObject({ predictedBallot:'Y', predictionReason:'old-plan', hiddenNegotiationPossible:true });
    expect(exact[1].predictedBallot).toBe('Q');
  });
});

describe('late fringe-vote consolidation', () => {
  it('moves an isolated low-confidence ordinary ballot toward a leading option', () => {
    const records = [{ voter:'A', commitmentStrength:0.4 }];
    const ballots = [
      { voter:'A', target:'W', allianceTarget:'W', transition:{ target:'W', lateTrigger:'plan-held' } },
      { voter:'B', transition:{ target:'X', lateTrigger:'plan-held' } },
      { voter:'C', transition:{ target:'X', lateTrigger:'plan-held' } },
      { voter:'D', transition:{ target:'Y', lateTrigger:'plan-held' } },
      { voter:'E', transition:{ target:'Y', lateTrigger:'plan-held' } },
      { voter:'F', transition:{ target:'Z', lateTrigger:'plan-held' } },
    ];
    const result = consolidateFringeBallots(records, ballots, { shouldMove:() => true });
    expect(result[0]).toMatchObject({ fringeConsolidation:{ from:'W', to:'X' }, transition:{ target:'X', lateTrigger:'late-consensus' }, isDefecting:true });
  });

  it('preserves strong commitments and explicit strategic deviations', () => {
    const records = [{ voter:'A', commitmentStrength:0.8 }, { voter:'F', commitmentStrength:0.2 }];
    const ballots = [
      { voter:'A', transition:{ target:'W', lateTrigger:'plan-held' } },
      { voter:'B', transition:{ target:'X', lateTrigger:'plan-held' } }, { voter:'C', transition:{ target:'X', lateTrigger:'plan-held' } },
      { voter:'D', transition:{ target:'Y', lateTrigger:'plan-held' } }, { voter:'E', transition:{ target:'Y', lateTrigger:'plan-held' } },
      { voter:'F', transition:{ target:'Z', lateTrigger:'protect-ally' } },
    ];
    const result = consolidateFringeBallots(records, ballots, { shouldMove:() => true });
    expect(result[0].transition.target).toBe('W');
    expect(result[5].transition.target).toBe('Z');
  });
});

describe('pitch reaction storytelling', () => {
  it('foreshadows receptiveness without revealing acceptance', () => {
    const cue = describePitchReaction({ pitcher:'A', pitchTarget:'X' },
      { voter:'B', accepted:true, acceptChance:0.5, reason:'numbers-confirmed' }, () => 0);
    expect(cue).toMatchObject({ tone:'receptive', badgeText:'PITCH READ' });
    expect(cue.text).not.toMatch(/accepted|committed|voted/i);
  });

  it('turns a numbers objection into an understandable ambiguous clue', () => {
    const cue = describePitchReaction({ pitcher:'A', pitchTarget:'X' },
      { voter:'B', accepted:false, reason:'does-not-save-me' }, () => 0);
    expect(cue).toMatchObject({ tone:'numbers-focused' });
    expect(cue.text).toContain('numbers');
    expect(cue.text).not.toMatch(/rejected|ballot.*will/i);
  });

  it('combines several recipient reads into one non-confirming summary', () => {
    const summary = summarizePitchReactions({ pitcher:'A', pitchTarget:'X' }, [
      { voter:'B', reason:'protecting-target', leaked:true },
      { voter:'C', reason:'protecting-target' },
      { voter:'D', reason:'strong-plan-not-replaced' },
    ]);
    expect(summary).toContain('B and C visibly defended X');
    expect(summary).toContain('D kept returning to the plan');
    expect(summary).toContain('circulating through B');
    expect(summary).not.toMatch(/accepted|rejected|will vote/i);
  });
});

describe('pitch information flow', () => {
  it('sends a leaked pitch to its target and trusted nearby allies', () => {
    setBond('B', 'X', 3);
    const intel = propagatePitchLeaks([{ pitcher:'A', pitchTarget:'X', responses:[{ voter:'B', leaked:true }] }],
      ['A','B','C','X'], [{ members:['B','C'] }], () => 0);
    expect(intel.find(info => info.knower === 'X')).toMatchObject({ source:'B', pitcher:'A', target:'X', believed:true, sourceType:'direct-warning' });
    expect(intel.some(info => info.knower === 'C')).toBe(true);
  });

  it('does not spread a private pitch when nobody leaked it', () => {
    expect(propagatePitchLeaks([{ pitcher:'A', pitchTarget:'X', responses:[{ voter:'B', leaked:false }] }], ['A','B','X'], [], () => 0)).toEqual([]);
  });

  it('requires a credible warning before a target can organize counterplay', () => {
    seedGame(['A','B','C','D','X']);
    const pitch = { pitcher:'A', pitchTarget:'X', confirmedCoalition:['A','B'] };
    expect(resolvePitchCounterplay([pitch], [], ['A','B','C','D','X'], [], [], () => 0)).toEqual([]);
  });

  it('builds a counter only when warned allies are actually receptive', () => {
    seedGame([
      { name:'A' }, { name:'B' }, { name:'C' }, { name:'D' },
      { name:'X', stats:{ strategic:9, intuition:9, social:8 } }
    ]);
    const pitch = { pitcher:'A', pitchTarget:'X', confirmedCoalition:['A','B'] };
    const warning = { pitcher:'A', target:'X', knower:'X', source:'C', believed:true, confidence:0.9 };
    const plans = [{ label:'X Core', members:['X','C','D'], target:'A' }];
    const [action] = resolvePitchCounterplay([pitch], [warning], ['A','B','C','D','X'], plans, [], () => 0);
    expect(action).toMatchObject({ actor:'X', pitcher:'A', success:true });
    expect(action.coalition).toEqual(expect.arrayContaining(['X','C','D']));
  });

  it('allows a warned target to notice danger without reacting perfectly', () => {
    seedGame(['A','B','C','X']);
    const pitch = { pitcher:'A', pitchTarget:'X', confirmedCoalition:['A','B'] };
    const warning = { pitcher:'A', target:'X', knower:'X', source:'C', believed:true, confidence:0.6 };
    const [action] = resolvePitchCounterplay([pitch], [warning], ['A','B','C','X'], [], [], () => 0.999);
    expect(action).toMatchObject({ actor:'X', type:'watched-carefully', success:false });
  });
});

describe('post-vote alliance repair', () => {
  it('can restore cooperation without deleting the betrayal record', () => {
    seedGame([
      { name:'A', stats:{ loyalty:9, temperament:9, social:9 } },
      { name:'B', stats:{ strategic:8, loyalty:3 } },
      { name:'C', stats:{ strategic:8, loyalty:3 } }
    ], { namedAlliances:[{ name:'Core', active:true, members:['A','B','C'],
      betrayals:[{ player:'A', ep:4, severity:'moderate' }] }] });
    const result = resolveAllianceRepair({ traitor:'A', alliance:'Core', votedFor:'X',
      consensusWas:'Y', severity:'moderate' }, 5, () => 0);
    expect(result).toMatchObject({ approach:'apology', outcome:'forgiven' });
    expect(gs.namedAlliances[0].betrayals).toHaveLength(1);
    expect(gs.namedAlliances[0].betrayals[0].repairOutcome).toBe('forgiven');
  });

  it('turns an unrepentant failed repair into a longer strategy exclusion', () => {
    seedGame([
      { name:'A', stats:{ loyalty:2, boldness:9, social:3 } }, 'B', 'C'
    ], { namedAlliances:[{ name:'Core', active:true, members:['A','B','C'],
      betrayals:[{ player:'A', ep:4, severity:'moderate' }] }] });
    const result = resolveAllianceRepair({ traitor:'A', alliance:'Core', votedFor:'X',
      consensusWas:'Y', severity:'moderate', allyEliminated:true }, 5, () => 0.999);
    expect(result).toMatchObject({ approach:'refusal', outcome:'fracture' });
    expect(gs.strategyExclusions.A.untilEp).toBe(7);
  });
});
