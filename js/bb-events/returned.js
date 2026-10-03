// ══════════════════════════════════════════════════════════════════════
// bb-events/returned.js — breakfast with the people who voted you out
// ══════════════════════════════════════════════════════════════════════
//
// The aftermath audit's last big gap. A houseguest walks back through a door
// the house closed on them — the Battle Back, or the Camp Comeback — and the
// following week contained not one scene about it. The return act itself
// carries the night; this family is the week after, which is where the twist
// actually lives: `battle-back.js`'s own comment says the winner re-enters
// with "no safety and a very long memory", and nothing was reading either.
//
// GATED ON THE PREVIOUS WEEK, not this one. Both returns happen at a week's
// close, after the eviction, so the house's first morning with the returnee
// is the next week's house life. The gate reads `gs.bb.weeks[num - 2]` —
// the record of the week that ended with the door opening.
//
// Same law as the whole aftermath shelf: THEY COULD TAKE IT WELL OR LESS
// WELL, REALLY DEPENDS — the returnee is gracious or keeps the ledger open,
// the voters are sheepish or defiant, and stats pick which, proportionally.
import { gs } from '../core.js';
import { pStats, band, perceived, firedThisWeek } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

/** The week that ended with somebody walking back in, if this week follows it. */
const _lastWeek = ctx => {
  const num = Number(ctx?.week?.num) || 0;
  if (num < 2) return null;
  return (gs.bb?.weeks || []).find(w => Number(w?.num) === num - 1) || null;
};
const _returned = (ctx, house) => {
  const prev = _lastWeek(ctx);
  const name = prev?.returnedHouseguest;
  return name && house.includes(name) ? { name, prev } : null;
};

// ── the first morning back ────────────────────────────────────────────
const firstMorning = {
  id: 'returned-first-morning',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('returned-first-morning', Number(ctx?.week?.num) || 0)) return 0;
    return _returned(ctx, house) ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const back = _returned(ctx, house);
    const who = back.name;
    const st = pStats(who);
    const voter = _others(house, who)
      .sort((a, b) => perceived(who, a) - perceived(who, b))[0];
    if (!voter) return null;
    // Grace is a temperament; the ledger is everybody else's.
    const gracious = st.temperament >= 5.5;
    if (gracious) {
      const scene = makeScene('returned.morning', { a: who, b: voter }, { ending: 'gracious' }, [], 'kitchen');
      api.popDelta(who, 1);
      api.addBond(who, voter, 0.4);
      return { scene, players: [who, voter], badgeText: 'CLEAN SLATE, SAYS THE SLATE', badgeClass: 'gold' };
    }
    const scene = makeScene('returned.morning', { a: who, b: voter }, { ending: 'ledger' }, [], 'kitchen');
    api.remember(who, voter, 'voted-me-out-once', 1.5, { twist: 'battle-back' });
    api.remember(voter, who, 'came-back-counting', 1.5, { twist: 'battle-back' });
    return { scene, players: [who, voter], badgeText: 'THE LEDGER IS OPEN', badgeClass: 'red' };
  },
};

// ── the house re-prices a person it already beat once ─────────────────
const rePriced = {
  id: 'returned-re-priced',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('returned-re-priced', Number(ctx?.week?.num) || 0)) return 0;
    return _returned(ctx, house) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const back = _returned(ctx, house);
    const who = back.name;
    const reader = _others(house, who)
      .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
    if (!reader) return null;
    const urgent = pStats(reader).strategic >= 6;
    if (urgent) {
      const scene = makeScene('returned.repriced', { a: reader, b: who }, { ending: 'urgent' }, [], 'pantry');
      api.suspicion(reader, who, 1.4);
      api.remember(reader, who, 'the-eviction-did-not-take', 1.5, { twist: 'battle-back' });
      return { scene, players: [reader, who], badgeText: 'PRICED AS UNFINISHED', badgeClass: 'grey' };
    }
    const scene = makeScene('returned.repriced', { a: reader, b: who }, { ending: 'miracle' }, [], 'kitchen');
    api.popDelta(who, 0.5);
    return { scene, players: [reader, who], badgeText: 'THE MIRACLE READ', badgeClass: 'blue' };
  },
};

// ── the one who was elected to hold the door, and did not ─────────────
//
// Battle Back only: the house PICKED its defender, the defender lost, and the
// door opened. That choice has an owner, and the week remembers it.
const doorDefender = {
  id: 'returned-door-defender',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('returned-door-defender', Number(ctx?.week?.num) || 0)) return 0;
    const back = _returned(ctx, house);
    const bb = back?.prev?.battleBack;
    if (!bb) return 0;
    const doorRound = (bb.rounds || []).find(r => r.label === 'THE DOOR');
    const defender = doorRound && [doorRound.a, doorRound.b].find(n => n !== bb.returned);
    return defender && house.includes(defender) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const back = _returned(ctx, house);
    const bb = back.prev.battleBack;
    const doorRound = (bb.rounds || []).find(r => r.label === 'THE DOOR');
    const defender = [doorRound.a, doorRound.b].find(n => n !== bb.returned);
    const st = pStats(defender);
    const owns = st.temperament >= 5.5;
    if (owns) {
      const scene = makeScene('returned.door', { a: defender, b: back.name }, { ending: 'owns' }, [], 'kitchen');
      api.popDelta(defender, 0.5);
      return { scene, players: [defender, back.name], badgeText: 'DROPPED THE DOOR, OWNS IT', badgeClass: 'blue' };
    }
    const critic = _others(house, defender, back.name)
      .sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
    const scene = makeScene('returned.door', { a: defender, b: critic || null }, { ending: 'blamed', target: back.name }, [], 'kitchen');
    api.popDelta(defender, -1);
    if (critic) api.addBond(critic, defender, -0.5);
    return { scene, players: [defender, critic].filter(Boolean),
      badgeText: 'THE DOOR HAS AN OWNER', badgeClass: 'red' };
  },
};

export const RETURNED_EVENTS = [firstMorning, rePriced, doorDefender];
