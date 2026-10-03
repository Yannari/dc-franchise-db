// ══════════════════════════════════════════════════════════════════════
// bb-events/eviction-powers.js — the night that did not end
// ══════════════════════════════════════════════════════════════════════
//
// THE HALTING HEX cancels the eviction. Everybody voted, everybody's vote was
// read out, and the person those votes were aimed at is still here, holding a
// complete list of who wanted them gone. That is the most dangerous piece of
// information anybody in this game can be handed, and the house handed it over
// for nothing.
//
// The Round Trip Ticket reverses a night rather than stopping it and owns its
// own reactions in js/bb/round-trip.js. This file is the Hex, where there IS
// somebody to be angry at: a houseguest stood up and stopped the eviction in
// front of everybody, and now everybody knows they had something.
import { gs } from '../core.js';
import { pStats, band } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
/** Reactions land on the campaign, or on next week's house life. */
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

/** The most recent week whose eviction did not stick, within living memory. */
function _recent(ctx, key) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w && w.num <= now && now - w.num <= 1 && w[key]) return w;
  }
  return null;
}

const _hexCast = (house, ctx) => {
  const w = _recent(ctx, 'haltingHex');
  const hex = w?.haltingHex;
  if (!hex || !house.includes(hex.spared)) return null;
  // Whoever voted to remove the person who is still standing here.
  const against = (w.ballots || []).filter(b => b.evict === hex.spared)
    .map(b => b.voter).filter(n => house.includes(n));
  return against.length ? { hex, spared: hex.spared, against, holder: hex.holder } : null;
};
const _hexHolderCast = (house, ctx) => {
  const w = _recent(ctx, 'haltingHex');
  const hex = w?.haltingHex;
  if (!hex || hex.selfSave || !house.includes(hex.holder)) return null;
  const reader = _others(house, hex.holder, hex.spared)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return reader ? { hex, reader } : null;
};
// ── the list of people who wanted you gone ────────────────────────────
const stillHere = {
  id: 'evictionpower-still-here',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _hexCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _hexCast(house, ctx);
    if (!cast) return null;
    const { spared, against } = cast;
    const named = against.slice(0, 3).join(', ');
    const namedVerb = Math.min(against.length, 3) === 1 ? 'is' : 'are';
    const scene = makeScene('hex.list', { a: spared, b: against[0] }, { ending: 'scene', group: named }, [], 'kitchen');
    for (const voter of against) {
      api.addBond(spared, voter, -1.4);
      api.suspicion(spared, voter, 1.4);
      try { api.remember(spared, voter, 'voted-me-out', 2, { survived: true }); } catch { /* texture */ }
    }
    api.popDelta(spared, 1);
    return { scene, players: [spared, ...against.slice(0, 3)],
      badgeText: 'THE LIST', badgeClass: 'red' };
  },
};

// ── the person who burned a secret on somebody else ───────────────────
const spentItOnYou = {
  id: 'evictionpower-spent-it',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _hexHolderCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _hexHolderCast(house, ctx);
    if (!cast) return null;
    const { hex, reader } = cast;
    const scene = makeScene('hex.spent', { a: hex.holder, b: hex.spared, c: reader }, { ending: 'scene' }, [], 'living-room');
    api.suspicion(reader, hex.holder, 1.5);
    api.addBond(hex.spared, hex.holder, 1.6);
    try { api.setTarget(reader, hex.holder, 'spent a secret power in public'); } catch { /* texture */ }
    return { scene, players: [hex.holder, hex.spared, reader],
      badgeText: 'A PARTNERSHIP, CONFIRMED', badgeClass: 'gold' };
  },
};

export const EVICTION_POWER_EVENTS = [stillHere, spentItOnYou];
