// ══════════════════════════════════════════════════════════════════════
// pm/casa.js — stick or twist
// ══════════════════════════════════════════════════════════════════════
//
// Every original decides in secret (spec §9.4), proportional to the best Casa
// attraction against what they feel for their partner, how far up the ladder
// they said they were, how safe they feel, their intent and loyalty, and
// FEAR — somebody who already knows their partner strayed twists first.
// Friends who have already chosen pull them too ("it's a lads' holiday").
// Never reads approval or fame.
import { attr } from './chemistry.js';
import { romance, believed } from './feelings.js';
import { makeEvent, partnerOf } from './events.js';
import { closedness } from './ladder.js';
import { emo, breakHeart, feel, jealousOf } from './emotions.js';
import { addBond } from '../bonds.js';
import { confrontation } from './movie-night.js';
import { noteBreakup } from './exes.js';
import { peerPressure } from './circle.js';
import { BETRAYAL } from './ledger.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const ONE = { relief: 'relief', devastated: 'devastated', both: 'both', turned: 'turned' };
function returnCeremony(state, rng, decisions) {
  const decided = Object.fromEntries(decisions.map(d => [d.name, d]));
  const before = Object.fromEntries(decisions.map(d => [d.name, partnerOf(state, d.name)]));
  const goers = decisions.filter(d => state.casa.includes(d.name));
  const stayers = decisions.filter(d => !state.casa.includes(d.name));
  const ev = (kind, players, extra, major = []) => makeEvent(state, rng, { phase: 'firepit', kind, players, aired: true, major, extra });
  const ret = (d, side) => {
    const partner = before[d.name];
    const players = [d.name, d.with || partner].filter(Boolean);
    return ev('casa-return', players, { choice: d.choice, of: side, pop: d.choice === 'twist'
      ? { [d.name]: { approval: partner ? -BETRAYAL.casaTwist : 0.5, fame: 3 }, ...(partner ? { [partner]: { approval: 3, fame: 3 } } : {}) }
      : { [d.name]: { approval: partner ? 2 : 0, fame: 1.5 } } },
    d.choice === 'twist' ? players.concat(partner ? [partner] : []) : []);
  };
  const out = [ev('casa-host', [], { pop: {} })];
  // The ones who stayed choose first, and sit with that choice.
  for (const d of stayers) out.push(ret(d, 'stayed'));
  // Then the doors open.
  const rows = [];
  for (const d of goers) {
    out.push(ret(d, 'returned'));
    const p = before[d.name];
    const pd = p ? decided[p] : null;
    if (!p || !pd) continue;
    const of = d.choice === 'stick' && pd.choice === 'stick' ? ONE.relief
      : d.choice === 'twist' && pd.choice !== 'twist' ? ONE.devastated
      : d.choice === 'twist' ? ONE.both : ONE.turned;
    // Who reacts: the one left holding nothing.
    const [who, other, third] = of === ONE.turned ? [d.name, p, pd.with] : [p, d.name, of === ONE.relief ? null : d.with];
    if (of === ONE.relief) { addBond(p, d.name, 0.8); feel(state, p, 'security', 1); feel(state, d.name, 'security', 1); }
    if (of === ONE.devastated) jealousOf(state, p, d.with, 1.5);
    if (of === ONE.turned) jealousOf(state, d.name, pd.with, 1.5);
    if (of === ONE.both) { addBond(p, d.name, -0.4); }
    out.push(ev('casa-react', [who, other, third].filter(Boolean), { of,
      pop: { [who]: { approval: of === ONE.relief ? 1 : 2, fame: 2 } } }, of === ONE.relief ? [] : [who]));
    if (of === ONE.devastated) { rows.push([p, d.name]); noteBreakup(state, { ender: p, wrong: d.name, severity: 1, cause: 'casa' }); }
    if (of === ONE.turned) { rows.push([d.name, p]); noteBreakup(state, { ender: d.name, wrong: p, severity: 1, cause: 'casa' }); }
  }
  // The rows, the same night: the one who stuck and the one who didn't.
  for (const [stuck, twister] of rows) {
    out.push(...confrontation(state, rng, { p: stuck, x: twister, sev: 1, rowKind: 'casa-row', splitKind: null, phase: 'firepit', split: false }));
  }
  return out;
}

