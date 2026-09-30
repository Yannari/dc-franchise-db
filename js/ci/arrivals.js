// ══════════════════════════════════════════════════════════════════════
// ci/arrivals.js — "A new Player has entered The Circle." (spec §12)
// ══════════════════════════════════════════════════════════════════════
//
// How a newcomer comes in is a timeline card (Plan 3b Task 7), each from a
// real season, each with a consequence: who they bond with first, who they
// pass over, who notices. A newcomer is immune at their first blocking;
// whether they rate or are rated follows the season's newcomer rule.
import { rel, bump, addScene, S, makePact } from './state.js';
import { initMind, feel } from './mind.js';
import { nudgeBelief, belief } from './beliefs.js';
import { applyBlock } from './blocking.js';

function join(state, h, entry) {
  state.active.push(h);
  state.joinedDay[h] = state.day;
  state.immuneNext[h] = true;
  state.unratedNext[h] = true;
  initMind(state, h);
  addScene(state, 'arrival', [h], { entry }, [...state.active]);
}
const othersOf = (state, h) => state.active.filter(o => o !== h);
const byLikes = (state, rng, h, pool, attraction = 0.3) => pool
  .map(o => [o, (state.likesCount[o] || 0) + rel(h, o, 'attraction') * attraction + rng() * 2]).sort((a, b) => b[1] - a[1]).map(([o]) => o);
const warm = (a, b, n) => { bump(a, b, 'affection', n); bump(b, a, 'affection', n); };

export const ENTRIES = {
  // US 1 Ep 2 (Miranda): build a profile, watch Circle Chat in secret, then
  // invite one player to a private after-party.
  snoop: { min: 1, run(state, rng, handles) {
    for (const h of handles) {
      join(state, h, 'snoop');
      const others = othersOf(state, h);
      const pick = byLikes(state, rng, h, others)[0];
      if (!pick) continue;
      addScene(state, 'after-party', [h, pick], { chosen: pick });
      warm(h, pick, 1.5);
      bump(pick, h, 'trust', 0.5);
      feel(state, pick, 'elation', 1);
      for (const o of others) if (o !== pick) feel(state, o, 'paranoia', 0.3);
    }
  } },
  // US 1 Ep 5: three players are offered; the newcomer takes one on a date
  // and sends a gift. The two passed over know it.
  date: { min: 1, run(state, rng, handles) {
    for (const h of handles) {
      join(state, h, 'date');
      const options = byLikes(state, rng, h, othersOf(state, h)).slice(0, 3);
      if (!options.length) continue;
      const chosen = byLikes(state, rng, h, options, 1)[0];
      addScene(state, 'date', [h, chosen], { options, chosen }, [...state.active]);
      warm(h, chosen, 2);
      bump(chosen, h, 'obligation', 1);
      feel(state, chosen, 'elation', 1.5);
      for (const o of options.filter(x => x !== chosen)) { bump(o, h, 'resentment', 0.4); feel(state, o, 'paranoia', 0.4); }
    }
  } },
  // US 3 Ep 6 (James): private chats one at a time, in an order everyone sees.
  invites: { min: 1, run(state, rng, handles) {
    for (const h of handles) {
      join(state, h, 'invites');
      const order = byLikes(state, rng, h, othersOf(state, h)).slice(0, 4);
      addScene(state, 'invites', [h], { order }, [...state.active]);
      order.forEach((o, i) => warm(h, o, Math.max(0.3, 1.8 - i * 0.45)));
      for (const o of othersOf(state, h).filter(x => !order.includes(x))) feel(state, o, 'paranoia', 0.3);
    }
  } },
  // US 6 Ep 6: everyone races to message the newcomer first; speed is nerve
  // and people skills, not popularity.
  race: { min: 1, run(state, rng, handles) {
    for (const h of handles) {
      join(state, h, 'race');
      const order = othersOf(state, h).map(o => [o, (S(state, o, 'boldness') + S(state, o, 'social')) / 2 + rng() * 3])
        .sort((a, b) => b[1] - a[1]).map(([o]) => o).slice(0, 3);
      addScene(state, 'race', [h], { order }, [...state.active]);
      order.forEach((o, i) => warm(h, o, [2, 0.8, 0.3][i]));
      if (order[0]) feel(state, order[0], 'elation', 1);
    }
  } },
  // US 4 Ep 7: the newcomer throws a party; who was invited is noticed.
  party: { min: 1, run(state, rng, handles) {
    for (const h of handles) {
      join(state, h, 'party');
      const ranked = byLikes(state, rng, h, othersOf(state, h));
      const n = Math.max(1, Math.min(ranked.length - 1, Math.round(ranked.length / 2)));
      const guests = ranked.slice(0, n), left = ranked.slice(n);
      addScene(state, 'newparty', [h], { guests, left }, [...state.active]);
      for (const g of guests) { warm(h, g, 1); feel(state, g, 'loneliness', -1); }
      for (const o of left) { bump(o, h, 'resentment', 0.3); feel(state, o, 'paranoia', 0.5); }
    }
  } },
  // US 7 Ep 2: the newcomer watches before anyone knows they exist, and
  // comes in knowing who is strong. The room feels watched.
  lurk: { min: 1, run(state, rng, handles) {
    for (const h of handles) {
      join(state, h, 'lurk');
      const watched = othersOf(state, h);
      const sc = addScene(state, 'lurk', [h], { watched }, [...state.active]);
      const last = state.ratings.filter(r => !r.final).at(-1);
      const n = last?.results.length || 1;
      for (const o of watched) {
        const place = last?.results.find(r => r.profile === o)?.place;
        if (place == null) continue;
        const seen = 10 * (1 - (place - 1) / Math.max(1, n - 1));
        nudgeBelief(state, h, o, 'threat', (seen - belief(state, h, o).threat) * 0.8, sc);
      }
      for (const o of watched) feel(state, o, 'paranoia', 0.5);
    }
  } },
  // US 4 Ep 1, US 6 Ep 1: the Influencers chose which waiting profile came
  // in (season.js reorders the queue); the chosen one owes them.
  chosen: { min: 1, run(state, rng, handles, ctx = {}) {
    for (const h of handles) {
      join(state, h, 'chosen');
      if (!ctx.by?.length) continue;
      addScene(state, 'chosen', [h, ...ctx.by], { offered: ctx.offered, chosen: h, by: ctx.by }, [...state.active]);
      for (const i of ctx.by) { bump(h, i, 'obligation', 2); bump(h, i, 'affection', 1); }
    }
  } },
  // US 3 Ep 3 ("Isabella" and "Jackson"): two newcomers get a private chat
  // before joining, and walk in allied.
  pair: { min: 2, run(state, rng, handles) {
    const [a, b, ...rest] = handles;
    join(state, a, 'pair'); join(state, b, 'pair');
    addScene(state, 'pair-arrival', [a, b], {}, [a, b]);
    warm(a, b, 2); bump(a, b, 'trust', 1); bump(b, a, 'trust', 1);
    makePact(state, 'protect', a, b);
    if (rest.length) ENTRIES.snoop.run(state, rng, rest);
  } },
};

