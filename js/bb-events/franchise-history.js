// ══════════════════════════════════════════════════════════════════════
// bb-events/franchise-history.js — the season before this one
// ══════════════════════════════════════════════════════════════════════
//
// THE HOUSE HAD THE CONSEQUENCES AND NONE OF THE CAUSE.
//
// `initGameState` seeds starting bonds from the franchise ledger, so two
// returnees who cut each other last time genuinely arrive disliking each other
// — and no Big Brother module read that ledger, so nobody could ever say why.
// Total Drama has had OLD WOUNDS, REUNION and HISTORY at camp since the ledger
// existed. The house, which is built on the vote and where a grudge from a
// previous summer is the most Big Brother thing there is, had nothing.
//
// These are the same memories said in this show's words: on the block, in the
// diary room, at the eviction. Sourced from `sharedPast`, whose `reason` is
// already a sentence — "Ben betrayed Ava (Season 3)" — so the house cites the
// real thing rather than gesturing at a vague past.
//
// A season with no returnees produces none of these, silently, because
// `pastPairs` is empty and every weight below is zero.

import { gs } from '../core.js';
import { pastPairs, pastProfile, sharedPast, spotlightOrder } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

/** The season a piece of history happened in, from the ledger's "(Season 3)". */
const _when = reason => (String(reason || '').match(/\(([^)]+)\)\s*$/) || [])[1] || 'the last season';

/** Which pool a kind of history speaks from. */
const SURFACE = { betrayal: 'betrayed', blindside: 'blindsided', rivals: 'rivals',
  'showmance-broken': 'broken', allies: 'allies', 'showmance-intact': 'together' };

/** A nomination with history: done to them again, paid back, an old rivalry, or an old friend. */
function _nomEnding(past, nominee) {
  if (['betrayal', 'blindside'].includes(past.kind)) return past.a === nominee ? 'again' : 'revenge';
  return GOOD.includes(past.kind) ? 'good' : 'rivals';
}

const _once = (id, ctx) => !!ctx?.week?._pastFired?.[id];
const _spend = (id, ctx) => { if (ctx?.week) (ctx.week._pastFired ||= {})[id] = true; };
const _burnt = key => !!gs.bb?._pastOnce?.[key];
const _burn = key => { ((gs.bb ||= {})._pastOnce ||= {})[key] = true; };

/** Old business surfaces early and thins out, the way catching up does. */
const _decay = ctx => Math.max(0.35, 1 - (Number(ctx?.week?.num) || 1) * 0.08);

const BAD = ['betrayal', 'blindside', 'rivals', 'showmance-broken'];
const GOOD = ['allies', 'showmance-intact'];

/** The strongest untold pair of the given kinds, ignoring anyone already used. */
function _pair(house, kinds, ctx) {
  const order = spotlightOrder ? spotlightOrder(house) : house;
  const rank = new Map(order.map((n, i) => [n, i]));
  return pastPairs(house, kinds)
    .filter(sp => !_burnt(`${sp.a}|${sp.b}|${sp.kind}`))
    // Prefer the pair the edit has been ignoring, so a season does not spend
    // all of these on the same two people.
    .sort((x, y) => (rank.get(x.a) ?? 99) + (rank.get(x.b) ?? 99)
                  - ((rank.get(y.a) ?? 99) + (rank.get(y.b) ?? 99)))[0] || null;
}

const _others = (house, ...ex) => house.filter(n => n && !ex.includes(n));

// ── 1. THE HOUSE FINDS OUT ────────────────────────────────────────────────
//
// Before anybody plays a move on it. Two people arrive with a history the rest
// of the cast has watched on television, and the room prices it in immediately.
const pastSurfaces = {
  id: 'past-surfaces',
  category: 'house-life',
  location: 'living-room',
  weight(house, ctx) {
    if (_once(this.id, ctx)) return 0;
    if (['nominations', 'veto-ceremony', 'eviction'].includes(ctx?.act)) return 0;
    return _pair(house, [...BAD, ...GOOD], ctx) ? 7 * _decay(ctx) : 0;
  },
  fire(house, ctx, api) {
    const sp = _pair(house, [...BAD, ...GOOD], ctx);
    if (!sp) return null;
    _spend(this.id, ctx); _burn(`${sp.a}|${sp.b}|${sp.kind}`);
    const { a: A, b: B, reason } = sp;
    const bad = BAD.includes(sp.kind);
    const watcher = _others(house, A, B)[0];

    const scene = makeScene('past.surfaces', { a: A, b: B, c: watcher || null }, { ending: SURFACE[sp.kind] || 'rivals', when: _when(reason) }, [], 'kitchen');

    // Being seen as a pair is how a pair becomes a target — the same rule
    // kinship.js runs on, because it is the same thing happening.
    for (const n of _others(house, A, B).slice(0, 5)) {
      api.suspicion?.(n, A, bad ? 0.3 : 0.7);
      api.suspicion?.(n, B, bad ? 0.3 : 0.7);
    }
    api.addBond?.(A, B, bad ? -0.6 : 0.8);
    if (!bad && watcher) api.setTarget?.(watcher, A, `${A} and ${B} came in with history`);

    return {
      scene, players: [A, B, watcher].filter(Boolean),
      badgeText: bad ? 'OLD WOUNDS' : 'THEY HAVE DONE THIS BEFORE',
      badgeClass: bad ? 'red' : 'gold',
    };
  },
};

