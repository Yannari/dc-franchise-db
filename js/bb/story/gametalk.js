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

import { gs, players } from '../../core.js';
import { getBond } from '../../bonds.js';
import { juryOpensAt, evictionSeatsAJuror } from '../jury.js';
import { stableRng } from '../knowledge.js';
import { pStats } from '../../players.js';

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
  // The Block Buster is played after the veto, so blockBeforeSafety holds the block as the veto
  // left it, replacement included. Before the veto meeting the three on the block are the three
  // the HOH named (the user, 2026-10-24: a replacement nominee was "in the chairs" in a talk that
  // aired before the veto was even played).
  // ...and once the veto has been played, a nominee who won it takes themselves off at the meeting: they are not
  // one of the three any more (the user, 2026-10-24: "I'm scared of the Block Buster", from the one who had just won
  // the veto)
  const holder = clock.veto && !clock.cer ? week.vetoWinner : null;
  const three = ((clock.cer ? week.blockBeforeSafety : week.initialNominees) || []).filter(n => house.includes(n) && n !== holder);
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
  // ── the morning after: somebody who voted against the house ──
  // Only when it is news: they were close to the one who left, or almost nobody voted with them.
  if (!clock.hoh && lastGone) {
    const prev = [...(gs.bb?.weeks || [])].reverse().find(w => w !== week && w.evicted === lastGone);
    const ev = (prev?.acts || []).find(a => a?.type === 'eviction');
    // one ballot per voter, the last one cast (the list can carry a voter more than once, and the
    // count came out as 'Ten' on a seven-to-two night)
    const ballots = [...new Map((ev?.ballots || []).filter(b => b && b.voter && b.evict).map(b => [b.voter, b])).values()];
    const lost = ballots.filter(b => b.evict !== lastGone && house.includes(b.voter) && house.includes(b.evict));
    const won = ballots.length - lost.length;
    if (lost.length && won > lost.length) {
      const m = lost.slice().sort((x, y) => getBond(y.voter, lastGone) - getBond(x.voter, lastGone))[0];
      if (lost.length <= 2 || getBond(m.voter, lastGone) >= 2) {
        const W = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
        const say = n => W[n] || String(n);
        const count = `${say(won)[0].toUpperCase()}${say(won).slice(1)} to ${say(lost.length)}`;
        want('outside', { a: m.voter, b: closest(m.voter, [m.evict]), c: m.evict }, { gone: lastGone, count });
      }
    }
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

// ── every houseguest plays their own game ──
// The user, 2026-10-06: "there are a lot of types of game in Big Brother… from floater to
// challenge beast to manipulator to strategist… I don't see that yet." Each archetype plays
// one way (bb/story/lines/style.js). A mastermind is a strategist one week and a manipulator
// the next. Only villain archetypes manipulate; the provocateur stirs things in the open.
const STYLE_OF = {
  schemer: 'manipulator', villain: 'manipulator', mastermind: ['strategist', 'manipulator'],
  hothead: 'provocateur', 'chaos-agent': 'provocateur', wildcard: 'provocateur',
  'challenge-beast': 'beast', 'social-butterfly': 'social', showmancer: 'social',
  'loyal-soldier': 'loyal', hero: 'loyal', floater: 'floater', underdog: 'underdog', goat: 'goat',
  'perceptive-player': 'perceptive',
};
/**
 * One houseguest playing their own game this stretch, or null. Rotates through the house by
 * who has been seen least this season (`aired`, kept with the storylines), so every player's
 * game gets its turn on screen.
 */
export function styleTalkFor(week, ctx, aired) {
  const house = ctx.present || [];
  if (house.length < 4 || ((week.num || 0) === 1 && (ctx.stretch || 0) === 0)) return null;
  const { phase } = phaseOf(week);
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'styletalk', week.num || 0, ctx.stretch || 0);
  const archOf = n => (players || []).find(p => p.name === n)?.archetype;
  const order = house.filter(n => STYLE_OF[archOf(n)])
    .map(n => [n, (aired[`style:${n}`] || 0) + rng() * 0.5]).sort((x, y) => x[1] - y[1]).map(x => x[0]);
  for (const a of order) {
    let style = STYLE_OF[archOf(a)];
    if (Array.isArray(style)) style = style[((week.num || 0) + (ctx.stretch || 0)) % style.length];
    const others = house.filter(n => n !== a);
    const byBond = others.slice().sort((x, y) => getBond(a, y) - getBond(a, x));
    const wins = n => winsBefore(n, week);
    let b = byBond[0];
    let c = null;
    if (style === 'floater') c = ctx.hoh && ctx.hoh !== a ? ctx.hoh : others.slice().sort((x, y) => avg(house.map(z => getBond(z, y))) - avg(house.map(z => getBond(z, x))))[0];
    else if (style === 'beast' || style === 'strategist' || style === 'underdog') c = others.filter(n => n !== b).sort((x, y) => wins(y) - wins(x) || getBond(a, x) - getBond(a, y))[0];
    // the provocateur goes after real power: the HOH, or failing that the strongest player
    else if (style === 'provocateur') c = ctx.hoh && ctx.hoh !== a ? ctx.hoh : others.slice().sort((x, y) => wins(y) - wins(x) || getBond(a, x) - getBond(a, y))[0];
    else if (style === 'manipulator' || style === 'perceptive' || style === 'social') c = byBond.at(-1);
    else if (style === 'loyal') { c = byBond[0]; b = byBond[1]; }
    else if (style === 'goat') c = byBond[Math.floor(byBond.length / 2)];
    if (!b || !c || b === c) continue;
    aired[`style:${a}`] = (aired[`style:${a}`] || 0) + 1;
    return { kind: `style.${style}`, who: { a, b, c }, data: {}, phase };
  }
  return null;
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

// ── the Head of Household's week ──
// The user, 2026-10-07: "one-on-ones with the HOH are important for strategy and we barely get
// any... the viewer needs to feel and see the actual strategy", and "did they get that target
// out, how do we know?" Between the HOH and the ceremony: the plan said out loud to the HOH's
// closest person, the pawn being asked (each ask the engine made, yes or no), the real target
// climbing the stairs to fish, and somebody floating it out downstairs. The morning after the
// eviction: whether the week worked. All of it read from the engine's plan (bb/strategy.js,
// week.plan) and pawn negotiation (week.pawnAsk); nothing here decides anything.
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const PLAN_KIND = { 'target-pawn': 'pawn', 'double-target': 'two', 'two-targets': 'two', 'pair-split': 'pair', 'target-ally': 'ally', expendables: 'quiet' };

export function hohWeekFor(week, ctx, clock, talked, lastGone) {
  const house = ctx.present || [];
  if (house.length < 4) return [];
  const out = [];
  // `gone`: a role who has already left the house and is only talked about (the verdict)
  const want = (kind, who, data = {}, gone = []) => {
    if (talked.has(kind) || !Object.entries(who).every(([r, n]) => n && (house.includes(n) || gone.includes(r)))) return;
    if (new Set(Object.values(who)).size !== Object.values(who).length) return;
    out.push({ kind, who, data });
  };
  const rng = stableRng(gs.bb?.seasonSalt || 0, 'hohweek', week.num || 0, ctx.stretch || 0);
  const closest = (n, not = []) => house.filter(x => x !== n && !not.includes(x))
    .sort((x, y) => getBond(n, y) - getBond(n, x))[0] || null;
  const archOf = n => (players || []).find(p => p.name === n)?.archetype;

  // ── the morning after: was it a good HOH? ──
  if (!clock.hoh && lastGone) {
    const prev = [...(gs.bb?.weeks || [])].reverse().find(w => w !== week && w.evicted === lastGone);
    const plan = prev?.plan;
    const hoh = prev?.hoh;
    const real = plan?.backdoorTarget || plan?.target;
    if (plan && hoh && real && house.includes(hoh)) {
      const b = closest(hoh, [real]);
      // two targets, a split pair, two easy names: either nominee leaving is the plan working
      const either = ['double-target', 'two-targets', 'pair-split', 'expendables'].includes(plan.structure) && !plan.backdoorTarget
        && (plan.nominees || []).includes(lastGone);
      // a three-chair week is built so any of the HOH's names leaving works (the pawn aside)
      const block3 = ((prev.acts || []).find(x => x?.type === 'nominations' && !x.byCoHoh)?.nominees || []);
      const anyOf3 = block3.length >= 3 && block3.includes(lastGone) && lastGone !== plan.pawn;
      if (lastGone === real || either || anyOf3) want('hohweek.verdict.done', { a: hoh, b: closest(hoh, [lastGone]), c: lastGone }, {}, ['c']);
      else if (lastGone === plan.pawn) want('hohweek.verdict.pawn', { a: hoh, b, c: real, d: lastGone }, {}, ['d']);
      else if (house.includes(real)) want('hohweek.verdict.missed', { a: hoh, b, c: real });
    }
    return out.filter(t => t.kind.startsWith('hohweek.verdict'));
  }

  // ── after the veto meeting: did the backdoor land? ──
  // The user, 2026-10-14: "wasn't Spencer's whole plan to backdoor Lake? how is he not even talking about
  // it anymore", and "the other nominee was barely mentioned even though a backdoor was planned, where's
  // the strategy". The HOH's week does not stop at the ceremony: the empty chair either took the name
  // the week was built for, or it did not, and both are scenes.
  if (clock.hoh && clock.cer) {
    const hoh = ctx.hoh;
    const plan = week.plan;
    const cer = (week.acts || []).find(x => x?.type === 'veto-ceremony');
    const bd = plan?.backdoorTarget;
    if (!hoh || !plan || !cer || !bd || !house.includes(hoh) || !house.includes(bd) || (week.initialNominees || []).includes(bd)) return [];
    const b = closest(hoh, [bd, cer.holder, cer.saved, cer.replacement].filter(Boolean));
    if (cer.replacement === bd) {
      want('hohweek.backdoor.landed', { a: hoh, b, c: bd });
      // the one it caught, face to face with the HOH: told they were safe, or simply never told
      want(talked.has('hohweek.fish.lie') ? 'hohweek.backdoor.liedto' : 'hohweek.backdoor.confront', { a: bd, b: hoh });
    } else if (cer.holder === bd) want('hohweek.backdoor.dodged', { a: hoh, b, c: bd });
    else if (!cer.used && cer.holder && cer.holder !== hoh && cer.holder !== b) want('hohweek.backdoor.unused', { a: hoh, b, c: bd, d: cer.holder });
    else if (cer.used && cer.replacement && cer.replacement !== b) want('hohweek.backdoor.missed', { a: hoh, b, c: bd, d: cer.replacement });
    return out;
  }

  // ── between the HOH and the ceremony ──
  if (!clock.hoh || clock.noms) return [];
  const hoh = ctx.hoh;
  const plan = week.plan;
  if (!hoh || !house.includes(hoh) || !plan) return [];
  // The block as the ceremony actually set it, not the plan's first draft: a Block Buster week
  // seats three, and the third chair is filled by the same read that names a replacement, so a
  // backdoor target can end up nominated at the ceremony and the backdoor never happens (the
  // user, 2026-10-07: "it doesn't take into account that with the Block Buster there are three").
  const nomAct = (week.acts || []).find(x => x?.type === 'nominations' && !x.byCoHoh);
  const block = (nomAct?.nominees?.length ? nomAct.nominees : plan.nominees || []).filter(Boolean);
  const bd = plan.backdoorTarget && !block.includes(plan.backdoorTarget) ? plan.backdoorTarget : null;
  const real = bd || (block.includes(plan.backdoorTarget) ? plan.backdoorTarget : block.includes(plan.target) ? plan.target : block[0]);
  // A change of mind in the days after the key (bb/week.js takeSwitch): the plan as it was first
  // made airs, then the switch, then everything after it from the plan the ceremony used.
  const sw = (week.targetSwitches || []).filter(c => c.at === 'post').at(-1);
  const first = sw && week.planFirst;
  const b = closest(hoh, [real, plan.pawn, bd, ...block, sw?.from, sw?.by, first?.pawn, ...(first?.nominees || [])].filter(Boolean));
  const [n0, n1] = block;
  if (first && block.length < 3) {
    const fb = first.backdoorTarget && !(first.nominees || []).includes(first.backdoorTarget) ? first.backdoorTarget : null;
    const [f0, f1] = first.nominees || [];
    if (fb) want('hohweek.plan.backdoor', { a: hoh, b, c: f0, d: f1, e: fb });
    else {
      const kind = PLAN_KIND[first.structure] || 'pawn';
      const freal = first.target;
      const other = (first.nominees || []).find(n => n !== freal);
      want(`hohweek.plan.${kind}`, { a: hoh, b, c: freal, d: kind === 'pawn' ? (first.pawn || other) : other });
    }
  } else if (block.length >= 3) {
    if (bd) want('hohweek.plan3.backdoor', { a: hoh, b, c: block[0], d: block[1], f: block[2], e: bd });
    else {
      const pawn = plan.pawn && block.includes(plan.pawn) && plan.pawn !== real ? plan.pawn : null;
      const rest = block.filter(n => n !== real && n !== pawn);
      if (pawn) want('hohweek.plan3.pawn', { a: hoh, b, c: real, d: pawn, f: rest[0] });
      else want('hohweek.plan3.targets', { a: hoh, b, c: real, d: rest[0], f: rest[1] });
    }
  } else if (bd) want('hohweek.plan.backdoor', { a: hoh, b, c: n0, d: n1, e: bd });
  else {
    const kind = PLAN_KIND[plan.structure] || 'pawn';
    const other = block.find(n => n !== real);
    want(`hohweek.plan.${kind}`, { a: hoh, b, c: real, d: kind === 'pawn' ? (plan.pawn || other) : other });
  }
  // the plan scene IS the HOH saying the name to their closest person: the engine's moment of it
  // (power-hoh-deciding) does not fold into it a second time ("It's Nichelle. Don't tell anyone",
  // two lines after the whole backdoor was laid out)
  const planned = out.find(t => /^hohweek\.plan/.test(t.kind));
  if (planned) planned.mute = (week.acts || []).flatMap(x => x?.socialBeats || [])
    .filter(x => x && !x.aired && x.eventId === 'power-hoh-deciding' && x.players?.[0] === hoh);
  // the switch itself, with whoever brought the name up (a pitch); the pitch's own engine moment is
  // played inside it (`mute`), so it does not air again afterwards as a scene the plan ignored
  if (sw && house.includes(sw.from) && house.includes(sw.to)) {
    const mute = (week.acts || []).flatMap(x => x?.socialBeats || []).filter(x => x && !x.aired
      && ((sw.why === 'pitch' && x.eventId === 'power-hoh-pitch' && x.players?.[0] === sw.by && x.players?.[1] === hoh)
        || (sw.why === 'bloc' && x.eventId === 'bloc-target-picked' && x.players?.[0] === hoh && x.players?.includes(sw.to))));
    const who = sw.why === 'pitch' ? { a: hoh, b, c: sw.from, d: sw.to, e: sw.by } : { a: hoh, b, c: sw.from, d: sw.to };
    const n = out.length;
    want(`hohweek.switch.${sw.why}`, who);
    if (out.length > n) out[out.length - 1].mute = mute;
  }
  // every ask the engine made, in order: a refusal, then the one who said yes (an ask of somebody
  // the switch has since made the target is no longer a pawn ask)
  for (const ask of (week.pawnAsk?.asked || []).slice(0, 2)) {
    if (ask.name === real) continue;
    // on a backdoor the pawn knows (or is told a story about) the empty chair: hohweek.pawn.decoy
    if (bd && ask.accepted) want('hohweek.pawn.decoy', { a: hoh, b: ask.name, c: block.find(n => n !== ask.name) || n0, e: bd });
    else want(ask.accepted ? 'hohweek.pawn.agree' : 'hohweek.pawn.refuse', { a: hoh, b: ask.name, c: bd ? (block.find(n => n !== ask.name) || n0) : real });
  }
  // the plan that names the pawn comes after the people who said no to the chair (read 2026-10-15: "Brightly,
  // and Hicks as a pawn", then Beth asked Emmah, then Caleb, to be that pawn)
  const pi = out.findIndex(t => /^hohweek\.plan3?\.pawn$/.test(t.kind));
  const lastNo = out.map(t => t.kind).lastIndexOf('hohweek.pawn.refuse');
  if (pi >= 0 && lastNo > pi) out.splice(lastNo, 0, ...out.splice(pi, 1));
  // the real target fishes. What the HOH says is who they are: a nice archetype lies less, and more the
  // more strategic they are (the user, 2026-10-23: "change that rule"); a backdoor target can never be
  // told the truth.
  const fisher = real;
  if (fisher && fisher !== hoh) {
    const s = pStats(hoh) || {};
    const lie = ((s.strategic || 5) / 10) * (1 - (s.loyalty || 5) / 20)
      * (NICE.has(archOf(hoh)) ? 0.5 * (s.strategic || 5) / 10 : 1);
    const honest = bd ? 0 : ((s.boldness || 5) / 10) * ((s.loyalty || 5) / 10);
    const roll = rng() * (lie + honest + 0.35);
    const how = roll < lie ? 'lie' : roll < lie + honest ? 'honest' : 'deflect';
    want(`hohweek.fish.${how}`, { a: hoh, b: fisher });
  }
  // and somebody floating it out downstairs: a floater or goat, or whoever has won least
  const floaters = house.filter(n => n !== hoh && !block.includes(n) && n !== bd
    && ['floater', 'goat'].includes(archOf(n)));
  const fl = floaters[Math.floor(rng() * floaters.length)];
  if (fl) want('hohweek.float.any', { a: fl, b: closest(fl, [hoh]), c: hoh });
  return out;
}
