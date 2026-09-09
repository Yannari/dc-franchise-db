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

/* What standing here before is worth, once. Not per win — see the note in
   lipsyncScore: it used to accumulate to +1.2 and the only way to earn it was
   to keep being in the bottom. */
export const CONFIDENCE_CAP = 0.4;

/* The bars the doubles have to clear.

   CALIBRATED AGAINST THE SHOW, not against taste. Counting only the
   PERFORMANCE-based double shantays — excluding the two that were really
   bureaucracy, S4 after Willam's disqualification and S9 after Eureka's
   injury — the US main series has had seven across seventeen seasons:

     S3  Carmen Carrera & Yara Sofia          S10 Eureka & Kameron Michaels
     S5  Roxxxy Andrews & Alyssa Edwards      S10 Aquaria & Eureka
     S6  Darienne Lake & BenDeLaCreme         S11 Yvie Oddly & Brooke Lynn Hytes
     S17 Jewels Sparkles & Onya Nurve

   Six seasons of seventeen have one, and across ~190 lip syncs that is about
   3.7% of them. It is an exception, but a FAR more common exception than it
   feels like from memory, which is why this was set by measurement in the end
   and not by instinct.

   GREAT WAS 8.5, WHICH MEANT NEVER: it sat above the top decile of the score
   distribution (p10 2.7, median 4.9, p90 7.2 flat), so both queens clearing
   it AND landing within 0.6 was outside the range the engine can produce.
   Measured: 0 in 2,679 head-to-heads. Not rare — unreachable, which reads in
   the code exactly like a rule that is merely strict.

   Measured over 300 seasons per population, against the show's 3.7%/35%:

     G/C          flat cast              authored cast
     7.5 / 0.6    0.45%,  4% of seasons  1.44%, 12%
     7.0 / 0.6    1.15%, 10%             2.99%, 24%
     7.0 / 0.9    1.45%, 12%             4.13%, 31%   <- here
     6.5 / 0.6    2.56%, 20%             5.01%, 36%
     6.5 / 0.9    3.12%, 24%             6.75%, 45%

   HELD AT 0.6 FOR NOW, NOT 0.9, AND THE REASON IS A BUG RATHER THAN A
   PREFERENCE. 7.0/0.9 lands closest to the show (4.13%, 31% of seasons) and
   it turns two latent defects red, both of which the old unreachable bar had
   been hiding:

     1. tests/dr-chart.test.js — the published document and the live rows
        disagree about one cell on a season containing three double shantays.
        Two readers of the same night, one source each.
     2. a season played with consecutive double shantays produced an episode
        with `lipsync = NONE`, `exits = 1` and a named bottom two: a queen
        eliminated without a lip sync happening at all.

   Neither is caused by this constant; both are REACHED by it. 7.0/0.6 is
   still fifteen times the old rate and leaves the suite green, so it ships
   while those are open. Move to 0.9 once they are fixed — the measurement
   below is the target, not this line.

   CLOSE widened rather than GREAT lowered again, and the choice matters. What
   defines the call on the real show is that BOTH were outstanding and the
   host cannot separate them; dropping GREAT to 6.5 would make "outstanding"
   mean "a bit above median", which is the wrong sentence even at the right
   rate. Keeping the excellence bar and admitting that a dead heat is not
   measured to a tenth of a point gets the rate honestly.

   The flat-craft column runs low, and that is correct rather than a miss: a
   cast with no authored craft cannot produce two genuinely outstanding
   performances on the same night, because nobody is outstanding at anything.
   It rises on its own as queens are authored.

   AWFUL is untouched — the double sashay is off unless a season asks. */
const GREAT = 7.0;
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

  /* ── SHE HAS STOOD HERE BEFORE, AND THAT IS ALL IT IS ──
     This accumulated: +0.4 per past lip sync win, capped at +1.2, never
     decaying. THE ONLY WAY TO BANK IT IS TO KEEP LANDING IN THE BOTTOM, so
     the term systematically rewarded the queen who kept failing, and each
     survival made the next one likelier. Read off a played season:

       SAFE SAFE WIN WIN SAFE SAFE  BTM2 BTM2 BTM2 BTM2 BTM2  LOW  FINAL

     Five consecutive lip syncs survived, then the finale. Her two early
     wins bought track protection for the first two saves; by the third her
     PPE had fallen under 3.0 and protection was zero, so the last three
     were this term, sitting at its cap and never coming down.

     Measured over 300 seasons: five-in-a-row fell from 2.0% of seasons to
     0.7% — which is the chance line, since a queen who keeps landing in the
     bottom SHOULD be a coin toss rather than a favourite — and a finalist
     with four or more bottoms halved, 2.0% to 1.0%.

     It is now a single bounded nudge rather than an accumulator: knowing you
     can do this is worth something once, and knowing it four times over is
     not worth four times as much. A queen who is genuinely a fighter should
     read that off her `lipsync` craft, which is what the stat is for.

     WHAT WAS TRIED AND REJECTED: capping the track-record protection in
     week.js. It made this worse, 2.0% -> 4.3%, because protection is what
     ENDS these runs — it is how a good queen who landed in the bottom by
     accident beats the repeat offender standing opposite her. */
  const wins = lipsyncRecord.filter(r => r === 'W').length;
  const rattled = lastReaction === 'crash-out' || lastReaction === 'blow-up' ? 0.8 : 0;
  const confidence = Math.min(CONFIDENCE_CAP, wins * 0.4) - rattled;

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
