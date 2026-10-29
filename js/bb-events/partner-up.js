// ══════════════════════════════════════════════════════════════════════
// bb-events/partner-up.js — the Head of Household puts their own showmance up
// ══════════════════════════════════════════════════════════════════════
//
// The read of 2026-10-29: Ben nominated Lacey, his showmance, as the replacement "for seemingly no reason ... there
// wasnt even a reasoning or some fight/drama/cry", and that night the house was still shouting that the two of them
// always voted together. On the show it is the rarest nomination there is, and the week is about it.
//
// The pick itself is protected in bb/strategy.js (showmanceDiscount), so this happens only with a story behind it.
// This file is that story, told: WHY, read from the game rather than invented, and what it costs.
//
//   pawn      the partner agreed to sit there (week.pawnAsk)
//   nochoice  the house had run out of other people
//   wronged   the partner crossed the HOH, and the HOH remembers it
//   cold      the relationship had already cooled
//   game      none of those: the HOH chose the game over them, and nobody saw it coming
//
// NOT scheduled house events. Those are drawn at random from everything eligible, and a weight-14 card lost the draw
// in four of five measured weeks: a moment the week is about has to air. So the week builds them in place, the way
// the veto ceremony builds its own consequences (bb/veto-fallout.js): the nomination in bb/week.js after the
// ceremony, the replacement in veto-fallout.js, and the morning after in the next week's opening house act.

import { gs } from '../core.js';
import { pStats, bond, remembers, isVillainous } from './_read.js';
import { createHouseEventApi } from '../bb/house-events.js';
import { scriptBeat } from '../bb/script/inject.js';
import { moveRead } from '../bb/jury-sentiment.js';
import { isSeatedJuror } from '../bb/jury.js';

const STRAINED = new Set(['tension', 'ultimatum', 'escalation']);

/** Every showmance a houseguest is in right now (a love triangle is two). */
function showmancesOf(name) {
  return (gs.showmances || []).filter(s => s && s.phase !== 'broken-up' && !s.broken && (s.players || []).includes(name));
}
/** Their showmance partner among these names, if one of them is. */
export function partnerAmong(hoh, names = []) {
  for (const s of showmancesOf(hoh)) {
    const p = (s.players || []).find(n => n !== hoh);
    if (p && names.includes(p)) return { partner: p, sh: s };
  }
  return null;
}

