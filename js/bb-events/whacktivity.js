// ══════════════════════════════════════════════════════════════════════
// bb-events/whacktivity.js — everybody saw which door you walked through
// ══════════════════════════════════════════════════════════════════════
//
// Every other secret twist in this house hides the ACT. The Whacktivity hides
// the outcome and makes the WANTING public: three labelled doors, and you walk
// through one of them across a room full of people who are all watching which
// one. There is no version of playing this that is quiet.
//
// So this family is the only one that gets to work with facts. The house
// legitimately knows:
//
//   who walked through which door — and therefore which power they wanted
//   who refused to walk at all, which is its own announcement
//   which room opened, and so who the five suspects are
//
// And it does not know the one thing that matters: whether anybody won, or
// who. The suspect list is published in advance and is still wrong most of the
// time, which is a completely different flavour of paranoia from the Hacker's
// blind hunt — this one is concentrated, justified, and aimed at four innocent
// people and one guilty one.
//
// The rule: the winner is never named as the winner, and no beat may say a
// power changed hands. Everything else about that night is fair game, because
// the house was standing there.
import { gs } from '../core.js';
import { pronouns } from '../players.js';
import { pStats, band, perceived, closestTo, furthestFrom, isVillainous } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

const _whack = ctx => ctx?.week?.whacktivity || null;
const _rooms = ctx => (_whack(ctx)?.rooms || []).filter(Boolean);
const _openRoom = ctx => _rooms(ctx).find(r => r.opened) || null;
const _shutRooms = ctx => _rooms(ctx).filter(r => !r.opened && (r.entrants || []).length);
/** Internal casting only — never narrated as having won anything. */
const _winner = ctx => _openRoom(ctx)?.winner || null;

// Casting shared by weight() and fire(), because a positive weight is a
// promise the scheduler holds the event to.
const _declaredCast = (house, ctx) => {
  const rooms = _rooms(ctx).filter(r => (r.entrants || []).length);
  for (const r of rooms) {
    const who = (r.entrants || []).find(n => house.includes(n));
    if (!who) continue;
    const watcher = _others(house, who)
      .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
    if (watcher) return { room: r, who, watcher };
  }
  return null;
};
const _crowdCast = (house, ctx) => {
  const room = _rooms(ctx)
    .filter(r => (r.entrants || []).filter(n => house.includes(n)).length >= 3)
    .sort((a, b) => b.entrants.length - a.entrants.length)[0];
  if (!room) return null;
  const inIt = room.entrants.filter(n => house.includes(n));
  return { room, a: inIt[0], b: inIt[1], rest: inIt.slice(2) };
};
const _shutCast = (house, ctx) => {
  const room = _shutRooms(ctx).find(r => (r.entrants || []).some(n => house.includes(n)));
  if (!room) return null;
  const who = room.entrants.find(n => house.includes(n));
  const watcher = _others(house, who)[0] || null;
  return who ? { room, who, watcher } : null;
};
const _satOutCast = (house, ctx) => {
  const sat = (_whack(ctx)?.satOut || []).filter(n => house.includes(n));
  if (!sat.length) return null;
  const who = [...sat].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  const reader = _others(house, who).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return reader ? { who, reader } : null;
};
const _suspectCast = (house, ctx) => {
  const room = _openRoom(ctx);
  const inIt = (room?.entrants || []).filter(n => house.includes(n));
  if (!room || inIt.length < 2) return null;
  const watcher = _others(house, ...inIt)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { room, inIt, watcher } : null;
};
const _hohCast = (house, ctx) => {
  const w = _whack(ctx);
  const hoh = w?.hoh;
  if (!hoh || !house.includes(hoh) || ctx?.week?.hohSecret) return null;
  const walkers = _rooms(ctx).flatMap(r => r.entrants || []).filter(n => house.includes(n) && n !== hoh);
  if (!walkers.length) return null;
  const mark = furthestFrom(hoh, walkers) || walkers[0];
  return { hoh, mark, count: walkers.length };
};
const _performCast = (house, ctx) => {
  const who = _winner(ctx);
  if (!who || !house.includes(who)) return null;
  const room = _openRoom(ctx);
  const watcher = _others(house, ...(room?.entrants || []))
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { who, watcher, room } : null;
};

