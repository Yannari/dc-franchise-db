// ══════════════════════════════════════════════════════════════════════
// bb/bb-bucks.js — the first currency this simulator has ever had
// ══════════════════════════════════════════════════════════════════════
//
// BB23's High Roller's Room ran on money, and money is the one thing every
// other twist in this game has managed without: a power is granted or it is
// not, and the decision behind it is a probability. A balance is different.
// It is a fact a houseguest carries between weeks, it is spent once, and
// spending it in week six is a decision not to spend it in week nine.
//
// Income is an AUDIENCE vote, which is the detail that makes this worth
// building rather than a scoreboard. The money follows who is WATCHED, not who
// is good — so the quiet strong player is poor, and the payout, which is
// announced, tells the whole house every week who the audience loves. That
// leak is a real fact the room can act on before a single dollar is spent.
//
// The ledger itself is private, per canon: a houseguest knows their own
// balance and nobody has a scoreboard of everybody else's savings. What the
// house sees is the announced tiers and, later, who walks into the room. Three
// facts and a lot of inference, which is a better shape than a public number
// that removes the inference.
import { gs } from '../core.js';
import { stableRng } from './knowledge.js';

/**
 * The tiers, frozen.
 *
 * The SHAPE is canon and untouched: three at the top, three in the middle, and
 * everybody else on the floor, paid every single week. The AMOUNTS are not the
 * broadcast's, and the reason is arithmetic rather than taste.
 *
 * On the show the audience only paid during the three weeks the High Roller's
 * Room was open. A houseguest finished that stretch holding somewhere around
 * 150 to 300 against a 250 Coin, so buying the Coin cost them everything else
 * they would ever have — which is what made walking into that room a decision
 * instead of an errand.
 *
 * This simulator pays from week one, every week, because the announced tiers
 * are the audience leak the whole theme is built on and a season that only
 * leaks three times is not that theme. But paying $100/$75/$50 across the
 * sixteen-odd weeks of a normal cast hands everybody 700 to 1300 against a menu
 * that tops out at 425. Nobody would ever have to choose, and a currency nobody
 * has to ration is a scoreboard.
 *
 * So the tiers are rescaled and the canon PRICES are kept (Roulette 125, Derby
 * 50, Coin 250), which puts the season back where the show had it:
 *
 *   16 weeks, top tier    ~288 — can buy the Coin, and then nothing else, ever
 *   16 weeks, floor       ~160 — can buy the Roulette; will never see the Coin
 *    9 weeks, anybody     under 170 — the Coin is not in this season at all
 *
 * A short season being a poor house is correct rather than a rough edge: fewer
 * weeks of an audience watching you is less money, and the room shrinks to
 * match.
 *
 * Nothing downstream may hardcode these. Every surface — the transcripts, the
 * chip band, the tests — reads them from here, so the next rescale is this
 * constant and nothing else.
 */
export const PAYOUT_TIERS = Object.freeze([
  Object.freeze({ count: 3, amount: 18, tier: 'top' }),
  Object.freeze({ count: 3, amount: 14, tier: 'middle' }),
]);

/**
 * What everybody not in a counted tier is paid.
 *
 * Exported for the same reason the tiers are: it is an amount, and an amount
 * that lives in one file is an amount a test can assert against without copying
 * it. It is deliberately NOT an entry in `PAYOUT_TIERS` — the two above have a
 * `count` and this one is "the rest", and folding it in would make every
 * consumer that iterates the tiers pay the floor three times.
 */
export const FLOOR_TIER = Object.freeze({ amount: 10, tier: 'floor' });
const FLOOR = FLOOR_TIER;

/** Every amount the floor can pay, high to low. For anything asserting on them. */
export const PAYOUT_AMOUNTS = Object.freeze([
  ...PAYOUT_TIERS.map(t => t.amount), FLOOR_TIER.amount,
]);

/** The ledger, created on first touch so a pre-feature save can grow one. */
function ledger() {
  if (!gs.bb) gs.bb = {};
  if (!gs.bb.bucks) gs.bb.bucks = {};
  return gs.bb.bucks;
}

export function balance(name) {
  return ledger()[name] || 0;
}

export function canAfford(name, amount) {
  return balance(name) >= amount;
}

export function credit(name, amount) {
  const l = ledger();
  l[name] = (l[name] || 0) + amount;
  return l[name];
}

/** Take the money. Returns false and changes nothing when they are short. */
export function spend(name, amount) {
  if (!canAfford(name, amount)) return false;
  ledger()[name] -= amount;
  return true;
}

/** Everybody's balance, for a snapshot. Never rendered to the house. */
export function bucksLedgerFor(house = gs.activePlayers || []) {
  return house.filter(Boolean).map(name => ({ name, balance: balance(name) }));
}

