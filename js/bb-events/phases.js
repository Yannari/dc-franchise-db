// ══════════════════════════════════════════════════════════════════════
// bb-events/phases.js — events that only make sense at one point in a week
// ══════════════════════════════════════════════════════════════════════
//
// A house does not behave the same way all week. What it does depends entirely
// on what it knows, and the week hands it four facts in order:
//
//   pre-hoh    nobody is safe and nobody is a target — the only stretch where
//              everyone is genuinely equal, and the only one where people talk
//              without calculating who is listening
//   post-hoh   somebody has power. Everything is now a reaction to that: the
//              scramble, the "we're good, right?", the sudden warmth toward a
//              person nobody sat with last week
//   post-noms  two people are on the block and the rest are not. The house
//              splits into the safe and the not-safe, and both know it
//   post-veto  somebody holds the veto and has not said what they will do.
//              That gap is the most lobbied hour of the week
//
// Everything here is gated on `ctx.phase`, so these cannot fire at the wrong
// moment — a "don't put me up" pitch is nonsense before anybody has power.

import { gs } from '../core.js';
import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, band, bondFactor, closestTo, furthestFrom, trusts,
  dislikes, sharesAlliance, deFactoAllies, grudge, remembers, suspicionOf,
  targetOf, threat, biggestThreat, willScheme, isNice, isVillainous, archetype,
  trustOf, resentmentOf, beatsInvolving, spotlightOrder, actFacts,
} from './_read.js';

const _others = (house, ...x) => house.filter(n => n && !x.includes(n));
/** Least-seen first, weighted toward whoever this week is about. */
const _leastSeen = pool => spotlightOrder(pool);
const _noms = ctx => (ctx?.nominees || []).filter(Boolean);

/** Last week's Head of Household, who cannot compete today. */
const outgoingHoh = () => gs.bb?.outgoingHoh || null;
const _safe = (house, ctx) => house.filter(n => n !== ctx?.hoh && !_noms(ctx).includes(n));

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.phase || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

/**
 * Only in this phase, and weighted to lead it.
 *
 * The multiplier is the point. These compete against the whole general library
 * inside a house act, and at parity they landed on 5% of beats — so the
 * phase-specific writing, the entire reason this file exists, barely appeared.
 * A house segment should be led by the thing that could only happen then.
 */
const at = (phase, ctx, value) => (ctx?.phase === phase ? band(value * 2.6, 34) : 0);

// ── pre-hoh: the only hours nobody has power ──────────────────────────

const openField = {
  id: 'phase-open-field',
  category: 'phases',
  weight(house, ctx) { return at('pre-hoh', ctx, 9); },
  fire(house, ctx, api) {
    const pool = _leastSeen(house);
    const [a, b] = [pool[0], pool[1]];
    const p = pronouns(a);
    const text = _variant([
      `Nobody has power for another few hours, and it is the only time all week the house talks like people rather than positions. ${a} and ${b} get further in one conversation than they have since the last competition.`,
      `${a} works out that this is the last hour ${p.sub} is safe by default, and spends it doing nothing at all about that.`,
      `The house gets louder as everyone waits for the competition. ${a} and ${b} sit in the kitchen joking with anyone too nervous to stay alone.`,
      `Everybody is equal for exactly as long as it takes to run one competition, and ${a} is the only person in the room who seems to know it.`,
    ], ctx, a, b);
    api.addBond(a, b, 0.6);
    api.popDelta(a, 1);
    return { text, players: [a, b], badgeText: 'LEVEL GROUND', badgeClass: 'blue' };
  },
};

