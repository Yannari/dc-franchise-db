// ══════════════════════════════════════════════════════════════════════
// bb-events/invisible.js — the week nobody signed
// ══════════════════════════════════════════════════════════════════════
//
// On an Invisible HOH week the entire power-hoh family goes silent — there
// is no public HOH room, no pitch queue, no court to hold — which left a
// hole exactly where the format's paranoia should be. These events are that
// paranoia: the sofa symposium about who did it, the direct accusation that
// may ruin an innocent friendship, the bold liar taking credit for a
// nomination they never made, and the real winner performing innocence one
// notch too loudly for the sharpest person in the room.
//
// Rules of the family: every event is gated on ctx.week.hohSecret; the text
// may show the real HOH DOING things (speculating, deflecting — the house
// sees a person, not a title) but may never narrate them as the HOH; and
// every guess, right or wrong, has consequences — that is the whole twist.
import {
  pStats, band, perceived, furthestFrom, isVillainous,
} from './_read.js';
import { freshLine } from '../bb/aired.js';
import { makeScene } from '../bb/script/scene.js';

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _sealed = ctx => !!ctx?.week?.hohSecret;
const _realHoh = ctx => ctx?.week?.hoh || null;   // internal casting only — never narrated as HOH
const _nominees = ctx => (ctx?.nominees || ctx?.week?.initialNominees || []).filter(Boolean);

