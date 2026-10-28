// ══════════════════════════════════════════════════════════════════════
// ss/powers.js — the cards: powers held in hand
// ══════════════════════════════════════════════════════════════════════
//
// Twist family 2, F2.1 (docs/superpowers/specs/2026-10-28-secret-story-powers-design.md). Everything else the
// Voice hands out acts before the house votes. The real cards were played AFTER the nominees were read:
//
//   'joker'    S4, S5, S6   cancel one nomination and put somebody else up;
//   'switch'   S9, S13      if the holder, or the one they protect, is nominated, they come off and the holder
//                           names a replacement (unused if nobody it covers goes up);
//   'immunity' S13 (ring)   a secret immunity, played on yourself when your name is read;
//   'thief'    S9, S12      before the nominations, take somebody's immunity this week;
//   'nominate' S13 (ring)   before the nominations, put one housemate up directly.
//
// A holder keeps the card secret and plays it when it pays (strategy, bonds, how it looks); a card nobody
// plays in three weeks is gone. At most one card is played after the result a night. Pure: state + ctx.

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

export const POWER_NAMES = { joker: 'the Joker', switch: 'the Switch', immunity: 'the secret immunity', thief: 'the immunity thief', nominate: 'the nomination ring' };

/** Hands a card to somebody. `protects`: the one a Switch covers besides the holder. */
export function grantPower(state, { kind, holder, week = 0, from = 'voice', protects = null } = {}) {
  if (!POWER_NAMES[kind] || !holder) return null;
  const p = { id: `${kind}-${holder}-${week}`, kind, holder, week, from, protects, used: null, expired: null };
  (state.powers ||= []).push(p);
  return p;
}
/** The cards still live for somebody in the house. */
export const liveCards = (state, house = [], week = 0) => (state.powers || []).filter(p => !p.used && !p.expired && house.includes(p.holder) && week - p.week <= 3 && week >= p.week + (p.kind === 'thief' || p.kind === 'nominate' ? 0 : 0));

/** Old cards expire. */
export function expireCards(state, week = 0) {
  for (const p of state.powers || []) if (!p.used && !p.expired && week - p.week > 3) p.expired = week;
}

/**
 * Before the nominations: the thief steals an immunity, the nomination ring puts somebody up.
 * Returns { immune, dOffice: [names], played: [...] }.
 */
export function cardsBeforeNominations(state, ctx, { house = [], immune = [], week = 0 } = {}) {
  const rng = ctx.rng || Math.random;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  let imm = [...immune];
  const dOffice = [];
  const played = [];
  for (const p of liveCards(state, house, week)) {
    if (p.kind === 'thief') {
      // somebody immune they would rather see exposed; kept for themselves (or handed to a friend)
      const victim = imm.filter(n => n !== p.holder).sort((a, b) => B(p.holder, a) - B(p.holder, b))[0];
      if (!victim || rng() > clamp(0.45 + S(p.holder, 'strategic') * 0.04, 0.2, 0.92)) continue;
      const friend = house.filter(n => n !== p.holder && n !== victim && !imm.includes(n)).sort((a, b) => B(p.holder, b) - B(p.holder, a))[0];
      const to = imm.includes(p.holder) && friend ? friend : p.holder;
      imm = imm.filter(n => n !== victim).concat(to);
      p.used = week; played.push({ kind: 'thief', holder: p.holder, from: victim, to });
    } else if (p.kind === 'nominate') {
      const target = house.filter(n => n !== p.holder && !imm.includes(n)).sort((a, b) => B(p.holder, a) - B(p.holder, b))[0];
      if (!target) continue;
      dOffice.push(target);
      p.used = week; played.push({ kind: 'nominate', holder: p.holder, target });
    }
  }
  return { immune: imm, dOffice, played };
}

/**
 * After the nominees are read: at most one card, the one that matters most. Returns { nominees, played }.
 * `tally`: the house's votes (the replacement for a saved nominee is the next most named, when the card says so).
 */
export function cardsAfterNominations(state, ctx, { house = [], nominees = [], immune = [], week = 0, tally = {}, locked = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const B = (a, b) => Number(ctx.bond(a, b)) || 0;
  const S = (n, k) => Number(ctx.stat(n, k)) || 5;
  const looks = n => Number(ctx.looks?.(n)) || 0;
  const eligible = (exclude = []) => house.filter(n => !nominees.includes(n) && !immune.includes(n) && !exclude.includes(n));
  const nextOfHouse = (ex = []) => eligible(ex).sort((a, b) => (Number(tally[b]) || 0) - (Number(tally[a]) || 0))[0];
  const foeOf = (h, ex = []) => eligible([h, ...ex]).sort((a, b) => B(h, a) - B(h, b))[0];
  const cards = liveCards(state, house, week);
  // the secret immunity: a holder whose name was read plays it, and the house's next name goes up
  for (const p of cards.filter(c => c.kind === 'immunity')) {
    // (a nomination for life cannot be cancelled by a card: `locked`)
    if (!nominees.includes(p.holder) || locked.includes(p.holder)) continue;
    const put = nextOfHouse([p.holder]);
    if (!put) continue;
    p.used = week;
    return { nominees: nominees.map(n => (n === p.holder ? put : n)), played: [{ kind: 'immunity', holder: p.holder, saved: p.holder, put }] };
  }
  // the Switch: it covers the holder and the one they protect
  for (const p of cards.filter(c => c.kind === 'switch')) {
    const covered = [p.holder, p.protects].filter(n => n && nominees.includes(n) && !locked.includes(n));
    if (!covered.length) continue;
    const saved = covered[0];
    const put = foeOf(p.holder, [saved]);
    if (!put) continue;
    p.used = week;
    return { nominees: nominees.map(n => (n === saved ? put : n)), played: [{ kind: 'switch', holder: p.holder, saved, put, protects: p.protects }] };
  }
  // the Joker: played to save a friend, or by a strategist to swap a weak target for a strong one
  for (const p of cards.filter(c => c.kind === 'joker')) {
    const friend = nominees.filter(n => n !== p.holder && !locked.includes(n) && B(p.holder, n) >= 3).sort((a, b) => B(p.holder, b) - B(p.holder, a))[0];
    const self = nominees.includes(p.holder) && !locked.includes(p.holder) ? p.holder : null;
    const saved = self || friend;
    const urge = self ? 0.9 : friend ? 0.45 + B(p.holder, friend) * 0.05 + S(p.holder, 'loyalty') * 0.02 : 0;
    // the longer it is held, the likelier it is played before it expires
    if (!saved || rng() > clamp(urge + (week - p.week) * 0.1 - looks(p.holder) * 0.05, 0, 0.97)) continue;
    const put = foeOf(p.holder, [saved]);
    if (!put) continue;
    p.used = week;
    return { nominees: nominees.map(n => (n === saved ? put : n)), played: [{ kind: 'joker', holder: p.holder, saved, put }] };
  }
  return { nominees, played: [] };
}
