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
import { DRAG_STATS } from '../js/dr/queen.js';

const worker = readFileSync('worker/worker-studio.js', 'utf8');
const studio = readFileSync('js/studio.js', 'utf8');
const serve = readFileSync('serve.py', 'utf8');
const sql = readFileSync('worker/roster_drag_migration.sql', 'utf8');

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
});
