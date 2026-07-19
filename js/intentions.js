// ══════════════════════════════════════════════════════════════════════
// intentions.js — persistent, evolving per-contestant endgame plans.
//
// A contestant carries ONE plan across episodes and only revises it when a
// believable event forces a change — they never rebuild strategy from scratch.
// Plans cover: intended final three, preferred shield, endgame goat, backup
// allies, long-term targets, revenge goals, jury-management, advantage plan,
// and the conditions that would justify betraying an ally. Every change logs a
// reason (feeds the VP / text backlog hints).
//
// SELF-CONTAINED: reads only stable APIs (bonds, relationship dimensions,
// knowledge). Writes only gs.intentions. No dependency on the camp/location
// system (#4) — that stays parallel.
// ══════════════════════════════════════════════════════════════════════
import { gs, players } from './core.js';
import { getBond } from './bonds.js';
import { getRelationshipDimensions } from './relationships.js';
import { strategicReputation } from './reputation.js';

function store() { if (!gs.intentions || typeof gs.intentions !== 'object') gs.intentions = {}; return gs.intentions; }
function statsOf(n) { return players.find(p => p.name === n)?.stats || {}; }
function curEp() { return (gs.episode || 0) + 1; }
function active() { return (gs.activePlayers || players.map(p => p.name)); }
function planningCircle(name) {
  if (gs.isMerged) return active().filter(n => n !== name);
  const tribes = Array.isArray(gs.tribes) ? gs.tribes : [];
  const tribe = tribes.find(t => (t.members || []).includes(name));
  const pool = tribe?.members || active();
  return pool.filter(n => n !== name && active().includes(n));
}
function liveDeals(name) {
  return (gs.sideDeals || []).filter(d => d.active && d.genuine !== false && (d.players || []).includes(name));
}
function confirmedPartners(name) {
  return [...new Set(liveDeals(name).flatMap(d => d.players || []).filter(n => n !== name && active().includes(n)))];
}

// self-contained proxies (no chalRecord dependency, safe during formation)
function threatProxy(n) { const s = statsOf(n); return (s.strategic || 5) * 0.4 + (s.social || 5) * 0.3 + Math.max(s.physical || 5, s.endurance || 5) * 0.2 + (s.boldness || 5) * 0.1; }
function trustOf(a, b) { const d = getRelationshipDimensions(a, b); return (d.trust || 0) * 0.6 + getBond(a, b) * 0.4; }
function respectOf(a, b) { return getRelationshipDimensions(a, b).strategicRespect || 0; }
function resentOf(a, b) { return getRelationshipDimensions(a, b).resentment || 0; }
function planSkill(name) { const s = statsOf(name); return ((s.strategic || 5) * 0.65 + (s.intuition || 5) * 0.2 + (s.social || 5) * 0.15); }

const clamp01 = n => Math.max(0, Math.min(1, n));
const clamp10 = n => Math.max(0, Math.min(10, n));