const prePositioning = {
  id: 'phase-pre-positioning',
  category: 'phases',
  weight(house, ctx) {
    const schemers = house.filter(willScheme);
    return schemers.length ? at('pre-hoh', ctx, schemers.length * 2.2) : 0;
  },
  fire(house, ctx, api) {
    const a = _leastSeen(house.filter(willScheme))[0];
    const b = closestTo(a, _others(house, a));
    const mark = biggestThreat(_others(house, a, b)) || _others(house, a, b)[0];
    const p = pronouns(a);
    const text = _variant([
      `${a} pulls ${b} aside before the competition. “If either of us wins, ${mark} goes up. Agreed?” ${b} agrees and asks whether anyone else knows.`,
      `"I'm not saying I'll win," ${a} tells ${b}. "I'm saying if I do, you already know what happens." It is the cheapest deal in the game — made before anyone has anything to trade.`,
      `${a} gets a commitment out of ${b} while it is still free. By tonight it will not be free, and ${p.sub} knows exactly how much it will be worth then.`,
      `The competition has not started and ${a} has already told three people the same thing about ${mark}. That is not a plan yet. It is groundwork.`,
    ], ctx, a, b, mark);
    api.addBond(a, b, 0.7);
    api.remember(b, a, 'promise', 1, { promise: `${mark} goes up`, madeBefore: 'the competition' });
    api.setTarget(a, mark, 'set before anybody had power');
    return { text, players: [a, b], badgeText: 'GROUNDWORK', badgeClass: 'blue' };
  },
};

// ── post-hoh: somebody has power ──────────────────────────────────────

const scramble = {
  id: 'phase-scramble',
  category: 'phases',
  weight(house, ctx) { return ctx?.hoh ? at('post-hoh', ctx, 13) : 0; },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    const scrambler = _leastSeen(_others(house, hoh))
      .sort((a, b) => bond(a, hoh) - bond(b, hoh))[0];
    const p = pronouns(scrambler);
    const desperate = bond(scrambler, hoh) < 0;
    const text = desperate ? _variant([
      `${scrambler} is up the stairs before ${hoh} has finished celebrating, and the conversation is not subtle. Neither of them pretends it is about anything but survival.`,
      `"We're good, right?" ${hoh} says something reassuring. ${scrambler} leaves knowing ${p.sub} got nothing at all and having to act as though ${p.sub} did.`,
      `${scrambler} has barely spoken to ${hoh} until now and tries to make up for all of it in one afternoon, which fools nobody including ${pronouns(hoh).obj}.`,
      `The queue outside the HOH room is not literal, but ${scrambler} is definitely in it, and definitely aware of who is ahead of ${p.obj}.`,
    ], ctx, scrambler, hoh) : _variant([
      `${scrambler} goes up to congratulate ${hoh} and stays an hour. Nothing is promised. Everything is understood.`,
      `${hoh} wins and the first person through the door is ${scrambler}, which the rest of the house notices and files.`,
      `"I don't need anything from you this week." ${scrambler} means it, mostly, and it is the most effective thing anybody says to ${hoh} all day.`,
      `${scrambler} and ${hoh} talk for a long time about people who are not in the room.`,
    ], ctx, scrambler, hoh);

    api.addBond(scrambler, hoh, desperate ? 0.4 : 1.1);
    api.remember(hoh, scrambler, desperate ? 'grovel' : 'loyalty', 1, { when: 'the day of the win' });
    if (desperate) api.suspicion(hoh, scrambler, 0.6);
    return {
      text, players: [scrambler, hoh],
      badgeText: desperate ? 'SCRAMBLING' : 'PAYING RESPECTS',
      badgeClass: desperate ? 'red' : 'green',
    };
  },
};

const powerChangesPeople = {
  id: 'phase-power-changes-people',
  category: 'phases',
  weight(house, ctx) {
    if (!ctx?.hoh) return 0;
    // The less composed the new HOH, the more the power shows.
    return at('post-hoh', ctx, (10 - pStats(ctx.hoh).temperament) * 1.1);
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    const p = pronouns(hoh);
    const watcher = _leastSeen(_others(house, hoh)).find(n => pStats(n).intuition >= 5) || _others(house, hoh)[0];
    const text = _variant([
      `Power does something to ${hoh} within about four hours. ${watcher} notices it before ${hoh} does, and says nothing to anybody.`,
      `${hoh} starts a sentence with "as HOH" and the room goes very slightly quiet. ${p.Sub} does not appear to notice.`,
      `The room ${hoh} walks into is not the room ${p.sub} walked into yesterday, and ${p.sub} is enjoying the difference more than is strictly wise.`,
      `${watcher} watches ${hoh} hold court in the kitchen and quietly revises how dangerous ${p.sub} is going to be with nothing.`,
    ], ctx, hoh, watcher);
    api.popDelta(hoh, -1);
    api.suspicion(watcher, hoh, 1.1);
    api.remember(watcher, hoh, 'observation', 1, { about: 'how they hold power' });
    return { text, players: [hoh, watcher], badgeText: 'POWER SHOWS', badgeClass: 'grey' };
  },
};

