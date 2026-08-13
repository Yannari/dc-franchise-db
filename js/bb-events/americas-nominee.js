// ══════════════════════════════════════════════════════════════════════
// bb-events/americas-nominee.js — nominated by a room nobody can see
// ══════════════════════════════════════════════════════════════════════
//
// BB15's third chair, and the only anonymous nomination in this game where the
// culprit may genuinely not be in the building.
//
// That is the whole flavour, and it is different from Roadkill and the Hacker
// in one specific way: those twists hide a houseguest, so hunting is at least
// pointed at somebody real. Here the house is told a third nominee exists and
// is left to work out whether one of them did it or whether the country did —
// and in the direct variant the honest answer is that nobody in that room is
// guilty of anything. They will still find somebody.
//
// The MVP variant does hide a real person: the audience votes a houseguest
// Most Valuable Player and only that houseguest is told. So the same family
// covers a hunt with a right answer and a hunt without one, and the difference
// is invisible from inside the house, which is the joke.
//
// Rules: the MVP is never named as the MVP, and no beat may state that the
// audience chose a particular name — the house does not get to see the vote.
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

const _an = ctx => ctx?.week?.americasNominee || null;
/** Internal casting only — never narrated as the person who holds the vote. */
const _mvp = ctx => _an(ctx)?.mvp || null;

const _chairCast = (house, ctx) => {
  const a = _an(ctx);
  if (!a || !house.includes(a.nominee)) return null;
  const confidant = closestTo(a.nominee, _others(house, a.nominee));
  return { a, who: a.nominee, confidant };
};
const _huntCast = (house, ctx) => {
  const a = _an(ctx);
  if (!a) return null;
  const pool = _others(house, a.nominee);
  if (pool.length < 2) return null;
  const accuser = [...pool].sort((x, y) => pStats(x).temperament - pStats(y).temperament)[0];
  const accused = furthestFrom(accuser, _others(pool, accuser));
  return accuser && accused ? { a, accuser, accused } : null;
};
const _outsideCast = (house, ctx) => {
  const a = _an(ctx);
  if (!a || !house.length) return null;
  const reader = [...house].sort((x, y) => pStats(y).intuition - pStats(x).intuition)[0];
  const mark = _others(house, reader)[0] || null;
  return reader ? { a, reader, mark } : null;
};
const _cameraCast = (house, ctx) => {
  const a = _an(ctx);
  if (!a) return null;
  const pool = _others(house, a.nominee);
  const performer = [...pool].sort((x, y) => pStats(y).social - pStats(x).social)[0];
  const watcher = _others(pool, performer)[0] || null;
  return performer ? { a, performer, watcher } : null;
};
const _mvpCast = (house, ctx) => {
  const a = _an(ctx);
  const mvp = _mvp(ctx);
  if (!a || a.style !== 'mvp' || !mvp || !house.includes(mvp)) return null;
  const watcher = _others(house, mvp, a.nominee)
    .sort((x, y) => pStats(y).intuition - pStats(x).intuition)[0];
  return watcher ? { a, mvp, watcher } : null;
};

