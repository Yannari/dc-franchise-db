// ══════════════════════════════════════════════════════════════════════
// dr/judging.js — steps 2 and 3: how it was SEEN, and what was DONE about it
// ══════════════════════════════════════════════════════════════════════
//
// Step 2. Each judge takes the same performance and weighs it by their own
// taste, so a look queen and a comedy queen genuinely disagree about the same
// night. The merged ranking is what the panel thinks; the SPREAD across judges
// is recorded, because a week they disagree about is a week the host has room
// to move in.
//
// Step 3. The host reorders that ranking, within hard bounds. This is the part
// that has to be got exactly right in both directions: a host who can do
// anything is a random number generator with a name, and a host who can do
// nothing makes the panel the entire show. He can lean on a close call. He
// cannot crown somebody the panel put last.
import { noise } from './perform.js';

/**
 * Every judge's view of every queen, best first.
 *
 * `memory` is what each judge already thinks of her — a queen they have put in
 * the bottom twice reads as bottom-ish before she opens her mouth, which is
 * both true to the format and the thing that makes a redemption arc legible.
 */
export function judgeViews(panel, entries, memory = {}, rng = Math.random) {
  const out = {};
  for (const j of panel) {
    const mem = (memory && memory[j.id]) || {};
    const rows = entries.map(e => {
      const t = j.taste;
      const view = t.challenge * e.perf
        + t.runway * e.runway
        + t.risk * (e.risk * 10)
        + t.polish * (e.polish ?? 5)
        + ((j.styleBias || {})[e.style] || 0)
        + (mem[e.name] || 0)
        + noise(rng, 1.0);
      return { name: e.name, view: Math.round(view * 100) / 100 };
    });
    // Ties broken by name so a re-run of the same seed gives the same board.
    rows.sort((a, b) => b.view - a.view || a.name.localeCompare(b.name));
    rows.forEach((r, i) => { r.rank = i + 1; });
    out[j.id] = rows;
  }
  return out;
}

/** Mean rank across the panel, best first, with the disagreement recorded. */
export function panelRanking(views) {
  const byName = {};
  for (const id of Object.keys(views)) {
    for (const r of views[id]) (byName[r.name] ||= []).push(r.rank);
  }
  const rows = Object.entries(byName).map(([name, ranks]) => ({
    name,
    meanRank: ranks.reduce((a, b) => a + b, 0) / ranks.length,
    spread: Math.max(...ranks) - Math.min(...ranks),
    ranks,
  }));
  rows.sort((a, b) => a.meanRank - b.meanRank || a.name.localeCompare(b.name));
  rows.forEach((r, i) => { r.panelRank = i + 1; });
  return rows;
}

/** A week the judges do not agree about at the ends, where it matters. */
export function isSplitPanel(ranking) {
  const n = ranking.length;
  if (n < 4) return false;
  const ends = [...ranking.slice(0, 2), ...ranking.slice(-2)];
  return ends.some(r => r.spread >= Math.max(2, Math.floor(n / 4)));
}

/**
 * The host reorders the panel's ranking, within bounds.
 *
 *   bend = star*0.4 + storylineNeed*0.4 + trackPull*0.2      (star scaled 0..1)
 *
 * THE BOUNDS, and they hold for the whole cast simultaneously rather than one
 * queen at a time:
 *
 *   * nobody moves more than two places, or three on a split week;
 *   * a queen the panel put in its bottom two cannot win;
 *   * a queen the panel put first cannot end up in the bottom two.
 *
 * Implemented as a CONSTRAINED ASSIGNMENT rather than a sort-then-repair.
 * Sorting by preference and swapping violators back is the obvious approach
 * and it is wrong: a pile-up of bends can displace a queen by more than the
 * limit, and repairing by swapping can push the neighbour out of bounds in
 * turn and oscillate. Here each queen gets a window of legal positions, and
 * positions are filled in order, always taking a queen whose window is about
 * to close before one whose window stays open. The identity ranking is always
 * inside every window, so a legal answer always exists and this always finds
 * one.
 */