// ── post-noms: the block exists ───────────────────────────────────────

const blockIsolation = {
  id: 'phase-block-isolation',
  category: 'phases',
  weight(house, ctx) { return _noms(ctx).length ? at('post-noms', ctx, 12) : 0; },
  fire(house, ctx, api) {
    const nominee = _leastSeen(_noms(ctx))[0];
    const p = pronouns(nominee);
    const avoider = _safe(house, ctx).sort((a, b) => bond(b, nominee) - bond(a, nominee))[0];
    const text = _variant([
      `The house is careful around ${nominee} in the way people are careful around the recently bereaved. ${avoider} in particular has developed somewhere else to be.`,
      `${nominee} sits down at a full table and it is not full for very long. Nobody is unkind. Everybody leaves.`,
      `Being on the block is mostly being alone in a crowded house, and ${nominee} learns that inside about six hours.`,
      `${avoider} was ${nominee}'s closest thing to a friend before nominations. Since the keys turned, ${avoider} has answered three direct questions with two words.`,
    ], ctx, nominee, avoider);
    api.addBond(nominee, avoider, -1.2);
    api.remember(nominee, avoider, 'abandonment', 2, { when: 'on the block' });
    api.popDelta(nominee, 2);
    return { text, players: [nominee, avoider], badgeText: 'ON THE OUTSIDE', badgeClass: 'grey' };
  },
};

