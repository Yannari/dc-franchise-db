// ══════════════════════════════════════════════════════════════════════
// audience.js — how much the country liked somebody, on any show
// ══════════════════════════════════════════════════════════════════════
//
// POPULARITY WAS MEASURING SCREEN TIME.
//
// `gs.popularity` is a running total, incremented from 381 places across both
// shows — every competition, every heroic or cowardly moment, every camp event.
// A total accrued per round is dominated by how many rounds you were in, so it
// answered "how long did they last" rather than "how much did they like you".
// Measured on Big Brother 1, popularity correlates with FINAL PLACEMENT at
// -0.952. That is not a tendency, it is the same number twice.
//
// Every consumer that asks whether a player was liked was reading that instead:
// the fan favourite award on both shows, the heroes and villains boards, the
// "fan-loved" tag, the edit layer's audience pulse, and the crowd the social
// feed is built from. The most-loved houseguest of Big Brother 1 by rate --
// Zella, out fourteenth -- was invisible to all of them.
//
// THE FIX IS NOT TO STOP COUNTING. The raw total is a real quantity: it is how
// much affection somebody generated across a whole season, and a finalist
// genuinely did generate more of it than a first boot. What was missing is the
// other reading -- how much they generated PER ROUND THEY WERE THERE -- which
// is what "favourite" means and the only one that can see a beloved early exit.
//
// Both are kept. Consumers that rank players against each other use the
// standing; anything reporting a season total still uses the total.
//
// SHOW-AGNOSTIC BY CONSTRUCTION. Nothing here knows what a week or an episode
// is called, only that a show has rounds and eliminates people from them, so a
// third show gets this for free. See docs/ADDING-A-SHOW.md §8.

import { gs } from './core.js';

/**
 * THE PRIOR, in rounds.
 *
 * A rate alone is unusable at the top of the season: somebody evicted in week
 * two divides by two, so one good moment makes them the most beloved player in
 * the franchise. This adds imaginary rounds of perfectly average reception to
 * everybody, so a short run has to be REALLY liked to outrank a long one.
 *
 * Chosen by measuring, not taste. On Big Brother 1, against final placement:
 *
 *     prior 0   corr -0.44   but a 2-week boot tops the board on one moment
 *     prior 2   corr -0.74   a genuinely loved 14th place reaches the top five
 *     prior 4   corr -0.82   collapses back toward the placement order
 *     raw       corr -0.95   the bug
 *
 * 2 keeps the honest part of the correlation -- lasting longer really does give
 * you more chances to be liked -- without the measure becoming placement again.
 */
export const AUDIENCE_PRIOR = 2;

/**
 * How hard the favourite is favoured, per standard deviation above the field.
 *
 * THIS IS A TRADE-OFF AND THE NUMBERS ARE THE ARGUMENT. Multiplied by how
 * engaged the country was, so a well-watched season sharpens and a poorly
 * watched one blurs. Measured on Big Brother 1 (the favourite's win rate over
 * 1,200 ballots) against the ratings guard that a bad season must vote less
 * reliably than a good one:
 *
 *     sharpness 0.50   BB1 55%   poorly-watched 82%   well-watched 100%
 *     sharpness 0.60   BB1 57%   poorly-watched 85%   well-watched 100%
 *     sharpness 0.65   BB1 59%   poorly-watched 88%   well-watched 100%
 *
 * Pushing BB1 past about 60% takes many more blocks, and that drives the
 * poorly-watched case to 100% as well -- which erases the engagement signal
 * altogether. So 0.6, and the residual uncertainty is honest rather than
 * unfortunate: on a measure that is NOT just screen time, that season's top
 * three are 8.08, 7.55 and 7.50 and really are that close together.
 */
export const VOTE_SHARPNESS = 0.6;

/** Everyone the audience saw, whether or not they are still playing. */
function _allNames(_gs = gs) {
  const names = new Set(Object.keys(_gs?.popularity || {}));
  for (const n of _gs?.eliminated || []) names.add(n);
  for (const n of _gs?.activePlayers || []) names.add(n);
  return [...names].filter(Boolean);
}

/** Everyone a round removed from the game, however that show removes people. */
function _outOf(ep) {
  return [
    ep?.eliminated, ep?.firstEliminated, ep?.suddenDeathEliminated,
    ep?.emissaryEliminated, ep?.hpTiebreakerEliminated, ep?.tiedDestiniesCollateral,
    ...(ep?.multiTribalElims || []),
  ].filter(Boolean);
}

