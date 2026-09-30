// ══════════════════════════════════════════════════════════════════════
// ci/ratings.js — "Players, you must now rate each other." (spec §8)
// ══════════════════════════════════════════════════════════════════════
//
// Each eligible player ranks every other eligible profile. A ballot is built
// from what the voter FEELS and BELIEVES, weighted by their style. Results are
// averaged, revealed from the bottom two at a time (US 1 Ep 1: "Seventh and
// eighth… fifth and sixth…"), and the top two become Influencers — three on a
// tie for second (UK 1 Ep 6). Ballots are secret: afterwards each player can
// only INFER who broke a pact with them, and may be wrong (§8.6).
import { rel, bump, S, clamp, addScene } from './state.js';
import { belief, nudgeBelief } from './beliefs.js';
import { feel, mood } from './mind.js';
import { burnerVoters, jokerPick } from './powers.js';
import { rideOrDieInfluencers } from './twists.js';

// a affection · t trust · o obligation · p pact · v "will they save me"
// h threat · s suspicion · r resentment · d "deserves it" (final only)
export const STYLE_WEIGHTS = {
  heart:      { a: 1.2, t: 0.8, o: 0.8, p: 1.2, v: 0.2, h: 0.2, s: 0.6, r: 0.8, d: 0.6 },
  strategist: { a: 0.6, t: 0.6, o: 0.4, p: 0.6, v: 1.0, h: 0.9, s: 0.6, r: 0.8, d: 1.2 },
  fair:       { a: 0.8, t: 0.8, o: 0.6, p: 0.8, v: 0.3, h: 0.1, s: 0.4, r: 0.4, d: 1.0 },
  safe:       { a: 0.8, t: 0.6, o: 0.8, p: 0.8, v: 0.8, h: 0.4, s: 0.8, r: 0.6, d: 0.8 },
  gut:        { a: 0.9, t: 0.4, o: 0.4, p: 0.4, v: 0.2, h: 0.3, s: 1.4, r: 0.6, d: 0.8 },
};
export const PACT_PULL = 6;
export const NOISE = 2.0;
// How much a doubt costs on a ballot. At 10 a catfish won 7-15% of seasons
// against the real show's 5 in 10 (audit:ci-spec, 2026-09-29).
export const SUSPICION = 5;

export function styleOf(state, h) {
  const lean = {
    heart: S(state, h, 'loyalty'),
    strategist: S(state, h, 'strategic'),
    fair: S(state, h, 'temperament') - S(state, h, 'boldness') / 2,
    safe: mood(state, h, 'paranoia'),
    gut: S(state, h, 'intuition') - S(state, h, 'strategic') / 2,
  };
  return Object.entries(lean).sort((a, b) => b[1] - a[1])[0][0];
}

const hasPact = (state, kind, x, y) => state.pacts.some(p => p.kind === kind
  && ((p.a === x && p.b === y) || (p.a === y && p.b === x)));

/** Influencer nights as a share of the ratings a player was in, scaled to the
 *  season's: a late arrival who led every rating they saw has earned as much
 *  as an original who did (it counted raw nights, which newcomers can't have). */
export function influenceRate(state, target) {
  const all = state.ratings.filter(r => !r.final);
  const mine = all.filter(r => r.targets?.includes(target)).length;
  return mine ? (state.influencerCount[target] || 0) / mine * all.length : 0;
}

export function voterScore(state, rng, voter, target, { final = false } = {}) {
  const w = STYLE_WEIGHTS[styleOf(state, voter)];
  const b = belief(state, voter, target);
  const parts = {
    affection: w.a * rel(voter, target, 'affection'),
    trust: w.t * rel(voter, target, 'trust'),
    obligation: w.o * rel(voter, target, 'obligation'),
    pact: hasPact(state, 'rate', voter, target) ? w.p * PACT_PULL * S(state, voter, 'loyalty') / 10 : 0,
    protection: final ? 0 : w.v * (b.likesMe + 10) / 20 * 4,
    threat: -w.h * b.threat * (final ? 0.3 : 1),
    suspicion: -w.s * (1 - b.real) * SUSPICION,
    grudge: -w.r * rel(voter, target, 'resentment'),
    deserves: final ? w.d * (influenceRate(state, target) * 0.8 + rel(voter, target, 'strategicRespect')) : 0,
  };
  const score = Object.values(parts).reduce((x, y) => x + y, 0) + (rng() - 0.5) * 2 * NOISE;
  return { score, parts };
}

// "Most Human" (US 6 Ep 3): rank from most to least human. A profile reads
// human as much as the voter believes it is real, and warms to it.
export function humanScore(state, rng, voter, target) {
  const b = belief(state, voter, target);
  const parts = { human: b.real * 6, warmth: rel(voter, target, 'affection') * 0.3 + rel(voter, target, 'trust') * 0.2 };
  return { score: parts.human + parts.warmth + (rng() - 0.5) * 2 * NOISE * 0.6, parts };
}

export function ballot(state, rng, voter, targets, opts = {}) {
  const scored = targets.filter(t => t !== voter).map(t => ({ t, ...(opts.human ? humanScore(state, rng, voter, t) : voterScore(state, rng, voter, t, opts)) }))
    .sort((a, b) => b.score - a.score);
  const reasons = scored.map(x => Object.entries(x.parts).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0][0]);
  // What each target's score was made of, for the audit (which term decides).
  const parts = Object.fromEntries(scored.map(x => [x.t, Object.fromEntries(Object.entries(x.parts).map(([k, v]) => [k, Math.round(v * 100) / 100 || 0]))]));
  return { voter, order: scored.map(x => x.t), reasons, parts };
}

