// ══════════════════════════════════════════════════════════════════════
// tr/roles.js — who is a Traitor, and since when
// ══════════════════════════════════════════════════════════════════════
//
// Ground truth only. What anybody BELIEVES about it lives in tr/deduction.js.
//
// The "since when" is the part that is easy to get wrong and impossible to add
// later. Recruitment changes a player's alignment mid-season, so alignment is
// not a property of a person but of a person AND a round. A Faithful recruited
// in episode 8 was genuinely Faithful in episode 3, and somebody who read them
// as Faithful then was RIGHT. Store a single boolean and every one of those
// correct early reads is retroactively scored as a mistake the moment the flip
// happens — which is both wrong and unfixable once seasons are saved.
import { gs, players } from '../core.js';
import { recordFact, learn } from '../knowledge.js';
import { pStats } from '../players.js';
import { getBond } from '../bonds.js';

/** The knowledge-layer id for what somebody is. */
export function alignmentFactId(name) { return `alignment:${name}`; }

/**
 * Pick the Traitors.
 *
 * Deliberately near-uniform. Weighting toward masterminds makes every season the
 * same season, and this format's best outcomes include a TERRIBLE Traitor — the
 * hothead who cracks in episode three, the hero who cannot lie. The engine gets
 * its drama from what a bad Traitor does under pressure, not from casting for
 * competence.
 */