const safeRelief = {
  id: 'phase-safe-relief',
  category: 'phases',
  // Two safe houseguests, not one. This is an event about a PAIR being quietly
  // relieved together, and the weight used to ask only whether anybody was
  // nominated — so on a double eviction, where the house is small and most of
  // it is on the block, `_safe` came back with a single name and the second
  // one narrated as "M and undefined are not on the block".
  weight(house, ctx) {
    return _noms(ctx).length && _safe(house, ctx).length >= 2 ? at('post-noms', ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const safe = _leastSeen(_safe(house, ctx)).slice(0, 2);
    const [a, b] = safe;
    if (!a || !b) return null;
    const nominee = _noms(ctx)[0];
    const text = _variant([
      `${a} and ${b} are not on the block and have the decency to be quiet about how relieved they are, for nearly an hour.`,
      `Somebody puts music on. ${a} works out halfway through that the two people it is loudest for are the two who cannot enjoy it.`,
      `"It's not us." ${b} says it once, to ${a}, in a whisper, and then feels bad enough about it to go and talk to ${nominee}.`,
      `The safe half of the house has a genuinely good evening, and will remember it as the week ${nominee} went up.`,
    ], ctx, a, b, nominee);
    if (a && b) api.addBond(a, b, 0.7);
    if (a) api.remember(a, nominee, 'guilt', 1, {});
    return { text, players: safe.filter(Boolean), badgeText: 'NOT US', badgeClass: 'green' };
  },
};

// ── post-veto: the most lobbied hour of the week ──────────────────────

const lobbyingTheVeto = {
  id: 'phase-lobby-veto',
  category: 'phases',
  weight(house, ctx) { return ctx?.vetoWinner ? at('post-veto', ctx, 14) : 0; },
  fire(house, ctx, api) {
    const holder = ctx.vetoWinner;
    const nominee = _noms(ctx).filter(n => n !== holder)
      .sort((a, b) => bond(b, holder) - bond(a, holder))[0] || _noms(ctx)[0];
    const p = pronouns(nominee);
    const hopeful = bond(nominee, holder) >= 2;
    const text = hopeful ? _variant([
      `${nominee} believes ${holder} will use the veto, but asks anyway. ${holder} tells ${p.obj} to stop worrying and gives ${p.obj} a hug.`,
      `"You know what I'd do if it were the other way round." ${holder} does know. That is exactly the problem ${holder} has been sitting with all afternoon.`,
      `${nominee} gives ${holder} a short pitch, asks them to think about it and leaves before the conversation turns into begging.`,
      `They have been close since ${ctx?.week?.num > 1 ? 'the first night' : 'move-in'}. Now one of them holds the only thing the other needs, and neither is enjoying it.`,
    ], ctx, nominee, holder) : _variant([
      `${nominee} has nothing to offer ${holder} but a future, and spends an hour describing one.`,
      `${holder} listens to the whole pitch politely. ${nominee} can tell from about the third sentence that it is not going to work and keeps going regardless.`,
      `"I'm not asking you to like me." It is the right approach, delivered only after every earlier conversation went wrong.`,
      `${nominee} finds ${holder} alone four separate times, and the fourth is one too many.`,
    ], ctx, nominee, holder);

    api.addBond(nominee, holder, hopeful ? 0.5 : -0.4);
    api.remember(holder, nominee, 'plea', hopeful ? 2 : 1, { about: 'the veto' });
    if (!hopeful) api.suspicion(holder, nominee, 0.5);
    return {
      text, players: [nominee, holder],
      badgeText: hopeful ? 'THE ASK' : 'PLEADING',
      badgeClass: hopeful ? 'gold' : 'grey',
    };
  },
};

const vetoHolderWeighs = {
  id: 'phase-veto-holder-weighs',
  category: 'phases',
  weight(house, ctx) {
    // Not the nominees — their decision is made for them — and not the Head of
    // Household either. This event is about being caught between the person in
    // power and the person on the block; an HOH who wins their own veto is not
    // caught between anything, and the card read as them making an enemy of
    // themselves.
    if (!ctx?.vetoWinner || _noms(ctx).includes(ctx.vetoWinner)) return 0;
    if (ctx.vetoWinner === ctx.hoh) return 0;
    return at('post-veto', ctx, 10);
  },
  fire(house, ctx, api) {
    const holder = ctx.vetoWinner;
    const hoh = ctx.hoh;
    const p = pronouns(holder);
    const text = _variant([
      `${holder} has the veto, is not on the block, and therefore has the only genuinely free choice anybody makes this week. ${p.Sub} hates it.`,
      `Using it makes an enemy of ${hoh}. Not using it makes an enemy of whoever stays up. ${holder} works this out and then works out that there is no third option.`,
      `${holder} asks ${hoh} what happens if the veto gets used. The answer is careful enough to be a threat.`,
      `Everybody wants to know what ${holder} is doing. ${p.Sub} does not know what ${p.sub} is doing, and has got very good at looking as though ${p.sub} does.`,
    ], ctx, holder, hoh);
    api.suspicion(holder, hoh, 0.7);
    api.remember(holder, hoh, 'pressure', 1, { about: 'the veto decision' });
    api.popDelta(holder, 1);
    return { text, players: [holder, hoh].filter(Boolean), badgeText: 'THE DECISION', badgeClass: 'gold' };
  },
};


// ── pre-hoh, continued ────────────────────────────────────────────────

const lastNightEqual = {
  id: 'phase-last-night-equal',
  category: 'phases',
  weight(house, ctx) { return at('pre-hoh', ctx, 7); },
  fire(house, ctx, api) {
    const group = _leastSeen(house).slice(0, 3);
    const [a, b, c] = group;
    const text = _variant([
      `${a}, ${b} and ${c} stay up knowing one of them will have power by lunchtime and none of them knows which. It makes everybody unusually pleasant.`,
      `Nobody has done anything to anybody yet this week. ${a} points this out as though it is a joke, and ${b} laughs as though it is.`,
      `The last hour before a competition is the friendliest the house ever gets, and ${a} has noticed the pattern well enough to distrust it.`,
      `${a} makes food for people who may eventually be voting on ${pronouns(a).obj}, and does it well.`,
    ], ctx, a, b, c);
    for (const x of group) for (const y of group) if (x !== y) api.addBond(x, y, 0.35);
    api.popDelta(a, 1);
    return { text, players: group.filter(Boolean), badgeText: 'BEFORE IT STARTS', badgeClass: 'blue' };
  },
};

const outgoingHohExposed = {
  id: 'phase-outgoing-exposed',
  category: 'phases',
  weight(house, ctx) {
    // Read the outgoing HOH from state, not from the acts: during pre-hoh the
    // HOH act does not exist yet, which is exactly the phase this event is for.
    const out = outgoingHoh();
    return out && house.includes(out) ? at('pre-hoh', ctx, 12) : 0;
  },
  fire(house, ctx, api) {
    const out = outgoingHoh();
    const p = pronouns(out);
    const angry = _others(house, out).sort((a, b) => grudge(b, out) - grudge(a, out))[0];
    const text = _variant([
      `${out} cannot compete today, which means ${p.sub} spends the whole competition watching other people decide ${p.posAdj} week.`,
      `Last week ${out} had the only room with a door. Today ${p.sub} has a bed in with everyone else and a very short list of friends.`,
      `${angry} has been waiting seven days for ${out} to be ordinary again, and is not subtle about the timing.`,
      `${out} works out that every single person still here remembers exactly who ${p.sub} nominated, and that ${p.sub} is now the only one who cannot win protection.`,
    ], ctx, out, angry);
    api.popDelta(out, -1);
    if (angry) {
      api.suspicion(angry, out, 1.3);
      api.setTarget(angry, out, 'they finally came down off the wall');
    }
    return { text, players: [out, angry].filter(Boolean), badgeText: 'NO LONGER SAFE', badgeClass: 'red' };
  },
};

// ── post-hoh, continued ───────────────────────────────────────────────

const hohRoomReveal = {
  id: 'phase-hoh-room',
  location: 'hoh-room',
  category: 'phases',
  weight(house, ctx) { return ctx?.hoh ? at('post-hoh', ctx, 10) : 0; },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    const p = pronouns(hoh);
    const invited = _leastSeen(_others(house, hoh)).sort((a, b) => bond(hoh, b) - bond(hoh, a)).slice(0, 2);
    const excluded = furthestFrom(hoh, _others(house, hoh, ...invited));
    const text = _variant([
      `The whole house crowds into the HOH room for the photographs, and everyone privately notes which two are still in there an hour later. It is ${invited.join(' and ')}.`,
      `${hoh} reads out the letter from home and the room is genuinely kind for four minutes. Then the door shuts on everybody except ${invited[0]}.`,
      `${hoh} gets the only room with a lock and discovers ${p.sub} has more close friends today than ${p.sub} had before the competition.`,
      `${excluded} is in the HOH room for the photographs and gone before the letter. ${pronouns(excluded).Sub} counts the people who stayed.`,
    ], ctx, hoh, ...invited);
    invited.forEach(n => { api.addBond(hoh, n, 0.8); api.remember(n, hoh, 'favour', 1, { about: 'the HOH room' }); });
    if (excluded) {
      api.addBond(hoh, excluded, -0.5);
      api.suspicion(excluded, hoh, 0.9);
    }
    api.popDelta(hoh, 2);
    return { text, players: [hoh, ...invited].filter(Boolean), badgeText: 'THE HOH ROOM', badgeClass: 'gold' };
  },
};

