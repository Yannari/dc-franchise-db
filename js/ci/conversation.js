// ══════════════════════════════════════════════════════════════════════
// ci/conversation.js — one private chat, from outcome to consequence (spec §7.4)
// ══════════════════════════════════════════════════════════════════════
//
// ORDER MATTERS. 1) the ending is decided, 2) its effects are applied, 3) the
// turns are laid out (each carrying the ending's tone) and slips are rolled,
// 4) the intent's own consequence (a pact, a claim, a reveal), 5) gossip on a
// warm chat. Plan 2 writes words FROM this record, so a scene can never say
// one thing while the numbers did another.
import { isPair, leadFor } from './shared.js';
import { rel, bump, S, clamp, addScene, makePact } from './state.js';
import { belief, nudgeBelief } from './beliefs.js';
import { feel, mood } from './mind.js';
import { makeClaim, learn, passOnWeight, contradictions } from './claims.js';
import { rollSlips, probe } from './slips.js';
import { revealTo } from './reveal.js';
import { attractionOk, performedFlirt, ageFit } from './chat.js';
import { coverParts } from './cover.js';
import { streamFor } from '../dr/rng.js';
import { noteFlirt, coupleFlirt } from './twotiming.js';

// What the receiver comes to feel toward the sender, by intent and ending.
// How often a warm chat between close players goes deep, at most.
export const DEEP_MAX = 0.6;
const DEEP_INTENTS = new Set(['bond', 'flirt', 'ally', 'checkin', 'repair', 'confess', 'jealous']);

export const EFFECT = {
  bond:     { warm: { affection: 1.2, trust: 0.6 }, neutral: { affection: 0.4 }, cold: { affection: -0.4 } },
  ally:     { warm: { trust: 1.5, affection: 0.6, obligation: 0.8 }, neutral: { trust: 0.3 }, cold: { trust: -0.6 } },
  flirt:    { warm: { attraction: 1.2, affection: 0.8 }, neutral: { affection: 0.2 }, cold: { attraction: -0.8 } },
  probe:    { warm: { trust: 0.3 }, neutral: {}, cold: { resentment: 0.8, trust: -0.8 } },
  pump:     { warm: { trust: 0.4 }, neutral: {}, cold: { trust: -0.3 } },
  compare:  { warm: { trust: 1.0 }, neutral: { trust: 0.3 }, cold: {} },
  plant:    { warm: { trust: 0.6 }, neutral: {}, cold: { trust: -0.5 } },
  credit:   { warm: { affection: 0.6 }, neutral: {}, cold: { trust: -0.6 } },
  repair:   { warm: { affection: 1.0, resentment: -1.5, trust: 0.8 }, neutral: { resentment: -0.5 }, cold: { resentment: 0.5 } },
  confront: { warm: { resentment: -1.0 }, neutral: { resentment: 0.3 }, cold: { resentment: 1.5, affection: -1.0 } },
  checkin:  { warm: { affection: 1.2, trust: 0.8 }, neutral: { affection: 0.4 }, cold: {} },
  pitch:    { warm: { trust: 0.8, obligation: 0.6 }, neutral: {}, cold: { trust: -0.3 } },
  confess:  { warm: { trust: 1.0 }, neutral: { trust: -0.5 }, cold: { trust: -2, resentment: 1.5 } },
  // "Saw you and {c} last night." Warm: the crush is touched they cared.
  // Cold: "you don't own me".
  jealous:  { warm: { affection: 0.6, attraction: 0.5 }, neutral: {}, cold: { affection: -0.6, resentment: 0.6 } },
  // "You don't believe what Kitty said, right?" Believed: closer. Not: they
  // keep their distance (the doubt itself is moved in RUN).
  defend:   { warm: { trust: 0.8, affection: 0.3 }, neutral: {}, cold: { trust: -0.6 } },
  // Talking over what happened: the people you compare notes with are the
  // people you end up trusting (and who you fall out with when you disagree).
  debrief:  { warm: { trust: 0.9, affection: 0.4 }, neutral: { trust: 0.2 }, cold: { trust: -0.4, resentment: 0.3 } },
};
const FIT = { bond: 0.3, checkin: 0.4, ally: 0.1, pitch: 0, repair: 0.1, credit: 0.1, compare: 0.1,
  plant: 0.1, pump: 0, confess: 0, probe: -0.2, confront: -0.3, defend: 0, debrief: 0.2 };
