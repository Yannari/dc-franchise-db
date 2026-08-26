// ══════════════════════════════════════════════════════════════════════
// tr/channel-audit.js — the gate a belief-writing event has to get through
// ══════════════════════════════════════════════════════════════════════
//
// THE GOVERNING RULE: bonds, state and residue are free; beliefs are earned.
//
// Every event that forms a belief about an alignment is a new evidence channel
// pointed at the one question this format asks. Three defective ones have
// already shipped in this project, and NOT ONE of them was found by reading the
// code that produced it:
//
//   1. `_assess()`'s ground-truth valence — sanctioned design (spec 4.2), but
//      it was quietly supplying most of a headline detection number.
//   2. `murderCost.blames` as an evidence source — it read GROUND TRUTH and
//      named a real Traitor 84 times out of 84, against a 20.5% base.
//   3. `clashTraced` — an ANTI-SIGNAL. 0.87x at emission, 0.57x on the beliefs
//      that survived to move a board. It pointed the room at innocents, because
//      formPreference PENALISES murdering somebody you visibly clashed with, so
//      a clash-traced victim's enemies are unlikely to be Traitors by
//      construction. Deleted.
//
// All three were caught by MEASUREMENT. This file is that measurement, made
// re-runnable, so that the ~150 castle events arriving in Tasks 5-6 can be
// judged one at a time instead of in aggregate — the calibration currently has
// 0.24pp of worst-block headroom on late lift, and if that band moves under a
// pool of 150 events, nothing without this instrument will say which event
// moved it.
//
// ── LESSON 8, WHICH IS THE WHOLE DESIGN: MEASURE AGAINST A CONTROL ──
//
// `pushedThenDied` reads 1.45x against a flat season-wide base and ~0.01x
// against the uninformative statement "you voted for somebody who turned out to
// be a Faithful". Both numbers are arithmetically correct; only the second one
// is about the channel. Two separate errors are folded into the first:
//
//   THE BASE DRIFTS. The murder only ever removes Faithfuls, so Traitor density
//   climbs monotonically all season. A late-arriving channel measured against a
//   season-wide average is credited for that drift as if it had deduced it. So
//   `base` here is computed PER EMISSION, from the living population at the
//   round the belief was formed, and averaged. Never season-wide.
//
//   ENRICHMENT IS NOT INFERENCE. chooseBanishmentVote legitimately stops a
//   Traitor naming the pact, so Traitors' ballots are restricted to Faithfuls;
//   formPreference draws the victim from livingFaithfuls. Anybody who voted for
//   the victim therefore inherits an enrichment derived from ground truth that
//   has nothing whatever to do with the murder. A control drawn the same way
//   from an uninformative rule carries the identical enrichment, so subtracting
//   it removes exactly the part that was never information.
//
// `edge = ratio - controlRatio` is the number that decides. `ratio` alone is
// decoration, and the three channels above all had a flattering one.
//
// ── HOW IT READS THE ENGINE, AND WHY IT DOES NOT PATCH IT ──
//
// An instrument must not change what it measures. Nothing here touches
// js/tr/*.js: a channel is expressed as a SELECTION RULE over the season record
// that playTraitorsSeason() already returns (`rounds`, `log`, `roleHistory`,
// `blockedMurders`), plus a read-only snapshot of the knowledge store taken
// after the season has finished.
//
// The cost of that choice is transcription drift: the rule this file
// reconstructs for a shipped channel could silently stop matching the rule
// deduction.js runs. tests/tr-channel-audit.test.js closes that with a fidelity
// check — every belief the real channel actually left in the knowledge store
// must appear in the reconstruction — and any transcribed channel added here
// must extend it.
import { gs } from '../core.js';
import { playTraitorsSeason, rngFor } from './headless.js';

// ── the season record, indexed for measurement ────────────────────────

/**
 * Who was alive at the start of episode `ep`.
 *
 * Both evidence sources run BEFORE that episode's Round Table, so the room they
 * emit into is the cast minus everybody who left in an EARLIER episode.
 * Somebody banished or murdered during episode e was still in the castle when
 * episode e's evidence ran, which is why the comparison is `>= ep` and not `>`.
 *
 * All three exits count. `executed` — a refused ultimatum — is a body exactly
 * as a murder is, and roles.js's own comment says so; leaving it out would keep
 * a dead player in every later round's denominator.
 */
