// ══════════════════════════════════════════════════════════════════════
// pm/arcs.js — six more storylines, each over several episodes
// ══════════════════════════════════════════════════════════════════════
//
// User: "build them all": the friend who goes for your one, the islander
// mugged off again and again until someone picks them, redemption with the
// public, the villa grass, the villa parents, and the ex who walks in. Each
// is read from the record (what aired, who was with whom), moves step by step
// on its own dice, and every step changes something — bonds, trust,
// attraction, stress, the public — that the rest of the season reads.
//
//   BETRAYAL   [a, b, x]  friend b went for a's one (a's partner, ex or crush)
//     betray-see      [a, b, x]  a finds out. `of`: saw · told
//     betray-confront [a, b, x]  a has it out with b. `of`: sorry · defends · cold (b's answer, by build)
//     betray-end      [a, b]     `of`: mended · over — and the villa takes sides between (the camps)
//   MUGGED OFF, THEN FOUND LOVE (Amber: left for Joanna, then Greg, and the winners, UK 5)
//     mugged-low      [u, f]     u to a friend: always the one left
//     found-love      [u, n]     someone finally picks u, and means it
//     villa-happy     [f, u, n]  the villa is happy for them
//   REDEMPTION WITH THE PUBLIC (Ron "began making amends", UK 9)
//     redeem-reflect  [r, f]     r admits it. `of`: sincere · for-show
//     redeem-act      [r, v]     r says sorry to the one r wronged. `of`: accepted · refused
//     redeem-doubt    [x, y, r]  the villa isn't sure it's real
//   THE VILLA GRASS (the one who keeps carrying tales)
//     grass-talk      [x, y, g]  the villa names g
//     grass-frozen    [g, f]     conversations stop when g walks in
//     grass-confront  [v, g]     someone g told on has it out. `of`: owns · sorry
//   VILLA PARENTS (the settled couple everyone goes to)
//     parents-named   [p, q, k]  the villa calls them mum and dad
//     parents-advice  [p, q, k]  k comes to them. `of`: crush · feud · heartbreak · general
//     parents-mediate [p, x, y]  p steps between two. `of`: works · fails
//     parents-wobble  [p, q]     the villa parents row, and the villa is shaken
//   THE EX WHO WALKS IN (a dumped islander back, or an ex from outside)
//     exw-stir        [i, f, e]  i to a friend about e. `of`: still · over
//     exw-partner     [p, i, e]  i's partner asks if they should worry
//     exw-talk        [i, e]     the two of them, finally. `of`: spark · closure · row
//     exw-back        [i, e]     a second chance
// Nice archetypes never scheme; betraying a friend needs the franchise's gate.
import { addBond, getBond } from '../bonds.js';
import { addRelationshipDimension, getRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf, roomMates } from './events.js';
import { attr, nudgeAttraction, compatible } from './chemistry.js';
import { romance, friendship, schemeEligible } from './feelings.js';
import { feel, jealousOf, jealousyHit, breakHeart, attachment } from './emotions.js';
import { styleOf, stepCamp, campsOf } from './rivalry.js';

const S = (state, n) => state.profiles[n]?.stats || {};
const st = (state, n, k) => (S(state, n)[k] ?? 5) / 10;
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const pop = (...rows) => Object.fromEntries(rows.filter(r => r && r[0]).map(([n, approval, fame]) => [n, { approval, fame }]));
const res = (a, b) => getRelationshipDimension(a, b, 'resentment') || 0;
const here = (state, ...ns) => ns.every(n => state.villa.includes(n));
const together = (state, ...ns) => { const r = roomMates(state, ns[0]); return ns.slice(1).every(n => r.includes(n)); };
function weighted(rng, opts) {
  const total = opts.reduce((t, o) => t + Math.max(0, o[1]), 0);
  if (total <= 0) return null;
  let r = rng() * total;
  for (const o of opts) if ((r -= Math.max(0, o[1])) < 0) return o[0];
  return opts[opts.length - 1][0];
}
const friendOf = (state, n, not = []) => roomMates(state, n).filter(f => !not.includes(f))
  .sort((p, q) => getBond(n, q) - getBond(n, p))[0] || null;