/** A deterministic pick that varies by week and salt, without Math.random. */
function _pick(list, ctx, ...salt) {
  if (!list.length) return null;
  const key = `${ctx?.week?.num || 0}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return freshLine(list, hash, ctx);
}

// ── the sofa symposium ────────────────────────────────────────────────
const whodunitCircle = {
  id: 'invisible-whodunit-circle',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    return band(9, 14);
  },
  fire(house, ctx, api) {
    const noms = _nominees(ctx);
    const pool = _others(house, ...noms);
    if (pool.length < 3) return null;
    const talkers = pool.slice(0, 4);
    // The name the room floats: whoever the group collectively trusts least —
    // which is a read of the ROOM, not of the truth, and is often wrong.
    const accused = _pick(pool.filter(n => !talkers.slice(0, 2).includes(n))
      .sort((a, b) => (perceived(talkers[0], a) ?? 0) - (perceived(talkers[0], b) ?? 0)).slice(0, 2), ctx, 'accused');
    if (!accused) return null;
    const right = accused === _realHoh(ctx);
    const scene = makeScene('inv.circle', { a: talkers[0], b: talkers[1], c: accused }, { ending: 'scene' }, [], 'living-room');
    // The room's suspicion is a real force, aimed by consensus — at whoever
    // it lands on, deserved or not.
    talkers.forEach(t => { if (t !== accused) api.suspicion(t, accused, 0.5); });
    return { scene, players: [...talkers.slice(0, 3), accused].filter((n, i, a) => a.indexOf(n) === i),
      badgeText: right ? 'CLOSING IN' : 'WRONG SCENT', badgeClass: right ? 'gold' : 'grey' };
  },
};

// ── the direct accusation ─────────────────────────────────────────────
const wrongAccusation = {
  id: 'invisible-accusation',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    return band(7, 12);
  },
  fire(house, ctx, api) {
    const noms = _nominees(ctx);
    const pool = _others(house, ...noms);
    // The hottest head among the non-nominees pulls the trigger.
    const accuser = [...pool].sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
    if (!accuser) return null;
    const correct = pStats(accuser).intuition >= 7 && _realHoh(ctx) && _realHoh(ctx) !== accuser;
    const accused = correct ? _realHoh(ctx)
      : furthestFrom(accuser, pool.filter(n => n !== accuser && n !== _realHoh(ctx))) || null;
    if (!accused) return null;
    const scene = makeScene('inv.accuse', { a: accuser, b: accused }, { ending: 'scene' }, [], 'kitchen');
    api.addBond(accuser, accused, -0.7);
    api.suspicion(accuser, accused, 1.2);
    try { api.remember(accused, accuser, 'grudge', 1, { act: 'house', invisibleWeek: true }); } catch { /* texture */ }
    return { scene, players: [accuser, accused],
      badgeText: correct ? 'DEAD ON' : 'THE WRONG DOOR', badgeClass: correct ? 'gold' : 'red' };
  },
};

// ── taking credit for someone else's nomination ───────────────────────
const falseCredit = {
  id: 'invisible-false-credit',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    // Only a villain with nerve claims a move they never made.
    const pool = _others(house, ..._nominees(ctx)).filter(n => n !== _realHoh(ctx)
      && isVillainous(n) && pStats(n).boldness >= 6);
    return pool.length ? band(6, 10) : 0;
  },
  fire(house, ctx, api) {
    const pool = _others(house, ..._nominees(ctx)).filter(n => n !== _realHoh(ctx)
      && isVillainous(n) && pStats(n).boldness >= 6);
    const liar = _pick(pool, ctx, 'liar');
    if (!liar) return null;
    const audience = _pick(_others(house, liar, ..._nominees(ctx)), ctx, 'audience');
    if (!audience) return null;
    const scene = makeScene('inv.credit', { a: liar, b: audience }, { ending: 'scene' }, [], 'living-room');
    // Claiming power buys fear and costs safety: the room starts treating the
    // liar as armed, which is respect right up until it is a target.
    api.suspicion(audience, liar, 1.4);
    api.popDelta(liar, 1);
    try { api.remember(audience, liar, 'claimed-the-nomination', 1, { invisibleWeek: true }); } catch { /* texture */ }
    return { scene, players: [liar, audience], badgeText: 'TAKING CREDIT', badgeClass: 'red' };
  },
};

// ── the winner performs innocence ─────────────────────────────────────
const performedInnocence = {
  id: 'invisible-performed-innocence',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    return _realHoh(ctx) && (ctx.phase === 'post-noms' || ctx.phase === 'post-veto') ? band(8, 13) : 0;
  },
  fire(house, ctx, api) {
    const hoh = _realHoh(ctx);
    const noms = _nominees(ctx);
    if (!hoh || !house.includes(hoh)) return null;
    // The sharpest audience member is the danger.
    const watcher = _others(house, hoh, ...noms)
      .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
    if (!watcher) return null;
    const st = pStats(hoh);
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const scene = makeScene('inv.innocence', { a: hoh, b: watcher }, { ending: overplayed ? 'overplayed' : 'quiet' }, [], 'living-room');
    if (overplayed) {
      // The slip is a real clue: the watcher's suspicion lands on the truth.
      api.suspicion(watcher, hoh, 1.6);
      try { api.remember(watcher, hoh, 'suspected-invisible-hoh', 1, { invisibleWeek: true }); } catch { /* texture */ }
    }
    return { scene, players: [hoh, watcher],
      badgeText: overplayed ? 'ONE NOTCH TOO LOUD' : 'FLAWLESS ALIBI',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

// ── the alibi pact ────────────────────────────────────────────────────
const alibiPact = {
  id: 'invisible-alibi-pact',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    return band(6, 10);
  },
  fire(house, ctx, api) {
    const noms = _nominees(ctx);
    const pool = _others(house, ...noms);
    const a = _pick(pool, ctx, 'alibi-a');
    if (!a) return null;
    const b = pool.filter(n => n !== a).sort((x, y) => (perceived(a, y) ?? 0) - (perceived(a, x) ?? 0))[0];
    if (!b) return null;
    const scene = makeScene('inv.alibi', { a, b }, { ending: 'scene' }, [], 'backyard');
    api.addBond(a, b, 0.5);
    return { scene, players: [a, b], badgeText: 'THE ALIBI PACT', badgeClass: 'blue' };
  },
};

// ── a nominee works their theory ──────────────────────────────────────
const nomineeDetective = {
  id: 'invisible-nominee-detective',
  category: 'invisible',
  weight(house, ctx) {
    if (!_sealed(ctx) || ctx.act !== 'house') return 0;
    return (_nominees(ctx).length && (ctx.week?.hohGuesses || []).length) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const guesses = ctx.week?.hohGuesses || [];
    const entry = _pick(guesses.filter(g => house.includes(g.who) && house.includes(g.guess)), ctx, 'detective');
    if (!entry) return null;
    const { who, guess, correct } = entry;
    const confidant = _others(house, who, guess, ..._nominees(ctx))[0];
    const scene = makeScene('inv.detective', { a: who, b: guess, c: confidant || null }, { ending: 'scene' }, [], 'kitchen');
    api.suspicion(who, guess, 0.8);
    if (confidant) api.suspicion(confidant, guess, 0.4);
    return { scene, players: [who, guess, confidant].filter(Boolean),
      badgeText: correct ? 'ON THE TRAIL' : 'A BEAUTIFUL WRONG THEORY',
      badgeClass: correct ? 'gold' : 'red' };
  },
};

export const INVISIBLE_EVENTS = [
  whodunitCircle, wrongAccusation, falseCredit,
  performedInnocence, alibiPact, nomineeDetective,
];
