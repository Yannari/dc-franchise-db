// ══════════════════════════════════════════════════════════════════════
// tr-conclave-forced.test.js — the night the pact names one of its own
// ══════════════════════════════════════════════════════════════════════
//
// Reported as an engine bug: "traitor eliminated a traitor in the conclave".
//
// THE ENGINE WAS RIGHT. `name-your-own` (js/tr/murder-variants.js) exists to
// thin a pact that has got comfortable; it fires at three living Traitors and
// it is the format doing what it is meant to do. What was wrong was the
// SCREEN, which narrated that night in the words of an ordinary one and so
// read as the wrong person having been picked. From the reported transcript:
//
//   host   "Tonight, each Traitor may propose a player to remove"
//   host   "Several players may be proposed, but the group can select only one"
//   II     "the meeting begins with each Traitor allowed to argue for one name"
//   II     SPENCER · "Has an answer, and is prepared to be talked out of it"
//          — of the man the room is naming, two cards before "No argument"
//   VI     "It cost the pact nothing." On the night it lost a third of itself.
//   VII    "Spencer is selected as tonight's target", of a Traitor in the cloak
//   VIII   "The hardest part of tonight was deciding" — nobody decided anything
//
// Seven sentences, one cause: pools written for a night with a meeting, a
// shortlist and a castle to choose from, read on a night that has none of
// those. It is the `plain-sight` defect (see PLAIN_SIGHT_TEXT and `soloNote`
// in js/vp-tr/conclave.js) in a second variant, and it was found the same way
// both times — by rendering the screen as text and reading it.
//
// ── WHY THE GUARD IMPORTS THE POOLS INSTEAD OF QUOTING THEM ──────────
//
// A retyped list of forbidden phrases agrees with itself forever. Reword a
// line in conclave.js and the guard keeps passing while the bug walks back in
// under new words — the matcher-never-matches trap this repo has now hit in
// three separate files. So the pools are imported, and the CONTROL ARM asserts
// each one really is being read on ordinary nights before anything asserts it
// is absent from forced ones. A pool that has fallen out of use entirely fails
// here rather than silently satisfying the absence check.
import { describe, it, expect } from 'vitest';
import { gs, setPlayers, seasonConfig } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { alignmentAt } from '../js/tr/roles.js';
import { rpBuildConclave, _ORDINARY_POOLS } from '../js/vp-tr/conclave.js';
import roster from '../franchise_roster.json';

// EVERY MURDER SHAPE TICKED ON, because this sweep is ABOUT them.
// They no longer come up on their own — the author opts in, after a
// Traitor being murdered by their own pact read as a bug twice over
// (tests/tr-twists-are-opt-in.test.js) — so a sweep that needs a Double
// or a Plain Sight to exist has to ask for one. Relying on the draw was
// always the weaker arrangement: these arms went vacuous the moment the
// default changed, which is exactly what a state reached by luck does.
const ALL_MURDER_TWISTS = ['on-trial', 'plain-sight', 'face-to-face',
  'dungeon', 'double', 'name-your-own'];

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

/** Every forced night and every ordinary night across a sweep of seasons. */
function sweep(seeds) {
  const forced = [], ordinary = [];
  for (const seed of seeds) {
    setPlayers(ROSTER);
    seasonConfig.trShieldSource = 'mission';
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed ,
      randomMurderTwists: ALL_MURDER_TWISTS });
    for (const ep of gs.episodeHistory || []) {
      const c = ep.tr && ep.tr.conclave;
      if (!c) continue;
      // ALIGNMENT IS READ HERE, INSIDE THE LOOP, and it has to be: every
      // reader in js/tr/roles.js resolves against the LIVE `gs`, and the next
      // seed replaces that wholesale. Asking afterwards returns seed 30's
      // answer to a question about seed 3, which is how the first version of
      // this arm reported a Traitor as a Faithful.
      const row = { ep: { ...ep }, rec: c, seed,
        alignment: alignmentAt(c.target, ep.num),
        html: rpBuildConclave({ ...ep }, 'audience') };
      if (c.variant === 'name-your-own') forced.push(row);
      else if (c.variant === 'standard') ordinary.push(row);
    }
  }
  return { forced, ordinary };
}

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);
const { forced, ordinary } = sweep(SEEDS);

/** Flat list of the literal sentences an ordinary night is written in. */
const ORDINARY_LINES = Object.entries(_ORDINARY_POOLS).flatMap(([pool, v]) =>
  (Array.isArray(v) ? v : Object.values(v).flat()).map(line => ({ pool, line })));

describe('the sweep reached the night at all', () => {
  it('played some forced nights and plenty of ordinary ones', () => {
    // Without this the two arms below pass by having nothing to check, which
    // is how the first version of half the guards in this repo passed.
    expect(forced.length, 'no name-your-own night in 30 seasons — the arms are vacuous')
      .toBeGreaterThan(2);
    expect(ordinary.length).toBeGreaterThan(30);
  });
});

describe('the engine is doing what it is meant to', () => {
  it('names a living Traitor, which is the whole variant', () => {
    // The report was that this is a bug. It is not, and the guard says so in
    // the one place somebody will look next time: the victim IS in the cloak,
    // by design, and the pact is thinner for it.
    for (const f of forced) {
      expect(f.alignment,
        `seed ${f.seed} ep ${f.ep.num}: ${f.rec.target} was named but is not a Traitor`)
        .toBe('traitor');
      expect(f.rec.turret, 'the named Traitor was not in the turret')
        .toContain(f.rec.target);
      expect(f.rec.argued || [], 'a forced night argued something').toHaveLength(0);
    }
  });
});

describe('the control arm: these pools are live', () => {
  it('every ordinary pool is actually read on ordinary nights', () => {
    const all = ordinary.map(o => o.html).join('\n');
    const dead = [];
    for (const [pool, v] of Object.entries(_ORDINARY_POOLS)) {
      const lines = Array.isArray(v) ? v : Object.values(v).flat();
      if (!lines.some(l => all.includes(l))) dead.push(pool);
    }
    expect(dead, 'these pools reached no ordinary night, so their absence from a '
      + 'forced night proves nothing — either they are dead code or the matcher '
      + 'has drifted from the prose').toEqual([]);
  });
});

describe('a forced night is not narrated as an ordinary one', () => {
  it('reads no sentence written for a night with a meeting and a choice', () => {
    const hits = [];
    for (const f of forced) {
      for (const { pool, line } of ORDINARY_LINES) {
        if (f.html.includes(line)) {
          hits.push(`seed ${f.seed} ep ${f.ep.num} reads ${pool}: "${line.slice(0, 72)}…"`);
        }
      }
    }
    expect(hits, 'a forced night is being narrated in the words of an ordinary one')
      .toEqual([]);
  });

  it('never tells the audience the night was free', () => {
    // The loudest line in the report, stated directly as well as via the pool
    // above, because it is the one a future edit is most likely to reintroduce
    // by writing a new "quiet" line rather than by reusing an old one.
    for (const f of forced) {
      expect(f.html, `seed ${f.seed} ep ${f.ep.num}: the ledger says the pact paid nothing`)
        .not.toMatch(/cost (the pact|them) nothing|not expensive|Nothing was spent/i);
    }
  });

  it('says out loud that the name belongs to the pact', () => {
    for (const f of forced) {
      expect(f.html, `seed ${f.seed} ep ${f.ep.num}: the decision card never says the `
        + 'name is a Traitor, so it reads as the wrong person having been picked')
        .toMatch(/a Traitor, sitting in this room/);
    }
  });
});
