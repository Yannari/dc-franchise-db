// ══════════════════════════════════════════════════════════════════════
// bb-events/camp-comeback.js — the people with nothing left to lose
// ══════════════════════════════════════════════════════════════════════
//
// A camper is the strangest person this game can produce. They have total
// information — they were in every conversation up to the moment they were
// voted out, and they are still in the room for every one after it — and no
// stake whatsoever. Nothing the house does can hurt them, because the worst
// has already happened.
//
// That makes them the only honest voice in the building, which is a genuine
// problem for everybody still playing: a camper can say the true thing out
// loud, at the table, in front of people who have spent nine weeks not saying
// it. And it makes them dangerous, because one of them is coming back.
//
// These cast from `gs.bb.camp` rather than from the house roster. Campers are
// deliberately not in the week's roster — they cannot compete, vote or be
// nominated — so the general event pool must never be able to reach for one
// and cast them as a voter or a nominee. This family reaches for them on
// purpose, and only for the things a camper can actually do.
import { gs } from '../core.js';
import { pronouns } from '../players.js';
import { pStats, band, closestTo, furthestFrom } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

/** Everybody living in the house with no game to play. */
const _camp = () => {
  try { return (gs.bb?.camp || []).filter(c => !c.returned && !c.gone).map(c => c.name); }
  catch { return []; }
};

const _campCast = (house, ctx) => {
  const camp = _camp();
  if (!camp.length || house.length < 3) return null;
  return { camp, who: camp[0] };
};
/** A camper and whoever voted them out, still living together. */
const _voterCast = (house, ctx) => {
  const camp = _camp();
  if (!camp.length) return null;
  const weeks = gs?.bb?.weeks || [];
  for (const name of camp) {
    const w = weeks.find(x => x?.evicted === name);
    const against = (w?.ballots || []).filter(b => b.evict === name)
      .map(b => b.voter).filter(n => house.includes(n));
    if (against.length) return { who: name, voter: against[0], all: against };
  }
  return null;
};
const _truthCast = (house, ctx) => {
  const camp = _camp();
  if (!camp.length || house.length < 4) return null;
  // The camper least inclined to be tactful, and the player it costs most.
  const who = [...camp].sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  const mark = [...house].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return mark ? { who, mark } : null;
};
const _dreadCast = (house, ctx) => {
  const camp = _camp();
  if (camp.length < 2 || !house.length) return null;
  const worried = [...house].sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  const threat = [...camp].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return worried ? { camp, worried, threat } : null;
};

// ── voted out, still at the table ─────────────────────────────────────
const stillAtTheTable = {
  id: 'camp-still-at-the-table',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _voterCast(house, ctx) ? band(12, 15) : 0;
  },
  fire(house, ctx, api) {
    const cast = _voterCast(house, ctx);
    if (!cast) return null;
    const { who, voter, all } = cast;
    const p = pronouns(voter);
    const text = _variant([
      `${voter} voted ${who} out and has to pass ${pronouns(who).obj} the milk every morning. `
        + `${p.Sub} ${p.sub === 'they' ? 'have' : 'has'} started taking breakfast late.`,
      `There is a version of this house where ${who} left and ${voter} never thought about it again. `
        + 'This is not that house.',
      `${all.length} people voted ${who} out and all ${all.length} of them are being extremely normal about it, `
        + `which ${who} finds funnier every day.`,
      `"You can stop apologising." ${who} says it kindly and ${voter} cannot, because the apology is the only `
        + 'thing making it bearable and it is only bearable for one of them.',
    ], ctx, who, voter);
    api.addBond(who, voter, -0.9);
    api.popDelta(who, 1);
    try { api.remember(who, voter, 'voted-me-out-and-lives-with-me', 2, { twist: 'bb-camp-comeback' }); } catch { /* texture */ }
    return { text, players: [who, voter], badgeText: 'STILL AT THE TABLE', badgeClass: 'red' };
  },
};

