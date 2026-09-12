// ══════════════════════════════════════════════════════════════════════
// dr/data/spill.js — Spill the T
// ══════════════════════════════════════════════════════════════════════
//
// The host asks a superlative about the room and every queen votes for who
// she thinks it is. THE POINT IS NOT BEING RIGHT, IT IS MATCHING THE ROOM:
// on the real show the queens who vote with the majority take the round, so
// the game is a test of whether you know what everybody else thinks — which
// is a completely different question from anything else this show scores.
//
// ── AND IT IS NOT `whoShouldGoHome` ──────────────────────────────────
//
// js/dr/critiques.js already holds a twist where the room names who deserves
// to leave. That is ONE question, asked after the critiques, about a verdict
// the panel is also forming. This is a mini before the maxi, several rounds,
// and it is scored on consensus rather than on who was named. They are not
// the same beat and must not be merged: the vote there is a judgement, and
// the vote here is a guess at everybody else's judgement.
//
// ── WHAT MAKES IT DRAMA ──────────────────────────────────────────────
//
// The answers are read out. A queen finds out, in front of everybody and
// before she has done anything that week, that six of her sisters think she
// is the next one going home. `sting` is how much that costs her, and it is
// per QUESTION: being voted most likely to spend the prize well costs
// nothing, and being voted the next to go is the reason this mini exists.
//
// ── HOW A QUEEN VOTES ────────────────────────────────────────────────
//
// `reads` scores everybody else from the voter's point of view and the
// highest is her vote. It is a READ and not a fact — every one of them is
// built from something she can actually see (a record, a room, a bond), so
// a queen who is wrong about the room is wrong for a reason rather than by
// a die roll. `intuition` decides how much noise sits on top of it, which is
// what makes reading the room a skill somebody can be good at.

const num = (p, k, d = 5) => {
  const v = Number(p?.stats?.[k]);
  return Number.isFinite(v) ? v : d;
};
const craft = (p, k, d = 5) => {
  const v = Number(p?.drag?.[k]);
  return Number.isFinite(v) ? v : d;
};
const rec = (name, record) => (record?.[name] || []);
const bottoms = (name, record) =>
  rec(name, record).filter(r => r === 'BTM2' || r === 'LOW').length;
const wins = (name, record) => rec(name, record).filter(r => r === 'WIN').length;
const placed = (name, record) =>
  rec(name, record).filter(r => r === 'WIN' || r === 'HIGH').length;

/**
 * The questions.
 *
 * `sting` 0 is a compliment, 1 is the one that ruins her afternoon.
 * `reads(o, ctx)` scores the queen `o` as a candidate answer, from the point
 * of view of the voter in `ctx.voter`.
 */
export const SPILL_QUESTIONS = [
  {
    id: 'next-to-go', sting: 1,
    prompt: 'Who is the next queen to go home?',
    /* The room's honest read of who is weakest, which is mostly the record
       and a little of what she cannot do. A queen the judges have already
       placed is not the answer however badly she is dressed today. */
    reads: (o, { record, players }) =>
      bottoms(o, record) * 2.2 + (rec(o, record).length && !placed(o, record) ? 1.4 : 0)
      - wins(o, record) * 3 - placed(o, record) * 1.2
      + (5 - craft(players[o], 'runway')) * 0.12,
  },
  {
    id: 'biggest-threat', sting: 0.2,
    prompt: 'Who is the biggest threat to win this whole thing?',
    reads: (o, { record, players }) =>
      wins(o, record) * 3 + placed(o, record) * 1.4
      + (craft(players[o], 'runway') + craft(players[o], 'comedy')) * 0.15,
  },
  {
    id: 'most-shady', sting: 0.7,
    prompt: 'Who is the shadiest queen in this room?',
    /* What she has actually DONE to people, plus the disposition that does
       it. A villain who has not moved on anybody yet is suspected less than
       a floater who has. */
    reads: (o, { players, bond, living }) => {
      const p = players[o];
      const disliked = living.filter(x => x !== o && bond(o, x) <= -3).length;
      return disliked * 1.6 + (10 - num(p, 'loyalty')) * 0.25 + num(p, 'strategic') * 0.2;
    },
  },
  {
    id: 'most-likely-to-crack', sting: 0.8,
    prompt: 'Who is most likely to fall apart before the end?',
    reads: (o, { players, record }) =>
      (10 - num(players[o], 'temperament')) * 0.35 + bottoms(o, record) * 1.1,
  },
  {
    id: 'all-talk', sting: 0.9,
    prompt: 'Who talks the biggest game and has the least to show for it?',
    reads: (o, { players, record }) =>
      num(players[o], 'boldness') * 0.3 - placed(o, record) * 2
      + (rec(o, record).length >= 2 ? 1 : -2),
  },
  {
    id: 'quietest', sting: 0.5,
    prompt: 'Who could leave tomorrow and nobody would notice for a week?',
    /* Invisible, which the room reads off how little she says and how little
       has happened to her. */
    reads: (o, { players, record, bond, living }) => {
      const close = living.filter(x => x !== o && bond(o, x) >= 3).length;
      return (10 - num(players[o], 'social')) * 0.3 - close * 0.8
        - placed(o, record) * 1.5 - bottoms(o, record) * 0.8;
    },
  },
  {
    id: 'best-friend-material', sting: 0,
    prompt: 'Who in here would you actually stay friends with afterwards?',
    reads: (o, { players, bond, voter }) =>
      bond(voter, o) * 1.2 + num(players[o], 'social') * 0.2
      + num(players[o], 'loyalty') * 0.2,
  },
  {
    id: 'spend-it-well', sting: 0,
    prompt: 'Who would do the most sensible thing with the prize money?',
    reads: (o, { players }) =>
      num(players[o], 'mental') * 0.3 + num(players[o], 'loyalty') * 0.2
      - num(players[o], 'boldness') * 0.1,
  },
];

export const spillQuestion = id => SPILL_QUESTIONS.find(q => q.id === id) || null;

/** How many rounds a room of this size can sustain without repeating itself. */
export function spillRounds(roomSize) {
  return roomSize >= 8 ? 4 : roomSize >= 5 ? 3 : 2;
}
