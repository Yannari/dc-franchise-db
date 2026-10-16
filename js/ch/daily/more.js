// ══════════════════════════════════════════════════════════════════════
// ch/daily/more.js — the dailies on the user's G sets
// ══════════════════════════════════════════════════════════════════════
//
// The user painted the sets (art jobs G02-G13, 2026-10-16) as an empty scene plus one object per player, so
// these play a whole division at once where the set allows it (heats only past that):
//
//   Deep Freeze          sit in a tub of ice; TJ offers cocoa and a blanket to anyone who climbs out
//   Rolling in the Deep  hang from the spinning log; it spins faster at every stage; heats of five
//   Road Kill            push the others off the moving flatbed into the nets (King of the Raft's engine)
//   Mud Brawl            a bracket of one-on-one bouts in the mud pit, first to two flags
//   Car Jump             car to car under the cranes (a race course: race.js)
//   Locked In            crawl through a cage tunnel to the bell (a race course)
//   The Box              reach into a crate of critters for the puzzle pieces (a race course)
//   Buried               one partner in a coffin, the other guessing how they answered about the house
//   Food Wars            win the buzzer and choose who eats; refusing the plate puts you out
//
// Every moment between people has its consequence (kit.js), and the fears are tested where a set calls for them.
import { getBond, addBond } from '../../bonds.js';
import { remember, trustOf, grudgeOf, protectOf } from '../rel.js';
import { nudge, fearOfThing } from '../mind.js';
import { allianceOf } from '../alliances.js';
import { coupleOf } from '../callout.js';
import { threatRead } from '../respect.js';
import { run, charged, toneOf, needle, cheer, help, helperFor, faceFear, pop, staying, inHeats, isNice, S, mayScheme, clamp, logistic, noise } from './kit.js';
import { playRaftKing } from './betrayal.js';

// ── an endurance heat: everybody holds out; the stages make it worse ──
// stages: [{ t, kind, drain, tempt? }] in minutes; every fall is its own beat at its own minute.
function endure(state, rng, R, players, power, label, { stages, k = 3, fear = null, start, win }) {
  for (const n of players) R.in.add(n);
  R.beat(0, start, players, { label });
  const T = Object.fromEntries(players.map(n => [n, 2 + staying(power[n], rng) * k]));
  const up = () => players.filter(n => R.in.has(n));
  if (fear) for (const n of players) {
    const f = faceFear(state, rng, n, fearOfThing(state, n, fear) * 0.8);
    if (!f) continue;
    if (f.froze) {
      const h = helperFor(state, n, players);
      if (h) { const r = help(state, h, n); T[n] = T[n] * 0.75 + r.shift; R.beat(0.5, 'fear-helped', [n, h], { fear }); }
      else { T[n] *= 0.5; R.beat(0.5, 'fear-froze', [n], { fear }); }
    } else if (f.size >= 0.45) R.beat(0.5, 'fear-beaten', [n], { fear });
  }
  let talked = 0;
  const talkedPairs = new Set();
  const fallsBefore = t0 => {
    let k2 = 0;
    for (const n of up().sort((a, b) => T[a] - T[b])) { if (up().length <= 1) return; if (T[n] < t0) R.drop(T[n] + k2++ * 0.01, n, 'fall', {}); }
  };
  for (const st of stages) {
    fallsBefore(st.t);
    if (up().length <= 1) break;
    R.beat(st.t, st.kind, up(), { tempt: !!st.tempt });
    for (const n of up()) T[n] -= st.drain * (1.2 - S(n, 'endurance') / 10);
    if (st.tempt) {
      for (const n of up()) if (up().length > 1 && T[n] < st.t + 3 && rng() < (10 - S(n, 'temperament')) / 10 * 0.6) { pop(n, -0.2); R.drop(st.t + 0.05, n, 'gives-up', { tempt: st.kind }); }
    }
    if (talked < 2 && up().length >= 2) {
      const pair = charged(state, up(), rng);
      if (pair && !talkedPairs.has(pair.join('+'))) {
        talkedPairs.add(pair.join('+'));
        talked++;
        const [a, b] = pair, tone = toneOf(state, a, b);
        if (tone === 'needle') { const r = needle(state, a, b); T[r.b] += r.shift; R.beat(st.t + 0.2, 'talk', [r.a, r.b], { tone: r.soft ? 'smalltalk' : 'needle', shift: r.shift }); }
        else if (tone === 'couple' || tone === 'friends') { const r = cheer(state, a, b); T[b] += r.shift * 0.6; R.beat(st.t + 0.2, 'talk', [a, b], { tone }); }
        else R.beat(st.t + 0.2, 'talk', [a, b], { tone });
      }
    }
  }
  fallsBefore(Infinity);
  const w = up()[0];
  R.beat(Math.max(...R.beats.map(b => b.t)) + 0.2, win, [w], { label });
  pop(w, 0.4);
  return w;
}

