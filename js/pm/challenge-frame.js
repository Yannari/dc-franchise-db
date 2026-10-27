// ══════════════════════════════════════════════════════════════════════
// pm/challenge-frame.js — what every challenge is around the game itself
// ══════════════════════════════════════════════════════════════════════
//
// User, 2026-10-26: "the challenges are like 20 frames, really short and
// badly written, no drama, no suspense, no consequences … challenges are
// super important in Love Island and we barely use them". Measured over 8
// seasons: 11-26 steps a challenge, and not one scene later in any episode
// caused by one. On the show the challenge is where the evening's fights
// start: Gemma licked another islander in the air-hostess challenge, Luca
// shoved her away, said he was fine, admitted later he wasn't, and stormed
// out (UK 2022); Leah picked Sammy as her "star player" in front of Jess.
//
// Every format (pm/challenges.js, challenges-more.js, lie-detector.js) plays
// its own rounds. Around them, the frame adds:
//   chal-buzz   [a, b, (x)]  after the text: what a is worried about, hoping
//                            for or up for. `of`: worried · hoping · dread · fired-up
//   chal-watch  [p, k, o]    p watches partner k kiss or pick o, in the game.
//                            `of`: fine (says so; isn't) · laughs · fuming
//   chal-prize  [w, (q)]     the winners' reward. `of`: date · party · treat
// and, for the evening (season.js puts them first in it):
//   chal-row    [p, k, o]    p brings it up. `of`: just-a-game · sorry · storm
//   chal-spark  [k, f, o]    k to a friend: that kiss did something
// Every one of them moves something: trust, jealousy, bonds, attraction, a
// graft started from the kiss, the public.
import { addBond, getBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { makeEvent, partnerOf, roomMates } from './events.js';
import { heartOf } from './just-friends.js';
import { attr, nudgeAttraction } from './chemistry.js';
import { romance } from './feelings.js';
import { emo, feel, attachment } from './emotions.js';
import { seedGraft } from './threads.js';

const STEAMY = new Set(['snogger', 'lip-service', 'suck-blow', 'girls-course', 'lads-course', 'truth-dare', 'receipts']);
const QUIZ = new Set(['knowing-me', 'tower', 'lie-detector', 'couple-goals', 'look-who', 'headlines', 'couple-of-sorts', 'grafties']);
// The moments in a game where somebody kisses or picks somebody who isn't theirs.
// (knowing-q's "who would I go for" is a reveal, not a kiss: the partner reacts in its own lines.)
const STRAY_KINDS = new Set(['game-kiss', 'course-pick', 'snogger-kiss', 'blow-dare', 'blow-slip', 'lip-race', 'receipt', 'tod-truth']);
// A format that already shows the partner's reaction: the frame adds no second one.
const OWN_REACTION = new Set(['lip-watch', 'snogger-row', 'knowing-row', 'couple-goals-row', 'lie-row', 'sports-sore']);
const WIN_KINDS = new Set(['course-win', 'sports-win', 'snogger-win', 'talent-win']);
const S = (state, n) => state.profiles[n]?.stats || {};
const st = (state, n, k) => (S(state, n)[k] ?? 5) / 10;
const pop = (...rows) => Object.fromEntries(rows.filter(r => r && r[0]).map(([n, approval, fame]) => [n, { approval, fame }]));
const ev = (state, rng, kind, players, extra, phase = 'challenge', major = []) =>
  makeEvent(state, rng, { phase, kind, players, aired: true, major, extra: { pop: {}, ...extra } });

/** Who a fancies most, other than a's own partner. */
const eyeOf = (state, a) => state.villa.filter(n => n !== a && n !== partnerOf(state, a) && roomMates(state, a).includes(n) && attr(state, a, n) != null)
  .sort((x, y) => (attr(state, a, y) ?? 0) - (attr(state, a, x) ?? 0))[0] || null;

/** Before the game: two islanders on what today could do to them. */
function buzz(state, rng, id) {
  const out = [];
  const used = new Set();
  const villa = state.villa.filter(n => !(state.split && state.casa?.includes(n)));
  const friendOf = (a, x) => villa.filter(n => n !== a && n !== x && !used.has(n) && n !== partnerOf(state, a)).sort((x2, y) => getBond(a, y) - getBond(a, x2))[0];
  const cands = [];
  for (const a of villa) {
    const p = heartOf(state, a);
    // Who a is most jealous of, in the room today.
    const j = Object.entries(emo(state, a).jealousy || {}).filter(([n]) => villa.includes(n)).sort((x, y) => y[1] - x[1])[0]?.[0] || null;
    if (STEAMY.has(id) && p && j && (emo(state, a).jealousy?.[j] || 0) > 1.5) cands.push({ a, of: 'worried', x: j, w: 2 + (emo(state, a).jealousy[j] || 0) / 3 });
    else if (STEAMY.has(id) && !p) { const x = eyeOf(state, a); if (x && (attr(state, a, x) ?? 0) >= 5) cands.push({ a, of: 'hoping', x, w: 1.5 + (attr(state, a, x) ?? 0) / 10 }); }
    else if (QUIZ.has(id) && p && romance(a, p) - romance(p, a) > 1.5) cands.push({ a, of: 'dread', x: p, w: 1 });
    else if (!STEAMY.has(id) && !QUIZ.has(id) && st(state, a, 'boldness') >= 0.7) cands.push({ a, of: 'fired-up', x: null, w: 1 });
  }
  for (const c of cands.sort((x, y) => y.w - x.w + (rng() - 0.5)).slice(0, 2)) {
    if (used.has(c.a)) continue;
    const f = friendOf(c.a, c.x);
    if (!f) continue;
    used.add(c.a); used.add(f);
    if (c.of === 'worried') feel(state, c.a, 'stress', 0.4);
    if (c.of === 'hoping') nudgeAttraction(state, c.a, c.x, 0.2);
    out.push(ev(state, rng, 'chal-buzz', c.x ? [c.a, f, c.x] : [c.a, f], { of: c.of, game: id, pop: pop([c.a, 0, 0.4]) }));
  }
  return out;
}

/** During: after each kiss or pick of somebody else's, the face of the one it belongs to. */
function watches(state, rng, id, events) {
  const out = [];
  const pending = [];
  const reacted = new Set(events.filter(e => OWN_REACTION.has(e.kind)).flatMap(e => e.players));
  let n = 0;
  for (const e of events) {
    out.push(e);
    if (!STRAY_KINDS.has(e.kind) || e.extra?.of === 'partner' || n >= 3) continue;
    const [k, o] = e.players;
    if (!k || !o) continue;
    for (const [kk, oo] of [[k, o], [o, k]]) {
      const p = heartOf(state, kk);
      if (!p || p === oo || reacted.has(p) || !state.villa.includes(p) || e.players.includes(p) && e.kind !== 'receipt') continue;
      if (!roomMates(state, kk).includes(p)) continue;
      reacted.add(p); n++;
      // How it's taken is the watcher's own: the secure laugh, the hot-headed
      // fume, and most say they're fine and aren't (Luca, 2022).
      const temper = st(state, p, 'temperament'), anx = attachment(state.profiles[p]).anxiety;
      const heat = ((attr(state, kk, oo) ?? 0) + (attr(state, oo, kk) ?? 0)) / 20;
      const r = rng();
      const of = r < (1 - temper) * 0.45 + 0.1 * heat ? 'fuming' : r < 0.55 + 0.3 * anx ? 'fine' : 'laughs';
      if (of === 'fuming') { addBond(p, kk, -0.5); addBond(p, oo, -0.6); feel(state, p, 'stress', 0.8); }
      if (of === 'fine') { feel(state, p, 'stress', 0.6); addRelationshipDimension(p, kk, 'trust', -0.3); }
      if (of === 'laughs') { feel(state, p, 'security', 0.3); }
      out.push(ev(state, rng, 'chal-watch', [p, kk, oo], { of, game: id, pop: pop([p, of === 'laughs' ? 0.4 : of === 'fuming' ? -0.1 : 0.2, 1]) }, 'challenge', of === 'fuming' ? [p] : []));
      pending.push({ p, k: kk, o: oo, of, heat });
      break;
    }
  }
  return { out, pending };
}

/** After: the prize, as the show gives one (a party, a date, a treat). */
function prize(state, rng, id, events) {
  const win = events.find(e => WIN_KINDS.has(e.kind) || (e.kind === 'blind-run' && e.extra?.of === 'win'));
  if (!win) return [];
  const w = win.players[0];
  const q = partnerOf(state, w);
  const of = q ? (rng() < 0.6 ? 'date' : 'treat') : 'party';
  if (q) { addBond(w, q, 0.6); feel(state, w, 'security', 0.6); feel(state, q, 'security', 0.6); }
  else for (const n of state.villa) if (n !== w && getBond(w, n) > 1) addBond(w, n, 0.2);
  return [ev(state, rng, 'chal-prize', q ? [w, q] : [w], { of, game: id, pop: pop([w, 0.3, 1], q ? [q, 0.2, 0.6] : null) })];
}

/** The evening: what the game left behind. Played first in the evening (season.js). */
function fallout(state, rng, id, pending) {
  const out = [];
  for (const x of pending.slice(0, 2)) {
    const { p, k, o, of, heat } = x;
    if (!state.villa.includes(p) || !state.villa.includes(k) || heartOf(state, p) !== k) continue;
    // "I'm fine" is the one that comes back at night; a laugh only when it was a real kiss.
    const rowP = of === 'fine' ? 0.75 : of === 'fuming' ? 0.9 : 0.15 + 0.4 * heat;
    if (rng() < rowP) {
      const S2 = S(state, k);
      const r = rng();
      const ans = of === 'fuming' && r < 0.35 ? 'storm' : r < ((S2.loyalty ?? 5) + (S2.temperament ?? 5)) / 25 ? 'sorry' : 'just-a-game';
      if (ans === 'sorry') { addRelationshipDimension(p, k, 'trust', 0.4); addBond(p, k, 0.3); feel(state, p, 'stress', -0.4); }
      if (ans === 'just-a-game') { addRelationshipDimension(p, k, 'trust', -0.4); addBond(p, k, -0.4); }
      if (ans === 'storm') { addBond(p, k, -0.8); feel(state, p, 'stress', 0.8); addRelationshipDimension(p, k, 'resentment', 0.6); }
      out.push(ev(state, rng, 'chal-row', [p, k, o], { of: ans, watched: of, game: id,
        pop: pop([p, 0.4, 1.5], [k, ans === 'sorry' ? 0.3 : ans === 'storm' ? -0.4 : -0.6, 1.5]) }, 'evening', [p, k]));
    }
    // …and the kiss did something to the one who gave it.
    if (rng() < 0.25 + heat && (attr(state, k, o) ?? 0) >= romance(k, p) - 1) {
      const f = state.villa.filter(n => n !== k && n !== o && n !== p && roomMates(state, k).includes(n)).sort((a, b) => getBond(k, b) - getBond(k, a))[0];
      if (!f) continue;
      nudgeAttraction(state, k, o, 0.6);
      const started = seedGraft(state, k, o);
      out.push(ev(state, rng, 'chal-spark', [k, f, o], { game: id, started, pop: pop([k, -0.2, 1]) }, 'evening'));
    }
  }
  return out;
}

/** Wrap a format's own rounds in the challenge's day: returns { during, evening }. */
export function frameChallenge(state, rng, id, events) {
  const before = buzz(state, rng, id);
  const { out, pending } = watches(state, rng, id, events);
  const after = prize(state, rng, id, events);
  return { before, during: [...out, ...after], evening: fallout(state, rng, id, pending) };
}
