// ══════════════════════════════════════════════════════════════════════
// knowledge.js — Personal knowledge & information flow.
//
// Every strategic fact becomes contestant-specific: who knows it, who told
// them, whether they believe it, and whether that belief is accurate,
// exaggerated, incomplete, stale, or false. Generalizes the idol-only pattern
// in advantage-intel.js to all fact types. Rumors spread, leak, and distort;
// sharp readers (mental+intuition) resist lies, gullible ones absorb them.
//
// SELF-CONTAINED: imports only from core.js (leaf) + reads players' stats.
// No dependency on bonds.js / voting.js so it can be built in parallel with
// the relationship refactor. Decisions/VP/camp wiring live in the integration
// notes, not here.
// ══════════════════════════════════════════════════════════════════════
import { gs, players } from './core.js';
import { pitchTrust } from './relationships.js';

function store() { if (!gs.knowledge || typeof gs.knowledge !== 'object') gs.knowledge = {}; return gs.knowledge; }
function statsOf(n) { return players.find(p => p.name === n)?.stats || {}; }
function archOf(n) { return players.find(p => p.name === n)?.archetype || 'floater'; }
function curEp() { return (gs.episode || 0) + 1; }
function clamp01(v) { return Math.max(0, Math.min(1, v)); }

export function factId(type, subject, object) { return object !== null && object !== undefined ? `${type}:${subject}:${object}` : `${type}:${subject}`; }

// how many episodes a fact stays "current" before beliefs go stale
const VALIDITY = { target: 1, pitch: 2, 'bond-read': 4, idol: 99, advantage: 99, alliance: 99, betrayal: 99, throw: 99 };
// base credibility by how the belief arrived
const SOURCE_CRED = { public: 1.0, observed: 0.9, told: 0.7, deduced: 0.62, rumor: 0.45 };

// ── ground-truth facts ────────────────────────────────────────────────
export function recordFact({ type, subject, object = null, payload = null, truth = true, ep = null } = {}) {
  if (!type || !subject) return null;
  const id = factId(type, subject, object);
  const s = store();
  const existing = s[id];
  if (existing) {
    const nextEp = ep ?? curEp();
    // Targets and pitches describe the current round. Reusing the same name in
    // a later episode must not silently preserve last episode's audience.
    if (['target', 'pitch'].includes(type) && existing.createdEp !== nextEp) {
      existing.createdEp = nextEp;
      existing.beliefs = {};
    }
    if (payload != null) existing.payload = payload;
    existing.truth = truth;
    return existing;
  }
  return (s[id] = { id, type, subject, object, payload, truth, createdEp: ep ?? curEp(), beliefs: {} });
}

export function getFact(id) { return store()[id] || null; }
export function allFacts() { return Object.values(store()); }
export function forget(id) { delete store()[id]; }
export function resetKnowledge() { gs.knowledge = {}; }

// ── belief formation ───────────────────────────────────────────────────
// Does `knower` accept a claim of credibility `cred` about a fact whose ground
// truth is `truth`? Sharp readers accept strong evidence and reject weak
// rumors decisively; they also catch planted lies. Returns acceptance + how the
// belief lands (confidence + valence).
function _assess(knower, cred, truth, rng) {
  const st = statsOf(knower);
  const readSkill = clamp01(((st.mental || 5) * 0.6 + (st.intuition || 5) * 0.4) / 10);
  const acceptP = clamp01(0.1 + cred * 0.75 + readSkill * (cred - 0.55) * 0.9);
  if (rng() >= acceptP) return { accept: false };

  let valence = 'accurate';
  let confidence = clamp01(cred - 0.05 + (rng() - 0.5) * 0.1);
  if (truth === false) {
    // planted lie: sharp readers see through it, the gullible swallow it whole
    const detect = rng() < clamp01(readSkill * 0.8 + (0.4 - cred) * 0.5);
    valence = detect ? 'false' : 'accurate';
    if (detect) confidence = clamp01(confidence * 0.6);
  } else if (cred < 0.6 && rng() < 0.3 * (1 - readSkill)) {
    valence = 'exaggerated';   // a weak source blew a true fact out of proportion
  }
  return { accept: true, confidence, valence };
}

