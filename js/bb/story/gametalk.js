// ══════════════════════════════════════════════════════════════════════
// bb/story/gametalk.js — what the house is talking about THIS week of the game
// ══════════════════════════════════════════════════════════════════════
//
// The storylines (storylines.js) air what HAPPENED: a fight, a deal, a kiss. Houseguests also
// spend their days talking about the game they are in, and that talk changes as the season
// does (the user, 2026-10-06: "speech that evolves… pre-jury, who's going to jury, Block
// Buster strategy… I want a real BB experience"). This file reads the state of the game at a
// stretch and says which of those conversations is true to have now, and who has it:
//
//   a Block Buster week     the HOH's backup plan, a nominee who has to win it
//   nominations to veto     a nominee whose only way off is the veto
//   before an HOH           who has to not win it
//   one or two from jury    who has to go before they get a vote
//   a juror just left       how bitter they will be
//   the jury phase          who the jury would reward
//   six or fewer            final two
//   any week                venting about somebody you cannot stand; the friend you trust
//
// Words only: it reads bonds and the week, and moves nothing.

import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';
import { juryOpensAt, evictionSeatsAJuror } from '../jury.js';
import { stableRng } from '../knowledge.js';

/** Where the season is: 'early', 'prejury', 'jury' or 'endgame', and how many jurors sit. */
export function phaseOf(week) {
  const size = (week?.houseAtStart || []).length;
  const opens = juryOpensAt();
  const jurors = (gs.bb?.weeks || []).filter(w => w !== week && (w.num || 0) < (week?.num || 0) && w.evicted
    && evictionSeatsAJuror((w.houseAtStart || []).length)).length;
  const phase = size && size <= 6 ? 'endgame'
    : opens > 0 && (jurors > 0 || size <= opens) ? 'jury'
      : opens > 0 && size - opens <= 2 ? 'prejury' : 'early';
  return { phase, jurors };
}

const avg = xs => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

// competition wins before this week (this week's are still to happen when the talk airs)
function winsBefore(n, week) {
  const st = gs.bb?.stats?.[n] || {};
  let w = (st.hohWins || 0) + (st.vetoWins || 0) + (st.blockBusterWins || 0);
  if (week.hoh === n) w--;
  if (week.vetoWinner === n) w--;
  if (week.safetyWinner === n) w--;
  return w;
}

/**
 * The game talk a stretch can air, most pressing first: [{ kind, who, data }]. `clock` is the
 * director's ({ hoh, noms, veto, safety }); `talked` is what this week has already aired.
 */
