// ══════════════════════════════════════════════════════════════════════
// dr-studio-drag.test.js — the drag block survives every hop
// ══════════════════════════════════════════════════════════════════════
//
// A SOURCE GUARD, because the Studio is DOM-bound and the worker is
// Cloudflare-bound, and the failure this catches is silent in both.
//
// The bug it exists for has happened twice (memory: publish wipes authored
// fields). Publish REGENERATES franchise_roster.json wholesale from D1, so a
// field the worker does not carry is not "missing from the database" — it is
// deleted from the roster the next time somebody presses the button. Editing
// it in the Studio appears to work, survives a reload, and is gone.
//
// So the assertions are on the WORKER first: the column, the write, and the
// read back. The Studio's own inputs come second.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DRAG_STATS } from '../js/dr/queen.js';

/* ── READ THE TREE THIS TEST LIVES IN, NOT THE PROCESS'S CWD ──
   These were plain relative paths, which node resolves against the working
   directory — and vitest runs from wherever the config root is. Run from a git
   WORKTREE, that is the main checkout: the guard read main's js/studio.js and
   reported on a file the branch had already changed. It passed for code that
   was not there and failed for code that was, and neither result said which
   file it had opened.
   A source guard is only a guard if it reads the source next to it. */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(ROOT, rel), 'utf8');

const worker = read('worker/worker-studio.js');
const studio = read('js/studio.js');
const serve = read('serve.py');
const sql = read('worker/roster_drag_migration.sql');

describe('the drag block survives every hop', () => {
  it('D1 has the column', () => {
    expect(sql).toMatch(/ALTER TABLE roster ADD COLUMN drag TEXT/);
  });

  it('the worker writes it and reads it back', () => {
    // Named in the published-field list...
    expect(worker).toMatch(/ROSTER_FIELDS = \[[^\]]*'drag'/);
    // ...written on insert and on conflict...
    expect(worker).toMatch(/drag=excluded\.drag/);
    // ...and turned back into an object when a row is read.
    expect(worker).toMatch(/JSON\.parse\(r\.drag\)/);
  });

  it('the worker validates it rather than trusting the client', () => {
    // Only real craft keys, clamped. A typo must not become a column of junk,
    // the same rule the nine stats already follow.
    expect(worker).toMatch(/DRAG_KEYS/);
    expect(worker).toMatch(/Math\.max\(1, *Math\.min\(10/);
  });

  it('the Studio sends it and can edit every craft stat', () => {
    expect(studio).toMatch(/entry\.drag/);
    // The panel loops over its key list rather than enumerating seven inputs,
    // so the guard is on the LIST rather than on seven literals: what can
    // actually go wrong is the Studio's list drifting from the engine's, which
    // would silently make one craft stat uneditable and permanently 5.
    const listed = studio.match(/const DRAG_KEYS = \[([^\]]+)\]/);
    expect(listed, 'the Studio has no craft key list').toBeTruthy();
    const keys = listed[1].split(',').map(x => x.trim().replace(/^'|'$/g, '')).filter(Boolean);
    expect(keys, 'the Studio and js/dr/queen.js disagree about the craft stats')
      .toEqual([...DRAG_STATS]);
    expect(studio, 'the sliders are not bound to the craft list').toMatch(/data-dk="\$\{k\}"/);
    // And the style and traits, which are not numbers.
    expect(studio).toMatch(/st-f-drag-style/);
    expect(studio).toMatch(/st-f-drag-traits/);
  });

  it('the local server keeps it too', () => {
    // serve.py writes franchise_roster.json directly when the Studio is used
    // against the local server rather than the worker.
    expect(serve).toMatch(/'drag'/);
  });

  /* ── THE TWO HOPS THIS FILE DID NOT COVER, AND THEY ARE THE ONES THAT
     ACTUALLY LOST THE DATA ──
     Everything above asserts the field can be SAVED. Neither of these is
     about saving: they are about it surviving between saves, and with all
     five checks above green an author still set craft on a dozen queens and
     lost every value. See §8.1 of docs/ADDING-A-SHOW.md for the six links. */

  it('the offline draft carries it, so a failed write is not a loss', () => {
    // The IndexedDB `characters` record is the local copy of everything the
    // editor holds, and it lists its fields BY HAND — so a new field is
    // absent by default rather than by decision. It carried the bio prose
    // and the nine stats and not the seven craft numbers, which left the
    // craft with no home outside the roster projection.
    const rich = studio.match(/const rich = \{[\s\S]*?\};/);
    expect(rich, 'the IndexedDB draft record moved or was renamed').toBeTruthy();
    expect(rich[0], 'the offline draft does not keep the craft').toMatch(/drag:/);
  });

  it('a roster pull cannot delete a field the server does not carry', () => {
    /* THE ONE THAT DESTROYED THE WORK. `_rosterPull` replaced the local
       roster wholesale with whatever D1 returned. The deployed worker was
       older than the drag support, so the response carried no craft — and
       every Studio load quietly overwrote a roster that HAD craft with one
       that did not. No error, no button, nothing on screen.

       The server owns the LIST of players; it must not own the set of
       fields. Asserted on the spread, because that is the whole fix: a bare
       `_persistRoster(j.players.map(...))` with no merge is the bug. */
    const pull = studio.match(/async function _rosterPull\(\)[\s\S]*?\n\}/);
    expect(pull, '_rosterPull moved or was renamed').toBeTruthy();
    const body = pull[0];
    expect(body, 'the pull does not read what is already local')
      .toMatch(/_roster\(\)/);
    expect(body, 'the pull replaces the local roster instead of merging onto it')
      .toMatch(/\.\.\.was,\s*\.\.\.p|\.\.\.prev|\.\.\.existing/);
  });
});