export function playDeepFreeze(state, rng, { units, power }) {
  const all = units.flat();
  const R = run(all);
  const stages = [{ t: 3, kind: 'numb', drain: 0.4 }, { t: 6, kind: 'cocoa', drain: 0.3, tempt: true }, { t: 9, kind: 'more-ice', drain: 0.7 },
    { t: 13, kind: 'blanket', drain: 0.4, tempt: true }, { t: 17, kind: 'more-ice', drain: 0.8 }, { t: 22, kind: 'shaking', drain: 0.6 }];
  const score = inHeats(state, rng, R, all, 12, (h, label) => endure(state, rng, R, h, power, label, { stages, k: 2.6, start: 'tubs', win: 'last-in' }));
  return { beats: R.beats, score };
}

export function playLogRoll(state, rng, { units, power }) {
  const all = units.flat();
  const R = run(all);
  const stages = [{ t: 2, kind: 'spin', drain: 0.5 }, { t: 4, kind: 'faster', drain: 0.8 }, { t: 6, kind: 'faster', drain: 1 }, { t: 8, kind: 'reverse', drain: 1.1 }, { t: 10, kind: 'faster', drain: 1.3 }];
  const score = inHeats(state, rng, R, all, 5, (h, label, { final }) => endure(state, rng, R, h, power, label, { stages, k: final ? 1.1 : 1.3, fear: 'heights', start: 'log-start', win: 'last-on' }));
  return { beats: R.beats, score };
}

// Road Kill: King of the Raft on a moving truck (twelve on the flatbed; the nets either side)
export function playRoadKill(state, rng, args) { return playRaftKing(state, rng, args); }

// ── Mud Brawl: a bracket of bouts ─────────────────────────────────────
export function playMudBrawl(state, rng, { units, power }) {
  const all = units.flat();
  const R = run(all);
  const grip = n => (S(n, 'physical') * 0.45 + S(n, 'boldness') * 0.25 + S(n, 'endurance') * 0.3) / 10 + (power[n] - 6) * 0.04;
  const divs = state.options.gendered ? ['m', 'f'] : ['all'];
  const score = {};
  let t = 0;
  for (const div of divs) {
    let field = all.filter(n => div === 'all' || state.division[n] === div).sort(() => rng() - 0.5);
    if (!field.length) continue;
    R.beat(t++, 'bracket', field, { label: div === 'm' ? 'The men' : div === 'f' ? 'The women' : 'Everybody' });
    let round = 0;
    while (field.length > 1) {
      round++;
      const next = [];
      // a bye for the odd one out
      if (field.length % 2) { const bye = field.pop(); next.push(bye); R.beat(t++, 'bye', [bye], { round }); }
      for (let i = 0; i < field.length; i += 2) {
        const a = field[i], b = field[i + 1];
        R.beat(t++, 'bout', [a, b], { round, last: field.length === 2 && !next.length });
        // a rival says something first
        if (getBond(a, b) <= -2) { const r = needle(state, a, b); R.beat(t++, 'talk', [r.a, r.b], { tone: r.soft ? 'smalltalk' : 'needle' }); }
        const sc = { [a]: 0, [b]: 0 };
        while (sc[a] < 2 && sc[b] < 2) {
          const pa = logistic((grip(a) - grip(b)) * 4 + noise(rng) * 0.5);
          const w = rng() < pa ? a : b;
          sc[w]++;
          R.beat(t++, 'flag', [w, w === a ? b : a], { score: { ...sc } });
        }
        const win = sc[a] > sc[b] ? a : b, lose = win === a ? b : a;
        R.in.delete(lose); R.out.push(lose);
        score[lose] = round;
        const upset = threatRead(state, lose) - threatRead(state, win) > 1.5;
        if (upset) pop(win, 0.6);
        addBond(lose, win, getBond(lose, win) < 0 ? -0.6 : 0.2);
        R.beat(t++, 'bout-win', [win, lose], { round, upset });
        next.push(win);
      }
      field = next;
    }
    score[field[0]] = 30;
    R.beat(t++, 'brawl-win', [field[0]], {});
    pop(field[0], 0.4);
  }
  for (const n of all) score[n] ??= 0;
  return { beats: R.beats, score };
}

