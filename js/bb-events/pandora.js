// ══════════════════════════════════════════════════════════════════════
// bb-events/pandora.js — the box, and the story about the box
// ══════════════════════════════════════════════════════════════════════
//
// Pandora's Box already had the mechanic: an HOH gambles privately, the house
// pays publicly, and the prize is a secret the Debug panel owns. What it did
// not have was an AFTERMATH. The lockdown happened, two readers rolled their
// eyes on the night, and then the week carried on as though a houseguest had
// not just been caught holding a story nobody believes.
//
// These are the days after. Somebody's laundry is locked outside; the claim
// gets tested in front of an audience; two sharp players compare notes; the
// room argues about what it would have done, which says more about the room
// than about the box; and one houseguest quietly decides that whatever was in
// there is real and starts waiting for it to show up.
//
// Two rules for this family.
//
// The PRIZE is never named, guessed at by name, or hinted at specifically —
// not in text, not in a badge. The house does not know a power exists; it
// knows a backyard got locked and a story does not add up. Suspicion is
// allowed to point at the HOH. Nothing here may point at a Diamond Veto.
//
// And nothing fires on a sealed week. If the HOH is invisible, the box has no
// public owner to resent, and naming one would out them — the reach-around
// gotcha that has bitten this format twice.
import { gs } from '../core.js';
import { pStats, band, perceived, closestTo, furthestFrom, isVillainous } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

/** The box, but only when it has a public owner to talk about. */
const _box = ctx => {
  const box = ctx?.week?.pandorasBox;
  if (!box || !box.hoh || ctx?.week?.hohSecret) return null;
  return box;
};
const _opened = ctx => { const b = _box(ctx); return b && b.opened ? b : null; };
const _closed = ctx => { const b = _box(ctx); return b && !b.opened ? b : null; };

/** Last week's box, for the resentment that outlives the lockdown. */
function _lastBox(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w && w.num < now && now - w.num <= 1
      && w.pandorasBox?.opened && !w.hohSecret) return w;
  }
  return null;
}

// Casting is shared between weight() and fire(): the scheduler treats a
// positive weight as a promise that a beat WILL be produced, and a null return
// after being picked throws.
const _priceCast = (house, ctx) => {
  const box = _opened(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  // Whoever takes it worst: the shortest fuse in the house that is not the
  // person who caused it.
  const sore = _others(house, box.hoh).sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  return sore ? { box, sore } : null;
};
const _testCast = (house, ctx) => {
  const box = _opened(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  const tester = _others(house, box.hoh).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  const audience = _others(house, box.hoh, tester)[0] || null;
  return tester ? { box, tester, audience } : null;
};
const _compareCast = (house, ctx) => {
  const box = _opened(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  const readers = _others(house, box.hoh)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition).slice(0, 2);
  return readers.length === 2 ? { box, a: readers[0], b: readers[1] } : null;
};
const _debateCast = (house, ctx) => {
  const box = _box(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  const pool = _others(house, box.hoh);
  if (pool.length < 2) return null;
  const bold = [...pool].sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
  const careful = [...pool].sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
  return bold && careful && bold !== careful ? { box, bold, careful } : null;
};
const _watcherCast = (house, ctx) => {
  const box = _opened(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  const watcher = _others(house, box.hoh)
    .sort((a, b) => (pStats(b).strategic + pStats(b).intuition) - (pStats(a).strategic + pStats(a).intuition))[0];
  return watcher ? { box, watcher } : null;
};
const _oversellCast = (house, ctx) => {
  const box = _opened(ctx);
  if (!box || !house.includes(box.hoh) || pStats(box.hoh).strategic > 6) return null;
  const mark = furthestFrom(box.hoh, _others(house, box.hoh));
  return mark ? { box, mark } : null;
};
const _closedCast = (house, ctx) => {
  const box = _closed(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  const confidant = closestTo(box.hoh, _others(house, box.hoh));
  return confidant ? { box, confidant } : null;
};
const _stillPayingCast = (house, ctx) => {
  const last = _lastBox(ctx);
  const hoh = last?.pandorasBox?.hoh;
  if (!hoh || !house.includes(hoh)) return null;
  const sore = _others(house, hoh).sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  return sore ? { last, hoh, sore, claim: last.pandorasBox.publicClaim } : null;
};

// ── the price, taken personally ───────────────────────────────────────
const thePrice = {
  id: 'pandora-price-resented',
  category: 'house-life',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _priceCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _priceCast(house, ctx);
    if (!cast) return null;
    const { box, sore } = cast;
    const scene = makeScene('pan.price', { a: sore, b: box.hoh }, { ending: 'scene', claim: box.publicClaim }, [], 'living-room');
    api.addBond(sore, box.hoh, -0.6);
    api.suspicion(sore, box.hoh, 0.5);
    api.popDelta(sore, 0.5);
    try { api.remember(sore, box.hoh, 'cost-the-house', 1, { twist: 'bb-pandoras-box' }); } catch { /* texture */ }
    return { scene, players: [sore, box.hoh], badgeText: 'THE HOUSE PAYS', badgeClass: 'red' };
  },
};

// ── the story, tested in front of an audience ─────────────────────────
const storyTested = {
  id: 'pandora-story-tested',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _testCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _testCast(house, ctx);
    if (!cast) return null;
    const { box, tester, audience } = cast;
    // Selling it is a social stat. Selling it badly makes the lie the story.
    const st = pStats(box.hoh);
    const holds = st.social * 0.6 + st.strategic * 0.4 >= 6;
    const scene = makeScene('pan.test', { a: box.hoh, b: tester, c: audience || null }, { ending: holds ? 'holds' : 'cracks', claim: box.publicClaim }, [], 'kitchen');
    api.suspicion(tester, box.hoh, holds ? 0.4 : 1.5);
    if (!holds) {
      api.addBond(tester, box.hoh, -0.5);
      if (audience) api.suspicion(audience, box.hoh, 0.7);
      try { api.remember(tester, box.hoh, 'told-the-house-a-story', 1, { twist: 'bb-pandoras-box' }); } catch { /* texture */ }
    }
    return { scene, players: [box.hoh, tester, audience].filter(Boolean),
      badgeText: holds ? 'THE STORY HOLDS' : 'THE STORY DOES NOT HOLD',
      badgeClass: holds ? 'grey' : 'red' };
  },
};

// ── two readers compare notes ─────────────────────────────────────────
const doubtersCompare = {
  id: 'pandora-doubters-compare',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _compareCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _compareCast(house, ctx);
    if (!cast) return null;
    const { box, a, b } = cast;
    const scene = makeScene('pan.compare', { a, b }, { ending: 'scene', claim: box.publicClaim, holder: box.hoh }, [], 'bedroom');
    api.suspicion(a, box.hoh, 0.9);
    api.suspicion(b, box.hoh, 0.9);
    api.addBond(a, b, 0.5);
    return { scene, players: [a, b, box.hoh], badgeText: 'COMPARING NOTES', badgeClass: 'blue' };
  },
};

// ── what the room would have done ─────────────────────────────────────
//
// The only event in the family that fires whether or not the box was opened,
// because the hypothetical is the interesting half: a houseguest telling the
// room what they would have done is telling the room who they are.
const wouldYouOpen = {
  id: 'pandora-would-you-open',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _debateCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _debateCast(house, ctx);
    if (!cast) return null;
    const { box, bold, careful } = cast;
    const scene = makeScene('pan.debate', { a: bold, b: careful }, { ending: box.opened ? 'opened' : 'shut', holder: box.hoh }, [], 'living-room');
    // Saying it out loud is information the house keeps.
    api.suspicion(careful, bold, 0.4);
    api.addBond(bold, careful, -0.2);
    api.popDelta(bold, 0.5);
    return { scene, players: [bold, careful], badgeText: 'WOULD YOU OPEN IT', badgeClass: 'grey' };
  },
};

// ── somebody starts waiting for it ────────────────────────────────────
const watchingForIt = {
  id: 'pandora-watching-for-it',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _watcherCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _watcherCast(house, ctx);
    if (!cast) return null;
    const { box, watcher } = cast;
    const scene = makeScene('pan.watch', { a: watcher, b: box.hoh }, { ending: 'scene' }, [], 'kitchen');
    api.suspicion(watcher, box.hoh, 1.3);
    try { api.remember(watcher, box.hoh, 'holding-something', 1, { twist: 'bb-pandoras-box' }); } catch { /* texture */ }
    return { scene, players: [watcher, box.hoh], badgeText: 'WAITING FOR IT', badgeClass: 'gold' };
  },
};

