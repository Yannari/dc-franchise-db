// ══════════════════════════════════════════════════════════════════════
// ch/daily/hang-on.js — Hang On: the net under the pier, one grip at a time
// ══════════════════════════════════════════════════════════════════════
//
// The real show's hang challenges (Rolling in the Deep, the truck and helicopter hangs): everybody holds on
// over the water and the crew makes it worse in stages. Before, the viewer dropped the field in four lumps
// ("seventeen people fall"); the user wanted every fall. Here each grip that goes is its own beat, at its
// own minute, and the stages are what made it go: the net sags a notch every few minutes (six notches),
// the tide comes up after the third.
//
// The people: up there it is high, and a player afraid of heights may freeze before it starts (a friend
// beside them can talk them through it). In the long middle, the two with the most between them talk:
// a needle shakes or fires up, a friend or a partner keeps them up. When a partner drops, the one still
// up takes it hard or holds on for both. In pairs, a pair is out when both have let go.
import { getBond } from '../../bonds.js';
import { fearOfThing } from '../mind.js';
import { run, charged, toneOf, needle, cheer, help, helperFor, faceFear, pop, staying } from './kit.js';

const NOTCH = 4;        // minutes between sags
const TIDE = 3;         // the tide comes up after this many notches

export function playHangOn(state, rng, { units, power, mode }) {
  const all = units.flat();
  const R = run(all);
  // minutes they can hold
  const M = Object.fromEntries(all.map(n => [n, 2 + staying(power[n], rng) * 3.1]));
  R.beat(0, 'hang-start', all, { order: all });
  // fear of heights, before the first notch
  for (const n of all) {
    const f = faceFear(state, rng, n, fearOfThing(state, n, 'heights'));
    if (!f) continue;
    if (f.froze) {
      const h = helperFor(state, n, all);
      if (h) { const r = help(state, h, n); M[n] = M[n] * 0.7 + r.shift; R.beat(0.5, 'fear-helped', [n, h], { fear: 'heights' }); }
      else { M[n] *= 0.45; R.beat(0.5, 'fear-froze', [n], { fear: 'heights' }); }
    } else if (f.size >= 0.45) R.beat(0.5, 'fear-beaten', [n], { fear: 'heights' });
  }
  const div = n => (state.options.gendered && mode === 'solo' ? state.division[n] : 'all');
  const divs = [...new Set(all.map(div))];
  const won = new Set();
  const left = d => all.filter(n => R.in.has(n) && div(n) === d);
  const unitOf = n => units.find(u => u.includes(n));
  const unitIn = u => u.some(n => R.in.has(n));
  let talked = 0;
  const step = 0.5;
  for (let t = 1; t < 200; t += step) {
    // a sag every few minutes, the tide after the third
    if (Math.abs(t % NOTCH) < 1e-9) {
      const k = t / NOTCH;
      R.beat(t, 'sag', all.filter(n => R.in.has(n)), { notch: k, tide: k === TIDE });
      for (const n of all) if (R.in.has(n)) M[n] -= 0.4 + k * 0.15 + (k > TIDE ? 0.3 : 0);
    }
    // the middle: two of them talk (twice, at most)
    if (talked < 2 && t >= 6 + talked * 7 && t < 7 + talked * 7) {
      const pair = charged(state, all.filter(n => R.in.has(n)), rng);
      if (pair) {
        talked++;
        const [a, b] = pair, tone = toneOf(state, a, b);
        if (tone === 'needle') { const r = needle(state, a, b); M[r.b] += r.shift * 1.5; R.beat(t, 'talk', [r.a, r.b], { tone: r.soft ? 'smalltalk' : 'needle', shift: r.shift }); }
        else if (tone === 'couple' || tone === 'friends') { const r = cheer(state, a, b); M[b] += r.shift; M[a] += 0.3; R.beat(t, 'talk', [a, b], { tone }); }
        else R.beat(t, 'talk', [a, b], { tone });
      }
    }
    // the grips that go, one at a time
    let k = 0;
    for (const n of all.filter(x => R.in.has(x) && M[x] <= t).sort((a, b) => M[a] - M[b])) {
      const d = div(n);
      if (won.has(d)) continue;
      // in pairs: a pair is out when both have gone; solo: the last of a division never drops
      if (mode === 'pairs') { const u = unitOf(n); if (units.filter(unitIn).length <= 1) continue; }
      else if (left(d).length <= 1) continue;
      R.drop(t + 0.05 * k++, n, 'fall', { minute: +t.toFixed(1) });
      // the partner still up, or a showmance, reacts
      const u = unitOf(n);
      const mate = u?.find(x => x !== n && R.in.has(x)) || all.find(x => x !== n && R.in.has(x) && getBond(x, n) >= 5);
      if (mate && rng() < 0.5) {
        const steel = rng() < (state.mind[mate]?.confidence ?? 5) / 10;
        M[mate] += steel ? 1 : -1.2;
        R.beat(t + 0.45, steel ? 'holds-for-both' : 'shaken', [mate, n], {});
        if (!steel) pop(mate, -0.1);
      }
    }
    // a division settled
    for (const d of divs) {
      if (won.has(d)) continue;
      const done = mode === 'pairs' ? units.filter(unitIn).length <= 1 : left(d).length === 1;
      if (done) {
        won.add(d);
        const champs = mode === 'pairs' ? units.find(unitIn).filter(x => x) : left(d);
        R.beat(t + 0.5, 'last-hanging', champs, { div: d, minute: +t.toFixed(1) });
        for (const c of champs) pop(c, 0.5);
      }
    }
    if (won.size === divs.length) break;
  }
  // score: the minute they let go (the last one hanging, highest); a pair shares its last member's minute
  const score = {};
  R.beats.forEach(b => { if (b.kind === 'fall') score[b.who[0]] = b.t; });
  for (const n of all) score[n] ??= 999;
  if (mode === 'pairs') for (const u of units) { const m = Math.max(...u.map(n => score[n])); for (const n of u) score[n] = m; }
  return { beats: R.beats, score };
}
