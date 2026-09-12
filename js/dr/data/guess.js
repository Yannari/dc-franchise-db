// ══════════════════════════════════════════════════════════════════════
// dr/data/guess.js — Guess Who: whose is this?
// ══════════════════════════════════════════════════════════════════════
//
// The wiki files eleven of these under Guessing Challenge and they are all
// the same game: something belongs to one of the queens — a scent, a shoe, a
// baby photo, a tuck behind a curtain — and the room has to work out whose.
//
// ── AND IT IS NOT SPILL THE T ────────────────────────────────────────
//
// The two look alike on the screen (a question, a room answering, a tally)
// and they are opposites. Spill the T has NO right answer and scores you for
// agreeing with everybody else. This one has exactly one right answer and
// scores you for being right, so the room agreeing in a body is not a win
// here — it is eight queens being wrong together, which is the funniest
// result the game produces.
//
// ── WHAT IT ACTUALLY TESTS ───────────────────────────────────────────
//
// How well she knows the woman standing next to her. A guess is built from
// three things she genuinely has:
//
//   the BOND     — you know your friend's shoes. This is the whole reason
//                  the mini is worth having: it is the only one on the list
//                  that pays a queen for the room she has built.
//   the LIKENESS — the thing in front of her belongs to somebody who sits
//                  somewhere on one axis, and the queens who sit near there
//                  are the plausible answers. A queen far out at either end
//                  is easy; a queen in the middle is confusable with half
//                  the room.
//   her INTUITION — how much noise sits on top of the other two.
//
// So the queen nobody can place is the queen nobody talks to, and that is a
// verdict the episode can draw without anybody saying it out loud.
//
// ── THE ITEMS ────────────────────────────────────────────────────────
//
// `axis(queen)` is where that queen sits on the dimension the item exposes —
// a wig exposes design, a laugh exposes comedy, a station exposes
// temperament. It is NOT how recognisable she is, and the difference was a
// real bug: scoring candidates by their own loudness made the loudest
// designer in the room everybody's answer on every wig round, so the room was
// systematically wrong and the game read as a coin flip. Measured at 12.8%
// correct against 9.1% chance, with no round the room ever swept.
//
// What a queen actually has is a RESEMBLANCE: the thing in front of her
// belongs to somebody who sits somewhere on that axis, and the candidates who
// sit near there are the plausible ones. Which means a queen far out at
// either end is easy — nobody else is near her — and a queen at five is
// confusable with half the room, which is the same sentence as "nobody can
// pick her out of a line-up" and is the queen this mini is about.
//
// `axis` may be null: nothing on a queen's sheet says what she smells like,
// so a perfume is knowable ONLY from having stood next to her and the bond
// carries the entire round.

const craftOf = (p, k, d = 5) => {
  const v = Number(p?.drag?.[k]);
  return Number.isFinite(v) ? v : d;
};
const statOf = (p, k, d = 5) => {
  const v = Number(p?.stats?.[k]);
  return Number.isFinite(v) ? v : d;
};

export const GUESS_ITEMS = [
  {
    id: 'wig', craft: 'design', intimate: false,
    prompt: 'Whose wig is this?',
    axis: p => craftOf(p, 'design'),
  },
  {
    id: 'shoe', craft: 'runway', intimate: false,
    prompt: 'Whose shoe is this?',
    axis: p => craftOf(p, 'runway'),
  },
  {
    id: 'padding', craft: 'design', intimate: true,
    prompt: 'Whose padding is this?',
    axis: p => craftOf(p, 'design'),
  },
  {
    id: 'scent', craft: null, intimate: true,
    prompt: 'Whose perfume is this?',
    axis: null,
  },
  {
    id: 'handwriting', craft: null, intimate: true,
    prompt: 'Whose handwriting is this?',
    axis: p => statOf(p, 'mental'),
  },
  {
    id: 'baby-photo', craft: null, intimate: true,
    prompt: 'Whose baby photo is this?',
    axis: p => statOf(p, 'boldness'),
  },
  {
    id: 'laugh', craft: 'comedy', intimate: false,
    prompt: 'Whose laugh is this?',
    axis: p => craftOf(p, 'comedy') * 0.6 + statOf(p, 'social') * 0.4,
  },
  {
    id: 'voice', craft: 'singing', intimate: false,
    prompt: 'Whose singing voice is this, through a wall?',
    axis: p => craftOf(p, 'singing'),
  },
  {
    id: 'station', craft: 'design', intimate: true,
    /* A work station is a record of a temperament rather than a craft: the
       queen who tidies as she goes and the one who does not are both
       unmistakable, and they are unmistakable in opposite directions. */
    prompt: 'Whose station is this, an hour before the runway?',
    axis: p => statOf(p, 'temperament'),
  },
  {
    id: 'handbag', craft: 'runway', intimate: true,
    prompt: 'Whose bag is this, and what is in it?',
    axis: p => craftOf(p, 'runway') * 0.5 + statOf(p, 'strategic') * 0.5,
  },
];

export const guessItem = id => GUESS_ITEMS.find(i => i.id === id) || null;

/**
 * How many items go up. Enough that one lucky guess does not take it, few
 * enough that the segment does not outrun the maxi it is a warm-up for.
 */
export function guessRounds(roomSize) {
  return roomSize >= 8 ? 4 : roomSize >= 5 ? 3 : 2;
}