function _livingIndex(cast, log) {
  const leftAt = new Map();
  for (const entry of log) {
    for (const name of [entry.banished, entry.murdered, entry.executed]) {
      if (name && !leftAt.has(name)) leftAt.set(name, entry.ep);
    }
  }
  return ep => cast.filter(n => !leftAt.has(n) || leftAt.get(n) >= ep);
}

/**
 * Was `name` a Traitor during episode `ep`?
 *
 * Built from `roleHistory`, which records the opening selection for every
 * player AND every recruitment flip — so this is the era model of roles.js
 * reconstructed from the returned record rather than from live `gs`, which the
 * next season overwrites.
 *
 * The era matters and cannot be added later: a Faithful recruited in episode 8
 * was genuinely Faithful in episode 3, and an emission that named them in
 * episode 3 was WRONG. Scoring every emission against a single end-of-season
 * boolean would retroactively credit the audit for reads nobody made.
 */
function _alignmentIndex(roleHistory) {
  const byName = new Map();
  for (const h of roleHistory) {
    if (!byName.has(h.name)) byName.set(h.name, []);
    byName.get(h.name).push(h);
  }
  for (const arr of byName.values()) arr.sort((a, b) => a.ep - b.ep);
  return (name, ep) => {
    const arr = byName.get(name);
    if (!arr) return false;
    let cur = false;
    for (const h of arr) if (h.ep <= ep) cur = h.to === 'traitor';
    return cur;
  };
}

/**
 * Every alignment belief left standing at the end of the season, with the
 * `source` string that wrote it.
 *
 * READ-ONLY, and taken after the season has finished playing, so it cannot
 * perturb a single draw. It is what the fidelity check compares the
 * reconstruction against. Note it is SURVIVING beliefs, not emissions —
 * learn() keeps only the strongest evidence per (knower, subject), so a
 * channel's emission can be overwritten by a louder one. That is precisely why
 * the audit measures emissions by reconstruction and uses this only to prove
 * the reconstruction is faithful.
 */
function _beliefSnapshot() {
  const out = [];
  for (const fact of Object.values(gs.knowledge || {})) {
    if (fact.type !== 'alignment') continue;
    for (const [knower, b] of Object.entries(fact.beliefs || {})) {
      out.push({ knower, subject: fact.subject, source: b.source, learnedEp: b.learnedEp });
    }
  }
  return out;
}

/**
 * Play one season and index it for measurement.
 *
 * `setPlayers()` is the caller's job — pStats() reads the module-level roster
 * and a cast whose stats are all defaults is not this engine.
 */
export function seasonForAudit({ cast, traitorCount = 3, seed = 1 } = {}) {
  const rec = playTraitorsSeason({ cast, traitorCount, seed });
  const S = {
    cast: [...cast],
    seed,
    log: rec.log,
    rounds: rec.rounds,
    blockedMurders: rec.blockedMurders,
    playedEps: new Set(rec.log.map(e => e.ep)),
    livingAt: _livingIndex(cast, rec.log),
    isTraitorAt: _alignmentIndex(rec.roleHistory),
    beliefs: _beliefSnapshot(),
  };
  // The audit's OWN random stream, hashed, and derived from the season seed by
  // a multiplier none of the engine's streams use (the game uses the bare seed,
  // bonds use 2654435761, the castle layer 40503). Lesson 9: an unhashed LCG's
  // first draw barely moves between seeds — that bug has invalidated a whole
  // calibration once and a test written after the fix once. rngFor() hashes.
  // Nothing here may ever draw from the game's stream: a control that consumed
  // game draws would change the season it is measuring.
  S.rng = rngFor((seed * 2246822519) >>> 0 || 17);
  S.emissions = source => _channel(source)(S, S.rng);
  return S;
}

// ── channels: a selection rule over (subject, ep) ─────────────────────
//
// A channel answers ONE question: which (observer, subject) indictments would
// this event emit, and in which round? The observer does not appear in the
// statistic — every observer in the room receives the same indictment about the
// same subject, so counting them would only multiply n by room size and make a
// six-player round table look like weaker evidence than a sixteen-player one.
// The emission unit is the indictment: one subject, one round.