// Observable FTC résumé, deliberately separate from archetype/base-stat labels.
// A weak challenge record is supporting evidence only; social/jury standing,
// demonstrated vote control, visible moves and public mistakes carry more weight.
function ftcResume(name) {
  const history = gs.episodeHistory || [];
  const ballots = history.flatMap(ep => (ep.votingLog || []).filter(v => v.voter === name && v.voted));
  const controlled = ballots.filter(v => {
    const ep = history.find(h => (h.votingLog || []).includes(v));
    return ep?.eliminated && v.voted === ep.eliminated;
  }).length;
  const voteControl = ballots.length ? controlled / ballots.length : 0.45;
  const rep = strategicReputation(name);
  const bigMoves = Number(gs.playerStates?.[name]?.bigMoves || 0);
  const rec = gs.chalRecord?.[name] || {};
  const wins = Number(rec.wins || rec.individualWins || 0);
  const bombs = Number(rec.bombs || 0);
  const mistakes = history.reduce((n, ep) => n
    + (ep.voteMiscommunications || []).filter(m => (m.voter || m.player) === name).length
    + (ep.idolPlays || []).filter(p => p.player === name && (p.misplay || p.failed || p.fake)).length
    + (ep.votePitches || []).filter(p => p.pitcher === name && p.success === false).length * 0.35, 0);

  const jury = (gs.jury || []).filter(j => j !== name);
  const socialPool = jury.length ? jury : active().filter(n => n !== name);
  const incoming = socialPool.map(observer => getBond(observer, name));
  const positive = incoming.filter(v => v >= 2).length;
  const socialStanding = incoming.length
    ? clamp01((incoming.reduce((a, b) => a + Math.max(-4, Math.min(6, b)), 0) / incoming.length + 4) / 10)
    : 0.45;
  const strongSupport = incoming.length ? positive / incoming.length : 0;
  const strategyStanding = clamp01(rep.control * 0.38 + rep.persuasion * 0.30 + voteControl * 0.20 + Math.min(1, bigMoves / 4) * 0.12);
  const challengeStanding = clamp01(0.32 + wins * 0.18 - bombs * 0.035);
  const equity = clamp10(10 * (socialStanding * 0.34 + strongSupport * 0.16
    + strategyStanding * 0.32 + challengeStanding * 0.08
    + clamp01((rep.reliability + rep.discretion) / 2) * 0.10) - Math.min(1.4, mistakes * 0.28));
  const evidenceUnits = ballots.length + rep.evidence.pitches + jury.length * 1.5
    + Math.min(4, wins + bombs) + Math.min(4, bigMoves) + Math.min(3, mistakes);
  const confidence = clamp01(0.18 + evidenceUnits / 20);
  return { equity, confidence, ballots:ballots.length, controlled, voteControl, bigMoves, wins, bombs,
    mistakes, jurySize:jury.length, positiveJurors:positive, socialStanding, strongSupport,
    strategyStanding, reputation:rep };
}

// Planner-specific read: high beatability means the planner currently believes
// they can defeat this candidate at FTC. Usability is a separate requirement;
// an enemy can look beatable without being a realistic drag-along partner.
export function evaluateEndgameBeatability(planner, candidate) {
  if (!planner || !candidate || planner === candidate) return null;
  const mine = ftcResume(planner), theirs = ftcResume(candidate);
  const relationship = trustOf(planner, candidate);
  const margin = mine.equity - theirs.equity;
  const beatability = clamp10(5 + margin * 0.72 + Math.min(1.1, theirs.mistakes * 0.22));
  const confidence = clamp01((mine.confidence + theirs.confidence) / 2);
  const usable = relationship > -2.5 && resentOf(planner, candidate) < 4;
  const reasons = [];
  const warnings = [];
  if (theirs.jurySize) reasons.push(`${theirs.positiveJurors}/${theirs.jurySize} jurors currently show a solid positive bond`);
  else reasons.push(`${Math.round(theirs.strongSupport * 100)}% of the remaining cast show a solid positive bond (early jury proxy)`);
  if (theirs.ballots >= 2) reasons.push(`their ballots matched the boot ${theirs.controlled}/${theirs.ballots} times`);
  else reasons.push(`only ${theirs.ballots} recorded ballot${theirs.ballots === 1 ? '' : 's'} — strategic résumé is still uncertain`);
  reasons.push(theirs.bigMoves > 0 ? `${theirs.bigMoves} visible big move${theirs.bigMoves === 1 ? '' : 's'}` : 'no visible big moves yet');
  if (theirs.mistakes > 0) reasons.push(`${theirs.mistakes.toFixed(theirs.mistakes % 1 ? 1 : 0)} public mistake${theirs.mistakes === 1 ? '' : 's'} weakened the résumé`);
  if (theirs.wins || theirs.bombs) reasons.push(`challenge record: ${theirs.wins} win${theirs.wins === 1 ? '' : 's'}, ${theirs.bombs} poor showing${theirs.bombs === 1 ? '' : 's'}`);
  if (theirs.strongSupport >= 0.45 || theirs.socialStanding >= 0.68) warnings.push('their social or jury support makes this a risky read');
  if (theirs.strategyStanding >= 0.65) warnings.push('their demonstrated strategic résumé is stronger than a typical goat');
  if (!usable) warnings.push('the relationship is too hostile to make them a dependable endgame passenger');
  return { candidate, beatability, confidence, usable, plannerEquity:mine.equity,
    candidateEquity:theirs.equity, reasons, warnings, evidence:theirs };
}

