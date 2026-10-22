// pm/talk/build.js — names every movement entry by where it lives, so a talk
// file is only words: `pull.answer.12` is the twelfth entry of the pull's answer.
// The id is what the repetition guard (pm/script.js pickScript) counts.
// A line that assumes the day is under way ("all day", "it's been a long
// day") never plays in the morning (season read, 2026-10-22: "It's been a long
// day" over breakfast). Marked here, from the words, so nobody has to remember.
const DAY_UNDER_WAY = /\b(all day|long day|today was|since breakfast|at lunch)\b/i;
const textOf = e => [e.stage, e.beat, ...(e.turns || []).map(t => t[1])].filter(Boolean).join(' ');

export function build(kind, { plans, moves, notes = [], after = null, facts = null, slots = null, leads = null, tiered = true, stages = [] }) {
  const named = {};
  const mark = e => (DAY_UNDER_WAY.test(textOf(e)) ? { ...e, notMorning: true } : e);
  for (const [slot, pool] of Object.entries(moves)) {
    named[slot] = pool.map((e, i) => mark({ ...e, id: e.id || `${kind}.${slot}.${i + 1}` }));
  }
  return { kind, plans, after, facts, slots, leads, tiered, moves: named,
    // Where a scene is, when its plan starts on dialogue (a short scene).
    stages: stages.map((e, i) => ({ ...e, id: e.id || `${kind}.stage.${i + 1}` })),
    notes: notes.map((e, i) => mark({ ...e, id: e.id || `${kind}.note.${i + 1}` })) };
}

/**
 * More entries for a kind's pools, from a file of their own (pm/talk/more/):
 * appended slot by slot, with ids that never collide with the kind's own
 * (`friendship.close.x4`), marked for the morning like the rest.
 */
export function extend(talk, { moves = {}, notes = [], stages = [] }) {
  const name = (slot, e, i) => ({ ...e, id: e.id || `${talk.kind}.${slot}.x${i + 1}` });
  const mark = e => (DAY_UNDER_WAY.test(textOf(e)) ? { ...e, notMorning: true } : e);
  for (const [slot, pool] of Object.entries(moves)) {
    talk.moves[slot] = [...(talk.moves[slot] || []), ...pool.map((e, i) => mark(name(slot, e, i)))];
  }
  talk.notes = [...talk.notes, ...notes.map((e, i) => mark(name('note', e, i)))];
  talk.stages = [...(talk.stages || []), ...stages.map((e, i) => name('stage', e, i))];
  return talk;
}
