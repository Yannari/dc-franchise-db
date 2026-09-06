// ══════════════════════════════════════════════════════════════════════
// expansion-uses-a-configured-name.test.js — the fourth tribe is yours
// ══════════════════════════════════════════════════════════════════════
//
// Reported: "can tribe expansion use the name of the team unused in setup
// instead of using New Tribe as name and a random color?"
//
// Both halves are one cause. `tribeColor` (js/players.js) looks a name up in
// `seasonConfig.tribes` and, finding nothing, hashes the string into a palette.
// So "New Tribe" never got a RANDOM colour — it got the hash of the words "New
// Tribe", the same wrong colour every season, belonging to no tribe the author
// ever configured. Take a name the author actually wrote and the colour follows
// it home with no second lookup and no new field.
import { describe, it, expect } from 'vitest';
import { gs, seasonConfig, setGs } from '../js/core.js';
import { tribeColor } from '../js/players.js';
import { applyTwist } from '../js/twists.js';

const CAST = Array.from({ length: 12 }, (_, i) => 'P' + (i + 1));

function world(configured) {
  seasonConfig.tribes = configured;
  setGs({
    ...gs,
    phase: 'pre-merge',
    isMerged: false,
    activePlayers: [...CAST],
    tribes: [
      { name: 'Screaming Gophers', members: CAST.slice(0, 6) },
      { name: 'Killer Bass', members: CAST.slice(6) },
    ],
    idolSlots: {},
    episode: 4,
  });
}
const expand = () => {
  const ep = { num: 4, twists: [] };
  applyTwist(ep, { type: 'tribe-expansion' }, 'tribe-expansion');
  return ep;
};

describe('with a spare name in setup', () => {
  it('uses it instead of the literal', () => {
    world([
      { name: 'Screaming Gophers', color: '#22c55e' },
      { name: 'Killer Bass', color: '#ef4444' },
      { name: 'Toxic Rats', color: '#a855f7' },
    ]);
    expand();
    const names = gs.tribes.map(t => t.name);
    expect(names, 'the expansion invented a tribe the author never named')
      .not.toContain('New Tribe');
    expect(names).toContain('Toxic Rats');
  });

  it('and the colour comes with it, which was the other half of the report', () => {
    world([
      { name: 'Screaming Gophers', color: '#22c55e' },
      { name: 'Killer Bass', color: '#ef4444' },
      { name: 'Toxic Rats', color: '#a855f7' },
    ]);
    expand();
    expect(tribeColor('Toxic Rats'), 'the new tribe is not wearing the colour it was '
      + 'given in setup').toBe('#a855f7');
  });

  it('never picks a name that is already on the board', () => {
    // The spare is the point: reusing a live name would put two tribes under
    // one banner and one colour, which is worse than the literal it replaces.
    world([
      { name: 'Screaming Gophers', color: '#22c55e' },
      { name: 'Killer Bass', color: '#ef4444' },
      { name: 'Toxic Rats', color: '#a855f7' },
    ]);
    expand();
    const names = gs.tribes.map(t => t.name);
    expect(new Set(names).size, 'two tribes came out with the same name')
      .toBe(names.length);
  });

  it('takes the FIRST spare, so a season with two spares is predictable', () => {
    world([
      { name: 'Screaming Gophers', color: '#22c55e' },
      { name: 'Killer Bass', color: '#ef4444' },
      { name: 'Toxic Rats', color: '#a855f7' },
      { name: 'Mutant Maggots', color: '#f59e0b' },
    ]);
    expand();
    expect(gs.tribes.map(t => t.name)).toContain('Toxic Rats');
    expect(gs.tribes.map(t => t.name)).not.toContain('Mutant Maggots');
  });
});

describe('with nothing spare', () => {
  it('still runs, on a setup that never planned for the twist', () => {
    // The twist cannot refuse to fire because the author configured exactly as
    // many tribes as they started with — which is the ordinary case.
    world([
      { name: 'Screaming Gophers', color: '#22c55e' },
      { name: 'Killer Bass', color: '#ef4444' },
    ]);
    expand();
    expect(gs.tribes.length, 'the expansion did not happen at all').toBe(3);
    expect(gs.tribes.map(t => t.name)).toContain('New Tribe');
  });

  it('and with no configured tribes at all', () => {
    world([]);
    expand();
    expect(gs.tribes.length).toBe(3);
    expect(gs.tribes.map(t => t.name)).toContain('New Tribe');
  });
});