const both = (e, a, b) => e.players.includes(a) && e.players.includes(b);

/** What aired since last time: the new scenes this reads, once each. */
function fresh(state) {
  const h = state.history || [];
  const from = state._arcsSeen ?? 0;
  state._arcsSeen = h.length;
  return h.slice(from).filter(e => e && e.ep != null);
}

export function arcs(state, rng, entry = null) {
  if (entry && ['final', 'reunion'].includes(entry.moment)) return [];
  const out = [];
  const ev = (kind, players, extra, major = []) => {
    out.push(makeEvent(state, rng, { phase: 'rivals', kind, players, aired: true, major, extra: { pop: {}, ...extra } }));
  };
  const seen = fresh(state);
  // Everyone ever coupled with whom, for the exes (a couple as the record has it).
  for (const [a, b] of state.couples) (state.pairedEver ||= {})[[a, b].sort().join('|')] = state.ep;
  record(state, seen);
  betrayals(state, rng, seen, ev);
  mugged(state, rng, ev);
  redemption(state, rng, seen, ev);
  grass(state, rng, ev);
  parents(state, rng, ev);
  exWalksIn(state, rng, ev);
  return out;
}

// ── what the record says about people ─────────────────────────────────
const MUGGED = {   // the scene kind, and which of its players was the one left out
  'recouple-pick': e => (e.extra?.stoleFrom ? e.players[2] : null), steal: e => e.players[2], 'recouple-single': e => e.players[0],
  'crush-move': e => (['let-down', 'friend-zone'].includes(e.extra?.of) ? e.players[0] : null),
  'rival-won': e => e.players[1], 'feud-confront': e => e.players[0], 'game-fallout': e => (e.extra?.of === 'ends' ? e.players[0] : null),
  'triangle-choice': e => e.players[2],
};
const VILLAIN_ACT = { 'game-called': e => e.players[1], 'code-call': e => e.players[1], 'feud-confront': e => e.players[1],
  'rival-shade': e => (e.extra?.of === 'behind' ? e.players[0] : null), 'camp-confront': e => (e.extra?.of === 'hot' ? e.players[1] : null) };
function record(state, seen) {
  for (const e of seen) {
    const m = MUGGED[e.kind]?.(e);
    if (m && e.aired) ((state.mugged ||= {})[m] ||= []).push(e.ep);
    const v = VILLAIN_ACT[e.kind]?.(e);
    if (v && e.aired) ((state.villainy ||= {})[v] ||= []).push({ ep: e.ep, at: e.players.find(n => n !== v) });
    if (e.kind === 'gossip' && e.aired) ((state.tells ||= {})[e.players[0]] ||= []).push({ ep: e.ep, about: e.players[2] });
  }
}