/** A Whacktivity that already happened, for the suspicion it leaves behind. */
function _lastWhack(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w && w.num < now && now - w.num <= 1
      && w.whacktivity?.rooms?.some(r => r.opened && (r.entrants || []).length)) return w;
  }
  return null;
}
const _afterCast = (house, ctx) => {
  if (_whack(ctx)) return null;                       // not the same week
  const last = _lastWhack(ctx);
  const room = (last?.whacktivity?.rooms || []).find(r => r.opened && (r.entrants || []).length);
  const inIt = (room?.entrants || []).filter(n => house.includes(n));
  if (!inIt.length) return null;
  const watcher = _others(house, ...inIt)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return watcher ? { room, inIt, watcher } : null;
};

// ── you told everybody what you wanted ────────────────────────────────
const declaredIt = {
  id: 'whack-declared-it',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _declaredCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _declaredCast(house, ctx);
    if (!cast) return null;
    const { room, who, watcher } = cast;
    const p = pronouns(who);
    const text = _variant([
      `Nobody knows what happened behind that door. Everybody knows ${who} walked through the one marked ${room.power}, because everybody was standing there watching ${p.obj} do it.`,
      `${watcher} does not need to guess what ${who} wanted. The door said ${room.power}, and ${who} crossed the room in front of everybody to enter it.`,
      `"You wanted ${room.power}." ${watcher} says it as a fact, because it is one. ${who} cannot argue with a door ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} seen walking through.`,
      `${who} spends the evening being asked, lightly and repeatedly, why ${room.power} specifically. There is no good answer that is not also a confession about how ${p.posAdj} week is going.`,
    ], ctx, who, room.power);
    api.suspicion(watcher, who, 1.1);
    try { api.remember(watcher, who, 'wanted-power', 1, { twist: 'bb-whacktivity', door: room.power }); } catch { /* texture */ }
    return { text, players: [who, watcher], badgeText: 'SAID IT OUT LOUD', badgeClass: 'gold' };
  },
};

// ── the crowded door ──────────────────────────────────────────────────
const crowdedRoom = {
  id: 'whack-crowded-room',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _crowdCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _crowdCast(house, ctx);
    if (!cast) return null;
    const { room, a, b, rest } = cast;
    const others = rest.length ? ` (and ${rest.slice(0, 2).join(', ')})` : '';
    const text = _variant([
      `${a} and ${b}${others} all wanted the same thing badly enough to walk at it in front of everybody. They came out of that room knowing exactly how much competition they have, and it is each other.`,
      `The door marked ${room.power} took ${room.entrants.length} of them. That is not a secret alliance, it is a public list of people with identical plans.`,
      `${a} looks at ${b} in the ${room.power} queue and neither of them says the obvious thing, which is that one of them is now a problem for the other.`,
      `Everybody who wanted ${room.power} found out at the same moment that everybody else wanted it too. Nothing about the rest of this week gets easier for any of them.`,
    ], ctx, a, b);
    api.addBond(a, b, -0.6);
    api.suspicion(a, b, 0.7);
    api.suspicion(b, a, 0.7);
    return { text, players: [a, b, ...rest.slice(0, 2)], badgeText: 'A CROWDED DOOR', badgeClass: 'red' };
  },
};

