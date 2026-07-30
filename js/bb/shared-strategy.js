// Big Brother adapters over the simulator's shared strategic substrate.
// This module owns format context and evidence translation, never duplicate state.
import { gs, players, seasonConfig } from '../core.js';
import { addBond, addPerceivedBond, getBond, getPerceivedBond } from '../bonds.js';
import { pStats, romanticCompat } from '../players.js';
import { getRelationshipDimensions } from '../relationships.js';
import { pitchTrust, tacticalCooperation, targetProtection } from '../relationships.js';
import { recordAttractionSpark, recordBetrayal } from '../relationship-events.js';
import { rememberStrategy, strategicMemoryScore } from '../strategy-memory.js';
import {
  describePitchReaction, evaluatePitchResponse, propagatePitchLeaks,
  resolveCompetingPitches, resolvePitchCounterplay, summarizePitchReactions,
} from '../voting.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const currentRound = week => Number(week?.num || (gs.episode || 0) + 1);

function intentionStore() {
  if (!gs.intentions || typeof gs.intentions !== 'object') gs.intentions = {};
  return gs.intentions;
}

function ensureBBIntentions(actor, week) {
  const store = intentionStore();
  if (store[actor]) {
    store[actor].targets ||= [];
    store[actor].origins ||= {};
    store[actor].origins.targets ||= {};
    store[actor].history ||= [];
    return store[actor];
  }
  const round = currentRound(week);
  return (store[actor] = {
    owner: actor, stage: 'big-brother', planStyle: 'reactive', confidence: 0.5,
    finalThree: [actor], preferredCore: [], shield: null, goat: null,
    backupAllies: [], targets: [], revenge: [], revengeSince: {}, juryPlan: [],
    advantagePlan: null, betrayalConditions: [], formedEp: round,
    lastRevisedEp: round, lastTickEp: null,
    origins: { preferredCore: {}, backupAllies: {}, targets: {}, revenge: {}, finalThree: {}, goat: {} },
    history: [],
  });
}

export function setBBTarget(actor, target, reason = 'house event', context = {}) {
  if (!actor || !target || actor === target) return false;
  const round = currentRound(context.week);
  const plan = ensureBBIntentions(actor, context.week);
  const previous = [...plan.targets];
  plan.targets = [target, ...plan.targets.filter(name => name !== target)].slice(0, 3);
  plan.origins.targets[target] = reason;
  plan.history.push({ ep: round, field: 'targets', from: previous, to: [...plan.targets], reason });
  if (plan.history.length > 20) plan.history.splice(0, plan.history.length - 20);
  plan.lastRevisedEp = round;
  return true;
}

export function getBBTarget(actor) {
  return gs.intentions?.[actor]?.targets?.[0] || null;
}

export function rememberBBStrategy(observer, subject, type, strength = 1, detail = {}, context = {}) {
  if (!observer || !subject || !type || observer === subject) return null;
  const details = { ...detail, format: 'big-brother', act: context.act || null };
  return rememberStrategy(observer, subject, type, currentRound(context.week), Number(strength) || 1, details);
}

export function addBBRelationship(a, b, delta) {
  if (!a || !b || a === b || !Number.isFinite(Number(delta))) return false;
  addBond(a, b, Number(delta));
  return true;
}

export function addBBShowmanceSpark(a, b, detail = {}, context = {}) {
  if (seasonConfig.romance === 'disabled' || !a || !b || a === b || !romanticCompat(a, b)) return false;
  gs.showmances ||= [];
  gs.romanticSparks ||= [];
  const active = gs.showmances.filter(showmance => showmance.phase !== 'broken-up');
  if (active.length >= 4 || active.some(showmance => showmance.players?.includes(a) || showmance.players?.includes(b))) return false;
  if (gs.romanticSparks.some(spark => spark.players?.includes(a) && spark.players?.includes(b))) return false;
  const strength = Number(detail.intensity) || 0.3;
  gs.romanticSparks.push({
    players: [a, b], sparkEp: currentRound(context.week),
    context: detail.context || 'Big Brother house', intensity: strength,
    fake: false, saboteur: null,
  });
  recordAttractionSpark(a, b, { strength, ep: currentRound(context.week) });
  addBond(a, b, Number(detail.bondDelta) || 0.5);
  return true;
}

