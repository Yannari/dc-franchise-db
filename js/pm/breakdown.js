// ══════════════════════════════════════════════════════════════════════
// pm/breakdown.js — when it gets too much, and who comes
// ══════════════════════════════════════════════════════════════════════
//
// User: "crying breakdowns — heartbreak is tracked, but nobody breaks down on
// screen". The villa's feelings (pm/emotions.js) already hold the weight:
// heartbreak, stress, loneliness, guilt, jealousy. When it gets too much — in
// proportion to all of it, held back by temperament and security — an
// islander breaks down, and the scene is WHO COMES: friends first, a partner
// (unless the partner is the reason), sometimes somebody nobody expected.
// Who does not come is remembered too.
//
//   breakdown  [a]        a breaks down. `of` is why: heartbreak · stress ·
//                         lonely · guilt · jealousy · homesick
//   comfort    [a, b]     a comes and sits with b. `of`: friend · partner ·
//                         unexpected (a and b were on opposite sides of a feud)
//   no-show    [a, b]     b's partner a never came. Said later, to a's face.
import { addBond, getBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf } from './events.js';
import { emo, feel, attachment } from './emotions.js';
import { romance } from './feelings.js';
import { players } from '../core.js';

const COOLDOWN = 2;          // episodes between one islander's breakdowns

// Who is prone to it (user: "some people are more prone to a breakdown —
// some archetypes, and whether they really loved the person — but it's all
// probability"). Each one scales the chance; none of them decides it.
const PERSONA_PRONE = { 'hopeless-romantic': 1.3, wallflower: 1.2, messy: 1.15, 'girls-girl': 1.05, 'villa-clown': 0.95,
  checklist: 0.95, bombshell: 0.9, 'game-player': 0.7, fuckboy: 0.75 };
// Villains keep it in (and cry, if they do, where no camera is); the ones who
// give everything feel it most.
const ARCH_PRONE = { villain: 0.7, mastermind: 0.7, schemer: 0.75, 'challenge-beast': 0.85, hero: 0.95, floater: 1,
  hothead: 1.1, 'loyal-soldier': 1.15, underdog: 1.15, showmancer: 1.2, 'social-butterfly': 1.05, goat: 1.05 };
export function proneness(state, a) {
  const prof = state.profiles[a];
  const att = prof ? attachment(prof) : { anxiety: 0, avoidance: 0 };
  const arch = players.find(p => p.name === a)?.archetype;
  return (1 + 0.5 * att.anxiety - 0.35 * att.avoidance) * (PERSONA_PRONE[prof?.persona] ?? 1) * (ARCH_PRONE[arch] ?? 1);
}

function causeOf(state, a) {
  const e = emo(state, a);
  const jea = Math.max(0, ...Object.values(e.jealousy || {}));
  // Heartbreak and guilt lead (measured: stress at full weight was the cause
  // of 16 breakdowns in 19 — it builds all season and drowned the rest).
  const parts = [['heartbreak', e.heartbreak * 2], ['stress', e.stress * 0.45], ['lonely', e.loneliness * 0.9],
    ['guilt', e.guilt * 1.3], ['jealousy', jea * 0.9]];
  // Homesick: somebody lonely and low who has been in the villa a long time.
  const days = state.ep - (state.ledger?.firstEp?.[a] ?? state.ep);
  if (days >= 5) parts.push(['homesick', 0.5 * e.loneliness + 0.4 * (10 - e.security) / 2]);
  return parts.sort((x, y) => y[1] - x[1])[0];
}