// ── the door that never opened ────────────────────────────────────────
const stayedShut = {
  id: 'whack-stayed-shut',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _shutCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _shutCast(house, ctx);
    if (!cast) return null;
    const { room, who, watcher } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} paid the entire price of wanting ${room.power} and got none of it. The door never opened. The house still watched ${p.obj} walk to it, and that part does not get undone.`,
      `The worst outcome in this competition is not losing. It is ${who}'s: a room that did not open, a want that everybody now knows about, and nothing whatsoever to show for it.`,
      `${who} chose the wrong door and the wrong door was quiet. ${watcher || 'The house'} will remember the choice long after forgetting that it came to nothing.`,
      `"I didn't even get to play." ${who} is right, and it does not help — nobody in this house is filing ${p.obj} under 'did not play'. They are filing ${p.obj} under 'went for it'.`,
    ], ctx, who, room.power);
    // The cost lands even though the room stayed shut, which is the twist.
    if (watcher) api.suspicion(watcher, who, 0.9);
    api.popDelta(who, 0.5);
    return { text, players: [who, watcher].filter(Boolean),
      badgeText: 'PAID FOR NOTHING', badgeClass: 'red' };
  },
};

// ── the people who would not walk ─────────────────────────────────────
const satItOut = {
  id: 'whack-sat-it-out',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _satOutCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _satOutCast(house, ctx);
    if (!cast) return null;
    const { who, reader } = cast;
    const p = pronouns(who);
    const safe = pStats(who).strategic >= 6;
    const text = safe ? _variant([
      `${who} did not walk through anything, and that is a statement too: only somebody who thinks they are safe declines a free swing at power. ${reader} notices ${p.obj} thinking it.`,
      `${who} watched everybody else cross the room and stayed exactly where ${p.sub} ${p.sub === 'they' ? 'were' : 'was'}. ${reader} files that under comfortable, which is a much worse thing to be than ambitious.`,
      `"I didn't need it." ${who} says it lightly. ${reader} hears somebody who believes this week cannot touch ${p.obj}, and starts wondering why.`,
    ], ctx, who, reader) : _variant([
      `${who} could not decide fast enough and ended up choosing nothing, which the house has decided to read as choosing nothing.`,
      `${who} stayed on the sofa. Half the room thinks that was clever and the other half thinks ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} scared to be seen wanting something, and both halves say so.`,
      `Not walking was supposed to be invisible. ${reader} points out, to the room, exactly who did not move, and it stops being invisible.`,
    ], ctx, who, reader);
    api.suspicion(reader, who, safe ? 0.8 : 0.4);
    if (!safe) api.popDelta(who, -0.5);
    return { text, players: [who, reader],
      badgeText: safe ? 'TOO COMFORTABLE TO PLAY' : 'DID NOT MOVE',
      badgeClass: safe ? 'gold' : 'grey' };
  },
};

// ── five suspects, published in advance ───────────────────────────────
const suspectList = {
  id: 'whack-suspect-list',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _suspectCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _suspectCast(house, ctx);
    if (!cast) return null;
    const { room, inIt, watcher } = cast;
    const named = inIt.slice(0, 3).join(', ');
    const text = _variant([
      `The house cannot work out whether anybody came out of that room with anything. What it can do is name the ${inIt.length} people who were in it — ${named} — and watch all of them for a week.`,
      `${watcher} does not have to hunt for a suspect this time. The suspects walked into the room in front of everybody. ${watcher} just cannot tell WHICH of ${named} it is, which turns out to be nearly as bad.`,
      `Every one of ${named} spends the week being treated as though they are holding something, and at most one of them is.`,
      `"One of you has it." ${watcher} says it to the whole room offering ${room.power}, and gets ${inIt.length} identical shrugs back.`,
    ], ctx, inIt[0], watcher);
    inIt.forEach(n => api.suspicion(watcher, n, 0.9));
    return { text, players: [watcher, ...inIt.slice(0, 3)],
      badgeText: 'THE SUSPECTS ARE KNOWN', badgeClass: 'gold' };
  },
};