const CHANNELS = {
  /**
   * THE REAL, SHIPPED CHANNEL. Transcribed from murderEvidence() in
   * js/tr/deduction.js — "you wanted them gone at the table, and that night
   * they died", priced at M.pushedThenDied = 0.62 (the alignment credibility
   * ceiling; see the sweep in js/tr/deduction.js). The price does not enter
   * this audit — measureChannel scores WHO a channel indicts, not how loudly —
   * so a reprice moves nothing here, and that independence is the point: the
   * 1.21x-against-a-1.20x-control below is a property of the channel's
   * selection rule at any volume.
   *
   * Three details are load-bearing and all three are in the original:
   *   - the ATTEMPT, not the death (`murderTarget ?? murdered`), suppressed on
   *     a blocked night by `!blocked` rather than by the target being null;
   *   - pushers are accusers AND banishment voters, unioned, so somebody who
   *     did both is one emission and not two;
   *   - the pusher must still be living in the round the belief forms.
   * murderEvidence gates on `round.ep === ep - 1`, so a round only emits if the
   * NEXT episode was actually played — hence the playedEps check.
   */
  'pushed-then-died': (S) => {
    const out = [];
    for (const round of S.rounds) {
      const ep = round.ep + 1;
      if (!S.playedEps.has(ep)) continue;
      if ((S.blockedMurders || []).some(b => b.ep === round.ep)) continue;
      const victim = round.murderTarget ?? round.murdered;
      if (!victim) continue;
      const living = S.livingAt(ep);
      const pushers = new Set([
        ...(round.accusations || []).filter(a => a.target === victim).map(a => a.accuser),
        ...(round.ballots || []).filter(b => b.channel === 'banishment' && b.voted === victim)
          .map(b => b.voter),
      ]);
      for (const pusher of pushers) if (living.includes(pusher)) out.push({ subject: pusher, ep });
    }
    return out;
  },

  /**
   * A channel that genuinely knows something: it names a living Traitor 60% of
   * the time and a living Faithful otherwise. Nothing in the engine can do
   * this — it is a calibration weight for the instrument, not a proposal.
   */
  'synthetic-informed': (S, rng) => _perRound(S, 2, (ep, living) => {
    const traitors = living.filter(n => S.isTraitorAt(n, ep));
    const faithfuls = living.filter(n => !S.isTraitorAt(n, ep));
    const pool = (rng() < 0.60 ? traitors : faithfuls);
    return pool.length ? pool[Math.floor(rng() * pool.length)] : null;
  }),

  /**
   * THE `pushedThenDied` SHAPE, TAKEN TO ITS LIMIT: a channel whose selection
   * rule is the control's own population.
   *
   * It indicts everybody who voted for somebody who turned out to be a
   * Faithful — which is genuinely enriched in Traitors (their ballots are
   * restricted to Faithfuls by chooseBanishmentVote) and therefore reads well
   * above 1.0x against any base. It knows nothing. Its `edge` is the number
   * that has to come out at zero, and it is deliberately built without
   * sampling noise so that "the audit reports no edge here" is a property of
   * the arithmetic rather than a coin that landed the right way on the seeds
   * this file happens to use.
   */
  'synthetic-structural': (S) => {
    const out = [];
    for (const round of S.rounds) {
      const ep = round.ep + 1;
      if (!S.playedEps.has(ep)) continue;
      for (const voter of _votedForAFaithful(S, ep).members) out.push({ subject: voter, ep });
    }
    return out;
  },

  /**
   * Two uniform channels, identical except for WHEN they fire: the first round
   * of a season and the last.
   *
   * They exist to make the per-emission base FALSIFIABLE. Bounding the base
   * between 0.15 and 0.35 does not do that — a mutant computing it ONCE PER
   * SEASON lands inside those bounds and survives. This pair does not survive
   * it: the murder only ever removes Faithfuls, so a channel emitting into the
   * last round is emitting into a much denser room than one emitting into the
   * first, and a per-emission base has to say so. Under a season-wide base the
   * two report the same number and the gap is zero.
   */
  'synthetic-first-round': (S, rng) => _uniformAt(S, rng, eps => eps.slice(0, 1)),
  'synthetic-last-round': (S, rng) => _uniformAt(S, rng, eps => eps.slice(-1)),

  /**
   * THE `clashTraced` SHAPE: an anti-signal. It preferentially names living
   * Faithfuls, so it reads below its own room's density — it does not merely
   * fail to help, it actively points the castle at innocents. An audit that
   * cannot fail this has no purpose.
   */
  'synthetic-anti': (S, rng) => _perRound(S, 2, (ep, living) => {
    const faithfuls = living.filter(n => !S.isTraitorAt(n, ep));
    const pool = (rng() < 0.85 && faithfuls.length) ? faithfuls : living;
    return pool.length ? pool[Math.floor(rng() * pool.length)] : null;
  }),
};

