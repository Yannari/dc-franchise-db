// ══════════════════════════════════════════════════════════════════════
// bb/audience-reveal.js — how a public vote is READ OUT, not how it was cast
// ══════════════════════════════════════════════════════════════════════
//
// `js/audience.js` decides what the public voted. This decides how the house
// finds out, which is a completely separate piece of television and the only
// part anybody actually watches.
//
// It is deliberately show-agnostic and verb-agnostic. The same public vote
// exists in more than one format and points in more than one direction — a
// house voting somebody OUT, an audience voting somebody TO SAVE, a public
// putting somebody up — and every one of them is the same broadcast beat: the
// lines close, the host makes the room wait, the numbers come out in an order
// chosen for suspense, and the name lands last. Anything that needs a public
// vote read out should call this rather than writing its own.
//
// ── WHY THE ORDER IS BACKWARDS ──
//
// Percentages are revealed LOWEST FIRST. It is how every show that has ever
// staged a public vote does it, and the reason is arithmetic: revealing the
// biggest number first tells you the answer and makes every number after it
// an afterthought. Going upward means the room can see the total closing and
// still not know, and the last bar to move is the one that matters.

/** What kind of night this is, read off the margin between first and second. */
export function voteShape(tally = []) {
  if (tally.length < 2) return 'unopposed';
  const gap = (tally[0]?.share || 0) - (tally[1]?.share || 0);
  if (gap >= 40) return 'landslide';
  if (gap >= 15) return 'clear';
  if (gap >= 5) return 'close';
  return 'knife-edge';
}

/** How the host stalls, by how much of a result there is to stall over. */
const TEASE = {
  landslide: [
    'This one was not close. I am going to read it out anyway, because you should all hear the number.',
    'I have had this result since this afternoon and I have been looking forward to it.',
  ],
  clear: [
    'The public have been decisive. Not unanimous — decisive.',
    'There is a clear answer here, and one of you is going to like it a great deal more than the other.',
  ],
  close: [
    'This was closer than either of you is going to be comfortable hearing.',
    'A few thousand votes separate the two of you. A few thousand.',
  ],
  'knife-edge': [
    'I want you both to understand how close this was before I say anything else.',
    'If this had run another hour I am not certain I would be reading the same name.',
    'There is almost nothing between you. Almost.',
  ],
  unopposed: ['There was only ever one name this could be.'],
};

/** The line that closes the lines. */
const CLOSING = [
  'The lines are now closed.',
  'Voting has closed. Nobody else is getting a say in this.',
  'That is it — the lines are shut and the numbers are in front of me.',
];

/** What the host says to the room before any number is read. */
const ADDRESS = {
  evict: [
    'For the last seven days the public have been voting for which of you they want to see walk out of that door tonight.',
    'Everybody watching has had a week to decide about you. None of you were in the room for that conversation.',
  ],
  save: [
    'For the last seven days the public have been voting to SAVE. One of you has been kept in this house by people you have never met.',
    'Somebody out there has spent a week keeping one of you here.',
  ],
  nominate: [
    'The public have spent the week deciding which of you they want to see on that block.',
  ],
};

/** The sentence the number arrives in. */
const RESULT = {
  evict: (n, pct) => `With ${pct}% of the public vote — ${n}.`,
  save: (n, pct) => `With ${pct}% of the vote to save — ${n}, you are safe.`,
  nominate: (n, pct) => `With ${pct}% — ${n}, the public have put you up.`,
};

const pick = (list, rng) => list[Math.floor((rng ? rng() : 0.5) * list.length) % list.length];

/**
 * Turn a finished tally into a reveal.
 *
 * Returns the pieces both the transcript and the screen build from, so the two
 * tell the same story in the same order rather than each inventing one:
 *
 *   shape      'landslide' | 'clear' | 'close' | 'knife-edge' | 'unopposed'
 *   margin     the gap in points between first and second
 *   closing    the line that shuts the lines
 *   address    what the room is told before any number
 *   tease      the stall, chosen by shape
 *   reveal     the tally in READING order — lowest share first, target last
 *   resultLine the sentence the name lands in
 *
 * @param {object}   o
 * @param {Array}    o.tally   [{name, share}], any order
 * @param {string}   o.target  who the vote landed on
 * @param {string}   [o.verb]  'evict' | 'save' | 'nominate'
 * @param {number}   [o.weight] how many ballots this vote is worth
 * @param {function} [o.rng]
 */
export function buildAudienceReveal({ tally = [], target = null, verb = 'evict',
  weight = 1, rng = Math.random } = {}) {
  const board = [...tally].sort((a, b) => (b.share || 0) - (a.share || 0));
  const shape = voteShape(board);
  // Lowest first, and the target forced to the end even if a rounding tie put
  // somebody level with them — the name being read out has to be last.
  const reveal = [...board].sort((a, b) => (a.share || 0) - (b.share || 0))
    .filter(r => r.name !== target);
  const hit = board.find(r => r.name === target);
  if (hit) reveal.push(hit);
  return {
    shape,
    margin: board.length > 1
      ? Math.round(((board[0].share || 0) - (board[1].share || 0)) * 100) / 100 : 100,
    closing: pick(CLOSING, rng),
    address: pick(ADDRESS[verb] || ADDRESS.evict, rng),
    tease: pick(TEASE[shape] || TEASE.clear, rng),
    reveal,
    resultLine: (RESULT[verb] || RESULT.evict)(target, hit ? hit.share : 0),
    verb,
    weight,
  };
}
