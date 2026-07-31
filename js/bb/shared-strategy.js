// Big Brother adapters over the simulator's shared strategic substrate.
// This module owns format context and evidence translation, never duplicate state.
import { gs, players, seasonConfig } from '../core.js';
import { resolveAllianceRepair, nameNewAlliance } from '../alliances.js';
import { addBond, addPerceivedBond, getBond, getPerceivedBond } from '../bonds.js';
import { pStats, romanticCompat } from '../players.js';
import { getRelationshipDimensions } from '../relationships.js';
import { pitchTrust, tacticalCooperation, targetProtection } from '../relationships.js';
import { recordAttractionSpark, recordBetrayal } from '../relationship-events.js';
import { rememberStrategy, strategicMemoryScore } from '../strategy-memory.js';
import {
  evaluatePitchResponse, propagatePitchLeaks,
  resolveCompetingPitches, resolvePitchCounterplay,
} from '../voting.js';
import { describeBBCampaignReaction, summarizeBBCampaignReactions } from '../bb-writing.js';

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

/**
 * Alliances get names, not numbers.
 *
 * This produced "BB Alliance 1", which is what a database calls a row and not
 * what a house calls itself — every screen in the visual player was showing
 * it. Total Drama already owns a namer with pools by size, and the format this
 * is imitating is one where the names are half the point: Chilltown, The
 * Brigade, The Cookout.
 */
function nextAllianceName(size = 2, seedText = '') {
  const used = new Set(allianceStore().map(alliance => alliance.name));
  // nameNewAlliance picks with Math.random, which breaks a seeded season. The
  // pick is made deterministic from the founding members instead, so the same
  // seed names the same alliance every time.
  let hash = 0;
  const key = `${seedText}|${size}|${used.size}`;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const real = Math.random;
  try {
    for (let attempt = 0; attempt < 40; attempt++) {
      let state = (hash + attempt * 2654435761) >>> 0;
      Math.random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
      const name = nameNewAlliance(size);
      if (name && !used.has(name)) return name;
    }
  } catch { /* fall through to the numbered fallback */ } finally { Math.random = real; }
  let number = 1;
  while (used.has(`The Unnamed ${number}`)) number++;
  return `The Unnamed ${number}`;
}

// ── Alliance formation ────────────────────────────────────────────────
//
// This mirrors the Total Drama camp-event system rather than inventing its own
// rules, because that system already works and a houseguest should not behave
// like a different species from a camper. Taken from it unchanged in spirit:
//
//   * a permissive BOND FLOOR rather than a high trust bar — members need only
//     not actively dislike each other, and a strategic player can bridge even
//     that. The bar Big Brother had instead demanded three simultaneous strong
//     bonds, which measured out at one viable trio in twenty thousand.
//   * WEIGHTED TRIGGERS, so an alliance forms for a reason: a pitch, a close
//     pair, a shared enemy, or two people at the bottom deciding to stop being
//     there separately.
//   * a GLOBAL CAP that scales with the house, and a PER-PLAYER cap that lets
//     strategic players juggle more than one.
//
// What is Big Brother's own is the evidence those triggers read. Total Drama
// looks at surviving close votes together; a house looks at sitting on the
// block together, at who holds the power this week, and at a competition record
// that makes somebody worth having on your side.

const bondFloorFor = members => 0.5 - Math.max(...members.map(m => pStats(m).strategic)) * 0.15;

const alliancesWith = name => allianceStore()
  .filter(a => a.active !== false && !a.dissolved && (a.members || []).includes(name));

/** Strategic players can carry more alliances before they are overcommitted. */
// How many rooms one person can be in at once.
//
// This was 1 + strategic/5, which caps almost everybody at two and produced
// houses with two live alliances in them. That is not this format: people are
// routinely in a big group, a smaller one inside it, and a final two on the
// side, and the wiki's own account of a season is a list of overlapping deals.
// A strategic player runs several rooms; a floater is lucky to hold one.
const isOvercommitted = name =>
  alliancesWith(name).length >= 2 + Math.floor(pStats(name).strategic * 0.25);

const alreadyPaired = (a, b) => allianceStore()
  .some(al => al.active !== false && !al.dissolved && (al.members || []).includes(a) && al.members.includes(b));

/**
 * The alliance inside the alliance.
 *
 * This is the structure the format is actually built on, and it was
 * impossible: alreadyPaired refused to let two people who were already allied
 * form anything else, so a house could never produce the nested deals every
 * real season is made of — a final three inside a final six, and a final two
 * inside that.
 *
 * A sub-alliance forms among people whose trust in each other runs well ahead
 * of the group they are already in. It is the same instinct that makes the
 * parent alliance dangerous to be in: the people at the centre of it have
 * already decided who they are really playing for.
 */
