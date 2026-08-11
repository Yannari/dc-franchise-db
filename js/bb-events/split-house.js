// ══════════════════════════════════════════════════════════════════════
// bb-events/split-house.js — half a house, and the half that is not there
// ══════════════════════════════════════════════════════════════════════
//
// The Split House already isolates properly: while a side is playing, the
// roster IS that side, so twenty modules that ask gs.activePlayers who is in
// this house get told the truth. What it did not have was anybody REACTING to
// it. Two disjoint weeks ran back to back, correctly, in silence.
//
// The material is the wall. A houseguest on one side spends the week without
// the person they needed, in a room small enough that every conversation is
// the whole house, listening to a competition they cannot see, working with
// somebody they would never have worked with because there is nobody else, and
// rehearsing what they will say when the two halves are put back together.
//
// One rule, and it is the same rule the isolation itself runs on: an event on
// this side may KNOW who is on the other side — you can see who walked through
// the door — and may know NOTHING about what is happening to them. Names, yes.
// Nominations, competitions, votes, evictions: never. Anything that leaks the
// other half's week is the twist undoing itself.
import { gs } from '../core.js';
import { pronouns } from '../players.js';
import { pStats, band, perceived, closestTo, furthestFrom } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

/** This side, or null when the house is whole. */
const _side = ctx => (ctx?.week?.splitSide ? ctx.week : null);
/** The people behind the wall. Visible as NAMES and nothing else. */
const _other = ctx => (_side(ctx)?.splitOther || []).filter(Boolean);

// Casting shared by weight() and fire(), because a positive weight is a
// promise the scheduler will hold this event to.
const _missingCast = (house, ctx) => {
  const away = _other(ctx);
  if (!away.length) return null;
  // The person on this side who lost the most when the sides were drawn.
  //
  // The threshold is low on purpose. A split house needs ten or more players,
  // so it lands early — and an early week has no +3 bonds in it yet, which is
  // exactly how this event sat dead in twenty seeded seasons. What matters is
  // that somebody's BEST available tie is on the wrong side of the wall, and
  // in week one a best tie of 1.5 is still the best tie they have.
  let best = null;
  for (const name of house) {
    let mine = 0;
    for (const here of house) {
      if (here === name) continue;
      mine = Math.max(mine, perceived(name, here) ?? 0);
    }
    let away_ = null;
    for (const gone of away) {
      const score = perceived(name, gone) ?? 0;
      if (!away_ || score > away_.score) away_ = { gone, score };
    }
    // RELATIVE, not absolute: the tie across the wall only has to beat
    // anything still on this side. An absolute floor can never pass on the
    // week a split actually runs — it needs ten or more players, so it lands
    // early, and an early house has no bonds in it yet. That floor is what
    // left this event dead in twenty seeded seasons.
    if (away_ && away_.score > mine && (!best || away_.score > best.score)) {
      best = { name, gone: away_.gone, score: away_.score };
    }
  }
  // And if the whole house is still strangers, the houseguest with the most
  // social investment is the one who notices the room got smaller.
  if (!best && house.length && away.length) {
    const sociable = [...house].sort((a, b) => pStats(b).social - pStats(a).social)[0];
    const gone = closestTo(sociable, away) || away[0];
    if (sociable && gone) best = { name: sociable, gone, score: 0 };
  }
  return best;
};
const _pickCast = (house, ctx) => {
  const picks = _side(ctx)?.splitPicks || [];
  if (!picks.length) return null;
  // Last name called on this side, and who left them there.
  for (let i = picks.length - 1; i >= 0; i--) {
    const p = picks[i];
    if (p && house.includes(p.picked) && house.includes(p.by) && p.picked !== p.by) {
      return { picked: p.picked, by: p.by, order: i + 1, of: picks.length };
    }
  }
  return null;
};
const _smallRoomCast = (house, ctx) => {
  if (!_side(ctx) || house.length > 6) return null;
  const talker = [...house].sort((a, b) => pStats(b).social - pStats(a).social)[0];
  const quiet = [...house].sort((a, b) => pStats(a).social - pStats(b).social)[0];
  return talker && quiet && talker !== quiet ? { talker, quiet } : null;
};
const _wallCast = (house, ctx) => {
  const away = _other(ctx);
  if (!away.length || !house.length) return null;
  const listener = [...house].sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return listener ? { listener, away } : null;
};
const _oddCoupleCast = (house, ctx) => {
  if (!_side(ctx) || house.length < 3) return null;
  const a = [...house].sort((x, y) => pStats(y).strategic - pStats(x).strategic)[0];
  const b = furthestFrom(a, _others(house, a));
  return a && b ? { a, b } : null;
};
const _reunionCast = (house, ctx) => {
  const away = _other(ctx);
  if (!away.length) return null;
  const planner = [...house].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  const target = away[0] || null;
  return planner && target ? { planner, target } : null;
};

