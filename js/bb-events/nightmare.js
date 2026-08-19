// ══════════════════════════════════════════════════════════════════════
// bb-events/nightmare.js — the morning after the lights came on
// ══════════════════════════════════════════════════════════════════════
//
// The Nightmare Power fires once, at three in the morning, and the act itself
// carries that night. This family is the WEEK it leaves behind — because a
// house woken up to watch a ceremony get taken back does not go quietly back
// to normal, and until this file existed it did: the block changed, two bond
// hits landed, and nobody so much as mentioned it over breakfast.
//
// The design rule, straight from the person who plays this thing: THEY COULD
// TAKE IT WELL OR LESS WELL, REALLY DEPENDS. Nothing here has one reaction.
// The nominee who came down is relieved OR working out who owns them now; the
// one who went up blows up at the Head of Household OR reads the room and
// aims better; the HOH re-plans OR fumes. Temperament, intuition and
// strategic decide which — proportionally, never as a gate.
//
// The material the house can actually use: it watched everybody who walked
// into that Whacktivity room, weeks ago. The winner was told in private, but
// the door was public — `week.nightmareSuspects` is that list, the same way
// the Coin's buyer list is its family's material. The holder is IN the list
// and must never be singled out as more than a suspect.
import { pronouns } from '../players.js';
import { pStats, band } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

const _fired = ctx => (ctx?.week?.nightmareVoided || []).length === 2 ? ctx.week : null;
const _hoh = ctx => (ctx?.week?.hohSecret ? null : ctx?.week?.hoh) || null;
const _suspects = (ctx, house) =>
  (ctx?.week?.nightmareSuspects || []).filter(n => house.includes(n));

// ── the one who came down ─────────────────────────────────────────────
//
// Somebody spent a secret power on you, and you do not know who. Whether
// that is a rescue or a leash depends entirely on who you are.
const cameDown = {
  id: 'nightmare-came-down',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    const week = _fired(ctx);
    if (!week) return 0;
    // Rare state, so it speaks loudly when it exists — the same rule every
    // rare-state family here follows.
    return week.nightmareVoided.some(n => house.includes(n)) ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const week = _fired(ctx);
    const who = week.nightmareVoided.find(n => house.includes(n));
    if (!who) return null;
    const st = pStats(who);
    const p = pronouns(who);
    const watcher = _others(house, who)
      .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    // Trusting temperaments take the gift; suspicious ones read the price tag.
    // Proportional: intuition is how fast the second thought arrives.
    const uneasy = (st.intuition * 0.6 + (10 - st.temperament) * 0.4) >= 5.5;
    if (uneasy) {
      const text = _variant([
        `${who} was on the block at midnight and off it by four, and has not smiled once since. "Somebody spent that on me. Which means somebody thinks I owe them."`,
        `${who} keeps doing the maths out loud: whoever took ${p.obj} down did not do it for free. ${p.Sub} spends the morning watching faces instead of eating.`,
        `"I didn't ask anyone to save me." ${who} says it to ${watcher || 'the room'}, twice, which is once more than a relaxed person says it.`,
      ], ctx, who);
      if (watcher) {
        api.remember(watcher, who, 'suspects-a-leash', 1, { twist: 'nightmare-power' });
      }
      return { text, players: [who, watcher].filter(Boolean),
        badgeText: 'SAVED, AND COUNTING', badgeClass: 'grey' };
    }
    const text = _variant([
      `${who} came off that wall at three in the morning and has been cooking for the whole house since eight. Whoever did it, breakfast is the thank-you note.`,
      `${who} is lighter today than ${p.sub} has been all week, and does not care even slightly whose hand did it. Alive is alive.`,
      `"Best night's sleep I've had in this house." ${who} got four hours and is radiant about it, which tells everybody exactly how bad the block felt.`,
    ], ctx, who);
    api.popDelta(who, 1);
    return { text, players: [who], badgeText: 'DOWN, AND DELIGHTED', badgeClass: 'gold' };
  },
};

