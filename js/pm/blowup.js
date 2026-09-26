// ══════════════════════════════════════════════════════════════════════
// pm/blowup.js — when it kicks off: the row, the sides, the feud
// ══════════════════════════════════════════════════════════════════════
//
// User: "build real fights — let people take sides, let it stem from
// jealousy, cheating…". The show's biggest rows are never out of nowhere: a
// grievance builds (a partner caught on a screen, a steal, a Casa twist, a
// vote, a friend who talked), and the one wronged goes for someone — often
// the OTHER person, not the partner. Then the villa piles in.
//
// Tension between two islanders is what happened, read off the record of
// the last few episodes (grievances), plus what they feel (resentment,
// jealousy). The more of it, and the shorter the fuse, the likelier the
// evening goes up — never a threshold, always in proportion.
//
//   blowup          [a, b]     a goes for b. `of` is the grievance:
//                              cheating · steal · casa · told · vote · jealousy · history
//   pile-in         [a, b, c]  a steps in on b's side, against c
//   villa-divided   [a, b]     the villa after: two camps (extra.sides)
//   cold-shoulder   [a, b]     a and b are on opposite sides, and it shows
//   clear-the-air   [a, b]     the two at the heart of it talk. `of`: peace · still-angry
import { addBond, getBond } from '../bonds.js';
import { getRelationshipDimension, addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf } from './events.js';
import { emo, feel } from './emotions.js';

const LOOKBACK = 2;
const JUSTIFIED = new Set(['cheating', 'steal', 'casa', 'told', 'vote']);

/** What a has against b, from what actually happened lately. */
function grievances(state, tonight = []) {
  const g = new Map();          // "a|b" -> { w, cause }
  // `role`: is b the partner who did it, or the other one? `kissed`: was it a
  // kiss? The row may only say what is true (user: "don't invent things").
  const add = (a, b, w, cause, role = null, kissed = false) => {
    if (!a || !b || a === b) return;
    const k = `${a}|${b}`, cur = g.get(k);
    if (!cur || w > cur.w) g.set(k, { w: (cur?.w || 0) * 0.5 + w, cause, role, kissed });
    else cur.w += w * 0.5;
  };
  for (const e of [...state.history, ...tonight]) {
    const age = state.ep - e.ep;
    if (age > LOOKBACK || !e.aired) continue;
    const fade = 1 - age / (LOOKBACK + 1);
    const p = e.players;
    const aud = e.extra?.audience;
    if ((e.kind === 'movie-clip' && e.extra?.of !== 'loyalty') && aud) {
      const k = e.extra?.of === 'kiss';
      add(aud[0], aud[1], 2.5 * fade, 'cheating', 'partner', k);
      const rival = p.find(n => n !== aud[1]);
      if (rival) add(aud[0], rival, 3 * fade, 'cheating', 'rival', k);       // the other one
    }
    if (e.kind === 'photos') { const k = e.extra?.of === 'kiss'; add(p[0], p[1], 2.5 * fade, 'cheating', 'partner', k); const r = e.extra?.faces?.[1]; if (r) add(p[0], r, 3 * fade, 'cheating', 'rival', k); }
    if (e.kind === 'recouple-pick' && e.extra?.stole) add(p[2], p[0], 3 * fade, 'steal');
    if (e.kind === 'steal') add(p[2], p[0], 3 * fade, 'steal');
    if (e.kind === 'casa-react' && ['devastated', 'turned'].includes(e.extra?.of)) { add(p[0], p[1], 3 * fade, 'casa', 'partner'); if (p[2]) add(p[0], p[2], 2.5 * fade, 'casa', 'rival'); }
    if (e.kind === 'gossip') add(p[2], p[0], 1.5 * fade, 'told');   // the one exposed, at the teller
    if (e.kind === 'debrief' && e.extra?.of === 'blame' && p[2]) add(p[0], p[2], 2 * fade, 'vote');
    // Old rows feed the next one only a little (measured: at full weight
    // they fed themselves, 12.5 blow-ups a season, most of them about nothing new).
    if (e.kind === 'argument') { add(p[0], p[1], 0.35 * fade, 'history'); add(p[1], p[0], 0.35 * fade, 'history'); }
    // Two after the same one: the rivals of a love triangle.
    if (e.kind === 'triangle-rivals') { add(p[0], p[1], 1.6 * fade, 'jealousy'); add(p[1], p[0], 1.6 * fade, 'jealousy'); }
    // …and the rivals of pm/rivalry.js: shade stings the one it was about, a row both.
    if (e.kind === 'rival-shade') add(p[1], p[0], 1.4 * fade, 'jealousy');
    if (e.kind === 'rival-row' && e.extra?.of === 'row') { add(p[0], p[1], 1.6 * fade, 'jealousy'); add(p[1], p[0], 1.6 * fade, 'jealousy'); }
    if (e.kind === 'code-call') add(p[2], p[1], 1.2 * fade, 'jealousy');
    // …and the two sides: whoever went at somebody's friend, and the pair who clashed over it.
    if (e.kind === 'camp-confront' && e.extra?.of === 'hot') add(p[1], p[0], 1.2 * fade, 'history');
    if (e.kind === 'camp-clash') { add(p[0], p[1], 1.5 * fade, 'history'); add(p[1], p[0], 1.5 * fade, 'history'); }
    // Exes at war: the one left, at the one who left; the new one, at the one who keeps coming over.
    if (e.kind === 'feud-confront') add(p[0], p[1], 2 * fade, 'steal');
    if (e.kind === 'feud-interrupt' || (e.kind === 'feud-shade' && e.extra?.of === 'catty')) add(p[e.kind === 'feud-shade' ? 1 : 2], p[0], 1.2 * fade, 'history');
  }
  // Jealousy of a rival is a grievance of its own: the one who has been
  // eyeing their partner, whatever the record says.
  for (const a of state.villa) for (const [r, v] of Object.entries(emo(state, a).jealousy || {})) {
    if (v >= 2 && state.villa.includes(r)) add(a, r, 0.45 * v, 'jealousy');
  }
  return g;
}

