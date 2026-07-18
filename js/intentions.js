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

function store() { if (!gs.intentions || typeof gs.intentions !== 'object') gs.intentions = {}; return gs.intentions; }
function statsOf(n) { return players.find(p => p.name === n)?.stats || {}; }
function curEp() { return (gs.episode || 0) + 1; }
function active() { return (gs.activePlayers || players.map(p => p.name)); }

// self-contained proxies (no chalRecord dependency, safe during formation)
function threatProxy(n) { const s = statsOf(n); return (s.strategic || 5) * 0.4 + (s.social || 5) * 0.3 + Math.max(s.physical || 5, s.endurance || 5) * 0.2 + (s.boldness || 5) * 0.1; }
function trustOf(a, b) { const d = getRelationshipDimensions(a, b); return (d.trust || 0) * 0.6 + getBond(a, b) * 0.4; }
function respectOf(a, b) { return getRelationshipDimensions(a, b).strategicRespect || 0; }
function resentOf(a, b) { return getRelationshipDimensions(a, b).resentment || 0; }
function planSkill(name) { const s = statsOf(name); return ((s.strategic || 5) * 0.65 + (s.intuition || 5) * 0.2 + (s.social || 5) * 0.15); }

function logChange(plan, ep, field, from, to, reason) {
  plan.history.push({ ep, field, from, to, reason });
  if (plan.history.length > 20) plan.history.splice(0, plan.history.length - 20);
  plan.lastRevisedEp = ep;
}

// ── formation: seed a first plan from the current social landscape ──
export function formIntentions(name, ep = null) {
  const e = ep ?? curEp();
  const others = active().filter(n => n !== name);
  if (others.length < 2) return null;
  const byTrust = [...others].sort((a, b) => trustOf(name, b) - trustOf(name, a));
  const byThreat = [...others].sort((a, b) => threatProxy(b) - threatProxy(a));
  const trusted = byTrust.filter(n => trustOf(name, n) > 0);

  const skill = planSkill(name);
  const planStyle = skill >= 7.5 ? 'endgame-architect' : skill >= 5 ? 'structured' : 'reactive';
  const finalThree = [name, ...byTrust.slice(0, 2)];
  const backupAllies = byTrust.slice(2, skill >= 7 ? 5 : 4);
  // goat: someone beatable — decent trust but low threat
  const goat = skill >= 5.5 ? ([...others].sort((a, b) => (trustOf(name, b) - threatProxy(b)) - (trustOf(name, a) - threatProxy(a)))
    .find(n => threatProxy(n) < 5.5) || byTrust[byTrust.length - 1]) : null;
  // shield: a strong player you'd keep around to draw votes (prefer one you don't hate)
  const shield = skill >= 6.5 ? (byThreat.find(n => trustOf(name, n) > -2) || byThreat[0]) : null;
  // long-term targets: biggest threats you don't trust
  const targets = byThreat.filter(n => trustOf(name, n) <= 0 && n !== shield).slice(0, skill >= 7 ? 2 : 1);
  const revenge = others.filter(n => resentOf(name, n) >= 3);
  revenge.forEach(r => { const idx = finalThree.indexOf(r); if (idx > 0) finalThree.splice(idx, 1); });
  byTrust.filter(n => !revenge.includes(n) && !finalThree.includes(n)).forEach(n => { if (finalThree.length < 3) finalThree.push(n); });
  const juryPlan = skill >= 6 ? trusted.slice(0, 3) : [];
  // conditions to betray: allies you respect but don't fully trust
  const betrayalConditions = skill >= 6 ? finalThree.slice(1)
    .filter(n => respectOf(name, n) >= 2 && trustOf(name, n) < 3)
    .map(ally => ({ ally, condition: 'if the numbers turn or they move on me' })) : [];

  const plan = { finalThree, shield: shield || null, goat: goat || null, backupAllies, targets, revenge, revengeSince:{}, juryPlan, advantagePlan: null, betrayalConditions, planStyle, confidence:Math.max(0.2, Math.min(0.95, skill / 10)), formedEp: e, lastRevisedEp: e, lastTickEp:null, history: [] };
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
  if (!gs.isMerged) return {};
  const e = ep?.num ?? curEp();
  const act = active();
  Object.keys(store()).forEach(n => { if (!act.includes(n)) removeIntentionsFor(n); });
  act.forEach(n => ensureIntentions(n, e));
  const snapshot = JSON.parse(JSON.stringify(store()));
  if (ep && !ep.intentionsPreVoteSnapshot) ep.intentionsPreVoteSnapshot = snapshot;
  return snapshot;
}

