// ══════════════════════════════════════════════════════════════════════
// tr-castle-write-path.test.js — a castle scene changes the season through
// js/tr/scene-api.js, or it does not change it
// ══════════════════════════════════════════════════════════════════════
//
// WHAT THIS IS FOR. Task 4 built `createTraitorsSceneApi()` and its docblock
// as THE single write path for every castle consequence, with a
// machine-readable receipt on every write. For the whole of its first life
// **no file under js/tr/castle/ imported it**. All 98 events called `addBond`
// and the thread writers directly, so not one castle scene left a receipt,
// `tr-debug` had nothing to show, and the contract was a comment. The
// migration that fixed that is worth exactly as much as the rule that keeps
// it — without this file the next author copies whichever call shape they
// find first, and half the library drifts back off the API one event at a
// time.
//
// THE PATTERN IS NOT NEW HERE. js/tr/crowd.js owns the audience ledgers and
// tests/tr-audience.test.js enforces that ownership over the raw source; that
// same rule caught a violation committed inside Task 4's own code, by the
// author of the file that states it. So it works, and it is copied
// deliberately — including its two anti-vacuity arms, because a source-text
// guard that stops matching its own target goes quietly green and a sweep
// that scans nothing passes forever.
//
// THREE ARMS, AND THE THIRD IS THE ONE THAT CANNOT BE FOOLED BY WORDING:
//
//   1. The sweep is real: it finds the files, and the file that is SUPPOSED
//      to match the write-path pattern still matches it.
//   2. No castle file reaches a ledger directly — not bonds.js's writers, not
//      the thread writers, not the belief store, not knowledge.js, not the
//      crowd ledger's own writer. `getBond` is allowed by name: it is a pure
//      getter with no write, and refusing it would push events into reading
//      `gs.bonds` by hand, which is worse.
//   3. Every registered event, fired for real, produces at least one receipt.
//      Arm 2 is about import lines and could in principle be satisfied by an
//      event that writes nothing at all; this one executes the pool.
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { EVENTS } from '../js/tr/events.js';
import { createTraitorsSceneApi } from '../js/tr/scene-api.js';
import * as threads from '../js/tr/threads.js';
import * as bonds from '../js/bonds.js';
import { PROBE_CAST, PROBE_EP, forkRng, probeWorld } from './helpers/tr-probe-world.js';

import '../js/tr/castle/trust.js';
import '../js/tr/castle/suspicion.js';
import '../js/tr/castle/grief.js';
import '../js/tr/castle/cover.js';
import '../js/tr/castle/romance.js';
import '../js/tr/castle/callback.js';
import '../js/tr/castle/testing.js';
import '../js/tr/castle/journey.js';
import '../js/tr/castle/mission-fallout.js';

const CASTLE_DIR = path.join(process.cwd(), 'js', 'tr', 'castle');

/** The one file allowed to hold the write path, because it IS the write path. */
const OWNER = 'effects.js';

/** Files with no events in them; they hold line pools and window tables. */
const CONTENT_ONLY = new Set(['lines.js', 'phases.js']);

const FILES = fs.readdirSync(CASTLE_DIR).filter(f => f.endsWith('.js'));
const read = f => fs.readFileSync(path.join(CASTLE_DIR, f), 'utf8');

/**
 * The names a castle file may NOT import, per module it might import them
 * from. Denylists, not allowlists, for the thread and belief stores: a
 * denylist names the writers, so a READER added to threads.js tomorrow is
 * available immediately and a WRITER added tomorrow is not silently allowed —
 * and arm 1 checks every name on it still exists, so a rename goes red rather
 * than quiet.
 */
const FORBIDDEN = {
  "'../threads.js'": ['openThread', 'advanceThread', 'closeThread', 'abandonThread',
    'continueThread', 'advanceCiting'],
  "'../deduction.js'": ['sceneEvidence', 'sceneDoubt', 'recordFact', 'seedTraitorKnowledge'],
  "'../crowd.js'": ['crowdMoment'],
};

/** bonds.js is the other way round: one name in, everything else out. */
const BONDS_ALLOWED = new Set(['getBond']);

/** Modules a castle event may not import from AT ALL. */
const FORBIDDEN_MODULES = [
  "'../../knowledge.js'",   // learn() is the belief store's own front door
  "'../scene-api.js'",      // the API is taken from ctx via effects.js, never minted per call
];

/** `import { a, b } from 'x';` -> [{ names, from }], multi-line tolerant. */
function importsOf(src) {
  const out = [];
  const re = /import\s*(?:\{([^}]*)\}|(\*\s*as\s+\w+)|(\w+))\s*from\s*('[^']+')/g;
  let m;
  while ((m = re.exec(src))) {
    const names = (m[1] || m[2] || m[3] || '')
      .split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
    out.push({ names, from: m[4] });
  }
  return out;
}