function tension(state, a, b, gr) {
  const base = gr?.w || 0;
  const res = getRelationshipDimension(a, b, 'resentment') ?? 0;
  const jea = emo(state, a).jealousy?.[b] || 0;
  return base + 0.4 * res + 0.3 * jea;
}

/** The evening it goes up — at most once an episode. */
export function blowups(state, rng, entry = null, tonight = []) {
  if (entry && (entry.moment === 'final' || entry.moment === 'reunion')) return [];
  const out = [...feudScenes(state, rng)];
  const gr = grievances(state, tonight);
  const here = new Set(state.villa);
  const cands = [];
  // A pair already at war carries it in the feud scenes, not a second blow-up;
  // and the villa is calmer the episode after one.
  const feuding = new Set((state.feuds || []).filter(f => !f.over).flatMap(f => [`${f.a}|${f.b}`, `${f.b}|${f.a}`]));
  const cooled = state._lastBlowup != null && state.ep - state._lastBlowup <= 1 ? 0.35 : 1;
  for (const [k, v] of gr) {
    const [a, b] = k.split('|');
    if (!here.has(a) || !here.has(b) || feuding.has(k)) continue;
    const t = tension(state, a, b, v);
    const temper = state.profiles[a]?.stats?.temperament ?? 5;
    // The shorter the fuse, the likelier it goes — in proportion.
    const p = cooled * Math.max(0, Math.min(0.85, (t - 2.5) / 10 * (1.35 - temper / 10)));
    // A row about nothing but old rows is rarer than one about something that happened.
    const q = v.cause === 'history' ? p * 0.5 : p;
    if (q > 0) cands.push({ a, b, t, p: q, cause: v.cause, role: v.role, kissed: !!v.kissed });
  }
  cands.sort((x, y) => y.t - x.t);
  const pick = cands.find(c => rng() < c.p);
  if (!pick) return out;
  state._lastBlowup = state.ep;
  out.push(...kickOff(state, rng, pick));
  return out;
}

