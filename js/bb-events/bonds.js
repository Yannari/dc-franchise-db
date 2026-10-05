// ══════════════════════════════════════════════════════════════════════
// bb-events/bonds.js — people, when the game is not looking
// ══════════════════════════════════════════════════════════════════════
//
// Almost everything in this library is game-facing. Two people are close
// because closeness is useful, they fall out because falling out has
// consequences, and a couple exists because a couple is two votes. All of that
// is true and none of it is the whole of living in a house for three months.
//
// Surveying the hundred and twenty-nine events before this file: the only KISS
// in the entire library was a sabotage — somebody kissing somebody to destroy a
// showmance on purpose. There was no event anywhere for two people simply being
// best friends, and the only versions of dislike were a hardening grudge and a
// public blow-up, both of which are the loud end of it. Nothing covered the
// ordinary end: the needling about the dishes, the room somebody leaves when
// another person walks in, the apology that does not land.
//
// So these are the scenes where the relationship is the point rather than the
// vehicle. They still have consequences — a house where affection is free and
// hostility is free is a house where neither means anything — but the
// consequences are about the relationship rather than about the vote.
//
// Three states, because the house only really has three: people who love each
// other, people who like each other, and people who have to share a kitchen
// with somebody they cannot stand.

import { gs, kinshipBetween, REL_KINSHIP } from '../core.js';
import {
  pStats, bond, perceived, band, beatsInvolving, spotlightOrder, grudge, romanceOf,
  romanceOn, sharesAlliance, archetype, suspicionOf,
} from './_read.js';
import { makeScene } from '../bb/script/scene.js';

