// ══════════════════════════════════════════════════════════════════════
// bb-events/hacker.js — three crimes, no suspect
// ══════════════════════════════════════════════════════════════════════
//
// The Hacker is the second twist in this house to get an event family of its
// own, and it needs one more than the first did. An Invisible HOH commits a
// single anonymous act on a single night. The Hacker commits THREE, on three
// different nights, and each leaves a different kind of witness:
//
//   the block hack   somebody came off, somebody went up, nobody signed it
//   the draw hack    a name walked into the veto that no chip accounts for
//   the vote hack    the count came up one short, in front of everybody
//
// So the room is not solving one mystery, it is solving three, and the three
// point in different directions. That is the whole reason a wrong answer is
// so easy here: every hack has an obvious beneficiary, and the obvious
// beneficiary is usually not the person who did it.
//
// Rules of the family, inherited from invisible.js: every event is gated on
// ctx.week.hacker existing; the text may show the real hacker DOING things —
// speculating, deflecting, sitting very still — but may never narrate them as
// the hacker; and every guess, right or wrong, carries consequences, because
// the misattribution IS the twist.
import { gs } from '../core.js';
import {
  pStats, band, perceived, furthestFrom, closestTo, isVillainous,
} from './_read.js';
import { makeScene } from '../bb/script/scene.js';

