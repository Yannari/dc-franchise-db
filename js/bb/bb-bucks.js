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
 * The canon tiers, frozen.
 *
 * "The three houseguests who received the most votes would receive $100 in BB
 * Bucks. The next three would receive $75, and the remaining houseguests would
 * receive $50." Everybody is paid something every week, which is what makes
 * saving possible for the people the audience is ignoring — slowly.
 */
export const PAYOUT_TIERS = Object.freeze([
  Object.freeze({ count: 3, amount: 100, tier: 'top' }),
  Object.freeze({ count: 3, amount: 75, tier: 'middle' }),
]);
const FLOOR = Object.freeze({ amount: 50, tier: 'floor' });

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

const TOP_LINE = [
  n => `${n} takes the top of the vote and a hundred with it, which is the audience telling this house something it did not ask to be told.`,
  n => `A hundred for ${n}. Somebody out there is watching ${n} more closely than anybody in that room is.`,
  n => `${n} is paid at the top. The number is public and so, therefore, is how much the audience likes ${n}.`,
  n => `The floor pays ${n} a hundred, and every houseguest does that arithmetic in silence.`,
];
const FLOOR_LINE = [
  n => `${n} is paid fifty, which is the floor, and the floor is a verdict.`,
  n => `Fifty for ${n} — the amount you get for being in the building.`,
  n => `${n} collects the minimum and says nothing about it, which is the correct play and does not help.`,
  n => `The floor pays ${n} fifty. Saving it is now a plan rather than a preference.`,
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
 * @returns {object|null} the act, or null in a house too small for tiers
 */
export function awardWeeklyBucks({ week, house = [],
  rng = stableRng('bb-bucks', week?.num || 0) } = {}) {
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
  const topName = payouts.find(p => p.tier === 'top')?.name;
  const floorName = payouts.find(p => p.tier === 'floor')?.name;
  if (topName) {
    beats.push({ text: TOP_LINE[Math.floor(rng() * TOP_LINE.length)](topName),
      players: [topName], badgeText: 'PAID AT THE TOP', badgeClass: 'gold' });
  }
  if (floorName) {
    beats.push({ text: FLOOR_LINE[Math.floor(rng() * FLOOR_LINE.length)](floorName),
      players: [floorName], badgeText: 'PAID THE FLOOR', badgeClass: 'grey' });
  }

  return { type: 'bb-bucks', week: week?.num || 0, secret: false, payouts, beats };
}