// How much the listener's own feelings about the person discussed decide the
// chat: you do not agree to doubt your friend, or to defend your rival.
export const SIDE_TAKEN = 1 / 15;
const WARMING = new Set(['bond', 'checkin', 'flirt', 'ally']);
// The hyperpersonal effect (spec 5.3) at its strongest: a catfish picked a
// whole face to be liked, and a good chat shows it. EARNED, not given to the
// type: the bonus grows with the person's people skills (social) and with how
// close the persona sits to them (ci/cover.js: style, age, smarts). A
// charming catfish playing someone like themselves gets most of it; a clumsy
// one playing somebody far away gets next to none, and slips more too.
// Without any of it catfish reached the final as often as honest players and
// lost it (win given final 11% vs 25%, 60 seasons; the real show: 5 of 10).
export const CURATED_MAX = 1.25;
// How much harder a performed flirt is to keep up (slip risk's `specific`).
export const PERFORMED_STRAIN = 0.7;
export function curatedFor(state, h) {
  if (state.profiles[h]?.mode !== 'catfish') return 0;
  const p = coverParts(state, h);
  const fit = 1 / (1 + p.style + p.age + p.smarts);
  return CURATED_MAX * (S(state, h, 'social') / 10) * fit;
}
const LIKED = new Set(['affection', 'attraction']);
const toward = (state, h, dim, v) => (v > 0 && LIKED.has(dim) ? v * (1 + curatedFor(state, h)) : v);
// A flirt that lands grows the crush only as far as the ages fit (chat.js ageFit).
const grows = (state, to, from, dim, v) => (dim === 'attraction' && v > 0 ? v * ageFit(state, to, from) : v);

export function reception(state, to, from, intent, sc = null) {
  const base = (rel(to, from, 'affection') + rel(to, from, 'trust')) / 20
    + (sc ? sideTaken(state, to, from, intent, sc.data) : 0);
  const fit = intent === 'flirt' || intent === 'jealous'
    ? (attractionOk(state, to, from) ? rel(to, from, 'attraction') / 10 - 0.2 : -0.6)
    : FIT[intent] ?? 0;
  return base + fit + mood(state, to, 'loneliness') / 20;
}

export function decideEnding(rng, rec) {
  const pWarm = clamp(0.35 + 0.45 * rec, 0.05, 0.9);
  const pCold = clamp(0.2 - 0.35 * rec, 0.03, 0.7);
  const r = rng();
  return r < pWarm ? 'warm' : r < pWarm + pCold ? 'cold' : 'neutral';
}

function applyEffect(state, from, to, intent, ending) {
  const e = EFFECT[intent][ending];
  for (const [dim, v] of Object.entries(e)) bump(to, from, dim, grows(state, to, from, dim, toward(state, from, dim, v)));
  if (ending !== 'cold') for (const dim of ['affection', 'trust']) if (e[dim] > 0) bump(from, to, dim, toward(state, to, dim, e[dim] * 0.6));
  if (ending === 'warm' && WARMING.has(intent)) {
    for (const [a, b] of [[from, to], [to, from]]) { const row = (state.ideal[a] ||= {}); row[b] = (row[b] || 0) + 0.4; }
    feel(state, from, 'loneliness', -1.5);
    feel(state, to, 'loneliness', -1.5);
  }
  if (ending === 'cold') feel(state, from, 'stress', 0.8);
}