// ── Buried ────────────────────────────────────────────────────────────
const ASK = [
  { id: 'snake', w: (state, v, n) => -getBond(v, n) * 0.6 + (mayScheme(n) ? 1.5 : 0) + S(n, 'strategic') * 0.15 },
  { id: 'threat', w: (state, v, n) => threatRead(state, n) },
  { id: 'fake', w: (state, v, n) => -trustOf(v, n) + (S(n, 'social') - 5) * 0.3 },
  { id: 'next-in', w: (state, v, n) => -getBond(v, n) * 0.4 + grudgeOf(v, n) },
  { id: 'final', w: (state, v, n) => trustOf(v, n) * 0.6 + protectOf(v, n) * 0.3 },
];
export function playBuried(state, rng, { units }) {
  const all = units.flat();
  const R = run(all);
  const pairs = units.filter(u => u.length >= 2);
  const pts = {};
  const score = {};
  // six coffins on the sand: six pairs a heat, the best pair of each heat... the best pair overall wins
  const heats = [];
  for (let i = 0; i < pairs.length; i += 6) heats.push(pairs.slice(i, i + 6));
  let t = 0;
  for (const [h, heat] of heats.entries()) {
    const roles = heat.map(u => { const [x, y] = u; const buried = S(x, 'boldness') >= S(y, 'boldness') ? x : y; return { buried, ans: u.find(n => n !== buried), u }; });
    R.beat(t++, 'coffins', roles.flatMap(r => [r.buried, r.ans]), { label: heats.length > 1 ? `Heat ${h + 1}` : 'Everybody', roles: roles.map(r => [r.buried, r.ans]) });
    const out = new Set();
    for (const r of roles) {
      pts[r.u.join('+')] = 0;
      // in the box: the fear of tight spaces
      const f = faceFear(state, rng, r.buried, fearOfThing(state, r.buried, 'tight spaces'));
      if (f?.froze) {
        // the partner talks them through it, or they knock on the lid and they're out
        if (getBond(r.ans, r.buried) > -1 && rng() < 0.6 + S(r.ans, 'social') * 0.03) { help(state, r.ans, r.buried); R.beat(t++, 'panic-calmed', [r.buried, r.ans], {}); }
        else { out.add(r.u.join('+')); pop(r.buried, -0.2); R.beat(t++, 'tap-out', [r.buried, r.ans], {}); }
      }
    }
    const qs = [...ASK].sort(() => rng() - 0.5).slice(0, 4);
    for (const q of qs) {
      R.beat(t++, 'ask', [], { q: q.id });
      const named = {};
      for (const r of roles) {
        const k = r.u.join('+');
        if (out.has(k)) continue;
        const pool = state.active.filter(n => n !== r.buried && n !== r.ans);
        const pick = pool.map(n => ({ n, s: q.w(state, r.buried, n) + rng() * 1.2 })).sort((a, b) => b.s - a.s)[0]?.n;
        if (!pick) continue;
        // the partner guesses: knowing someone is trust and intuition
        const knows = logistic((trustOf(r.ans, r.buried) * 0.25 + S(r.ans, 'intuition') * 0.25 - 1.6));
        const guess = rng() < knows ? pick : pool[Math.floor(rng() * pool.length)];
        const right = guess === pick;
        if (right) pts[k]++;
        named[pick] = (named[pick] || 0) + 1;
        // the answer is out in the open now: the one named heard who named them
        if (q.id !== 'final') { addBond(pick, r.buried, -0.4); remember(pick, r.buried, 'named-me', 0.6); } else addBond(pick, r.buried, 0.3);
        R.beat(t++, 'answer', [r.ans, r.buried, pick], { q: q.id, guess, right, pts: pts[k] });
      }
    }
    for (const r of roles) { const k = r.u.join('+'); score[r.buried] = score[r.ans] = out.has(k) ? -1 : pts[k]; }
  }
  const best = pairs.filter(u => !(score[u[0]] < 0)).sort((a, b) => score[b[0]] - score[a[0]] || rng() - 0.5)[0] || pairs[0];
  for (const n of best) { score[n] = 100; pop(n, 0.4); }
  R.beat(t++, 'buried-win', best, {});
  for (const n of all) score[n] ??= 0;
  return { beats: R.beats, score, winners: [...best] };
}

