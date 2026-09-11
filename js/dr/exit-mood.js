// ══════════════════════════════════════════════════════════════════════
// dr/exit-mood.js — how she is taking it
// ══════════════════════════════════════════════════════════════════════
//
// Every queen used to leave this show gracious.
//
// That was not a writing choice, it was a missing axis. The four beats of an
// elimination — `lipsync-sashay`, `sashay-words`, `farewell`, `mirror-message`
// — are `tierBy: 'always'` except one, and that one keys on SWAGGER, which is
// her runway persona. Five personalities and one emotion. The pool's own
// writer note says it out loud: "Every queen thanks the show — that part is
// ritual and should stay recognisable."
//
// ── THE ENGINE ALREADY KNEW AND THREW IT AWAY ────────────────────────
//
// `reactions[n]` is computed every week from her temperament and how far the
// call fell below what she expected, and it is read in exactly one place: the
// critique-reaction beat. It never reached the door. Measured on a played
// season, episode three: a queen whose reaction at the call was `crash-out`
// left saying "They counted me out on day one. I stayed until now. That maths
// is mine and nobody can take it," composed, proud, and walking tall.
//
// ── AND THIS IS A SEPARATE QUESTION FROM WHO SHE IS ──────────────────
//
// It does not replace `sashay-words`. Her parting shot stays in her own
// voice — predator, sunshine, firecracker, professional, scrapper, all
// written — and this is the beat beside it: the room watching her take it.
// So a firecracker can be devastated and STILL go out loud, which is both
// truer to the show and something neither beat could say alone.
//
// Nothing here reads the reaction alone. The reaction is her mood at the
// CALL, before the song; going home is a second blow and the record, the
// margin and her own temperament all speak to how it lands.

/** The moods, most specific first. Order IS the precedence — see `exitMoodFor`. */
export const EXIT_MOODS = [
  'bitter', 'gutted', 'robbed', 'blindsided', 'relieved', 'resigned', 'composed',
];

const num = (v, d = 5) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * Which mood she leaves in.
 *
 * @param {object}   o
 * @param {string[]} o.record   her results before tonight, oldest first
 * @param {string}   o.reaction how she took the call, before the song
 * @param {number}   o.gap      the lip sync margin; small means it was close
 * @param {object}   o.player   for temperament and loyalty
 * @returns {string} one of EXIT_MOODS
 */
export function exitMoodFor({ record = [], reaction = null, gap = null, player = null } = {}) {
  const past = (record || []).slice(0, -1);          // tonight is the last entry
  const bottoms = past.filter(r => r === 'BTM' || r === 'BTM2').length;
  const strong = past.some(r => r === 'WIN' || r === 'HIGH');
  const temperament = num(player?.stats?.temperament);
  const loyalty = num(player?.stats?.loyalty);
  const close = gap !== null && Math.abs(Number(gap) || 0) < 1.5;

  /* SHE IS ANGRY AT PEOPLE, not at the result. `blow-up` is the one reaction
     that comes OUT rather than in — she went off in front of everybody — and
     a queen who did that and then went home is bitter whoever she is.
     This carried `&& loyalty <= 4` and that was hedging: it made the mood
     fire five times in forty seasons, which is a pool nobody would ever see
     written. A blow-up is already the rare event; gating it twice made it a
     tier in name only. Loyalty still speaks, one line down, to whether the
     bitterness curdles or burns off. */
  if (reaction === 'blow-up') return 'bitter';

  /* SHE DOES NOT HOLD IT TOGETHER. The two reactions that are a collapse,
     plus the temperament that makes one likely regardless. */
  if (reaction === 'crash-out' || reaction === 'tears') return 'gutted';
  if (temperament <= 3 && reaction === 'sadness') return 'gutted';

  /* SHE THINKS SHE WON THAT. Only with a record behind it: a queen who has
     never placed and loses a close song has no case to feel robbed of, and
     writing her one would be the narration flattering her. */
  if (close && strong) return 'robbed';

  /* SHE HAD NEVER BEEN DOWN HERE BEFORE. First time in the bottom and it was
     the last time — the shock exit, and the one the audience remembers. */
  if (!bottoms) return 'blindsided';

  /* IT IS OVER AND THAT IS ALL RIGHT. Needs the temperament to mean it;
     otherwise `idgaf` is a performance and she is really something else. */
  if ((reaction === 'relief' || reaction === 'idgaf') && temperament >= 6) return 'relieved';

  /* SHE SAW IT COMING. Three weeks in the bottom is its own preparation. */
  if (bottoms >= 2) return 'resigned';

  return 'composed';
}