// `knower` forms/refreshes a belief about fact `id`. Filtered through the
// belief check; keeps the strongest evidence seen. `from` = the person who
// shared it (drives second-order "they know that I know").
export function learn(knower, id, { source = 'observation', sourceType = 'observed', confidence = null, ep = null, from = null, rng = Math.random } = {}) {
  const fact = store()[id];
  if (!fact || !knower) return null;
  const cred = confidence != null ? clamp01(confidence) : (SOURCE_CRED[sourceType] ?? 0.5);
  // Witnessing an action or hearing a public announcement is knowledge, not a
  // persuasion roll. Interpretation may later be wrong; occurrence is known.
  const direct = sourceType === 'public' || sourceType === 'observed';
  const res = direct
    ? { accept: true, confidence: Math.max(cred, sourceType === 'public' ? 1 : 0.9), valence: fact.truth ? 'accurate' : 'false' }
    : _assess(knower, cred, fact.truth, rng);
  if (!res.accept) return null;

  const e = ep ?? curEp();
  const belief = fact.beliefs[knower] || (fact.beliefs[knower] = { confidence: 0, source, sourceType, valence: res.valence, learnedEp: e, knowsOthersKnow: [] });
  if (res.confidence >= belief.confidence) { belief.valence = res.valence; belief.source = source; belief.sourceType = sourceType; }
  belief.confidence = Math.max(belief.confidence, res.confidence);
  belief.learnedEp = e;
  // second-order knowledge — each now knows the other knows
  if (from && fact.beliefs[from]) {
    if (!belief.knowsOthersKnow.includes(from)) belief.knowsOthersKnow.push(from);
    if (!fact.beliefs[from].knowsOthersKnow.includes(knower)) fact.beliefs[from].knowsOthersKnow.push(knower);
  }
  return belief;
}

// ── confidence over time ────────────────────────────────────────────────
export function effectiveConfidence(fact, belief, ep = null) {
  const e = ep ?? curEp();
  const age = Math.max(0, e - (belief.learnedEp ?? e));
  let eff = (belief.confidence || 0) - age * 0.08;
  const factAge = Math.max(0, e - (fact.createdEp ?? e));
  const validity = VALIDITY[fact.type] ?? 99;
  if (factAge > validity) eff -= (factAge - validity) * 0.15;   // outdated facts fade fast
  return clamp01(eff);
}

function _isStale(fact, ep) {
  const factAge = Math.max(0, (ep ?? curEp()) - (fact.createdEp ?? 0));
  return factAge > (VALIDITY[fact.type] ?? 99);
}

// ── queries ──────────────────────────────────────────────────────────────
export function believes(knower, id, ep = null) {
  const fact = store()[id]; if (!fact) return null;
  const b = fact.beliefs[knower]; if (!b) return null;
  const stale = _isStale(fact, ep);
  return {
    ...b,
    effectiveConfidence: effectiveConfidence(fact, b, ep),
    valence: stale && b.valence === 'accurate' ? 'stale' : b.valence,
    factTruth: fact.truth, type: fact.type, subject: fact.subject, object: fact.object, payload: fact.payload,
  };
}

export function knowsAbout(knower, type, subject, ep = null) { return believes(knower, factId(type, subject), ep); }

export function whoKnows(id, ep = null) {
  const fact = store()[id]; if (!fact) return [];
  return Object.keys(fact.beliefs).map(k => believes(k, id, ep)).map((b, i) => ({ knower: Object.keys(fact.beliefs)[i], ...b }));
}