function kickOff(state, rng, { a, b, cause, role, kissed }) {
  const events = [];
  const ev = (kind, players, extra, major = []) => {
    const e = makeEvent(state, rng, { phase: 'blowup', kind, players, aired: true, major, extra: { pop: {}, ...extra } });
    events.push(e); return e;
  };
  const just = JUSTIFIED.has(cause);
  addBond(a, b, -2); addRelationshipDimension(a, b, 'resentment', 1); addRelationshipDimension(b, a, 'resentment', 0.8);
  feel(state, a, 'stress', 1.2); feel(state, b, 'stress', 1);
  ev('blowup', [a, b], { of: cause, cause: role, kissed, pop: { [a]: { approval: just ? 1.5 : -2, fame: 3 }, [b]: { approval: just ? -2 : 0.5, fame: 3 } } }, [a, b]);

  // The sides: friendships and couples, and who is bold enough to say it.
  const S = n => state.profiles[n]?.stats || {};
  const leanOf = n => {
    let l = getBond(n, a) - getBond(n, b);
    if (partnerOf(state, n) === a) l += 6;
    if (partnerOf(state, n) === b) l -= 6;
    // A betrayal: the villa leans to the one wronged, by its own loyalty.
    if (just) l += 1.5 * (S(n).loyalty ?? 5) / 10;
    return l;
  };
  const sides = { A: [a], B: [b] };
  const bystanders = state.villa.filter(n => n !== a && n !== b).map(n => ({ n, lean: leanOf(n) }));
  for (const { n, lean } of bystanders) {
    if (lean > 1) { sides.A.push(n); addBond(n, a, 0.4); addBond(n, b, -0.6); }
    else if (lean < -1) { sides.B.push(n); addBond(n, b, 0.4); addBond(n, a, -0.6); }
  }
  // The ones who say it out loud: the strongest lean, weighted by boldness.
  const speakers = bystanders.filter(x => Math.abs(x.lean) > 1)
    .map(x => ({ ...x, w: Math.abs(x.lean) * (S(x.n).boldness ?? 5) / 10 * (0.6 + rng() * 0.8) }))
    .sort((x, y) => y.w - x.w).slice(0, 3);
  // The meter fills as they speak: each pile-in shows only who has stepped in
  // so far; the whole villa's camps are revealed at the end.
  const shown = { A: [a], B: [b] };
  for (const s of speakers) {
    const forA = s.lean > 0;
    const [def, oth] = forA ? [a, b] : [b, a];
    const good = forA === just;         // standing up for the one wronged
    shown[forA ? 'A' : 'B'].push(s.n);
    ev('pile-in', [s.n, def, oth], { of: forA ? 'for-a' : 'for-b',
      sides: { A: [...shown.A], B: [...shown.B] },
      pop: { [s.n]: { approval: good ? 0.8 : -0.8, fame: 1.5 } } });
    addBond(s.n, oth, -0.6);
  }
  ev('villa-divided', [a, b], { of: cause, sides: { A: [...sides.A], B: [...sides.B] } }, []);
  (state.feuds ||= []).push({ a, b, A: sides.A, B: sides.B, ep: state.ep, cause, over: false });
  return events;
}

/** The days after: the camps keep their distance, and one day someone talks. */
function feudScenes(state, rng) {
  const out = [];
  for (const f of state.feuds || []) {
    if (f.over || f.ep === state.ep) continue;
    if (!state.villa.includes(f.a) || !state.villa.includes(f.b)) { f.over = true; continue; }
    const A = f.A.filter(n => state.villa.includes(n) && n !== f.a), B = f.B.filter(n => state.villa.includes(n) && n !== f.b);
    // A cold shoulder between the camps.
    if (A.length && B.length && rng() < 0.6) {
      const x = A[Math.floor(rng() * A.length)], y = B[Math.floor(rng() * B.length)];
      addBond(x, y, -0.3);
      out.push(makeEvent(state, rng, { phase: 'evening', kind: 'cold-shoulder', players: [x, y], aired: true,
        extra: { pop: { [x]: { approval: -0.1, fame: 0.5 } } } }));
    }
    // Clearing the air: both tempers and the one wronged's loyalty to the villa.
    const T = n => (state.profiles[n]?.stats?.temperament ?? 5) / 10;
    const pTalk = 0.25 + 0.3 * (T(f.a) + T(f.b)) / 2;
    if (rng() < pTalk) {
      const peace = rng() < 0.3 + 0.4 * (T(f.a) + T(f.b)) / 2 - 0.1 * (state.ep - f.ep < 2 ? 1 : 0);
      if (peace) { f.over = true; addBond(f.a, f.b, 1.5); addRelationshipDimension(f.a, f.b, 'resentment', -1); addRelationshipDimension(f.b, f.a, 'resentment', -1); }
      else addBond(f.a, f.b, -0.5);
      out.push(makeEvent(state, rng, { phase: 'evening', kind: 'clear-the-air', players: [f.a, f.b], aired: true, major: peace ? [f.a, f.b] : [],
        extra: { of: peace ? 'peace' : 'still-angry', pop: { [f.a]: { approval: peace ? 0.8 : -0.3, fame: 1 }, [f.b]: { approval: peace ? 0.8 : -0.3, fame: 1 } } } }));
      if (!peace && state.ep - f.ep >= 3) f.over = true;     // it goes cold, eventually
    }
  }
  return out;
}
