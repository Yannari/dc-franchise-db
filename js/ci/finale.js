// ══════════════════════════════════════════════════════════════════════
// ci/finale.js — the last day, the meeting, finale night (spec §15)
// ══════════════════════════════════════════════════════════════════════
//
// The real show (the-circle.fandom.com: "A Winner is Crowned", "The Last
// Rating", the Finale pages; US 1-7):
//   the last day   the finalists wake up knowing it is the end; messages
//                  from home or from blocked friends; one last Circle Chat;
//                  the final ratings, the ones that decide the winner.
//   the meeting    they leave their apartments for good and meet face to
//                  face for the first time, all in one room, one by one.
//   finale night   the host talks with the blocked players, then reveals
//                  the final ratings from last place to first; the winner
//                  takes the prize; the fans' favourite gets theirs.
//
// User (2026-10-04): "the final is really mid ... they only react to the last
// arrival, not between each other ... fun, drama, sadness, understanding ...
// no last apartment moment, no last chat"; "the final board should have more
// suspense"; "real reaction to their final placement"; "real speech moment
// for the winner". Every moment here is a record with consequences: a talk at
// the meeting moves how two people leave the show (ledger-record.js reads
// it), a placement lands against what they expected.
//
// A tie goes to whoever had the most first places across the whole season
// (UK 3: Natalya over Manrika).
import { addScene, peopleOf, rel, bump, S, clamp } from './state.js';
import { revealTo } from './reveal.js';
import { runCircleChat } from './feed.js';
import { runRating } from './ratings.js';
import { belief } from './beliefs.js';
import { feel } from './mind.js';
import { kinBetween, TENSE } from './kin.js';
import { attractionOk } from './chat.js';

const fake = (state, h) => state.profiles[h]?.mode === 'catfish';

// ── The last day ─────────────────────────────────────────────────────
/** The last morning (season.js, at the start of the final day): waking up a finalist, messages. */
export function finalMorning(state, rng) {
  const finalists = [...state.active];
  // Waking up a finalist: each alone, looking back at the person who got them here.
  for (const h of finalists) {
    const friend = state.active.concat(state.blocked.map(b => b.handle)).filter(o => o !== h)
      .sort((x, y) => rel(h, y, 'affection') - rel(h, x, 'affection'))[0];
    addScene(state, 'life', [h], { habit: 'final', event: 'final.morning', about: rel(h, friend, 'affection') > 3 ? friend : null }, [h]);
    feel(state, h, 'elation', 1.5);
  }
  // A message for some of them: from a blocked friend if they have one, else from home.
  const blocked = [...new Set(state.blocked.map(b => b.handle))].filter(b => !state.active.includes(b));
  for (const h of finalists.map(x => [x, rng()]).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([x]) => x)) {
    const from = blocked.filter(b => rel(b, h, 'affection') > 3).sort((x, y) => rel(y, h, 'affection') - rel(x, h, 'affection'))[0] || null;
    addScene(state, 'home-video', [h], { final: true, from }, [h]);
    feel(state, h, 'loneliness', -1.5); feel(state, h, 'elation', 1);
  }
}

/** The end of the final day: the last Circle Chat, then the final ratings. */
export function finalDay(state, rng) {
  runCircleChat(state, rng, { final: true, when: 'evening' });
  return runRating(state, rng, { final: true });
}

export function placementsOf(state, finalRow) {
  return [...finalRow.results]
    .sort((a, b) => a.avg - b.avg
      || (state.firstPlaces[b.profile] || 0) - (state.firstPlaces[a.profile] || 0)
      || (a.profile < b.profile ? -1 : 1))
    .map((r, i) => ({ profile: r.profile, people: [...peopleOf(state, r.profile)], place: i + 1, avg: r.avg }));
}