/**
 * How many rounds this player was actually in.
 *
 * Counted off the episode history, which BOTH shows write -- a Big Brother week
 * stamps `eliminated` exactly as a Total Drama episode does -- so this needs no
 * per-show branch. Somebody who came back and went out again is credited to
 * their LAST exit: coming back means more rounds, not fewer.
 */
export function roundsPresent(name, _gs = gs) {
  const hist = _gs?.episodeHistory || [];
  if (!hist.length) return 1;
  let out = 0;
  hist.forEach((ep, i) => { if (_outOf(ep).includes(name)) out = ep.num || i + 1; });
  return out || hist.length;
}

/**
 * How much this player was liked, per round they were on screen.
 *
 * The comparable number. Use it wherever players are ranked against each other;
 * use `gs.popularity` itself only for a season total.
 */
export function audienceStanding(name, _gs = gs) {
  const raw = Number(_gs?.popularity?.[name]) || 0;
  return raw / (roundsPresent(name, _gs) + AUDIENCE_PRIOR);
}

/**
 * The whole cast, best regarded first.
 *
 * `eligible` narrows it; omitted, everybody the audience saw is on it.
 */
export function audienceBoard({ eligible = null, _gs = gs } = {}) {
  const names = eligible && eligible.length ? [...new Set(eligible)] : _allNames(_gs);
  return names.map(name => ({
    name,
    popularity: Number(_gs?.popularity?.[name]) || 0,
    rounds: roundsPresent(name, _gs),
    standing: audienceStanding(name, _gs),
  })).sort((a, b) => b.standing - a.standing || b.popularity - a.popularity);
}

/**
 * Who the country would pick, with nobody voting on it in-game.
 *
 * A VOTE, NOT A RANKING. `blocks` is a sample size -- each block is a slice of
 * the audience that votes together -- so the favourite usually wins and an
 * upset stays reachable. Weighted on how far above the average houseguest
 * somebody stands rather than on the standing itself, because "favourite" is a
 * comparative word: a season the country adored across the board must not
 * flatten into a raffle.
 *
 * Returns { winner, tally } or null when there is nobody to vote for.
 */
export function runAudienceVote({ eligible = null, rng = Math.random, blocks = 750, scale = 1 } = {}) {
  const board = audienceBoard({ eligible });
  if (board.length < 2) return null;

  // ── MEASURED IN SPREADS, NOT IN POINTS ──
  //
  // The weight is how many standard deviations above the field somebody sits,
  // which is the only form of this that works on a show whose popularity
  // numbers are nothing like another's. A fixed offset silently means
  // different things at different scales: the same constant that let Big
  // Brother's raw totals separate flattened Total Drama's, and would have to
  // be re-guessed for every show added after them.
  const st = board.map(r => r.standing);
  const mean = st.reduce((a, b) => a + b, 0) / st.length;
  const sd = Math.sqrt(st.reduce((a, b) => a + (b - mean) ** 2, 0) / st.length) || 1;
  // Floored, so somebody the audience never warmed to still has a vote out
  // there. This is not a ranking of gameplay and should not resolve like one.
  const weights = board.map(r => ({ name: r.name,
    w: Math.max(0.05, 1 + ((r.standing - mean) / sd) * VOTE_SHARPNESS * scale) }));
  const total = weights.reduce((s, x) => s + x.w, 0);
  const N = Math.max(25, Math.round(blocks));

  const counts = Object.fromEntries(weights.map(x => [x.name, 0]));
  for (let i = 0; i < N; i++) {
    let roll = rng() * total;
    let landed = weights[0].name;
    for (const entry of weights) {
      roll -= entry.w;
      if (roll <= 0) { landed = entry.name; break; }
    }
    counts[landed]++;
  }
  // Counted, never drawn: the graphic and the result have to be the same event,
  // or the screen shows one person on top and crowns somebody else underneath.
  const ranked = [...weights].sort((a, b) => (counts[b.name] - counts[a.name]) || (b.w - a.w));
  return {
    winner: ranked[0].name,
    tally: ranked
      .map(x => ({ name: x.name, share: Math.round((counts[x.name] / N) * 10000) / 100 }))
      .filter(x => x.share > 0)
      .slice(0, 5),
  };
}
