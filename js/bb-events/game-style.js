// ══════════════════════════════════════════════════════════════════════
// bb-events/game-style.js — strategies played, not announced
// ══════════════════════════════════════════════════════════════════════
//
// Each houseguest plays to win their own way (bb/game-style.js). These are the
// moves that way of playing makes, in the house, with what they cost and buy —
// the user, 2026-10-27: "don't announce every strategy, rather show it with their
// actions in the course of the whole season", and "focus a lot on the game".
//
// One move of each kind a week at most, by whoever plays that way and has been
// seen least. Manipulating and provoking already have their moves (bb-events/
// schemes.js, the blow-ups); these are the ways of playing that had none.
import { gs } from '../core.js';
import { pStats, band, bond, spotlightOrder, sharesAlliance, biggestThreat, targetOf, closestTo } from './_read.js';
import { makeScene } from '../bb/script/scene.js';
import { styleOf, anchorOf, anchorFor, playing } from '../bb/game-style.js';

const inHouse = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';
const others = (house, ...ex) => house.filter(n => n && !ex.includes(n));
const winsOf = n => { const r = gs.bb?.stats?.[n] || {}; return (r.hohWins || 0) + (r.vetoWins || 0) + (r.blockBusterWins || 0); };
// a way of playing is a season-long thing: one move every other week at most for a person, so it reads as a habit and
// not as the same scene every week (the season read, 2026-10-27: one floater's HOH visit every single week)
const wkOf = ctx => Number(ctx?.week?.num) || 0;
const movedLately = (n, ctx) => { const m = gs.bb?.styleMoves?.[n]; return m != null && wkOf(ctx) - m < 2; };
const moved = (n, ctx) => { ((gs.bb ||= {}).styleMoves ||= {})[n] = wkOf(ctx); };
const first = (house, ctx, style, ok = n => !!n) => spotlightOrder(playing(style, house).filter(n => !movedLately(n, ctx) && ok(n)))[0] || null;
// whoever is watching: the sharp ones, the least-seen first, so it is not the same pair of eyes every time
const watcher = (house, ...ex) => spotlightOrder(others(house, ...ex).filter(n => (pStats(n).intuition ?? 5) >= 5))[0] || null;
const closest = (house, a, ...ex) => others(house, a, ...ex).sort((x, y) => bond(a, y) - bond(a, x))[0] || null;

// ── comp: training and studying, and the house noticing ──
const compPrep = {
  id: 'style-comp-prep', category: 'social', oncePerWeek: true,
  weight(house, ctx) {
    if (!inHouse(ctx) || house.length < 5) return 0;
    return first(house, ctx, 'comp') ? band(7) : 0;
  },
  fire(house, ctx, api) {
    const a = first(house, ctx, 'comp');
    moved(a, ctx);
    const s = pStats(a);
    const study = (s.mental ?? 5) > ((s.physical ?? 5) + (s.endurance ?? 5)) / 2;
    const b = closest(house, a);
    const scene = makeScene('style.comp', { a, b }, { ending: study ? 'study' : 'train' }, [], study ? 'living-room' : 'backyard');
    api.popDelta(a, 1);
    // the house marks it: a player getting ready for every competition is the one nobody wants to face
    for (const w of spotlightOrder(others(house, a).filter(n => (pStats(n).intuition ?? 5) >= 6)).slice(0, 2)) {
      api.remember(w, a, 'threat', 1, { saw: study ? 'studying for the next comp' : 'training for the next comp' });
    }
    return { scene, players: [a, b].filter(Boolean), badgeText: study ? 'STUDYING' : 'TRAINING', badgeClass: 'blue' };
  },
};