describe('the castle writes through the scene API and through nothing else', () => {
  it('scans a real tree, and the file that must match the pattern still matches it', () => {
    // ANTI-VACUITY 1: the sweep found the library.
    expect(FILES.length, 'the js/tr/castle sweep found almost no files').toBeGreaterThan(8);
    expect(FILES).toContain(OWNER);
    // ANTI-VACUITY 2: the write path still exists where this file says it is.
    expect(read(OWNER)).toMatch(/from '\.\.\/scene-api\.js'/);
    expect(read(OWNER)).toMatch(/export function sceneApi\(/);
    // ANTI-VACUITY 3: every forbidden name is a real export. A writer that
    // gets renamed must redden this file rather than fall off the denylist.
    for (const n of FORBIDDEN["'../threads.js'"]) {
      expect(threads[n], `threads.js no longer exports ${n} — update the denylist`).toBeTypeOf('function');
    }
    for (const n of BONDS_ALLOWED) {
      expect(bonds[n], `bonds.js no longer exports ${n}`).toBeTypeOf('function');
    }
    expect(bonds.addBond, 'bonds.js no longer exports addBond').toBeTypeOf('function');
  });

  it('reaches no ledger directly — not bonds, not the story log, not the belief store', () => {
    const offenders = [];
    for (const f of FILES) {
      if (f === OWNER) continue;
      for (const imp of importsOf(read(f))) {
        if (FORBIDDEN_MODULES.includes(imp.from)) {
          offenders.push(`${f} imports ${imp.from}`);
          continue;
        }
        if (imp.from === "'../../bonds.js'") {
          for (const n of imp.names) {
            if (!BONDS_ALLOWED.has(n)) offenders.push(`${f} imports ${n} from bonds.js`);
          }
        }
        const banned = FORBIDDEN[imp.from] || [];
        for (const n of imp.names) {
          if (banned.includes(n)) offenders.push(`${f} imports ${n} from ${imp.from}`);
        }
      }
    }
    expect(offenders,
      'a castle file reached a ledger directly. Every write goes through the scene API '
      + '(see js/tr/castle/effects.js); pure getters are allowed by name, one at a time.')
      .toEqual([]);
  });

  it('and the rule is not vacuous: it flags a direct import when one is put back', () => {
    // THE MUTATION, RUN RATHER THAN ASSERTED. The predicate above is applied
    // to a source string that reintroduces exactly the shape the migration
    // removed. If this comes back empty the arm above is decorative.
    const mutant = [
      "import { addBond, getBond } from '../../bonds.js';",
      "import { openThread, findOpenThread } from '../threads.js';",
      "import { learn } from '../../knowledge.js';",
    ].join('\n');
    const flagged = [];
    for (const imp of importsOf(mutant)) {
      if (FORBIDDEN_MODULES.includes(imp.from)) flagged.push(imp.from);
      if (imp.from === "'../../bonds.js'") {
        for (const n of imp.names) if (!BONDS_ALLOWED.has(n)) flagged.push(n);
      }
      for (const n of imp.names) if ((FORBIDDEN[imp.from] || []).includes(n)) flagged.push(n);
    }
    expect(flagged).toContain('addBond');
    expect(flagged).toContain('openThread');
    expect(flagged).toContain("'../../knowledge.js'");
    // and the reads it must NOT flag, or the rule is unusable
    expect(flagged).not.toContain('getBond');
    expect(flagged).not.toContain('findOpenThread');
  });

  it('every event that fires writes a receipt', () => {
    // ARM 3, THE BEHAVIOURAL ONE. An import rule cannot tell an event that
    // writes through the API from one that writes nothing; this executes every
    // registered event in the probe world at four rolls and reads back what
    // the API recorded. Four rolls because the fork in this pool is taken off
    // the first draw — the same sweep tr-castle-belief-gate.test.js uses.
    const ROLLS = [0.05, 0.35, 0.65, 0.95];
    const silent = [];
    for (const ev of EVENTS) {
      let receipts = 0;
      for (const roll of ROLLS) {
        probeWorld({ aTraitor: true, bTraitor: true, turret: true });
        const api = createTraitorsSceneApi({ ep: PROBE_EP, eventId: ev.id,
          sceneId: `probe:${ev.id}` });
        const ctx = { ep: PROBE_EP, window: ev.window, act: 'middle',
          living: [...PROBE_CAST], actors: [PROBE_CAST[0], PROBE_CAST[1]], api };
        try { ev.fire(ctx, forkRng(roll)); } catch { /* counted as silent below */ }
        receipts += api.receipts().length;
      }
      if (!receipts) silent.push(ev.id);
    }
    expect(silent,
      'these events fired and the scene API recorded nothing, so either they change '
      + 'nothing or they changed it behind the API: ' + silent.join(', '))
      .toEqual([]);
    expect(EVENTS.length, 'the castle registry emptied').toBeGreaterThan(90);
  });
});