export function selectTraitors(cast, cfg = {}, rng = Math.random) {
  const pool = [...cast];
  const want = Math.max(1, Math.min(Number(cfg.traitorCount) || 3, pool.length - 1));
  const picked = [];
  for (let i = 0; i < want && pool.length; i++) {
    picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return picked;
}

/**
 * Set (or change) somebody's alignment as of `ep`.
 *
 * Appends an era rather than overwriting, and records the transition so the VP
 * can show it and so a banished recruit's exit speech can know how new they were
 * — a two-night Traitor owes the others nothing, which is why the format's
 * famous betrayals come from fresh recruits.
 */
export function recordAlignment(name, isTraitor, ep, via = 'selection') {
  if (!gs.tr) return null;
  const to = isTraitor ? 'traitor' : 'faithful';
  const from = alignmentAt(name, ep - 1);
  const eras = (gs.tr.alignment[name] ||= []);
  eras.push({ truth: !!isTraitor, sinceEp: ep });
  eras.sort((a, b) => a.sinceEp - b.sinceEp);
  if (from !== to || via === 'selection') {
    gs.tr.roleHistory.push({ name, from, to, ep, via });
  }
  // The knowledge layer's ground truth tracks the CURRENT era. Anything asking
  // about an earlier one goes through truthAtLearn() instead.
  recordFact({ type: 'alignment', subject: name, truth: !!isTraitor, ep });
  return eras;
}

/** What was `name` during episode `ep`? Defaults to faithful before any era. */
export function alignmentAt(name, ep) {
  const eras = gs.tr?.alignment?.[name];
  if (!eras || !eras.length) return 'faithful';
  let cur = 'faithful';
  for (const era of eras) { if (era.sinceEp <= ep) cur = era.truth ? 'traitor' : 'faithful'; }
  return cur;
}

/** Ground truth as it stood when a belief was formed. The era rule, as a boolean. */
export function truthAtLearn(name, learnedEp) {
  return alignmentAt(name, learnedEp) === 'traitor';
}

/** Everyone currently a Traitor, among the living. */
export function livingTraitors(ep) {
  return (gs.activePlayers || []).filter(n => alignmentAt(n, ep) === 'traitor');
}

/** Everyone currently a Faithful, among the living. */
export function livingFaithfuls(ep) {
  return (gs.activePlayers || []).filter(n => alignmentAt(n, ep) === 'faithful');
}

/** Recruitment opens only once the Faithfuls have actually banished a Traitor. */
export function canRecruit(ep) {
  const banishedTraitor = (gs.tr?.rounds || []).some(r => r.banishedWasTraitor);
  return banishedTraitor && livingTraitors(ep).length > 0;
}

/**
 * Who do the Traitors approach?
 *
 * Not simply the strongest player. The sophisticated play is somebody whose
 * banishment would hurt, who has credibility with the room — and, best of all,
 * somebody already suspicious of them, because turning them neutralises the
 * threat instead of merely removing it.
 */
export function chooseRecruit(ep, rng = Math.random) {
  const traitors = livingTraitors(ep);
  const pool = livingFaithfuls(ep);
  if (!traitors.length || !pool.length) return null;
  const recruiter = traitors[Math.floor(rng() * traitors.length)];
  const scored = pool.map(name => {
    const st = pStats(name);
    const credibility = ((st.social || 5) + (st.temperament || 5)) / 20;
    const bond = Math.max(0, getBond(recruiter, name)) / 10;
    return { name, score: credibility * 0.8 + bond * 0.6 + rng() * 0.5 };
  }).sort((a, b) => b.score - a.score);
  return { recruiter, target: scored[0].name };
}

/**
 * The offer, and the flip.
 *
 * The two delivery modes differ MECHANICALLY, not in flavour. A note is
 * anonymous, so refusing it is survivable — the refuser never learned who
 * asked. An ultimatum is face to face, and refusal has to be fatal for exactly
 * one reason: they have seen your face.
 */
export function offerRecruitment(target, ep, rng = Math.random, { mode = 'note', recruiter = null } = {}) {
  const from = recruiter || chooseRecruit(ep, rng)?.recruiter;
  if (!from || !target) return { accepted: false, mode, recruiter: null };

  // The Ultimatum's fatal refusal is only justified by "they have seen your
  // face" — a fact that is only true when there is exactly one Traitor left
  // to be identified. With two or more alive, a refuser who's never met the
  // room's remaining Traitors face to face has seen nothing worth killing
  // over, so the request quietly degrades to an anonymous note rather than
  // becoming a full-strength conclave executing a refuser.
  if (mode === 'ultimatum' && livingTraitors(ep).length !== 1) mode = 'note';

  const st = pStats(target);
  const arch = players.find(p => p.name === target)?.archetype || 'floater';
  // Proportional, never a threshold. Loyalty is the spine of it: a high-loyalty
  // Faithful refuses and dies for it, which is the most characterful outcome
  // this mechanic has.
  let p = 0.30
    + ((st.boldness || 5) / 10) * 0.22
    + ((st.strategic || 5) / 10) * 0.22
    - ((st.loyalty || 5) / 10) * 0.42
    + Math.max(0, getBond(target, from)) / 10 * 0.18;
  // Position: somebody the room went after last night has far less to lose.
  if (_wasAccusedLastRound(target)) p += 0.18;
  if (['hero', 'loyal-soldier'].includes(arch)) p -= 0.15;
  if (['villain', 'schemer', 'mastermind'].includes(arch)) p += 0.15;
  // An ultimatum is not a better pitch — it is a worse alternative.
  if (mode === 'ultimatum') p += 0.25;

  const accepted = rng() < Math.max(0.02, Math.min(0.95, p));

  if (accepted) {
    recordAlignment(target, true, ep, mode === 'ultimatum' ? 'ultimatum' : 'recruitment');
    // THE THIRD AND LAST legitimate `public` alignment write in this engine.
    // They are standing in the turret; there is nothing to deduce.
    learn(target, alignmentFactId(from),
      { source: 'the turret', sourceType: 'public', ep, rng: () => 0 });
    learn(from, alignmentFactId(target),
      { source: 'the turret', sourceType: 'public', ep, rng: () => 0 });
    (gs.tr.loyaltyDebt ||= []).push({ recruiter: from, recruit: target, ep });
  } else if (mode === 'ultimatum') {
    // They have seen the face. This is why the rule exists.
    gs.activePlayers = (gs.activePlayers || []).filter(n => n !== target);
  }

  return { accepted, mode, recruiter: from };
}

function _wasAccusedLastRound(name) {
  const rounds = gs.tr?.rounds || [];
  const last = rounds[rounds.length - 1];
  if (!last) return false;
  return (last.ballots || []).some(b => b.channel === 'banishment' && b.voted === name);
}