// ── 1. the friend who went for your one ───────────────────────────────
const MOVES = new Set(['pull', 'kiss', 'recouple-pick', 'steal', 'date', 'game-kiss', 'hideaway', 'bed-share']);
function betrayals(state, rng, seen, ev) {
  state.betrayals ||= [];
  for (const t of state.betrayals.filter(x => !x.over)) {
    if (!here(state, t.a, t.b)) { t.over = true; t.why = 'gone'; continue; }
    if (t.ep === state.ep || !together(state, t.a, t.b)) continue;
    if (rng() < 0.85) stepBetrayal(state, rng, t, ev);
    if (!t.over && t.one && here(state, t.one) && together(state, t.a, t.b, t.one) && rng() < 0.5) stepCamp(state, rng, t, ev);
  }
  if (state.betrayals.filter(x => !x.over).length >= 1) return;
  // A new one: b made a move on x, and x is a's one — and a and b were friends.
  for (const e of seen) {
    if (!MOVES.has(e.kind) || e.players.length < 2) continue;
    const [b, x] = e.players;
    for (const a of roomMates(state, b)) {
      if (a === x || getBond(a, b) < 3.5) continue;
      if (Math.max(0, friendship(a, b)) < 3) continue;
      const mine = partnerOf(state, a) === x || romance(a, x) >= 5 || state.pairedEver?.[[a, x].sort().join('|')] != null && romance(a, x) >= 3.5;
      if (!mine || state.betrayals.some(t => t.a === a && t.b === b)) continue;
      // Going for a friend's one without a second thought needs the gate; the
      // rest of them do it only when they really want x.
      if (!schemeEligible(state.profiles[b]) && romance(b, x) < 5) continue;
      // (x and y are the two sides, h the one between them, as the camps read it.)
      state.betrayals.push({ a, b, one: x, h: x, x: a, y: b, feud: true, ep: state.ep, stage: 0, over: false });
      return;
    }
  }
}
function stepBetrayal(state, rng, t, ev) {
  const { a, b, one: x } = t;
  t.stage++;
  if (t.stage === 1) {
    addBond(a, b, -1.5); addRelationshipDimension(a, b, 'resentment', 1); jealousOf(state, a, b, 1.5); feel(state, a, 'stress', 0.8);
    const told = rng() < 0.5;
    t.last = { kind: 'row', by: b, at: a };
    return ev('betray-see', [a, b, x], { of: told ? 'told' : 'saw', pop: pop([a, 0.3, 1.2], [b, -0.3, 1]) });
  }
  if (t.stage === 2) {
    const style = styleOf(state, b, rng);
    const answer = style === 'fair' || style === 'withdraw' ? (attachment(state.profiles[b]).avoidance > 0.5 ? 'cold' : 'sorry') : 'defends';
    if (answer === 'sorry') { addBond(a, b, 0.4); feel(state, b, 'guilt', 0.8); }
    else { addBond(a, b, -0.8); addRelationshipDimension(a, b, 'resentment', 0.6); }
    t.answer = answer;
    t.last = { kind: 'row', by: a, at: b };
    return ev('betray-confront', [a, b, x], { of: answer, sides: { A: [a, ...campsOf(state, t).X], B: [b, ...campsOf(state, t).Y] },
      pop: pop([a, 0.3, 1.5], [b, answer === 'sorry' ? 0 : -0.5, 1.5]) }, [a, b]);
  }
  // Mended, or over: how warm they were before, how sorry b was, and a's temper.
  if (t.stage >= 3 && rng() < 0.6) {
    const mend = rng() < 0.3 + 0.35 * (t.answer === 'sorry' ? 1 : 0) + 0.3 * st(state, a, 'temperament') + Math.max(0, friendship(a, b)) / 20 - res(a, b) / 15;
    t.over = true; t.why = mend ? 'mended' : 'over';
    if (mend) { addBond(a, b, 1.5); addRelationshipDimension(a, b, 'resentment', -1); }
    else { addBond(a, b, -1.5); addBond(b, a, -1); }
    return ev('betray-end', [a, b], { of: mend ? 'mended' : 'over', pop: pop([a, 0.3, 1.2], [b, mend ? 0.3 : -0.2, 1]) }, mend ? [] : [a, b]);
  }
}