// Is a knower's belief correct relative to ground truth? Correctly disbelieving
// a planted lie counts as accurate.
export function isAccurate(knower, id, ep = null) {
  const fact = store()[id]; if (!fact) return null;
  const b = believes(knower, id, ep); if (!b) return null;
  if (fact.truth === false) return b.valence === 'false';
  return (b.valence === 'accurate') && b.effectiveConfidence >= 0.4;
}

// ── propagation (rumors, leaks) ───────────────────────────────────────────
function defaultContacts(knower) {
  const active = (gs.activePlayers || players.map(p => p.name)).filter(n => n !== knower);
  const allies = new Set();
  (gs.namedAlliances || []).forEach(al => {
    if (al.members?.includes(knower)) al.members.forEach(m => { if (m !== knower && active.includes(m)) allies.add(m); });
  });
  return { allies: [...allies], others: active };
}

// how leaky/talkative a knower is per episode
function spreadRate(knower) {
  const st = statsOf(knower);
  const arch = archOf(knower);
  let r = 0.15 + (st.social || 5) / 40 + (st.boldness || 5) / 60;
  if (['social-butterfly', 'schemer', 'mastermind', 'chaos-agent'].includes(arch)) r += 0.1;
  if (['loyal-soldier', 'goat'].includes(arch)) r -= 0.05;
  const emo = gs.playerStates?.[knower]?.emotional;
  if (emo === 'paranoid' || emo === 'desperate') r += 0.12;     // stress makes people leak
  return clamp01(r);
}

// One episode of spread. Each confident knower may pass a fact to a contact who
// doesn't have it yet; the listener runs the belief check, confidence attenuates
// per hop, and observed facts become "told" while shakier ones become "rumor".
// Returns the spread events (for camp-event rendering during the integration pass).
export function propagate(ep = null, { contacts = defaultContacts, rng = Math.random, maxPerFact = 3 } = {}) {
  const e = ep ?? curEp();
  const s = store();
  const events = [];
  for (const id of Object.keys(s)) {
    const fact = s[id];
    if (_isStale(fact, e)) continue;   // nobody bothers passing around old news
    const knowers = Object.keys(fact.beliefs).filter(k => effectiveConfidence(fact, fact.beliefs[k], e) > 0.25);
    let shared = 0;
    for (const knower of knowers) {
      if (shared >= maxPerFact) break;
      if (rng() > spreadRate(knower)) continue;
      const c = contacts(knower);
      const pool = ((rng() < 0.7 ? c.allies : c.others) || []).filter(n => !fact.beliefs[n]);
      if (!pool.length) continue;
      const listener = pool[Math.floor(rng() * pool.length)];
      const src = fact.beliefs[knower];
      // A warm relationship does not guarantee belief. Directional trust in
      // this particular source controls how much credibility survives the hop.
      const trustMultiplier = 0.65 + clamp01((pitchTrust(listener, knower) + 10) / 20) * 0.45;
      const hopCred = clamp01(effectiveConfidence(fact, src, e) * 0.85 * trustMultiplier);
      const sourceType = src.sourceType === 'observed' ? 'told' : 'rumor';
      const b = learn(listener, id, { source: knower, sourceType, confidence: hopCred, ep: e, from: knower, rng });
      if (b) { shared++; events.push({ id, type: fact.type, subject: fact.subject, from: knower, to: listener, sourceType, valence: b.valence }); }
    }
  }
  return events;
}

// drop facts that are long past their validity window (targets/pitches/reads);
// permanent facts (idols, alliances, betrayals) are kept.
export function pruneStale(ep = null, { maxAge = 6 } = {}) {
  const e = ep ?? curEp();
  const s = store();
  for (const id of Object.keys(s)) {
    const fact = s[id];
    if ((VALIDITY[fact.type] ?? 99) < 90 && (e - (fact.createdEp ?? e)) > maxAge) delete s[id];
  }
}

// once-per-episode entry point (called from episode.js during integration)
export function tick(ep = null, opts = {}) {
  const e = ep ?? curEp();
  const events = propagate(e, opts);
  pruneStale(e, opts);
  return events;
}
