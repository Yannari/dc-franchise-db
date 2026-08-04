// Seating a block for a Battle of the Block game.
//
// A pair competition is played by two PAIRS of nominees, and it declines to run
// without them rather than inventing partners for people the week never put
// together. Every harness that smoke-runs the whole library therefore has to
// seat a block the way the week does: exactly four nominees, two to a side.

/** Is this a Battle of the Block game — playable only in pairs? */
export const isPairComp = comp =>
  Array.isArray(comp?.types) && comp.types.length === 1 && comp.types[0] === 'pair';

/** The slot a competition should be smoke-run in. */
export const slotFor = comp => (comp.types.includes('hoh') ? 'hoh' : comp.types[0]);

/** Four nominees, two pairs — the extra options a pair game needs to run. */
export const pairSeating = (house, size = 4) => ({
  participants: house.slice(0, size),
  pairs: [{ owner: 'HOH-1', members: house.slice(0, 2) },
    { owner: 'HOH-2', members: house.slice(2, 4) }],
});

/** Spread over any runBBCompetition options: a no-op for ordinary comps. */
export const seatFor = (comp, house) => (isPairComp(comp) ? pairSeating(house) : {});