/** Which room a scene happens in: by hash, never a die. */
function _room(rooms, ctx, ...people) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${people.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return rooms[hash % rooms.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _quiet = pool => spotlightOrder(pool);

/** Quiet hours. None of this belongs in a ceremony or on eviction night. */
const _quietTime = (ctx, value) => {
  if (['nominations', 'veto-ceremony', 'eviction'].includes(ctx?.act)) return 0;
  return band(value * (ctx?.act === 'campaign' ? 0.6 : 1));
};

const _once = (id, ctx) => !!ctx?.week?._bondFired?.[id];
const _spend = (id, ctx) => { if (ctx?.week) (ctx.week._bondFired ||= {})[id] = true; };

/** The warmest pair in the house who are NOT working an angle on each other. */
function _friends(house) {
  let best = null;
  for (const a of _quiet(house)) {
    for (const b of house) {
      if (a === b) continue;
      const warmth = Math.min(bond(a, b), bond(b, a));
      if (warmth < 4) continue;
      // A friendship, not an alliance. If the game already binds them, the
      // alliance events own that story.
      if (sharesAlliance(a, b)) continue;
      if (!best || warmth > best.warmth) best = { a, b, warmth };
    }
  }
  return best;
}

/** Two people who genuinely cannot stand each other. */
function _enemies(house) {
  let worst = null;
  for (const a of _quiet(house)) {
    for (const b of house) {
      if (a === b) continue;
      const heat = Math.min(-bond(a, b), -bond(b, a));
      if (heat < 2) continue;
      if (!worst || heat > worst.heat) worst = { a, b, heat };
    }
  }
  return worst;
}

/** A couple, for the scenes that are only about being a couple. */
function _pair(house) {
  if (!romanceOn()) return null;
  const a = _quiet(house).find(n => romanceOf(n) && house.includes(romanceOf(n)));
  return a ? { a, b: romanceOf(a) } : null;
}

// ── love ──────────────────────────────────────────────────────────────

const firstKiss = {
  id: 'bond-first-kiss',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    const pair = _pair(house);
    if (!pair || _once('bond-first-kiss', ctx)) return 0;
    const sh = (gs.showmances || []).find(s => (s.players || []).includes(pair.a));
    if (!sh || sh.kissed) return 0;
    // Only once they are actually a couple, and only early in it.
    const age = (ctx?.week?.num || 0) - (sh.sparkEp || 0);
    return age <= 2 ? _quietTime(ctx, 10) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _pair(house);
    _spend(this.id, ctx);
    const sh = (gs.showmances || []).find(s => (s.players || []).includes(a));
    if (sh) sh.kissed = true;
    const witness = _quiet(_others(house, a, b))[0];

    // A couple who were together before the show is not having a FIRST kiss: they are two
    // people who walked in together and have been keeping their hands to themselves since.
    const together = REL_KINSHIP[kinshipBetween(a, b)]?.group === 'Together';
    const scene = makeScene('bond.kiss', { a, b }, { ending: together ? 'couple' : 'scene' }, [], 'bedroom');
    api.addBond(a, b, 2.4);
    api.popDelta(a, 2);
    api.popDelta(b, 2);
    // And the house has a couple now, whatever the two of them call it.
    if (witness) api.remember(witness, a, 'they-are-a-pair', 2, { about: b });
    return { scene, players: [a, b], badgeText: together ? 'THE COUPLE' : 'FIRST KISS', badgeClass: 'gold' };
  },
};

const quietNight = {
  id: 'bond-quiet-night',
  category: 'house-life',
  location: 'bedroom',
  weight(house, ctx) {
    const pair = _pair(house);
    if (!pair || _once('bond-quiet-night', ctx)) return 0;
    return bond(pair.a, pair.b) >= 3 ? _quietTime(ctx, 7) : 0;
  },
  fire(house, ctx, api) {
    const { a, b } = _pair(house);
    _spend(this.id, ctx);
    const scene = makeScene('bond.quiet', { a, b }, { ending: 'scene' }, [], 'bedroom');
    api.addBond(a, b, 1.2);
    api.popDelta(a, 1);
    return { scene, players: [a, b], badgeText: 'A QUIET HOUR', badgeClass: 'green' };
  },
};

// ── friendship ────────────────────────────────────────────────────────

const bestFriends = {
  id: 'bond-best-friends',
  category: 'house-life',
  weight(house, ctx) {
    if (_once('bond-best-friends', ctx) || house.length < 5) return 0;
    return _friends(house) ? _quietTime(ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const pair = _friends(house);
    _spend(this.id, ctx);
    if (!pair) {
      return { text: 'Nobody in this house is anybody\'s favourite person today.',
        players: [], badgeText: 'NOBODY CLOSE', badgeClass: 'grey' };
    }
    const { a, b } = pair;
    const watcher = _quiet(_others(house, a, b))[0];

    // ── NO LINE HERE MAY COUNT WEEKS ──
    //
    // This variant said "and have had it for two weeks" and fired in WEEK ONE.
    // Every one of these events can run on any week, and none of them is handed
    // the number, so a duration written into the prose is a guess that is wrong
    // most of the time it prints. Claims like this get phrased so they are true
    // whenever they fire. `tests/bb-plain-text.test.js` sweeps week one for the
    // whole pattern.
    const scene = makeScene('bond.friends', { a, b, c: watcher || null }, { ending: 'scene' }, [],
      _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, a, b));
    api.addBond(a, b, 1);
    api.remember(a, b, 'my-person', 2, {});
    api.remember(b, a, 'my-person', 2, {});
    // A friendship nobody declared is still two votes, and the house can count.
    if (watcher) {
      api.suspicion(watcher, a, 0.5);
      api.remember(watcher, a, 'they-are-a-pair', 1, { about: b });
    }
    api.popDelta(a, 1);
    return { scene, players: [a, b, watcher].filter(Boolean),
      badgeText: 'THICK AS THIEVES', badgeClass: 'green' };
  },
};

const badDay = {
  id: 'bond-bad-day',
  category: 'house-life',
  location: 'bedroom',
  weight(house, ctx) {
    if (_once('bond-bad-day', ctx)) return 0;
    // Somebody having a genuinely bad time, and somebody who would notice.
    const low = _quiet(house).find(n => (gs.popularity?.[n] || 0) < 0
      || pStats(n).temperament <= 4);
    if (!low) return 0;
    return house.some(n => n !== low && bond(n, low) >= 3) ? _quietTime(ctx, 7) : 0;
  },
  fire(house, ctx, api) {
    _spend(this.id, ctx);
    const low = _quiet(house).find(n => (gs.popularity?.[n] || 0) < 0
      || pStats(n).temperament <= 4) || house[0];
    const friend = _others(house, low).sort((x, y) => bond(y, low) - bond(x, low))[0];
    const scene = makeScene('bond.bad-day', { a: low, b: friend }, { ending: 'scene' }, [], 'bedroom');
    api.addBond(low, friend, 1.5);
    api.remember(low, friend, 'was-there', 2, { about: 'a bad day' });
    api.popDelta(low, 1);
    api.popDelta(friend, 1);
    return { scene, players: [low, friend], badgeText: 'JUST SAT WITH THEM', badgeClass: 'green' };
  },
};

// ── the other thing ───────────────────────────────────────────────────

const coldWar = {
  id: 'bond-cold-war',
  category: 'house-life',
  weight(house, ctx) {
    if (_once('bond-cold-war', ctx) || ctx?.week?._coldWarScene) return 0;
    return _enemies(house) ? _quietTime(ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const pair = _enemies(house);
    _spend(this.id, ctx);
    if (ctx?.week) ctx.week._coldWarScene = this.id;
    if (!pair) {
      return { text: 'Everybody is, for one day, getting along.', players: [],
        badgeText: 'AN EASY DAY', badgeClass: 'grey' };
    }
    const { a, b } = pair;
    const watcher = _quiet(_others(house, a, b))[0];

    const scene = makeScene('bond.cold-war', { a, b }, { ending: 'scene' }, [],
      _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, a, b));
    api.addBond(a, b, -0.5);
    if (watcher) {
      api.remember(watcher, a, 'cold-war', 1, { about: b });
      // Living inside somebody else's feud is exhausting and the house resents
      // both of them slightly for it.
      api.popDelta(a, -1);
      api.popDelta(b, -1);
    }
    return { scene, players: [a, b], badgeText: 'NOT SPEAKING', badgeClass: 'grey' };
  },
};

const pettyNeedling = {
  id: 'bond-petty',
  category: 'house-life',
  location: 'kitchen',
  weight(house, ctx) {
    if (_once('bond-petty', ctx)) return 0;
    const pair = _enemies(house);
    if (!pair) return 0;
    // Somebody with a short fuse makes it out loud rather than cold.
    const loud = Math.min(pStats(pair.a).temperament, pStats(pair.b).temperament) <= 5;
    return loud ? _quietTime(ctx, 7) : 0;
  },
  fire(house, ctx, api) {
    const pair = _enemies(house) || { a: house[0], b: house[1] };
    _spend(this.id, ctx);
    const { a, b } = pair;
    const sharper = pStats(a).temperament <= pStats(b).temperament ? a : b;
    const other = sharper === a ? b : a;

    const scene = makeScene('bond.petty', { a: sharper, b: other }, { ending: 'scene' }, [], 'kitchen');
    api.addBond(a, b, -0.9);
    api.suspicion(other, sharper, 0.6);
    api.remember(other, sharper, 'petty', 1, {});
    api.popDelta(sharper, -1);
    return { scene, players: [sharper, other], badgeText: 'IT IS NOT ABOUT THE PAN', badgeClass: 'orange' };
  },
};

const apologyRefused = {
  id: 'bond-apology-refused',
  category: 'social',
  weight(house, ctx) {
    if (_once('bond-apology-refused', ctx)) return 0;
    const pair = _enemies(house);
    if (!pair) return 0;
    // An apology answers something: one of them has to be carrying something from the other.
    if (grudge(pair.a, pair.b) <= 0 && grudge(pair.b, pair.a) <= 0) return 0;
    // Somebody has to be the sort of person who tries.
    const tries = pStats(pair.a).loyalty >= 6 || pStats(pair.b).loyalty >= 6;
    return tries ? _quietTime(ctx, 6) : 0;
  },
  fire(house, ctx, api) {
    const pair = _enemies(house) || { a: house[0], b: house[1] };
    _spend(this.id, ctx);
    const asker = pStats(pair.a).loyalty >= pStats(pair.b).loyalty ? pair.a : pair.b;
    const refuser = asker === pair.a ? pair.b : pair.a;
    // Some people can let a thing go. Most, five weeks in, cannot.
    const accepted = pStats(refuser).temperament >= 7 && grudge(refuser, asker) < 3;

    const scene = makeScene('bond.apology', { a: asker, b: refuser }, { ending: accepted ? 'accepted' : 'refused' }, [],
      _room(['kitchen', 'living-room', 'backyard', 'bedroom'], ctx, asker, refuser));
    if (accepted) {
      api.addBond(asker, refuser, 2);
      api.remember(refuser, asker, 'made-it-right', 2, {});
      api.popDelta(asker, 2);
      api.popDelta(refuser, 1);
    } else {
      api.addBond(asker, refuser, -0.8);
      api.remember(asker, refuser, 'apology-refused', 2, {});
      // Refusing a qualified apology is not automatically bad television.
      // The person who says sorry for the argument while defending the insult
      // is the one the edit holds responsible.
      api.popDelta(asker, -1);
    }
    return { scene, players: [asker, refuser],
      badgeText: accepted ? 'THEY LET IT GO' : 'NOT ACCEPTED',
      badgeClass: accepted ? 'green' : 'red' };
  },
};

export const BOND_EVENTS = [
  firstKiss, quietNight, bestFriends, badDay, coldWar, pettyNeedling, apologyRefused,
];
