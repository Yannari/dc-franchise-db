// ══════════════════════════════════════════════════════════════════════
// coaches-spread-on-a-redraw.test.js — a new tribe gets a coach
// ══════════════════════════════════════════════════════════════════════
//
// Reported: "coaches don't work well when the tribe got mixed with a twist
// like expansion or dissolve or schoolyard — the coaches are also redistributed
// in the most equivalent way possible on all the teams."
//
// All three twists already called `reassignCoaches`. The function only
// RESCUED: it relocated a coach whose camp no longer existed and skipped
// everybody else. That is enough for a Dissolve, where a tribe really does
// vanish — and it does nothing at all for an Expansion, where every existing
// tribe survives and a new one is added. Nothing was orphaned, so nothing
// moved, and the new tribe opened with no coach while the old ones kept all
// of them.
//
// The arms below are written against the function rather than against a played
// season on purpose: the redistribution is a pure decision about a list of
// tribes, and testing it through a twist would make a failure here look like a
// twist bug.
import { describe, it, expect, beforeEach } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { addCoach, reassignCoaches, activeCoaches } from '../js/coaches.js';

function world(tribes, coaches, training = {}) {
  setGs({ ...gs, coaches: [], coachTraining: training, coachCards: {},
    activePlayers: tribes.flatMap(t => t.members) });
  gs.coaches = [];
  for (const c of coaches) addCoach(c);
  return tribes;
}
const spread = names => {
  const load = {};
  for (const n of names) load[n] = 0;
  for (const c of activeCoaches()) load[c.tribe] = (load[c.tribe] || 0) + 1;
  return load;
};

describe('an expansion: every tribe survives and one is added', () => {
  let tribes;
  beforeEach(() => {
    tribes = world(
      [{ name: 'A', members: ['a1', 'a2', 'a3'] },
        { name: 'B', members: ['b1', 'b2', 'b3'] },
        { name: 'New Tribe', members: ['n1', 'n2', 'n3'] }],
      [{ name: 'Coach A', tribe: 'A' }, { name: 'Coach B', tribe: 'B' }],
    );
  });

  it('left the new tribe with nobody before this fix, which is the bug', () => {
    // The arm exists to keep the FAILING state describable: no coach's tribe is
    // missing from the list, so the rescue pass has nothing to do and the whole
    // question is whether anything else happens.
    expect(activeCoaches().every(c => ['A', 'B'].includes(c.tribe))).toBe(true);
  });

  it('gives the new tribe a coach when there are enough to go round', () => {
    // THREE COACHES, NOT TWO. The first draft of this arm used the two the
    // block sets up and demanded the new tribe get one — which two coaches
    // over three tribes cannot do, and calling that a failure would have been
    // asking the code for something arithmetic forbids. The claim is about
    // covering the board when the board CAN be covered.
    world([{ name: 'A', members: ['a1', 'a2'] }, { name: 'B', members: ['b1', 'b2'] },
      { name: 'New Tribe', members: ['n1', 'n2'] }],
    [{ name: 'C1', tribe: 'A' }, { name: 'C2', tribe: 'A' }, { name: 'C3', tribe: 'B' }]);
    reassignCoaches([{ name: 'A', members: ['a1', 'a2'] },
      { name: 'B', members: ['b1', 'b2'] }, { name: 'New Tribe', members: ['n1', 'n2'] }]);
    const load = spread(['A', 'B', 'New Tribe']);
    expect(load['New Tribe'], 'the new tribe opened with no coach and there were '
      + 'three to share out: ' + JSON.stringify(load)).toBeGreaterThan(0);
  });

  it('and leaves a tribe bare only when there are not enough coaches', () => {
    // Two coaches over three tribes: somebody goes without, and the honest
    // outcome is the even one rather than both staying where they started.
    reassignCoaches(tribes);
    const load = spread(['A', 'B', 'New Tribe']);
    expect(Object.values(load).filter(n => n === 0).length,
      'more than one tribe went without, with two coaches for three camps').toBe(1);
    expect(Math.max(...Object.values(load))).toBe(1);
  });

  it('and never leaves one tribe two ahead of another', () => {
    reassignCoaches(tribes);
    const load = Object.values(spread(['A', 'B', 'New Tribe']));
    expect(Math.max(...load) - Math.min(...load),
      'the coaches are still bunched: ' + JSON.stringify(spread(['A', 'B', 'New Tribe'])))
      .toBeLessThanOrEqual(1);
  });

  it('moves the coach with the least to lose', () => {
    // A staff who has been working with their camp all season is the last one
    // taken off it; a coach who has trained nobody there is the first.
    world([{ name: 'A', members: ['a1', 'a2'] }, { name: 'B', members: ['b1', 'b2'] },
      { name: 'New Tribe', members: ['n1'] }],
    [{ name: 'Rooted', tribe: 'A' }, { name: 'Adrift', tribe: 'A' }],
    { Rooted: { a1: { x: 1 }, a2: { x: 1 } }, Adrift: {} });
    reassignCoaches([{ name: 'A', members: ['a1', 'a2'] },
      { name: 'B', members: ['b1', 'b2'] }, { name: 'New Tribe', members: ['n1'] }]);
    const rooted = activeCoaches().find(c => c.name === 'Rooted');
    expect(rooted.tribe, 'the coach with two proteges at that camp was the one moved')
      .toBe('A');
  });
});

describe('a dissolve: a tribe really is gone', () => {
  it('still rescues the orphan, which is what it always did', () => {
    const tribes = world(
      [{ name: 'A', members: ['a1', 'a2'] }, { name: 'B', members: ['b1', 'b2'] }],
      [{ name: 'Coach A', tribe: 'A' }, { name: 'Coach C', tribe: 'Gone' }],
    );
    const moves = reassignCoaches(tribes);
    expect(activeCoaches().every(c => ['A', 'B'].includes(c.tribe)),
      'a coach was left on a camp that no longer exists').toBe(true);
    expect(moves.some(m => m.coach === 'Coach C')).toBe(true);
  });
});

describe('the levelling terminates and stays honest', () => {
  it('does not thrash when the count cannot divide evenly', () => {
    // Three coaches over two tribes is 2/1 and there is no better answer; a
    // loop that insisted on equality would move somebody back and forth for
    // ever, so the rule is "never two apart" rather than "always equal".
    const tribes = world(
      [{ name: 'A', members: ['a1'] }, { name: 'B', members: ['b1'] }],
      [{ name: 'C1', tribe: 'A' }, { name: 'C2', tribe: 'A' }, { name: 'C3', tribe: 'A' }],
    );
    const moves = reassignCoaches(tribes);
    const load = spread(['A', 'B']);
    expect(Math.max(load.A, load.B) - Math.min(load.A, load.B)).toBeLessThanOrEqual(1);
    expect(moves.length, 'moved more coaches than the imbalance needed')
      .toBeLessThanOrEqual(3);
  });

  it('leaves an already-even board alone', () => {
    const tribes = world(
      [{ name: 'A', members: ['a1'] }, { name: 'B', members: ['b1'] }],
      [{ name: 'C1', tribe: 'A' }, { name: 'C2', tribe: 'B' }],
    );
    const moves = reassignCoaches(tribes);
    expect(moves, 'shuffled coaches that were already spread evenly').toEqual([]);
  });
});