function bestGoatRead(planner, pool, blocked = new Set()) {
  return pool.filter(n => n !== planner && !blocked.has(n)).map(n => evaluateEndgameBeatability(planner, n))
    .filter(r => r?.usable && r.confidence >= 0.28)
    .sort((a, b) => b.beatability - a.beatability || b.confidence - a.confidence)[0] || null;
}

function qualifiesAsGoat(read) { return !!read && read.usable && read.confidence >= 0.28 && read.beatability >= 6; }
function goatOrigin(read) {
  if (!read) return '';
  return `${read.beatability.toFixed(1)}/10 FTC beatability read at ${Math.round(read.confidence * 100)}% confidence: ${read.reasons.slice(0, 3).join('; ')}`;
}

function logChange(plan, ep, field, from, to, reason) {
  plan.history.push({ ep, field, from, to, reason });
  if (plan.history.length > 20) plan.history.splice(0, plan.history.length - 20);
  plan.lastRevisedEp = ep;
}

// ── formation: seed a first plan from the current social landscape ──
export function formIntentions(name, ep = null) {
  const e = ep ?? curEp();
  const others = planningCircle(name);
  if (others.length < 1) return null;
  const byTrust = [...others].sort((a, b) => trustOf(name, b) - trustOf(name, a));
  const byThreat = [...others].sort((a, b) => threatProxy(b) - threatProxy(a));
  const trusted = byTrust.filter(n => trustOf(name, n) > 0);

  const skill = planSkill(name);
  const planStyle = skill >= 7.5 ? 'endgame-architect' : skill >= 5 ? 'structured' : 'reactive';
  // A private preference is not a pact. finalThree contains only partners from
  // an actual, active side-deal event; preferredCore is who this player would
  // LIKE to keep close without pretending a promise was made.
  const dealPartners = confirmedPartners(name).filter(n => others.includes(n));
  const finalThree = [name, ...dealPartners.slice(0, 2)];
  const preferredCore = byTrust.slice(0, gs.isMerged ? (skill >= 5 ? 2 : 1) : 1);
  const backupAllies = byTrust.filter(n => !preferredCore.includes(n) && !dealPartners.includes(n)).slice(0, skill >= 7 ? 3 : 2);
  // A goat is an evidence-backed FTC read, not the person with the lowest stats.
  const goatRead = gs.isMerged && skill >= 5.5 ? bestGoatRead(name, others) : null;
  const goat = qualifiesAsGoat(goatRead) ? goatRead.candidate : null;
  // shield: a strong player you'd keep around to draw votes (prefer one you don't hate)
  const shield = (gs.isMerged ? skill >= 6.5 : skill >= 7.5) ? (byThreat.find(n => trustOf(name, n) > -2) || byThreat[0]) : null;
  // long-term targets: biggest threats you don't trust
  const targets = byThreat.filter(n => trustOf(name, n) <= 0 && n !== shield).slice(0, gs.isMerged && skill >= 7 ? 2 : 1);
  const revenge = others.filter(n => resentOf(name, n) >= 3);
  revenge.forEach(r => { const idx = finalThree.indexOf(r); if (idx > 0) finalThree.splice(idx, 1); });
  const juryPlan = gs.isMerged && skill >= 6 ? trusted.slice(0, 3) : [];
  // conditions to betray: allies you respect but don't fully trust
  const betrayalConditions = skill >= 6 ? finalThree.slice(1)
    .filter(n => respectOf(name, n) >= 2 && trustOf(name, n) < 3)
    .map(ally => ({ ally, condition: 'if the numbers turn or they move on me' })) : [];

  const plan = { owner:name, stage:gs.isMerged ? 'endgame' : 'survival', mergeExpanded:!!gs.isMerged,
    finalThree, preferredCore, shield: shield || null, goat: goat || null,
    goatAssessment:goat ? goatRead : null, backupAllies, targets, revenge,
    revengeSince:{}, juryPlan, advantagePlan: null, betrayalConditions, planStyle,
    confidence:Math.max(0.2, Math.min(0.95, skill / 10)), formedEp: e, lastRevisedEp: e, lastTickEp:null,
    origins:{
      preferredCore:Object.fromEntries(preferredCore.map(n => [n, `highest current trust in ${gs.isMerged ? 'the merged cast' : 'their tribe'}`])),
      backupAllies:Object.fromEntries(backupAllies.map(n => [n, 'trusted fallback if the preferred structure fails'])),
      targets:Object.fromEntries(targets.map(n => [n, 'dangerous player they do not trust'])),
      revenge:Object.fromEntries(revenge.map(n => [n, 'existing resentment crossed the revenge threshold'])),
      finalThree:Object.fromEntries(dealPartners.slice(0, 2).map(n => [n, 'confirmed by an active deal event'])),
      goat:goat ? { [goat]:goatOrigin(goatRead) } : {},
    }, history: [] };
  revenge.forEach(target => { plan.revengeSince[target] = e; });
  store()[name] = plan;
  return plan;
}

