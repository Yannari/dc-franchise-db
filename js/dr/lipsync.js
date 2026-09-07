// ══════════════════════════════════════════════════════════════════════
// dr/lipsync.js — lip sync for your life
// ══════════════════════════════════════════════════════════════════════
//
// THE WEIGHTING IS THE USER'S, and it is the feel of the whole segment:
//
//   * `lipsync` is always the heaviest stat. It is not "knowing the words" —
//     it is whether she can carry a song's meaning on her face, which is what
//     the format is actually asking for.
//   * `dance` is ALWAYS present, at every tempo. You can slay a ballad by
//     knowing how to move. An uptempo song doubles its weight rather than
//     switching it on.
//   * The MOOD picks the third stat: acting carries a sad song, comedy a funny
//     one, and nerve carries the three that need attitude.
//
// The doubles are earned here and never rolled. A double shantay needs two
// genuinely excellent performances that are also close; a double sashay needs
// two genuinely bad ones. Both are gated behind a season switch as well, so a
// season can simply not have them.
import { dragOf } from './queen.js';
import { noise } from './perform.js';

// Which stat the song's mood asks for. 'nerve' is the person's boldness rather
// than a craft stat: a fierce song is not a technical exercise.
const MOOD_STAT = { sad: 'acting', funny: 'comedy', fierce: 'nerve', rage: 'nerve', sexy: 'nerve' };

// Which drag styles a genre flatters. The same idea as a runway category
// suiting a look, and deliberately worth much less than any craft term: a
// pageant queen gets a lift on a country ballad and a club kid on hyperpop,
// and neither of them beats somebody who can actually lip sync.
//
// This exists so `genre` is a field the engine READS. A tag nothing reads is a
// tag that rots — it drifts out of step with the data around it and nobody
// notices, because nothing was ever depending on it.
const GENRE_STYLES = {
  country: ['pageant', 'glamour'],
  musical: ['broadway', 'camp'],
  disco: ['dancer', 'glamour'],
  house: ['club-kid', 'dancer'],
  hyperpop: ['club-kid', 'art'],
  'k-pop': ['club-kid', 'dancer'],
  rock: ['spooky', 'art'],
  soul: ['glamour', 'broadway'],
  'r&b': ['glamour', 'dancer'],
  latin: ['dancer', 'camp'],
  freestyle: ['club-kid', 'camp'],
  'hip-hop': ['club-kid', 'fashion'],
  'dance-pop': ['dancer', 'club-kid'],
  pop: ['pageant', 'fashion'],
};
/** Worth about a fifth of what the mood stat is worth. A nudge, not a term. */
const GENRE_FIT = 0.4;

// The bars the doubles have to clear. High enough that neither is a coin flip:
// measured over a season these should be rare events, not a weekly outcome.
const GREAT = 8.5;
const CLOSE = 0.6;
const AWFUL = 3.5;

/**
 * One queen, one song, one performance of her life.
 *
 *   lipsyncRecord  ['W','L',...] — surviving lip syncs breeds confidence
 *   lastReaction   how she took the critiques minutes ago; a queen who just
 *                  crashed out on the main stage is not right yet
 */
export function lipsyncScore({
  player, song, lipsyncRecord = [], lastReaction = null, rng = Math.random,
}) {
  const d = dragOf(player);
  const s = (player && player.stats) || {};
  const bold = (Number.isFinite(Number(s.boldness)) ? Number(s.boldness) : 5) / 10;

  const up = song.tempo === 'uptempo' || song.tempo === 'dance';
  const moodKey = MOOD_STAT[song.mood] || 'acting';
  const moodStat = moodKey === 'nerve' ? bold * 10 : d[moodKey];

  // The stunt: the split, the reveal, the jump off the riser. Attempted in
  // proportion to nerve, and it can miss — which is the point of trying it.
  const attempts = rng() < bold * 0.6;
  const stunt = attempts ? (rng() < 0.75 ? 'landed' : 'failed') : 'none';
  const stuntPts = stunt === 'landed' ? 1.0 : stunt === 'failed' ? -0.8 : 0;

  // Two wins is a queen who knows she can do this. Capped, so a fighter is
  // confident rather than unbeatable.
  const wins = lipsyncRecord.filter(r => r === 'W').length;
  const rattled = lastReaction === 'crash-out' || lastReaction === 'blow-up' ? 0.8 : 0;
  const confidence = Math.min(1.2, wins * 0.4) - rattled;

  const core = d.lipsync * 0.45
    + d.dance * (0.15 + (up ? 0.15 : 0))
    + moodStat * 0.20;

  // Does this kind of record suit the kind of queen she is?
  //
  // AN AUTHORED STYLE ONLY. `dragOf` falls back to inferring a style from her
  // craft when nobody set one, and rewarding that inference here would pay her
  // twice for the same stat: a queen with high dance is inferred a dancer, and
  // dancer genres would then hand her a bonus on top of the dance term. It
  // showed up as a dance-heavy queen out-scoring an acting-heavy one on a sad
  // song, which is the exact thing the weighting is supposed to prevent.
  const authoredStyle = typeof player?.drag?.style === 'string' ? player.drag.style : null;
  const genreFit = authoredStyle && (GENRE_STYLES[song.genre] || []).includes(authoredStyle)
    ? GENRE_FIT : 0;

  const score = core + genreFit + stuntPts + confidence + noise(rng, 2.5);

  // Four beats for the narration to hang on. They are texture, not arithmetic:
  // the score above is the performance, and these say how it got there.
  const beats = ['verse', 'chorus', 'hook', 'ending'].map(beat => ({
    beat,
    delta: Math.round(noise(rng, 0.6) * 100) / 100,
  }));

  return {
    score: Math.round(score * 100) / 100,
    stunt,
    beats,
    parts: { core, genreFit, stuntPts, confidence, moodKey, hook: song.hook },
  };
}

/**
 * The host's call.
 *
 * `bendA` / `bendB` are the host's lean at HALF weight — the caller has
 * already halved it. It can decide a close one and cannot rescue a blowout,
 * which is exactly what the format does: a beloved queen usually survives a
 * bad night against somebody expendable, and every so often she does not,
 * because it is the last chance to make an impression and both of them know it.
 */
export function lipsyncCall({
  a, b, bendA = 0, bendB = 0, allowDoubleShantay = false, allowDoubleSashay = false,
}) {
  const gap = Math.round((a.score - b.score) * 100) / 100;

  // The doubles read the RAW performances, not the bent ones. Whether both
  // were extraordinary is a fact about the stage, not a decision the host's
  // agenda is allowed to manufacture.
  if (allowDoubleShantay && a.score >= GREAT && b.score >= GREAT && Math.abs(gap) < CLOSE) {
    return { call: 'double-shantay', winner: null, loser: null, losers: [], gap };
  }
  if (allowDoubleSashay && a.score <= AWFUL && b.score <= AWFUL) {
    return { call: 'double-sashay', winner: null, loser: null, losers: [a.name, b.name], gap };
  }

  const sa = a.score + bendA;
  const sb = b.score + bendB;
  const winner = sa >= sb ? a.name : b.name;
  const loser = winner === a.name ? b.name : a.name;
  return { call: 'shantay', winner, loser, losers: [loser], gap };
}
