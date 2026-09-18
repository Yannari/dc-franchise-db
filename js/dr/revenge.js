// ══════════════════════════════════════════════════════════════════════
// dr/revenge.js — Revenge of the Queens (All Stars)
// ══════════════════════════════════════════════════════════════════════
//
// AS2 episode 5, read off the wikitext rather than remembered, because the
// first version of this was a lip sync bracket on an episode of its own —
// which is the reunion Smackdown wearing a different name, and nothing like
// the night the show actually ran.
//
// What it really is:
//
//   1. the queens the season already sent home WALK BACK IN, one at a time,
//      in a re-entrance order, into a room that is not expecting them
//   2. each of them is PAIRED with a queen still competing
//   3. the maxi challenge is performed in those pairs, in front of an
//      audience of past contestants
//   4. the panel names the TOP TWO COUPLES
//   5. the RETURNING half of each of those couples lip syncs — against each
//      other, for her place back in the competition. AS2 kept both of them
//   6. and the night still has a bottom, and still sends somebody home
//
// So it is a WEEK, not a side event: the same call, the same elimination, with
// a whole second cast woven through it. The engine runs the ordinary night and
// this module supplies the layer on top — who came back, who they were paired
// with, which couples the panel put first, and who won her way in.
//
// ── WHY A LAYER AND NOT A SECOND WEEK ENGINE ──────────────────────────
//
// `runDragWeek` is one function and already long. A second copy of it for one
// night a season would be the two-copies-of-one-rule failure this repo keeps
// paying for — and the night's own shape (challenge, runway, critiques, call,
// lip sync) is not what changes. What changes is who is in the room.
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];

/**
 * Who comes back for the night, and who each of them is paired with.
 *
 * Every eliminated queen returns — the show brings them all back and only one
 * leaves with her place. Pairing is BY BOND: the room pairs off with the
 * people it already knows, which is also what makes the night mean something
 * (a queen performing beside the friend she watched go home, or beside the
 * queen who sent her there).
 *
 * `living` is the room as it stands; the returners are `out`.
 */
export function revengePairs({ living = [], out = [], bond = () => 0, rng = Math.random } = {}) {
  const returners = [...out];
  if (!returners.length || !living.length) return { returners: [], pairs: [] };
  /* The re-entrance order is the order they LEFT, reversed: the queen who
     went home last night walks in first and the first boot of the season
     comes in last, which is the order the show brings them out in. */
  const order = [...returners].reverse();
  const free = [...living];
  const pairs = [];
  for (const back of order) {
    if (!free.length) break;
    /* Her closest ally still in the competition, and a coin toss between
       equals so a room of strangers is not always paired the same way. */
    const best = [...free].sort((a, b) => (Number(bond(back, b)) || 0) - (Number(bond(back, a)) || 0)
      || (rng() - 0.5))[0];
    free.splice(free.indexOf(best), 1);
    pairs.push({ back, with: best, bond: Number(bond(back, best)) || 0 });
  }
  /* ── AND NOBODY PERFORMS ALONE ─────────────────────────────────────
     The show runs this night at the halfway point, where the queens it has
     sent home and the queens still in it are the same number. Booked anywhere
     else they are not, and the queens left over were performing solo on a
     night the panel judges couples — and being called with no partner beside
     their name while everybody around them had one.
     A returner takes a second queen instead. She is one performer in two
     couples, which is more work for her and more exposure, and it is the
     only arrangement that keeps every queen in a couple. The returners with
     the warmest room take the extra queens first, so the trio is not handed
     to somebody who was barely spoken to. */
  let ring = 0;
  while (free.length && pairs.length) {
    const q = free.shift();
    const back = pairs[ring % pairs.length].back;
    ring += 1;
    pairs.push({ back, with: q, bond: Number(bond(back, q)) || 0, second: true });
  }
  return { returners: order, pairs, unpaired: free };
}