export function getIntentions(name) { return store()[name] || null; }
export function allIntentions() { return store(); }
export function ensureIntentions(name, ep = null) { return store()[name] || formIntentions(name, ep); }
export function removeIntentionsFor(name) { delete store()[name]; Object.values(store()).forEach(p => _scrub(p, name)); }
export function resetIntentions() { gs.intentions = {}; }

export function prepareIntentionsForVote(ep = null) {
  const e = ep?.num ?? curEp();
  const act = active();
  Object.keys(store()).forEach(n => { if (!act.includes(n)) removeIntentionsFor(n); });
  act.forEach(n => ensureIntentions(n, e));
  const snapshot = JSON.parse(JSON.stringify(store()));
  if (ep && !ep.intentionsPreVoteSnapshot) ep.intentionsPreVoteSnapshot = snapshot;
  return snapshot;
}

function _scrub(plan, gone) {
  ['finalThree', 'preferredCore', 'backupAllies', 'targets', 'revenge'].forEach(f => { plan[f] = (plan[f] || []).filter(n => n !== gone); });
  if (plan.shield === gone) plan.shield = null;
  if (plan.goat === gone) plan.goat = null;
  if (plan.goatAssessment?.candidate === gone) plan.goatAssessment = null;
  plan.betrayalConditions = (plan.betrayalConditions || []).filter(b => b.ally !== gone);
  if (plan.revengeSince) delete plan.revengeSince[gone];
}

