// ══════════════════════════════════════════════════════════════════════
// bb-events/high-rollers.js — the floor closes, and the house re-prices you
// ══════════════════════════════════════════════════════════════════════
//
// An audit of every twist's aftermath found the room to be the worst offender
// by this codebase's own rules. `entryNeed`'s comment calls walking through
// that door "the loudest thing anybody does all week" — and the module had
// ZERO bond or popularity writes, and no family read `week.highRollers` at
// all. Somebody could pay 125 in front of the whole house, lose it, watch a
// wheel rewrite the block, and the week would not contain one conversation
// about any of it.
//
// The rule that shapes every event here, stated by the person who plays this
// thing: THEY COULD TAKE IT WELL OR LESS WELL, REALLY DEPENDS. No uniform
// reactions. A buyer is read as desperate by one watcher and as dangerous by
// another; a loser is mocked or consoled; a second veto is respected or
// resented — decided by stats and bonds, proportionally, never by a gate.
//
// The privacy rule stands here too: what somebody PAID is public (the door
// is), a BALANCE never is, and no beat may state one.
import { pStats, band, perceived, firedThisWeek } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

const _room = ctx => ctx?.week?.highRollers || null;
const _entries = (ctx, house) =>
  (_room(ctx)?.entries || []).filter(e => e?.name && house.includes(e.name));

// ── the door, re-priced ───────────────────────────────────────────────
//
// Paying to enter told the house something you cannot take back. WHAT it told
// them depends on who is doing the reading: a strategist prices you as a
// threat with resources, an intuitive reader prices you as scared.
const walkedIn = {
  id: 'hrr-walked-in',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('hrr-walked-in', Number(ctx?.week?.num) || 0)) return 0;
    return _entries(ctx, house).length ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const entry = _entries(ctx, house)[0];
    if (!entry) return null;
    const who = entry.name;
    const watcher = _others(house, who)
      .sort((a, b) => (pStats(b).strategic + pStats(b).intuition)
        - (pStats(a).strategic + pStats(a).intuition))[0];
    if (!watcher) return null;
    const wst = pStats(watcher);
    // The same purchase, two readings — which one lands depends on the reader.
    const asThreat = wst.strategic >= wst.intuition;
    if (asThreat) {
      const scene = makeScene('roller.walked', { a: watcher, b: who }, { ending: 'threat', price: `${entry.price} BB Bucks` }, [], 'kitchen');
      api.suspicion(watcher, who, 1.1);
      api.remember(watcher, who, 'spends-like-a-player', 1, { twist: 'high-rollers-room' });
      return { scene, players: [watcher, who], badgeText: 'RE-PRICED', badgeClass: 'grey' };
    }
    const scene = makeScene('roller.walked', { a: watcher, b: who }, { ending: 'scared', price: `${entry.price} BB Bucks` }, [], 'kitchen');
    api.remember(watcher, who, 'paid-scared', 1, { twist: 'high-rollers-room' });
    return { scene, players: [watcher, who], badgeText: 'READ AT THE DOOR', badgeClass: 'blue' };
  },
};

// ── paid in full, walked out with nothing ─────────────────────────────
//
// The game can beat you, and losing in public is its own event. Whether the
// house is kind about it depends on who is closest to the loser.
const lostTheSeat = {
  id: 'hrr-lost-the-seat',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('hrr-lost-the-seat', Number(ctx?.week?.num) || 0)) return 0;
    return _entries(ctx, house).some(e => e.won === false) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const entry = _entries(ctx, house).find(e => e.won === false);
    if (!entry) return null;
    const who = entry.name;
    const near = _others(house, who)
      .sort((a, b) => perceived(who, b) - perceived(who, a))[0];
    if (!near) return null;
    // A friend consoles; anybody else enjoys it. Perceived bond decides.
    const kind = perceived(who, near) >= 2;
    if (kind) {
      const scene = makeScene('roller.lost', { a: who, b: near }, { ending: 'kind', price: `${entry.price} BB Bucks` }, [], 'backyard');
      api.addBond(who, near, 0.8);
      return { scene, players: [who, near], badgeText: 'CONSOLED', badgeClass: 'gold' };
    }
    const scene = makeScene('roller.lost', { a: who, b: near }, { ending: 'mocked', price: `${entry.price} BB Bucks` }, [], 'backyard');
    api.popDelta(who, -0.5);
    api.remember(who, near, 'laughed-at-the-loss', 1, { twist: 'high-rollers-room' });
    return { scene, players: [who, near], badgeText: 'THE HOUSE COLLECTS TOO', badgeClass: 'grey' };
  },
};

// ── the wheel's replacement, and the grievance with nowhere to land ───
//
// The wheel chose the replacement, so nobody chose them — but the spin only
// happened because somebody PAID for it, and some replacements can count.
const wheeledUp = {
  id: 'hrr-wheeled-up',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('hrr-wheeled-up', Number(ctx?.week?.num) || 0)) return 0;
    const swap = ctx?.week?.rouletteSwap;
    return swap?.up && house.includes(swap.up) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const swap = ctx.week.rouletteSwap;
    const who = swap.up;
    const winner = (ctx.week.rouletteSafe || []).find(n => n !== swap.down && house.includes(n));
    const st = pStats(who);
    // A counter blames the purchase; everybody else blames the sky.
    if (winner && st.strategic >= 6) {
      const scene = makeScene('roller.wheel', { a: who, b: winner }, { ending: 'follows' }, [], 'living-room');
      api.addBond(who, winner, -1.0);
      api.remember(who, winner, 'bought-my-nomination', 1.5, { twist: 'chopping-block-roulette' });
      return { scene, players: [who, winner], badgeText: 'FOLLOWS THE MONEY', badgeClass: 'red' };
    }
    const scene = makeScene('roller.wheel', { a: who, b: null }, { ending: 'wheel' }, [], 'living-room');
    api.popDelta(who, 0.5);
    return { scene, players: [who], badgeText: 'ANGRY AT A WHEEL', badgeClass: 'grey' };
  },
};

// ── the second veto, spent by somebody who never competed ─────────────
//
// The Derby's payoff: a houseguest uses a veto they won with a bet, before the
// person who actually earned one. Respect or outrage, per the watcher.
const secondVeto = {
  id: 'hrr-derby-second-veto',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('hrr-derby-second-veto', Number(ctx?.week?.num) || 0)) return 0;
    const dv = ctx?.week?.derbyVeto;
    return dv?.holder && house.includes(dv.holder) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const dv = ctx.week.derbyVeto;
    const who = dv.holder;
    const watcher = _others(house, who, dv.saved)
      .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
    if (!watcher) return null;
    const admires = pStats(watcher).strategic >= 6;
    if (admires) {
      const scene = makeScene('roller.derby', { a: watcher, b: who }, { ending: 'admires' }, [], 'kitchen');
      api.suspicion(watcher, who, 1.4);
      api.remember(watcher, who, 'spends-vetoes-like-chips', 1.5, { twist: 'veto-derby' });
      return { scene, players: [watcher, who], badgeText: 'RE-RANKED', badgeClass: 'blue' };
    }
    const scene = makeScene('roller.derby', { a: watcher, b: who }, { ending: 'bought' }, [], 'kitchen');
    api.addBond(watcher, who, -0.6);
    api.popDelta(who, -0.5);
    return { scene, players: [watcher, who], badgeText: 'BOUGHT, NOT WON', badgeClass: 'red' };
  },
};

export const HIGH_ROLLERS_EVENTS = [walkedIn, lostTheSeat, wheeledUp, secondVeto];