// ── Food Wars ─────────────────────────────────────────────────────────
const DISHES = ['fish eyes', 'a blended pig snout shake', 'sheep brain', 'fermented shark', 'a bowl of live worms', 'cockroach crackers', 'a cup of blood', 'boiled cow tongue', 'pickled cockscombs'];
export function playFoodWars(state, rng, { units, power }) {
  const all = units.flat();
  const R = run(all);
  let dish = 0;
  const score = inHeats(state, rng, R, all, 9, (list, label) => {
    for (const n of list) R.in.add(n);
    R.beat(0, 'table', list, { label });
    let t = 1;
    const seated = () => list.filter(n => R.in.has(n));
    while (seated().length > 1 && t < 60) {
      // the buzzer: quick and sharp
      const buzz = seated().map(n => ({ n, s: S(n, 'mental') * 0.5 + S(n, 'intuition') * 0.3 + rng() * 4 })).sort((a, b) => b.s - a.s)[0].n;
      // who they make eat: a threat, a grudge; never their own people (a schemer would, if it pays)
      const al = allianceOf(state, buzz);
      const target = seated().filter(n => n !== buzz).map(n => ({ n, s: threatRead(state, n) * 0.4 + grudgeOf(buzz, n) * 0.8 - Math.max(0, protectOf(buzz, n)) * 0.6
        - (al && al.members.includes(n) && !mayScheme(buzz) ? 5 : 0) - (coupleOf(state, buzz) === n ? 9 : 0) + rng() })).sort((a, b) => b.s - a.s)[0]?.n;
      if (!target) break;
      const d = DISHES[dish++ % DISHES.length];
      addBond(target, buzz, -0.5); remember(target, buzz, 'picked-me', 0.8);
      R.beat(t, 'buzz', [buzz, target], { dish: d });
      // the plate: eat it, or refuse and be out
      const size = fearOfThing(state, target, 'gross food') + 0.25 + t * 0.03;
      const nerve = (S(target, 'temperament') * 0.5 + S(target, 'boldness') * 0.3 + S(target, 'endurance') * 0.2) / 10;
      const eats = rng() < clamp(nerve * 1.1 - size * 0.6 + (power[target] - 6) * 0.04 + 0.25, 0.08, 0.95);
      if (eats) { pop(target, 0.2); R.beat(t + 0.1, 'eats', [target], { dish: d }); }
      else { R.drop(t + 0.1, target, 'refuses', { dish: d, by: buzz }); }
      t++;
    }
    const w = seated()[0];
    R.beat(t, 'last-seated', [w], { label });
    pop(w, 0.4);
    return w;
  });
  return { beats: R.beats, score };
}