function _scrub(plan, gone) {
  ['finalThree', 'backupAllies', 'targets', 'revenge'].forEach(f => { plan[f] = (plan[f] || []).filter(n => n !== gone); });
  if (plan.shield === gone) plan.shield = null;
  if (plan.goat === gone) plan.goat = null;
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

  // 2. finalThree: keep self + alive; a lost slot is a believable trigger to promote a backup
  const f3 = [...new Set((plan.finalThree || []).filter(n => n === name || alive(n)))];
  if (f3.length < 3) {
    const forbidden = new Set([...(plan.revenge || []), ...(plan.targets || [])]);
    const fill = [...new Set([...(plan.backupAllies || []), ...active().filter(n => n !== name)])]
      .filter(n => alive(n) && !f3.includes(n) && !forbidden.has(n))
      .sort((a, b) => trustOf(name, b) - trustOf(name, a));
    while (f3.length < 3 && fill.length) {
      const pick = fill.shift();
      f3.push(pick);
      logChange(plan, e, 'finalThree', null, pick, `a final-three slot opened up — pulling in ${pick}`);
    }
  }
  plan.finalThree = f3;

  // 3. shield / goat replaced when they leave
  if (plan.shield && !alive(plan.shield)) {
    const blocked = new Set([...(plan.targets || []), ...(plan.revenge || [])]);
    const ns = active().filter(n => n !== name && !blocked.has(n)).sort((a, b) => threatProxy(b) - threatProxy(a)).find(n => trustOf(name, n) > -2) || null;
    logChange(plan, e, 'shield', plan.shield, ns, `${plan.shield} is gone — needs a new shield`);
    plan.shield = ns;
  }
  if (plan.goat && !alive(plan.goat)) {
    const blocked = new Set([...(plan.targets || []), ...(plan.revenge || [])]);
    const ng = active().filter(n => n !== name && !blocked.has(n)).sort((a, b) => threatProxy(a) - threatProxy(b))[0] || null;
    logChange(plan, e, 'goat', plan.goat, ng, `${plan.goat} is gone — needs a new goat`);
    plan.goat = ng;
  }

  // 4. a crossed line: high resentment toward an ally becomes a revenge/target (believable pivot)
  active().forEach(other => {
    if (other === name) return;
    if (resentOf(name, other) >= 4 && !(plan.revenge || []).includes(other)) {
      plan.revenge.push(other);
      plan.revengeSince[other] = e;
      if (!plan.targets.includes(other)) plan.targets.push(other);
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
  return mod * (p.confidence ?? 0.7);
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

// once-per-episode entry point (called from episode.js after the vote settles).
// Endgame planning begins at the merge; forms plans that don't exist yet,
// evolves the rest, and clears anyone who's left.
export function tickIntentions(ep = null) {
  if (!gs.isMerged) return;
  const e = ep?.num ?? curEp();
  const act = active();
  Object.keys(store()).forEach(n => { if (!act.includes(n)) removeIntentionsFor(n); });
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
  if (f3.length) out.push(`playing for a final three with ${f3.join(' & ')}`);
  if (p.goat) out.push(`wants ${p.goat} as an endgame goat`);
  if (p.shield) out.push(`keeping ${p.shield} around as a shield`);
  if ((p.targets || []).length) out.push(`long-term target${p.targets.length > 1 ? 's' : ''}: ${p.targets.join(', ')}`);
  if ((p.revenge || []).length) out.push(`holding a grudge against ${p.revenge.join(', ')}`);
  if ((p.betrayalConditions || []).length) out.push(`would flip on ${p.betrayalConditions.map(b => b.ally).join(', ')} ${p.betrayalConditions[0].condition}`);
  if (p.advantagePlan) out.push(`advantage plan: ${p.advantagePlan}`);
  if (p.planStyle) out.push(`planning style: ${p.planStyle}`);
  return out;
}
