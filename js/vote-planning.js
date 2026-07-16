// Observational pre-vote commitment model. It predicts ballots without changing
// the live voting engine, allowing comparison and calibration before activation.
import { gs } from './core.js';
import { getBond, getPerceivedBond } from './bonds.js';
import { pStats, challengeWeakness, getPlayerState } from './players.js';
import { strategicMemoryScore } from './strategy-memory.js';

const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));

function stableUnit(key) {
  let h = 2166136261;
  for (const ch of key) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 0xffffffff;
}

function targetThreat(target) {
  const s = pStats(target);
  const rec = gs.chalRecord?.[target] || {};
  return s.strategic * 0.35 + s.social * 0.25 + s.physical * 0.12 + s.endurance * 0.10
    + s.mental * 0.08 + s.intuition * 0.10 + (rec.wins || 0) * 0.5 + (rec.podiums || 0) * 0.15;
}

function atBottomOfPlan(voter, members) {
  const active = (members || []).filter(m => gs.activePlayers.includes(m));
  if (active.length < 3) return false;
  const avg = member => {
    const others = active.filter(m => m !== member);
    return others.reduce((sum, other) => sum + getBond(member, other), 0) / Math.max(1, others.length);
  };
  const mine = avg(voter);
  const ranked = active.map(avg).sort((a, b) => a - b);
  return mine <= ranked[Math.floor(ranked.length * 0.4)];
}

function targetPreferenceScore(voter, target, challengeLabel) {
  const s = pStats(voter);
  const bond = getPerceivedBond(voter, target);
  const memory = strategicMemoryScore(voter, target);
  if (gs.phase === 'pre-merge') {
    return challengeWeakness(target, challengeLabel) * 0.55 - bond * 0.45
      + targetThreat(target) * 0.08 + memory * (0.08 + s.intuition * 0.015);
  }
  return targetThreat(target) * (0.16 + s.strategic * 0.016) - bond * 0.8
    + memory * (0.12 + s.strategic * 0.02 + s.intuition * 0.015);
}

function planValue(voter, plan, preferredTarget) {
  const allies = (plan.members || []).filter(m => m !== voter);
  const avgBond = allies.length ? allies.reduce((sum, m) => sum + getPerceivedBond(voter, m), 0) / allies.length : 0;
  const realAlliance = plan.type === 'alliance' ? 0.8 : plan.type === 'consensus' ? 0.35 : 0;
  const preferenceFit = plan.target === preferredTarget ? 1.2 : 0;
  return realAlliance + avgBond * 0.16 + preferenceFit + (plan.members?.length || 0) * 0.05;
}

function assignedPlanTarget(plan, voter) {
  if (plan.splitTarget && plan.splitSecondary?.includes(voter)) return plan.splitTarget;
  return plan.target || null;
}

export function summarizePlanReliability(records, source, majority = null) {
  const members = (records || []).filter(r => r.source === source);
  const needed = majority || members[0]?.majority || 1;
  // Reliability describes the forecasted ballot, not the first private lean.
  // Someone can begin with reservations and still be expected to hold the plan.
  const dependable = members.filter(r => r.predictedBallot === r.proposedTarget && r.commitmentStrength >= 0.65).map(r => r.voter);
  const tentative = members.filter(r => r.predictedBallot === r.proposedTarget && r.commitmentStrength < 0.65).map(r => r.voter);
  const drifting = members.filter(r => r.predictedBallot !== r.proposedTarget).map(r => r.voter);
  const initialReservations = members.filter(r => r.committedTarget !== r.proposedTarget && r.predictedBallot === r.proposedTarget).map(r => r.voter);
  const score = members.length ? members.reduce((sum, r) => sum + (r.predictedBallot === r.proposedTarget ? r.commitmentStrength : 0), 0) / members.length : 0;
  return { eligible: members.map(r => r.voter), dependable, tentative, drifting, dependableVotes: dependable.length,
    initialReservations, projectedVotes: dependable.length + tentative.length, majority: needed, hasDependableControl: dependable.length >= needed, score };
}

