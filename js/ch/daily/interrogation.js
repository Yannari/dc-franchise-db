// ══════════════════════════════════════════════════════════════════════
// ch/daily/interrogation.js — Interrogation: true or false, over the water
// ══════════════════════════════════════════════════════════════════════
//
// The real show's Interrogation (Spies, Lies & Allies): everybody stands on a platform above the water,
// holding an overhead bar. One at a time, TJ asks a true-or-false question. Right, and you pick somebody
// whose bar tilts forward a notch; wrong, and your own does. The further a bar tilts, the harder it is to
// hang on, and at the third notch nobody can.
//
// It is the house's own game: every question is about the people standing there, taken from the season's
// record (who voted for whom, who beat whom in the Arena, who called out whom, who has won a daily, who
// is a rookie), so the answers are things they lived through or should have noticed. And every pick is a
// choice made in front of everybody: a threat, a grudge, never an ally, a partner or a deal (unless the
// picker is the kind who turns on their own, and then it is a betrayal the alliance saw).
import { getBond, addBond } from '../../bonds.js';
import { remember, grudgeOf, protectOf } from '../rel.js';
import { coupleOf, dealBetween } from '../callout.js';
import { allianceOf } from '../alliances.js';
import { run, pop, inHeats, S, logistic, mayScheme } from './kit.js';

// What TJ can ask, from the record: { kind, s, o, truth } (o may be absent).
function questionBank(state) {
  const Q = [];
  for (const e of state.episodes) {
    for (const v of e.votes || []) for (const b of v.ballots || []) Q.push({ kind: 'voted', s: b.voter, o: b.target, ep: e.ep });
    for (const a of e.arena || []) Q.push({ kind: 'beat', s: a.winner, o: a.loser, ep: e.ep });
    for (const c of e.callouts || []) Q.push({ kind: 'calledout', s: c.by, o: c.opponent, ep: e.ep });
    for (const w of e.daily?.winners || []) Q.push({ kind: 'daily', s: w, ep: e.ep });
  }
  for (const n of state.cast) if (state.rookie?.[n]) Q.push({ kind: 'rookie', s: n });
  return Q;
}

function ask(state, rng, bank, used, near) {
  // prefer a question about somebody standing on a platform
  const pool = bank.filter(q => !used.has(JSON.stringify(q)) && (near.includes(q.s) || near.includes(q.o)));
  const src = pool.length ? pool : bank.filter(q => !used.has(JSON.stringify(q)));
  if (!src.length) return { kind: 'rookie', s: near[0], truth: !state.rookie?.[near[0]] ? false : true };
  // a kind first, then a fact of it: votes outnumber everything else, and a quiz of nothing but votes is dull
  const kinds = [...new Set(src.map(x => x.kind))];
  const kind = kinds[Math.floor(rng() * kinds.length)];
  const ofKind = src.filter(x => x.kind === kind);
  const q = ofKind[Math.floor(rng() * ofKind.length)];
  used.add(JSON.stringify(q));
  // half the time the statement is twisted: somebody else's name in it, or the opposite of the fact
  if (rng() < 0.5) {
    if (q.o) {
      const others = state.cast.filter(n => n !== q.s && n !== q.o);
      const o = others[Math.floor(rng() * others.length)] || q.o;
      return { ...q, o, truth: bank.some(x => x.kind === q.kind && x.s === q.s && x.o === o) };
    }
    // "{s} is a veteran": false for a rookie
    if (q.kind === 'rookie') return { ...q, flip: true, truth: false };
    const others = state.cast.filter(n => n !== q.s);
    const s2 = others[Math.floor(rng() * others.length)] || q.s;
    return { ...q, s: s2, truth: bank.some(x => x.kind === q.kind && x.s === s2) };
  }
  return { ...q, truth: true };
}

// who `c` tilts: a threat, a grudge; never a friend, an ally, a partner, a deal (unless c turns on their own)
function pickTarget(state, rng, c, standing, power) {
  const rows = standing.filter(n => n !== c).map(n => {
    const al = allianceOf(state, c);
    const ally = al && al.members.includes(n);
    const turn = ally && mayScheme(c) && S(c, 'strategic') >= 7 && S(c, 'loyalty') <= 3;
    let s = power[n] * 0.35 + grudgeOf(c, n) * 0.8 - Math.max(0, protectOf(c, n)) * 0.5 + rng() * 1.2;
    if (ally && !turn) s -= 5;
    if (coupleOf(state, c) === n) s -= 9;
    if (dealBetween(state, c, n)) s -= 3;
    return { n, s, ally };
  }).sort((a, b) => b.s - a.s);
  return rows[0] || null;
}

export function playInterrogation(state, rng, { units, power }) {
  const all = units.flat();
  const R = run(all);
  const bank = questionBank(state);
  const used = new Set();
  const grip = n => (S(n, 'endurance') * 0.45 + S(n, 'temperament') * 0.3 + S(n, 'physical') * 0.25) / 10 + (power[n] - 6) * 0.03;
  // a platform each (the gorge's six and six more in front): a division plays at once, in heats only past twelve
  const score = inHeats(state, rng, R, all, 12, (list, label, { final }) => {
    for (const n of list) R.in.add(n);
    const tilt = Object.fromEntries(list.map(n => [n, 0]));
    R.beat(0, 'platforms', list, { label, final });
    let t = 1, round = 0;
    const standing = () => list.filter(n => R.in.has(n));
    const holds = n => {
      if (tilt[n] >= 3) return false;
      return rng() < logistic(3.2 - tilt[n] * 1.6 + (grip(n) - 0.55) * 4 - round * 0.12 - (final ? 0.3 : 0));
    };
    while (standing().length > 1 && round < 40) {
      round++;
      for (const c of [...standing()].sort(() => rng() - 0.5)) {
        if (!R.in.has(c) || standing().length <= 1) continue;
        const q = ask(state, rng, bank, used, standing());
        const know = ((S(c, 'mental') + S(c, 'intuition')) / 2 - 5) * 0.45 + 0.4 + (q.s === c || q.o === c ? 1.2 : 0);
        const right = rng() < logistic(know);
        t += 0.25;
        let target = null, betray = false;
        if (right) {
          const pick = pickTarget(state, rng, c, standing(), power);
          if (pick) {
            target = pick.n; betray = pick.ally;
            tilt[target]++;
            addBond(target, c, betray ? -2 : -0.5);
            remember(target, c, betray ? 'alliance-betrayal' : 'tilted-my-bar', betray ? 1.8 : 0.9);
            if (betray) { const al = allianceOf(state, c); for (const m of al?.members || []) if (m !== c && m !== target) addBond(m, c, -0.6); pop(c, -0.4); }
          }
        } else tilt[c]++;
        R.beat(t, 'question', [c, ...(target ? [target] : [])], { q, answer: right ? q.truth : !q.truth, right, target, betray, tilt: target ? tilt[target] : tilt[c] });
        const hit = target || c;
        if (!holds(hit)) {
          t += 0.1;
          R.drop(t, hit, 'fall', { tilt: tilt[hit], by: target ? c : null });
          if (target) pop(c, 0.1);
        }
      }
    }
    const w = standing()[0];
    R.beat(t + 0.3, 'last-standing', [w], { label, final });
    pop(w, 0.4);
    return w;
  });
  return { beats: R.beats, score };
}