// ── The meeting ──────────────────────────────────────────────────────
// Who two people are to each other, the strongest thing first: what they talk
// about when they finally meet. Every kind moves something.
export function talkKind(state, x, y) {
  const k = kinBetween(state, x, y);
  if (k) return { kind: TENSE.has(k.kin) ? 'kin.tense' : 'kin' };
  const catfishOf = fake(state, y) ? y : fake(state, x) ? x : null;
  const aff = Math.min(rel(x, y, 'affection'), rel(y, x, 'affection'));
  if (catfishOf && aff > 3) return { kind: 'catfishfriend', catfish: catfishOf };
  // Somebody who called it, or got it wrong.
  if (belief(state, x, y).real < 0.4) return { kind: fake(state, y) ? 'knewit' : 'wrongsuspect', who: x, about: y };
  if (belief(state, y, x).real < 0.4) return { kind: fake(state, x) ? 'knewit' : 'wrongsuspect', who: y, about: x };
  if (attractionOk(state, x, y) && attractionOk(state, y, x) && rel(x, y, 'attraction') >= 4 && rel(y, x, 'attraction') >= 4) return { kind: 'flirt' };
  if (Math.max(rel(x, y, 'resentment'), rel(y, x, 'resentment')) >= 2.5) return { kind: 'rival' };
  if (aff >= 5 || state.pacts.some(p => [p.a, p.b].sort().join('|') === [x, y].sort().join('|'))) return { kind: 'ally' };
  return null;
}
const WEIGHT = { kin: 6, 'kin.tense': 5, catfishfriend: 5, flirt: 4, rival: 4, knewit: 3, wrongsuspect: 3, ally: 2 };

/** What happens when they talk: decided here, and it stays with them. */
function settleTalk(state, rng, t, x, y) {
  const both = f => { f(x, y); f(y, x); };
  switch (t.kind) {
    case 'catfishfriend': {
      // A friend meets the catfish: understanding, or hurt. The closer and calmer, the likelier to forgive.
      const friend = t.catfish === x ? y : x;
      const p = clamp(0.35 + rel(friend, t.catfish, 'affection') / 20 + S(state, friend, 'temperament') / 25, 0.15, 0.9);
      t.outcome = rng() < p ? 'forgive' : 'hurt';
      if (t.outcome === 'forgive') both((a, b) => bump(a, b, 'affection', 1.2));
      else { bump(friend, t.catfish, 'trust', -2); bump(friend, t.catfish, 'resentment', 1.5); }
      break;
    }
    case 'flirt': {
      // In person: the spark holds, or it was the screen. A catfish whose real self is not who they flirted with: awkward.
      const mismatch = (fake(state, x) || fake(state, y)) ? 0.35 : 0;
      const p = clamp((rel(x, y, 'attraction') + rel(y, x, 'attraction')) / 20 - mismatch, 0.1, 0.9);
      t.outcome = rng() < p ? 'spark' : 'awkward';
      both((a, b) => bump(a, b, 'attraction', t.outcome === 'spark' ? 1.5 : -2));
      break;
    }
    case 'rival': {
      const calm = (S(state, x, 'temperament') + S(state, y, 'temperament')) / 20;
      t.outcome = rng() < clamp(0.25 + calm * 0.6, 0.1, 0.85) ? 'clear' : 'clash';
      both((a, b) => bump(a, b, 'resentment', t.outcome === 'clear' ? -1.5 : 1));
      break;
    }
    case 'kin': both((a, b) => bump(a, b, 'affection', 1)); break;
    case 'kin.tense': t.outcome = rng() < 0.4 ? 'thaw' : 'cold'; if (t.outcome === 'thaw') both((a, b) => bump(a, b, 'resentment', -1)); break;
    case 'knewit': bump(t.who, t.about, 'strategicRespect', 0.5); break;
    case 'wrongsuspect': bump(t.who, t.about, 'affection', 0.8); bump(t.about, t.who, 'affection', 0.5); break;
    case 'ally': both((a, b) => bump(a, b, 'affection', 0.8)); break;
  }
  return t;
}

// ── Finale night ─────────────────────────────────────────────────────
/** Where they expected to land: their place among the finalists in the last ratings before the final. */
function expectedPlace(state, finalists, h) {
  const last = state.ratings.filter(r => !r.final && !r.hidden).at(-1);
  if (!last) return Math.ceil(finalists.length / 2);
  const order = last.results.filter(r => finalists.includes(r.profile)).sort((a, b) => a.place - b.place).map(r => r.profile);
  const i = order.indexOf(h);
  return i < 0 ? Math.ceil(finalists.length / 2) : i + 1;
}
/** How a placement lands on the one who gets it. */
function toneOf(state, place, expected, h) {
  if (place === 1) return 'win';
  if (place === 2) return 'second';
  if (fake(state, h) && place <= 3) return 'shocked';
  if (place < expected) return 'surprised';
  if (place > expected + 1) return 'gutted';
  return 'proud';
}