function innerCircleOptions(house) {
  const options = [];
  for (const alliance of allianceStore()) {
    if (alliance.active === false || alliance.dissolved) continue;
    if (alliance.parent) continue;                       // no third layer
    const members = (alliance.members || []).filter(n => house.includes(n));
    if (members.length < 4) continue;                    // needs a group to hide inside
    const parentTrust = alliance.trust || 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i], b = members[j];
        const trust = pairTrust(a, b);
        // Meaningfully tighter with each other than the room they are in.
        if (trust < parentTrust + 1.6 || trust < 2.5) continue;
        if (allianceStore().some(al => al.active !== false && al.parent === alliance.id
          && (al.members || []).includes(a) && al.members.includes(b))) continue;
        options.push({ parent: alliance, members: [a, b], score: trust - parentTrust });
      }
    }
  }
  return options.sort((x, y) => y.score - x.score);
}

/**
 * How much the house wants this houseguest in an alliance.
 *
 * Big Brother's own evidence, layered on the shared relationship model: a
 * competition winner is worth having and worth protecting, whoever holds power
 * this week is worth being close to, and somebody sitting on the block is a
 * riskier bet than somebody who is not.
 */
function bbAllianceAppeal(name, week) {
  const record = gs.bb?.stats?.[name] || {};
  const comps = (record.hohWins || 0) * 0.6 + (record.vetoWins || 0) * 0.4;
  const inPower = week?.hoh === name ? 0.8 : 0;
  const onTheBlock = (week?.finalNominees || []).includes(name) ? -0.4 : 0;
  return comps + inPower + onTheBlock;
}

/** Nobody in an alliance may actively dislike anybody else already in it. */
function memberSetIsViable(members) {
  if (new Set(members).size !== members.length) return false;
  if (members.some(isOvercommitted)) return false;
  const floor = bondFloorFor(members);
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      if (getBond(members[i], members[j]) < floor) return false;
      if (alreadyPaired(members[i], members[j])) return false;
    }
  }
  return true;
}

/**
 * Keep the standing alliances honest each week: recompute their internal trust,
 * and dissolve the ones that have lost their people or lost faith in each other.
 */
function reconcileAlliances(house, weekNum) {
  const live = new Set(house);
  for (const alliance of allianceStore()) {
    if (alliance.active === false || alliance.dissolved) continue;
    const activeMembers = (alliance.members || []).filter(name => live.has(name));
    alliance.trust = activeMembers.length > 1
      ? activeMembers.reduce((sum, a, index) =>
          sum + activeMembers.slice(index + 1).reduce((n, b) => n + pairTrust(a, b), 0), 0)
        / (activeMembers.length * (activeMembers.length - 1) / 2)
      : 0;
    if (activeMembers.length <= 1 || alliance.trust <= -1) {
      alliance.active = false;
      alliance.dissolved = weekNum;
      alliance.dissolutionReason = activeMembers.length <= 1 ? 'insufficient-live-members' : 'trust-collapsed';
    }
  }
}

// Joining an existing alliance is judged on the AVERAGE relationship with its
// members, with a floor rather than a high bar for every single one. Requiring
// real trust with everybody is what kept alliances stuck at two people: real
// groups routinely take in somebody who is tight with two members and merely
// neutral with the third.
const JOIN_FLOOR = -0.5;    // not actively hostile to anyone already in it
const JOIN_AVG = 1.2;       // but genuinely wanted by the group overall

/**
 * Alliances that could take somebody in this week.
 *
 * Kept separate from founding a new one, and tried first, because otherwise it
 * never happens — and growth is what keeps alliances alive. A two-person
 * alliance dies the moment one of them is evicted, so a house that cannot grow
 * one is a house permanently full of pairs.
 */
function recruitmentOptions(house) {
  const options = [];
  for (const alliance of allianceStore()) {
    if (alliance.active === false || alliance.dissolved) continue;
    const members = (alliance.members || []).filter(name => house.includes(name));
    if (members.length < 2 || members.length >= 6) continue;
    for (const candidate of house) {
      if (members.includes(candidate)) continue;
      const scores = members.map(m => pairTrust(candidate, m));
      const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length;
      if (Math.min(...scores) < JOIN_FLOOR || avg < JOIN_AVG) continue;
      // A smaller alliance is hungrier for numbers than one that already has them.
      options.push({ alliance, members: [...members, candidate], candidate, score: avg + (6 - members.length) * 0.35 });
    }
  }
  return options.sort((a, b) => b.score - a.score || a.candidate.localeCompare(b.candidate));
}