export function buildObservedVoteCommitments(tribalPlayers, immunePlayers, alliances, lostVotes = []) {
  const immune = immunePlayers instanceof Set ? immunePlayers : new Set(Array.isArray(immunePlayers) ? immunePlayers : immunePlayers ? [immunePlayers] : []);
  const eligibleVoters = tribalPlayers.filter(p => !lostVotes.includes(p));
  const majority = Math.floor(eligibleVoters.length / 2) + 1;
  const candidates = tribalPlayers.filter(p => !immune.has(p));
  const currentEp = (gs.episode || 0) + 1;

  const records = eligibleVoters.map(voter => {
    const possibleTargets = candidates.filter(p => p !== voter);
    const scored = possibleTargets.map(target => ({
      target,
      score: targetPreferenceScore(voter, target, alliances.find(a => a.members?.includes(voter))?.challengeLabel),
    })).sort((a, b) => b.score - a.score || a.target.localeCompare(b.target));
    const preferredTarget = scored[0]?.target || null;

    const myPlans = alliances.filter(a => a.target && a.members?.includes(voter));
    const proposedChoice = myPlans.map(plan => {
      const assignedTarget = assignedPlanTarget(plan, voter);
      return { plan, assignedTarget, value: planValue(voter, { ...plan, target: assignedTarget }, preferredTarget) };
    }).filter(choice => choice.assignedTarget && choice.assignedTarget !== voter && !immune.has(choice.assignedTarget))
      .sort((a, b) => b.value - a.value || (b.plan.members?.length || 0) - (a.plan.members?.length || 0))[0] || null;
    const proposedPlan = proposedChoice?.plan || null;
    const proposedTarget = proposedChoice?.assignedTarget || null;
    const s = pStats(voter);
    const allies = (proposedPlan?.members || []).filter(m => m !== voter);
    const avgAllianceBond = allies.length ? allies.reduce((sum, m) => sum + getPerceivedBond(voter, m), 0) / allies.length : 0;
    const targetBond = proposedTarget ? getPerceivedBond(voter, proposedTarget) : 0;
    const state = getPlayerState(voter).emotional;
    const stateMod = state === 'desperate' ? -0.12 : state === 'paranoid' ? -0.08 : state === 'uneasy' ? -0.04 : state === 'calculating' ? 0.05 : 0;
    const bottomMod = proposedPlan && atBottomOfPlan(voter, proposedPlan.members) ? -0.10 : 0;
    const preferenceMod = proposedTarget && proposedTarget === preferredTarget ? 0.18 : 0;
    const exclusion = gs.strategyExclusions?.[voter];
    const excludedFromStrategy = !!(proposedPlan && exclusion?.alliance === proposedPlan.label && exclusion.untilEp >= currentEp);
    const commitmentStrength = proposedTarget ? clamp((
      0.22 + s.loyalty * 0.045 + avgAllianceBond * 0.03 - Math.max(0, targetBond) * 0.05
      + preferenceMod + stateMod + bottomMod + (proposedPlan.type === 'alliance' ? 0.08 : 0)
      ) * (excludedFromStrategy ? 0.58 : 1),
      0.05, 0.95
    ) : 0;
    const splitVoteAssignment = proposedPlan?.splitTarget
      ? (proposedPlan.splitSecondary?.includes(voter) ? 'backup' : 'primary') : null;
    const committedTarget = splitVoteAssignment ? proposedTarget
      : proposedTarget && commitmentStrength >= 0.5 ? proposedTarget : preferredTarget;

    return {
      voter, preferredTarget, preferenceScore: scored[0]?.score || 0,
      proposedTarget, committedTarget, commitmentStrength,
      source: proposedPlan?.label || 'Independent', sourceType: proposedPlan?.type || 'solo',
      splitVoteAssignment,
      splitPrimaryTarget: proposedPlan?.splitTarget ? proposedPlan.target : null,
      splitBackupTarget: proposedPlan?.splitTarget || null,
      emotional: state, bottomOfPlan: bottomMod < 0, excludedFromStrategy,
    };
  });

  const actualCommitments = {};
  const committedVoters = {};
  records.forEach(r => {
    if (!r.committedTarget) return;
    actualCommitments[r.committedTarget] = (actualCommitments[r.committedTarget] || 0) + 1;
    committedVoters[r.committedTarget] = [...(committedVoters[r.committedTarget] || []), r.voter];
  });

  records.forEach(record => {
    const s = pStats(record.voter);
    const planTarget = record.proposedTarget || record.committedTarget;
    const actualSupport = actualCommitments[planTarget] || 0;
    const alternativeSupport = record.preferredTarget && record.preferredTarget !== planTarget
      ? (actualCommitments[record.preferredTarget] || 0) : actualSupport;
    const uncertainty = Math.max(0, 6 - Math.round((s.intuition + s.social) / 2));
    const beliefErrorFor = target => {
      const unit = stableUnit(`${currentEp}|${record.voter}|${target}`);
      return uncertainty <= 0 ? 0 : unit < 0.28 ? -1 : unit > 0.78 ? 1 : 0;
    };
    const error = beliefErrorFor(planTarget);
    const alternativeError = record.preferredTarget ? beliefErrorFor(record.preferredTarget) : 0;
    record.actualCommittedVotes = actualSupport;
    record.committedVoters = [...(committedVoters[planTarget] || [])];
    record.believedVotes = Math.max(1, Math.min(eligibleVoters.length, actualSupport + error));
    record.alternativeActualSupport = alternativeSupport;
    record.believedAlternativeVotes = Math.max(1, Math.min(eligibleVoters.length, alternativeSupport + alternativeError));
    record.majority = majority;
    record.planAppearsViable = record.believedVotes >= majority;
    record.alternativeAppearsViable = record.believedAlternativeVotes >= majority;
    const visibleAlternative = record.preferredTarget && record.preferredTarget !== planTarget && alliances.some(plan =>
      plan.target === record.preferredTarget && plan.members?.some(member =>
        member === record.voter || getPerceivedBond(record.voter, member) >= 1
      )
    );
    const alternativeIsStronger = visibleAlternative
      && record.believedAlternativeVotes >= 2
      && record.believedAlternativeVotes > record.believedVotes;

    if (record.splitVoteAssignment) {
      record.predictedBallot = record.proposedTarget;
      record.predictionReason = record.splitVoteAssignment === 'backup' ? 'assigned-backup-idol-split' : 'assigned-primary-idol-split';
    } else if (!record.proposedTarget) {
      record.predictedBallot = record.preferredTarget;
      record.predictionReason = 'independent-preference';
    } else if (record.planAppearsViable) {
      record.predictedBallot = record.proposedTarget;
      record.predictionReason = 'plan-has-majority';
    } else if (record.alternativeAppearsViable || alternativeIsStronger) {
      record.predictedBallot = record.preferredTarget;
      record.predictionReason = record.alternativeAppearsViable ? 'alternative-has-majority' : 'alternative-is-stronger';
    } else {
      // With no actionable alternative, holding an organized plan together is
      // more rational than abandoning it for an unsupported private preference.
      record.predictedBallot = record.proposedTarget;
      record.predictionReason = 'held-plan-no-better-coalition';
    }
    record.beliefError = record.believedVotes - actualSupport;
    record.alternativeBeliefError = record.believedAlternativeVotes - alternativeSupport;
  });

  const projectedVoters = {};
  records.forEach(record => {
    if (record.predictedBallot) projectedVoters[record.predictedBallot] = [...(projectedVoters[record.predictedBallot] || []), record.voter];
  });
  records.forEach(record => {
    record.projectedVoters = [...(projectedVoters[record.proposedTarget] || [])];
    record.projectedVotes = record.projectedVoters.length;
  });

  return records;
}

