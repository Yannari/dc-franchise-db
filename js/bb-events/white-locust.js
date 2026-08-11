// ══════════════════════════════════════════════════════════════════════
// bb-events/white-locust.js — the week after somebody did not check out
// ══════════════════════════════════════════════════════════════════════
//
// The resort shipped with its mechanic complete and no aftermath, which is the
// same shape Roadkill was in: a chain of public accusations happens, somebody
// is eliminated in front of everybody, and then the house behaves as though it
// had been an ordinary Tuesday.
//
// It is a richer record than Roadkill's, because nothing about the Call Out
// Chain is deniable. `week.acts` holds who sent whom up, in what order, with
// how long on the clock and whether the two of them were supposed to be
// working together. There is no guessing layer to build — the whole point of
// that night is that everybody saw it.
//
// So these read the chain and ask the questions the room would: what do you
// owe somebody who sent you up and was wrong about you, what does the person
// who nearly went home do with the rest of the week, and what happens to a
// caller whose target survived and is now standing in the kitchen.
import { pronouns } from '../players.js';
import { pStats, band, closestTo } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

/** The resort act, if this week had one. */
const _chain = ctx => (ctx?.week?.acts || []).find(a => a?.type === 'white-locust') || null;
/** Rounds where the target survived and both people are still here. */
const _survived = (house, ctx) => (_chain(ctx)?.rounds || [])
  .filter(r => r && r.made && !r.sweep && house.includes(r.caller) && house.includes(r.target));

// ── the one who sent you up is still here ─────────────────────────────
//
// The most useful thing about the chain is that it produces a public list of
// who was willing to risk whom. A survivor and their caller have to share a
// kitchen for four more days, and the survivor is the one holding the grudge
// with the moral high ground.
const calledOutAndSurvived = {
  id: 'locust-called-out-survived',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house' || !_chain(ctx)) return 0;
    return _survived(house, ctx).length ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const rounds = _survived(house, ctx);
    if (!rounds.length) return null;
    // The round with the most at stake: an ally sending an ally, if there was
    // one, and otherwise the tightest clock.
    const r = rounds.find(x => x.betrayal) || rounds.sort((a, b) => a.limit - b.limit)[0];
    const p = pronouns(r.target);
    const text = _variant([
      `${r.target} has not brought up the resort once, which ${r.caller} has noticed and would honestly prefer to being shouted at. It comes up eventually, in a kitchen, at a volume neither of them chose: "${r.limit} seconds. You gave me ${r.limit} seconds."`,
      `${r.caller} has an explanation ready for why it was ${r.target} and not anybody else, and has now given it three times without being asked. ${r.target} listens to all three and says the same thing each time, which is nothing.`,
      `The thing ${r.target} keeps returning to is not being called out. It is that ${r.caller} did not look at ${p.obj} while doing it. That detail is repeated to four different people before Thursday.`,
      `"You would have done the same" is ${r.caller}'s position, and it is probably true, and it is not helping. ${r.target} made the clock with ${Math.max(0, Math.round(r.limit - r.time))} seconds to spare and has decided that ${p.sub} ${p.sub === 'they' ? 'do' : 'does'} not owe ${r.caller} the benefit of the doubt for the rest of the summer.`,
    ], ctx, r.caller, r.target);
    api.addBond(r.caller, r.target, -1.2);
    const witness = closestTo(r.target, _others(house, r.target, r.caller));
    if (witness) api.addBond(witness, r.caller, -0.5);
    return {
      text,
      players: [r.target, r.caller, witness].filter((n, i, a) => n && a.indexOf(n) === i),
      badgeText: r.betrayal ? 'YOU SENT ME UP' : 'THE RESORT COMES UP',
      badgeClass: r.betrayal ? 'red' : 'grey',
    };
  },
};