// ── coattail: next to the strongest player, every day ──
const coattail = {
  id: 'style-coattail', category: 'social', oncePerWeek: true,
  weight(house, ctx) {
    if (!inHouse(ctx) || house.length < 5) return 0;
    const a = first(house, ctx, 'coattail', n => !!(anchorFor(n) || anchorOf(n, house)));
    return a ? band(7) : 0;
  },
  fire(house, ctx, api) {
    const a = first(house, ctx, 'coattail', n => !!(anchorFor(n) || anchorOf(n, house)));
    moved(a, ctx);
    const anchor = (anchorFor(a) && house.includes(anchorFor(a))) ? anchorFor(a) : anchorOf(a, house);
    const c = watcher(house, a, anchor);
    const scene = makeScene('style.coattail', { a, b: anchor, c }, { ending: winsOf(anchor) >= 1 ? 'winner' : 'scene' }, [], 'kitchen');
    api.addBond(a, anchor, 0.8);
    api.remember(anchor, a, 'loyalty', 1, { about: 'always in my corner' });
    // somebody sees the pair: a shield for the strong one, and a second name to deal with
    if (c) api.remember(c, a, 'protects', 1, { partner: anchor });
    return { scene, players: [a, anchor, c].filter(Boolean), badgeText: 'ON THE COATTAILS', badgeClass: 'grey' };
  },
};

// ── float: wherever the power is this week ──
const floatToPower = {
  id: 'style-float', category: 'social', oncePerWeek: true,
  weight(house, ctx) {
    if (!inHouse(ctx) || !ctx.hoh || house.length < 5) return 0;
    return first(house, ctx, 'float', n => n !== ctx.hoh) ? band(7) : 0;
  },
  fire(house, ctx, api) {
    const a = first(house, ctx, 'float', n => n !== ctx.hoh);
    moved(a, ctx);
    const c = watcher(house, a, ctx.hoh);
    const scene = makeScene('style.float', { a, b: ctx.hoh, c }, { ending: 'scene' }, [], 'hoh-room');
    api.addBond(a, ctx.hoh, 0.6);
    // ...and the sharpest person in the house writes them down as a vote that goes wherever the power goes
    if (c) api.suspicion(c, a, 0.5);
    return { scene, players: [a, ctx.hoh, c].filter(Boolean), badgeText: 'NEXT TO THE KEY', badgeClass: 'grey' };
  },
};

// ── social: a word with everybody ──
const socialRounds = {
  id: 'style-social-rounds', category: 'social', oncePerWeek: true,
  weight(house, ctx) {
    if (!inHouse(ctx) || house.length < 5) return 0;
    return first(house, ctx, 'social') ? band(7) : 0;
  },
  fire(house, ctx, api) {
    const a = first(house, ctx, 'social');
    moved(a, ctx);
    // the people they are least close to: that is the point of the rounds
    const cold = others(house, a).sort((x, y) => bond(a, x) - bond(a, y)).slice(0, 3);
    const [b, c] = cold;
    const scene = makeScene('style.social', { a, b, c }, { ending: 'scene' }, [], 'living-room');
    for (const n of cold) api.addBond(a, n, 0.4);
    return { scene, players: [a, ...cold], badgeText: 'MAKING THE ROUNDS', badgeClass: 'green' };
  },
};

// ── lowkey: asked in, and staying out ──
const lowkey = {
  id: 'style-lowkey', category: 'deals', oncePerWeek: true,
  weight(house, ctx) {
    if (!inHouse(ctx) || house.length < 6) return 0;
    return first(house, ctx, 'lowkey') ? band(6) : 0;
  },
  fire(house, ctx, api) {
    const a = first(house, ctx, 'lowkey');
    moved(a, ctx);
    const b = others(house, a).sort((x, y) => (pStats(y).strategic ?? 5) - (pStats(x).strategic ?? 5))[0];
    const c = targetOf(b) && targetOf(b) !== a ? targetOf(b) : others(house, a, b).sort((x, y) => winsOf(y) - winsOf(x))[0];
    const scene = makeScene('style.lowkey', { a, b, c }, { ending: 'scene' }, [], 'bedroom');
    // no fingerprints on anything: whoever was asking forgets about them a little
    api.addBond(a, b, -0.1);
    api.suspicion(b, a, -0.4);
    return { scene, players: [a, b], badgeText: 'STAYING OUT OF IT', badgeClass: 'grey' };
  },
};