/** Two uniform indictments per round, in whichever rounds `slice` selects. */
function _uniformAt(S, rng, slice) {
  const eps = S.rounds.map(r => r.ep + 1).filter(ep => S.playedEps.has(ep));
  const chosen = new Set(slice(eps));
  const out = [];
  for (const ep of eps) {
    if (!chosen.has(ep)) continue;
    const living = S.livingAt(ep);
    for (let i = 0; i < 2; i++) {
      if (living.length) out.push({ subject: living[Math.floor(rng() * living.length)], ep });
    }
  }
  return out;
}

/** Emit `perRound` indictments in every round that a following episode read. */
function _perRound(S, perRound, pick) {
  const out = [];
  for (const round of S.rounds) {
    const ep = round.ep + 1;
    if (!S.playedEps.has(ep)) continue;
    const living = S.livingAt(ep);
    for (let i = 0; i < perRound; i++) {
      const subject = pick(ep, living);
      if (subject) out.push({ subject, ep });
    }
  }
  return out;
}

// ── controls ───────────────────────────────────────────────────────────

/** Everybody who, in the round episode `ep` reads, voted for a Faithful. */
function _votedForAFaithful(S, ep) {
  const round = S.rounds.find(r => r.ep === ep - 1);
  if (!round) return { ep, members: [] };
  const living = S.livingAt(ep);
  // `ep` IS RETURNED, AND IT IS NOT DECORATION. It is the round the pool was
  // actually built from, and measureChannel histograms it against the round the
  // channel emitted into. Without it, a control that read a FIXED round while
  // the channel walked the season would be invisible: every derived number
  // would still line up, because they would all be recorded against the
  // emission's ep rather than the control's own.
  return {
    ep,
    members: (round.ballots || [])
      .filter(b => b.channel === 'banishment' && b.voted
        && !S.isTraitorAt(b.voted, round.ep) && living.includes(b.voter))
      .map(b => b.voter),
  };
}

const CONTROLS = {
  /**
   * "You voted for somebody who turned out to be a Faithful."
   *
   * Uninformative BY CONSTRUCTION — a banished Faithful is normally named by
   * most of the room, so the statement indicts the majority and carries almost
   * no information about anyone. And yet it measures ~1.20x, for exactly the
   * structural reason `pushedThenDied` does: a Traitor's ballot can only ever
   * land on a Faithful. That is what makes it the right control. Anything that
   * cannot beat it is not evidence.
   */
  'any-faithful': _votedForAFaithful,
};

function _channel(source) {
  const fn = CHANNELS[source];
  if (!fn) throw new Error(`unknown channel '${source}' — add its selection rule to CHANNELS in js/tr/channel-audit.js`);
  return fn;
}

function _control(name) {
  const fn = CONTROLS[name];
  if (!fn) throw new Error(`unknown control '${name}' — a channel measured against no control is measured against a base rate, which is lesson 8`);
  return fn;
}

// ── the measurement ────────────────────────────────────────────────────

/**
 * Measure one evidence channel against one uninformative control.
 *
 * THIS REPORTS EMISSIONS, AND THE RETURNED OBJECT SAYS SO (`unit: 'emission'`).
 * Say it out loud because the distinction has already produced two true numbers
 * for one channel: `clashTraced` measured 0.87x AT EMISSION and 0.57x ON THE
 * BELIEFS THAT SURVIVED to move a board. Both correct, wildly different, and a
 * report that does not name which one it is invites the next author to compare
 * them. An emission is an indictment the event OFFERS — before learn()'s
 * acceptance roll, and before a louder later source can overwrite it. That is
 * the right unit for a gate: it asks what the event is pointing at, not what
 * the rest of the engine did with it afterwards. (The surviving-belief view is
 * what `seasonForAudit().beliefs` exposes, and it is used here only to prove
 * the reconstruction is faithful.)
 *
 * Returns { source, control, unit, seasons, seedFrom, n, hitRate, base, ratio,
 *           controlN, controlHitRate, controlBase, controlRatio, edge,
 *           epHist, controlEpHist, controlOffPopulation }.
 *
 * `controlRatio` IS NOT A CONSTANT, and the gate's bar is therefore not a fixed
 * hit rate. Because the control is round-matched, it is re-drawn into whatever
 * rounds the channel fires in, and it has measured 1.26x to 1.48x across the
 * channels in this file. A late-firing channel correctly faces a stiffer
 * control: the rooms it emits into are denser, so more of its apparent accuracy
 * is drift. Compare `edge`, never `ratio`, and never `ratio` against a number
 * quoted from a different channel.
 *
 * THE CONTROL IS MATCHED PER EMISSION, ON THE ROUND. For every indictment the
 * channel makes in episode e, the control contributes exactly one unit drawn
 * from ITS rule in that same episode e. So both statistics are averaged over
 * the identical set of rounds with identical weights and see the identical
 * population densities — `controlBase === base` exactly, and that equality is
 * asserted in the tests. A control that drew a different number of units, or
 * drew them from a differently-weighted set of rounds, would not be a control;
 * it would be a second statistic, and subtracting it would produce a number
 * with no meaning.
 *
 * WHY THE CONTROL UNIT IS THE POOL'S RATE AND NOT ONE SAMPLED NAME. Drawing one
 * random member of the pool is unbiased but noisy, and the noise lands squarely
 * on the quantity being tested: at a realistic n the standard error on `edge`
 * from sampling alone is around 0.09, which is twice the 0.05 threshold that
 * separates "no edge" from "an edge". Using the pool's Traitor FRACTION is the
 * exact expectation of that draw with the sampling variance removed — same
 * rule, same round, same number of units, no coin. Lesson 4: a population
 * assertion, not one draw of a coin.
 *
 * An emission whose control pool is empty is dropped from BOTH sides rather
 * than counted on one, so `n` and `controlN` cannot come apart.
 */