// ── the only person who can say it ────────────────────────────────────
const theOnlyHonestVoice = {
  id: 'camp-honest-voice',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _truthCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _truthCast(house, ctx);
    if (!cast) return null;
    const { who, mark } = cast;
    const p = pronouns(who);
    const text = _variant([
      `${who} says the thing out loud at the kitchen table — the one about ${mark} that everybody has `
        + `worked out and nobody will say — because there is nothing left in this house that can be done to ${p.obj}.`,
      `A camper cannot be nominated, cannot be voted out and cannot be bought, so when ${who} tells the room `
        + `exactly what ${mark} has been doing, the room has to deal with the fact that ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} no reason to lie.`,
      `${mark} has spent weeks managing what people believe. ${who} undoes a fortnight of it in one sentence `
        + 'over the washing up, and cannot be punished for it.',
      `"What are you going to do, evict me?" ${who} does not even say it unkindly. ${mark} has no answer, `
        + 'which the rest of the table also notices.',
    ], ctx, who, mark);
    api.suspicion(mark, who, 1.4);
    for (const n of _others(house, mark).slice(0, 3)) api.suspicion(n, mark, 0.8);
    api.popDelta(who, 1.5);
    return { text, players: [who, mark], badgeText: 'NOTHING LEFT TO LOSE', badgeClass: 'gold' };
  },
};

// ── one of them is coming back ────────────────────────────────────────
const oneIsComingBack = {
  id: 'camp-one-is-coming-back',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _dreadCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _dreadCast(house, ctx);
    if (!cast) return null;
    const { camp, worried, threat } = cast;
    const text = _variant([
      `${worried} does the count out loud: ${camp.length} of them in that room, one door, and every single `
        + `one of them knows exactly who voted for what. ${threat} is the name that keeps coming back.`,
      `The house has started being extremely warm to the camp, which is the clearest possible signal that `
        + 'everybody has worked out one of them is coming back.',
      `"Whoever walks out of that room has nine weeks of receipts." ${worried} says it once and then cannot `
        + 'stop thinking about which of their own conversations are on the list.',
      `${threat} has been quiet, pleasant and completely attentive for a fortnight, and ${worried} finds that `
        + 'considerably more frightening than the ones who have been angry.',
    ], ctx, worried, threat);
    api.suspicion(worried, threat, 1.2);
    return { text, players: [worried, threat], badgeText: 'ONE DOOR', badgeClass: 'red' };
  },
};

// ── living in the room with the small television ──────────────────────
const theCampRoom = {
  id: 'camp-the-room',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _campCast(house, ctx) ? band(9, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _campCast(house, ctx);
    if (!cast) return null;
    const { camp, who } = cast;
    const p = pronouns(who);
    const friend = closestTo(who, _others(house, ...camp)) || _others(house, ...camp)[0];
    const text = _variant([
      `${who} watches the veto competition on a small television in a room ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} not allowed to leave, `
        + 'and gets every answer right out loud, to nobody.',
      `The camp room has a bad bed, a small screen and no door onto the game. ${who} has started narrating `
        + `the competitions to ${camp.length > 1 ? 'the others' : 'the wall'} like a man commentating on his own funeral.`,
      `${friend ? `${friend} comes and sits in the camp room for an hour, which nobody asked ${friend} to do` : `${who} sits in the camp room alone`}. `
        + 'It is the kindest thing that happens all week and it changes nothing about the vote.',
      `${who} knows the whole house better than anybody still playing it, from a bed nobody else would sleep in.`,
    ], ctx, who, friend);
    if (friend) api.addBond(who, friend, 0.7);
    api.popDelta(who, 0.5);
    return { text, players: [who, friend].filter(Boolean),
      badgeText: 'THE SMALL TELEVISION', badgeClass: 'grey' };
  },
};

export const CAMP_EVENTS = [stillAtTheTable, theOnlyHonestVoice, oneIsComingBack, theCampRoom];
