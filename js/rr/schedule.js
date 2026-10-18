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
  const nonLegs = Math.round(o.nonElimShare * elimLegs);
  const total = elimLegs + nonLegs + 1;

  // Non-elimination legs: anywhere from leg 2 to leg total−2 (the last two are the
  // semi-final and the final).
  const eligible = [];
  for (let n = 2; n <= total - 2; n++) eligible.push(n);
  const nonAt = new Set(shuffle(eligible, rng).slice(0, nonLegs));

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
  return legs;
}