// ── the one who went up ───────────────────────────────────────────────
//
// Named at 3am by a Head of Household who did not choose to be naming anyone.
// A hothead aims at the only visible hand; a reader aims past it.
const wentUp = {
  id: 'nightmare-went-up',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    const week = _fired(ctx);
    if (!week) return 0;
    const noms = week.initialNominees || [];
    return noms.some(n => house.includes(n)) ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const week = _fired(ctx);
    const hoh = _hoh(ctx);
    const who = (week.initialNominees || []).find(n => house.includes(n) && n !== hoh);
    if (!who || !hoh || !house.includes(hoh)) return null;
    const st = pStats(who);
    const p = pronouns(who);
    // Reads the move: strategic and temperament together. High = they know a
    // forced hand when they see one; low = the only name they have is the HOH.
    const reads = (st.strategic * 0.55 + st.temperament * 0.45) >= 5.5;
    if (reads) {
      const suspects = _suspects(ctx, house).filter(n => n !== who);
      const text = _variant([
        `${who} corners ${hoh} and says the strangest sentence of the week: "I know that wasn't your list." Then ${p.sub} starts asking who was in that room.`,
        `${who} is on the block and is not angry at the person who put ${p.obj} there, which unsettles ${hoh} more than shouting would. "You got played same as me. So who played us?"`,
        `${who} spends the morning being conspicuously decent to ${hoh}, because a nominee who can count knows the pen was forced — and knows the vote still has to be survived.`,
      ], ctx, who);
      api.addBond(who, hoh, 0.5);
      if (suspects.length) {
        const aim = suspects[(ctx?.week?.num || 1) % suspects.length];
        api.suspicion(who, aim, 1.3);
        api.remember(who, aim, 'was-in-that-room', 1.5, { twist: 'nightmare-power' });
      }
      return { text, players: [who, hoh], badgeText: 'AIMED PAST THE PEN', badgeClass: 'blue' };
    }
    const text = _variant([
      `${who} does not care whose power it was. ${hoh} said the name, ${hoh} turned the key, and ${who} has been saying so, loudly, to anybody within range of the kitchen.`,
      `"YOUR mouth. MY name." ${who} is not interested in the mechanics of it, and ${hoh}'s explanation dies about four words in.`,
      `${who} slams a cupboard hard enough that production checks the hinge. The house files out of the kitchen and leaves ${hoh} standing in it.`,
    ], ctx, who);
    api.addBond(who, hoh, -0.8);
    api.popDelta(who, -0.5);
    return { text, players: [who, hoh], badgeText: 'BLAMES THE PEN', badgeClass: 'red' };
  },
};

// ── the house counts the room ─────────────────────────────────────────
//
// Everybody saw who walked through that door weeks ago. Now the door means
// something, and the list gets counted out loud.
const countsTheRoom = {
  id: 'nightmare-counts-the-room',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    if (!_fired(ctx)) return 0;
    return _suspects(ctx, house).length >= 2 ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const suspects = _suspects(ctx, house);
    const counter = _others(house, ...suspects)
      .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
    if (!counter || suspects.length < 2) return null;
    const named = suspects.slice(0, 3);
    const text = _variant([
      `${counter} says it at the table like a weather report: "${named.join(', ')} played for that power. One of them just used it." Nobody answers, and three people stop chewing.`,
      `${counter} has the list by heart — everybody watched that door, weeks ago, and ${counter} is the one who wrote it down. ${named[0]} feels the room recalibrate around ${pronouns(named[0]).obj}.`,
      `"We all saw who went in." ${counter} does not accuse anybody. ${counter} just leaves the list on the table and lets the house do the arithmetic itself.`,
    ], ctx, counter);
    for (const sName of named) api.suspicion(counter, sName, 0.9);
    api.remember(counter, named[0], 'counted-the-room', 1, { twist: 'nightmare-power' });
    return { text, players: [counter, ...named.slice(0, 2)],
      badgeText: 'THE ROOM IS COUNTED', badgeClass: 'grey' };
  },
};

// ── the Head of Household, dispossessed ───────────────────────────────
//
// They planned a week and had it rewritten in their own voice. Some rebuild
// by morning; some let the whole house know exactly how this feels.
const hohAfter = {
  id: 'nightmare-hoh-after',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    const week = _fired(ctx);
    const hoh = _hoh(ctx);
    return week && hoh && house.includes(hoh) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const st = pStats(hoh);
    const p = pronouns(hoh);
    const steady = (st.strategic * 0.5 + st.temperament * 0.5) >= 5.5;
    if (steady) {
      const text = _variant([
        `${hoh} is up before the coffee, re-counting votes for a block ${p.sub} did not choose. By nine there is a new plan, and by ten two people have already heard it.`,
        `${hoh} shrugs it off in the Diary Room: "Somebody spent a whole power to change my week. That means my week was worth a power." Then ${p.sub} goes back to work.`,
        `${hoh} treats the new block like weather — nobody's fault, everybody's problem — and starts building the vote for it as if it had been the plan all along.`,
      ], ctx, hoh);
      api.popDelta(hoh, 0.5);
      return { text, players: [hoh], badgeText: 'REBUILT BY NINE', badgeClass: 'blue' };
    }
    const listener = _others(house, hoh)
      .sort((a, b) => pStats(b).social - pStats(a).social)[0];
    const text = _variant([
      `${hoh} has told the story of being woken up four times before lunch, and it gets angrier each telling. The room has started agreeing with ${p.obj} just to end it.`,
      `"What is the POINT of winning anything in this house?" ${hoh} says it to ${listener || 'the garden'}, and the garden does not have an answer either.`,
      `${hoh} wears the dispossession all day — door a little too hard, answers a little too short — and the house quietly notes that this is what ${hoh} is like when a plan dies.`,
    ], ctx, hoh);
    api.popDelta(hoh, -1);
    if (listener) api.remember(listener, hoh, 'saw-the-crack', 1, { twist: 'nightmare-power' });
    return { text, players: [hoh, listener].filter(Boolean),
      badgeText: 'STILL WOKEN UP', badgeClass: 'red' };
  },
};

export const NIGHTMARE_EVENTS = [cameDown, wentUp, countsTheRoom, hohAfter];
