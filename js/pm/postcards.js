// ══════════════════════════════════════════════════════════════════════
// pm/postcards.js — the postcards from Casa Amor, while the villas are apart
// ══════════════════════════════════════════════════════════════════════
//
// The real show sends them DURING Casa, to both villas, the night before the
// stick-or-twist: a photo of each partner in the other villa, with no
// context. They decide recouplings — Faye said she would never have recoupled
// with Sam had she not been sent the photo of Teddy, which was a kiss in a
// game of dares (UK 2021; 4,330 complaints). Ours used to arrive after the
// return, when the decision had already been made (user, 2026-10-26: "do the
// postcard photos have an actual impact?").
//
//   postcard-text  [a]          the text, in each villa (`casa`: which one)
//   postcard       [a, b, c, d] a opens a postcard of b, who is in the other
//                               villa; c is the friend beside a; d is who b
//                               is with in the photo, when anyone. `of`:
//                                 kiss · bed · pull   a real Casa moment, a secret
//                                 game                a challenge kiss, no context (misleading)
//                                 close               b laughing with somebody new: nothing happened
//                                 alone               b on their own, turning someone down: relief
//
// What a postcard shows is real (user: "don't invent things"): every photo is
// a scene from this Casa. What it does is decided here and read by
// casa.js stickOrTwist (state.postcards: the fear it adds) and by the photos
// night after the return (moments.js), where it is thrown back at b.
import { addBond, getBond } from '../bonds.js';
import { addRelationshipDimension } from '../relationships.js';
import { makeEvent, apart } from './events.js';
import { heartOf } from './just-friends.js';
import { revealTruth } from './feelings.js';
import { feel, jealousyHit } from './emotions.js';

const PER_VILLA = 5;
const SEV = { bed: 1.1, kiss: 1, pull: 0.6, game: 0.8, close: 0.3, alone: 0 };
const GAME_KISS = new Set(['challenge-kiss', 'game-kiss', 'snogger-kiss']);
const CLOSE = new Set(['chat', 'comedy', 'deep-chat', 'friendship', 'pull', 'bed-share', 'challenge-win']);

/** The photo of `p` that gets sent to `w`: the worst thing p did at Casa, or nothing. */
function photoOf(state, w, p, since) {
  const casaNew = new Set(state.casaArrivals || []);
  const sec = state.secrets.filter(s => s.casa && s.who === p && s.partner === w && !s.known && s.ep >= since)
    .sort((a, b) => b.severity - a.severity)[0];
  if (sec) {
    const of = sec.kind === 'kiss' || sec.kind === 'promise' ? 'kiss' : sec.kind === 'bed' ? 'bed' : 'pull';
    return { of, sev: SEV[of] * Math.max(0.6, sec.severity), with: sec.with, sec, eventId: sec.eventId, ep: sec.ep };
  }
  const seen = state.history.filter(e => e.ep >= since && e.players.includes(p) && !e.players.includes(w));
  const game = seen.find(e => GAME_KISS.has(e.kind) && e.players.some(n => n !== p && casaNew.has(n)));
  if (game) return { of: 'game', sev: SEV.game, with: game.players.find(n => n !== p && casaNew.has(n)), eventId: game.id, ep: game.ep, misleading: true };
  const loyal = seen.find(e => e.kind === 'loyalty' && e.players[0] === p);
  if (loyal) return { of: 'alone', sev: 0, with: null, eventId: loyal.id, ep: loyal.ep };
  const close = seen.find(e => CLOSE.has(e.kind) && e.aired && e.players.some(n => n !== p && casaNew.has(n)));
  if (close) return { of: 'close', sev: SEV.close, with: close.players.find(n => n !== p && casaNew.has(n)), eventId: close.id, ep: close.ep };
  return null;
}