// The amount is passed in rather than written into the sentence. These lines
// spelled their numbers out — "a hundred", "fifty" — which meant the prose was
// a second, silent copy of `PAYOUT_TIERS` that no test could see drift, and one
// of them had already drifted into saying the FLOOR paid a hundred.
const TOP_LINE = [
  (n, amt) => `${n} takes the top of the vote and $${amt} with it, which is the audience telling this house something it did not ask to be told.`,
  (n, amt) => `$${amt} for ${n}. Somebody out there is watching ${n} more closely than anybody in that room is.`,
  n => `${n} is paid at the top. The number is public and so, therefore, is how much the audience likes ${n}.`,
  (n, amt) => `The floor pays ${n} the top tier, $${amt}, and every houseguest does that arithmetic in silence.`,
];
const FLOOR_LINE = [
  (n, amt) => `${n} is paid $${amt}, which is the floor, and the floor is a verdict.`,
  (n, amt) => `$${amt} for ${n} — the amount you get for being in the building.`,
  n => `${n} collects the minimum and says nothing about it, which is the correct play and does not help.`,
  (n, amt) => `The floor pays ${n} $${amt}. Saving it is now a plan rather than a preference.`,
];

/**
 * Draw `n` names without replacement, weighted by popularity.
 *
 * The same weighting the audience vote already uses in `care-package.js`
 * (`max(0.6, 3 + popularity)`), and the same reason: a pure ranking hands the
 * top tier to the identical three people for fifteen weeks, which is a
 * scoreboard rather than a vote. The floor of 0.6 means an unpopular
 * houseguest is unlikely rather than ineligible.
 */
function drawWeighted(pool, n, rng) {
  const left = pool.map(name => ({
    name, weight: Math.max(0.6, 3 + (gs.popularity?.[name] || 0)),
  }));
  const picked = [];
  while (picked.length < n && left.length) {
    const total = left.reduce((sum, e) => sum + e.weight, 0);
    let roll = rng() * total;
    let idx = 0;
    while (idx < left.length - 1 && roll > left[idx].weight) { roll -= left[idx].weight; idx++; }
    picked.push(left.splice(idx, 1)[0].name);
  }
  return picked;
}

/**
 * The week's payout.
 *
 * The rng defaults to the week's own seeded generator rather than Math.random.
 * An unseeded draw anywhere in a season means the same seed stops producing the
 * same house, which the replay guards catch — so a caller who omits `rng` must
 * still get output that is deterministic and stable for that week. `week` is
 * destructured before `rng`, so the default can read it.
 *
 * The season's salt is in the key for the same reason `themeVoice` puts it in
 * its own: keyed on the week number alone, the fallback is a pure function of
 * "week 4", so every season anybody ever runs would draw the tiers in the
 * identical order for a given popularity map — the audience would have a script
 * rather than a vote. The salt is drawn once per season from the season's dice
 * (`gs.bb.seasonSalt`, in week.js) and is itself stable under replay. A season
 * that has not drawn one yet falls back to 0 and simply draws unsalted.
 *
 * @returns {object|null} the act, or null in a house too small for tiers
 */
export function awardWeeklyBucks({ week, house = [],
  rng = stableRng('bb-bucks', gs?.bb?.seasonSalt || 0, week?.num || 0) } = {}) {
  const room = house.filter(Boolean);
  // Seven is the smallest house the canon tiers describe. At six the "top
  // three" and the "next three" are the entire room, nobody stands on the
  // floor tier, and a vote that pays everybody a prize says nothing.
  if (room.length < 7) return null;

  const payouts = [];
  let pool = [...room];
  for (const tier of PAYOUT_TIERS) {
    const won = drawWeighted(pool, tier.count, rng);
    for (const name of won) {
      credit(name, tier.amount);
      payouts.push({ name, amount: tier.amount, tier: tier.tier });
    }
    pool = pool.filter(n => !won.includes(n));
  }
  for (const name of pool) {
    credit(name, FLOOR.amount);
    payouts.push({ name, amount: FLOOR.amount, tier: FLOOR.tier });
  }

  // Two beats, not fifteen: the transcript wants the shape of the vote, not a
  // reading of the whole ledger. And a beat may never state a balance — only
  // what was paid this week, which is the part the house was told.
  const beats = [];
  const top = payouts.find(p => p.tier === 'top');
  const floor = payouts.find(p => p.tier === 'floor');
  if (top) {
    beats.push({ text: TOP_LINE[Math.floor(rng() * TOP_LINE.length)](top.name, top.amount),
      players: [top.name], badgeText: 'PAID AT THE TOP', badgeClass: 'gold' });
  }
  if (floor) {
    beats.push({ text: FLOOR_LINE[Math.floor(rng() * FLOOR_LINE.length)](floor.name, floor.amount),
      players: [floor.name], badgeText: 'PAID THE FLOOR', badgeClass: 'grey' });
  }

  return { type: 'bb-bucks', week: week?.num || 0, secret: false, payouts, beats };
}
