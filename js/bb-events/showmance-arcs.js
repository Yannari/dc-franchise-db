// ══════════════════════════════════════════════════════════════════════
// bb-events/showmance-arcs.js — the second half of a couple's season
// ══════════════════════════════════════════════════════════════════════
//
// showmance.js covers the shape of a couple from outside: hiding it, the blind
// spot, the third wheel, the fight, two votes arriving together. What it does
// not have is the part the couple themselves would say the season was about —
// the conversation where they decide what this is, the week they agree to stop
// being seen, the day one of them repeats something they should not have been
// told, and the night one of them is on the block and the other has to be a
// person about it in front of eleven witnesses.
//
// The through-line here is INFORMATION, because that is what a couple actually
// changes about a house. Two people who tell each other everything are a leak
// with a bed in it. Every event in this file either creates a channel, uses
// one, or makes somebody realise the channel exists.
//
//   defined            — it stops being deniable, to them
//   underground        — it stops being visible, to everybody else
//   separate campaigns — they work rooms apart to look like two players
//   the leak channel   — what one is told, both know by morning
//   jealousy           — the cost of a house with no doors
//   block pressure     — one of them is a nominee and the other cannot hide it
//
// Nothing here creates a showmance; all of it reads gs.showmances and leaves
// bonds, popularity, suspicion and memory behind. Romance stays gated on
// seasonConfig via romanceOn(), and the "third person" in the jealousy beat is
// explicitly not a romantic prospect — the point is that it does not have to be.

import { gs } from '../core.js';
import {
  pStats, bond, band, beatsInvolving, spotlightOrder, romanceOn, suspicionOf,
} from './_read.js';
import { makeScene } from '../bb/script/scene.js';

// ── helpers ───────────────────────────────────────────────────────────


const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _quiet = pool => spotlightOrder(pool);

/**
 * Live couples, both halves still in the house.
 *
 * Deliberately the same read as showmance.js rather than a shared import — the
 * two files must not be able to break each other, and a couple is a two-line
 * filter.
 */
function _couples(house) {
  if (!romanceOn()) return [];
  return (gs.showmances || [])
    .filter(sh => sh && sh.phase !== 'broken-up' && !sh.broken
      && (sh.players || []).length === 2
      && sh.players.every(n => house.includes(n)))
    .map(sh => ({ a: sh.players[0], b: sh.players[1], sh }));
}

/** The couple that has had the least of the season so far. */
function _couple(house) {
  const all = _couples(house);
  if (!all.length) return null;
  return [...all].sort((x, y) =>
    (beatsInvolving(x.a) + beatsInvolving(x.b)) - (beatsInvolving(y.a) + beatsInvolving(y.b))
    || (x.a < y.a ? -1 : 1))[0];
}

/** Never inside a ceremony — those acts belong to the ceremony events. */
const _fit = (ctx, value) => {
  if (ctx?.act === 'nominations' || ctx?.act === 'veto-ceremony') return 0;
  return band(value * (ctx?.act === 'eviction' ? 0.3 : ctx?.act === 'campaign' ? 0.85 : 1));
};

// Own bookkeeping key. showmance.js uses week._showmanceFired and writing to
// the same object from two files would let one library silently suppress the
// other's events for the rest of the week.
// A per-week budget across the WHOLE file, on top of the per-event lock. A
// showmance is a storyline, not the week: six arc events each firing once
// could hand a safe couple more scenes than a nominee, which the screen-time
// suite rightly refuses. Two arc beats a week keeps the couple present
// without letting the romance outrank the block.
const _once = (id, ctx) => !!ctx?.week?._showmanceArcFired?.[id]
  || Object.keys(ctx?.week?._showmanceArcFired || {}).length >= 2;
const _spend = (id, ctx) => { if (ctx?.week) (ctx.week._showmanceArcFired ||= {})[id] = true; };

const _noms = ctx => ((ctx?.nominees && ctx.nominees.length ? ctx.nominees
  : (ctx?.week?.finalNominees || [])) || []).filter(Boolean);

/** The one who says the difficult thing first: bolder, or failing that warmer. */
const _speaker = (a, b) =>
  (pStats(a).boldness + pStats(a).social * 0.4 >= pStats(b).boldness + pStats(b).social * 0.4) ? a : b;

// ── they say what it is ───────────────────────────────────────────────

