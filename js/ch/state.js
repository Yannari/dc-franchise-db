// ══════════════════════════════════════════════════════════════════════
// ch/state.js — The Challenge's season state
// ══════════════════════════════════════════════════════════════════════
//
// Spec docs/superpowers/specs/2026-10-14-the-challenge-design.md §4, §6. The
// season plays in its own `gs` (bonds live there, read through js/bonds.js)
// plus this state object, which holds everything a bond cannot: who is in
// which division, each person's record, the mind meters, feelings with a
// target, alliances, deals, couples, and the scenes the story layer will
// write from (§5: an event is a scene, `seenBy` says who knows).
import { pStats } from '../players.js';
import { players } from '../core.js';
import { getBond, addBond } from '../bonds.js';

export const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty',
  'boldness', 'intuition', 'temperament'];

// The archetype rules (CLAUDE.md): nice archetypes never scheme; neutrals only
// when strategic >= 6 and loyalty <= 4. Throwing a daily is a scheme (spec §4.8).
const VILLAINS = new Set(['villain', 'mastermind', 'schemer']);
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);

export function archetypeOf(name) {
  return players.find(p => p.name === name)?.archetype || null;
}
export function mayScheme(name) {
  const a = archetypeOf(name);
  if (VILLAINS.has(a)) return true;
  if (NICE.has(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

export const S = (name, key) => pStats(name)[key] ?? 5;

export function newState(seed, options) {
  return {
    seed, options,
    cast: [], active: [], gone: [],
    division: {}, rookie: {}, origin: {}, rep: {},
    rec: {}, mind: {}, psyche: {},
    revenge: {}, debts: {}, guilt: {},
    alliances: [], deals: [], couples: [], sparks: {},
    // somebody's partner at home, not in the cast: { name: { name, stage } } (franchise-carry atHome)
    atHome: {},
    // TJ's opinion of each player (spec §4.7): respect for fighters, contempt for quitters.
    tj: {},
    scenes: [], episodes: [], final: null, champions: [],
    // what a season is played for and what it costs (stakes.js, redemption.js)
    bank: {}, injury: {}, skulls: {}, redemption: null,
    ep: 0, day: 0,
  };
}

// The bank, an injury that has not healed, the skulls (or rings) earned: read everywhere, written in stakes.js.
export const bankOf = (state, n) => state.bank?.[n] || 0;
export const injuryOf = (state, n) => { const i = state.injury?.[n]; return i && i.heal > state.ep ? i : null; };
export const skullsOf = (state, n) => state.skulls?.[n] || 0;

export function blankRecord() {
  return { dailyWins: 0, dailyLast: 0, arenaW: 0, arenaL: 0, votedIn: 0, calledOut: 0,
    volunteered: 0, votesReceived: 0, respect: 0, throws: 0, caught: 0, injuries: 0, fights: 0,
    survivedVotes: 0, lastArenaEp: 0 };
}

// One scene: what happened, who was in it, who knows (§5 of the spec, §19.2 of
// the manual). `data` holds what it decided; the words are written later.
// The scenes that happen in front of people (the user, 2026-10-16, of a payback "in front of everybody" that
// played as two people talking: "we need more 3+ people conversation"). Two of the people in the room join it:
// the ones with the most riding on the two at its centre, a friend or an enemy of either. They are x and y in the
// lines (roles.js), seated from the start, and having watched it they lean a little toward the one they like.
export const CROWD_KINDS = new Set(['payback', 'receipts', 'kitchen-blowup', 'party-callout', 'fight', 'fight-physical',
  'trash-talk', 'outing', 'floater-callout', 'deal-broken', 'leverage-threat', 'vet-dismisses', 'bank-brag', 'rookie-hazing',
  'show-banter', 'bunk-war', 'prank', 'ranking-beef', 'gym-flex', 'wishlist-leak',
  // the house watching TJ's list, and the stand watching half a bank change hands
  'power-rankings', 'bank-taken',
  // TJ announcing a double: the house hears it together
  'tj-double']);
function crowdOf(state, kind, who, seenBy) {
  // up to four people in all: a scene that already has its own third and fourth needs no room
  if (!CROWD_KINDS.has(kind) || who.length < 2 || who.length > 3) return [];
  const [a, b] = who;
  const hash = n => [...`${state.seed}|${state.scenes.length}|${n}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) / 4294967296;
  const room = [...new Set(seenBy)].filter(n => !who.includes(n) && state.active.includes(n));
  const stake = n => Math.abs(getBond(n, a)) + Math.abs(getBond(n, b)) + hash(n) * 1.5;
  return room.sort((x, y) => stake(y) - stake(x)).slice(0, 4 - who.length);
}
export function addScene(state, kind, who, data = {}, seenBy = who, spot = null) {
  const crowd = crowdOf(state, kind, who, seenBy);
  if (crowd.length) {
    data = { ...data, crowd };
    // watching a list read out is not watching two people clash: nobody takes a side
    if (kind !== 'power-rankings') for (const w of crowd) { const [near, far] = getBond(w, who[0]) >= getBond(w, who[1]) ? who : [who[1], who[0]]; addBond(w, near, 0.15); addBond(w, far, -0.15); }
  }
  const sc = { id: state.scenes.length + 1, ep: state.ep, day: state.day, kind,
    who: [...who], data, seenBy: [...new Set(seenBy)], spot, snap: snapOf(state, who) };
  state.scenes.push(sc);
  return sc;
}

// What two people are to each other beyond the bond: a couple now (a showmance, or one who came in together),
// old friends from a season the franchise remembers, or exes (franchise-carry kin). The pull a couple and old
// friends have toward each other, in an alliance and a partner pick (the user, 2026-10-16: "a couple are, for
// example, more drawn to team up").
export function kinOf(state, a, b) {
  if (state.couples?.some(c => !c.ended && ((c.a === a && c.b === b) || (c.a === b && c.b === a)))) return 'couple';
  const k = (state.kin || []).find(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  return k ? (k.kin === 'exes' ? 'exes' : k.kin === 'old-friends' ? 'old-friends' : null) : null;
}
export const KIN_PULL = { couple: 2.2, 'old-friends': 1.2, exes: -1.5 };

// How the scene's people stood with each other AT THE SCENE (manual §11.5 B):
// the words are written after the episode, and a replayed week must not read
// later bonds. The first two people's bond, a shared alliance, a couple.
function snapOf(state, who) {
  const [a, b] = who;
  const allied = !!a && state.alliances.some(x => !x.ended && x.members.includes(a));
  if (!a || !b) return { house: state.active.length, allied };
  const al = state.alliances.some(x => !x.ended && x.members.includes(a) && x.members.includes(b));
  const couple = state.couples.some(c => !c.ended && ((c.a === a && c.b === b) || (c.a === b && c.b === a)));
  return { bond: +getBond(a, b).toFixed(2), alliance: al, couple, house: state.active.length, allied };
}

// A feeling with a target, kept until it is settled.
export function bumpMap(map, a, b, d) {
  if (!a || !b || a === b) return;
  map[a] ||= {};
  map[a][b] = Math.max(0, (map[a][b] || 0) + d);
  if (map[a][b] < 0.05) delete map[a][b];
}
export const feel = (map, a, b) => map[a]?.[b] || 0;

export const inDivision = (state, div) => state.active.filter(n => div === 'all' || state.division[n] === div);
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// Weighted pick from [{ item, w }], w >= 0.
export function weighted(rng, list) {
  const total = list.reduce((a, x) => a + Math.max(0, x.w), 0);
  if (!(total > 0)) return list.length ? list[Math.floor(rng() * list.length)].item : null;
  let r = rng() * total;
  for (const x of list) { r -= Math.max(0, x.w); if (r <= 0) return x.item; }
  return list[list.length - 1].item;
}
// Deterministic shuffle.
export function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// A soft normal-ish noise, mean 0, sd ~1.
export const noise = rng => (rng() + rng() + rng() - 1.5) * 2;
export const logistic = x => 1 / (1 + Math.exp(-x));
