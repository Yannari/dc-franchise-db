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
import { pStats, band, closestTo, furthestFrom } from './_read.js';
import { makeScene } from '../bb/script/scene.js';
import { numberWord } from '../bb/script/inject.js';

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
    const scene = makeScene('camp.table', { a: who, b: voter }, { ending: 'scene', intent: all.length > 1 ? 'many' : 'one', tally: numberWord(all.length) }, [], 'kitchen');
    api.addBond(who, voter, -0.9);
    api.popDelta(who, 1);
    try { api.remember(who, voter, 'voted-me-out-and-lives-with-me', 2, { twist: 'bb-camp-comeback' }); } catch { /* texture */ }
    return { scene, players: [who, voter], badgeText: 'STILL AT THE TABLE', badgeClass: 'red' };
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
    const scene = makeScene('camp.honest', { a: who, b: mark }, { ending: 'scene' }, [], 'kitchen');
    api.addBond(mark, who, -0.8);
    for (const n of _others(house, mark).slice(0, 3)) api.suspicion(n, mark, 0.8);
    api.popDelta(who, 1.5);
    return { scene, players: [who, mark], badgeText: 'NOTHING LEFT TO LOSE', badgeClass: 'gold' };
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
    const scene = makeScene('camp.door', { a: worried, b: threat }, { ending: 'scene', campers: numberWord(camp.length) }, [], 'living-room');
    api.suspicion(worried, threat, 1.2);
    return { scene, players: [worried, threat], badgeText: 'ONE DOOR', badgeClass: 'red' };
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
    const friend = closestTo(who, _others(house, ...camp)) || _others(house, ...camp)[0];
    const scene = makeScene('camp.room', { a: who, b: friend || null }, { ending: 'scene', intent: friend ? 'visited' : 'alone' }, [], 'bedroom');
    if (friend) api.addBond(who, friend, 0.7);
    api.popDelta(who, 0.5);
    return { scene, players: [who, friend].filter(Boolean),
      badgeText: 'THE SMALL TELEVISION', badgeClass: 'grey' };
  },
};

export const CAMP_EVENTS = [stillAtTheTable, theOnlyHonestVoice, oneIsComingBack, theCampRoom];
