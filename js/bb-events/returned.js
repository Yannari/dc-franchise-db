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
import { pronouns } from '../players.js';
import { pStats, band, perceived } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
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
    return _returned(ctx, house) ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const back = _returned(ctx, house);
    const who = back.name;
    const p = pronouns(who);
    const st = pStats(who);
    const voter = _others(house, who)
      .sort((a, b) => perceived(who, a) - perceived(who, b))[0];
    if (!voter) return null;
    // Grace is a temperament; the ledger is everybody else's.
    const gracious = st.temperament >= 5.5;
    if (gracious) {
      const text = _variant([
        `${who} makes coffee for the exact people who evicted ${p.obj}, and hands the first cup to ${voter}. "Relax. If I held grudges I'd have unpacked angrier." Nobody fully relaxes, which is the point.`,
        `${who} tells the eviction story at breakfast like it happened to somebody else — funny, generous, no names underlined. The house laughs, gratefully, and watches ${p.obj} anyway.`,
        `"Clean slate," ${who} says, and seems to mean it, and the room breathes out. ${voter} is the only one who notices the slate is clean because ${who} has already memorised what was on it.`,
      ], ctx, who);
      api.popDelta(who, 1);
      api.addBond(who, voter, 0.4);
      return { text, players: [who, voter], badgeText: 'CLEAN SLATE, SAYS THE SLATE', badgeClass: 'gold' };
    }
    const text = _variant([
      `${who} sits down to breakfast opposite ${voter} and lets the silence do all the work. "Sleep well?" is the only thing ${p.sub} says, and it is somehow the worst thing anybody has ever said in this kitchen.`,
      `${who} has been back one day and has already recited the vote count from ${p.posAdj} eviction, from memory, twice, in rooms where the voters could hear it.`,
      `${who} is perfectly polite and completely unblinking, and the house understands that the eviction was not forgiven so much as FILED. ${voter} starts counting who else is on the list.`,
    ], ctx, who);
    api.remember(who, voter, 'voted-me-out-once', 1.5, { twist: 'battle-back' });
    api.remember(voter, who, 'came-back-counting', 1.5, { twist: 'battle-back' });
    return { text, players: [who, voter], badgeText: 'THE LEDGER IS OPEN', badgeClass: 'red' };
  },
};

// ── the house re-prices a person it already beat once ─────────────────
const rePriced = {
  id: 'returned-re-priced',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
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
      const text = _variant([
        `${reader} says the quiet part in the storage room: "We already beat ${who} once, and it did not TAKE. What exactly is the plan for a person the eviction doesn't work on?"`,
        `${reader} wants ${who} back on the block before ${who} finishes unpacking, and is starting the count today — "every week they're here, they know more than the last person we sent out."`,
        `${reader} has re-ranked the whole house overnight and ${who} came back at the top of it. Not for the comp win. For the fact that the house showed ${who} its whole hand and then let ${pronouns(who).obj} back in.`,
      ], ctx, who, reader);
      api.suspicion(reader, who, 1.4);
      api.remember(reader, who, 'the-eviction-did-not-take', 1.5, { twist: 'battle-back' });
      return { text, players: [reader, who], badgeText: 'PRICED AS UNFINISHED', badgeClass: 'grey' };
    }
    const text = _variant([
      `Half the house has quietly decided that ${who} coming back is the season telling them something, and being NICE to fate costs nothing. ${who} has not eaten alone since the door.`,
      `${reader} shrugs off the panic at the table: "They came back with nothing. No safety, no friends, same target." It is a good argument, and it would land better if ${who} were not visibly making friends behind ${reader} while it is made.`,
      `The house cannot decide if ${who} is a threat or a miracle, so it is treating ${pronouns(who).obj} as both — which this week means kindly.`,
    ], ctx, who, reader);
    api.popDelta(who, 0.5);
    return { text, players: [reader, who], badgeText: 'THE MIRACLE READ', badgeClass: 'blue' };
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
    const p = pronouns(defender);
    const st = pStats(defender);
    const owns = st.temperament >= 5.5;
    if (owns) {
      const text = _variant([
        `${defender} gets ahead of it at dinner: "You sent me to hold a door and I dropped it. Blame me, not the door." Owning it that cleanly buys back most of what losing cost.`,
        `${defender} takes the ribbing about the door with both hands — bows, apologises to the hinges — and the house lets it become a joke instead of a grievance.`,
        `"Next time send somebody better." ${defender} says it lightly, and means it a little, and the room quietly respects both halves.`,
      ], ctx, defender);
      api.popDelta(defender, 0.5);
      return { text, players: [defender, back.name], badgeText: 'DROPPED THE DOOR, OWNS IT', badgeClass: 'blue' };
    }
    const critic = _others(house, defender, back.name)
      .sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
    const text = _variant([
      `${critic || 'Somebody'} does the arithmetic out loud: the house elected ${defender} to keep ${back.name} out, and ${back.name} is currently eating cereal. ${defender} hears every word of it.`,
      `${defender} was chosen to defend that door and has spent today explaining the wind, the grip, the unfair angle of it. The house has stopped listening at "the wind".`,
      `Every time ${back.name} walks through a room this week, somebody looks at ${defender}. Nobody says anything. Nobody has to.`,
    ], ctx, defender);
    api.popDelta(defender, -1);
    if (critic) api.addBond(critic, defender, -0.5);
    return { text, players: [defender, critic].filter(Boolean),
      badgeText: 'THE DOOR HAS AN OWNER', badgeClass: 'red' };
  },
};

export const RETURNED_EVENTS = [firstMorning, rePriced, doorDefender];
