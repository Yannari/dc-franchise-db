// ══════════════════════════════════════════════════════════════════════
// ss/kitty.js — the kitty ledger
// ══════════════════════════════════════════════════════════════════════
//
// Every housemate's money, and every movement of it with a reason, so a
// screen can show "where did Ana's $25,000 come from" and a test can prove
// the house never invents money (part 2 design §6). Two kinds of movement:
//
//   · a TRANSFER between housemates (a buzz, a dilemma, the red phone): the
//     house's total is unchanged;
//   · MINT / BURN against the Voice (mission rewards, Voice money, punishments,
//     auctions): the total moves, and the ledger says by how much.
//
// Plain JSON on gs.bb.secretStory (save-safe). Dollars (the user, 2026-10-27).

export const KITTY_START = 10000;
export const BUZZ_STAKE = 5000;

/** The ledger on a state object, created on first touch. */
export function ledgerOf(state) {
  state.kitty ||= {};
  state.kittyLog ||= [];
  state.kittyMinted ||= 0;
  state.kittyBurned ||= 0;
  return state;
}

/** Open every housemate's kitty at `amount`. */
export function openKitties(state, names, amount = KITTY_START, week = 0) {
  ledgerOf(state);
  for (const n of names) {
    state.kitty[n] = amount;
    state.kittyLog.push({ week, name: n, delta: amount, why: 'opening kitty' });
  }
  state.kittyOpened = (state.kittyOpened || 0) + amount * names.length;
}

export const balance = (state, n) => Number(state?.kitty?.[n]) || 0;

/** What a housemate can still lose: everything, until the semi-final validates the kitty (js/ss/final.js). */
const spendable = (state, n) => Math.max(0, balance(state, n) - (Number(state?.kittyValidated?.amounts?.[n]) || 0));

/** Money from one housemate to another. Clamped to what the payer has. */
export function transfer(state, from, to, amount, why, week = 0) {
  ledgerOf(state);
  const amt = Math.max(0, Math.min(Math.round(amount), spendable(state, from)));
  if (!amt) return 0;
  state.kitty[from] = balance(state, from) - amt;
  state.kitty[to] = balance(state, to) + amt;
  state.kittyLog.push({ week, name: from, delta: -amt, why, with: to });
  state.kittyLog.push({ week, name: to, delta: amt, why, with: from });
  return amt;
}

/** Money from the Voice (a mission, a game, a dilemma's offer). */
export function mint(state, to, amount, why, week = 0) {
  ledgerOf(state);
  const amt = Math.max(0, Math.round(amount));
  state.kitty[to] = balance(state, to) + amt;
  state.kittyMinted += amt;
  state.kittyLog.push({ week, name: to, delta: amt, why, from: 'the Voice' });
  return amt;
}

/** Money taken by the Voice (a punishment, a price). Clamped to the balance. */
export function burn(state, from, amount, why, week = 0) {
  ledgerOf(state);
  const amt = Math.max(0, Math.min(Math.round(amount), spendable(state, from)));
  state.kitty[from] = balance(state, from) - amt;
  state.kittyBurned += amt;
  state.kittyLog.push({ week, name: from, delta: -amt, why, to: 'the Voice' });
  return amt;
}

/** The whole kitty from one to another (a secret found). */
export const takeAll = (state, from, to, why, week = 0) => transfer(state, from, to, balance(state, from), why, week);

/** The total the ledger says the house should hold. */
export const expectedTotal = state => (state.kittyOpened || 0) + (state.kittyMinted || 0) - (state.kittyBurned || 0);
export const actualTotal = state => Object.values(state?.kitty || {}).reduce((a, b) => a + (Number(b) || 0), 0);