// ── evolution: persist by default, mutate ONLY on believable triggers ──
export function evolveIntentions(name, ep = null) {
  const e = ep ?? curEp();
  const plan = store()[name];
  if (!plan) return null;
  const act = new Set(active());
  const alive = n => act.has(n);
  if (plan.lastTickEp === e) return plan;
  plan.lastTickEp = e;
  plan.revengeSince = plan.revengeSince || {};
  plan.origins = plan.origins || {};

  // Merge expands the field of view, but not everybody suddenly becomes an
  // endgame architect. Reactive players test one relationship; structured and
  // elite planners add more layers. Confirmed deals still come only from events.
  if (gs.isMerged && !plan.mergeExpanded) {
    const pool = planningCircle(name);
    const ranked = [...pool].sort((a, b) => trustOf(name, b) - trustOf(name, a));
    const skill = planSkill(name);
    const wanted = skill >= 5 ? 2 : 1;
    const before = [...(plan.preferredCore || [])];
    plan.preferredCore = [...new Set([...before.filter(n => pool.includes(n)), ...ranked])].slice(0, wanted);
    plan.preferredCore.forEach(n => { plan.origins.preferredCore = plan.origins.preferredCore || {}; plan.origins.preferredCore[n] ||= 'reassessed as a useful relationship after the tribes merged'; });
    plan.stage = skill >= 5 ? 'endgame' : 'adaptation';
    plan.mergeExpanded = true;
    if (skill >= 5.5 && !plan.goat) {
      const read = bestGoatRead(name, pool);
      if (qualifiesAsGoat(read)) {
        plan.goat = read.candidate; plan.goatAssessment = read;
        plan.origins.goat = { [read.candidate]:goatOrigin(read) };
      }
    }
    if (skill >= 6.5 && !plan.shield) plan.shield = [...pool].sort((a,b) => threatProxy(b)-threatProxy(a)).find(n => trustOf(name,n)>-2) || null;
    logChange(plan, e, 'stage', 'survival', plan.stage, `the merge opened the whole cast — expanded a tribe-survival read into a ${plan.stage} plan`);
  }

  // An actual endgame deal ending creates evidence. It becomes a strategic
  // target, but only becomes personal revenge when resentment is high enough.
  (gs.sideDeals || []).filter(d => !d.active && (d.players || []).includes(name) && d.brokenEp).forEach(d => {
    const other = d.players.find(n => n !== name);
    const key = `${d.madeEp}:${d.brokenEp}:${(d.players || []).join('|')}`;
    plan.processedDealBreaks = plan.processedDealBreaks || [];
    if (plan.processedDealBreaks.includes(key)) return;
    plan.processedDealBreaks.push(key);
    if (!other || d.brokenBy === name) return;
    if (!(plan.targets || []).includes(other)) plan.targets.push(other);
    plan.origins.targets = plan.origins.targets || {};
    plan.origins.targets[other] = `their ${d.type === 'f3' ? 'Final Three' : 'Final Two'} deal ended because ${d.breakReason || 'the promise stopped being credible'}`;
    if (resentOf(name, other) >= 2.5 && !(plan.revenge || []).includes(other)) {
      plan.revenge.push(other); plan.revengeSince[other] = e;
      plan.origins.revenge = plan.origins.revenge || {};
      plan.origins.revenge[other] = `endgame promise was broken; resentment reached ${resentOf(name, other).toFixed(1)}`;
    }
    logChange(plan, e, 'dealBreak', other, d.breakReason || 'deal ended',
      `${other} broke their endgame agreement — now ${plan.revenge.includes(other) ? 'personal revenge and a target' : 'a strategic target, but not automatically revenge'}`);
  });

  // Synchronize explicit endgame promises from actual deal events. Preferences
  // never enter this field by themselves.
  const dealPartners = confirmedPartners(name);
  const nextConfirmed = [name, ...dealPartners.slice(0, 2)];
  const oldConfirmed = plan.finalThree || [name];
  if (JSON.stringify(nextConfirmed) !== JSON.stringify(oldConfirmed)) {
    const added = nextConfirmed.filter(n => !oldConfirmed.includes(n));
    const removed = oldConfirmed.filter(n => n !== name && !nextConfirmed.includes(n));
    added.forEach(n => { plan.origins.finalThree = plan.origins.finalThree || {}; plan.origins.finalThree[n] = 'confirmed by an active Final 2/Final 3 deal event'; });
    removed.forEach(n => { if (plan.origins.finalThree) delete plan.origins.finalThree[n]; });
    logChange(plan, e, 'finalThree', oldConfirmed, nextConfirmed,
      added.length ? `a real endgame deal was made with ${added.join(' & ')}` : `the endgame deal with ${removed.join(' & ')} ended`);
    plan.finalThree = nextConfirmed;
  }

  // A grudge persists, but is not immortal. Time plus repaired trust/low
  // resentment can make someone strategically usable again.
  (plan.revenge || []).slice().forEach(other => {
    const age = e - (plan.revengeSince[other] ?? e);
    if (age >= 2 && resentOf(name, other) <= 1.25 && trustOf(name, other) >= 1) {
      plan.revenge = plan.revenge.filter(n => n !== other);
      plan.targets = (plan.targets || []).filter(n => n !== other);
      delete plan.revengeSince[other];
      logChange(plan, e, 'revenge', other, null, `${other} repaired enough trust that revenge is no longer the plan`);
    }
  });

  // 1. prune eliminated people from every list
  ['targets', 'revenge', 'backupAllies'].forEach(f => { plan[f] = (plan[f] || []).filter(alive); });

  // 2. prune confirmed deal partners and private preferred core separately.
  plan.finalThree = [...new Set((plan.finalThree || []).filter(n => n === name || alive(n)))];
  plan.preferredCore = [...new Set((plan.preferredCore || []).filter(alive))];

  // 3. shield replacement and evidence-based FTC reassessment. A social player
  // can cease being a goat without leaving; switch only on a meaningful margin
  // so plans remain persistent rather than oscillating every episode.
  if (plan.shield && !alive(plan.shield)) {
    const blocked = new Set([...(plan.targets || []), ...(plan.revenge || [])]);
    const ns = active().filter(n => n !== name && !blocked.has(n)).sort((a, b) => threatProxy(b) - threatProxy(a)).find(n => trustOf(name, n) > -2) || null;
    logChange(plan, e, 'shield', plan.shield, ns, `${plan.shield} is gone — needs a new shield`);
    plan.shield = ns;
  }
  if (gs.isMerged && planSkill(name) >= 5.5) {
    const blocked = new Set([...(plan.targets || []), ...(plan.revenge || [])]);
    const best = bestGoatRead(name, active(), blocked);
    const current = plan.goat && alive(plan.goat) ? evaluateEndgameBeatability(name, plan.goat) : null;
    const old = plan.goat;
    let next = old;
    if (!current || !current.usable || current.beatability < 5.2) next = qualifiesAsGoat(best) ? best.candidate : null;
    else if (qualifiesAsGoat(best) && best.candidate !== old && best.beatability >= current.beatability + 1.5) next = best.candidate;
    if (next !== old) {
      const nextRead = next ? (best?.candidate === next ? best : evaluateEndgameBeatability(name, next)) : null;
      const reason = old && !alive(old) ? `${old} is gone; ${next ? `${next} now has the clearest beatable FTC résumé` : 'there is no credible replacement'}`
        : !old ? `${next} is the first candidate with enough evidence to support a beatable FTC read`
        : current?.warnings?.length ? `${old} no longer looks safely beatable: ${current.warnings[0]}`
        : `${next} now looks meaningfully easier to beat at FTC than ${old}`;
      logChange(plan, e, 'goat', old, next, reason);
      plan.goat = next; plan.goatAssessment = nextRead;
      plan.origins.goat = next ? { [next]:goatOrigin(nextRead) } : {};
    } else if (current) {
      plan.goatAssessment = current;
      plan.origins.goat = { [old]:goatOrigin(current) };
    }
  }

  // 4. a crossed line: high resentment toward an ally becomes a revenge/target (believable pivot)
  active().forEach(other => {
    if (other === name) return;
    if (resentOf(name, other) >= 4 && !(plan.revenge || []).includes(other)) {
      const liveDeal = liveDeals(name).some(d => (d.players || []).includes(other));
      if (liveDeal) {
        plan.dealStrain = plan.dealStrain || {};
        plan.dealStrain[other] = `resentment reached ${resentOf(name, other).toFixed(1)}, but the promise has not been ended in an event yet`;
        return;
      }
      plan.revenge.push(other);
      plan.revengeSince[other] = e;
      if (!plan.targets.includes(other)) plan.targets.push(other);
      plan.origins.revenge = plan.origins.revenge || {};
      plan.origins.targets = plan.origins.targets || {};
      plan.origins.revenge[other] = `resentment reached ${resentOf(name, other).toFixed(1)} after a crossed line or betrayal`;
      plan.origins.targets[other] = 'revenge made removing them part of the strategic plan';
      const wasF3 = plan.finalThree.includes(other);
      plan.finalThree = plan.finalThree.filter(n => n !== other);
      logChange(plan, e, 'revenge', null, other, `${other} crossed me — now a revenge target${wasF3 ? ' (out of my final three)' : ''}`);
    }
  });

  // 5. advantage plan tracks whether they actually hold one
  const hasAdv = (gs.advantages || []).some(a => a.holder === name && !a.used && !a.fake);
  const desiredAdvPlan = !hasAdv ? null
    : active().length <= 6 ? 'play-if-threatened'
    : planSkill(name) >= 7 && (plan.finalThree || []).length > 1 ? 'protect-endgame' : 'hold';
  if (hasAdv && plan.advantagePlan !== desiredAdvPlan) {
    logChange(plan, e, 'advantagePlan', plan.advantagePlan, desiredAdvPlan,
      desiredAdvPlan === 'play-if-threatened' ? 'the endgame is close — preserving the advantage is no longer worth going home with it'
      : desiredAdvPlan === 'protect-endgame' ? 'plans to keep the advantage available for the endgame structure'
      : 'found an advantage — sitting on it for now');
    plan.advantagePlan = desiredAdvPlan;
  }
  else if (!hasAdv && plan.advantagePlan && plan.advantagePlan !== 'gift') { logChange(plan, e, 'advantagePlan', plan.advantagePlan, null, 'no longer holds an advantage'); plan.advantagePlan = null; }

  return plan;
}