// ── overselling it ────────────────────────────────────────────────────
const oversell = {
  id: 'pandora-oversells',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _oversellCast(house, ctx) ? band(6, 10) : 0;
  },
  fire(house, ctx, api) {
    const cast = _oversellCast(house, ctx);
    if (!cast) return null;
    const { box, mark } = cast;
    const scene = makeScene('pan.oversell', { a: box.hoh, b: mark }, { ending: 'scene', claim: box.publicClaim }, [], 'kitchen');
    api.suspicion(mark, box.hoh, 1.1);
    api.popDelta(box.hoh, -0.5);
    return { scene, players: [box.hoh, mark], badgeText: 'PROTESTING TOO MUCH', badgeClass: 'red' };
  },
};

// ── the door that stayed shut ─────────────────────────────────────────
const leftClosed = {
  id: 'pandora-left-closed',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _closedCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _closedCast(house, ctx);
    if (!cast) return null;
    const { box, confidant } = cast;
    const villainish = isVillainous(confidant);
    const scene = makeScene('pan.closed', { a: box.hoh, b: confidant }, { ending: 'scene', intent: villainish ? 'villain' : 'kind' }, [], 'hoh-room');
    api.addBond(box.hoh, confidant, 0.5);
    if (villainish) api.suspicion(confidant, box.hoh, 0.3);
    return { scene, players: [box.hoh, confidant], badgeText: 'THE DOOR STAYED SHUT', badgeClass: 'grey' };
  },
};

// ── still paying for it a week later ──────────────────────────────────
const stillPaying = {
  id: 'pandora-still-paying',
  category: 'house-life',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _stillPayingCast(house, ctx) ? band(7, 11) : 0;
  },
  fire(house, ctx, api) {
    const cast = _stillPayingCast(house, ctx);
    if (!cast) return null;
    const { hoh, sore, claim } = cast;
    const scene = makeScene('pan.paying', { a: sore, b: hoh }, { ending: 'scene', claim }, [], 'kitchen');
    api.suspicion(sore, hoh, 0.6);
    api.addBond(sore, hoh, -0.3);
    return { scene, players: [sore, hoh], badgeText: 'STILL PAYING FOR IT', badgeClass: 'grey' };
  },
};

export const PANDORA_EVENTS = [
  thePrice, storyTested, doubtersCompare, wouldYouOpen,
  watchingForIt, oversell, leftClosed, stillPaying,
];
