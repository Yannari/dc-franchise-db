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
import { pStats, band, firedThisWeek } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _list = names => names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
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
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('nightmare-came-down', Number(ctx?.week?.num) || 0)) return 0;
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
    const watcher = _others(house, who)
      .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    // Trusting temperaments take the gift; suspicious ones read the price tag.
    // Proportional: intuition is how fast the second thought arrives.
    const uneasy = (st.intuition * 0.6 + (10 - st.temperament) * 0.4) >= 5.5;
    if (uneasy) {
      const scene = makeScene('nm.down', { a: who, b: watcher || null }, { ending: 'uneasy', intent: watcher ? 'seen' : 'alone' }, [], 'kitchen');
      if (watcher) {
        api.remember(watcher, who, 'suspects-a-leash', 1, { twist: 'nightmare-power' });
      }
      return { scene, players: [who, watcher].filter(Boolean),
        badgeText: 'SAVED, AND COUNTING', badgeClass: 'grey' };
    }
    const scene = makeScene('nm.down', { a: who, b: null }, { ending: 'delighted' }, [], 'kitchen');
    api.popDelta(who, 1);
    return { scene, players: [who], badgeText: 'DOWN, AND DELIGHTED', badgeClass: 'gold' };
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
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('nightmare-went-up', Number(ctx?.week?.num) || 0)) return 0;
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
    // Reads the move: strategic and temperament together. High = they know a
    // forced hand when they see one; low = the only name they have is the HOH.
    const reads = (st.strategic * 0.55 + st.temperament * 0.45) >= 5.5;
    if (reads) {
      const suspects = _suspects(ctx, house).filter(n => n !== who);
      const scene = makeScene('nm.up', { a: who, b: hoh }, { ending: 'reads' }, [], 'kitchen');
      api.addBond(who, hoh, 0.5);
      if (suspects.length) {
        const aim = suspects[(ctx?.week?.num || 1) % suspects.length];
        api.suspicion(who, aim, 1.3);
        api.remember(who, aim, 'was-in-that-room', 1.5, { twist: 'nightmare-power' });
      }
      return { scene, players: [who, hoh], badgeText: 'AIMED PAST THE PEN', badgeClass: 'blue' };
    }
    const scene = makeScene('nm.up', { a: who, b: hoh }, { ending: 'blames' }, [], 'kitchen');
    api.addBond(who, hoh, -0.8);
    api.popDelta(who, -0.5);
    return { scene, players: [who, hoh], badgeText: 'BLAMES THE PEN', badgeClass: 'red' };
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
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('nightmare-counts-the-room', Number(ctx?.week?.num) || 0)) return 0;
    if (!_fired(ctx)) return 0;
    return _suspects(ctx, house).length >= 2 ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const suspects = _suspects(ctx, house);
    const counter = _others(house, ...suspects)
      .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
    if (!counter || suspects.length < 2) return null;
    const named = suspects.slice(0, 3);
    const scene = makeScene('nm.count', { a: counter, b: named[0] }, { ending: 'scene', group: _list(named) }, [], 'kitchen');
    for (const sName of named) api.suspicion(counter, sName, 0.9);
    api.remember(counter, named[0], 'counted-the-room', 1, { twist: 'nightmare-power' });
    return { scene, players: [counter, ...named.slice(0, 2)],
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
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('nightmare-hoh-after', Number(ctx?.week?.num) || 0)) return 0;
    const week = _fired(ctx);
    const hoh = _hoh(ctx);
    return week && hoh && house.includes(hoh) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const hoh = _hoh(ctx);
    const st = pStats(hoh);
    const steady = (st.strategic * 0.5 + st.temperament * 0.5) >= 5.5;
    if (steady) {
      const scene = makeScene('nm.hoh', { a: hoh, b: null }, { ending: 'steady' }, [], 'hoh-room');
      api.popDelta(hoh, 0.5);
      return { scene, players: [hoh], badgeText: 'REBUILT BY NINE', badgeClass: 'blue' };
    }
    const listener = _others(house, hoh)
      .sort((a, b) => pStats(b).social - pStats(a).social)[0];
    const scene = makeScene('nm.hoh', { a: hoh, b: listener || null }, { ending: 'cracked' }, [], 'hoh-room');
    api.popDelta(hoh, -1);
    if (listener) api.remember(listener, hoh, 'saw-the-crack', 1, { twist: 'nightmare-power' });
    return { scene, players: [hoh, listener].filter(Boolean),
      badgeText: 'STILL WOKEN UP', badgeClass: 'red' };
  },
};

export const NIGHTMARE_EVENTS = [cameDown, wentUp, countsTheRoom, hohAfter];