const targetsAlign = {
  id: 'phase-targets-align',
  category: 'phases',
  // The name being offered cannot be the person it is offered TO. Somebody
  // whose target happens to be the Head of Household was still eligible to
  // pitch, which produced "if you're looking at Bowie, so am I — the most
  // useful sentence anybody says to Bowie today", and a card with Bowie's
  // face on it twice. Walking into the HOH room to suggest nominating the
  // Head of Household is a different event, and not this one.
  weight(house, ctx) {
    if (!ctx?.hoh) return 0;
    const pitchers = house.filter(n => n !== ctx.hoh && targetOf(n) && targetOf(n) !== ctx.hoh);
    return pitchers.length ? at('post-hoh', ctx, pitchers.length * 3) : 0;
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh;
    const pitcher = _leastSeen(house.filter(n => n !== hoh && targetOf(n) && targetOf(n) !== hoh))[0];
    if (!pitcher) return null;
    const mark = targetOf(pitcher);
    const p = pronouns(pitcher);
    const text = _variant([
      `${pitcher} tells ${hoh} that ${mark} would nominate them next week. ${hoh} asks how ${pitcher} knows and listens closely to the answer.`,
      `"You don't owe me anything. But if you're looking at ${mark}, so am I." It is the most useful sentence anybody says to ${hoh} today.`,
      `${pitcher} has wanted ${mark} gone since ${ctx?.week?.num > 1 ? 'week one' : 'the first days in the house'} and has finally found somebody with the power to do it for ${p.obj}.`,
      `${pitcher} mentions that several people are worried about ${mark}, then leaves the HOH room before ${hoh} can ask who “several people” means.`,
    ], ctx, pitcher, hoh, mark);
    api.addBond(pitcher, hoh, 0.9);
    api.suspicion(hoh, mark, 1.6);
    api.remember(hoh, pitcher, 'intel', 2, { about: mark });
    return { text, players: [pitcher, hoh, mark].filter(Boolean), badgeText: 'A NAME OFFERED', badgeClass: 'blue' };
  },
};

