// ══════════════════════════════════════════════════════════════════════
// rr/schedule.js — how many legs, which of them eliminate, what each one pays
// ══════════════════════════════════════════════════════════════════════
//
// Spec §3: eliminations = teams − 3 (the final leg starts with three, and its
// midpoint cuts one); non-elimination legs about a third of the elimination legs,
// never the first leg and never the last two; money per leg with zero-money legs;
// a reward on about a third of the legs, never the final.
import { streamFor } from '../dr/rng.js';
import { DEFAULT_OPTIONS, NON_ELIM_PENALTIES, REWARDS } from './format.js';

export { DEFAULT_OPTIONS, NON_ELIM_PENALTIES };

function shuffle(a, rng) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function buildSchedule({ teams, options = DEFAULT_OPTIONS, seed = 1 }) {
  const o = { ...DEFAULT_OPTIONS, ...options };
  const rng = streamFor(seed, 'schedule');
  for (let i = 0; i < 4; i++) rng();   // dr/rng.js: a fresh stream's first draws are poorly mixed

  const elimLegs = Math.max(0, teams - 3);
  // legs pinned on the Season Timeline (leg number -> 'non' | 'elim'): a pinned non-elimination leg is one, and the
  // season has at least as many as are pinned (it grows to hold them)
  const kinds = o.legKinds || {};
  const pinNon = Object.keys(kinds).filter(n => kinds[n] === 'non').map(Number);
  const pinElim = new Set(Object.keys(kinds).filter(n => kinds[n] === 'elim').map(Number));
  const nonLegs = Math.max(Math.round(o.nonElimShare * elimLegs), pinNon.length);
  const total = elimLegs + nonLegs + 1;

  // Non-elimination legs: anywhere from leg 2 to leg total−2 (the last two are the
  // semi-final and the final).
  const pinnedNon = pinNon.filter(n => n >= 2 && n <= total - 2);
  const eligible = [];
  for (let n = 2; n <= total - 2; n++) if (!pinElim.has(n) && !pinnedNon.includes(n)) eligible.push(n);
  const nonAt = new Set([...pinnedNon, ...shuffle(eligible, rng).slice(0, nonLegs - pinnedNon.length)]);

  // Zero-money legs: never the first, never the final.
  const middle = [];
  for (let n = 2; n <= total - 1; n++) middle.push(n);
  const zeroAt = new Set(shuffle([...middle], rng).slice(0, o.money.zeroLegs));

  // Rewards: a share of every leg but the final.
  const rewardLegs = Math.round(o.rewardShare * (total - 1));
  const legsBeforeFinal = [];
  for (let n = 1; n <= total - 1; n++) legsBeforeFinal.push(n);
  const rewardAt = new Set(shuffle(legsBeforeFinal, rng).slice(0, rewardLegs));

  const legs = [];
  for (let n = 1; n <= total; n++) {
    const kind = n === total ? 'final' : nonAt.has(n) ? 'non' : 'elim';
    const money = zeroAt.has(n) ? 0
      : Math.round((o.money.min + rng() * (o.money.max - o.money.min)) / 10) * 10;
    const reward = rewardAt.has(n) ? REWARDS[Math.floor(rng() * REWARDS.length)] : null;
    const nonElimPenalty = kind !== 'non' ? null
      : o.nonElimPenalty !== 'draw' ? o.nonElimPenalty
        : NON_ELIM_PENALTIES[Math.floor(rng() * NON_ELIM_PENALTIES.length)];
    legs.push({ n, kind, money, reward, twist: o.twists?.[n] ?? null, nonElimPenalty });
  }
  drawTwists(legs, o, seed);
  return legs;
}

// The season's twists (found 2026-10-20: built, tested, and on no leg at all). Never the first leg (nobody has a record
// to aim at), never the last two (the semi-final and the final run their own shape); a Boomerang about every fifth
// leg, one Yield, one Zip-It, and the pick-a-team Boomerang once the teams have a record to judge (the back half).
// The Amazing Race's other three come some seasons, not every one (each OPTIONAL's chance): the Blind Boomerang, the
// Head-to-Head at the mat, and the Intersection that pairs teams at a challenge.
// The Season Timeline's pins (`twistPins`: leg -> twist, or 'none') come first and count toward the season; with
// surprises off only the pins happen. Drawn on its own stream, so the legs, money and rewards are the ones a season
// drew before twists were.
export const LEG_TWISTS = ['boomerang', 'yield', 'zip-it', 'boomerang-vote', 'boomerang-blind', 'head-to-head', 'intersection'];
const OPTIONAL = { 'boomerang-blind': 0.6, 'head-to-head': 0.6, intersection: 0.6 };
function drawTwists(legs, o, seed) {
  const total = legs.length;
  const pins = o.twistPins || {};
  const open = [];
  for (const l of legs) {
    const pin = pins[l.n];
    if (l.n < 2 || l.n > total - 2) continue;
    if (pin === 'none') { l.twist = null; continue; }
    if (LEG_TWISTS.includes(pin)) { l.twist = pin; continue; }
    if (!l.twist) open.push(l);
  }
  if (o.surprises === false) return;
  const rng = streamFor(seed, 'twists');
  for (let i = 0; i < 4; i++) rng();
  const has = k => legs.filter(l => l.twist === k).length;
  const want = [
    ['boomerang', Math.max(1, Math.round((total - 3) / 5))], ['yield', 1], ['zip-it', 1],
    ['boomerang-vote', total >= 8 ? 1 : 0],
  ];
  const lateFrom = Math.floor(total / 2);
  // the same twist two legs running is one twist too many
  const fits = (l, k) => legs[l.n - 2]?.twist !== k && legs[l.n]?.twist !== k && (k !== 'boomerang-vote' || l.n >= lateFrom);
  for (const [k, n] of want) {
    for (let i = has(k); i < n; i++) {
      const can = open.filter(l => !l.twist && fits(l, k));
      if (!can.length) break;
      can[Math.floor(rng() * can.length)].twist = k;
    }
  }
  // (drawn after the others, so a season's Boomerangs, Yield and Zip-It are where they always were)
  for (const [k, p] of Object.entries(OPTIONAL)) {
    const roll = rng(), at = rng();
    if (has(k) || roll >= p || total < 7) continue;
    const can = open.filter(l => !l.twist && fits(l, k));
    if (can.length) can[Math.floor(at * can.length)].twist = k;
  }
}