// ── the Head of Household watched all of it ───────────────────────────
const hohWatched = {
  id: 'whack-hoh-watched',
  category: 'ceremonies',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _hohCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _hohCast(house, ctx);
    if (!cast) return null;
    const { hoh, mark, count } = cast;
    const p = pronouns(hoh);
    const text = _variant([
      `${hoh} was the one person not allowed to play, and spent the whole thing watching ${count} houseguests walk across a room towards something that could be used on ${p.obj}. ${mark} was one of them.`,
      `The Head of Household does not get a door. ${hoh} gets a list instead, and ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} been keeping it since the first person stood up. ${mark} is on it.`,
      `"Interesting who moved." ${hoh} says it to nobody, watching ${mark} come back to the sofas, and everybody within earshot understands it was said to be overheard.`,
      `${hoh} cannot be in that room and cannot stop anybody else being in it either, which leaves exactly one thing to do about ${mark}: remember.`,
    ], ctx, hoh, mark);
    api.suspicion(hoh, mark, 1.2);
    try { api.remember(hoh, mark, 'went-for-power', 1, { twist: 'bb-whacktivity' }); } catch { /* texture */ }
    return { text, players: [hoh, mark], badgeText: 'THE HOH KEPT A LIST', badgeClass: 'red' };
  },
};

// ── somebody being very normal ────────────────────────────────────────
const beingNormal = {
  id: 'whack-being-normal',
  category: 'social',
  weight(house, ctx) {
    if (!_whack(ctx) || ctx.act !== 'house') return 0;
    return _performCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _performCast(house, ctx);
    if (!cast) return null;
    const { who, watcher, room } = cast;
    const st = pStats(who);
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const p = pronouns(who);
    const text = overplayed ? _variant([
      `${who} calls the room a waste of time before ${watcher} asks how it went. The answer is casual; volunteering it is not.`,
      `${who} keeps steering conversations away from the ${room.power} room with the enthusiasm of somebody steering a car. ${watcher} is in the passenger seat noticing every turn.`,
      `"Honestly it was nothing." ${who} says it once too often, and ${watcher} — who was not thinking about it — starts thinking about it.`,
    ], ctx, who, watcher) : _variant([
      `${who} is exactly as vague about that room as everybody else who was in it, which is the only correct amount of vague.`,
      `Somebody asks ${who} how it went. “Fine.” That is the whole answer, delivered with the same shrug everybody else brought back from the room.`,
      `${who} lets the subject die and does not resurrect it, which is harder than it sounds and is why nobody looks twice.`,
    ], ctx, who, watcher);
    if (overplayed) {
      api.suspicion(watcher, who, 1.5);
      try { api.remember(watcher, who, 'came-out-with-something', 1, { twist: 'bb-whacktivity' }); } catch { /* texture */ }
    }
    return { text, players: [who, watcher],
      badgeText: overplayed ? 'TOO KEEN TO DROP IT' : 'AS VAGUE AS EVERYBODY',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

// ── the week after ────────────────────────────────────────────────────
const stillWatching = {
  id: 'whack-still-watching',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _afterCast(house, ctx) ? band(7, 11) : 0;
  },
  fire(house, ctx, api) {
    const cast = _afterCast(house, ctx);
    if (!cast) return null;
    const { room, inIt, watcher } = cast;
    const text = _variant([
      `${watcher} can still name everyone who entered the ${room.power} room. What ${watcher} cannot tell is whether any of them left with an advantage.`,
      `A week on, ${inIt.slice(0, 2).join(' and ')} are still being handled slightly carefully by people who cannot say why out loud.`,
      `Nobody has produced anything. ${watcher} points out that nobody producing anything is exactly what holding something looks like.`,
      `The room that opened is old news everywhere except in the heads of the people who were not in it.`,
    ], ctx, watcher, inIt[0]);
    inIt.slice(0, 2).forEach(n => api.suspicion(watcher, n, 0.5));
    return { text, players: [watcher, ...inIt.slice(0, 2)],
      badgeText: 'STILL ON THE LIST', badgeClass: 'grey' };
  },
};

export const WHACKTIVITY_EVENTS = [
  declaredIt, crowdedRoom, stayedShut, satItOut,
  suspectList, hohWatched, beingNormal, stillWatching,
];