// Voter-specific intent. This never creates numbers or a coalition; it only
// changes how attractive an already available ballot is to this contestant.
export function intentionBallotMod(voter, target) {
  const p = store()[voter];
  if (!p || !target) return 0;
  let mod = 0;
  if ((p.revenge || []).includes(target)) mod += 1.5;
  else if ((p.targets || []).includes(target)) mod += 0.8;
  if ((p.finalThree || []).includes(target)) mod -= 1.3;
  if (p.shield === target) mod -= 0.9;
  if (p.goat === target) mod -= 1.1;
  if ((p.juryPlan || []).includes(target)) mod -= 0.25;
  const stageScale = p.stage === 'survival' ? 0.55 : p.stage === 'adaptation' ? 0.75 : 1;
  return mod * (p.confidence ?? 0.7) * stageScale;
}

export function intendsToProtect(voter, target) {
  const p = store()[voter];
  return !!p && ((p.finalThree || []).includes(target) || p.shield === target || p.goat === target);
}

export function betrayalConditionActive(voter, ally, { targetedByAlly = false, coalitionReady = false } = {}) {
  const p = store()[voter];
  if (!p || !(p.betrayalConditions || []).some(c => c.ally === ally)) return false;
  return targetedByAlly || (coalitionReady && trustOf(voter, ally) < 2);
}