function allianceStrength(a, b) {
  return (gs.namedAlliances || []).reduce((best, alliance) => {
    if (alliance.active !== false && alliance.members?.includes(a) && alliance.members.includes(b)) {
      const liveSize = alliance.members.filter(name => (gs.activePlayers || []).includes(name)).length;
      return Math.max(best, 1 + liveSize * 0.15);
    }
    return best;
  }, 0);
}

export function bbAllianceStrength(a, b) {
  return allianceStrength(a, b);
}

export function bbThreatProfile(name) {
  const stats = pStats(name);
  const others = (gs.activePlayers || players.map(player => player.name)).filter(other => other !== name);
  const socialPosition = others.length
    ? others.reduce((sum, other) => sum + getBond(name, other), 0) / others.length
    : 0;
  const record = gs.bb?.stats?.[name] || {};
  const competition = (record.hohWins || 0) * 0.8 + (record.vetoWins || 0) * 0.55;
  const base = stats.strategic * 0.27 + stats.social * 0.18 + stats.physical * 0.12
    + stats.endurance * 0.12 + stats.mental * 0.13 + stats.intuition * 0.1;
  return { base, socialPosition, competition, total: base + socialPosition * 0.22 + competition };
}

export function bbThreat(name) {
  return bbThreatProfile(name).total;
}

export function bbHeat(observer, candidate) {
  const target = getBBTarget(observer) === candidate ? 4 : 0;
  const suspicion = gs.bb?.house?.suspicion?.[`${observer}→${candidate}`] || 0;
  const memory = strategicMemoryScore(observer, candidate, (gs.episode || 0) + 1);
  const relationship = getPerceivedBond(observer, candidate);
  const alliance = allianceStrength(observer, candidate);
  const components = {
    threat: bbThreat(candidate), relationship: -relationship * 0.85,
    alliance: -alliance * 2.2, target, suspicion: suspicion * 0.45,
    memory: clamp(memory, -4, 6) * 0.65,
  };
  return { components, total: Object.values(components).reduce((sum, value) => sum + value, 0) };
}

function allianceStore() {
  if (!Array.isArray(gs.namedAlliances)) gs.namedAlliances = [];
  return gs.namedAlliances;
}

function pairTrust(a, b) {
  const ab = getRelationshipDimensions(a, b);
  const ba = getRelationshipDimensions(b, a);
  return getBond(a, b) * 0.65 + ((ab.trust || 0) + (ba.trust || 0)) * 0.175;
}

function hasGenuineDeal(a, b) {
  return (gs.sideDeals || []).some(deal => deal.active !== false && deal.genuine !== false
    && deal.players?.includes(a) && deal.players.includes(b));
}

function sameMembers(alliance, members) {
  const a = [...(alliance.members || [])].sort();
  const b = [...members].sort();
  return a.length === b.length && a.every((name, index) => name === b[index]);
}

function nextAllianceName() {
  const used = new Set(allianceStore().map(alliance => alliance.name));
  let number = 1;
  while (used.has(`BB Alliance ${number}`)) number++;
  return `BB Alliance ${number}`;
}

function viableCores(house) {
  const genuinePairs = [];
  for (let i = 0; i < house.length; i++) {
    for (let j = i + 1; j < house.length; j++) {
      const a = house[i], b = house[j];
      if (hasGenuineDeal(a, b)) genuinePairs.push({ members:[a, b], score:pairTrust(a, b) + 4, evidence:'genuine-deal' });
    }
  }
  const triples = [];
  for (let i = 0; i < house.length; i++) {
    for (let j = i + 1; j < house.length; j++) {
      for (let k = j + 1; k < house.length; k++) {
        const members = [house[i], house[j], house[k]];
        const scores = [pairTrust(members[0], members[1]), pairTrust(members[0], members[2]), pairTrust(members[1], members[2])];
        const avg = scores.reduce((sum, value) => sum + value, 0) / scores.length;
        if (Math.min(...scores) >= 2.5 && avg >= 3.25) triples.push({ members, score:avg, evidence:'mutual-trust' });
      }
    }
  }
  return [...genuinePairs, ...triples].sort((a, b) => b.score - a.score || a.members.join('|').localeCompare(b.members.join('|')));
}

