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
import { pronouns } from '../players.js';
import { pStats, band, perceived, firedThisWeek } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
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
      const text = _variant([
        `${watcher} does the quiet arithmetic on ${who}: paid ${entry.price}, in public, without blinking. "That's not a scared person. That's a person with a plan and a budget."`,
        `${watcher} has stopped thinking of ${who} as furniture. Anybody who can put ${entry.price} on a table in this house has been earning it somewhere, and earning takes friends.`,
        `"${who} bought a seat like it was nothing." ${watcher} files the number away — not the money, the NERVE.`,
      ], ctx, who, watcher);
      api.suspicion(watcher, who, 1.1);
      api.remember(watcher, who, 'spends-like-a-player', 1, { twist: 'high-rollers-room' });
      return { text, players: [watcher, who], badgeText: 'RE-PRICED', badgeClass: 'grey' };
    }
    const text = _variant([
      `${watcher} watched ${who} walk to that door and read the walk, not the wallet: nobody comfortable pays for safety. ${who} is worried about something, and ${watcher} wants to know what.`,
      `"You don't buy an umbrella on a sunny day." ${watcher} says it lightly, about ${who}, to nobody in particular, and the kitchen goes thoughtful.`,
      `${watcher} clocks that ${who} paid the second the door opened — no hesitation, no shopping around. That is what it looks like when somebody already knows they are in trouble.`,
    ], ctx, who, watcher);
    api.remember(watcher, who, 'paid-scared', 1, { twist: 'high-rollers-room' });
    return { text, players: [watcher, who], badgeText: 'READ AT THE DOOR', badgeClass: 'blue' };
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
    const p = pronouns(who);
    const near = _others(house, who)
      .sort((a, b) => perceived(who, b) - perceived(who, a))[0];
    if (!near) return null;
    // A friend consoles; anybody else enjoys it. Perceived bond decides.
    const kind = perceived(who, near) >= 2;
    if (kind) {
      const text = _variant([
        `${near} finds ${who} on the hammock and does not mention the money once, which is the whole kindness. They talk about home until ${who} laughs at something.`,
        `"You played it. Most of them didn't have the nerve to." ${near} means it, and ${who} needed exactly one person to say it.`,
        `${near} makes ${who} a plate without being asked. Losing ${entry.price} in public is survivable; eating alone afterwards is worse.`,
      ], ctx, who, near);
      api.addBond(who, near, 0.8);
      return { text, players: [who, near], badgeText: 'CONSOLED', badgeClass: 'gold' };
    }
    const text = _variant([
      `${near} waits a beat and asks, very innocently, whether the room takes returns. ${who} laughs with everybody else because the alternative is worse.`,
      `The impression of ${who} paying ${entry.price} and walking out empty is being performed in the backyard by lunch. ${who} ${p.sub === 'they' ? 'have' : 'has'} to stand there and take it.`,
      `${near} is careful to be sympathetic in exactly the tone that is not sympathy. ${who} hears it, and adds a name to a private list.`,
    ], ctx, who, near);
    api.popDelta(who, -0.5);
    api.remember(who, near, 'laughed-at-the-loss', 1, { twist: 'high-rollers-room' });
    return { text, players: [who, near], badgeText: 'THE HOUSE COLLECTS TOO', badgeClass: 'grey' };
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
      const text = _variant([
        `${who} is done being told it was random by dinnertime. "The wheel didn't wake up and pick me. ${winner} PAID for that wheel to spin." The room goes carefully quiet.`,
        `${who} grants that nobody chose the name — and then points out, evenly, that somebody chose the SPIN, and the somebody is sitting right there enjoying immunity.`,
        `"Blame the wheel" lasts exactly as long as it takes ${who} to remember whose money started it turning. ${winner} feels the temperature change from across the room.`,
      ], ctx, who);
      api.addBond(who, winner, -1.0);
      api.remember(who, winner, 'bought-my-nomination', 1.5, { twist: 'chopping-block-roulette' });
      return { text, players: [who, winner], badgeText: 'FOLLOWS THE MONEY', badgeClass: 'red' };
    }
    const text = _variant([
      `${who} spends the day being angry at a piece of casino equipment, which is at least safe. The house lets ${pronouns(who).obj} have it — there is no vote a wheel can lose.`,
      `${who} keeps saying "at random" like the words might start meaning something better. Nobody argues, because there is genuinely nobody to argue WITH.`,
      `${who} is on the block and cannot even campaign against whoever did it, because nobody did it. It is the loneliest nomination this house hands out.`,
    ], ctx, who);
    api.popDelta(who, 0.5);
    return { text, players: [who], badgeText: 'ANGRY AT A WHEEL', badgeClass: 'grey' };
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
      const text = _variant([
        `${watcher} keeps coming back to it: ${who} never played a second of that competition and used a veto FIRST. "That's the best money anyone's spent in this house." It is said with admiration, which is worse than anger.`,
        `${watcher} re-ranks the house overnight. Anybody who can buy their way into a ceremony is not a floater, whatever they have been pretending.`,
        `"Fifty bucks and a good guess." ${watcher} says it twice, working out what else ${who} might be holding, and comes up uneasy.`,
      ], ctx, who, watcher);
      api.suspicion(watcher, who, 1.4);
      api.remember(watcher, who, 'spends-vetoes-like-chips', 1.5, { twist: 'veto-derby' });
      return { text, players: [watcher, who], badgeText: 'RE-RANKED', badgeClass: 'blue' };
    }
    const text = _variant([
      `${watcher} is still going at dinner: people TRAIN for that competition, and ${who} bought the result of it at a betting window. "It's not a game any more, it's a shop."`,
      `${watcher} wants it on record that ${who} took somebody off the block with a veto ${pronouns(who).sub} won lying down. The record is unmoved. The room is not.`,
      `"Congratulations on your GAMBLING." ${watcher} says it to ${who}'s face, and half the house laughs and the other half agrees.`,
    ], ctx, who, watcher);
    api.addBond(watcher, who, -0.6);
    api.popDelta(who, -0.5);
    return { text, players: [watcher, who], badgeText: 'BOUGHT, NOT WON', badgeClass: 'red' };
  },
};

export const HIGH_ROLLERS_EVENTS = [walkedIn, lostTheSeat, wheeledUp, secondVeto];