/**
 * The reasons an alliance might form this week, mirroring Total Drama's.
 * Each yields a member list; the caller weights and picks between them.
 */
function formationTriggers(house, week, rng) {
  const triggers = [];
  const free = house.filter(n => !isOvercommitted(n));

  // 1. A pitch. Anyone can make one, and the chance scales with how persuasive
  //    or calculating they are — the Total Drama formula, unchanged.
  const pitchers = free.filter(n => {
    const st = pStats(n);
    return rng() < Math.max(st.strategic, st.social) * 0.08;
  });
  if (pitchers.length) {
    const hub = pitchers.sort((a, b) =>
      (pStats(b).social + pStats(b).strategic + bbAllianceAppeal(b, week))
      - (pStats(a).social + pStats(a).strategic + bbAllianceAppeal(a, week)))[0];
    const partners = free.filter(n => n !== hub)
      .map(n => ({ n, score: getBond(hub, n) + bbAllianceAppeal(n, week) + rng() * 0.5 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, rng() < 0.45 ? 2 : 1)
      .map(x => x.n);
    if (partners.length) triggers.push({ weight: 10, members: [hub, ...partners], evidence: 'strategic-pitch' });
  }

  // 2. A close pair who are not already allied; likelihood scales with the bond.
  outer:
  for (let i = 0; i < free.length; i++) {
    for (let j = i + 1; j < free.length; j++) {
      const b = getBond(free[i], free[j]);
      if (b >= 1 && rng() < (b - 1) * 0.15 && !alreadyPaired(free[i], free[j])) {
        triggers.push({ weight: 8, members: [free[i], free[j]], evidence: 'close-pair' });
        break outer;
      }
    }
  }

  // 3. A shared enemy. In a house that is either mutual dislike, as on the
  //    island, or two people who have independently decided on the same target.
  for (let i = 0; i < free.length && triggers.length < 6; i++) {
    for (let j = i + 1; j < free.length; j++) {
      if (getBond(free[i], free[j]) < -0.5) continue;
      const shared = house.find(e => {
        if (e === free[i] || e === free[j]) return false;
        const h1 = getBond(free[i], e), h2 = getBond(free[j], e);
        const hated = h1 <= -1 && h2 <= -1 && (h1 + h2) <= -3;
        const hunted = getBBTarget(free[i]) === e && getBBTarget(free[j]) === e;
        return hated || hunted;
      });
      if (shared) {
        triggers.push({ weight: 7, members: [free[i], free[j]], evidence: 'shared-enemy', against: shared });
        break;
      }
    }
  }

  // 4. The bottom of the house banding together.
  const avgBond = n => house.filter(p => p !== n)
    .reduce((sum, p) => sum + getBond(n, p), 0) / Math.max(1, house.length - 1);
  const bottom = [...free].sort((a, b) => avgBond(a) - avgBond(b)).slice(0, 2);
  if (bottom.length === 2 && getBond(bottom[0], bottom[1]) > -1 && !alreadyPaired(bottom[0], bottom[1])) {
    triggers.push({ weight: 6, members: bottom, evidence: 'survival-pact' });
  }

  // 5. Big Brother's version of surviving a vote together: sitting on the block
  //    beside somebody and both of you walking away from it.
  const survivors = (week?.finalNominees || []).filter(n => house.includes(n));
  if (survivors.length === 2 && getBond(survivors[0], survivors[1]) > -1
    && !alreadyPaired(survivors[0], survivors[1])) {
    triggers.push({ weight: 7, members: survivors, evidence: 'shared-block' });
  }

  // 6. A recorded deal remains the strongest evidence there is.
  for (const deal of gs.sideDeals || []) {
    if (deal.active === false || deal.genuine === false) continue;
    const [a, b] = deal.players || [];
    if (!a || !b || !house.includes(a) || !house.includes(b) || alreadyPaired(a, b)) continue;
    triggers.push({ weight: 14, members: [a, b], evidence: 'genuine-deal' });
  }

  return triggers.filter(t => memberSetIsViable(t.members));
}

export function updateBBAllianceLifecycle({ phase = 'opening', house = gs.activePlayers || [], week = null, rng = Math.random } = {}) {
  const weekNum = currentRound(week);
  reconcileAlliances(house, weekNum);
  if (phase !== 'opening' || house.length < 3) return { formed:null, alliances:allianceStore() };

  // Scales with the house, as on the island: a full house supports several
  // overlapping alliances, a final six supports very few.
  const live = allianceStore().filter(a => a.active !== false && !a.dissolved);
  if (live.length >= Math.max(2, Math.floor(house.length / 2))) {
    return { formed:null, alliances:allianceStore() };
  }

  // Growing an existing alliance comes first. It is how a pair becomes a bloc,
  // and without it the house fills with duos that die the moment one of the two
  // is evicted.
  for (const option of recruitmentOptions(house).slice(0, 4)) {
    if (isOvercommitted(option.candidate)) continue;
    const chance = clamp(0.22 + option.score * 0.11, 0.25, 0.7);
    if (rng() >= chance) continue;
    option.alliance.members = [...option.members];
    option.alliance.trust = option.score;
    (option.alliance.history ||= []).push({ week:weekNum, type:'recruited', member:option.candidate });
    return { formed:option.alliance, alliances:allianceStore() };
  }

  // The alliance inside the alliance, before founding anything new.
  for (const option of innerCircleOptions(house).slice(0, 3)) {
    if (rng() >= clamp(0.12 + option.score * 0.09, 0.12, 0.4)) continue;
    const [a, b] = option.members;
    const sub = {
      id: `bb_inner_${weekNum}_${a}_${b}`,
      name: nextAllianceName(2, `${a}|${b}|${weekNum}`), members: [a, b], formed: weekNum, active: true,
      permanence: 'normal', trust: pairTrust(a, b),
      formationEvidence: `a final two inside ${option.parent.name}`,
      parent: option.parent.id, parentName: option.parent.name,
      against: null, history: [{ week: weekNum, type: 'formed-inside', parent: option.parent.name }],
    };
    allianceStore().push(sub);
    return { formed: sub, alliances: allianceStore() };
  }

  const triggers = formationTriggers(house, week, rng);
  if (!triggers.length) return { formed:null, alliances:allianceStore() };

  // Weighted pick between the reasons rather than always taking the strongest,
  // so a house does not form the same kind of alliance every single week.
  const total = triggers.reduce((sum, t) => sum + t.weight, 0);
  let roll = rng() * total;
  let chosen = triggers[triggers.length - 1];
  for (const t of triggers) { roll -= t.weight; if (roll <= 0) { chosen = t; break; } }

  const members = [...chosen.members].sort();
  const pairCount = Math.max(1, members.length * (members.length - 1) / 2);
  const alliance = {
    id: `bb_alliance_${weekNum}_${members.join('_')}`,
    name: nextAllianceName(members.length, `${members.join('|')}|${weekNum}`), members, formed: weekNum, active: true,
    permanence: 'normal',
    trust: members.reduce((sum, a, i) =>
      sum + members.slice(i + 1).reduce((n, b) => n + pairTrust(a, b), 0), 0) / pairCount,
    formationEvidence: chosen.evidence, against: chosen.against || null,
    betrayals: [], quits: [],
    history: [{ week: weekNum, type: 'formed', evidence: chosen.evidence }],
  };
  allianceStore().push(alliance);
  // Forming one draws the members together, as it does on the island.
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) addBond(members[i], members[j], 0.2);
  }
  return { formed: alliance, alliances: allianceStore() };
}

export function settleBBAllianceWeek(week, rng = Math.random) {
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

      // A defection is not automatically the end of an alliance. Real houses
      // survive one — the person explains themselves, some of the room buys
      // it, and the group carries on weaker and warier. Total Drama already
      // models exactly that, including which approach somebody takes (apology,
      // strategic explanation, denial, refusal), how credible it is, and
      // whether they have used the same excuse before.
      let repair = null;
      try {
        repair = resolveAllianceRepair({
          alliance: alliance.name, traitor: ballot.voter, votedFor: ballot.evict,
          votedAlly: true, severity: 'major', allyEliminated: week.evicted === ballot.evict,
        }, week.num, rng);
      } catch { /* repair is a bonus; the betrayal still counts without it */ }
      incidents.push({ alliance:alliance.name, ...incident, repair });
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
    pitch.reactionSummary = summarizeBBCampaignReactions(pitch, pitch.responses);
    // Narration selection must not consume the gameplay RNG or change whether
    // the same pitch subsequently leaks or triggers counterplay.
    pitch.reactions = pitch.responses.map(response => ({ ...response, narration:describeBBCampaignReaction(pitch, response, () => 0) }));
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