function reconcileAlliances(house, weekNum) {
  const live = new Set(house);
  for (const alliance of allianceStore()) {
    if (alliance.active === false || alliance.dissolved) continue;
    const activeMembers = (alliance.members || []).filter(name => live.has(name));
    alliance.trust = activeMembers.length > 1
      ? activeMembers.reduce((sum, a, index) => sum + activeMembers.slice(index + 1).reduce((n, b) => n + pairTrust(a, b), 0), 0)
        / (activeMembers.length * (activeMembers.length - 1) / 2)
      : 0;
    if (activeMembers.length <= 1 || alliance.trust <= -1) {
      alliance.active = false;
      alliance.dissolved = weekNum;
      alliance.dissolutionReason = activeMembers.length <= 1 ? 'insufficient-live-members' : 'trust-collapsed';
    }
  }
}

export function updateBBAllianceLifecycle({ phase = 'opening', house = gs.activePlayers || [], week = null, rng = Math.random } = {}) {
  const weekNum = currentRound(week);
  reconcileAlliances(house, weekNum);
  if (phase !== 'opening') return { formed:null, alliances:allianceStore() };
  const core = viableCores(house).find(candidate => !allianceStore().some(alliance =>
    alliance.active !== false && !alliance.dissolved && sameMembers(alliance, candidate.members)));
  if (!core) {
    return { formed:null, alliances:allianceStore() };
  }
  const formationChance = core.evidence === 'genuine-deal' ? 0.9 : clamp(0.28 + core.score * 0.09, 0.45, 0.82);
  if (rng() >= formationChance) return { formed:null, alliances:allianceStore() };
  const alliance = {
    name:nextAllianceName(), members:[...core.members], formed:weekNum, active:true,
    permanence:'normal', trust:core.score, formationEvidence:core.evidence,
    betrayals:[], quits:[], history:[{ week:weekNum, type:'formed', evidence:core.evidence }],
  };
  allianceStore().push(alliance);
  return { formed:alliance, alliances:allianceStore() };
}

export function settleBBAllianceWeek(week) {
  if (!week?.ballots?.length) return [];
  const incidents = [];
  for (const alliance of allianceStore()) {
    if (alliance.active === false || alliance.dissolved) continue;
    const members = new Set(alliance.members || []);
    for (const ballot of week.ballots) {
      if (!members.has(ballot.voter) || !members.has(ballot.evict)) continue;
      if (alliance.betrayals?.some(item => item.week === week.num && item.player === ballot.voter && item.victim === ballot.evict)) continue;
      const incident = { week:week.num, ep:week.num, player:ballot.voter, voter:ballot.voter, victim:ballot.evict, severity:'major', reason:'voted to evict an ally' };
      alliance.betrayals ||= [];
      alliance.betrayals.push(incident);
      alliance.history ||= [];
      alliance.history.push({ week:week.num, type:'betrayal', player:ballot.voter, victim:ballot.evict });
      recordBetrayal(ballot.evict, ballot.voter, { severity:1, ep:week.num });
      rememberStrategy(ballot.evict, ballot.voter, 'alliance-betrayal', week.num, 2, { alliance:alliance.name, format:'big-brother' });
      incidents.push({ alliance:alliance.name, ...incident });
    }
  }
  reconcileAlliances(gs.activePlayers || [], week.num);
  return incidents;
}

function perceivedStore() {
  if (!gs.perceivedBonds || typeof gs.perceivedBonds !== 'object') gs.perceivedBonds = {};
  return gs.perceivedBonds;
}

function perceptionEvidence(observer, subject, week) {
  const observerStats = pStats(observer);
  const subjectStats = pStats(subject);
  const real = getBond(observer, subject);
  const sameAlliance = allianceStrength(observer, subject) > 0;
  const suspicion = gs.bb?.house?.suspicion?.[`${observer}→${subject}`] || 0;
  const betrayed = (gs.strategicMemories?.[observer] || []).some(memory =>
    memory.subject === subject && memory.type === 'alliance-betrayal' && memory.ep >= (week?.num || 0) - 1);
  if (betrayed && observerStats.loyalty >= 6 && real < 3) {
    return { reason:'post-betrayal-denial', direction:1, strength:1.8 + observerStats.loyalty * 0.12, score:7 };
  }
  if (sameAlliance && real < 3.5) {
    return { reason:'alliance-blindspot', direction:1, strength:1.4 + observerStats.loyalty * 0.1, score:5.5 + observerStats.loyalty * 0.2 };
  }
  if (suspicion >= 3) {
    return { reason:'house-paranoia', direction:-1, strength:1 + suspicion * 0.18, score:4 + suspicion * 0.35 };
  }
  const manipulation = (subjectStats.social || 5) * 0.55 + (subjectStats.strategic || 5) * 0.45
    - (observerStats.intuition || 5) * 0.65 - (observerStats.mental || 5) * 0.2;
  if (manipulation >= 1.5 && real < 4) {
    return { reason:'villain-manipulation', direction:1, strength:1.2 + manipulation * 0.16, score:manipulation };
  }
  return null;
}