export function measureChannel({ source, seasons = 40, control = 'any-faithful',
  cast, traitorCount = 3, seedFrom = 1 } = {}) {
  const channel = _channel(source);
  const ctrl = _control(control);
  if (!cast || !cast.length) throw new Error('measureChannel needs a cast');

  let n = 0, hits = 0, baseSum = 0;
  let controlN = 0, controlHits = 0, controlBaseSum = 0;
  // WHICH ROUNDS EACH SIDE ACTUALLY DREW FROM. Not derived from each other:
  // `epHist` counts the episode the channel emitted into, `controlEpHist` the
  // episode the CONTROL says it built its pool from. They are compared in the
  // tests, and a control reading any other round shows up there and nowhere
  // else — every rate, base and ratio would still agree.
  const epHist = {}, controlEpHist = {};
  // Control pool members who were not in the room the channel was indicting
  // into. Must be zero: a control drawn from a different population is not a
  // control, and this is the specific asymmetry that hid for a round — the
  // channel filters its subjects to the living, the control filtered its voters
  // to the living only inside its own rule, and dropping that filter moved the
  // reference channel's edge by 38% while every test stayed green.
  let controlOffPopulation = 0;

  for (let seed = seedFrom; seed < seedFrom + seasons; seed++) {
    const S = seasonForAudit({ cast, traitorCount, seed });
    for (const em of channel(S, S.rng)) {
      const living = S.livingAt(em.ep);
      if (!living.length) continue;
      const drawn = ctrl(S, em.ep);
      const pool = drawn.members || [];
      if (!pool.length) continue;             // dropped from both sides, never one
      // THE BASE, PER EMISSION: the Traitor density of the room this indictment
      // was actually made in. Not the season's, and not the cast's.
      const base = living.filter(x => S.isTraitorAt(x, em.ep)).length / living.length;
      const room = new Set(living);

      n++;
      baseSum += base;
      epHist[em.ep] = (epHist[em.ep] || 0) + 1;
      if (S.isTraitorAt(em.subject, em.ep)) hits++;

      controlN++;
      controlBaseSum += base;
      controlEpHist[drawn.ep] = (controlEpHist[drawn.ep] || 0) + 1;
      for (const x of pool) if (!room.has(x)) controlOffPopulation++;
      controlHits += pool.filter(x => S.isTraitorAt(x, em.ep)).length / pool.length;
    }
  }

  const empty = { source, control, unit: 'emission', seasons, seedFrom,
    n: 0, hitRate: 0, base: 0, ratio: 0, controlN: 0, controlHitRate: 0,
    controlBase: 0, controlRatio: 0, edge: 0, epHist, controlEpHist,
    controlOffPopulation };
  if (!n) return empty;

  const base = baseSum / n;
  const hitRate = hits / n;
  const controlBase = controlBaseSum / controlN;
  const controlHitRate = controlHits / controlN;
  const ratio = base > 0 ? hitRate / base : 0;
  const controlRatio = controlBase > 0 ? controlHitRate / controlBase : 0;
  return { source, control, unit: 'emission', seasons, seedFrom,
    n, hitRate, base, ratio, controlN, controlHitRate, controlBase, controlRatio,
    edge: ratio - controlRatio, epHist, controlEpHist, controlOffPopulation };
}