/** A split week that has already finished, for the reunion afterwards. */
function _lastSplit(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w && w.num < now && w.splitSide) return w;
  }
  return null;
}
const _comparingCast = (house, ctx) => {
  const last = _lastSplit(ctx);
  if (!last || _side(ctx)) return null;                 // only once the wall is down
  const together = (last.splitOther || []).filter(n => house.includes(n));
  const ours = house.filter(n => !together.includes(n));
  if (!together.length || !ours.length) return null;
  const asker = [...ours].sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  const teller = [...together].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return asker && teller ? { asker, teller } : null;
};

// ── the last name called ──────────────────────────────────────────────
const pickedLast = {
  id: 'split-picked-last',
  category: 'social',
  weight(house, ctx) {
    if (!_side(ctx) || ctx.act !== 'house') return 0;
    return _pickCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _pickCast(house, ctx);
    if (!cast) return null;
    const { picked, by } = cast;
    const p = pronouns(picked);
    const text = _variant([
      `${picked} was the last name called, and everybody standing in that room heard the order it was called in. ${p.Sub} ${p.sub === 'they' ? 'say' : 'says'} it does not matter about four times, which is three more than somebody who meant it.`,
      `Being picked last is a fact with a number attached, and ${picked} has the number. ${by} chose everybody else first and now has to live in a very small house with the evidence.`,
      `${picked} laughs about going last. The laugh is fine. The look at ${by} immediately afterwards is the part worth watching.`,
      `Nobody says anything about the order the sides were picked in, which is how ${picked} knows everybody else remembers it too.`,
    ], ctx, picked, by);
    api.addBond(picked, by, -0.7);
    api.suspicion(picked, by, 0.6);
    try { api.remember(picked, by, 'picked-me-last', 1, { twist: 'bb-split-house' }); } catch { /* texture */ }
    return { text, players: [picked, by], badgeText: 'LAST NAME CALLED', badgeClass: 'red' };
  },
};

// ── the person who is not here ────────────────────────────────────────
const missingAlly = {
  id: 'split-missing-ally',
  category: 'social',
  weight(house, ctx) {
    if (!_side(ctx) || ctx.act !== 'house') return 0;
    return _missingCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _missingCast(house, ctx);
    if (!cast) return null;
    const { name, gone } = cast;
    const p = pronouns(name);
    const confidant = closestTo(name, _others(house, name));
    // Early splits happen between people who were only starting something;
    // later ones cut through a real alliance. The line has to fit both.
    const deep = (cast.score || 0) >= 2.5;
    const text = deep ? _variant([
      `${name} keeps starting sentences that were meant for ${gone} and finishing them at whoever is nearest. The person ${p.sub} ${p.sub === 'they' ? 'need' : 'needs'} to talk to this week is on the other side of a wall.`,
      `Every plan ${name} has made in this house had ${gone} in it. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} five days and none of them do.`,
      `${name} does the count on this side twice, hoping it comes out differently. ${gone} is still not on it.`,
      `"I don't have a single person in here." ${name} says it to ${confidant || 'the ceiling'}, forgetting for a second that ${confidant || 'whoever is listening'} is a person in here, which is exactly the problem ${gone} would have pointed out.`,
    ], ctx, name, gone) : _variant([
      `${name} had spent three days building something with ${gone} and gets to spend this week finding out whether three days was enough to survive not speaking.`,
      `The one person ${name} had started to trust walked out with the other side. ${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} to start again, in here, from nothing, with ${house.length - 1} strangers.`,
      `${name} watches ${gone} leave with the other half and does the maths on how much of a game ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} left in this room. It is not a long calculation.`,
      `${name} is not friendless in here so much as unfinished — everything ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} in the middle of is on the wrong side of a wall.`,
    ], ctx, name, gone);
    // A week apart is a week of not being protected, and it shows when the
    // wall comes down.
    api.addBond(name, gone, -0.2);
    if (confidant) api.addBond(name, confidant, 0.3);
    return { text, players: [name, confidant].filter(Boolean),
      badgeText: 'ON THE OTHER SIDE', badgeClass: 'blue' };
  },
};

