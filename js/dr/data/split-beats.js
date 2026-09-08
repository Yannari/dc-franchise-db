// ══════════════════════════════════════════════════════════════════════
// js/dr/data/split-beats.js — the two halves meet
// ══════════════════════════════════════════════════════════════════════
//
// ── WHAT THIS IS ──────────────────────────────────────────────────────
//
// A split premiere runs the cast in two halves over two episodes and nobody
// goes home. Then, on the third episode, the room doubles: everybody walks
// into a werk room that has twice as many people in it as it did last week,
// and half of those people are strangers who have already been on television.
//
// That moment did not exist. The engine restored the full cast with one line
// of state and the season carried on as though the two halves had always been
// in the room together — no scene, no screen, nothing. The most distinctive
// thing a split premiere does was the one thing it never showed.
//
// ── WHY IT IS ITS OWN PHASE ───────────────────────────────────────────
//
// Because it happens ONCE, before anything else on the night, and it is about
// the room rather than the challenge. Every queen has watched the other half
// perform and formed an opinion without ever meeting them. She knows who won
// over there. She knows who nearly went home. And the queens she spent the
// last two episodes with are now half of a much larger problem.
//
// ── FOR THE WRITER ────────────────────────────────────────────────────
//
// FILL lines. CHANGE NOTHING ELSE — not an id, not a tier. Every id is named
// by js/dr/season.js and a renamed one silently stops being drawn.
//
//   · Placeholders are {a} and {b} only, and each beat's note says what they
//     are. Never a real name, never an invented queen name.
//   · SIX variants minimum per tier, genuinely different.
//   · NEVER state a cast size or a count of queens. No "the other six", no
//     "twelve of us now". tests/dr-prose-counts.test.js fails the build on
//     this and a room doubling is exactly the moment prose wants to count.
//   · Never say "the house" — it is Big Brother's noun. The werk room, the
//     room, the workroom.
//   · This show's words only: queens, the werk room, the main stage, the
//     panel, sashay, lip sync, maxi and mini challenge. There is no vote in
//     this show.
//   · No backticks anywhere in this file.

const tier = (id, note, lines = []) => ({ id, note, lines });

export const SPLIT_BEATS = [
  {
    id: 'rejoin-open', step: 'rejoin', scope: 'once', speaker: 'narrator',
    variants: 6,
    note: 'The room doubles. No {a} — this is about the whole room, and '
      + 'naming one queen makes it her scene instead.',
    writerNote: 'Write the DOOR OPENING and the size of it. They have spent '
      + 'two episodes in a half-empty werk room and it felt like the whole '
      + 'show; now the other half walks in and it was never the whole show. '
      + 'Nobody has to say anything for it to land.',
    tierBy: 'always',
    tiers: [tier('open', 'Twice as many people as there were last week.', [])],
  },
  {
    id: 'rejoin-read', step: 'rejoin', scope: 'per-queen', speaker: 'narrator',
    variants: 6,
    note: '{a} sizing up {b}, who was in the OTHER half. They have never '
      + 'shared a room and {a} has already watched her compete.',
    writerNote: 'The specific strangeness of this twist: she has an opinion '
      + 'about a person she has never met, formed entirely from watching her '
      + 'work. Sometimes the opinion survives the meeting and sometimes it '
      + 'does not. Tier by what she decides.',
    tierBy: 'read',
    tiers: [
      tier('threat', 'She saw the other half and this is the one who worried her.', []),
      tier('warm', 'She liked what she saw, and says so.', []),
      tier('unimpressed', 'She has heard the name all week and does not see it.', []),
    ],
  },
  {
    id: 'rejoin-winners', step: 'rejoin', scope: 'once', speaker: 'narrator',
    variants: 6,
    note: 'The two queens who won their own half, meeting. {a} won the first '
      + 'night, {b} won the second.',
    writerNote: 'Each of them has been the best queen in the room for a week '
      + 'and exactly one of them is about to stop being that. Neither says so. '
      + 'Write what they do instead.',
    tierBy: 'always',
    tiers: [tier('winners', 'Two queens who have each been the best in the room.', [])],
  },
];

export const SPLIT_IDS = SPLIT_BEATS.map(b => b.id);

/** A tier with no lines written — the gap check and the writer's to-do list. */
export function unwrittenSplitTiers() {
  const out = [];
  for (const b of SPLIT_BEATS) {
    for (const t of b.tiers || []) if (!t.lines?.length) out.push(`${b.id}/${t.id}`);
  }
  return out;
}