/** A stable number in [0, 1) from the week and the names. */
function stable(...parts) {
  const key = parts.join('|');
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/**
 * Why the Head of Household put their own showmance in the chair, from what the game holds.
 * @param {string} hoh @param {string} partner
 * @param {{ week?: any, house?: string[], renom?: boolean, sh?: any }} [opts]
 */
export function partnerUpWhy(hoh, partner, { week = {}, house = [], renom = false, sh = null } = {}) {
  if ((week.pawnAsk?.asked || []).some(x => x && x.name === partner && x.accepted)) return 'pawn';
  const others = (house.length ? house : gs.activePlayers || []).filter(n => n && n !== hoh);
  if (renom ? !!week.vetoForcedReplacement : others.length <= 3) return 'nochoice';
  if (remembers(hoh, partner, 'betrayal') || remembers(hoh, partner, 'lied-to-my-face')
    || remembers(hoh, partner, 'crossed-me')) return 'wronged';
  if ((sh && STRAINED.has(sh.phase)) || bond(hoh, partner) < 3) return 'cold';
  return 'game';
}

const BADGE = { pawn: 'PAWN, BY CHOICE', nochoice: 'NO ONE ELSE LEFT', wronged: 'PAYBACK', cold: 'IT ENDS HERE', game: 'THE GAME OVER LOVE' };

/**
 * The scene after the HOH names their own showmance, and what it costs. Null when nobody on the block is theirs.
 * `chairs` are the names the HOH chose (a twist's chair is not theirs to explain).
 */
export function partnerUpBeat({ week, hoh, chairs = [], house = [], renom = false, act = 'nominations' }) {
  if (!week || !hoh || week.partnerUp) return null;
  const found = partnerAmong(hoh, chairs);
  if (!found) return null;
  const { partner, sh } = found;
  const why = partnerUpWhy(hoh, partner, { week, house, renom, sh });
  const target = week.plan?.target && week.plan.target !== partner ? week.plan.target
    : chairs.find(n => n !== partner) || null;
  const api = createHouseEventApi({ week, act, hoh });

  // ── what it costs: proportional, the warmer it was the more it costs ──
  const warmth = Math.max(0, Math.min(1, (bond(partner, hoh) + 2) / 12));
  const hit = { pawn: 0.4, nochoice: 0.6, cold: 1.4, wronged: 1.8, game: 1.2 + warmth * 1.6 }[why] ?? 1;
  api.addBond(partner, hoh, -hit);
  if (why === 'pawn') api.remember(partner, hoh, 'promised-safe', 2, { act });
  if (why === 'game' || why === 'wronged') {
    api.remember(partner, hoh, 'betrayal', why === 'game' ? 3 : 2, { act, showmance: true });
    // the audience sides with the one who did not see it coming
    api.popDelta(partner, 1.5);
    api.popDelta(hoh, -1.5);
  }
  if (why !== 'pawn' && why !== 'nochoice') {
    // A cooled one ends here. A blindside or a grudge strains it, and ends it in proportion to how hot-headed the
    // one on the block is and how little is left between them.
    const t = pStats(partner).temperament ?? 5;
    const ends = why === 'cold' ? 1 : 0.15 + (10 - t) * 0.04 + (1 - warmth) * 0.3;
    if (stable('partner-up', week.num || 0, hoh, partner) < ends) {
      sh.broken = true; sh.phase = 'broken-up'; sh.breakupType = 'nominated'; sh.breakupEp = (gs.episode || 0) + 1; sh.breakupVoter = hoh;
    } else if (!STRAINED.has(sh.phase)) sh.phase = 'tension';
  }
  // the house watched it, and the people who like the one on the block like the HOH less for it
  for (const n of house) {
    if (n === hoh || n === partner || why === 'pawn') continue;
    if (bond(n, partner) >= 3) api.addBond(n, hoh, -0.4);
  }
  week.partnerUp = { hoh, partner, why, renom: !!renom, ended: !!sh.broken };

  const written = scriptBeat(renom ? 'partneract.renom' : 'partneract.nominated', { a: partner, b: hoh },
    { ending: why, target: target || 'the target' }, { week, act, hoh, room: 'bedroom', salt: `partner|${partner}` });
  const plain = renom ? `${hoh} names ${partner}, ${hoh}'s own showmance, as the replacement.`
    : `${hoh} puts ${partner}, ${hoh}'s own showmance, on the block.`;
  return { text: written?.text || plain, ...(written ? { lines: written.lines, lineId: written.lineId } : {}),
    players: [partner, hoh], eventId: renom ? 'veto-showmance-renom' : 'nom-showmance', category: 'ceremonies',
    location: 'bedroom', badgeText: BADGE[why], badgeClass: why === 'pawn' ? 'orange' : 'red' };
}

/**
 * The morning after the showmance went home off the HOH's own block: the guilt (or the lack of it), and the
 * houseguest who says it to their face. `last` is the week that just ended.
 */
export function partnerGoneBeats({ week, last, house = [] }) {
  const up = last?.partnerUp;
  if (!week || !up || last.evicted !== up.partner || !house.includes(up.hoh) || week._partnerGone) return [];
  week._partnerGone = true;
  const { hoh, why } = up;
  const gone = up.partner;
  const api = createHouseEventApi({ week, act: 'house', hoh: null });
  const out = [];
  // a villain who meant it feels nothing on camera; everybody else carries it, the pawn they promised most of all
  const cold = why !== 'pawn' && isVillainous(hoh) && (pStats(hoh).loyalty ?? 5) <= 4;
  api.popDelta(hoh, cold ? -1 : 0.5);
  try {
    if (isSeatedJuror(gone)) {
      moveRead(gone, hoh, { strength: why === 'pawn' ? -2.6 : -2, credibility: 1, kind: 'showmance-nominated',
        week: week.num || 0, text: `${hoh} put ${gone} on the block, and ${gone} went home from it.` });
    }
  } catch { /* the jury read is texture */ }
  const g = scriptBeat('partneract.guilt', { a: hoh }, { ending: cold ? 'cold' : 'guilt', gone },
    { week, act: 'house', room: cold ? 'diary-room' : 'bedroom', salt: `guilt|${hoh}` });
  out.push({ text: g?.text || `${hoh} wakes up the morning after ${gone} went home.`, ...(g ? { lines: g.lines, lineId: g.lineId } : {}),
    players: [hoh], eventId: 'partner-guilt', category: 'house-life', location: cold ? 'diary-room' : 'bedroom',
    badgeText: cold ? 'NO REGRETS' : 'THE GUILT', badgeClass: cold ? 'red' : 'grey' });
  // whoever was closest to the one who left says it out loud
  const friend = house.filter(n => n !== hoh).sort((a, b) => bond(b, gone) - bond(a, gone))[0];
  if (friend && bond(friend, gone) >= 3) {
    api.addBond(friend, hoh, -1.2);
    api.suspicion(friend, hoh, 0.8);
    api.remember(friend, hoh, 'warning', 1, { saw: `put ${gone} on the block` });
    const c = scriptBeat('partneract.called', { a: friend, b: hoh }, { ending: 'scene', gone },
      { week, act: 'house', room: 'kitchen', seenBy: house, salt: `called|${friend}` });
    out.push({ text: c?.text || `${friend} tells ${hoh} what everybody is thinking about ${gone}.`, ...(c ? { lines: c.lines, lineId: c.lineId } : {}),
      players: [friend, hoh], eventId: 'partner-called-out', category: 'social', location: 'kitchen',
      badgeText: 'SAID IT OUT LOUD', badgeClass: 'red' });
  }
  return out;
}