// ── five people is not a house, it is a table ─────────────────────────
const smallRoom = {
  id: 'split-small-room',
  category: 'house-life',
  weight(house, ctx) {
    if (!_side(ctx) || ctx.act !== 'house') return 0;
    return _smallRoomCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _smallRoomCast(house, ctx);
    if (!cast) return null;
    const { talker, quiet } = cast;
    const p = pronouns(quiet);
    const text = _variant([
      `There is nowhere in this half of the house to have a conversation that is not the whole house having it. ${talker} tries anyway. ${quiet} can hear every word from the next room and does not pretend otherwise.`,
      `${house.length} people, four rooms, and no such thing as a private word. ${talker} has started talking in a whisper that carries further than ${p.posAdj} normal voice.`,
      `Whatever gets said on this side gets said in front of everybody on this side, which means every alliance here is public and every one of them knows it.`,
      `${quiet} has stopped leaving the room when people talk strategy, because leaving the room in a house this size is itself a statement.`,
    ], ctx, talker, quiet);
    api.suspicion(quiet, talker, 0.4);
    api.addBond(talker, quiet, -0.2);
    return { text, players: [talker, quiet], badgeText: 'NO ROOM TO WHISPER', badgeClass: 'grey' };
  },
};

// ── noise through the wall ────────────────────────────────────────────
const throughTheWall = {
  id: 'split-through-the-wall',
  category: 'house-life',
  weight(house, ctx) {
    if (!_side(ctx) || ctx.act !== 'house') return 0;
    return _wallCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _wallCast(house, ctx);
    if (!cast) return null;
    const { listener, away } = cast;
    const p = pronouns(listener);
    const named = away.slice(0, 2).join(' or ');
    const text = _variant([
      `Something happens on the other side loud enough to come through the wall — a horn, and then shouting, and then nothing. ${listener} stands under the vent for a while and learns precisely nothing.`,
      `${listener} has worked out that ${p.sub} can hear the other side's doors, and has started timing them. Doors are not information. ${p.Sub} ${p.sub === 'they' ? 'listen' : 'listens'} anyway.`,
      `A cheer goes up somewhere behind the wall. It could be ${named}. It could be anybody. This side spends twenty minutes deciding what it means and gets nowhere, because there is nowhere to get.`,
      `Whatever the other half just did, they did it loudly. ${listener} tells the room ${p.sub} ${p.sub === 'they' ? 'think' : 'thinks'} it was a competition. That is a guess wearing a fact's coat, and the room takes it as one.`,
    ], ctx, listener, named);
    return { text, players: [listener], badgeText: 'THROUGH THE WALL', badgeClass: 'grey' };
  },
};