/**
 * The couples the panel put first, and who wins her way back in.
 *
 * `rank` is the night's FINAL ranking of the competing queens — which on this
 * night is already a ranking of pairs (`pairJudging`), so the top two couples
 * are simply the two best-placed queens who had a partner. The couple is the
 * unit the panel judged and the couple is the unit it calls.
 *
 * Then the two RETURNING halves lip sync against each other. There is no
 * separate lip sync for the win: this song is the night's song. Its winner
 * walks back into the competition AND takes the lipstick — the queen the
 * season sent home decides who goes home tonight — and the queen still
 * competing who was paired with her wins the week.
 *
 * The losing couple's returner does not come back, and neither do any of the
 * others: everybody whose pair was not called is out for good, which is why
 * the returners never appear in the call on their own.
 */
export function revengeReentry({ pairs = [], rank = [] } = {}) {
  if (pairs.length < 2) return null;
  const place = n => {
    const i = rank.indexOf(n);
    return i < 0 ? rank.length + 1 : i;
  };
  const scored = [...pairs].sort((a, b) => place(a.with) - place(b.with));
  /* ONE COUPLE PER RETURNING QUEEN. A returner who took a second queen (the
     trio above) appears twice, and two couples sharing a `back` would put
     one queen on the stage singing against herself. The better-placed of her
     two couples is the one that counts. */
  const seen = new Set();
  const distinct = scored.filter(p => !seen.has(p.back) && seen.add(p.back));
  const top = distinct.slice(0, 2);
  return {
    couples: top.map(p => ({ back: p.back, with: p.with })),
    all: distinct.map(p => ({ back: p.back, with: p.with })),
    /* The two queens who sing tonight. The night has ONE song and this is it
       — the bottom does not sing on a legacy night, and the top two do not
       sing either, because the queens fighting for a season back are the ones
       with something to win. */
    singers: top.map(p => p.back),
    mate: Object.fromEntries(top.map(p => [p.back, p.with])),
  };
}

/** One line, names filled. */
export function revengeLine(pool, vars = {}, rng = Math.random) {
  if (!Array.isArray(pool) || !pool.length) return '';
  return String(pick(rng, pool)).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

/**
 * The challenge is judged on the PAIR, not on the queen.
 *
 * The returning half performs too — that is the whole premise of the night —
 * so the panel is looking at two people and the rank it hands back belongs to
 * both of them. A competing queen can be lifted by the queen she was paired
 * with and she can be dragged down by her, which is the only thing that makes
 * the pairing a stake rather than a staging note.
 *
 * `ranking` is `panelRanking`'s rows (meanRank, best lowest). Returns new rows
 * with the pair's mean folded in and `panelRank` re-derived, plus `mate` on
 * every paired row so every screen downstream can say who she stood with.
 */
export function pairJudging({ ranking = [], pairs = [], craftOf = () => 5, weight = 0.45 } = {}) {
  if (!pairs.length || !ranking.length) return ranking;
  const mateOf = Object.fromEntries(pairs.map(p => [p.with, p.back]));
  /* The returner's own night, put on the same ruler as a mean rank: best
     craft becomes rank 1, worst becomes last, so the two numbers can be
     averaged at all. Ranked among the RETURNERS, because they are the field
     she was performing in. */
  const backOrder = [...pairs].sort((a, b) => craftOf(b.back) - craftOf(a.back));
  const spread = ranking.length / Math.max(1, backOrder.length);
  const backRank = Object.fromEntries(backOrder.map((p, i) => [p.back, (i + 0.5) * spread + 0.5]));
  const rows = ranking.map(r => {
    const mate = mateOf[r.name];
    if (!mate) return { ...r };
    return {
      ...r,
      mate,
      soloRank: r.meanRank,
      meanRank: r.meanRank * (1 - weight) + backRank[mate] * weight,
    };
  });
  rows.sort((a, b) => a.meanRank - b.meanRank || a.name.localeCompare(b.name));
  rows.forEach((r, i) => { r.panelRank = i + 1; });
  return rows;
}