// ── the chair nobody in the room filled ───────────────────────────────
const theChair = {
  id: 'americas-chair',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _chairCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _chairCast(house, ctx);
    if (!cast) return null;
    const { who, confidant } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} is on the block and there is nobody to campaign to about the decision. The Head of Household did not make it, and whoever did cannot be pulled into the storage room for a conversation.`,
      `"Who do I even talk to?" ${who} asks ${confidant || 'the ceiling'}, and it is a real question with no answer in this building.`,
      `${who} has spent a week being liked by everybody in here and nominated anyway. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} starting to work out that the room ${p.sub} needed to be liked by was never in here.`,
      `Every other nominee this season could look at somebody and know who named them. ${who} looks around the kitchen and sees ${Math.max(0, house.length - 1)} faces that may have had nothing to do with it.`,
    ], ctx, who);
    api.popDelta(who, 1.5);
    if (confidant) api.addBond(who, confidant, 0.4);
    return { text, players: [who, confidant].filter(Boolean),
      badgeText: 'NOBODY TO CAMPAIGN TO', badgeClass: 'red' };
  },
};

// ── they hunt anyway ──────────────────────────────────────────────────
const huntAnyway = {
  id: 'americas-hunt',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _huntCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _huntCast(house, ctx);
    if (!cast) return null;
    const { a, accuser, accused } = cast;
    // In the direct variant there is genuinely nobody to catch, which does not
    // slow the house down at all.
    const guiltyExists = a.style === 'mvp';
    const text = _variant([
      `${accuser} does not believe for a second that nobody in this house had a hand in it, and has decided that somebody is ${accused}. There is no evidence because there is, in the ordinary sense, no crime.`,
      `"Somebody in here knows." ${accuser} says it in three separate rooms, and by the third one ${accused} is the name attached to it.`,
      `${accuser} builds a case out of who has been quiet and who has been odd, and arrives at ${accused}, who has been neither.`,
      `The house cannot accept an anonymous chair without a culprit, so it makes one. This week it is ${accused}.`,
    ], ctx, accuser, accused);
    api.suspicion(accuser, accused, 1.3);
    api.addBond(accused, accuser, -0.7);
    try { api.remember(accused, accuser, 'grudge', 1, { twist: 'bb-americas-nominee', guiltyExists }); } catch { /* texture */ }
    return { text, players: [accuser, accused],
      badgeText: guiltyExists ? 'A NAME, PROBABLY WRONG' : 'GUILTY OF NOTHING, NECESSARILY',
      badgeClass: 'red' };
  },
};

// ── the room they cannot see ──────────────────────────────────────────
const theOutsideRoom = {
  id: 'americas-outside-room',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _outsideCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _outsideCast(house, ctx);
    if (!cast) return null;
    const { reader, mark } = cast;
    const text = _variant([
      `${reader} says the quiet thing: there is a whole room voting on this game that none of them can see, has never met them, and has already decided who it likes. Nothing any of them do in here reaches it directly.`,
      `"We are being watched by people with an opinion." ${reader} says it as strategy, not paranoia, and ${mark || 'the room'} does not enjoy how obviously true it is.`,
      `${reader} points out that every argument in this house has now had an audience with a vote in it, which changes what an argument is for.`,
      `The third chair keeps filling and nobody in this room fills it. ${reader} has stopped hunting and started wondering what the people outside actually want.`,
    ], ctx, reader, mark);
    return { text, players: [reader, mark].filter(Boolean),
      badgeText: 'A ROOM THEY CANNOT SEE', badgeClass: 'blue' };
  },
};

// ── playing to the cameras ────────────────────────────────────────────
const playingToCamera = {
  id: 'americas-playing-to-camera',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _cameraCast(house, ctx) ? band(9, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _cameraCast(house, ctx);
    if (!cast) return null;
    const { performer, watcher } = cast;
    const p = pronouns(performer);
    const text = _variant([
      `${performer} has started addressing the cameras directly — not the diary room, the wall ones — and doing it where people can see ${p.obj} do it. There is a vote out there and ${p.sub} ${p.sub === 'they' ? 'intend' : 'intends'} to be its favourite.`,
      `${performer} is suddenly very kind to everybody, very loudly, in the rooms with the most cameras in them. ${watcher || 'The house'} has noticed the geography of it.`,
      `Somebody out there is choosing, so ${performer} has started performing for them and stopped bothering to hide it.`,
      `"They're watching all of it." ${performer} says it like a warning and behaves like it is an opportunity.`,
    ], ctx, performer, watcher);
    api.popDelta(performer, 1.5);
    if (watcher) api.suspicion(watcher, performer, 0.6);
    return { text, players: [performer, watcher].filter(Boolean),
      badgeText: 'PLAYING TO THE ROOM OUTSIDE', badgeClass: 'gold' };
  },
};

// ── the MVP, being no more curious than anybody else ──────────────────
const theMvp = {
  id: 'americas-mvp-quiet',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _mvpCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _mvpCast(house, ctx);
    if (!cast) return null;
    const { a, mvp, watcher } = cast;
    const st = pStats(mvp);
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const p = pronouns(mvp);
    const text = overplayed ? _variant([
      `${mvp} is extremely interested in who might have done this, and has a theory ready, and asks ${watcher} for ${p.posAdj} theory first. ${watcher} notices the order those happened in.`,
      `${mvp} defends ${a.nominee} more warmly than anybody else in the house, which is either kindness or the specific guilt of somebody who put them there.`,
      `${watcher} floats an invented detail about how the third nominee gets chosen and watches ${mvp} not correct it fast enough.`,
    ], ctx, mvp, watcher) : _variant([
      `${mvp} is exactly as baffled as everybody else about the third chair, and says so once, and then talks about something else for the rest of the night.`,
      `Somebody asks ${mvp} who ${p.sub} ${p.sub === 'they' ? 'think' : 'thinks'} did it. ${p.Sub} ${p.sub === 'they' ? 'shrug' : 'shrugs'} and names the country, which is both a joke and the truth.`,
      `${mvp} spends the evening being unhelpfully vague about a subject ${p.sub} ${p.sub === 'they' ? 'know' : 'knows'} more about than anybody in the house.`,
    ], ctx, mvp, watcher);
    if (overplayed) {
      api.suspicion(watcher, mvp, 1.4);
      try { api.remember(watcher, mvp, 'suspected-mvp', 1, { twist: 'bb-americas-nominee' }); } catch { /* texture */ }
    }
    return { text, players: [mvp, watcher],
      badgeText: overplayed ? 'A LITTLE TOO INVESTED' : 'AS BAFFLED AS ANYBODY',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

export const AMERICAS_NOMINEE_EVENTS = [
  theChair, huntAnyway, theOutsideRoom, playingToCamera, theMvp,
];