const RUN = {
  ally(state, rng, sc, from, to, ending) { if (ending === 'warm') sc.data.pact = makePact(state, 'protect', from, to); },
  pitch(state, rng, sc, from, to, ending) { if (ending === 'warm') sc.data.pact = makePact(state, 'rate', from, to); },
  pump(state, rng, sc, from, to, ending) {
    if (ending === 'cold') return;
    const best = state.claims.filter(c => state.know[to]?.[c.id] && !state.know[from]?.[c.id])
      .map(c => [c, passOnWeight(state, to, c, from)]).sort((a, b) => b[1] - a[1])[0];
    if (best && rng() < best[1]) { learn(state, from, best[0], to, sc); sc.data.claims.push(best[0].id); }
  },
  plant(state, rng, sc, from, to, ending, ctx) {
    const rival = ctx.rivalOf?.[from];
    if (!rival || rival === to) return;
    const c = belief(state, from, rival).real < 0.5
      ? makeClaim(state, { kind: 'catfish', holder: from, about: rival, truth: state.profiles[rival].mode === 'catfish', by: from, to })
      : makeClaim(state, { kind: 'distrusts', holder: rival, about: to, truth: rel(rival, to, 'trust') < 0, by: from, to });
    sc.data.claims.push(c.id);
    if (ending !== 'cold') learn(state, to, c, from, sc);
  },
  credit(state, rng, sc, from, to, ending, ctx) {
    const c = makeClaim(state, { kind: 'saved', holder: from, about: to,
      truth: !!ctx.protectedBy?.[to]?.includes(from), by: from, to });
    sc.data.claims.push(c.id);
    learn(state, to, c, from, sc);
  },
  compare(state, rng, sc, from, to) {
    const pair = contradictions(state, from).find(({ a, b }) =>
      a.origin.by === to || b.origin.by === to || state.know[to]?.[a.id] || state.know[to]?.[b.id]);
    if (!pair) return;
    for (const c of [pair.a, pair.b]) if (!state.know[to]?.[c.id]) learn(state, to, c, from, sc);
    const solve = (S(state, from, 'intuition') + S(state, to, 'intuition')) / 20;
    if (rng() >= solve) return;
    const liar = [pair.a, pair.b].find(c => !c.truth)?.origin.by;
    if (!liar || liar === from || liar === to) return;
    for (const x of [from, to]) { bump(x, liar, 'trust', -3); bump(x, liar, 'resentment', 2); }
    sc.data.exposed = liar;
  },
  confess(state, rng, sc, from, to) {
    revealTo(state, to, from, sc);
    feel(state, from, 'guilt', -3);
    sc.data.confessed = true;
  },
  confront(state, rng, sc, from, to, ending) { if (ending === 'cold') bump(from, to, 'resentment', 0.8); },
  // Asking the crush about the flirting they watched (party.js jealous).
  // Reassured: the sting eases, the rival matters less. Brushed off: it
  // stays. Told off: they cool on the crush, and it costs them.
  // The accused, setting it straight. Believed: the doubt eases (a catfish
  // warning loses its grip, a "don't trust them" loses its edge). Not: it
  // reads as protesting too much.
  defend(state, rng, sc, from, to, ending) {
    const catfishy = sc.data.kind === 'catfish';
    if (ending === 'warm') {
      if (catfishy) nudgeBelief(state, to, from, 'real', 0.12, sc);
      else nudgeBelief(state, to, from, 'threat', -0.6, sc);
      feel(state, from, 'paranoia', -0.8);
    } else if (ending === 'cold') {
      if (catfishy) nudgeBelief(state, to, from, 'real', -0.06, sc);
      nudgeBelief(state, to, from, 'threat', 0.4, sc);
      feel(state, from, 'paranoia', 0.6);
    }
  },
  // Comparing notes on what they both saw. A warning: the listener comes
  // round to the speaker's read (warm) or digs in (cold). The ratings: the
  // one on top is the one to watch. A blocking: whoever holds the power
  // tonight is who they watch.
  debrief(state, rng, sc, from, to, ending, ctx) {
    const { topic, about, stance } = sc.data;
    if (!about || ending === 'neutral') return;
    if (topic === 'warning') {
      const sign = (stance === 'agree' ? 1 : -1) * (ending === 'warm' ? 1 : -0.5);
      if (sc.data.kind === 'catfish') nudgeBelief(state, to, about, 'real', -0.08 * sign, sc);
      else { bump(to, about, 'trust', -0.6 * sign); nudgeBelief(state, to, about, 'threat', 0.4 * sign, sc); }
    } else if (topic === 'ratings') {
      if (ending === 'warm') for (const x of [from, to]) nudgeBelief(state, x, about, 'threat', 0.5, sc);
      else bump(to, from, 'resentment', 0.3);
    } else if (topic === 'blocked' && ending === 'warm') {
      for (const i of ctx.powerHolders || []) if (i !== from && i !== to) for (const x of [from, to]) nudgeBelief(state, x, i, 'threat', 0.3, sc);
      for (const x of [from, to]) bump(x, x === from ? to : from, 'obligation', 0.3);
    }
  },
  jealous(state, rng, sc, from, to, ending, ctx) {
    const rival = ctx.jealousOf?.[from]?.rival;
    sc.data.rival = rival || null;
    if (ending === 'warm') { feel(state, from, 'stress', -0.8); if (rival) bump(from, rival, 'resentment', -0.4); }
    if (ending === 'neutral') feel(state, from, 'paranoia', 0.4);
    if (ending === 'cold') { bump(from, to, 'attraction', -0.8); feel(state, from, 'stress', 0.6); }
  },
};