// ── rise: the quiet one's move, late ──
const rise = {
  id: 'style-rise', category: 'deals', oncePerWeek: true,
  weight(house, ctx) {
    if (!inHouse(ctx) || house.length < 4) return 0;
    return first(house, ctx, 'rise') ? band(9) : 0;
  },
  fire(house, ctx, api) {
    const a = first(house, ctx, 'rise');
    moved(a, ctx);
    const b = closest(house, a);
    const c = biggestThreat(others(house, a, b)) || others(house, a, b)[0];
    const scene = makeScene('style.rise', { a, b, c }, { ending: 'scene' }, [], 'bedroom');
    api.setTarget(a, c, 'my move: the biggest player left');
    api.addBond(a, b, 0.5);
    // b takes it in, in proportion to how much b trusts a
    if (bond(b, a) >= 2) api.setTarget(b, c, `${a} brought me in on it`);
    return { scene, players: [a, b, c], badgeText: 'MAKING A MOVE', badgeClass: 'red' };
  },
};

// ── alliance: the one who runs it checks every vote ──
const allianceRun = {
  id: 'style-alliance-check', category: 'deals', oncePerWeek: true,
  weight(house, ctx) {
    if (!inHouse(ctx) || house.length < 5) return 0;
    return first(house, ctx, 'alliance', n => !!closestTo(n, others(house, n).filter(m => sharesAlliance(n, m)))) ? band(7) : 0;
  },
  fire(house, ctx, api) {
    const a = first(house, ctx, 'alliance', n => !!closestTo(n, others(house, n).filter(m => sharesAlliance(n, m))));
    moved(a, ctx);
    const members = others(house, a).filter(m => sharesAlliance(a, m));
    const b = closestTo(a, members);
    const al = (gs.namedAlliances || []).find(x => x?.name && x.active !== false && !x.dissolved && (x.members || []).includes(a) && (x.members || []).includes(b));
    const c = targetOf(a) && targetOf(a) !== b ? targetOf(a) : (ctx.nominees || []).find(n => !members.includes(n) && n !== a) || null;
    const scene = makeScene('style.alliance', { a, b, c }, { ending: c ? 'target' : 'scene', ...(al ? { alliance: al.name } : {}) }, [], 'bedroom');
    for (const m of members.slice(0, 4)) api.addBond(a, m, 0.25);
    return { scene, players: [a, b, c].filter(Boolean), badgeText: 'CHECKING THE NUMBERS', badgeClass: 'blue' };
  },
};

// ── read: noticing something true ──
const readHouse = {
  id: 'style-read', category: 'social', oncePerWeek: true,
  weight(house, ctx) {
    if (!inHouse(ctx) || house.length < 5) return 0;
    return first(house, ctx, 'read', n => !!_pairSeen(house, n)) ? band(7) : 0;
  },
  fire(house, ctx, api) {
    const a = first(house, ctx, 'read', n => !!_pairSeen(house, n));
    moved(a, ctx);
    const [c, d] = _pairSeen(house, a);
    ((gs.bb ||= {}).pairsRead ||= {})[`${a}|${[c, d].sort().join('+')}`] = wkOf(ctx);
    const b = closest(house, a, c, d);
    const scene = makeScene('style.read', { a, b, c, d }, { ending: 'scene' }, [], 'living-room');
    // a true read: they really are working together, and a now treats them as a pair
    api.suspicion(a, c, 0.6);
    api.suspicion(a, d, 0.6);
    api.remember(a, c, 'with', 1, { partner: d, saw: 'working together' });
    return { scene, players: [a, b, c, d].filter(Boolean), badgeText: 'SEES IT', badgeClass: 'blue' };
  },
};
/** Two people in an alliance together that the reader is not in: a real pair to notice. */
function _pairSeen(house, a) {
  const pool = others(house, a);
  for (const al of gs.namedAlliances || []) {
    if (!al?.members || al.active === false || al.dissolved || al.members.includes(a)) continue;
    const m = al.members.filter(n => pool.includes(n));
    if (m.length >= 2 && !gs.bb?.pairsRead?.[`${a}|${[m[0], m[1]].sort().join('+')}`]) return [m[0], m[1]];
  }
  return null;
}

export const GAME_STYLE_EVENTS = [compPrep, coattail, floatToPower, socialRounds, lowkey, rise, allianceRun, readHouse];
export default GAME_STYLE_EVENTS;