export function updateBBPerceptions({ house = gs.activePlayers || [], week = null, rng = Math.random, maxNew = 2 } = {}) {
  const store = perceivedStore();
  const live = new Set(house);
  const corrected = [];
  const removed = [];
  for (const key of Object.keys(store)) {
    const entry = store[key];
    const [observer, subject] = key.split('→');
    if (!entry || !live.has(observer) || !live.has(subject)) {
      delete store[key];
      removed.push(key);
      continue;
    }
    const real = getBond(observer, subject);
    let rate = Number(entry.correctionRate) || ((pStats(observer).intuition || 5) * 0.07 + (pStats(observer).mental || 5) * 0.025);
    if (week?.hoh === subject && week.initialNominees?.includes(observer)) rate += 0.35;
    if (week?.ballots?.some(ballot => ballot.voter === subject && ballot.evict === observer)) rate += 0.3;
    if (entry.reason === 'post-betrayal-denial') rate = Math.max(0.05, rate - (pStats(observer).loyalty || 5) * 0.025);
    rate = clamp(rate, 0.05, 0.9);
    const before = entry.perceived;
    entry.perceived += (real - entry.perceived) * rate;
    entry.lastCorrectedWeek = week?.num || currentRound(week);
    corrected.push({ observer, subject, before, after:entry.perceived, real, reason:entry.reason });
    if (Math.abs(entry.perceived - real) < 0.3) {
      delete store[key];
      removed.push(key);
    }
  }

  const candidates = [];
  for (const observer of house) {
    for (const subject of house) {
      if (observer === subject || store[`${observer}→${subject}`]) continue;
      const evidence = perceptionEvidence(observer, subject, week);
      if (evidence) candidates.push({ observer, subject, ...evidence });
    }
  }
  candidates.sort((a, b) => b.score - a.score || `${a.observer}|${a.subject}`.localeCompare(`${b.observer}|${b.subject}`));
  const created = [];
  for (const candidate of candidates) {
    if (created.length >= Math.max(0, maxNew)) break;
    const observerStats = pStats(candidate.observer);
    const chance = clamp(0.18 + candidate.score * 0.055 - (observerStats.intuition || 5) * 0.018, 0.12, 0.72);
    if (rng() >= chance) continue;
    const real = getBond(candidate.observer, candidate.subject);
    const perceived = clamp(real + candidate.direction * candidate.strength, -10, 10);
    if (Math.abs(perceived - real) < 0.3) continue;
    addPerceivedBond(candidate.observer, candidate.subject, perceived, candidate.reason);
    store[`${candidate.observer}→${candidate.subject}`].createdWeek = week?.num || currentRound(week);
    created.push({ observer:candidate.observer, subject:candidate.subject, real, perceived, reason:candidate.reason });
  }
  return { corrected, created, removed };
}

