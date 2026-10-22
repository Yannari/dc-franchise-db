// pm/talk/build.js — names every movement entry by where it lives, so a talk
// file is only words: `pull.answer.12` is the twelfth entry of the pull's answer.
// The id is what the repetition guard (pm/script.js pickScript) counts.
export function build(kind, { plans, moves, notes = [], after = null, facts = null, slots = null, leads = null, tiered = true }) {
  const named = {};
  for (const [slot, pool] of Object.entries(moves)) {
    named[slot] = pool.map((e, i) => ({ ...e, id: e.id || `${kind}.${slot}.${i + 1}` }));
  }
  return { kind, plans, after, facts, slots, leads, tiered, moves: named, notes: notes.map((e, i) => ({ ...e, id: e.id || `${kind}.note.${i + 1}` })) };
}
