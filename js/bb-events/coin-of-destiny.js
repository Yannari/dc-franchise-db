// ══════════════════════════════════════════════════════════════════════
// bb-events/coin-of-destiny.js — dethroned by nobody in particular
// ══════════════════════════════════════════════════════════════════════
//
// The Coin is the Coup with the name taken off, and the whole family lives in
// that difference.
//
// A Coup leaves a dethroned Head of Household with somebody to hate, which is
// painful and clean. The Coin leaves them with a LIST — everybody who bought
// in, publicly, in front of the room — one of whom took their week, and no way
// to tell which. That is worse, and it is worse in a way the house can watch:
// the suspicion is aimed at four or five people who are all equally, visibly
// guilty of having wanted it.
//
// The other half nobody else has: buying in is itself the announcement. You
// paid, in public, to try to take the nominations. Even the person who called
// it WRONG has told the entire house what they would have done with it.
//
// Rules: the winner is never named as the person who called it, and no beat
// may state that the call went a particular way for a particular person. Who
// bought in is public and fair game — that is the material.
import { gs } from '../core.js';
import { pStats, band, perceived, closestTo, furthestFrom } from './_read.js';
import { makeScene } from '../bb/script/scene.js';
import { numberWord } from '../bb/script/inject.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _list = names => names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

const _coin = ctx => ctx?.week?.coin || null;
/** Internal casting only — never narrated as the person who called it. */
const _winner = ctx => _coin(ctx)?.winner || null;

const _dethronedCast = (house, ctx) => {
  const c = _coin(ctx);
  const hoh = ctx?.week?.hohSecret ? null : (ctx?.week?.hoh || ctx?.hoh);
  if (!c?.calledRight || !hoh || !house.includes(hoh)) return null;
  const buyers = (c.buyers || []).filter(n => house.includes(n) && n !== hoh);
  return buyers.length ? { c, hoh, buyers } : null;
};
const _buyerCast = (house, ctx) => {
  const c = _coin(ctx);
  const buyers = (c?.buyers || []).filter(n => house.includes(n));
  if (!buyers.length) return null;
  const who = [...buyers].sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
  const watcher = _others(house, who).sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return watcher ? { c, who, watcher, buyers } : null;
};
const _abstainerCast = (house, ctx) => {
  const c = _coin(ctx);
  // Keeping your money and not HAVING it look identical from the sofa and mean
  // opposite things about somebody's season, so the people who walked up to the
  // table and came up short are excluded — narrating them as abstainers reads
  // their worst week of the season as a shrewd decision not to play.
  const out = [...(c?.buyers || []), ...(c?.short || [])];
  const abstained = house.filter(n => !out.includes(n) && n !== (ctx?.week?.hoh));
  if (!c || abstained.length < 1) return null;
  const who = [...abstained].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  const reader = _others(house, who).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return reader ? { c, who, reader } : null;
};
const _seatedCast = (house, ctx) => {
  const c = _coin(ctx);
  const who = (c?.nominees || []).find(n => house.includes(n));
  if (!who) return null;
  const buyers = (c.buyers || []).filter(n => house.includes(n) && n !== who);
  return buyers.length ? { c, who, buyers } : null;
};
const _winnerCast = (house, ctx) => {
  const c = _coin(ctx);
  const w = _winner(ctx);
  if (!c || !w || !house.includes(w)) return null;
  const watcher = _others(house, w).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { c, w, watcher } : null;
};

// ── a list of suspects who all paid to be on it ───────────────────────
const dethronedByNobody = {
  id: 'coin-dethroned-by-nobody',
  category: 'ceremonies',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _dethronedCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _dethronedCast(house, ctx);
    if (!cast) return null;
    const { hoh, buyers } = cast;
    const scene = makeScene('coin.dethroned', { a: hoh, b: buyers[0] }, { ending: 'scene', intent: buyers.length > 1 ? 'many' : 'one', group: _list(buyers.slice(0, 3)), buyers: numberWord(buyers.length) }, [], 'living-room');
    for (const b of buyers) {
      api.suspicion(hoh, b, 1.1);
      api.addBond(hoh, b, -0.8);
    }
    api.popDelta(hoh, -0.5);
    return { scene, players: [hoh, ...buyers.slice(0, 3)],
      badgeText: 'A ROOM FULL OF SUSPECTS', badgeClass: 'red' };
  },
};

// ── paying is the announcement ────────────────────────────────────────
const paidInPublic = {
  id: 'coin-paid-in-public',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _buyerCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _buyerCast(house, ctx);
    if (!cast) return null;
    const { who, watcher, buyers } = cast;
    const scene = makeScene('coin.paid', { a: who, b: watcher }, { ending: 'scene' }, [], 'kitchen');
    api.suspicion(watcher, who, 1.2);
    try { api.remember(watcher, who, 'paid-for-power', 1, { twist: 'bb-coin-of-destiny' }); } catch { /* texture */ }
    return { scene, players: [who, watcher], badgeText: 'PAID IN PUBLIC', badgeClass: 'gold' };
  },
};

// ── and not paying is one too ─────────────────────────────────────────
const keptTheirMoney = {
  id: 'coin-kept-their-money',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _abstainerCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _abstainerCast(house, ctx);
    if (!cast) return null;
    const { who, reader } = cast;
    const scene = makeScene('coin.kept', { a: who, b: reader }, { ending: 'scene' }, [], 'living-room');
    api.suspicion(reader, who, 0.9);
    return { scene, players: [who, reader], badgeText: 'KEPT OUT OF IT', badgeClass: 'grey' };
  },
};

// ── seated by an anonymous hand ───────────────────────────────────────
const seatedByNobody = {
  id: 'coin-seated-by-nobody',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _seatedCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _seatedCast(house, ctx);
    if (!cast) return null;
    const { who, buyers } = cast;
    const suspect = buyers[0];
    const scene = makeScene('coin.seated', { a: who, b: suspect }, { ending: 'scene' }, [], 'living-room');
    api.suspicion(who, suspect, 1.3);
    api.addBond(who, suspect, -0.8);
    api.popDelta(who, 1);
    return { scene, players: [who, suspect], badgeText: 'NOMINATED BY NOBODY', badgeClass: 'red' };
  },
};

// ── the person who called it, being ordinary ──────────────────────────
const calledItQuietly = {
  id: 'coin-called-it-quietly',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _winnerCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _winnerCast(house, ctx);
    if (!cast) return null;
    const { c, w, watcher } = cast;
    const st = pStats(w);
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const scene = makeScene('coin.winner', { a: w, b: watcher }, { ending: overplayed ? 'overplayed' : 'quiet' }, [], 'kitchen');
    if (overplayed) {
      api.suspicion(watcher, w, 1.5);
      try { api.remember(watcher, w, 'suspected-the-coin', 1, { twist: 'bb-coin-of-destiny' }); } catch { /* texture */ }
    }
    return { scene, players: [w, watcher],
      badgeText: overplayed ? 'KNOWS TOO MUCH ABOUT IT' : 'AS BLANK AS ANYBODY',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

export const COIN_EVENTS = [
  dethronedByNobody, paidInPublic, keptTheirMoney, seatedByNobody, calledItQuietly,
];