// ── 2. NOMINATED BY SOMEBODY WHO HAS DONE IT BEFORE ───────────────────────
//
// The most Big Brother version of this: it is not that they dislike each
// other, it is that one of them is holding the power again.
const nominatedAgain = {
  id: 'past-nominated-again',
  category: 'ceremonies',
  location: 'diary-room',
  weight(house, ctx) {
    if (_once(this.id, ctx)) return 0;
    if (!['nominations', 'campaign'].includes(ctx?.act)) return 0;
    return _nomineeWithHistory(ctx) ? 9 : 0;
  },
  fire(house, ctx, api) {
    const hit = _nomineeWithHistory(ctx);
    if (!hit) return null;
    _spend(this.id, ctx);
    const { hoh, nominee, past } = hit;
    const bad = BAD.includes(past.kind);

    const scene = makeScene('past.nominated', { a: nominee, b: hoh }, { ending: _nomEnding(past, nominee), when: _when(past.reason) }, [], 'diary-room');

    api.addBond?.(nominee, hoh, bad ? -1.0 : -1.4);   // worse when it breaks something good
    api.setTarget?.(nominee, hoh, past.reason);
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[nominee] = (gs.popularity[nominee] || 0) + 0.6;   // the audience remembers too

    return {
      scene, players: [nominee, hoh],
      badgeText: bad ? 'HE DID IT AGAIN' : 'AN OLD ALLY HOLDS THE KEY',
      badgeClass: 'red',
    };
  },
};

/** A nominee this week who has history with whoever nominated them. */
function _nomineeWithHistory(ctx) {
  const week = ctx?.week;
  const hoh = week?.hoh;
  const noms = week?.nominees || week?.finalNominees || [];
  if (!hoh || !noms.length) return null;
  for (const nominee of noms) {
    const past = sharedPast(hoh, nominee);
    if (past) return { hoh, nominee, past };
  }
  return null;
}

// ── 3. THE VOTE THAT SETTLES IT ───────────────────────────────────────────
//
// Eviction night. Not a new grievance — the old one, collected.
const settledTonight = {
  id: 'past-settled-tonight',
  category: 'ceremonies',
  location: 'diary-room',
  weight(house, ctx) {
    if (ctx?.act !== 'eviction') return 0;
    if (_once(this.id, ctx)) return 0;
    return _voterWithHistory(ctx) ? 8 : 0;
  },
  fire(house, ctx, api) {
    const hit = _voterWithHistory(ctx);
    if (!hit) return null;
    _spend(this.id, ctx);
    const { voter, nominee, past } = hit;

    const scene = makeScene('past.settled', { a: voter, b: nominee }, { ending: ['betrayal', 'blindside'].includes(past.kind) && past.a === voter ? 'wronged' : 'rivals', when: _when(past.reason) }, [], 'diary-room');

    if (!gs.popularity) gs.popularity = {};
    gs.popularity[voter] = (gs.popularity[voter] || 0) - 0.3;   // settling scores reads cold

    return {
      scene, players: [voter, nominee],
      badgeText: 'SOME DEBTS CARRY OVER', badgeClass: 'red',
    };
  },
};

/** Somebody voting tonight who has old business with a nominee. */
function _voterWithHistory(ctx) {
  const week = ctx?.week;
  const noms = week?.finalNominees || week?.nominees || [];
  const voters = (week?.ballots || []).map(b => b.voter).filter(Boolean);
  for (const nominee of noms) {
    for (const voter of voters) {
      const past = sharedPast(voter, nominee);
      if (past && BAD.includes(past.kind)) return { voter, nominee, past };
    }
  }
  return null;
}

// ── 4. A REPUTATION THAT ARRIVED BEFORE THEY DID ──────────────────────────
//
// Not about a pair. The ledger knows this person plays a certain way, and the
// house has watched them do it.
const knownForIt = {
  id: 'past-known-for-it',
  category: 'house-life',
  location: 'kitchen',
  weight(house, ctx) {
    if (_once(this.id, ctx) || _burnt(this.id)) return 0;
    if (['nominations', 'veto-ceremony', 'eviction'].includes(ctx?.act)) return 0;
    return _notorious(house) ? 6 * _decay(ctx) : 0;
  },
  fire(house, ctx, api) {
    const hit = _notorious(house);
    if (!hit) return null;
    _spend(this.id, ctx); _burn(this.id);
    const { name } = hit;
    const watcher = _others(house, name)[0];

    const scene = makeScene('past.known', { a: name, b: watcher || null }, { ending: 'scene' }, [], 'kitchen');

    for (const n of _others(house, name).slice(0, 6)) api.suspicion?.(n, name, 1.1);

    return { scene, players: [name, watcher].filter(Boolean), badgeText: 'THE TAPES DO NOT LIE', badgeClass: 'red' };
  },
};

/** The houseguest the ledger most marks as a schemer, if the house has one. */
function _notorious(house) {
  let best = null;
  for (const name of house) {
    const profile = pastProfile(name);
    if (!profile || (profile.knownSchemer || 0) < 0.5) continue;
    if (!best || profile.knownSchemer > best.profile.knownSchemer) best = { name, profile };
  }
  return best;
}

export const FRANCHISE_HISTORY_EVENTS = [
  pastSurfaces, nominatedAgain, settledTonight, knownForIt,
];
