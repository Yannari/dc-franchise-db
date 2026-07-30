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

import { pronouns } from '../players.js';
import {
  pStats, bond, perceived, band, bondFactor, closestTo, furthestFrom, trusts,
  dislikes, sharesAlliance, deFactoAllies, grudge, remembers, suspicionOf,
  targetOf, threat, biggestThreat, willScheme, isNice, isVillainous, archetype,
  trustOf, resentmentOf, beatsInvolving, actFacts,
} from './_read.js';

const _others = (house, ...x) => house.filter(n => n && !x.includes(n));
const _leastSeen = pool => [...pool].sort((a, b) => beatsInvolving(a) - beatsInvolving(b));
const _noms = ctx => (ctx?.nominees || []).filter(Boolean);
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
      `Nobody has power for another few hours, and it is the only time all week the house talks like people rather than positions. ${a} and ${b} get further in one conversation than they have in nine days.`,
      `${a} works out that this is the last hour ${p.sub} is safe by default, and spends it doing nothing at all about that.`,
      `The house is loud in the way it only gets before a competition. ${a}, ${b} and three others take up the kitchen and say nothing that matters, which is its own kind of relief.`,
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
      `${a} does the arithmetic before the competition rather than after it. "Whoever wins this, ${mark} goes up. Agreed?" ${b} agrees, and neither of them yet knows whether that promise will cost them anything.`,
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
      `${scrambler} has not spoken to ${hoh} properly in eleven days and makes up for all of it in one afternoon, which fools nobody including ${pronouns(hoh).obj}.`,
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
      `${avoider} was ${nominee}'s closest thing to a friend on Tuesday. It is Thursday, and ${avoider} has answered three direct questions with two words.`,
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
  weight(house, ctx) { return _noms(ctx).length ? at('post-noms', ctx, 8) : 0; },
  fire(house, ctx, api) {
    const safe = _leastSeen(_safe(house, ctx)).slice(0, 2);
    const [a, b] = safe;
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
      `${nominee} does not have to ask ${holder} outright, which is the strongest position anybody on the block can be in. ${p.Sub} asks anyway, once, quietly.`,
      `"You know what I'd do if it were the other way round." ${holder} does know. That is exactly the problem ${holder} has been sitting with all afternoon.`,
      `${nominee} makes the case in about ninety seconds and then leaves ${holder} alone with it, which is the smartest thing ${p.sub} does all week.`,
      `They have been close since the first night. Now one of them holds the only thing the other needs, and neither is enjoying it.`,
    ], ctx, nominee, holder) : _variant([
      `${nominee} has nothing to offer ${holder} but a future, and spends an hour describing one.`,
      `${holder} listens to the whole pitch politely. ${nominee} can tell from about the third sentence that it is not going to work and keeps going regardless.`,
      `"I'm not asking you to like me." It is the right approach and it is roughly nine days too late.`,
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
    if (!ctx?.vetoWinner || _noms(ctx).includes(ctx.vetoWinner)) return 0;
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

export const PHASE_EVENTS = [
  openField,
  prePositioning,
  scramble,
  powerChangesPeople,
  blockIsolation,
  safeRelief,
  lobbyingTheVeto,
  vetoHolderWeighs,
];

export default PHASE_EVENTS;
