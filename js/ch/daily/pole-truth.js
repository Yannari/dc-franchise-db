// ══════════════════════════════════════════════════════════════════════
// ch/daily/pole-truth.js — Pole Truth: stand on a pole over the water, as long as it takes
// ══════════════════════════════════════════════════════════════════════
//
// From Total Drama's "The Truth, The Pole Truth and Nothing But the Truth" (the user's pick, 2026-10-15,
// with the plates: six posts in the water, a yellow platform, a timer). No food and no water before it.
// Six poles, so it is played in heats of up to six, a division at a time; the last one standing in each
// heat goes to the final heat, and the last one standing there wins.
//
// The hours, as the episode ran them: TJ offers breakfast to anyone who steps down (1h); the heat of the
// day (2h30); burgers (4h); the long middle, when the people on the poles talk to each other (6h30); TJ
// reads a TRUTH about somebody up there, taken from the real game: who they voted for, who they want in
// the Arena, a deal they made (9h); night falls (10h); a pizza, and somebody who lunges for it and takes
// their neighbours down with them (11h, earlier than the episode's 14h so a heat of six reaches it). Everybody else falls when their legs or their nerve go.
import { getBond, addBond } from '../../bonds.js';
import { giveRespect } from '../respect.js';
import { remember } from '../rel.js';
import { run, charged, toneOf, needle, cheer, knock, pop, staying, inHeats, S, clamp } from './kit.js';

const FOOD = [
  { t: 1, food: 'breakfast' },
  { t: 4, food: 'burgers' },
  { t: 11, food: 'pizza', lunge: true },
];

// A truth TJ can read about somebody: the game's own record, never invented.
function truthAbout(state, rng, n) {
  const out = [];
  const last = state.episodes[state.episodes.length - 1];
  for (const v of last?.votes || []) for (const b of v.ballots || []) if (b.voter === n && b.target !== n) out.push({ fact: 'voted', about: b.target, w: 1 });
  const plan = state.plans?.[n];
  for (const t of plan?.targets || []) if (t !== n && state.active.includes(t)) out.push({ fact: 'target', about: t, w: 1.6 });
  for (const d of state.deals || []) if (!d.broken && (d.a === n || d.b === n)) out.push({ fact: 'deal', about: d.a === n ? d.b : d.a, w: 1.2 });
  if (!out.length) return null;
  const tot = out.reduce((a, x) => a + x.w, 0);
  let r = rng() * tot;
  for (const x of out) { r -= x.w; if (r <= 0) return x; }
  return out[0];
}

