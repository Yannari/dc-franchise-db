// ══════════════════════════════════════════════════════════════════════
// ss/signatures.js — the signature twists the engine plays (js/ss/twists.js)
// ══════════════════════════════════════════════════════════════════════
//
// THE MASTERS OF THE NOMINATIONS (season 7): a secret pair, chosen by the
// Voice, adds one housemate to the nominations every week, until the house
// unmasks them.
//
// THE HOUSE THIEVES (season 12): a pair starts with an empty kitty and steals
// from the others every week, until the house unmasks them.
//
// One way to unmask a ROLE for both: the house grows SUSPICIONS from what it
// sees (who keeps landing on the block, whose money keeps vanishing, and who
// seems to know), the sharp faster than the rest, with wrong suspects mixed
// in. When somebody is sure enough, they go to the confessional and name the
// pair. Right: the role is over and the pair pays for it. Wrong: the accuser
// pays the two they named, in front of everybody.
//
// Pure: state + ctx `{ stat, bond, rng, week }`.

import { transfer, burn, balance } from './kitty.js';

const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };
const bondOf = (ctx, a, b) => Number(ctx?.bond?.(a, b)) || 0;
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

export const ROLE_NAMES = { masters: 'the Masters of the Nominations', thieves: 'the House Thieves' };

/** The season's role, if its signature is one. */
export const roleOf = state => state?.role || null;

/** The Voice picks the pair on launch night: the sharpest players for the masters, the boldest for the thieves. */
export function castRole(state, ctx, { signature = null, house = [] } = {}) {
  if (!['masters', 'thieves'].includes(signature) || house.length < 8) return null;
  const rng = ctx.rng || Math.random;
  const skill = n => signature === 'masters' ? st(ctx, n, 'strategic') + st(ctx, n, 'intuition') * 0.5 : st(ctx, n, 'boldness') + st(ctx, n, 'strategic') * 0.5;
  const pair = house.slice().sort((a, b) => skill(b) - skill(a) + (rng() - 0.5) * 6).slice(0, 2);
  state.role = { id: signature, pair, active: true, exposedWeek: null, by: null, log: [], suspicion: {} };
  if (signature === 'thieves') {
    // they start with nothing (the money is the Voice's, not anybody else's)
    for (const n of pair) burn(state, n, balance(state, n), 'the thieves start at zero', 1);
  }
  return state.role;
}

/**
 * The role's week: the masters add a nominee, the thieves steal. Writes the
 * nomination (state.rules.dOffice) or the money, and grows the house's
 * suspicions. Returns the act, or null when the role is over.
 */