// UK 2 Ep 16: two newcomers arrive hidden behind eggs; each gives the room
// a short introduction, the room votes which stays, and the other is
// blocked at once. They have only the introductions to go on.
ENTRIES.egg = { min: 2, run(state, rng, handles) {
  const eggs = handles.slice(0, 2);
  for (const h of eggs) join(state, h, 'egg');
  const voters = state.active.filter(o => !eggs.includes(o));
  const votes = {};
  for (const v of voters) {
    votes[v] = eggs.map(e => [e, S(state, e, 'social') * 0.3 + S(state, e, 'boldness') * 0.2 + rng() * 3]).sort((a, b) => b[1] - a[1])[0][0];
  }
  const tally = Object.fromEntries(eggs.map(e => [e, Object.values(votes).filter(x => x === e).length]));
  const stays = tally[eggs[0]] >= tally[eggs[1]] ? eggs[0] : eggs[1];
  const goes = eggs.find(e => e !== stays);
  const sc = addScene(state, 'egg', [...eggs], { eggs, votes, stays, goes }, [...state.active]);
  applyBlock(state, goes, 'egg', [], sc);
  state.pendingGoodbyes.push(goes);
  for (const [v, e] of Object.entries(votes)) if (e === stays) bump(stays, v, 'affection', 0.5);
  if (handles.length > 2) ENTRIES.snoop.run(state, rng, handles.slice(2));
} };

/** The Influencers pick which of two waiting profiles comes in. They have
 *  only the profile to go on: a curated face reads a little better. */
export function chooseNewcomer(state, rng, offered, by) {
  return offered.map(h => [h, rng() + (state.profiles[h]?.mode === 'catfish' ? 0.2 : 0)]).sort((a, b) => b[1] - a[1])[0][0];
}

export function arrive(state, rng, handles, entry = 'snoop', ctx = {}) {
  const e = ENTRIES[entry] && handles.length >= ENTRIES[entry].min ? entry : 'snoop';
  ENTRIES[e].run(state, rng, handles, ctx);
  return e;
}
