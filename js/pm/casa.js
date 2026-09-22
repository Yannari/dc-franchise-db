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
import { emo, breakHeart } from './emotions.js';
import { peerPressure } from './circle.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

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

  const events = decisions.map(d => {
    const partner = partnerOf(state, d.name);
    const players = [d.name, d.with || partner].filter(Boolean);
    return makeEvent(state, rng, { phase: 'firepit', kind: 'casa-return', players, aired: true,
      major: d.choice === 'twist' ? players.concat(partner ? [partner] : []) : [],
      extra: { choice: d.choice, pop: d.choice === 'twist'
        ? { [d.name]: { approval: partner ? -3 : 0.5, fame: 3 }, ...(partner ? { [partner]: { approval: 3, fame: 3 } } : {}) }
        : { [d.name]: { approval: partner ? 2 : 0, fame: 1.5 } } } });
  });

  // Whoever stuck while their partner twisted is safe, and heartbroken.
  for (const n of singleSafe) {
    const ex = scored.find(x => x.o === n)?.p;
    if (ex) breakHeart(state, n, ex, 6 * romance(n, ex) / 10);
  }

  const before = Object.fromEntries(scored.map(x => [x.o, x.p]));
  state.couples = next;
  state.villa = state.villa.filter(n => !dumped.includes(n));
  state.split = false;
  state.casa = [];
  state.casaArrivals = [];
  return {
    decisions, dumped, singleSafe, events,
    ballots: decisions.map(d => ({ voter: d.name, target: d.with || before[d.name] || null, channel: 'casa', choice: d.choice })),
  };
}
