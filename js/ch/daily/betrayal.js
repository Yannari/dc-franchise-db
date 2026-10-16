// ══════════════════════════════════════════════════════════════════════
// ch/daily/betrayal.js — the dailies built to make people turn on each other
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-15: "add more, even the wacky betrayal ones". Each of these hands somebody a choice
// between a friend and themselves, in front of the house, and every choice has its consequence:
//
//   King of the Raft  everybody on the yellow raft, push the rest off. Allies gang up on a threat; when the
//                     last ones standing are allies, one of them has to push the other.
//   Cut the Rope      pairs hang under the pier on one rope each. Either partner can cut the other loose to
//                     hang on longer, and win alone.
//   Double Cross      pairs race for tokens; the leading pair then chooses, each in secret, to SHARE the
//                     safety or STEAL it all. Two shares: both safe. One steal: the stealer alone. Two
//                     steals: nobody, and it goes to the next pair.
//   Trust Fall        one partner stands blindfolded at the cliff's edge; the other, at the rope, can catch
//                     them or let them drop and take a call home for themselves.
//   Who Said It       TJ asks the house a question about itself ("who is the biggest snake?"); everybody
//                     answers out loud, and you score for matching the most common answer. Everybody named
//                     heard who named them.
//
// The archetype rules hold: a nice archetype never steals, cuts or drops anybody (they share, hold on and
// catch); a neutral one needs strategic >= 6 and loyalty <= 4; the villains decide by what it gets them.
import { namedSting } from './named.js';
import { getBond, addBond } from '../../bonds.js';
import { remember, trustOf, grudgeOf, protectOf } from '../rel.js';
import { nudge } from '../mind.js';
import { allianceOf } from '../alliances.js';
import { coupleOf } from '../callout.js';
import { planOf } from '../plans.js';
import { threatRead } from '../respect.js';
import { run, pop, staying, inHeats, isNice, S, mayScheme, clamp, logistic } from './kit.js';
import { playRace } from './race.js';

// would `a` turn on `b` for `gain` (0..1)? Never a nice archetype; the rest by loyalty, the bond, and the gain.
function wouldTurn(state, rng, a, b, gain) {
  if (isNice(a) || !mayScheme(a)) return false;
  const loyal = S(a, 'loyalty') / 10, bond = getBond(a, b);
  const p = clamp(gain * 0.7 + (1 - loyal) * 0.5 - Math.max(0, bond) * 0.06 - (coupleOf(state, a) === b ? 0.6 : 0) + S(a, 'strategic') * 0.02 - 0.35, 0, 0.9);
  return rng() < p;
}
function betrayed(state, by, on, size = 1) {
  addBond(on, by, -2.2 * size); remember(on, by, 'alliance-betrayal', 2 * size);
  for (const o of state.active) if (o !== by && o !== on && getBond(o, on) >= 3) addBond(o, by, -0.4 * size);
  pop(by, -0.8 * size); nudge(state, on, 'morale', -1);
}

// ── King of the Raft ──────────────────────────────────────────────────
export function playRaftKing(state, rng, { units, power }) {
  const all = units.flat();
  const R = run(all);
  const score = inHeats(state, rng, R, all, 12, (list, label) => {
    for (const n of list) R.in.add(n);
    R.beat(0, 'raft-start', list, { label });
    const up = () => list.filter(n => R.in.has(n));
    const bal = n => (S(n, 'physical') * 0.45 + S(n, 'temperament') * 0.25 + S(n, 'boldness') * 0.3) / 10 + (power[n] - 6) * 0.04;
    let t = 0;
    while (up().length > 1 && t < 80) {
      t++;
      const order = [...up()].sort(() => rng() - 0.5);
      for (const a of order) {
        if (!R.in.has(a) || up().length <= 1) continue;
        const others = up().filter(x => x !== a);
        const al = allianceOf(state, a);
        const allyOf = x => (al && al.members.includes(x)) || coupleOf(state, a) === x;
        // the last allies standing: one of them has to push the other
        const onlyAllies = others.every(allyOf);
        let target, betray = false;
        if (onlyAllies) {
          target = others[0];
          betray = true;
          if (!wouldTurn(state, rng, a, target, 0.9) && others.length === 1) {
            // a loyal one waits for the other to do it; if both wait, the raft tips them both: TJ calls it on balance
            if (rng() < 0.5) continue;
            betray = false;
          }
        } else {
          target = others.filter(x => !allyOf(x)).sort((x, y) => (threatRead(state, y) + grudgeOf(a, y) * 0.8 + rng()) - (threatRead(state, x) + grudgeOf(a, x) * 0.8 + rng()))[0];
        }
        if (!target) continue;
        // an ally joins in on the same target
        const mate = !betray && others.find(x => x !== target && allyOf(x) && rng() < 0.4);
        const push = bal(a) + (mate ? bal(mate) * 0.5 : 0) + rng() * 0.5;
        const hold = bal(target) + rng() * 0.6;
        t += 0.05;
        if (betray) betrayed(state, a, target, 0.8);
        if (push > hold + 0.15) {
          R.drop(t, target, 'pushed', { by: a, mate: mate || null, betray });
          addBond(target, a, -0.5); remember(target, a, 'knocked-me-off', 0.8);
        } else if (rng() < 0.35) R.beat(t, 'shove', [a, target], { betray, mate: mate || null });
      }
    }
    const w = up()[0];
    R.beat(t + 1, 'raft-win', [w], { label });
    pop(w, 0.5);
    return w;
  });
  return { beats: R.beats, score };
}