/**
 * How hard the host leans.
 *
 * MEASURED, not chosen. Two adjacent queens trade places only when their
 * desired positions cross, so this is the bar a case has to clear before he
 * touches the panel's order at all. Over 100 seasons at 13 queens:
 *
 *     0.45 → the host changes something on 21% of episodes
 *     0.50 → 33%          ← the spec's target
 *     0.60 → 50%
 *     0.70 → 66%
 *     0.80 → 75%
 *
 * AND A TENSION WORTH KNOWING ABOUT. The spec asks for two things at once —
 * a change on about one episode in three, and the occasional two-place move
 * that makes a robbery — and one continuous knob cannot deliver both: single
 * swaps arrive long before two-place jumps, so the strength that produces any
 * big moves (0.80+) has the host meddling three weeks in four. At 0.50 the
 * two-place move never happens.
 *
 * That is the correct state for now rather than a compromise, because the
 * input that is supposed to produce the dramatic cases is not wired yet.
 * `storylineNeed` is all zeros until Plan 3's arc tracker fills it, and it is
 * the term designed to be occasionally LARGE — the underdog who needs a win
 * this week, the fighter who has earned the benefit of a toss-up. Star power
 * and track record are mild and always-on by nature; they should nudge, not
 * overrule. When the tracker lands, re-measure both numbers together rather
 * than raising this constant to fake the tail.
 */
export const BEND_STRENGTH = 0.50;

export function hostBend(ranking, { star = {}, storylineNeed = {}, trackPull = {}, split = false } = {}) {
  const n = ranking.length;
  if (!n) return [];
  const maxMove = split ? 3 : 2;

  // ── STAR POWER IS RELATIVE, AND THIS IS WHY ───────────────────────
  //
  // Read raw, `star` is 0..10 and its term is therefore always positive: it
  // lifted every queen at once and cancelled out. Measured over 100 seasons
  // with the uncentred version, the host moved 0.02 queens per episode and
  // never once moved anybody two places — step 3 of the engine was doing
  // nothing at all and the "robbed" badge could not fire.
  //
  // What matters is not how big a star she is but how big a star she is
  // COMPARED TO THE ROOM SHE IS IN, which is also the truer statement: being
  // the most watchable queen left is what earns the benefit of the doubt, and
  // that changes as the cast shrinks around her.
  // Measured against the cast's OWN SPREAD rather than a fixed divisor, and
  // that detail is the difference between this working and not. Star power is
  // a weighted mean of five terms, so it regresses hard: across 520 queens it
  // ran from 2.9 to 7.8 with the middle eighty percent inside 4.3–6.6. Divided
  // by a constant 5 that became a bend of ±0.16, and since two adjacent queens
  // must differ by more than 1/maxMove to trade places, nobody ever moved.
  //
  // Dividing by the standard deviation of the room makes it a z-score: the
  // most watchable queen of THIS cast gets the full allowance whether the
  // season is full of personalities or full of wallpaper, which is also the
  // truer statement about how a favourite emerges.
  const stars = ranking.map(r => star[r.name] || 0);
  const meanStar = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0;
  const variance = stars.length
    ? stars.reduce((s, v) => s + (v - meanStar) ** 2, 0) / stars.length : 0;
  const sdStar = Math.sqrt(variance) || 1;
  const relStar = name => Math.max(-1, Math.min(1, ((star[name] || 0) - meanStar) / sdStar));

  const rows = ranking.map(r => {
    const bend = relStar(r.name) * 0.4
      + (storylineNeed[r.name] || 0) * 0.4
      + (trackPull[r.name] || 0) * 0.2;
    return {
      name: r.name,
      panelRank: r.panelRank,
      bend: Math.round(bend * 1000) / 1000,
      // Where he would put her if nothing else were in the way.
      //
      // BEND_STRENGTH is what decides how often he intervenes at all. Two
      // adjacent queens trade places only when their desired positions cross,
      // which needs their bends to differ by more than 1/(maxMove*strength) —
      // so the constant is not a volume knob on a continuous effect, it is the
      // bar a case has to clear before the host touches the panel's order.
      // Tuned against the spec's two targets and re-measured over 100 seasons.
      desired: r.panelRank - bend * maxMove * BEND_STRENGTH,
    };
  });

  // Each queen's legal window, tightened by the two special rules.
  for (const r of rows) {
    r.lo = Math.max(1, r.panelRank - maxMove);
    r.hi = Math.min(n, r.panelRank + maxMove);
    if (n >= 3) {
      if (r.panelRank >= n - 1) r.lo = Math.max(r.lo, 2);        // cannot be crowned
      if (r.panelRank === 1) r.hi = Math.min(r.hi, n - 2);       // cannot be in the bottom two
    }
  }

  const unplaced = new Set(rows);
  const placed = [];
  for (let pos = 1; pos <= n; pos++) {
    const legal = [...unplaced].filter(r => r.lo <= pos && pos <= r.hi);
    // Anybody whose window closes at this position must be placed now or the
    // arrangement becomes impossible. Among those, and otherwise among all the
    // legal ones, the host takes whoever he most wanted here.
    const forced = legal.filter(r => r.hi === pos);
    const pool = forced.length ? forced : legal;
    // `pool` is never empty: the identity assignment is legal for every queen,
    // so the queen whose panelRank is `pos` is always available or already
    // placed at an earlier position.
    const pick = pool.reduce((best, r) =>
      (r.desired < best.desired || (r.desired === best.desired && r.panelRank < best.panelRank) ? r : best),
    pool[0]);
    pick.finalRank = pos;
    unplaced.delete(pick);
    placed.push(pick);
  }

  return placed.map(({ name, panelRank, finalRank, bend }) => ({ name, panelRank, finalRank, bend }));
}