// ── 2. mugged off, then found love ────────────────────────────────────
function mugged(state, rng, ev) {
  state.underdogs ||= {};
  for (const [u, eps] of Object.entries(state.mugged || {})) {
    if (!state.villa.includes(u) || eps.length < 2) continue;
    const t = (state.underdogs[u] ||= { u, low: false, found: null, ep: state.ep });
    if (t.found) continue;
    const f = friendOf(state, u);
    if (!t.low && f && rng() < 0.7) {
      t.low = true; t.lowEp = state.ep;
      addBond(u, f, 0.4); feel(state, u, 'confidence', -0.6); feel(state, u, 'stress', 0.4);
      ev('mugged-low', [u, f], { pop: pop([u, 0.6, 1.2]) });
      continue;
    }
    // Found: someone who wants u back, as much as u wants them, and says so.
    if (!t.low || state.ep === t.lowEp) continue;
    const n = roomMates(state, u).filter(m => compatible(state, u, m) && (attr(state, m, u) ?? 0) >= 5 && (attr(state, u, m) ?? 0) >= 5)
      .sort((p, q) => (attr(state, q, u) ?? 0) - (attr(state, p, u) ?? 0))[0];
    if (!n || rng() > 0.7) continue;
    t.found = n; t.foundEp = state.ep;
    feel(state, u, 'confidence', 1.2); feel(state, u, 'security', 1); addBond(u, n, 0.8);
    nudgeAttraction(state, u, n, 0.4); nudgeAttraction(state, n, u, 0.4);
    ev('found-love', [u, n], { pop: pop([u, 2, 2.5], [n, 0.8, 1.5]) }, [u]);
    const g = friendOf(state, u, [n]);
    if (g) { addBond(g, u, 0.3); ev('villa-happy', [g, u, n], { pop: pop([g, 0.2, 0.5]) }); }
  }
}

// ── 3. redemption with the public ─────────────────────────────────────
function redemption(state, rng, seen, ev) {
  state.redemptions ||= [];
  for (const t of state.redemptions.filter(x => !x.over)) {
    if (!state.villa.includes(t.r)) { t.over = true; t.why = 'gone'; continue; }
    if (t.ep === state.ep || rng() > 0.8) continue;
    t.stage++;
    const r = t.r, f = friendOf(state, r, [t.v]);
    if (t.stage === 2 && f) {
      // The villa isn't sure — the less sincere, the likelier it's said.
      if (rng() < 0.8 - 0.6 * t.sincere) {
        const y = friendOf(state, f, [r]);
        if (y) { addBond(f, r, -0.2); ev('redeem-doubt', [f, y, r], { pop: pop([r, -0.3, 0.8]) }); continue; }
      }
    }
    if (t.stage >= 2 && t.v && here(state, t.v) && together(state, r, t.v)) {
      // Accepted from how sorry r is and how much the one wronged still holds it.
      const ok = rng() < 0.35 + 0.5 * t.sincere + 0.3 * st(state, t.v, 'temperament') - res(t.v, r) / 15;
      t.over = true; t.why = ok ? 'forgiven' : 'refused';
      if (ok) { addBond(t.v, r, 1.2); addRelationshipDimension(t.v, r, 'resentment', -1); for (const n of roomMates(state, r)) if (getBond(n, t.v) >= 2) addBond(n, r, 0.3); }
      // The public: a real change wins them back, a performance a little, if at all.
      ev('redeem-act', [r, t.v], { of: ok ? 'accepted' : 'refused', pop: pop([r, (ok ? 3 : 1) * t.sincere + 0.3, 2.5], [t.v, 0.4, 1]) }, [r]);
    }
  }
  if (state.redemptions.filter(x => !x.over).length) return;
  // A candidate: someone the villa has seen do wrong, and gone cold on — read
  // from the villa's own bonds, never the public's (the islanders can't know
  // what the public think; the public answer through the scenes' reactions).
  const villa = state.villa.filter(n => !state.redemptions.some(x => x.r === n));
  const warmth = n => villa.filter(m => m !== n).reduce((s, m) => s + getBond(m, n), 0) / Math.max(1, villa.length - 1);
  const ranked = villa.map(warmth).sort((a, b) => a - b);
  const low = ranked[Math.floor(ranked.length / 4)] ?? 0;
  for (const r of villa) {
    const acts = (state.villainy?.[r] || []).filter(x => state.ep - x.ep <= 6);
    if (!acts.length || warmth(r) > low) continue;
    // The ones with some loyalty and warmth in them try; the rest don't bother.
    if (rng() > 0.2 + 0.5 * st(state, r, 'loyalty') + 0.2 * st(state, r, 'temperament')) continue;
    const sincere = Math.max(0, Math.min(1, 0.3 * st(state, r, 'loyalty') + 0.3 * st(state, r, 'temperament') + (NICE.has(state.profiles[r]?.archetype) ? 0.3 : 0) + 0.3 * (1 - st(state, r, 'strategic')) + (rng() - 0.5) * 0.2));
    const v = acts[acts.length - 1].at;
    const f = friendOf(state, r, [v]);
    if (!f) continue;
    const t = { r, v, ep: state.ep, stage: 1, sincere, over: false };
    state.redemptions.push(t);
    feel(state, r, 'guilt', 0.6);
    ev('redeem-reflect', [r, f], { of: sincere >= 0.5 ? 'sincere' : 'for-show', pop: pop([r, 0.5 * sincere, 1]) });
    return;
  }
}