function heat(state, rng, R, players, power, label, { tired = 1 } = {}) {
  const poles = [...players];
  for (const n of players) R.in.add(n);
  R.beat(0, 'heat-start', poles, { label, poles });
  const T = Object.fromEntries(poles.map(n => [n, 1 + staying(power[n], rng, tired) * 1.25]));
  const up = () => poles.filter(n => R.in.has(n) && players.includes(n));
  // everybody whose legs give out before `until`, in order
  const fallsBefore = until => {
    for (const n of up().sort((a, b) => T[a] - T[b])) {
      if (up().length <= 1) return;
      if (T[n] < until) R.drop(T[n], n, 'fall', { how: T[n] < 3 ? 'balance' : T[n] < 9 ? 'legs' : 'sleep', pole: poles.indexOf(n) });
    }
  };
  const events = [
    ...FOOD.map(f => ({ t: f.t, run: () => tempt(f) })),
    { t: 2.5, run: () => {
      R.beat(2.5, 'sun', up(), {});
      for (const n of up()) T[n] -= (10 - S(n, 'endurance')) * 0.09;
    } },
    { t: 6.5, run: () => {
      const pair = charged(state, up(), rng);
      if (!pair) return;
      const [a, b] = pair, tone = toneOf(state, a, b);
      if (tone === 'needle') { const r = needle(state, a, b); T[r.b] += r.shift; R.beat(6.5, 'talk', [r.a, r.b], { tone: r.soft ? 'smalltalk' : 'needle', shift: r.shift }); }
      else if (tone === 'couple' || tone === 'friends') { const r = cheer(state, a, b); T[b] += r.shift * 0.5; T[a] += 0.2; R.beat(6.5, 'talk', [a, b], { tone }); }
      else { addBond(a, b, 0.2); R.beat(6.5, 'talk', [a, b], { tone }); }
    } },
    { t: 9, run: () => {
      const cands = up().map(n => ({ n, f: truthAbout(state, rng, n) })).filter(x => x.f);
      if (!cands.length) return;
      const { n, f } = cands[Math.floor(rng() * cands.length)];
      // Said out loud, up there: the one it is about now knows, and the one it was said about wobbles.
      const shaken = (1 - S(n, 'temperament') / 10) * 2.4 - 0.4;
      T[n] -= shaken;
      if (state.active.includes(f.about)) {
        addBond(f.about, n, f.fact === 'target' ? -1.4 : f.fact === 'deal' ? 0 : -0.8);
        remember(f.about, n, f.fact === 'deal' ? 'deal-exposed' : 'truth-told', f.fact === 'target' ? 1.4 : 0.8);
      }
      // a deal said out loud is a deal the rest of the house now sees
      if (f.fact === 'deal') for (const o of state.active) if (o !== n && o !== f.about) addBond(o, n, -0.15);
      R.beat(9, 'truth', [n, f.about], { fact: f.fact, shaken: +shaken.toFixed(2), onPole: up().includes(f.about) });
    } },
    { t: 10, run: () => R.beat(10, 'night', up(), {}) },
  ].sort((a, b) => a.t - b.t);

  function tempt(f) {
    if (up().length <= 1) return;
    const takers = [];
    for (const n of up()) {
      const hunger = (10 - S(n, 'temperament')) / 10 * 0.5 + (1 - (state.mind[n]?.energy ?? 7) / 10) * 0.5;
      const soon = T[n] < f.t + 2.5;
      if (rng() < (soon ? hunger * 0.75 : hunger * 0.05)) takers.push(n);
    }
    // somebody always stays
    if (takers.length >= up().length) takers.splice(takers.indexOf([...takers].sort((a, b) => T[b] - T[a])[0]), 1);
    let lunge = null;
    if (f.lunge && up().length >= 2) {
      const l = up().filter(n => !takers.includes(n)).sort((a, b) => S(a, 'temperament') - S(b, 'temperament'))[0];
      if (l && rng() < (10 - S(l, 'temperament')) / 10 * 0.8) lunge = l;
    }
    R.beat(f.t, 'tempt', up(), { food: f.food, takers });
    for (const n of takers) {
      giveRespect(state, n, 'steppedDown'); pop(n, -0.3);
      R.drop(f.t + 0.05, n, 'step-down', { food: f.food, pole: poles.indexOf(n) });
    }
    if (lunge && R.in.has(lunge)) {
      const i = poles.indexOf(lunge);
      const hit = [poles[i - 1], poles[i + 1]].filter(x => x && R.in.has(x) && rng() < 0.55);
      if (up().length - 1 - hit.length < 1) hit.pop();
      for (const v of hit) knock(state, lunge, v, { meant: false });
      R.drop(f.t + 0.1, lunge, 'lunge', { food: f.food, knocked: hit, pole: i });
      for (const v of hit) R.drop(f.t + 0.12, v, 'knocked', { by: lunge, pole: poles.indexOf(v) });
    }
  }

  for (const e of events) {
    if (up().length <= 1) break;
    fallsBefore(e.t);
    if (up().length <= 1) break;
    e.run();
  }
  fallsBefore(Infinity);
  const winner = up()[0];
  const t = Math.max(...R.beats.filter(b => players.some(p => b.who.includes(p))).map(b => b.t), T[winner] || 0) + 0.1;
  R.beat(t, 'heat-win', [winner], { label, hours: +t.toFixed(1) });
  pop(winner, 0.4);
  return winner;
}

/** Play it. `power[n]` is each player's base for the day. Returns { beats, score }. */
export function playPoleTruth(state, rng, { units, power }) {
  const all = units.flat();
  const R = run(all);
  const score = inHeats(state, rng, R, all, 6, (h, label, { final }) => heat(state, rng, R, h, power, label, { tired: final ? 0.75 : 1 }));
  return { beats: R.beats, score };
}