export function playRole(state, ctx, { house = [] } = {}) {
  const role = state.role;
  if (!role?.active) return null;
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const pair = role.pair.filter(n => house.includes(n));
  if (pair.length < 2) { role.active = false; return null; }
  let act;
  const clues = [];   // who the move points at, for the suspicions
  if (role.id === 'masters') {
    // the one both of them can stand least, not one of them
    const target = house.filter(n => !pair.includes(n)).sort((a, b) => (bondOf(ctx, pair[0], a) + bondOf(ctx, pair[1], a)) - (bondOf(ctx, pair[0], b) + bondOf(ctx, pair[1], b)) + (rng() - 0.5))[0];
    if (!target) return null;
    state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} };
    (state.rules.dOffice[week] ||= []).includes(target) || state.rules.dOffice[week].push(target);
    role.log.push({ week, target });
    // a target with a known feud points at whoever they feuded with
    for (const m of pair) if (bondOf(ctx, m, target) <= -2) clues.push(m);
    act = { type: 'ss-role', week, role: 'masters', pair, target,
      beats: [{ text: `The masters of the nominations strike again: ${target} is nominated.`, players: [target], badgeText: 'THE MASTERS', badgeClass: 'purple', part: 'role' }] };
  } else {
    // the thieves take from the two fattest kitties
    const marks = house.filter(n => !pair.includes(n)).sort((a, b) => balance(state, b) - balance(state, a)).slice(0, 2);
    const takes = [];
    marks.forEach((m, i) => {
      const amount = Math.min(balance(state, m), 1500 + Math.floor(rng() * 4) * 500);
      if (amount > 0) takes.push({ from: m, to: pair[i % 2], amount: transfer(state, m, pair[i % 2], amount, 'stolen by the house thieves', week) });
    });
    role.log.push({ week, takes });
    // a theft happens somewhere: whoever was near the kitties that night
    if (rng() < 0.5) clues.push(pair[Math.floor(rng() * 2)]);
    act = { type: 'ss-role', week, role: 'thieves', pair, takes,
      beats: [{ text: `The house thieves strike again: ${takes.map(t => `$${t.amount.toLocaleString('en-US')} from ${t.from}`).join(' and ')}.`, players: takes.map(t => t.from), badgeText: 'THE THIEVES', badgeClass: 'purple', part: 'role' }] };
  }
  // the house's suspicions grow: the sharp see the true pair, everybody sees some noise
  for (const n of house) {
    if (pair.includes(n)) continue;
    const s = (role.suspicion[n] ||= {});
    const sharp = st(ctx, n, 'intuition') / 10;
    for (const p of pair) s[p] = clamp((s[p] || 0) + sharp * 0.09 + (clues.includes(p) ? 0.08 : 0) + rng() * 0.04);
    // a wrong suspect: somebody they already dislike
    const wrong = house.filter(x => x !== n && !pair.includes(x)).sort((a, b) => bondOf(ctx, n, a) - bondOf(ctx, n, b))[0];
    if (wrong) s[wrong] = clamp((s[wrong] || 0) + (1 - sharp) * 0.08 + rng() * 0.04);
  }
  return act;
}

/**
 * The accusation (on the prime): the housemate surest of a pair names it in
 * the confessional. Returns the act, or null when nobody is sure enough yet.
 */
export function accuseRole(state, ctx, { house = [] } = {}) {
  const role = state.role;
  if (!role?.active) return null;
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const pair = role.pair.filter(n => house.includes(n));
  let best = null;
  for (const n of house) {
    if (pair.includes(n)) continue;
    const s = role.suspicion[n] || {};
    const top = Object.entries(s).filter(([x]) => house.includes(x) && x !== n).sort((a, b) => b[1] - a[1]).slice(0, 2);
    if (top.length < 2) continue;
    const sure = (top[0][1] + top[1][1]) / 2;
    // the bold press sooner
    const bar = 0.62 - st(ctx, n, 'boldness') * 0.015;
    if (sure >= bar && (!best || sure > best.sure)) best = { n, named: top.map(([x]) => x), sure };
  }
  if (!best || rng() > 0.8) return null;
  const right = best.named.every(x => pair.includes(x));
  let paid = 0;
  if (right) {
    role.active = false; role.exposedWeek = week; role.by = best.n;
    if (role.id === 'masters') {
      // the masters lose the power and go up themselves next week
      state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} };
      for (const p of pair) (state.rules.dOffice[week + 1] ||= []).includes(p) || state.rules.dOffice[week + 1].push(p);
    } else {
      // the thieves give it all back, to the one who caught them
      for (const p of pair) paid += transfer(state, p, best.n, balance(state, p), 'caught the house thieves', week);
    }
  } else {
    for (const x of best.named) paid += transfer(state, best.n, x, Math.min(2500, balance(state, best.n)), `wrongly accused ${x}`, week);
    // a wrong accusation cools the accuser's suspicion of those two
    for (const x of best.named) role.suspicion[best.n][x] = (role.suspicion[best.n][x] || 0) * 0.4;
  }
  return { type: 'ss-accusation', week, role: role.id, by: best.n, named: best.named, right, pair: right ? pair : null, paid,
    beats: [{ text: right ? `${best.n} unmasks ${ROLE_NAMES[role.id]}: ${pair.join(' and ')}.` : `${best.n} accuses ${best.named.join(' and ')} of being ${ROLE_NAMES[role.id]}, and is wrong.`,
      players: [best.n, ...best.named], badgeText: right ? 'UNMASKED' : 'WRONG', badgeClass: right ? 'gold' : 'red', part: 'accusation' }] };
}
