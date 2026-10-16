// ══════════════════════════════════════════════════════════════════════
// ch/daily/demolition.js — Demolition Derby: smash the others, keep yours standing, trust nobody
// ══════════════════════════════════════════════════════════════════════
//
// Each side (a pair, a team) defends a tower of crates in the sand ring and carries padded rams. Every
// round each side still in picks a tower to hit; a tower takes three good hits and is down. Who a side
// hits is a choice made in front of everybody: a threat, a grudge, never the side it has a pact with.
//
// The pact (the user, 2026-10-15: "even the wacky betrayal one"): at the start, the two sides with the
// most friendship between them agree not to hit each other. When there are three towers left, a schemer on
// one side may turn and hit the partner they promised to spare: the betrayal is a beat, a grudge the size
// of a broken promise, and the house's popularity of the one who did it.
import { getBond, addBond } from '../../bonds.js';
import { remember } from '../rel.js';
import { run, pop, S, mayScheme, clamp } from './kit.js';

export function playDemolition(state, rng, { units, power }) {
  const all = units.flat();
  const R = run(all);
  const key = u => u.join('+');
  const avg = (u, f) => u.reduce((a, n) => a + f(n), 0) / u.length;
  const hp = Object.fromEntries(units.map(u => [key(u), 3]));
  const alive = () => units.filter(u => hp[key(u)] > 0);
  const snap = () => Object.fromEntries(units.map(u => [key(u), hp[key(u)]]));
  const cross = (a, b) => avg(a, x => avg(b, y => getBond(x, y)));
  R.beat(0, 'derby-start', all, { units: units.map(u => [...u]) });
  // the pact
  let pact = null;
  if (units.length >= 3) {
    let best = 1.5;
    for (let i = 0; i < units.length; i++) for (let j = i + 1; j < units.length; j++) {
      const c = cross(units[i], units[j]);
      if (c > best) { best = c; pact = [units[i], units[j]]; }
    }
    if (pact) R.beat(0.5, 'pact', [pact[0][0], pact[1][0]], { a: pact[0], b: pact[1] });
  }
  let broken = false;
  const out = [];
  for (let round = 1; round <= 30 && alive().length > 1; round++) {
    for (const u of [...alive()].sort(() => rng() - 0.5)) {
      if (hp[key(u)] <= 0 || alive().length <= 1) continue;
      const others = alive().filter(x => x !== u);
      const partner = pact && (pact[0] === u ? pact[1] : pact[1] === u ? pact[0] : null);
      // turn on the pact: three towers or fewer left, and somebody on this side is the kind who would
      let betray = false;
      if (partner && !broken && hp[key(partner)] > 0 && alive().length <= 3) {
        const schemer = u.find(n => mayScheme(n) && S(n, 'strategic') >= 6 && S(n, 'loyalty') <= 5);
        if (schemer && rng() < 0.35 + (10 - S(schemer, 'loyalty')) * 0.05) betray = schemer;
      }
      const target = betray ? partner : [...others].filter(x => x !== partner || broken).sort((a, b) =>
        (avg(b, n => power[n]) * 0.3 - cross(u, b) * 0.6 + rng()) - (avg(a, n => power[n]) * 0.3 - cross(u, a) * 0.6 + rng()))[0];
      if (!target) continue;
      const hitP = clamp(0.35 + (avg(u, n => S(n, 'physical') + S(n, 'boldness')) / 20 - avg(target, n => S(n, 'endurance')) / 10) * 0.6 + (avg(u, n => power[n]) - 6) * 0.04, 0.12, 0.85);
      const hit = rng() < hitP;
      if (betray) {
        broken = true;
        for (const a of u) for (const b of target) { addBond(b, a, -2); remember(b, a, 'alliance-betrayal', 2); }
        pop(betray, -0.8);
        R.beat(round, 'betray', [betray, ...target], { by: u, on: target, hit, snap: snap() });
      }
      if (hit) {
        hp[key(target)]--;
        for (const a of u) for (const b of target) addBond(a, b, -0.15);
        if (!betray) R.beat(round + 0.1, 'smash', [u[0], target[0]], { by: u, on: target, hp: hp[key(target)], snap: snap() });
        if (hp[key(target)] <= 0) { out.push(target); R.beat(round + 0.2, 'tower-down', [...target], { by: u, snap: snap() }); }
      } else if (!betray && rng() < 0.3) R.beat(round + 0.1, 'miss', [u[0], target[0]], { by: u, on: target, snap: snap() });
    }
  }
  const champ = alive()[0];
  R.beat(40, 'last-tower', [...champ], { snap: snap() });
  for (const n of champ) pop(n, 0.4);
  const score = {};
  out.forEach((u, i) => { for (const n of u) score[n] = i; });
  for (const n of champ) score[n] = 100;
  for (const n of all) score[n] ??= 0;
  return { beats: R.beats, score };
}
