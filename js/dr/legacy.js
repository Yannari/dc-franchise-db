// ══════════════════════════════════════════════════════════════════════
// dr/legacy.js — the All Stars choice: who the winner of the song sends home
// ══════════════════════════════════════════════════════════════════════
//
// THIS IS NOT A VOTE. One queen decides, alone, out of the bottom the panel
// named. Nobody else's preference is counted anywhere; what the room did in
// Untucked reaches her as a plea WEIGHT on her own read, which is the same
// shape the season's save already uses. A reader that finds a decision in
// js/dr/ and assumes a ballot behind it is the bug this comment exists for.
//
// ── WHY IT IS ITS OWN FILE ────────────────────────────────────────────
//
// It was one line in js/dr/week.js: `appetite >= 0.4 ? pool[0] : pool[last]` —
// the biggest threat or the panel's last, on a single number. That is a coin
// with two faces, and it could not see a grudge, a friendship, a plea, or a
// track record. Extracted rather than widened in place because the night's
// prose asks it for a REASON as well as a name, and a decision that hands back
// its own reason cannot drift from the one the screen prints.
//
// The reason explains a MOVE, not a feeling — the shape js/dr/rate.js landed
// on. "She is the one down there who could take this from me" is a reason;
// "I don't like her" is a mood.
import { powerMind, timesSpared } from './power.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/* ── HOW MUCH OF A PROBLEM SHE IS, to the queen holding the lipstick ──
   WHAT SHE CAN STILL DO, not how tonight went. This first read her recent
   form, with LOW and BTM2 scoring negative — and measured over forty seasons
   that made the whole mechanic collapse: the panel's last was taken 96.8% of
   the time and a threat 3.2%, which is the flagship format with extra steps.

   The reason is structural. She is only choosable if she is IN the bottom,
   and the bottom is by definition the queens who just had a bad week, so a
   form read scores everybody in the pool as harmless. But "she is dangerous"
   in this format means exactly the opposite thing: a queen with a crown at
   home and two wins this season, standing in the bottom on an off night, is
   the most dangerous person the holder will ever get a clean shot at. That IS
   the era's signature move.

   So: her résumé and what she has already won, and nothing about the bad week
   the panel has already punished her for. */
function threatOf(q, { state }) {
  const rec = state?.record?.[q] || [];
  const played = Math.max(1, rec.length);
  // What she has taken off the table already, this season.
  const won = (rec.filter(r => r === 'WIN').length + rec.filter(r => r === 'HIGH').length * 0.5) / played;
  const past = state?.allStars?.pasts?.[q];
  /* A finalist last time is a finalist this time until she proves otherwise.
     Scaled by where she placed in the field she was in, so second of twelve
     reads stronger than second of eight. A queen with no past sits just under
     the middle rather than at zero: unknown is not harmless. */
  const resume = past ? clamp(1 - (past.rank - 1) / Math.max(2, past.of - 1), 0, 1) : 0.35;
  return clamp(resume * 0.5 + clamp(won * 2.2, 0, 1) * 0.5, 0, 1.2);
}

/** Does she have a reason to want this one gone, from before tonight? */
function grudgeOf(winner, q, ledger) {
  const owed = (ledger?.grudges || [])
    .filter(g => (g.by === q && g.against === winner) || (g.by === winner && g.against === q)).length;
  return clamp(owed * 0.5, 0, 1.5);
}

/**
 * Who goes home.
 *
 * `pool` is the bottom the host named. `panelOrder` is the same queens in the
 * panel's own order, worst LAST. `pleas[winner][queen]` is what Untucked
 * bought her. Returns `{ target, why, reason }` and decides nothing else —
 * the caller records the exit, so the ceremony can only render a decision
 * that has already happened.
 */
export function chooseElimination({
  winner, pool = [], players = {}, bond = () => 0, state = {},
  ledger = {}, pleas = {}, panelOrder = [], rng = Math.random,
} = {}) {
  const live = pool.filter(q => q && q !== winner);
  if (!live.length) return { target: null, why: null, reason: '' };
  const mind = powerMind(players[winner]);
  const order = panelOrder.length ? panelOrder : live;
  const mine = pleas[winner] || {};
  /* ── BOTH READS ARE RANKS WITHIN THIS BOTTOM ──────────────────────
     The panel term is an ordinal — the worst of three scores 1.0 — while a
     raw threat read is a compressed 0.2..0.5, because the queens in a bottom
     are rarely far apart. Measured, that mismatch let the panel's ordinal win
     93% of the time whatever the holder's weights said, which is the flagship
     format wearing this one's clothes.
     So threat is ranked inside the pool too: the most dangerous queen STILL
     STANDING THERE scores 1.0, whether she is a former winner or merely the
     least bad of three. The holder is choosing between these queens, not
     against an absolute. The raw number is kept for the label. */
  const raw = Object.fromEntries(live.map(q => [q, threatOf(q, { state })]));
  const byThreat = [...live].sort((a, b) => raw[a] - raw[b]);
  const scored = live.map(q => {
    const threat = (byThreat.indexOf(q) + 1) / byThreat.length;
    /* The panel's own last is the polite answer AND the honest one: the room
       already said she was the weakest of them tonight. */
    const at = order.indexOf(q);
    const panelLast = at < 0 ? 0 : (at + 1) / order.length;
    const b = Number(bond(winner, q)) || 0;
    const plea = Number(mine[q]) || 0;
    const spared = timesSpared(ledger, q);
    const score =
      // strategy: end the queen who can actually beat her
      mind.strategy * (threat * 1.6 + grudgeOf(winner, q, ledger) * 0.8)
      // merit: the panel ranked her last, and that is the answer
      + mind.merit * panelLast * 1.4
      // fair: it is somebody's turn, and it is not her friend's
      + mind.fair * (panelLast * 0.6 + clamp(spared, 0, 3) * 0.25)
      // a friend is harder to end, whoever she is
      - clamp(b, -10, 10) / 10 * (0.5 + mind.fair)
      // and what she said in Untucked is worth something
      - plea * 0.12
      // a nudge, so a room of similar queens is not deterministic
      + (rng() - 0.5) * 0.25;
    return { q, score, threat, panelLast, raw: raw[q] };
  }).sort((a, b) => b.score - a.score);
  const top = scored[0];
  /* WHY, from whichever term actually dominated her score — not from her
     archetype, which would let the label and the decision disagree. */
  const parts = [
    ['threat', mind.strategy * top.threat * 1.6],
    ['panel', mind.merit * top.panelLast * 1.4],
    ['grudge', mind.strategy * grudgeOf(winner, top.q, ledger) * 0.8],
  ].sort((a, b) => b[1] - a[1]);
  const why = parts[0][1] > 0 ? parts[0][0] : 'panel';
  const REASON = {
    threat: 'she is the one in that bottom who could take this from me',
    panel: 'the panel already said she was the weakest of them tonight',
    grudge: 'she has had this coming since the last time we were in a room together',
  };
  return { target: top.q, why, reason: REASON[why] };
}