// ── 4. the villa grass ────────────────────────────────────────────────
function grass(state, rng, ev) {
  state.grasses ||= {};
  // The villa's grass is the one who keeps doing it: three tellings at least,
  // and more than anyone else here. One at a time, two a season at most
  // (anyone who told twice qualified, and a season had nine).
  const tally = Object.entries(state.tells || {}).filter(([g]) => state.villa.includes(g)).map(([g, t]) => [g, t.length]);
  const most = Math.max(0, ...tally.map(([, n]) => n));
  const active = Object.values(state.grasses).filter(t => !t.over).length;
  for (const [g, tells] of Object.entries(state.tells || {})) {
    if (!state.villa.includes(g)) continue;
    if (!state.grasses[g] && (tells.length < 3 || tells.length < most || active || Object.keys(state.grasses).length >= 2)) continue;
    const t = (state.grasses[g] ||= { g, stage: 0, ep: state.ep, over: false });
    if (t.over || t.lastEp === state.ep || rng() > 0.6) continue;
    t.lastEp = state.ep; t.stage++;
    const others = roomMates(state, g);
    if (t.stage === 1) {
      const x = others.sort((p, q) => st(state, q, 'boldness') - st(state, p, 'boldness'))[0];
      const y = x && friendOf(state, x, [g]);
      if (!x || !y) { t.stage--; continue; }
      for (const n of others) addRelationshipDimension(n, g, 'trust', -0.3);
      addBond(x, g, -0.3); addBond(y, g, -0.3);
      ev('grass-talk', [x, y, g], { pop: pop([g, -0.4, 1.2]) });
      continue;
    }
    if (t.stage === 2) {
      const f = friendOf(state, g);
      if (!f) continue;
      feel(state, g, 'security', -0.8); feel(state, g, 'stress', 0.5);
      ev('grass-frozen', [g, f], { pop: pop([g, 0.2, 1]) });
      continue;
    }
    // Someone g told on has it out with g.
    const v = [...tells].reverse().map(x => x.about).find(n => n && others.includes(n));
    t.over = true;
    if (!v) continue;
    const owns = styleOf(state, g, rng) === 'confront' || schemeEligible(state.profiles[g]);
    addBond(v, g, owns ? -1.2 : -0.4); addRelationshipDimension(v, g, 'resentment', owns ? 0.8 : 0.3);
    if (!owns) for (const n of others) addRelationshipDimension(n, g, 'trust', 0.2);
    ev('grass-confront', [v, g], { of: owns ? 'owns' : 'sorry', pop: pop([g, owns ? -0.4 : 0.4, 1.5], [v, 0.3, 1]) }, [v, g]);
  }
}