/** At most one breakdown an episode; never at the final or the reunion. */
export function breakdowns(state, rng, entry = null) {
  if (entry && (entry.moment === 'final' || entry.moment === 'reunion')) return [];
  const last = state.lastBreakdown ||= {};
  const cands = [];
  for (const a of state.villa) {
    if (last[a] != null && state.ep - last[a] <= COOLDOWN) continue;
    const e = emo(state, a);
    const [cause, weight] = causeOf(state, a);
    const temper = state.profiles[a]?.stats?.temperament ?? 5;
    // Heartbreak weighs by how much they loved the one who caused it.
    const loved = e.heartbreakFrom ? 0.6 + 0.8 * Math.max(0, romance(a, e.heartbreakFrom)) / 10 : 1;
    const load = 1.3 * e.heartbreak * loved + 0.6 * e.stress + 0.6 * e.loneliness + 0.9 * e.guilt;
    // In proportion to the load and who they are, held back by a steady
    // temper and feeling safe.
    // (The user's call: "one or two every four episodes", with crying that
    // is not a breakdown more common — every dumping, Casa return and Movie
    // Night already has someone in tears in its own scene, ~20 a season.
    // Measured ~4.6 a season: almost none in the first four episodes, then
    // 0.7 / 2.1 / 1.7 per block of four as feelings build. The real show's
    // big ones run six to ten a series — UK 5's Amber, Anna, Amy, Yewande.)
    const p = Math.max(0, Math.min(0.6, (load - 2.6) / 9.5 * (1.3 - temper / 10) * (1.2 - e.security / 12) * proneness(state, a)));
    if (p > 0 && weight > 0) cands.push({ a, cause, p, load });
  }
  cands.sort((x, y) => y.load - x.load);
  const pick = cands.find(c => rng() < c.p);
  if (!pick) return [];
  last[pick.a] = state.ep;
  return scene(state, rng, pick);
}

function scene(state, rng, { a, cause }) {
  const out = [];
  const ev = (kind, players, extra, major = []) => {
    const e = makeEvent(state, rng, { phase: 'breakdown', kind, players, aired: true, major, extra: { pop: {}, ...extra } });
    out.push(e); return e;
  };
  const e = emo(state, a);
  const reason = e.heartbreakFrom || null;
  ev('breakdown', [a], { of: cause, pop: { [a]: { approval: 1.5, fame: 2.5 } } }, [a]);

  // Who comes: the closest first — by what they feel for a, and whether they
  // are the kind to go (loyalty). A partner comes unless they are the reason.
  const S = n => state.profiles[n]?.stats || {};
  const pa = partnerOf(state, a);
  const g = n => state.profiles[n]?.gender;
  const feud = (state.feuds || []).find(f => !f.over && (f.A.includes(a) || f.B.includes(a)));
  const enemy = feud ? (feud.A.includes(a) ? feud.B : feud.A).filter(n => n !== a && state.villa.includes(n)) : [];
  const pull = n => getBond(n, a) + 3 * (S(n).loyalty ?? 5) / 10 + (g(n) === g(a) ? 1 : 0) + (rng() - 0.5) * 2;
  const others = state.villa.filter(n => n !== a && n !== pa);
  const friends = others.filter(n => getBond(n, a) > 1).sort((x, y) => pull(y) - pull(x)).slice(0, 2);
  const comers = [...friends];
  const partnerComes = pa && pa !== reason && rng() < 0.35 + 0.5 * Math.max(0, getBond(pa, a)) / 10 + 0.2 * (S(pa).loyalty ?? 5) / 10;
  if (partnerComes) comers.push(pa);
  // Somebody from the other side of a feud, now and then — kindness, or guilt.
  const ally = enemy.length && rng() < 0.18 ? enemy.sort((x, y) => (S(y).loyalty ?? 5) - (S(x).loyalty ?? 5))[0] : null;
  if (ally && !comers.includes(ally)) comers.push(ally);

  for (const c of comers) {
    const of = c === pa ? 'partner' : c === ally ? 'unexpected' : 'friend';
    addBond(c, a, of === 'unexpected' ? 1.6 : 0.9);
    addRelationshipDimension(a, c, 'trust', 0.6);
    feel(state, a, 'stress', -0.8); feel(state, a, 'loneliness', -0.8);
    if (cause === 'heartbreak') feel(state, a, 'heartbreak', -0.5);
    if (of === 'partner') feel(state, a, 'security', 1);
    // An ally from the other camp can end the feud there and then.
    if (of === 'unexpected' && feud) { feud.over = true; addBond(a, c, 1); }
    ev('comfort', [c, a], { of, pop: { [c]: { approval: of === 'unexpected' ? 1.5 : 0.6, fame: 1 } } }, of === 'unexpected' ? [c] : []);
  }
  // Nobody came at all: that is its own scene, and it hurts.
  if (!comers.length) feel(state, a, 'loneliness', 1);
  // The partner who stayed away: remembered, and said to their face.
  if (pa && !partnerComes && pa !== reason) {
    addRelationshipDimension(a, pa, 'resentment', 0.8); feel(state, a, 'security', -1);
    ev('no-show', [pa, a], { pop: { [pa]: { approval: -1, fame: 1 } } });
  }
  return out;
}
