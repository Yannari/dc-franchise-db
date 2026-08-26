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
import { gs } from '../core.js';
import { recordFact } from '../knowledge.js';

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