export function compareObservedCommitments(records, votingLog) {
  const sacrificedByVoter = new Map((votingLog || []).filter(v => v.voter && v.sitdSacrificed).map(v => [v.voter, v]));
  const actualByVoter = new Map((votingLog || []).filter(v => v.voter && v.voter !== 'THE GAME' && !v.sitdSacrificed).map(v => [v.voter, v]));
  return (records || []).map(record => {
    const actual = actualByVoter.get(record.voter) || null;
    const sacrificed = sacrificedByVoter.get(record.voter) || null;
    const actualBallot = actual?.voted || null;
    return { ...record, actualBallot, lateTrigger: actual?.lateTrigger || null,
      transitionPrevented: actual?.transitionPrevented || null,
      voteSacrificed: !!sacrificed, sacrificedTarget: sacrificed?.voted || null,
      predictionMatched: !!actualBallot && actualBallot === record.predictedBallot };
  });
}

// The normal pre-vote screen is not omniscient. Organizers expose their own pitch,
// but private acceptances stay on their prior forecast until Tribal reveals them.
// Debug continues to use the original records with the fully resolved coalition.
export function buildViewerVoteCommitments(records = []) {
  const visible = records.map(record => {
    const copy = { ...record };
    const secretRecruit = copy.preNegotiationPredictedBallot
      && copy.preNegotiationPredictedBallot !== copy.predictedBallot
      && copy.voter !== copy.pitchOrganizer;
    if (secretRecruit) {
      copy.hiddenNegotiationPossible = true;
      copy.predictedBallot = copy.preNegotiationPredictedBallot;
      copy.predictionReason = copy.preNegotiationPredictionReason || 'pre-negotiation-forecast';
      delete copy.pitchCoalition;
      delete copy.pitchClaimedSupport;
    }
    return copy;
  });
  const projected = {};
  visible.forEach(record => {
    if (record.predictedBallot) projected[record.predictedBallot] = [...(projected[record.predictedBallot] || []), record.voter];
  });
  visible.forEach(record => {
    record.projectedVoters = [...(projected[record.proposedTarget] || [])];
    record.projectedVotes = record.projectedVoters.length;
  });
  return visible;
}