// ── the alliance nobody would have made ───────────────────────────────
const oddCouple = {
  id: 'split-odd-couple',
  category: 'deals',
  weight(house, ctx) {
    if (!_side(ctx) || ctx.act !== 'house') return 0;
    return _oddCoupleCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _oddCoupleCast(house, ctx);
    if (!cast) return null;
    const { a, b } = cast;
    const text = _variant([
      `${a} and ${b} would not have said four words to each other with a full house to choose from. There is no full house this week, so they say considerably more than four, and by the end of it they have something that will still exist when the wall comes down.`,
      `Necessity does what charm never managed: ${a} sits down with ${b}, and neither of them mentions that this is the first real conversation they have had.`,
      `${a} counts the people on this side, works out that a majority of ${house.length} needs ${b} in it, and goes and gets ${b}. It is not friendship. It works like one for now.`,
      `${b} agrees to something with ${a} that ${b} would have laughed at last week, and both of them know exactly why the offer got made.`,
    ], ctx, a, b);
    api.addBond(a, b, 1.1);
    try { api.remember(b, a, 'worked-with-me-when-nobody-else-was-there', 1, { twist: 'bb-split-house' }); } catch { /* texture */ }
    return { text, players: [a, b], badgeText: 'NOBODY ELSE TO ASK', badgeClass: 'gold' };
  },
};

// ── rehearsing the reunion ────────────────────────────────────────────
const rehearsingReunion = {
  id: 'split-rehearsing-reunion',
  category: 'social',
  weight(house, ctx) {
    if (!_side(ctx) || ctx.act !== 'house') return 0;
    return _reunionCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _reunionCast(house, ctx);
    if (!cast) return null;
    const { planner, target } = cast;
    const p = pronouns(planner);
    const text = _variant([
      `${planner} is not playing this week so much as writing the first five minutes of next week: what gets said when the wall comes down, in what order, and to whom.`,
      `"When we're all back in, nobody on this side says a word about what happened in here." ${planner} proposes it as loyalty. It is a story, and ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} just made everybody a character in it.`,
      `${planner} has already decided what to tell ${target} about this week, and has started arranging events so the story will be almost true.`,
      `The wall comes down eventually and everybody has to explain themselves. ${planner} intends to explain first, which ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} correctly identified as most of the advantage.`,
    ], ctx, planner, target);
    api.popDelta(planner, 0.5);
    return { text, players: [planner], badgeText: 'WRITING THE STORY', badgeClass: 'blue' };
  },
};

// ── the wall comes down ───────────────────────────────────────────────
const comparingWeeks = {
  id: 'split-comparing-weeks',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _comparingCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _comparingCast(house, ctx);
    if (!cast) return null;
    const { asker, teller } = cast;
    // Whoever is best at this gets to decide what last week was.
    const spun = pStats(teller).strategic >= 6 && pStats(asker).intuition < 7;
    const text = spun ? _variant([
      `${asker} asks ${teller} what actually happened on the other side, and gets an account that is complete, coherent, and shaped. There is no way to check any of it, which ${teller} has clearly thought about.`,
      `${teller} tells this half of the house about last week in the order that suits ${pronouns(teller).obj} best. Every fact in it is true. The sentence they add up to is not.`,
      `"You had to be there." ${teller} says it about four different moments, and each time it closes a question ${asker} was halfway through asking.`,
    ], ctx, asker, teller) : _variant([
      `${asker} pushes ${teller} on the other side's week and catches a gap — a name that comes up twice and gets explained differently both times.`,
      `The two halves compare notes and the notes do not match. Nobody can prove which version is wrong, which is somehow worse than knowing.`,
      `${asker} listens to ${teller}'s account of last week and quietly decides it is about eighty percent true, then spends the evening working out which fifth is not.`,
    ], ctx, asker, teller);
    api.suspicion(asker, teller, spun ? 0.4 : 1.3);
    if (!spun) api.addBond(asker, teller, -0.4);
    return { text, players: [asker, teller],
      badgeText: spun ? 'THE OFFICIAL VERSION' : 'THE STORIES DO NOT MATCH',
      badgeClass: spun ? 'gold' : 'red' };
  },
};

export const SPLIT_HOUSE_EVENTS = [
  pickedLast, missingAlly, smallRoom, throughTheWall,
  oddCouple, rehearsingReunion, comparingWeeks,
];