// ── 5. the villa parents ──────────────────────────────────────────────
function parents(state, rng, ev) {
  let P = state.villaParents;
  if (P && (!here(state, P.p, P.q) || partnerOf(state, P.p) !== P.q)) { P.over = true; state.villaParents = P = null; }
  if (!P) {
    if (state.ep < 5 || state.parentsDone) return;
    // The settled couple: both properly in it, the longest together.
    const c = state.couples.filter(([a, b]) => romance(a, b) >= 6 && romance(b, a) >= 6)
      .sort((x, y) => (state.pairedEver?.[x.slice().sort().join('|')] ?? 0) - (state.pairedEver?.[y.slice().sort().join('|')] ?? 0))
      .sort((x, y) => (romance(y[0], y[1]) + romance(y[1], y[0])) - (romance(x[0], x[1]) + romance(x[1], x[0])))[0];
    if (!c || rng() > 0.5) return;
    const k = friendOf(state, c[0], [c[1]]);
    if (!k) return;
    state.villaParents = P = { p: c[0], q: c[1], ep: state.ep, over: false };
    state.parentsDone = true;
    for (const n of roomMates(state, c[0])) { addBond(n, c[0], 0.2); addBond(n, c[1], 0.2); }
    return ev('parents-named', [c[0], c[1], k], { pop: pop([c[0], 0.6, 1.5], [c[1], 0.6, 1.5]) });
  }
  if (P.ep === state.ep || !together(state, P.p, P.q) || rng() > 0.75) return;
  const { p, q } = P;
  // Their own wobble: a row between them this episode, and the villa shaken by it.
  if ((state._today || []).some(e => e.kind === 'argument' && both(e, p, q)) && !P.wobbled) {
    P.wobbled = true;
    for (const n of roomMates(state, p)) feel(state, n, 'stress', 0.2);
    return ev('parents-wobble', [p, q], { pop: pop([p, -0.2, 1.2], [q, -0.2, 1.2]) });
  }
  // Somebody with a problem comes to them: a crush, a war, a broken heart.
  const crush = (state.crushes || []).find(t => !t.over && together(state, t.a, p) && ![p, q].includes(t.a));
  const feud = [...(state.exFeuds || []), ...(state.rivalries || []), ...(state.betrayals || [])]
    .find(t => !t.over && [t.d || t.x || t.a, t.l || t.y || t.b].every(n => n && together(state, n, p) && ![p, q].includes(n)));
  const broken = roomMates(state, p).find(n => ![q].includes(n) && (state.emo?.[n]?.heartbreak ?? 0) > 3);
  // Two at war: the one of them the parents are closer to, or step in themselves.
  if (feud && rng() < 0.4) {
    const [x, y] = [feud.d || feud.x || feud.a, feud.l || feud.y || feud.b];
    const works = rng() < 0.2 + 0.5 * st(state, p, 'social') + 0.3 * st(state, p, 'temperament') - (res(x, y) + res(y, x)) / 20;
    if (works) { addBond(x, y, 1); addBond(y, x, 1); feel(state, x, 'stress', -0.4); feel(state, y, 'stress', -0.4); }
    else { addBond(x, p, -0.2); }
    return ev('parents-mediate', [p, x, y], { of: works ? 'works' : 'fails', pop: pop([p, works ? 0.6 : 0, 1.2]) });
  }
  const [k, of] = crush ? [crush.a, 'crush'] : feud ? [feud.d || feud.x || feud.a, 'feud'] : broken ? [broken, 'heartbreak']
    : [friendOf(state, p, [q]), 'general'];
  if (!k) return;
  addBond(k, p, 0.3); addBond(k, q, 0.3); feel(state, k, 'stress', -0.4);
  // Their advice moves the story: go for it, or let it go; calm down; you'll be fine.
  if (of === 'crush') { if (rng() < 0.5 + 0.3 * st(state, p, 'boldness')) crush.pushed = true; else nudgeAttraction(state, k, crush.b, -0.5); }
  if (of === 'heartbreak') feel(state, k, 'heartbreak', -0.8);
  if (of === 'feud') feel(state, k, 'stress', -0.3);
  return ev('parents-advice', [p, q, k], { of, pop: pop([p, 0.3, 0.8], [q, 0.3, 0.8]) });
}