export function resolveBBCampaignAct({ nominees = [], ballots = [], house = gs.activePlayers || [], campaignIndex = 0, rng = Math.random } = {}) {
  if (nominees.length !== 2) throw new Error('A standard Big Brother campaign requires exactly two nominees.');
  gs.playerStates ||= {};
  gs._pitchExposureResponses = {};
  gs._pitchCounterplay = {};
  const eligibleVoters = ballots.length;
  const majority = Math.floor(eligibleVoters / 2) + 1;
  const pitches = nominees.map(nominee => {
    const pitchTarget = nominees.find(name => name !== nominee);
    const existingSupporters = ballots.filter(ballot => ballot.evict === pitchTarget).map(ballot => ballot.voter);
    const competingSupport = ballots.filter(ballot => ballot.evict === nominee).length;
    const approachBudget = clamp(1 + Math.floor((pStats(nominee).social || 5) / 3), 1, Math.max(1, ballots.length));
    const approaches = ballots.filter(ballot => ballot.evict === nominee || ballot.margin < 2.2)
      .sort((a, b) => a.margin - b.margin || a.voter.localeCompare(b.voter)).slice(0, approachBudget);
    const liar = ['schemer','villain','chaos-agent','mastermind'].includes(players.find(player => player.name === nominee)?.archetype)
      && (pStats(nominee).loyalty || 5) <= 5;
    const claimedSupport = Math.min(eligibleVoters, existingSupporters.length + 1 + (liar ? 1 : 0));
    const responses = approaches.map(ballot => {
      const voterStats = pStats(ballot.voter);
      const response = evaluatePitchResponse({
        trust:pitchTrust(ballot.voter, nominee), loyalty:voterStats.loyalty,
        targetBond:targetProtection(ballot.voter, pitchTarget), claimedSupport,
        eligibleVoters, confirmedSupport:existingSupporters.length,
        strategic:voterStats.strategic, intuition:voterStats.intuition,
        emotional:gs.playerStates?.[ballot.voter]?.emotional || 'comfortable', liar,
        competingSupport, commitmentStrength:clamp((ballot.margin || 0) / 5, 0, 1),
        majority, tacticalCredibility:tacticalCooperation(ballot.voter, nominee),
      }, rng);
      return { voter:ballot.voter, ...response };
    });
    const flipped = responses.filter(response => response.accepted).map(response => response.voter);
    return {
      pitcher:nominee, pitchTarget, campaignIndex, liar, liedAboutNumbers:liar,
      claimedSupport, existingSupporters, confirmedSupport:existingSupporters.length,
      responses, flipped, confirmedCoalition:[...new Set([...existingSupporters, ...flipped])],
      success:flipped.length > 0,
    };
  });

  const commitments = ballots.map(ballot => ({
    voter:ballot.voter, predictedBallot:ballot.evict,
    commitmentStrength:clamp((ballot.margin || 0) / 5, 0, 1),
  }));
  resolveCompetingPitches(pitches, commitments);
  const changed = [];
  for (const pitch of pitches) {
    for (const voter of pitch.flipped || []) {
      const ballot = ballots.find(item => item.voter === voter);
      if (!ballot || ballot.evict === pitch.pitchTarget) continue;
      const from = ballot.evict;
      ballot.evict = pitch.pitchTarget;
      ballot.changed = true;
      ballot.changedBy = pitch.pitcher;
      ballot.changeReason = 'accepted-campaign-pitch';
      addBond(pitch.pitcher, voter, 0.35);
      changed.push({ voter, from, to:pitch.pitchTarget, changedBy:pitch.pitcher, reason:ballot.changeReason });
    }
    for (const response of pitch.responses.filter(item => !item.accepted)) addBond(pitch.pitcher, response.voter, -0.15);
    pitch.reactionSummary = summarizePitchReactions(pitch, pitch.responses);
    // Narration selection must not consume the gameplay RNG or change whether
    // the same pitch subsequently leaks or triggers counterplay.
    pitch.reactions = pitch.responses.map(response => ({ ...response, narration:describePitchReaction(pitch, response, () => 0) }));
  }

  const activeAlliances = (gs.namedAlliances || []).filter(alliance => alliance.active !== false && !alliance.dissolved);
  const intel = propagatePitchLeaks(pitches, house, activeAlliances, rng);
  const campaignPlayers = [...new Set([...nominees, ...ballots.map(ballot => ballot.voter)])];
  const counterplay = resolvePitchCounterplay(pitches, intel, campaignPlayers, activeAlliances, [], rng);
  // The shared primitive treats every participant as a potential voter. BB
  // nominees can organize counterplay but cannot cast ballots, so normalize
  // coalition viability against the actual eviction voters.
  const voterSet = new Set(ballots.map(ballot => ballot.voter));
  for (const action of counterplay) {
    action.coalition = (action.coalition || []).filter(name => name === action.actor || voterSet.has(name));
    action.majority = majority;
    if (action.success) action.success = action.coalition.filter(name => voterSet.has(name)).length >= Math.max(1, majority - 2);
  }
  for (const action of counterplay.filter(item => item.success)) {
    for (const voter of action.coalition || []) {
      const ballot = ballots.find(item => item.voter === voter);
      if (!ballot || !nominees.includes(action.pitcher) || ballot.evict === action.pitcher) continue;
      const from = ballot.evict;
      ballot.evict = action.pitcher;
      ballot.changed = true;
      ballot.changedBy = action.actor;
      ballot.changeReason = 'pitch-counterplay';
      changed.push({ voter, from, to:action.pitcher, changedBy:action.actor, reason:ballot.changeReason });
    }
  }
  return { pitches, intel, counterplay, changed };
}