/**
 * Win / high / safe / low / bottom, sized by how many are left.
 *
 * A twelve-queen room gets three called up and three called down; a final six
 * gets two and two, because calling six of eight queens forward is not a
 * critique, it is a group photo.
 */
export function callWeek(finalRanking, { castSize, immune = [] } = {}) {
  const n = castSize || finalRanking.length;
  // How many are called up. It drops to ONE at four or fewer, and that is not
  // cosmetic: with three queens left, calling two of them forward leaves a
  // single queen to be the bottom, no lip sync is possible and the season
  // cannot reach a final two. One win and two lip syncing is also what the
  // format actually does that late.
  const up = n >= 12 ? 3 : n >= 5 ? 2 : 1;
  const down = n >= 9 ? 3 : 2;

  const order = [...finalRanking].sort((a, b) => a.finalRank - b.finalRank).map(r => r.name);
  const top = order.slice(0, up);
  const rest = order.slice(up);

  // Immunity keeps her out of the bottom block and pulls the next queen in.
  // It cannot cost her a win she already had: the top is taken first.
  const eligible = rest.filter(nm => !immune.includes(nm));
  const bottomBlock = eligible.slice(-down);
  const bottom = bottomBlock.slice(-2);
  const low = bottomBlock.slice(0, -2);
  const safe = rest.filter(nm => !bottomBlock.includes(nm));

  return { win: top.slice(0, 1), high: top.slice(1), safe, low, bottom };
}

/**
 * What the panel carries into next week.
 *
 * Decays first, then records tonight, so an old verdict fades rather than
 * following a queen for the whole season. Twelve quiet weeks take a −1 to
 * effectively nothing.
 */
export function judgeMemoryAfter(memory, panel, call) {
  const out = {};
  for (const j of panel) {
    const prev = (memory && memory[j.id]) || {};
    const m = {};
    for (const [k, v] of Object.entries(prev)) m[k] = v * 0.7;
    for (const nm of call.bottom || []) m[nm] = (m[nm] || 0) - 0.4;
    for (const nm of call.win || []) m[nm] = (m[nm] || 0) + 0.3;
    out[j.id] = m;
  }
  return out;
}