export function evaluateLateBallotTransition(record, target, context = {}) {
  if (!record || !target) return { target, lateTrigger: null, prevented: false };
  const modeled = new Set([record.preferredTarget, record.proposedTarget, record.committedTarget, record.predictedBallot].filter(Boolean));
  if (context.explicitTrigger) return { target, lateTrigger: context.explicitTrigger, prevented: false };
  if (target === record.predictedBallot) return { target, lateTrigger: 'plan-held', prevented: false };
  if (modeled.has(target)) {
    const lateTrigger = target === record.committedTarget ? 'initial-commitment-held'
      : target === record.proposedTarget ? 'returned-to-proposal'
      : target === record.preferredTarget ? 'private-preference-won'
      : 'modeled-option';
    return { target, lateTrigger, prevented: false };
  }
  const existingSupport = Math.max(0, context.existingSupport || 0);
  const requiredExisting = record.commitmentStrength >= 0.7 ? 2 : 1;
  if (existingSupport >= requiredExisting) {
    return { target, lateTrigger: `live-coalition-${existingSupport + 1}`, prevented: false };
  }

  const fallback = record.predictedBallot || record.committedTarget || record.proposedTarget || record.preferredTarget;
  return { target: fallback || target, lateTrigger: 'no-credible-late-trigger',
    prevented: !!fallback && fallback !== target, rejectedTarget: fallback && fallback !== target ? target : null };
}

export function resolveLateBallotTransitions(records, ballots) {
  const recordByVoter = new Map((records || []).map(record => [record.voter, record]));
  const provisionalSupport = {};
  (ballots || []).forEach(ballot => {
    if (ballot.target) provisionalSupport[ballot.target] = (provisionalSupport[ballot.target] || 0) + 1;
  });
  return (ballots || []).map(ballot => ({
    ...ballot,
    transition: evaluateLateBallotTransition(recordByVoter.get(ballot.voter), ballot.target, {
      explicitTrigger: ballot.explicitTrigger,
      existingSupport: Math.max(0, (provisionalSupport[ballot.target] || 0) - 1),
    }),
    provisionalSupport: provisionalSupport[ballot.target] || 0,
  }));
}

export function consolidateFringeBallots(records, ballots, { bond = () => 0, shouldMove = () => true } = {}) {
  const recordByVoter = new Map((records || []).map(record => [record.voter, record]));
  const support = {};
  (ballots || []).forEach(ballot => {
    const target = ballot.transition?.target || ballot.target;
    if (target) support[target] = (support[target] || 0) + 1;
  });
  const ranked = Object.entries(support).sort(([, a], [, b]) => b - a);
  if (ranked.length < 4 || (ranked[0]?.[1] || 0) < 2) return ballots;
  const leaders = ranked.slice(0, 2).map(([target]) => target);
  return (ballots || []).map(ballot => {
    const currentTarget = ballot.transition?.target || ballot.target;
    const record = recordByVoter.get(ballot.voter);
    const trigger = ballot.transition?.lateTrigger;
    const ordinaryHold = trigger === 'plan-held' || trigger === 'initial-commitment-held' || trigger === 'modeled-option';
    if (!record || support[currentTarget] !== 1 || !ordinaryHold || (record.commitmentStrength || 0) >= 0.70 || !shouldMove(ballot, record)) return ballot;
    // When one option already leads, consolidation should not manufacture a tie by
    // strengthening second place. If the leaders are tied, relationship fit breaks it.
    const leaderPool = ranked[0][1] > (ranked[1]?.[1] || 0) ? leaders.slice(0, 1) : leaders;
    const candidates = leaderPool.filter(target => target !== ballot.voter && bond(ballot.voter, target) < 3);
    if (!candidates.length) return ballot;
    const target = candidates.sort((a, b) => {
      const score = name => (support[name] || 0) * 2 - Math.max(0, bond(ballot.voter, name)) * 1.25 + Math.max(0, -bond(ballot.voter, name)) * 0.5;
      return score(b) - score(a) || String(a).localeCompare(String(b));
    })[0];
    return { ...ballot, isDefecting:target !== ballot.allianceTarget, fringeConsolidation:{ from:currentTarget, to:target },
      transition:{ target, lateTrigger:'late-consensus', prevented:false, originalTarget:currentTarget } };
  });
}