/** How the listener's own view of who is being discussed tilts the chat. */
function sideTaken(state, to, from, intent, d) {
  if (intent === 'defend') {
    // Defending yourself lands with someone who never bought the warning.
    return (belief(state, to, from).real - 0.6) + (rel(to, d.about, 'affection') < 0 ? 0.15 : 0);
  }
  if (intent !== 'debrief' || !d.about) return 0;
  const feel = rel(to, d.about, 'affection') - rel(to, d.about, 'resentment');
  // Agreeing that someone is a problem: harder the more the listener likes them.
  if (d.topic === 'warning') return (d.stance === 'agree' ? -feel : feel) * SIDE_TAKEN;
  if (d.topic === 'ratings') return -feel * SIDE_TAKEN;
  // Missing the one who was blocked: easy to share with someone who misses them too.
  return feel * SIDE_TAKEN * 0.5;
}

/** On a warm chat each side may pass on the juiciest thing the other hasn't heard. */
function gossip(state, rng, sc, from, to) {
  for (const [x, y] of [[from, to], [to, from]]) {
    const pick = state.claims.filter(c => state.know[x]?.[c.id] && !state.know[y]?.[c.id])
      .map(c => [c, passOnWeight(state, x, c, y)]).sort((a, b) => b[1] - a[1])[0];
    if (pick && rng() < pick[1] * 0.5) { learn(state, y, pick[0], x, sc); sc.data.claims.push(pick[0].id); }
  }
}

export function runChat(state, rng, plan, ctx = {}) {
  const { from, to, intent } = plan;
  const sc = addScene(state, 'chat', [from, to], { intent, ending: null, turns: [], claims: [], pact: null });
  // What a morning-after chat is about (chat.js debriefTopic, ctx.accused).
  if (intent === 'defend') { sc.data.about = plan.about || null; sc.data.kind = ctx.accused?.[from]?.kind || null; }
  if (intent === 'debrief') {
    sc.data.topic = plan.topic; sc.data.about = plan.about;
    if (plan.topic === 'warning') {
      const t = (ctx.topics || []).find(x => x.topic === 'warning' && x.about === plan.about);
      sc.data.kind = t?.kind || null;
      // Whether the one who opens the chat buys the warning.
      const doubt = sc.data.kind === 'catfish' ? 1 - belief(state, from, plan.about).real : -rel(from, plan.about, 'trust') / 10 + 0.3;
      sc.data.stance = doubt + rel(from, plan.about, 'resentment') / 20 > 0.35 ? 'agree' : 'doubt';
    }
  }
  if (isPair(state, from)) sc.data.lead = leadFor(state, from, intent, rng);
  let ending;
  if (intent === 'probe') {
    const r = probe(state, rng, from, to, sc);
    ending = r === 'pass' ? 'warm' : r === 'dodge' ? 'neutral' : 'cold';
  } else {
    ending = decideEnding(rng, reception(state, to, from, intent, sc));
  }
  // A couple sharing a profile: the other one has a say in a flirty message (twotiming.js).
  ending = coupleFlirt(state, streamFor(state.seed, `couple:${sc.id}`), sc, ending);
  sc.data.ending = ending;
  // A catfish flirting in character with no attraction behind it: an act,
  // harder to keep up (more slips) and it weighs on them.
  if (intent === 'flirt' && performedFlirt(state, from, to)) { sc.data.performed = true; feel(state, from, 'guilt', 0.3); }
  applyEffect(state, from, to, intent, ending);
  // A warm chat between two people already close can go deep (home, why
  // they're here): as likely as they are close, and it brings them closer.
  if (ending === 'warm' && DEEP_INTENTS.has(intent)) {
    const close = (rel(from, to, 'affection') + rel(to, from, 'affection')) / 20;
    if (streamFor(state.seed, `deep:${sc.id}`)() < clamp(close - 0.15, 0, DEEP_MAX)) {
      sc.data.deep = true;
      for (const [x, y] of [[from, to], [to, from]]) { bump(x, y, 'affection', 0.6); bump(x, y, 'trust', 0.5); feel(state, x, 'loneliness', -1); }
    }
  }
  const turns = 2 + Math.floor(rng() * 5);
  for (let i = 0; i < turns; i++) {
    const speaker = i % 2 === 0 ? from : to;
    const listener = speaker === from ? to : from;
    sc.data.turns.push({ from: speaker, tone: ending });
    rollSlips(state, rng, speaker, [listener],
      { specific: (intent === 'probe' ? 1 : 0.3) + (sc.data.performed && speaker === from ? PERFORMED_STRAIN : 0),
        party: !!ctx.party, attention: 0.6 }, sc);
  }
  RUN[intent]?.(state, rng, sc, from, to, ending, ctx);
  // A romance on the go, and a line maybe sent before (twotiming.js); its own dice.
  noteFlirt(state, streamFor(state.seed, `fling:${sc.id}`), sc);
  if (ending === 'warm') gossip(state, rng, sc, from, to);
  return sc;
}