// ── 6. the ex who walks in ────────────────────────────────────────────
function exWalksIn(state, rng, ev) {
  state.exReturns ||= [];
  for (const t of state.exReturns.filter(x => !x.over)) {
    if (!here(state, t.i, t.e)) { t.over = true; t.why = 'gone'; continue; }
    if (t.ep === state.ep || !together(state, t.i, t.e) || rng() > 0.85) continue;
    t.stage++;
    const { i, e } = t, p = partnerOf(state, i);
    if (t.stage === 1) {
      const f = friendOf(state, i, [e]);
      if (!f) continue;
      const still = romance(i, e) >= 4;
      return ev('exw-stir', [i, f, e], { of: still ? 'still' : 'over', pop: pop([i, 0, 1]) });
    }
    if (t.stage === 2 && p && p !== e) {
      jealousyHit(state, p, i, e, 1.5);
      return ev('exw-partner', [p, i, e], { pop: pop([p, 0.2, 1]) });
    }
    // The talk decides it: a spark both ways, a row (someone still hurt), or closure.
    const spark = Math.min(attr(state, i, e) ?? 0, attr(state, e, i) ?? 0) / 10;
    const hurt = Math.max(res(i, e), res(e, i)) / 5;
    const of = rng() < 0.6 * spark + 0.1 ? 'spark' : rng() < 0.2 + 0.6 * hurt ? 'row' : 'closure';
    t.over = true; t.why = of;
    if (of === 'spark') {
      nudgeAttraction(state, i, e, 1); nudgeAttraction(state, e, i, 1); addBond(i, e, 0.8);
      if (p && p !== e) jealousyHit(state, p, i, e, 2, { confirmed: true });
      ev('exw-talk', [i, e], { of, pop: pop([i, 0, 1.5], [e, 0, 1.5]) }, [i, e]);
      ev('exw-back', [i, e], { pop: pop([i, 0.5, 2], [e, 0.5, 2]) }, [i, e]);
      return;
    }
    if (of === 'row') {
      addBond(i, e, -1); addRelationshipDimension(i, e, 'resentment', 0.6);
      // …and it goes to war, as exes at war do (pm/rivalry.js).
      const [d, l] = romance(i, e) >= romance(e, i) ? [i, e] : [e, i];
      (state.exFeuds ||= []).push({ d, l, h: partnerOf(state, l), x: d, y: l, feud: true, ep: state.ep, stage: 1, over: false });
      return ev('exw-talk', [i, e], { of, pop: pop([i, -0.1, 1.5], [e, -0.1, 1.5]) }, [i, e]);
    }
    nudgeAttraction(state, i, e, -1); addBond(i, e, 0.5);
    return ev('exw-talk', [i, e], { of, pop: pop([i, 0.3, 1], [e, 0.3, 1]) });
  }
  // A new one: an ex arrived from outside (the author's exes), or somebody
  // dumped came back to a villa with their old partner in it.
  const arrived = Object.entries(state.exArrived || {}).filter(([, ep]) => ep === state.ep || ep === state.ep - 1).map(([n]) => n);
  const back = Object.entries(state.returnedEp || {}).filter(([, ep]) => ep === state.ep || ep === state.ep - 1).map(([n]) => n);
  for (const e of [...arrived, ...back]) {
    if (!state.villa.includes(e)) continue;
    const exes = [
      ...(state.profiles[e]?.ex ? [state.profiles[e].ex] : []),
      ...Object.keys(state.pairedEver || {}).filter(k => k.split('|').includes(e)).map(k => k.split('|').find(n => n !== e)),
    ].filter(i => i && i !== e && state.villa.includes(i) && partnerOf(state, e) !== i);
    const i = exes[0];
    if (!i || state.exReturns.some(t => [t.i, t.e].includes(i) && [t.i, t.e].includes(e))) continue;
    state.exReturns.push({ i, e, ep: state.ep - 1, stage: 0, over: false });
  }
}
