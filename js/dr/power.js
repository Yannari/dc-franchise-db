// ══════════════════════════════════════════════════════════════════════
// dr/power.js — who holds power on this show, and what it has already cost
// ══════════════════════════════════════════════════════════════════════
//
// One account, written by every mechanic that puts an exit in a queen's hands.
//
// It was welded to the season's save: `runCampaign` took `saves` and asked it
// `timesSaved`, so the Beaver's memory and All Stars' memory would have been
// two ledgers that never met — and "she saved me twice" and "she sent my best
// friend home" are the same fact about the same relationship. The Revenge of
// the Queens night (pass 2) needs them in one place to mean anything at all.
//
// The SHAPE is unchanged from `saves.uses` on purpose: seasons already stored
// keep reading, and js/dr/saves.js passes its own object straight in.
//
// ── NOT A VOTE ────────────────────────────────────────────────────────
// Nothing here counts preferences. A ledger of what one queen did to another
// is a memory, not a ballot: it moves how a queen feels about a name, never
// how many names are needed to end somebody.
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? clamp(n, 1, 10) : 5;
};

export function initLedger() {
  return { uses: [], debts: [], grudges: [], promises: [], hopes: [] };
}

/** One spend of the power, appended in the order it happened. */
export function recordUse(ledger, { ep, holder, picks = [] } = {}) {
  if (!ledger) return ledger;
  (ledger.uses ||= []).push({ ep: Number(ep) || 0, holder, picks });
  return ledger;
}

/* ── THE THREE PULLS EVERY QUEEN HAS ──────────────────────────────────
     strategy  win the game with it                     strategic, low loyalty
     merit     give it to whoever deserved it           boldness, intuition
     fair      spread it around, reward the people      social, loyalty
   The archetype leans on them and never zeroes one: a hero still wants to
   win, a villain still notices who was robbed. Normalised, so the three sum
   to one. `ballotSelfishness` stays what Rate-a-Queen uses, where the
   nice-queen zero is the rule. */
const NICE_MIND = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN_MIND = new Set(['villain', 'mastermind', 'schemer']);
const MERIT_MIND = new Set(['challenge-beast', 'hothead', 'perceptive-player']);

export function powerMind(p) {
  const a = p?.archetype || '';
  const s = stat(p, 'strategic') / 10;
  const l = stat(p, 'loyalty') / 10;
  const strat = 0.05 + s * (1.2 - l) * (VILLAIN_MIND.has(a) ? 1.6 : NICE_MIND.has(a) ? 0.45 : 1);
  const merit = 0.1 + (stat(p, 'boldness') + stat(p, 'intuition')) / 20 * (MERIT_MIND.has(a) ? 1.3 : 1);
  const fair = 0.1 + (stat(p, 'social') + stat(p, 'loyalty')) / 20
    * (NICE_MIND.has(a) ? 1.3 : VILLAIN_MIND.has(a) ? 0.5 : 1);
  const t = strat + merit + fair;
  return { strategy: strat / t, merit: merit / t, fair: fair / t };
}

/** How many times the power has already spared `q` this season. */
export function timesSpared(ledger, q) {
  return (ledger?.uses || []).reduce((n, u) => n + (u.picks || []).filter(x => x.saved === q).length, 0);
}

/** The last episode she was spared on, or 0. */
function lastSparedEp(ledger, q) {
  return (ledger?.uses || []).filter(u => (u.picks || []).some(x => x.saved === q))
    .reduce((m, u) => Math.max(m, Number(u.ep) || 0), 0);
}

/** What she did with it: wins and highs on the chart since she was spared. */
export function deliveredSince(ledger, q, state) {
  const ep = lastSparedEp(ledger, q);
  if (!ep) return { wins: 0, highs: 0 };
  const rec = (state?.record?.[q] || []).slice(ep);
  return { wins: rec.filter(r => r === 'WIN').length, highs: rec.filter(r => r === 'HIGH').length };
}