function _pick(list, ctx, ...salt) {
  if (!list.length) return null;
  const key = `${ctx?.week?.num || 0}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _hacked = ctx => ctx?.week?.hacker || null;
const _truth = ctx => ctx?.week?.hacker?.winner || null;   // casting only — never narrated
const _blockHack = ctx => ctx?.week?.hacker?.blockHack || null;
const _vetoHack = ctx => ctx?.week?.hacker?.vetoHack || null;
const _nominees = ctx => (ctx?.nominees || ctx?.week?.finalNominees || ctx?.week?.initialNominees || []).filter(Boolean);
const _hoh = ctx => (ctx?.week?.hohSecret ? null : (ctx?.hoh || ctx?.week?.hoh)) || null;

// Casting helpers shared by weight() and fire(). The scheduler treats a
// positive weight as a promise that the event WILL produce a beat — a null
// return after being picked throws — so every name fire() needs has to be
// proved available inside weight() first, using exactly the same call.
const _benefitCast = (house, ctx) => {
  const saved = _blockHack(ctx)?.down;
  if (!saved || !house.includes(saved)) return null;
  const reader = _others(house, saved).sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
  return reader ? { saved, reader } : null;
};
const _huntCast = (house, ctx) => {
  const victim = _blockHack(ctx)?.up;
  if (!victim || !house.includes(victim)) return null;
  const entry = (ctx.week?.hackerGuesses || []).find(g => g.who === victim
    && house.includes(g.guess) && g.guess !== victim);
  return entry ? { victim, entry } : null;
};
const _disownCast = (house, ctx) => {
  const hoh = _hoh(ctx);
  const victim = _blockHack(ctx)?.up;
  return (hoh && victim && house.includes(hoh) && house.includes(victim) && hoh !== victim)
    ? { hoh, victim } : null;
};
const _seatCast = (house, ctx) => {
  const picked = _vetoHack(ctx)?.pick;
  if (!picked || !house.includes(picked)) return null;
  const watcher = _others(house, picked).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { picked, watcher } : null;
};
const _tableCast = (house, ctx) => {
  const pool = _others(house, ..._nominees(ctx));
  if (pool.length < 3) return null;
  const talkers = pool.slice(0, 4);
  const accused = _pick(pool.filter(n => !talkers.slice(0, 2).includes(n))
    .sort((a, b) => (perceived(talkers[0], a) ?? 0) - (perceived(talkers[0], b) ?? 0)).slice(0, 2),
  ctx, 'table');
  return accused ? { talkers, accused } : null;
};
const _alibiCast = (house, ctx) => {
  const pool = _others(house, ..._nominees(ctx));
  const a = _pick(pool, ctx, 'alibi-a');
  if (!a) return null;
  const b = closestTo(a, pool.filter(n => n !== a));
  return b ? { a, b } : null;
};
const _liarCast = (house, ctx) => {
  const pool = _others(house, ..._nominees(ctx)).filter(n => n !== _truth(ctx)
    && isVillainous(n) && pStats(n).boldness >= 6);
  const liar = _pick(pool, ctx, 'liar');
  if (!liar) return null;
  const audience = _pick(_others(house, liar, ..._nominees(ctx)), ctx, 'audience');
  return audience ? { liar, audience } : null;
};
const _performCast = (house, ctx) => {
  const truth = _truth(ctx);
  if (!truth || !house.includes(truth)) return null;
  const watcher = _others(house, truth, ..._nominees(ctx))
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  return watcher ? { truth, watcher } : null;
};

/** Last week's record, for the consequences that outlive the week they happened in. */
function _lastWeek(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w && w.num < now && now - w.num <= 1 && w.hacker) return w;
  }
  return null;
}

const _missingCast = (house, ctx) => {
  const silenced = _lastWeek(ctx)?.hackerVote?.voter;
  if (!silenced || !house.includes(silenced)) return null;
  const counter = _others(house, silenced).sort((a, b) => pStats(b).mental - pStats(a).mental)[0];
  if (!counter) return null;
  const accused = furthestFrom(counter, _others(house, counter, silenced)) || silenced;
  return { silenced, counter, accused };
};
const _silencedCast = (house, ctx) => {
  const silenced = _lastWeek(ctx)?.hackerVote?.voter;
  if (!silenced || !house.includes(silenced)) return null;
  const confidant = closestTo(silenced, _others(house, silenced));
  return confidant ? { silenced, confidant } : null;
};

// ══════════════════════════════════════════════════════════════════════
// THE BLOCK HACK — somebody came off, somebody went up
// ══════════════════════════════════════════════════════════════════════

// ── who benefits ──────────────────────────────────────────────────────
//
// The sharpest read in the house is also the most dangerous one, because it is
// correct in form and wrong in fact: the person who came off the block is the
// person who gained, so the house turns on them. Unless the hacker saved
// themselves, that is an innocent taking the whole week's suspicion.
const benefitMath = {
  id: 'hacker-benefit-math',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _benefitCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _benefitCast(house, ctx);
    if (!cast) return null;
    const { saved, reader } = cast;
    const rightForOnce = saved === _truth(ctx);
    const scene = makeScene('hack.benefit', { a: reader, b: saved }, { ending: 'scene' }, [], 'kitchen');
    api.suspicion(reader, saved, 1.3);
    _others(house, saved, reader).slice(0, 2).forEach(n => api.suspicion(n, saved, 0.5));
    api.addBond(reader, saved, -0.5);
    try { api.remember(reader, saved, 'suspected-hacker', 1, { twist: 'bb-hacker', correct: rightForOnce }); } catch { /* texture */ }
    return { scene, players: [reader, saved],
      badgeText: rightForOnce ? 'FOLLOW THE MONEY' : 'THE WRONG BENEFICIARY',
      badgeClass: rightForOnce ? 'gold' : 'red' };
  },
};

// ── the replacement hunts for a hand ──────────────────────────────────
const swappedInHunts = {
  id: 'hacker-swapped-in-hunts',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _huntCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _huntCast(house, ctx);
    if (!cast) return null;
    const { victim, entry } = cast;
    const { guess, correct } = entry;
    const confidant = closestTo(victim, _others(house, victim, guess)) || null;
    const scene = makeScene('hack.hunt', { a: victim, b: guess, c: confidant }, { ending: 'scene' }, [], 'backyard');
    api.suspicion(victim, guess, 1.5);
    if (confidant) api.suspicion(confidant, guess, 0.5);
    api.addBond(victim, guess, -0.8);
    return { scene, players: [victim, guess, confidant].filter(Boolean),
      badgeText: correct ? 'ON THE TRAIL' : 'A CONFIDENT WRONG ANSWER',
      badgeClass: correct ? 'gold' : 'red' };
  },
};

// ── the Head of Household defends a block that stopped being theirs ────
const hohDisowns = {
  id: 'hacker-hoh-disowns',
  category: 'ceremonies',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _disownCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _disownCast(house, ctx);
    if (!cast) return null;
    const { hoh, victim } = cast;
    // A reign nobody believes is a reign that bought nothing.
    const believed = pStats(hoh).social >= 6 && perceived(victim, hoh) >= 0;
    const scene = makeScene('hack.disown', { a: hoh, b: victim }, { ending: believed ? 'believed' : 'doubted' }, [], 'living-room');
    if (!believed) {
      api.addBond(victim, hoh, -0.6);
      try { api.remember(victim, hoh, 'renomination', 1, { twist: 'bb-hacker', disowned: true }); } catch { /* texture */ }
    }
    api.popDelta(hoh, believed ? 0 : -1);
    return { scene, players: [hoh, victim],
      badgeText: believed ? 'A REIGN ON LOAN' : 'NOBODY BELIEVES THE KING',
      badgeClass: believed ? 'grey' : 'red' };
  },
};

// ══════════════════════════════════════════════════════════════════════
// THE DRAW HACK — the seat nobody drew a chip for
// ══════════════════════════════════════════════════════════════════════

const seatWitness = {
  id: 'hacker-seat-witness',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _seatCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _seatCast(house, ctx);
    if (!cast) return null;
    const { picked, watcher } = cast;
    const selfPick = picked === _truth(ctx);
    const scene = makeScene('hack.seat', { a: watcher, b: picked }, { ending: 'scene' }, [], 'backyard');
    api.suspicion(watcher, picked, selfPick ? 1.4 : 0.9);
    _others(house, picked, watcher).slice(0, 2).forEach(n => api.suspicion(n, picked, 0.4));
    // Being visibly favoured is screen time and a target at the same time.
    api.popDelta(picked, 1);
    return { scene, players: [picked, watcher],
      badgeText: selfPick ? 'WALKED IN ALONE' : 'SOMEBODY WANTS THIS ONE PLAYING',
      badgeClass: selfPick ? 'gold' : 'blue' };
  },
};

// ══════════════════════════════════════════════════════════════════════
// THE VOTE HACK — the count that came up short (next week's problem)
// ══════════════════════════════════════════════════════════════════════

const missingVoteMath = {
  id: 'hacker-missing-vote',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _missingCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    // The room can count. What it cannot do is work out WHOSE vote went
    // missing, because everybody has a reason to lie about how they voted.
    const cast = _missingCast(house, ctx);
    if (!cast) return null;
    const { silenced, counter, accused } = cast;
    const scene = makeScene('hack.missing', { a: counter, b: accused }, { ending: 'scene' }, [], 'kitchen');
    api.suspicion(counter, accused, 1.1);
    if (accused !== silenced) api.addBond(counter, accused, -0.4);
    return { scene, players: [counter, accused, silenced].filter((n, i, a) => a.indexOf(n) === i),
      badgeText: accused === silenced ? 'ONE SHORT' : 'ONE SHORT, WRONG NAME',
      badgeClass: accused === silenced ? 'gold' : 'red' };
  },
};

const silencedVoterDilemma = {
  id: 'hacker-silenced-voter',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _silencedCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _silencedCast(house, ctx);
    if (!cast) return null;
    const { silenced, confidant } = cast;
    const st = pStats(silenced);
    // Saying it out loud buys sympathy and hands the house a fact. Keeping it
    // means carrying an accusation you cannot answer.
    const tells = st.boldness >= 6 || st.temperament <= 4;
    const scene = makeScene('hack.silenced', { a: silenced, b: confidant }, { ending: tells ? 'tells' : 'keeps' }, [], 'bedroom');
    if (tells) {
      api.addBond(silenced, confidant, 0.7);
      try { api.remember(confidant, silenced, 'told-me-the-truth', 1, { twist: 'bb-hacker' }); } catch { /* texture */ }
    } else {
      api.suspicion(confidant, silenced, 0.6);
    }
    return { scene, players: [silenced, confidant],
      badgeText: tells ? 'THE VOTE THAT NEVER WAS' : 'CARRYING IT ALONE',
      badgeClass: tells ? 'blue' : 'grey' };
  },
};

// ══════════════════════════════════════════════════════════════════════
// THE ROOM — alibis, liars, and one person performing very hard
// ══════════════════════════════════════════════════════════════════════

const hackerTable = {
  id: 'hacker-round-table',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _tableCast(house, ctx) ? band(9, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _tableCast(house, ctx);
    if (!cast) return null;
    const { talkers, accused } = cast;
    const right = accused === _truth(ctx);
    const scene = makeScene('hack.table', { a: talkers[0], b: talkers[1], c: accused }, { ending: 'scene' }, [], 'living-room');
    talkers.forEach(t => { if (t !== accused) api.suspicion(t, accused, 0.55); });
    return { scene, players: [...talkers.slice(0, 3), accused].filter((n, i, a) => a.indexOf(n) === i),
      badgeText: right ? 'CLOSING IN' : 'THE WRONG SCENT',
      badgeClass: right ? 'gold' : 'grey' };
  },
};

const alibiTrade = {
  id: 'hacker-alibi-trade',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _alibiCast(house, ctx) ? band(6, 10) : 0;
  },
  fire(house, ctx, api) {
    const cast = _alibiCast(house, ctx);
    if (!cast) return null;
    const { a, b } = cast;
    const scene = makeScene('hack.alibi', { a, b }, { ending: 'scene' }, [], 'backyard');
    api.addBond(a, b, 0.5);
    return { scene, players: [a, b], badgeText: 'THE ALIBI TRADE', badgeClass: 'blue' };
  },
};

const falseHacker = {
  id: 'hacker-false-claim',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _liarCast(house, ctx) ? band(6, 10) : 0;
  },
  fire(house, ctx, api) {
    const cast = _liarCast(house, ctx);
    if (!cast) return null;
    const { liar, audience } = cast;
    const scene = makeScene('hack.claim', { a: liar, b: audience }, { ending: 'scene' }, [], 'pantry');
    api.suspicion(audience, liar, 1.4);
    api.popDelta(liar, 1);
    try { api.remember(audience, liar, 'claimed-the-hack', 1, { twist: 'bb-hacker' }); } catch { /* texture */ }
    return { scene, players: [liar, audience], badgeText: 'TAKING CREDIT', badgeClass: 'red' };
  },
};

const performedConfusion = {
  id: 'hacker-performed-confusion',
  category: 'social',
  weight(house, ctx) {
    if (!_hacked(ctx) || ctx.act !== 'house') return 0;
    return _performCast(house, ctx) ? band(8, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _performCast(house, ctx);
    if (!cast) return null;
    const { truth, watcher } = cast;
    const st = pStats(truth);
    const overplayed = pStats(watcher).intuition >= 7 && st.strategic <= 6;
    const scene = makeScene('hack.perform', { a: truth, b: watcher }, { ending: overplayed ? 'overplayed' : 'quiet' }, [], 'living-room');
    if (overplayed) {
      api.suspicion(watcher, truth, 1.6);
      try { api.remember(watcher, truth, 'suspected-hacker', 1, { twist: 'bb-hacker', correct: true }); } catch { /* texture */ }
    }
    return { scene, players: [truth, watcher],
      badgeText: overplayed ? 'ONE NOTCH TOO LOUD' : 'FLAWLESS ALIBI',
      badgeClass: overplayed ? 'gold' : 'grey' };
  },
};

export const HACKER_EVENTS = [
  benefitMath, swappedInHunts, hohDisowns, seatWitness,
  missingVoteMath, silencedVoterDilemma,
  hackerTable, alibiTrade, falseHacker, performedConfusion,
];