// ── the survivor who now knows what the clock feels like ──────────────
//
// Everybody who made it through a turn did it with less time than the person
// before them. The last survivor came closest, and that is a fact about the
// week rather than a feeling: it changes how they play a competition.
const closestCall = {
  id: 'locust-closest-call',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house' || !_chain(ctx)) return 0;
    const act = _chain(ctx);
    return (act.survivors || []).some(s => house.includes(s.name)) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const act = _chain(ctx);
    const rounds = (act.rounds || []).filter(r => r.made && !r.sweep && house.includes(r.target));
    if (!rounds.length) return null;
    // Whoever had the least room between their time and their limit.
    const tight = rounds.sort((a, b) => (a.limit - a.time) - (b.limit - b.time))[0];
    const margin = Math.max(0, Math.round((tight.limit - tight.time) * 10) / 10);
    const p = pronouns(tight.target);
    const st = pStats(tight.target);
    const listener = closestTo(tight.target, _others(house, tight.target)) || null;
    const text = _variant([
      `${tight.target} did the maths afterwards and wishes ${p.sub} had not: ${margin} seconds. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} told ${listener || 'nobody'} the number and then immediately asked ${listener ? 'them' : 'the room'} to forget it.`,
      `${margin} seconds is what stood between ${tight.target} and a jury seat nobody would have voted for, and ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} not sleeping much on the back of it.`,
      `The resort has left ${tight.target} with a habit: counting. Out loud, in competitions, for the rest of the week, to the visible irritation of everybody in the yard.`,
      `${tight.target} keeps saying it was fine. It was ${margin} seconds from not being fine, and ${listener || 'the house'} can hear the difference between those two sentences.`,
    ], ctx, tight.target, String(margin));
    // A near miss reads well or badly on camera, and temperament decides which.
    api.popDelta(tight.target, (st.temperament || 5) >= 6 ? 1.2 : -0.8);
    if (listener) api.addBond(tight.target, listener, 0.7);
    return {
      text,
      players: [tight.target, listener].filter(Boolean),
      badgeText: `${margin}s TO SPARE`, badgeClass: 'gold',
    };
  },
};

// ── an empty chair with no vote attached to it ────────────────────────
//
// The part the house cannot process. Every other departure came with a vote,
// which means it came with people to blame and a decision to relitigate. This
// one arrived with a clock, and there is nobody to be angry at.
const noVoteToArgueWith = {
  id: 'locust-no-vote-to-argue-with',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house' || !_chain(ctx)) return 0;
    return _others(house).length >= 3 ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const act = _chain(ctx);
    const gone = act?.evicted;
    if (!gone) return null;
    const talkers = _others(house).sort((a, b) => pStats(b).social - pStats(a).social).slice(0, 2);
    if (talkers.length < 2) return null;
    const text = _variant([
      `Nobody has anything to count. ${talkers[0]} keeps starting sentences about ${gone} and stopping, because every one of them wants to end with a name and there is not one — the clock did it, in front of everybody, and the clock is not in the jury.`,
      `The house is used to the morning after being an investigation. This one is just a smaller room. ${talkers[0]} and ${talkers[1]} end up talking about the resort's carpet rather than about ${gone}, at length, which is how you can tell nobody knows what to do.`,
      `${talkers[1]} says out loud what the rest of them are working around: "There is nothing to be angry about." It is meant as comfort and lands as the worst part of it.`,
      `Somebody has cleared ${gone}'s things already, and the argument the house is having is about who did that, because it is the only decision from the last twenty-four hours that anybody actually made.`,
    ], ctx, gone, talkers[0]);
    api.addBond(talkers[0], talkers[1], 0.6);
    return {
      text, players: [...talkers],
      badgeText: 'NOBODY TO BLAME', badgeClass: 'grey',
    };
  },
};

// ── the reign nobody competed for ─────────────────────────────────────
//
// The chain crowns whoever survived fastest, which is not the same thing as
// winning a competition — and the house knows it. A Head of Household who got
// there by being quick in a corridor starts the week with an asterisk.
const theAsteriskReign = {
  id: 'locust-asterisk-reign',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house' || !_chain(ctx)) return 0;
    const hoh = _chain(ctx)?.hoh;
    return hoh && house.includes(hoh) ? band(7, 11) : 0;
  },
  fire(house, ctx, api) {
    const act = _chain(ctx);
    const hoh = act.hoh;
    const doubter = _others(house, hoh).sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
    if (!doubter) return null;
    const text = _variant([
      `${doubter} has done the arithmetic on how ${hoh} became Head of Household and does not love the answer: ${hoh} was fast at folding towels. It is not said in front of ${hoh}. It is said to everybody else.`,
      `There was no competition. There was a corridor and a stopwatch, and ${hoh} is running the week off it — which ${doubter} raises exactly once, lightly, as a joke, and then never lets go of.`,
      `${hoh} keeps calling it "when I won HOH", and ${doubter} keeps not correcting it, in a way that is louder than correcting it.`,
      `The house has decided this reign is on loan. ${doubter} is the one who says so, and ${hoh} finds out that ${doubter} said it about an hour before nominations.`,
    ], ctx, hoh, doubter);
    api.addBond(doubter, hoh, -0.8);
    api.suspicion(hoh, doubter, 0.3);
    return {
      text,
      players: [hoh, doubter],
      badgeText: 'AN ASTERISK REIGN', badgeClass: 'grey',
    };
  },
};

export const WHITE_LOCUST_EVENTS = [
  calledOutAndSurvived, closestCall, noVoteToArgueWith, theAsteriskReign,
];