/**
 * THE PROTOCOL. Run this, not measureChannel, to decide whether an event may
 * write a belief.
 *
 * ── WHY A BARE measureChannel CALL IS NOT A DECISION ──
 *
 * `measureChannel` is an estimator, and at the sample sizes a single 40-season
 * call produces it is a noisy one. The standard error on `edge` is roughly 0.06
 * at n~350 — LARGER than the 0.05 band the synthetic tests use to say "no
 * edge". Measured on this audit's own reference channel:
 *
 *     seasons    n     edge
 *        40     150   +0.058    <- WRONG SIGN. Would PASS a gate built to fail it.
 *        60     219   -0.014
 *       100     351   -0.058
 *       200     708   -0.074
 *       300    1091   -0.116
 *
 * And on four DISJOINT 100-season blocks (seeds 1-100, 101-200, 201-300,
 * 301-400): -0.058, -0.091, -0.193, -0.083. Every block negative. The +0.058
 * is not a small-sample version of a real positive; it is the noise floor,
 * which at n~350 has a standard error of about 0.06 on `edge`.
 *
 * A protocol that prescribed 40 seasons would have admitted `pushedThenDied` —
 * the channel this whole file exists to have caught — on the strength of a
 * sampling accident. So:
 *
 *   1. n IS DECOUPLED FROM SEASON COUNT. The requirement is 200 emissions,
 *      over however many seasons that takes. A murder-shaped channel needs
 *      100+; a twice-a-season rare event may need 200+. That is CI cost, not a
 *      reason to deny a real channel its belief — rare-state amplification
 *      exists so those events happen, and the gate must not punish an event for
 *      being rare.
 *   2. THE EDGE MUST CLEAR THE BAR ON BOTH HALVES OF A SPLIT, on DISJOINT seed
 *      blocks. `rngFor` hashes, so seeds 1..S and S+1..2S are decorrelated
 *      populations rather than two halves of one correlated run (that hashing
 *      is the fix for the bug in lesson 9, and the reason a split like this
 *      means anything here). Without a split, the +-0.06 noise floor admits a
 *      false positive at exactly the margin the gate polices.
 *
 * Returns { pass, reasons, full, halves }.
 */
export function gateChannel({ source, control = 'any-faithful', cast, traitorCount = 3,
  minN = 200, minEdge = 0.15, startSeasons = 40, maxSeasons = 800 } = {}) {
  // Grow the sample until the channel has emitted enough to be measured at all.
  let seasons = startSeasons;
  let full = measureChannel({ source, control, cast, traitorCount, seasons });
  while (full.n < minN && seasons < maxSeasons) {
    // Scale by the shortfall rather than doubling blindly, with a floor so a
    // channel that fired twice does not ask for ten thousand seasons at once.
    const need = full.n ? Math.ceil(seasons * (minN / full.n) * 1.15) : seasons * 4;
    seasons = Math.min(maxSeasons, Math.max(seasons + startSeasons, need));
    full = measureChannel({ source, control, cast, traitorCount, seasons });
  }

  // Two DISJOINT blocks, each the size the full sample needed. Not halves of
  // the same run: `full` is seeds 1..seasons, and these are 1..seasons and
  // seasons+1..2*seasons, so block B is seasons the estimate has never seen.
  const a = measureChannel({ source, control, cast, traitorCount, seasons, seedFrom: 1 });
  const b = measureChannel({ source, control, cast, traitorCount, seasons, seedFrom: seasons + 1 });

  const reasons = [];
  if (full.n < minN) reasons.push(`only ${full.n} emissions in ${seasons} seasons (need ${minN}); too rare to measure, not too rare to build`);
  if (full.edge < minEdge) reasons.push(`edge ${full.edge.toFixed(3)} below +${minEdge} over ${seasons} seasons`);
  for (const [label, half] of [['A', a], ['B', b]]) {
    if (half.edge < minEdge) reasons.push(`block ${label} (seeds ${half.seedFrom}..${half.seedFrom + seasons - 1}) edge ${half.edge.toFixed(3)} below +${minEdge}`);
    if (half.n < minN / 2) reasons.push(`block ${label} only ${half.n} emissions`);
  }
  return { source, seasons, pass: !reasons.length, reasons, full, halves: [a, b] };
}

/** The channels this audit can measure, for a caller that wants to sweep. */
export function knownChannels() { return Object.keys(CHANNELS); }
export function knownControls() { return Object.keys(CONTROLS); }