// ── post-noms, continued ──────────────────────────────────────────────

const nomineeReckons = {
  id: 'phase-nominee-reckons',
  category: 'phases',
  weight(house, ctx) { return _noms(ctx).length ? at('post-noms', ctx, 11) : 0; },
  fire(house, ctx, api) {
    const nominee = _leastSeen(_noms(ctx))[0];
    const p = pronouns(nominee);
    const needed = _safe(house, ctx).sort((a, b) => bond(nominee, b) - bond(nominee, a)).slice(0, 3);
    const text = _variant([
      `${nominee} counts the votes on ${p.posAdj} fingers, twice, and gets a number ${p.sub} does not like either time. ${needed[0]} is the difference.`,
      `Somewhere around two in the morning ${nominee} stops being upset and starts being useful, and writes a list of who ${p.sub} actually needs: ${needed.filter(Boolean).join(', ')}.`,
      `${nominee} counts the committed votes, the undecided votes and the people avoiding ${p.obj}. The current count sends ${p.obj} home, so ${p.sub} starts deciding whom to approach first.`,
      `${nominee} has until the eviction and three people to persuade, and the first of them will not look ${p.obj} in the eye.`,
    ], ctx, nominee, ...needed);
    needed.filter(Boolean).forEach(n => api.remember(nominee, n, 'needs', 1, { about: 'the vote' }));
    api.popDelta(nominee, 1);
    return { text, players: [nominee, ...needed.filter(Boolean).slice(0, 2)], badgeText: 'COUNTING', badgeClass: 'blue' };
  },
};

const houseTakesSides = {
  id: 'phase-house-takes-sides',
  category: 'phases',
  weight(house, ctx) { return _noms(ctx).length === 2 ? at('post-noms', ctx, 9) : 0; },
  fire(house, ctx, api) {
    const [a, b] = _noms(ctx);
    const safe = _safe(house, ctx);
    const forA = safe.filter(n => bond(n, a) > bond(n, b));
    const forB = safe.filter(n => bond(n, b) > bond(n, a));
    const text = _variant([
      `The house does not discuss it and the house has entirely decided. ${forA.length} of them are keeping ${a}; ${forB.length} are keeping ${b}. Neither nominee has been told.`,
      `Two names on the block and a room that has quietly split down the middle. ${a} is being fed; ${b} is being avoided.`,
      `Nobody says "I'm voting for you" out loud this early, so ${a} and ${b} both spend the day reading tone of voice for information it cannot carry.`,
      `By breakfast, the same people are sitting together again. Nobody mentions the vote, but the empty seats between the groups say enough.`,
    ], ctx, a, b);
    forA.forEach(n => api.addBond(n, a, 0.3));
    forB.forEach(n => api.addBond(n, b, 0.3));
    return { text, players: [a, b], badgeText: 'THE HOUSE SPLITS', badgeClass: 'grey' };
  },
};