const defined = {
  id: 'showmance-defined',
  category: 'social',
  location: 'bedroom',
  weight(house, ctx) {
    const pair = _couple(house);
    if (!pair || _once('showmance-defined', ctx)) return 0;
    // Once per couple per season, and only once it has had time to become a
    // question worth asking.
    if (pair.sh._arcDefined) return 0;
    const age = (ctx?.week?.num || 0) - (pair.sh.sparkEp || 0);
    return age >= 1 ? _fit(ctx, 8) : _fit(ctx, 4);
  },
  fire(house, ctx, api) {
    const { a, b, sh } = _couple(house);
    _spend(this.id, ctx);
    sh._arcDefined = true;
    const asks = _speaker(a, b);
    const answers = asks === a ? b : a;

    const scene = makeScene('couple.defined', { a: asks, b: answers }, { ending: 'scene' }, [], 'bedroom');

    api.addBond(a, b, 1.4);
    api.popDelta(a, 1);
    api.popDelta(b, 1);
    api.remember(a, b, 'we-said-what-this-is', 2, {});
    api.remember(b, a, 'we-said-what-this-is', 2, {});
    return { scene, players: [a, b], badgeText: 'THEY SAY IT OUT LOUD', badgeClass: 'gold' };
  },
};

// ── and then they hide it ─────────────────────────────────────────────

const underground = {
  id: 'showmance-goes-underground',
  category: 'deals',
  location: 'storage',
  weight(house, ctx) {
    const pair = _couple(house);
    if (!pair || house.length < 5 || _once('showmance-goes-underground', ctx)
      || ctx?.week?._showmanceConcealment) return 0;
    // Somebody has to be worried, which means somebody has to already be a
    // target or already be watched.
    const heat = Math.max(suspicionOf(_others(house, pair.a, pair.b)[0] || '', pair.a) || 0, 0);
    return _fit(ctx, 6 + Math.min(3, heat));
  },
  fire(house, ctx, api, rng) {
    const { a, b } = _couple(house);
    _spend(this.id, ctx);
    if (ctx?.week) ctx.week._showmanceConcealment = this.id;
    const watcher = _quiet(_others(house, a, b))
      .sort((x, y) => pStats(y).intuition - pStats(x).intuition || (x < y ? -1 : 1))[0]
      || _others(house, a, b)[0];
    const planner = pStats(a).strategic >= pStats(b).strategic ? a : b;
    const other = planner === a ? b : a;

    const scene = makeScene('couple.underground', { a: planner, b: other, c: watcher || null }, { ending: 'scene' }, [], 'pantry');

    // Whether it fools the sharpest person in the room is proportional to how
    // sharp they actually are, and it costs them a little either way.
    const sees = pStats(watcher).intuition * 0.09 + ((rng ? rng() : 0.5) * 0.25);
    api.suspicion(watcher, a, 0.3 + sees);
    api.suspicion(watcher, b, 0.3 + sees);
    api.remember(watcher, planner, 'they-are-hiding-something', sees > 0.7 ? 2 : 1, { about: other });
    api.addBond(a, b, 0.3);
    return { scene, players: [a, b, watcher].filter(Boolean),
      badgeText: 'SEPARATE DOORS', badgeClass: 'blue' };
  },
};

// ── working the rooms apart ───────────────────────────────────────────

const separateCampaigns = {
  id: 'showmance-separate-campaigns',
  category: 'deals',
  location: 'backyard',
  weight(house, ctx) {
    const pair = _couple(house);
    if (!pair || _once('showmance-separate-campaigns', ctx)) return 0;
    const live = ctx?.act === 'campaign' || ctx?.act === 'eviction'
      || (ctx?.act === 'house' && ctx?.phase === 'post-veto');
    if (!live || house.length < 5) return 0;
    return _fit(ctx, 9);
  },
  fire(house, ctx, api) {
    const { a, b } = _couple(house);
    _spend(this.id, ctx);
    const room = _quiet(_others(house, a, b));
    const [first, second] = room;
    const noms = _noms(ctx);

    const scene = makeScene('couple.apart', { a, b, c: first || null }, { ending: 'scene' }, [], 'backyard');

    api.popDelta(a, 1);
    api.popDelta(b, 1);
    api.remember(a, b, 'we-played-it-apart', 1, { about: 'the vote' });
    if (first) api.addBond(a, first, 0.4);
    if (second) api.addBond(b, second, 0.4);
    return { scene, players: [a, b, first].filter(Boolean),
      badgeText: 'TWO CAMPAIGNS', badgeClass: 'green' };
  },
};

// ── the channel ───────────────────────────────────────────────────────

function _leakCast(house, ctx) {
  const pair = _couple(house);
  if (!pair) return null;
  const outside = _others(house, pair.a, pair.b);
  if (!outside.length) return null;
  // Somebody who actually confides in one of them. Failing a real closeness,
  // whoever is nearest — a secret only has to be told once.
  const source = _quiet(outside).sort((x, y) =>
    Math.max(bond(y, pair.a), bond(y, pair.b)) - Math.max(bond(x, pair.a), bond(x, pair.b))
    || (x < y ? -1 : 1))[0];
  if (!source) return null;
  const told = bond(source, pair.a) >= bond(source, pair.b) ? pair.a : pair.b;
  return { ...pair, source, told, partner: told === pair.a ? pair.b : pair.a };
}