export function assessBallotAgainstPlan(voter, target, reason = '') {
  const p = store()[voter];
  if (!p || !target) return null;
  const role = (p.finalThree || []).includes(target) ? 'final-three partner'
    : p.goat === target ? 'intended endgame goat'
    : p.shield === target ? 'preferred shield'
    : (p.preferredCore || []).includes(target) ? 'private endgame preference'
    : (p.juryPlan || []).includes(target) ? 'wanted jury relationship' : null;
  if (!role) return null;
  const pactBroken = role === 'final-three partner';
  return {
    role,
    pactBroken,
    classification:pactBroken ? 'pact-break' : 'plan-revision',
    label:pactBroken ? 'BROKE ENDGAME PACT' : 'ENDGAME PLAN REVISION',
    explanation:pactBroken
      ? `${voter} voted against confirmed ${role} ${target}; this ballot ends their actual endgame agreement`
      : `${voter} abandoned the private ${role} plan for ${target}; no pact was broken, but their intended route to the end changed`,
  };
}

function applyBallotPlanConsequences(ep) {
  (ep?.votingLog || []).forEach(entry => {
    const change = entry.planBreak;
    const p = store()[entry.voter];
    if (!change || !p) return;
    const target = entry.voted;
    if (change.role === 'final-three partner') {
      p.finalThree = (p.finalThree || []).filter(n => n !== target);
      const deal = (gs.sideDeals || []).find(d => d.active && (d.players || []).includes(entry.voter) && d.players.includes(target));
      if (deal) {
        deal.active = false; deal.brokenEp = ep.num; deal.brokenBy = entry.voter;
        deal.brokenAgainst = target; deal.breakReason = 'voted against endgame partner';
      }
    }
    if (change.role === 'preferred shield' && p.shield === target) p.shield = null;
    if (change.role === 'intended endgame goat' && p.goat === target) p.goat = null;
    if (change.role === 'private endgame preference') p.preferredCore = (p.preferredCore || []).filter(n => n !== target);
    if (change.role === 'wanted jury relationship') p.juryPlan = (p.juryPlan || []).filter(n => n !== target);
    if (!(p.targets || []).includes(target)) p.targets.push(target);
    logChange(p, ep.num, 'ballotPlan', change.role, target, change.explanation);
  });
}

