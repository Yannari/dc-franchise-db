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
export function hostBend(ranking, { star = {}, storylineNeed = {}, trackPull = {}, split = false } = {}) {
  const n = ranking.length;
  if (!n) return [];
  const maxMove = split ? 3 : 2;

  const rows = ranking.map(r => {
    const bend = ((star[r.name] || 0) / 10) * 0.4
      + (storylineNeed[r.name] || 0) * 0.4
      + (trackPull[r.name] || 0) * 0.2;
    return {
      name: r.name,
      panelRank: r.panelRank,
      bend: Math.round(bend * 1000) / 1000,
      // Where he would put her if nothing else were in the way. A bend of ±1
      // is worth the full allowance.
      desired: r.panelRank - bend * maxMove,
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