export function ratedPool(state) {
  const rule = state.options.newcomerRule;
  const fresh = h => !!state.unratedNext[h];
  const voters = rule === 'none' ? state.active.filter(h => !fresh(h)) : [...state.active];
  const targets = rule === 'full' ? [...state.active] : state.active.filter(h => !fresh(h));
  return { voters, targets };
}

export function results(ballots, targets) {
  const rows = targets.map(t => {
    const places = ballots.filter(b => b.order.includes(t)).map(b => b.order.indexOf(t) + 1);
    const avg = places.length ? places.reduce((a, b) => a + b, 0) / places.length : targets.length;
    return { profile: t, avg: Math.round(avg * 1000) / 1000, firsts: ballots.filter(b => b.order[0] === t).length };
  }).sort((a, b) => a.avg - b.avg || (a.profile < b.profile ? -1 : 1));
  rows.forEach((r, i) => { r.place = i > 0 && r.avg === rows[i - 1].avg ? rows[i - 1].place : i + 1; });
  return rows;
}

export function influencersFrom(res) {
  if (res.length < 2) return res.map(r => r.profile);
  const second = res[1].avg;
  return res.filter(r => r.avg <= second).map(r => r.profile);
}

export function revealOrder(res) {
  const infl = influencersFrom(res);
  const rest = [...res].reverse().filter(r => !infl.includes(r.profile)).map(r => r.profile);
  const groups = [];
  let i = 0;
  while (rest.length - i > 2) { groups.push(rest.slice(i, i + 2)); i += 2; }
  for (; i < rest.length; i++) groups.push([rest[i]]);
  groups.push(res.filter(r => infl.includes(r.profile)).map(r => r.profile));
  return groups;
}

/** After the reveal: who broke a pact with me? (A belief — it can be wrong.) */
function infer(state, rng, row, scene) {
  const out = [];
  const n = row.targets.length;
  for (const r of row.results) {
    const me = r.profile;
    const partners = state.pacts.filter(p => p.kind === 'rate' && (p.a === me || p.b === me))
      .map(p => (p.a === me ? p.b : p.a)).filter(x => row.voters.includes(x));
    for (const p of partners) {
      const chance = clamp((r.place - 1) / Math.max(1, n - 1) * S(state, me, 'intuition') / 10, 0, 0.9);
      if (rng() >= chance) continue;
      const truly = row.ballots.find(b => b.voter === p)?.order.indexOf(me) > 1;
      nudgeBelief(state, me, p, 'likesMe', -2, scene);
      bump(me, p, 'resentment', 1);
      out.push({ by: me, suspects: p, right: truly });
    }
  }
  return out;
}

export function runRating(state, rng, { final = false, seats = Infinity, pick = null, hidden = false, human = false } = {}) {
  const { voters, targets } = ratedPool(state);
  const ballots = voters.map(v => ballot(state, rng, v, targets, { final, human }));
  // A burner profile casts its holder's second ballot (US 3), until exposed.
  if (!final) for (const h of burnerVoters(state, rng)) ballots.push({ ...ballot(state, rng, h, targets), burner: true });
  const res = results(ballots, targets);
  // A format seats its own number of Influencers (a sole influencer: one).
  let influencers = final ? [] : (pick ? pick(res, state) : influencersFrom(res).slice(0, seats));
  // The Joker names the second Influencer of an ordinary night (US 2).
  if (!final && !hidden && seats === 2 && !pick) influencers = rideOrDieInfluencers(state, jokerPick(state, influencers));
  const sc = addScene(state, final ? 'final-ratings' : 'ratings', voters,
    { ballots, results: res, influencers, reveal: revealOrder(res), ...(hidden ? { hidden: true } : {}), ...(human ? { human: true } : {}) }, [...state.active]);
  for (const r of res) state.firstPlaces[r.profile] = (state.firstPlaces[r.profile] || 0) + r.firsts;
  for (const i of influencers) state.influencerCount[i] = (state.influencerCount[i] || 0) + 1;
  for (const p of state.pacts.filter(x => x.kind === 'rate')) {
    for (const [v, t] of [[p.a, p.b], [p.b, p.a]]) {
      const b = ballots.find(x => x.voter === v);
      if (b && b.order.includes(t)) p.kept.push({ day: state.day, voter: v, kept: b.order.indexOf(t) <= 1 });
    }
  }
  const n = res.length;
  // Hidden results (secret and super influencers): nobody learns a place, so
  // nothing below — threat, the feelings of a place, inferred betrayals — can
  // come from tonight.
  if (hidden) {
    for (const h of state.active) delete state.unratedNext[h];
    const row = { day: state.day, final, voters, targets, ballots, results: res, influencers, hidden: true,
      reveal: revealOrder(res), inferred: [], sceneId: sc.id };
    sc.data.inferred = [];
    state.ratings.push(row);
    return row;
  }
  for (const obs of state.active) for (const r of res) {
    if (r.profile === obs) continue;
    const seen = 10 * (1 - (r.place - 1) / Math.max(1, n - 1));
    nudgeBelief(state, obs, r.profile, 'threat', (seen - belief(state, obs, r.profile).threat) * 0.6, sc);
  }
  for (const r of res) {
    const frac = (r.place - 1) / Math.max(1, n - 1);
    feel(state, r.profile, 'elation', 2 * (1 - frac) - 0.5);
    feel(state, r.profile, 'stress', 1.5 * frac);
    feel(state, r.profile, 'paranoia', frac);
  }
  const inferred = final ? [] : infer(state, rng, { voters, targets, ballots, results: res }, sc);
  sc.data.inferred = inferred;
  for (const h of state.active) delete state.unratedNext[h];
  const row = { day: state.day, final, voters, targets, ballots, results: res, influencers,
    reveal: revealOrder(res), inferred, sceneId: sc.id };
  state.ratings.push(row);
  return row;
}
