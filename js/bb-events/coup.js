// ══════════════════════════════════════════════════════════════════════
// bb-events/coup.js — the week somebody took off you in public
// ══════════════════════════════════════════════════════════════════════
//
// Every other power family in this house is about not knowing. This one is the
// opposite and that is the whole flavour: a Coup d'État is played standing up,
// in the living room, with a name attached. Nobody is hunting anybody. The
// house watched a houseguest reach across the room and take the week out of
// the Head of Household's hands, and everyone in it knows exactly who to be
// angry at.
//
// So there is no paranoia here and no wrong suspects. What there is instead:
//
//   a Head of Household with three days of reign left and nothing to do with
//   them, having lost the only thing the job actually gives you
//   two houseguests who were safe an hour ago and are on the block now, put
//   there by somebody with no authority to do it and every right to
//   somebody who was ON that block and is not any more, holding a debt the
//   whole house watched being created
//   and a holder who is now, permanently, the most dangerous person in the
//   game — because they proved they had something, and nobody knows whether
//   that was the only thing they had
//
// Reads week.coup { holder, removed, named, visibility }.
import { gs } from '../core.js';
import { pStats, band, perceived, closestTo, furthestFrom, isVillainous } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

/**
 * Where a coup reaction can actually land.
 *
 * The power resolves AFTER the veto ceremony, and a week's House Life
 * stretches are all over by then — the last one runs before the ceremony. So
 * gating this family on `house` acts, the way every other twist family is
 * gated, meant it could never fire once in a real week. The campaign is the
 * part of the week that happens after the block is final, which is exactly
 * when a house reacts to the block changing.
 */
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

const _coup = ctx => ctx?.week?.coup || null;
const _hoh = ctx => (ctx?.week?.hohSecret ? null : (ctx?.week?.hoh || ctx?.hoh)) || null;

// Casting shared by weight() and fire(): a positive weight is a promise.
const _dethronedCast = (house, ctx) => {
  const c = _coup(ctx);
  const hoh = _hoh(ctx);
  if (!c || !hoh || !house.includes(hoh) || !house.includes(c.holder) || hoh === c.holder) return null;
  const witness = closestTo(hoh, _others(house, hoh, c.holder));
  return { c, hoh, witness };
};
const _seatedCast = (house, ctx) => {
  const c = _coup(ctx);
  const who = (c?.named || []).find(n => house.includes(n) && n !== c.holder);
  if (!who) return null;
  const other = (c.named || []).find(n => n !== who && house.includes(n)) || null;
  return { c, who, other };
};
const _savedCast = (house, ctx) => {
  const c = _coup(ctx);
  const who = (c?.removed || []).find(n => house.includes(n) && n !== c.holder);
  if (!who || !house.includes(c.holder)) return null;
  const watcher = _others(house, who, c.holder)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return { c, who, watcher };
};
const _threatCast = (house, ctx) => {
  const c = _coup(ctx);
  if (!c || !house.includes(c.holder)) return null;
  const reader = _others(house, c.holder, ...(c.named || []))
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return reader ? { c, reader } : null;
};

/** A coup that already happened, for the reputation it leaves behind. */
function _lastCoup(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    // This event is explicitly the following week's immediate fallout.
    if (w && w.num < now && now - w.num <= 1 && w.coup?.holder) return w;
  }
  return null;
}
const _afterCast = (house, ctx) => {
  if (_coup(ctx)) return null;
  const last = _lastCoup(ctx);
  const holder = last?.coup?.holder;
  if (!holder || !house.includes(holder)) return null;
  const plotter = _others(house, holder)
    .sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return plotter ? { holder, plotter, last } : null;
};

// ── a reign with nothing left in it ───────────────────────────────────
const dethroned = {
  id: 'coup-dethroned',
  category: 'ceremonies',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _dethronedCast(house, ctx) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _dethronedCast(house, ctx);
    if (!cast) return null;
    const { c, hoh, witness } = cast;
    const st = pStats(hoh);
    const loud = st.temperament <= 5;
    const scene = makeScene('coup.dethroned', { a: hoh, b: c.holder, c: witness || null }, { ending: loud ? 'loud' : 'quiet' }, [], 'hoh-room');
    // The bond damage is applied by the engine; this is the reign it cost.
    api.popDelta(hoh, loud ? -1 : 0.5);
    if (witness) api.addBond(hoh, witness, 0.4);
    return { scene, players: [hoh, c.holder, witness].filter(Boolean),
      badgeText: loud ? 'A REIGN IN NAME ONLY' : 'TAKING IT QUIETLY',
      badgeClass: loud ? 'red' : 'grey' };
  },
};

// ── seated by somebody who was not allowed to ─────────────────────────
const seated = {
  id: 'coup-seated',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _seatedCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _seatedCast(house, ctx);
    if (!cast) return null;
    const { c, who, other } = cast;
    const scene = makeScene('coup.seated', { a: who, b: c.holder }, { ending: 'scene', intent: other ? 'pair' : 'solo', other: other || '' }, [], 'living-room');
    // The grievance is the engine's; this is the campaign it forces.
    api.suspicion(who, c.holder, 1.6);
    api.popDelta(who, 1);
    return { scene, players: [who, c.holder, other].filter(Boolean),
      badgeText: 'SAFE AN HOUR AGO', badgeClass: 'red' };
  },
};

// ── the debt nobody can pretend not to have ───────────────────────────
const savedDebt = {
  id: 'coup-saved-debt',
  category: 'deals',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _savedCast(house, ctx) ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _savedCast(house, ctx);
    if (!cast) return null;
    const { c, who, watcher } = cast;
    const scene = makeScene('coup.saved', { a: who, b: c.holder, c: watcher || null }, { ending: 'scene' }, [], 'kitchen');
    api.addBond(who, c.holder, 0.8);
    if (watcher) api.suspicion(watcher, who, 0.9);
    try { api.remember(who, c.holder, 'took-me-off-the-block', 2, { act: 'coup-d-etat' }); } catch { /* texture */ }
    return { scene, players: [who, c.holder, watcher].filter(Boolean),
      badgeText: 'A DEBT WITH WITNESSES', badgeClass: 'blue' };
  },
};

// ── the biggest threat in the house, now confirmed ────────────────────
const nowATarget = {
  id: 'coup-now-a-target',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _threatCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _threatCast(house, ctx);
    if (!cast) return null;
    const { c, reader } = cast;
    const scene = makeScene('coup.target', { a: reader, b: c.holder }, { ending: 'scene' }, [], 'backyard');
    api.suspicion(reader, c.holder, 1.8);
    api.popDelta(c.holder, 1.5);
    try { api.setTarget(reader, c.holder, 'played a Coup and made everybody watch'); } catch { /* texture */ }
    return { scene, players: [reader, c.holder], badgeText: 'THE BIGGEST NAME IN THE HOUSE', badgeClass: 'gold' };
  },
};

// ── and the week after ────────────────────────────────────────────────
const afterwards = {
  id: 'coup-afterwards',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    return _afterCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _afterCast(house, ctx);
    if (!cast) return null;
    const { holder, plotter } = cast;
    const scene = makeScene('coup.after', { a: plotter, b: holder }, { ending: 'scene' }, [], 'backyard');
    api.suspicion(plotter, holder, 1.2);
    try { api.setTarget(plotter, holder, 'took a week off somebody in public'); } catch { /* texture */ }
    return { scene, players: [plotter, holder], badgeText: 'NOBODY FORGOT', badgeClass: 'red' };
  },
};

export const COUP_EVENTS = [dethroned, seated, savedDebt, nowATarget, afterwards];