export function finaleDay(state, rng, finalRow, { fan = null } = {}) {
  const order = state.active.map(h => [h, rng()]).sort((a, b) => a[1] - b[1]).map(([h]) => h);
  // Goodbye to the apartment, then the walk to the meeting room.
  for (const h of order) addScene(state, 'life', [h], { habit: 'final', event: 'final.leave' }, [h]);
  const present = [];
  for (const h of order) {
    const sc = addScene(state, 'meet', [h, ...present], { arrives: h, talks: [] }, [h, ...present]);
    for (const p of present) { revealTo(state, p, h, sc); revealTo(state, h, p, sc); }
    // The arrival talks with whoever they have the most to settle with: two at most.
    const talks = present.map(p => ({ p, t: talkKind(state, h, p) })).filter(x => x.t)
      .sort((a, b) => WEIGHT[b.t.kind] - WEIGHT[a.t.kind] || (rng() - 0.5)).slice(0, 2);
    for (const { p, t } of talks) sc.data.talks.push({ a: h, b: p, ...settleTalk(state, rng, t, h, p) });
    present.push(h);
  }
  // All of them, together for the first time.
  if (present.length > 1) addScene(state, 'meet', [...present], { all: true }, [...present]);

  const placements = placementsOf(state, finalRow);
  // The studio: the blocked players are there. The host talks with a few of
  // them first — one blocked by a finalist, face to face with them.
  const blockedOut = [...new Set(state.blocked.map(b => b.handle))].filter(b => !state.active.includes(b));
  const studio = [];
  for (const b of [...state.blocked].reverse()) {
    if (studio.length >= 2) break;
    const by = (b.by || []).find(i => state.active.includes(i));
    if (by && !studio.some(s => s.a === b.handle)) studio.push({ kind: 'confront', a: b.handle, b: by });
  }
  const friendOut = blockedOut.filter(b => !studio.some(s => s.a === b))
    .map(b => [b, Math.max(...state.active.map(f => rel(b, f, 'affection')))]).sort((x, y) => y[1] - x[1])[0];
  if (friendOut && friendOut[1] > 3) {
    const f = state.active.slice().sort((x, y) => rel(friendOut[0], y, 'affection') - rel(friendOut[0], x, 'affection'))[0];
    studio.push({ kind: 'cheer', a: friendOut[0], b: f });
  }
  // How each placement lands, and who in the room feels it most.
  const finalists = placements.map(p => p.profile);
  for (const p of placements) {
    p.tone = toneOf(state, p.place, expectedPlace(state, finalists, p.profile), p.profile);
    const others = state.active.filter(o => o !== p.profile);
    const rival = others.filter(o => rel(o, p.profile, 'resentment') >= 2).sort((x, y) => rel(y, p.profile, 'resentment') - rel(x, p.profile, 'resentment'))[0];
    const friend = others.filter(o => rel(o, p.profile, 'affection') >= 4).sort((x, y) => rel(y, p.profile, 'affection') - rel(x, p.profile, 'affection'))[0];
    // A low finish for someone they resent: a smirk; a friend's moment: a cheer.
    p.witness = p.place >= 3 && rival ? { by: rival, how: 'smirk' } : friend ? { by: friend, how: 'cheer' } : null;
    feel(state, p.profile, p.tone === 'gutted' || p.tone === 'second' ? 'stress' : 'elation', p.tone === 'win' ? 3 : 1.5);
  }
  // The winner's speech names the one who got them there.
  const w = placements[0]?.profile;
  const thanks = w ? state.active.concat(blockedOut).filter(o => o !== w).sort((x, y) => rel(w, y, 'affection') - rel(w, x, 'affection'))[0] : null;
  const fanH = fan ? Object.keys(state.profiles).find(h => (state.profiles[h].players || []).includes(fan)) : null;
  addScene(state, 'reveal', [...state.active, ...studio.map(s => s.a)].filter((x, i, l) => l.indexOf(x) === i),
    { placements, seats: order, studio, thanks, fan: fanH }, [...state.active, ...blockedOut]);
  return { placements, winner: placements[0] };
}