// ── post-veto, continued ──────────────────────────────────────────────

const hohPressuresVeto = {
  id: 'phase-hoh-pressures-veto',
  category: 'phases',
  weight(house, ctx) {
    if (!ctx?.vetoWinner || !ctx?.hoh || ctx.vetoWinner === ctx.hoh) return 0;
    return at('post-veto', ctx, 12);
  },
  fire(house, ctx, api) {
    const hoh = ctx.hoh, holder = ctx.vetoWinner;
    const p = pronouns(hoh);
    const heavy = pStats(hoh).temperament <= 5 || isVillainous(hoh);
    const text = heavy ? _variant([
      `${hoh} does not ask ${holder} to leave the nominations alone. ${p.Sub} explains what next week looks like for people who make ${p.posAdj} weeks difficult, and lets ${holder} do the rest.`,
      `"It's your veto. Obviously." The sentence has a full stop in it that neither of them believes.`,
      `${hoh} reminds ${holder}, twice, who is not on the block this week and why. ${holder} does not enjoy either reminder.`,
      `The conversation lasts six minutes and ${holder} comes out of it knowing exactly what using the veto would cost.`,
    ], ctx, hoh, holder) : _variant([
      `${hoh} tells ${holder} what ${p.sub} wants, then says the final decision belongs to ${holder}. ${holder} asks if ${hoh} really means that.`,
      `"Use it if you need to. I'd rather you were straight with me than safe." ${holder} believes ${pronouns(hoh).obj}, and that is worth more to ${hoh} than the nominations.`,
      `${hoh} makes the case once, badly, and apologises for making it at all.`,
      `They talk about it like two people rather than two positions, and ${holder} is the one who ends up feeling obliged.`,
    ], ctx, hoh, holder);

    api.addBond(hoh, holder, heavy ? -0.7 : 0.9);
    api.remember(holder, hoh, heavy ? 'pressure' : 'respect', 2, { about: 'the veto' });
    if (heavy) api.suspicion(holder, hoh, 1.4);
    return {
      text, players: [hoh, holder],
      badgeText: heavy ? 'LEANED ON' : 'ASKED STRAIGHT',
      badgeClass: heavy ? 'red' : 'green',
    };
  },
};

const replacementFear = {
  id: 'phase-replacement-fear',
  category: 'phases',
  weight(house, ctx) {
    if (!ctx?.vetoWinner) return 0;
    const exposed = _safe(house, ctx);
    return exposed.length ? at('post-veto', ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const exposed = _leastSeen(_safe(house, ctx))
      .sort((a, b) => bond(a, ctx.hoh) - bond(b, ctx.hoh))[0];
    const p = pronouns(exposed);
    const text = _variant([
      `If the veto gets used, somebody has to go up in the empty chair, and ${exposed} has worked out that ${p.sub} is the obvious somebody.`,
      `${exposed} spends the day being extremely helpful to ${ctx.hoh}, which fools nobody and is not really meant to.`,
      `Nobody has said ${exposed}'s name all morning. When ${p.sub} enters a room, people keep changing the subject.`,
      `${exposed} would quite like the veto not to be used and cannot say so to anybody without explaining why ${p.sub} is worried.`,
    ], ctx, exposed);
    api.suspicion(exposed, ctx.hoh, 1.1);
    api.remember(exposed, ctx.hoh, 'fear', 1, { about: 'the empty chair' });
    api.popDelta(exposed, 1);
    return { text, players: [exposed, ctx.hoh].filter(Boolean), badgeText: 'THE EMPTY CHAIR', badgeClass: 'grey' };
  },
};

export const PHASE_EVENTS = [
  openField,
  prePositioning,
  scramble,
  powerChangesPeople,
  blockIsolation,
  safeRelief,
  lobbyingTheVeto,
  vetoHolderWeighs,
  lastNightEqual,
  outgoingHohExposed,
  hohRoomReveal,
  targetsAlign,
  nomineeReckons,
  houseTakesSides,
  hohPressuresVeto,
  replacementFear,
];

export default PHASE_EVENTS;