// ── Cut the Rope ──────────────────────────────────────────────────────
export function playCutRope(state, rng, { units, power }) {
  const all = units.flat();
  const R = run(all);
  const key = u => u.join('+');
  const M = Object.fromEntries(all.map(n => [n, 2 + staying(power[n], rng) * 2.6]));
  const solo = new Set();   // somebody who cut their partner hangs alone (lighter: a little longer)
  R.beat(0, 'rope-start', all, { units: units.map(u => [...u]) });
  const hanging = () => units.filter(u => u.some(n => R.in.has(n)));
  let winners = null;
  for (let t = 1; t < 200 && hanging().length > 1; t += 0.5) {
    if (Math.abs(t % 4) < 1e-9) R.beat(t, 'sag', [], { notch: t / 4 });
    for (const u of hanging()) {
      const on = u.filter(n => R.in.has(n));
      // a pair is as strong as its weaker grip; when it starts to go, one of them may cut the other
      const weak = on.sort((a, b) => M[a] - M[b])[0];
      if (on.length === 2 && M[weak] <= t + 1.5 && !solo.has(key(u))) {
        const strong = on.find(n => n !== weak);
        if (wouldTurn(state, rng, strong, weak, 0.8)) {
          solo.add(key(u));
          M[strong] += 2.5;
          betrayed(state, strong, weak, 1.2);
          R.drop(t, weak, 'cut', { by: strong });
          continue;
        }
      }
      if (M[weak] <= t && hanging().length > 1) {
        // the rope goes: the pair drops together (or the one left alone)
        for (const n of on) R.drop(t + 0.05, n, 'fall', { pair: u });
      }
    }
  }
  const last = hanging()[0] || units[0];
  const still = last.filter(n => R.in.has(n));
  winners = still.length ? still : last;
  R.beat(201, 'rope-win', winners, { alone: solo.has(key(last)) });
  for (const n of winners) pop(n, 0.4);
  const score = {};
  R.out.forEach((n, i) => { score[n] = i; });
  for (const n of winners) score[n] = 100;
  for (const n of all) score[n] ??= 0;
  return { beats: R.beats, score, winners };
}

// ── Double Cross ──────────────────────────────────────────────────────
export function playDoubleCross(state, rng, { units, power, mode }) {
  // the race for tokens is Reef Dash's, then the choice
  const race = playRace(state, rng, { units, power, mode: 'pairs', id: 'reef-dash' });
  const order = Object.entries(race.score).sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const pairOf = n => units.find(u => u.includes(n));
  const pairs = [...new Set(order.map(n => pairOf(n)))];
  const beats = [...race.beats];
  let winners = null;
  const t0 = (beats[beats.length - 1]?.t || 30) + 1;
  for (const [k, pair] of pairs.slice(0, 3).entries()) {
    // every member of the unit chooses (a trio, when the numbers are odd): stealing gets you safety alone;
    // sharing gets it for everybody, if everybody shares
    const steals = n => {
      const o = pair.filter(x => x !== n).sort((x, y) => getBond(n, x) - getBond(n, y))[0];
      const danger = clamp((threatRead(state, n) - 5) / 5, 0, 1);
      return wouldTurn(state, rng, n, o, 0.5 + danger * 0.4);
    };
    const choice = Object.fromEntries(pair.map(n => [n, steals(n) ? 'steal' : 'share']));
    const thieves = pair.filter(n => choice[n] === 'steal');
    beats.push({ t: t0 + k, kind: 'choice', who: [...pair], data: { choice, k } });
    if (!thieves.length) { winners = [...pair]; for (const a of pair) for (const b of pair) if (a < b) addBond(a, b, 1.2); for (const n of pair) pop(n, 0.6); break; }
    if (thieves.length > 1) {
      for (const a of thieves) for (const b of pair) if (a !== b) { addBond(b, a, -1.5); remember(b, a, 'alliance-betrayal', 1); }
      for (const a of thieves) pop(a, -0.3);
      continue;
    }
    const thief = thieves[0];
    for (const mark of pair.filter(n => n !== thief)) betrayed(state, thief, mark, 1.3);
    winners = [thief];
    break;
  }
  if (!winners) winners = [...pairs[Math.min(3, pairs.length - 1)]];
  const score = {};
  for (const n of units.flat()) score[n] = winners.includes(n) ? 100 : race.score[n] || 0;
  return { beats, score, winners };
}