// once-per-episode entry point (called from episode.js after the vote settles).
// Endgame planning begins at the merge; forms plans that don't exist yet,
// evolves the rest, and clears anyone who's left.
export function tickIntentions(ep = null) {
  const e = ep?.num ?? curEp();
  const act = active();
  Object.keys(store()).forEach(n => { if (!act.includes(n)) removeIntentionsFor(n); });
  applyBallotPlanConsequences(ep);
  act.forEach(n => { ensureIntentions(n, e); evolveIntentions(n, e); });
  if (ep) ep.intentionsPostVoteSnapshot = JSON.parse(JSON.stringify(store()));
}

// ── human-readable hints for the VP / text backlog ──
export function describeIntentions(name) { return describeIntentionsPlan(store()[name], name); }

// Same hints but from a plan object directly (works on a per-episode snapshot).
export function describeIntentionsPlan(p, name) {
  if (!p) return [];
  const out = [];
  const f3 = (p.finalThree || []).filter(n => n !== name);
  const preferred = (p.preferredCore || []).filter(n => n !== name && !f3.includes(n));
  if (f3.length) out.push(`confirmed endgame deal with ${f3.join(' & ')} (formed through an actual interaction)`);
  if (preferred.length) out.push(`${p.stage === 'survival' ? 'currently wants to protect' : 'privately prefers to move forward with'} ${preferred.join(' & ')} — this is not a confirmed pact`);
  if (p.goat) {
    const g = p.goatAssessment;
    out.push(g
      ? `currently sees ${p.goat} as beatable at FTC (${g.beatability.toFixed(1)}/10, ${Math.round(g.confidence * 100)}% confidence) — ${g.reasons.slice(0, 2).join('; ')}${g.warnings?.length ? `. Risk: ${g.warnings[0]}` : ''}`
      : `currently sees ${p.goat} as an endgame goat (older save: no detailed assessment recorded)`);
  }
  if (p.shield) out.push(`keeping ${p.shield} around as a shield`);
  if ((p.backupAllies || []).length) out.push(`fallback option${p.backupAllies.length > 1 ? 's' : ''}: ${p.backupAllies.map(n => `${n} (${p.origins?.backupAllies?.[n] || 'trusted alternative'})`).join(', ')}`);
  if ((p.targets || []).length) out.push(`long-term target${p.targets.length > 1 ? 's' : ''}: ${p.targets.map(n => `${n} (${p.origins?.targets?.[n] || 'strategic threat or broken relationship'})`).join(', ')}`);
  if ((p.revenge || []).length) out.push(`holding a grudge against ${p.revenge.map(n => `${n} (${p.origins?.revenge?.[n] || 'personal betrayal or accumulated resentment'})`).join(', ')}`);
  if ((p.betrayalConditions || []).length) out.push(`would flip on ${p.betrayalConditions.map(b => b.ally).join(', ')} ${p.betrayalConditions[0].condition}`);
  if (p.advantagePlan) out.push(`advantage plan: ${p.advantagePlan}`);
  if (p.planStyle) out.push(`planning style: ${p.planStyle}`);
  if (p.stage) out.push(`plan stage: ${p.stage}${p.stage === 'survival' ? ' — focused on the current tribe, not a fully built endgame' : ''}`);
  return out;
}