export function stickOrTwist(state, { rng }) {
  const arrivals = new Set(state.casaArrivals || []);
  const originals = state.villa.filter(n => !arrivals.has(n));
  const roomOf = n => (state.casa.includes(n) ? 'casa' : 'villa');
  const scored = originals.map(o => {
    const prof = state.profiles[o], s = prof.stats, e = emo(state, o);
    const options = [...arrivals].filter(c => roomOf(c) === roomOf(o) && attr(state, o, c) != null);
    const best = options.length ? Math.max(...options.map(c => attr(state, o, c))) / 10 : 0;
    const p = partnerOf(state, o);
    const conn = p ? Math.max(0, romance(o, p) / 10) : 0;
    // Fear: I know they strayed, or I believe they feel less than I do.
    const fear = p ? (state.secrets.some(x => x.known && x.who === p && x.partner === o) ? 0.25 : 0)
      + 0.2 * Math.max(0, romance(o, p) - believed(state, o, p)) / 10 : 0;
    const intent = ['fun', 'stir'].includes(prof.intent) ? 0.2 : 0;
    const arch = prof.archetype === 'loyal-soldier' ? -0.1 : 0;
    const ladder = p ? -0.35 * closedness(state, o, p) : 0;
    const feelings = -0.15 * e.security / 10 + 0.2 * e.heartbreak / 10;
    const twistP = options.length
      ? clamp(0.1 + 0.55 * best - 0.45 * conn + intent + fear - 0.3 * s.loyalty / 10 + arch + ladder + feelings
        + (p ? 0 : 0.4), 0.02, 0.95)
      : 0;
    return { o, p, twistP, options };
  }).sort((a, b) => b.twistP - a.twistP);

  const taken = new Set();
  const decisions = [];
  for (const { o, twistP, options } of scored) {
    const free = options.filter(c => !taken.has(c)).sort((x, y) => attr(state, o, y) - attr(state, o, x));
    const pressure = peerPressure(state, o, decisions);
    if (free.length && rng() < clamp(twistP + pressure, 0.02, 0.95)) {
      taken.add(free[0]);
      decisions.push({ name: o, choice: 'twist', with: free[0] });
    } else decisions.push({ name: o, choice: 'stick', with: null });
  }

  const choice = Object.fromEntries(decisions.map(d => [d.name, d]));
  const next = [], singleSafe = [];
  for (const [a, b] of state.couples) {
    if (arrivals.has(a) || arrivals.has(b)) continue;
    if (choice[a]?.choice === 'stick' && choice[b]?.choice === 'stick') next.push([a, b]);
    else {
      if (choice[a]?.choice === 'stick') singleSafe.push(a);
      if (choice[b]?.choice === 'stick') singleSafe.push(b);
    }
  }
  for (const d of decisions) if (d.choice === 'twist') next.push([d.name, d.with]);
  const dumped = [...arrivals].filter(c => !taken.has(c));

  // THE RETURN, as the show plays it (user: "casa returns … and all the drama
  // it causes, it's absolutely necessary"): the host at the fire pit; the ones
  // who stayed, each sitting alone or beside someone new; then the Casa
  // islanders walking back in one at a time — and the face of the one waiting.
  const events = returnCeremony(state, rng, decisions);

  // Whoever stuck while their partner twisted is safe, and heartbroken.
  for (const n of singleSafe) {
    const ex = scored.find(x => x.o === n)?.p;
    if (ex) breakHeart(state, n, ex, 6 * romance(n, ex) / 10);
  }

  const before = Object.fromEntries(scored.map(x => [x.o, x.p]));
  state.couples = next;
  // Recorded like every other exit, so the ex-islanders' vote can ask them back.
  for (const n of dumped) (state.gone ||= []).push({ name: n, ep: state.ep });
  state.villa = state.villa.filter(n => !dumped.includes(n));
  state.split = false;
  state.casa = [];
  state.casaArrivals = [];
  return {
    decisions, dumped, singleSafe, events,
    ballots: decisions.map(d => ({ voter: d.name, target: d.with || before[d.name] || null, channel: 'casa', choice: d.choice })),
  };
}
