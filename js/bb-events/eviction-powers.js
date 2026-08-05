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
import { pronouns } from '../players.js';
import { pStats, band } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
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
    const p = pronouns(spared);
    const named = against.slice(0, 3).join(', ');
    const text = _variant([
      `Every vote was read out and then nothing happened, so ${spared} is standing in the kitchen holding a complete list of the people who wanted ${p.obj} gone. ${named} are on it and all of them know ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} it.`,
      `${spared} has not said anything about the vote. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not need to — ${against.length} people in this house voted to remove ${p.obj}, it was announced out loud, and ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} still here.`,
      `The house gave ${spared} the one thing you are never supposed to hand somebody: a public, itemised list of their enemies, with nothing at the end of it.`,
      `${named} spend the day working out how to explain a vote that everybody heard and that cost them nothing except ${spared}.`,
    ], ctx, spared, named);
    for (const voter of against) {
      api.addBond(spared, voter, -1.4);
      api.suspicion(spared, voter, 1.4);
      try { api.remember(spared, voter, 'voted-me-out', 2, { survived: true }); } catch { /* texture */ }
    }
    api.popDelta(spared, 1);
    return { text, players: [spared, ...against.slice(0, 3)],
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
    const p = pronouns(hex.holder);
    const text = _variant([
      `${hex.holder} had a power nobody knew about and spent it on ${hex.spared} rather than on ${p.obj}self. ${reader} finds that more interesting than the eviction that did not happen — you only do that for somebody you are going to the end with.`,
      `The Hex is gone and ${hex.holder} is not protected by anything any more. ${reader} works that out roughly four minutes after the announcement.`,
      `"${hex.holder} just told us two things," ${reader} says. "That there was a power. And exactly who ${p.sub} ${p.sub === 'they' ? 'were' : 'was'} willing to lose it for."`,
      `${hex.holder} saved somebody else in front of the entire house and bought a partnership nobody can pretend is not there.`,
    ], ctx, hex.holder, reader);
    api.suspicion(reader, hex.holder, 1.5);
    api.addBond(hex.spared, hex.holder, 1.6);
    try { api.setTarget(reader, hex.holder, 'spent a secret power in public'); } catch { /* texture */ }
    return { text, players: [hex.holder, hex.spared, reader],
      badgeText: 'A PARTNERSHIP, CONFIRMED', badgeClass: 'gold' };
  },
};

export const EVICTION_POWER_EVENTS = [stillHere, spentItOnYou];
