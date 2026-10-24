// ══════════════════════════════════════════════════════════════════════
// bb-events/cheating.js — a showmance with somebody waiting at home
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-23: a houseguest who is married (or engaged, or with
// someone) "dont know find someone else if theyre loyal and if they do it count
// as cheating and they have event like remorse", then "add the remorse and
// cheating events in bb".
//
// Whether it starts at all is romance.js (_homeFactor: the relationship's stage
// times the houseguest's loyalty). This file is what the house does once it
// has: a showmance in gs.showmances where one of the two has a partnerAtHome
// (set at season start from the life log or a tie, js/life-cast.js).
//
//   remorse    the one who is cheating, alone with it. Guilt or a shrug, as
//              loyal as they are: guilt pulls them back from the other one and
//              earns a little sympathy; the shrug costs them the audience.
//   gossip     two of the house say it out loud: isn't {c} {status}? It costs
//              the cheater popularity and the two of them some respect, and
//              from then on the house knows.
//   confront   the other half of the showmance hears it, and either walks away
//              (the showmance ends) or stays, colder.
//   ends it    remorse wins: the one who is cheating calls it off, for home.
//
// Every event leaves bonds, popularity or the showmance itself changed; none is
// cosmetic. The eviction night's homecoming (bb-aftermath.js) is the payoff.

import { gs, players } from '../core.js';
import { pronouns } from '../players.js';
import { pStats, bond, band, romanceOn, spotlightOrder } from './_read.js';
import { kinWord, homeKin } from '../season-ties.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const atHome = name => (players || []).find(p => p.name === name)?.partnerAtHome || null;

/** Live showmances with one of the two spoken for at home: { cheater, other, sh, at }. */
function _cheats(house) {
  if (!romanceOn()) return [];
  const out = [];
  for (const sh of gs.showmances || []) {
    if (!sh || sh.phase === 'broken-up' || sh.broken || (sh.players || []).length !== 2) continue;
    if (sh.origin === 'arrived-together') continue;
    if (!sh.players.every(n => house.includes(n))) continue;
    const cheater = sh.players.find(n => atHome(n));
    if (!cheater) continue;
    out.push({ cheater, other: sh.players.find(n => n !== cheater), sh, at: atHome(cheater) });
  }
  return out;
}
const stateOf = sh => (sh._cheat ||= { remorse: 0, guilt: 0, cold: 0, outed: false, confronted: false });

/** How the scene says who is at home: {home} about them, {myhome} in their own mouth, {status} "married". */
export function homeWords(cheater, at) {
  const word = at?.word || kinWord(homeKin(at?.stage), at?.name || '');
  const named = at?.outside ? !!at.named : !!at?.name;
  const pr = pronouns(cheater) || {};
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const home = named ? at.name : `${pr.posAdj || 'their'} ${word}`;
  const myhome = named ? at.name : `my ${word}`;
  const yourhome = named ? at.name : `your ${word}`;
  // the capitalised ones open a sentence
  return {
    home, myhome, yourhome, Home: cap(home), Myhome: cap(myhome), Yourhome: cap(yourhome),
    homeword: word,
    status: at?.stage === 'married' ? 'married' : at?.stage === 'engaged' ? 'engaged' : 'with someone',
  };
}

/** Never inside a ceremony; quieter on eviction night. */
const _fit = (ctx, value) => {
  if (ctx?.act === 'nominations' || ctx?.act === 'veto-ceremony') return 0;
  return band(value * (ctx?.act === 'eviction' ? 0.3 : 1));
};
// Two of these a week across the whole file, one of each kind: the cheating is a storyline, not the week.
const _once = (id, ctx) => !!ctx?.week?._cheatFired?.[id] || Object.keys(ctx?.week?._cheatFired || {}).length >= 2;
const _spend = (id, ctx) => { if (ctx?.week) (ctx.week._cheatFired ||= {})[id] = true; };
const _week = ctx => ctx?.week?.num || 0;

function _breakUp(sh, by, type) {
  sh.broken = true;
  sh.phase = 'broken-up';
  sh.breakupType = type;
  sh.breakupEp = (gs.episode || 0) + 1;
  sh.breakupVoter = by;
}

// ── alone with it ─────────────────────────────────────────────────────

const remorse = {
  id: 'cheat-remorse',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    if (_once(this.id, ctx)) return 0;
    const c = _cheats(house).find(x => stateOf(x.sh).lastRemorse !== _week(ctx));
    return c ? _fit(ctx, 9) : 0;
  },
  fire(house, ctx, api, rng) {
    const { cheater, other, sh, at } = _cheats(house).find(x => stateOf(x.sh).lastRemorse !== _week(ctx));
    _spend(this.id, ctx);
    const st = stateOf(sh);
    st.lastRemorse = _week(ctx);
    st.remorse++;
    // As loyal as they are: a loyalty of nine all but always feels it, a loyalty of two mostly does not.
    const loyalty = pStats(cheater).loyalty ?? 5;
    const guilty = (rng ? rng() : Math.random()) < 0.2 + loyalty * 0.07;
    const scene = makeScene('cheat.remorse', { a: cheater, b: other }, { ending: guilty ? 'guilt' : 'cold', ...homeWords(cheater, at) }, [], 'bedroom');
    if (guilty) {
      st.guilt++;
      // they pull back from the one in the house, and the audience softens a little
      api.addBond(cheater, other, -0.4);
      api.popDelta(cheater, 1);
      api.remember(other, cheater, 'pulled-away-from-me', 1, {});
    } else {
      st.cold++;
      api.addBond(cheater, other, 0.3);
      api.popDelta(cheater, -2);
    }
    return { scene, players: [cheater, other],
      badgeText: guilty ? 'SOMEBODY AT HOME' : 'NO REGRETS', badgeClass: guilty ? 'blue' : 'red' };
  },
};

