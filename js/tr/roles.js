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
import { recordFact, learn, believes } from '../knowledge.js';
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
  // THE AUTHOR'S PACT FIRST, when the setup screen named one. The chosen names
  // are taken in order, filtered to the cast and deduped, and capped at `want`;
  // a pact named short of `want` is topped up at random from whoever is left,
  // so a half-named pact still plays. With no chosen list this is the old
  // all-random pick, draw for draw — every headless caller that passes no
  // `chosenTraitors` (the audits, the calibration, the tests) is untouched.
  const chosen = Array.isArray(cfg.chosenTraitors) ? cfg.chosenTraitors : [];
  for (const name of chosen) {
    if (picked.length >= want) break;
    const i = pool.indexOf(name);
    if (i >= 0) picked.push(pool.splice(i, 1)[0]);
  }
  for (let i = picked.length; i < want && pool.length; i++) {
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
 * HOW OFTEN THE ROOM FOLLOWS THIS PERSON WHEN THEY SPEAK, 0..1 — and it is
 * EARNED, which is the whole reason it is not a stat.
 *
 * Influence is the obvious thing a recruiter should want and there is no
 * `influence` stat, deliberately: the nine are fixed (AGENTS.md) and a tenth
 * would be the wrong shape anyway. Sway over a Round Table is not something
 * you arrive with, it is something that either happened or did not — you put a
 * name up, and either the room wrote it down or the room ignored you. That is
 * on the record already, so it can be measured instead of assigned.
 *
 * MEASURED over 30 seasons and 378 people-seasons with two or more speeches,
 * the share of the room that landed on the name they put up: p10 0.150,
 * p50 0.295, p90 0.458, max 0.759. A person the room follows half the time and
 * a person it follows a seventh of the time are different players, and nothing
 * in their stat line says which is which.
 *
 * `n` IS RETURNED BESIDE THE SHARE because one lucky speech is not a
 * reputation. A caller wanting a reliable read should require a couple of
 * them; a caller wanting any signal at all can take what there is.
 *
 * A pure read over rounds that have already closed. No draw, no write.
 */
export function roomFollows(name, ep) {
  let n = 0, sum = 0;
  for (const r of (gs.tr?.rounds || [])) {
    if (!(r.ep < ep)) continue;
    const ballots = (r.ballots || []).filter(b => b.voted);
    if (ballots.length < 3) continue;
    const tally = {};
    for (const b of ballots) tally[b.voted] = (tally[b.voted] || 0) + 1;
    for (const a of (r.accusations || [])) {
      if (a.accuser !== name || !a.target) continue;
      n++;
      sum += (tally[a.target] || 0) / ballots.length;
    }
  }
  return { n, share: n ? sum / n : 0 };
}

/**
 * Who do the Traitors approach?
 *
 * Not simply the strongest player. The sophisticated play is somebody whose
 * banishment would hurt, who has credibility with the room — and, best of all,
 * somebody already suspicious of them, because turning them neutralises the
 * threat instead of merely removing it.
 *
 * ── THE THIRD REASON WAS IN THIS COMMENT AND NOT IN THE CODE ──────────
 *
 * "Best of all, somebody already suspicious of them" was the most interesting
 * line here and the scoring had no term for it: credibility and bond, and
 * nothing that read what the target thinks. So the one recruitment motive a
 * viewer would find satisfying — she was closing in on me, so I made her one
 * of us — could not happen, and every approach was "well-liked and friendly".
 *
 * `heat` reads the target's belief about THE RECRUITER specifically, which is
 * the version that means something: being generally suspicious of Traitors is
 * everybody, being suspicious of the person about to knock on your door is a
 * reason to knock. It is a LOOKUP and takes no draw, so a season with this in
 * it consumes the same rng stream as one without.
 *
 * ── AND IT REPORTS WHY, BECAUSE THE SCREEN HAD NOTHING TO SAY ─────────
 *
 * This returned `{recruiter, target}` — the decision and none of its reasons —
 * so js/vp-tr/recruitment.js could draw a superb corridor scene that never
 * told you why this person was standing in it. `reason` names the term that
 * actually won, as a phrase the screen can print, and `terms` carries the
 * numbers for the debug view. Both are derived from the score that was already
 * computed; nothing about the choice changed except that it can now be read.
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
    // What this person already thinks of the person about to ask.
    const b = believes(name, alignmentFactId(recruiter), ep);
    const heat = (b && b.valence !== 'false' && b.valence !== 'stale')
      ? Math.max(0, Math.min(1, b.effectiveConfidence || 0)) : 0;
    // ── WEIGHTED SO THE SITUATIONAL TERMS CAN ACTUALLY WIN ────────────
    //
    // Measured before rebalancing, per candidate: credibility mean 0.523 and
    // NEVER zero, bond mean 0.112 and zero 54% of the time, heat mean 0.214
    // and zero 29%. Credibility is a pair of stats, so everybody has one; the
    // other two are situations, and only situations make a reason worth
    // hearing. The result was that 83% of approaches scored highest on
    // credibility and the screen said "the room believes them" almost every
    // time — technically the winning term and useless as an explanation.
    //
    // So credibility is the FLOOR it always really was, and the two that
    // depend on what has actually happened between these two people carry the
    // decision when they are there. This changes who gets approached, in the
    // direction the comment above has claimed since it was written.
    // THE ROOM'S OWN VERDICT ON THEM, where there is one. Two speeches
    // minimum: one name that happened to land is luck, and calling it
    // influence on the screen would be the screen inventing a reputation.
    // Normalised against 0.5 — following half the room is the top of the
    // measured range (p90 is 0.458), so this saturates where the real ceiling
    // is rather than at an imaginary 1.0.
    const rf = roomFollows(name, ep);
    const influence = rf.n >= 2 ? Math.min(1, rf.share / 0.5) : 0;
    const terms = { credibility: credibility * 0.5, bond: bond * 1.2,
      heat: heat * 1.6, influence: influence * 1.15 };
    return { name, terms,
      score: terms.credibility + terms.bond + terms.heat + terms.influence + rng() * 0.5 };
  }).sort((a, b) => b.score - a.score);
  const won = scored[0];
  // The dominant term, and a floor under it: when nothing scored above the
  // noise the honest answer is that there was no strong reason, and saying so
  // is better than dressing up a coin flip as a plan.
  const ranked = Object.entries(won.terms).sort((a, b) => b[1] - a[1]);
  const reason = ranked[0][1] < 0.2 ? 'no-strong-reason' : ranked[0][0];
  return { recruiter, target: won.name, reason, terms: won.terms };
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
  // this mechanic has. The base is set so that SAYING YES is the common answer
  // — most people, faced with "join or you are exposed", take the cloak, and a
  // refusal is the rare, principled exception it is on the show — while loyalty
  // still pulls a devoted Faithful back to "no".
  let p = 0.55
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
  let executed = null;

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
    executed = target;
  }

  // `executed` IS A DEATH AND MUST BE REPORTED AS ONE. A refused ultimatum
  // removes somebody from the castle exactly as a murder does, and the night
  // still returns `murdered: null` — so until this field existed, that body was
  // invisible to the harness log, to any count of how many people died, and to
  // every reader downstream. A death the engine does not report is a death no
  // measurement can find. It is a SEPARATE field from `murdered` rather than
  // folded into it because the two are chosen by different machinery: a murder
  // victim comes out of formPreference (well-liked, hard to banish, which is
  // what the MURDERS THE COALITION band is measuring), an execution comes out
  // of chooseRecruit (takeable, low loyalty) and then out of a refusal. Folding
  // them together would silently redefine that band's population.
  return { accepted, mode, recruiter: from, executed };
}

function _wasAccusedLastRound(name) {
  const rounds = gs.tr?.rounds || [];
  const last = rounds[rounds.length - 1];
  if (!last) return false;
  return (last.ballots || []).some(b => b.channel === 'banishment' && b.voted === name);
}