// ── Trust Fall ────────────────────────────────────────────────────────
export function playTrustFall(state, rng, { units, power }) {
  const all = units.flat();
  const R = run(all);
  R.beat(0, 'trust-start', all, { units: units.map(u => [...u]) });
  const score = {};
  for (const [k, u] of units.entries()) {
    if (u.length < 2) { for (const n of u) score[n] = 0; continue; }
    // the faller is the one less sure of the other; the catcher holds the rope
    const [faller, catcher] = trustOf(u[0], u[1]) <= trustOf(u[1], u[0]) ? [u[0], u[1]] : [u[1], u[0]];
    const trust = clamp((trustOf(faller, catcher) + 3) / 8, 0, 1);
    // how long they stand at the edge before letting go: trust, and nerve
    const hesitate = clamp(1 - trust * 0.6 - S(faller, 'boldness') / 25, 0.05, 1);
    const drop = wouldTurn(state, rng, catcher, faller, 0.45);
    const time = 20 + hesitate * 40 + rng() * 8;
    if (drop) {
      betrayed(state, catcher, faller, 1);
      nudge(state, catcher, 'homesick', -2.5);
      R.beat(k + 1, 'dropped', [faller, catcher], { hesitate: +hesitate.toFixed(2) });
      score[faller] = score[catcher] = 0;
    } else {
      addBond(faller, catcher, 0.8); remember(faller, catcher, 'caught-me', 1);
      R.beat(k + 1, 'caught', [faller, catcher], { hesitate: +hesitate.toFixed(2), time: Math.round(time) });
      score[faller] = score[catcher] = 100 - time;
    }
  }
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0];
  const winners = units.find(u => u.includes(best)) || units[0];
  R.beat(units.length + 2, 'trust-win', winners, {});
  for (const n of winners) pop(n, 0.4);
  return { beats: R.beats, score, winners: [...winners] };
}

// ── Who Said It ───────────────────────────────────────────────────────
const QUESTIONS = [
  { id: 'snake', w: (state, v, n) => -getBond(v, n) * 0.6 + (mayScheme(n) ? 1.5 : 0) + S(n, 'strategic') * 0.15 },
  { id: 'threat', w: (state, v, n) => threatRead(state, n) },
  { id: 'coattails', w: (state, v, n) => (10 - threatRead(state, n)) * 0.4 - getBond(v, n) * 0.3 + (state.rec[n]?.votedIn ? -1 : 0.5) },
  { id: 'next-in', w: (state, v, n) => (planOf(state, v)?.targets?.includes(n) ? 3 : 0) - getBond(v, n) * 0.4 + grudgeOf(v, n) },
  { id: 'never-trust', w: (state, v, n) => -trustOf(v, n) + grudgeOf(v, n) * 0.8 },
  { id: 'final', w: (state, v, n) => trustOf(v, n) * 0.6 + (planOf(state, v)?.finalWith?.includes(n) ? 3 : 0) + protectOf(v, n) * 0.3 },
];
export function playWhoSaidIt(state, rng, { units }) {
  const all = units.flat();
  const R = run(all);
  const pts = Object.fromEntries(all.map(n => [n, 0]));
  R.beat(0, 'quiz-start', all, {});
  const qs = [...QUESTIONS].sort(() => rng() - 0.5).slice(0, 4);
  for (const [k, q] of qs.entries()) {
    const answers = {};
    for (const v of all) {
      const pick = all.filter(n => n !== v).map(n => ({ n, s: q.w(state, v, n) + rng() * 1.2 })).sort((a, b) => b.s - a.s)[0];
      answers[v] = pick.n;
    }
    const tally = {};
    for (const n of Object.values(answers)) tally[n] = (tally[n] || 0) + 1;
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
    for (const v of all) if (answers[v] === top) pts[v]++;
    // said out loud: everybody named heard who named them (a nice answer warms, a hard one stings)
    const warm = q.id === 'final';
    // said out loud: everybody named heard who named them, and what it costs depends on who said it (named.js)
    const reacts = {};
    for (const [v, n] of Object.entries(answers)) reacts[v] = namedSting(state, rng, v, n, q.id)?.kind || null;
    if (!warm) { nudge(state, top, 'paranoia', 1); pop(top, -0.2); }
    R.beat(k + 1, 'question', [top], { q: q.id, answers, tally, top, reacts });
  }
  const divs = state.options.gendered ? ['m', 'f'] : ['all'];
  const winners = divs.map(d => all.filter(n => d === 'all' || state.division[n] === d).sort((a, b) => pts[b] - pts[a] || S(b, 'intuition') - S(a, 'intuition'))[0]).filter(Boolean);
  R.beat(qs.length + 1, 'quiz-win', winners, { pts });
  const score = Object.fromEntries(all.map(n => [n, pts[n] + (winners.includes(n) ? 100 : 0)]));
  return { beats: R.beats, score, winners };
}