export function gameTalkFor(week, ctx, clock, talked, lastGone) {
  const house = ctx.present || [];
  if (house.length < 4) return [];
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'gametalk', week.num || 0, ctx.stretch || 0);
  const closest = (n, not = []) => house.filter(x => x !== n && !not.includes(x))
    .sort((x, y) => getBond(n, y) - getBond(n, x))[0] || null;
  const pairs = [];
  for (let i = 0; i < house.length; i++) for (let j = i + 1; j < house.length; j++) pairs.push([house[i], house[j], getBond(house[i], house[j])]);
  pairs.sort((x, y) => y[2] - x[2]);
  // a close pair, varied stretch to stretch among the closest few
  const pairOf = (not = []) => {
    const ok = pairs.filter(([x, y, b]) => b >= 2 && !not.includes(x) && !not.includes(y)).slice(0, 4);
    if (!ok.length) return null;
    const p = ok[Math.floor(rng() * ok.length)];
    return rng() < 0.5 ? [p[0], p[1]] : [p[1], p[0]];
  };
  const liked = n => avg(house.filter(x => x !== n).map(x => getBond(x, n)));
  const { phase } = phaseOf(week);
  const out = [];
  const want = (kind, who, data = {}) => { if (!talked.has(kind) && Object.values(who).every(Boolean)) out.push({ kind, who, data }); };

  // ── a Block Buster week, three on the block, before it is played ──
  const three = (week.blockBeforeSafety || []).filter(n => house.includes(n));
  if (week.safetyMode && clock.noms && !clock.safety && three.length >= 3) {
    const nomAct = (week.acts || []).find(a => a?.type === 'nominations');
    const hoh = ctx.hoh && house.includes(ctx.hoh) ? ctx.hoh : null;
    const target = three.includes(nomAct?.target) ? nomAct.target
      : hoh ? three.slice().sort((x, y) => getBond(hoh, x) - getBond(hoh, y))[0] : null;
    if (hoh && target) {
      const b = closest(hoh, three);
      want('bb.hoh', { a: hoh, b, c: target, d: three.find(n => n !== target) });
    }
    const nom = three[Math.floor(rng() * three.length)];
    if (hoh) want('bb.nominee', { a: nom, b: closest(nom, [hoh, ...three]), c: hoh });
  }
  // ── on the block, before the veto is played for ──
  if (clock.noms && !clock.veto && ctx.hoh && (ctx.nominees || []).length) {
    const nomAct = (week.acts || []).find(a => a?.type === 'nominations');
    const noms = (three.length ? three : ctx.nominees).filter(n => house.includes(n));
    const nom = noms.includes(nomAct?.pawn) ? nomAct.pawn : noms[Math.floor(rng() * noms.length)];
    if (nom) want('veto.hope', { a: nom, b: closest(nom, [ctx.hoh, ...noms]), c: ctx.hoh });
  }
  // ── the morning after: a juror has just walked out ──
  if (!clock.hoh && lastGone && phase !== 'early' && phase !== 'prejury') {
    const prev = [...(gs.bb?.weeks || [])].reverse().find(w => w !== week && w.evicted === lastGone);
    if (prev && evictionSeatsAJuror((prev.houseAtStart || []).length)) {
      const against = ((prev.acts || []).find(a => a?.type === 'eviction')?.ballots || [])
        .filter(b => b && b.evict === lastGone && house.includes(b.voter)).map(b => b.voter);
      const b = against[Math.floor(rng() * against.length)];
      if (b) want('jury.bitter', { a: closest(b), b }, { gone: lastGone });
    }
  }
  // ── before an HOH: who must not win it ──
  if (!clock.hoh && (week.num || 0) > 1) {
    const pr = pairOf();
    if (pr) {
      const c = house.filter(n => !pr.includes(n)).map(n => [n, winsBefore(n, week)]).filter(x => x[1] >= 1)
        .sort((x, y) => y[1] - x[1])[0]?.[0];
      if (c) want('nexthoh', { a: pr[0], b: pr[1], c });
    }
  }
  // ── the shape of the season ──
  const pr = pairOf();
  if (pr) {
    const others = house.filter(n => !pr.includes(n));
    if (phase === 'prejury') {
      // liked by the house, not by these two: the juror they least want
      const c = others.map(n => [n, liked(n) - (getBond(pr[0], n) + getBond(pr[1], n)) / 2]).sort((x, y) => y[1] - x[1])[0]?.[0];
      if (c) want('prejury', { a: pr[0], b: pr[1], c });
    }
    if (phase === 'jury' && house.length >= 6) {
      const c = others.filter(n => house.every(x => x === n || getBond(x, n) > -4)).sort((x, y) => liked(y) - liked(x))[0];
      if (c) want('jury.manage', { a: pr[0], b: pr[1], c }, {});
    }
    if (phase === 'endgame') {
      const c = others.sort((x, y) => winsBefore(y, week) - winsBefore(x, week) || getBond(pr[0], x) - getBond(pr[0], y))[0];
      if (c) want('endgame', { a: pr[0], b: pr[1], c });
    }
  }
  return out.map(x => ({ ...x, phase }));
}

/** A bond conversation for this stretch, or null: venting about an enemy, or the friend you trust. */
export function bondTalkFor(week, ctx, talkedPairs) {
  const house = ctx.present || [];
  if (house.length < 4 || (week.num || 0) === 1 && (ctx.stretch || 0) === 0) return null;
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'bondtalk', week.num || 0, ctx.stretch || 0);
  const { phase } = phaseOf(week);
  const key = (x, y) => [x, y].sort().join('|');
  const sour = [];
  const warm = [];
  for (let i = 0; i < house.length; i++) for (let j = i + 1; j < house.length; j++) {
    const [x, y] = [house[i], house[j]]; const b = getBond(x, y);
    if (talkedPairs.has(key(x, y))) continue;
    if (b <= -3) sour.push([x, y, b]);
    if (b >= 5) warm.push([x, y, b]);
  }
  sour.sort((p, q) => p[2] - q[2]);
  warm.sort((p, q) => q[2] - p[2]);
  const venting = sour.length && (!warm.length || rng() < 0.55);
  if (venting) {
    const [x, y] = sour[Math.floor(rng() * Math.min(3, sour.length))];
    const [a, c] = rng() < 0.5 ? [x, y] : [y, x];
    const b = house.filter(n => n !== a && n !== c).sort((p, q) => getBond(a, q) - getBond(a, p))[0];
    if (!b || getBond(a, b) < 1) return null;
    talkedPairs.add(key(a, c));
    return { kind: 'bond.vent', who: { a, b, c }, data: {}, phase };
  }
  if (warm.length) {
    const [x, y] = warm[Math.floor(rng() * Math.min(3, warm.length))];
    talkedPairs.add(key(x, y));
    return { kind: 'bond.trust', who: rng() < 0.5 ? { a: x, b: y } : { a: y, b: x }, data: {}, phase };
  }
  return null;
}