/** The postcards night (the second night of Casa Amor). */
export function postcards(state, rng) {
  if (!state.split) return [];
  const since = state.splitEp ?? state.ep - 1;
  const villaOf = n => (state.casa?.includes(n) ? 'casa' : 'villa');
  const arrivals = new Set(state.casaArrivals || []);
  const byVilla = { villa: [], casa: [] };
  for (const w of state.villa) {
    if (arrivals.has(w)) continue;
    const p = heartOf(state, w);
    if (!p || !apart(state, w, p)) continue;
    const photo = photoOf(state, w, p, since);
    if (photo) byVilla[villaOf(w)].push({ w, p, ...photo });
  }
  const out = [];
  state.postcards = { ...(state.postcards || {}) };
  for (const side of ['villa', 'casa']) {
    // The worst of it, and one good one if there is one: a handful, not an inbox.
    const all = byVilla[side].sort((a, b) => b.sev - a.sev || rng() - 0.5);
    const shown = [...all.filter(x => x.of !== 'alone').slice(0, PER_VILLA - 1), ...all.filter(x => x.of === 'alone').slice(0, 1)];
    if (!shown.length) continue;
    const reader = shown[Math.floor(rng() * shown.length)].w;
    out.push(makeEvent(state, rng, { phase: 'evening', kind: 'postcard-text', players: [reader], aired: true, extra: { casa: side === 'casa', pop: {} } }));
    for (const x of shown) {
      const { w, p } = x;
      // The friend beside them: the closest one in the same villa.
      const friend = state.villa.filter(n => n !== w && n !== p && n !== x.with && villaOf(n) === villaOf(w) && !arrivals.has(n))
        .sort((a, b) => getBond(w, b) - getBond(w, a))[0] || null;
      if (x.sec) { x.sec.known = true; x.sec.public = true; revealTruth(state, w, p); }
      if (x.of === 'alone') {
        feel(state, w, 'security', 1.2); addBond(w, p, 0.4); addRelationshipDimension(w, p, 'trust', 0.8);
      } else {
        // A real moment hits as hard as it was; a game kiss with no context hits
        // as if it were real (that is the point of sending it); a laugh stings.
        jealousyHit(state, w, p, x.with || p, 2.5 * x.sev, { confirmed: !x.misleading });
        addRelationshipDimension(w, p, 'trust', -1.2 * x.sev);
        addBond(w, p, -0.8 * x.sev);
        feel(state, w, 'stress', 0.4 + 0.6 * x.sev); feel(state, w, 'security', -0.8 * x.sev);
      }
      if (friend) addBond(w, friend, 0.3);
      state.postcards[w] = { of: x.of, sev: x.sev, about: p, with: x.with || null, ep: state.ep, misleading: !!x.misleading };
      out.push(makeEvent(state, rng, { phase: 'evening', kind: 'postcard', players: friend ? [w, p, friend, ...(x.with ? [x.with] : [])] : [w, p], aired: true,
        major: x.sev >= 0.6 ? [w] : [],
        extra: { of: x.of, faces: [p, x.with].filter(Boolean), photoEp: x.ep, misleading: !!x.misleading, casa: side === 'casa',
          ...(x.sec ? { secret: x.sec.id } : {}),
          pop: { [w]: { approval: x.sev >= 0.6 ? 0.8 : 0.2, fame: 1.2 }, ...(x.sec ? { [p]: { approval: -1.2 * x.sev, fame: 1.5 } } : {}) } } }));
    }
  }
  // The rest of Casa's secrets are Movie Night's (movie-night.js).
  state.photosShown = true;
  return out;
}

/** How much a postcard adds to the fear at the stick-or-twist (casa.js). */
export const postcardFear = (state, o) => {
  const pc = state.postcards?.[o];
  if (!pc || pc.ep < (state.splitEp ?? 0)) return 0;
  // A postcard that showed a real secret already counts as one found out (casa.js
  // fear +0.25), and its jealousy is in the feelings term. Measured (30 seasons):
  // 2.10 couples broken a Casa without postcards, 2.90 at first weights, 2.43
  // now; twists 34% -> 40%. A game kiss sent with no context has no secret behind it.
  return { kiss: 0, bed: 0, pull: -0.05, game: 0.2, close: 0.05, alone: -0.15 }[pc.of] ?? 0;
};