const leakChannel = {
  id: 'showmance-leak-channel',
  category: 'deals',
  location: 'bedroom',
  weight(house, ctx) {
    const cast = _leakCast(house, ctx);
    if (!cast || house.length < 5) return 0;
    if (_once('showmance-leak-channel', ctx)) return 0;
    return _fit(ctx, 5 + Math.max(0, bond(cast.source, cast.told)) * 0.5);
  },
  fire(house, ctx, api) {
    const { source, told, partner } = _leakCast(house, ctx);

    const scene = makeScene('couple.leak', { a: source, b: told, c: partner }, { ending: 'scene' }, [], 'bedroom');

    _spend(this.id, ctx);
    // The couple has not done anything hostile. It costs them anyway, because
    // the house cannot tell one of them anything any more.
    api.suspicion(source, told, 1.1);
    api.suspicion(source, partner, 1.0);
    api.addBond(source, told, -0.9);
    api.remember(source, told, 'tells-them-everything', 2, { about: partner });
    api.addBond(told, partner, 0.3);
    return { scene, players: [source, told, partner], badgeText: 'IT GOES STRAIGHT TO THEM', badgeClass: 'red' };
  },
};

// ── the kitchen conversation ──────────────────────────────────────────

const jealousy = {
  id: 'showmance-jealousy',
  category: 'social',
  location: 'kitchen',
  weight(house, ctx) {
    const pair = _couple(house);
    if (!pair || house.length < 5 || _once('showmance-jealousy', ctx)) return 0;
    // A short fuse on either side is the whole mechanism.
    const fuse = (10 - Math.min(pStats(pair.a).temperament, pStats(pair.b).temperament)) / 10;
    return _fit(ctx, 3.5 + fuse * 6);
  },
  fire(house, ctx, api) {
    const { a, b } = _couple(house);
    _spend(this.id, ctx);
    // The jealous one is the one with the shorter fuse; the third person is
    // just a houseguest having a conversation. No romance is implied and none
    // is created — the point is that it does not need to be.
    const jealous = pStats(a).temperament <= pStats(b).temperament ? a : b;
    const partner = jealous === a ? b : a;
    const third = _quiet(_others(house, a, b))
      .sort((x, y) => bond(partner, y) - bond(partner, x) || (x < y ? -1 : 1))[0]
      || _others(house, a, b)[0];

    const scene = makeScene('couple.jealous', { a: jealous, b: partner, c: third || null }, { ending: 'scene' }, [], 'kitchen');

    api.addBond(jealous, partner, -0.6);
    api.addBond(jealous, third, -0.7);
    api.remember(jealous, third, 'too-comfortable-with-my-person', 1, { about: partner });
    api.suspicion(jealous, third, 0.5);
    return { scene, players: [jealous, partner, third].filter(Boolean),
      badgeText: 'COUNTING THE MINUTES', badgeClass: 'grey' };
  },
};

// ── one of them is on the block ───────────────────────────────────────

const blockPressure = {
  id: 'showmance-block-pressure',
  category: 'social',
  location: 'living-room',
  weight(house, ctx) {
    const pair = _couple(house);
    if (!pair || _once('showmance-block-pressure', ctx)) return 0;
    const noms = _noms(ctx);
    const exposed = noms.includes(pair.a) || noms.includes(pair.b);
    // Both up is worse, not better — then neither of them can hold it together.
    if (!exposed) return 0;
    return _fit(ctx, 10);
  },
  fire(house, ctx, api) {
    const { a, b } = _couple(house);
    _spend(this.id, ctx);
    const noms = _noms(ctx);
    const nominee = noms.includes(a) ? a : b;
    const stressed = nominee === a ? b : a;
    const room = _quiet(_others(house, a, b));
    const witness = room[0];

    const scene = makeScene('couple.pressure', { a: stressed, b: nominee, c: witness || null }, { ending: 'scene' }, [], 'living-room');

    api.addBond(a, b, 0.7);
    api.popDelta(stressed, -1);
    api.remember(nominee, stressed, 'fell-apart-for-me', 2, {});
    room.slice(0, 3).forEach(n => api.suspicion(n, stressed, 0.4));
    return { scene, players: [stressed, nominee, witness].filter(Boolean),
      badgeText: 'CARRIES IT BADLY', badgeClass: 'red' };
  },
};

export const SHOWMANCE_ARC_EVENTS = [
  defined, underground, separateCampaigns, leakChannel, jealousy, blockPressure,
];

export default SHOWMANCE_ARC_EVENTS;