// ── the house says it out loud ────────────────────────────────────────

/** Two people outside the couple who would say it: the most perceptive first, then the most talkative. */
function _gossips(house, c) {
  const room = spotlightOrder(_others(house, c.cheater, c.other));
  if (room.length < 2) return null;
  const first = [...room].sort((x, y) => pStats(y).intuition - pStats(x).intuition || (x < y ? -1 : 1))[0];
  const second = room.filter(n => n !== first).sort((x, y) => pStats(y).social - pStats(x).social || (x < y ? -1 : 1))[0];
  return [first, second];
}

const gossip = {
  id: 'cheat-gossip',
  category: 'social',
  location: 'kitchen',
  weight(house, ctx) {
    if (_once(this.id, ctx) || house.length < 4) return 0;
    const c = _cheats(house).find(x => !stateOf(x.sh).outed && (_week(ctx) - (x.sh.sparkEp || 0) >= 1 || stateOf(x.sh).remorse));
    return c && _gossips(house, c) ? _fit(ctx, 8) : 0;
  },
  fire(house, ctx, api) {
    const c = _cheats(house).find(x => !stateOf(x.sh).outed && (_week(ctx) - (x.sh.sparkEp || 0) >= 1 || stateOf(x.sh).remorse));
    _spend(this.id, ctx);
    const [g1, g2] = _gossips(house, c);
    stateOf(c.sh).outed = true;
    const scene = makeScene('cheat.gossip', { a: g1, b: g2, c: c.cheater }, { ending: 'scene', partner: c.other, ...homeWords(c.cheater, c.at) }, [], 'kitchen');
    api.popDelta(c.cheater, -2);
    // the more someone values loyalty, the less they think of it
    for (const g of [g1, g2]) {
      api.addBond(g, c.cheater, -(0.2 + (pStats(g).loyalty ?? 5) * 0.06));
      api.remember(g, c.cheater, 'cheating-on-home', 2, { about: c.other });
    }
    api.addBond(g1, g2, 0.3);
    return { scene, players: [g1, g2, c.cheater], badgeText: 'THE HOUSE TALKS', badgeClass: 'red' };
  },
};

// ── the other half hears it ───────────────────────────────────────────

const confront = {
  id: 'cheat-confront',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    if (_once(this.id, ctx)) return 0;
    return _cheats(house).some(x => stateOf(x.sh).outed && !stateOf(x.sh).confronted) ? _fit(ctx, 10) : 0;
  },
  fire(house, ctx, api, rng) {
    const { cheater, other, sh, at } = _cheats(house).find(x => stateOf(x.sh).outed && !stateOf(x.sh).confronted);
    _spend(this.id, ctx);
    stateOf(sh).confronted = true;
    // Who walks: the more they value loyalty, the likelier; the closer they are, the less; a cheater who has
    // been feeling it is easier to forgive than one who shrugged.
    const st = stateOf(sh);
    const leave = Math.max(0.1, Math.min(0.85, 0.25 + (pStats(other).loyalty ?? 5) * 0.05 - bond(other, cheater) * 0.04
      + st.cold * 0.08 - st.guilt * 0.05));
    const done = (rng ? rng() : Math.random()) < leave;
    const scene = makeScene('cheat.confront', { a: other, b: cheater }, { ending: done ? 'done' : 'stays', ...homeWords(cheater, at) }, [], 'bedroom');
    if (done) {
      _breakUp(sh, other, 'cheating');
      api.addBond(other, cheater, -2.5);
      api.popDelta(other, 2);
      api.popDelta(cheater, -1);
      api.remember(other, cheater, 'lied-about-home', 3, {});
    } else {
      api.addBond(other, cheater, -0.8);
      api.remember(other, cheater, 'stayed-knowing', 2, {});
    }
    return { scene, players: [other, cheater],
      badgeText: done ? 'IT ENDS OVER HOME' : 'STAYS, KNOWING', badgeClass: done ? 'red' : 'blue' };
  },
};

// ── remorse wins ──────────────────────────────────────────────────────

const endsIt = {
  id: 'cheat-ends-it',
  category: 'social',
  location: 'backyard',
  weight(house, ctx) {
    if (_once(this.id, ctx)) return 0;
    const c = _cheats(house).find(x => stateOf(x.sh).guilt >= 1 && stateOf(x.sh).lastRemorse !== _week(ctx));
    if (!c) return 0;
    // how much it has weighed on them, times how loyal they are
    return _fit(ctx, 1 + stateOf(c.sh).guilt * (pStats(c.cheater).loyalty ?? 5) * 0.6);
  },
  fire(house, ctx, api) {
    const { cheater, other, sh, at } = _cheats(house).find(x => stateOf(x.sh).guilt >= 1 && stateOf(x.sh).lastRemorse !== _week(ctx));
    _spend(this.id, ctx);
    _breakUp(sh, cheater, 'remorse');
    const scene = makeScene('cheat.endit', { a: cheater, b: other }, { ending: 'scene', ...homeWords(cheater, at) }, [], 'backyard');
    api.addBond(cheater, other, -1.5);
    api.popDelta(cheater, 2);
    api.remember(other, cheater, 'ended-it-for-home', 2, {});
    return { scene, players: [cheater, other], badgeText: 'CHOOSES HOME', badgeClass: 'gold' };
  },
};

export const CHEATING_EVENTS = [remorse, gossip, confront, endsIt];
export default CHEATING_EVENTS;
