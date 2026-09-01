// ══════════════════════════════════════════════════════════════════════
// tr-castle-belief-gate.test.js — the plan's FIRST global constraint,
// as a standing guard instead of a promise
// ══════════════════════════════════════════════════════════════════════
//
// The rule: castle events write ZERO beliefs. Belief writes belong to
// deduction.js, roundtable.js and murder.js — the three layers whose channels
// have been measured against a control (js/tr/channel-audit.js). A castle
// event is free to make the room FEEL something about somebody; it does not
// get to make the room RIGHT about somebody until its channel has been priced.
//
// Until this file existed, that rule was enforced by nothing. The whole-plan
// review proved it empirically: `learn(a, alignmentFactId(b), {...})` was
// added to two castle events and the entire tr suite stayed green, 101/101,
// including all twelve calibration bands. `gateChannel()` in
// js/tr/channel-audit.js is 555 lines of the right analysis with no production
// caller — a tool an author is trusted to run, which is not a guard.
//
// TWO GUARDS, BECAUSE ONE OF THEM CAN BE WALKED AROUND:
//
//   1. RUNTIME. Spy on knowledge.js's `learn` and play real seasons with the
//      castle pool live. Every call's stack is captured; not one of them may
//      have a js/tr/castle/ frame in it. This catches a belief write wherever
//      it is laundered through — a castle event calling a helper that calls
//      learn is still a castle event writing a belief.
//   2. COVERAGE. 20 real seasons only ever REACH about three quarters of the
//      pool, and a fix-round-2 re-review defeated this file by putting the
//      laundered write in one of the events the seasons never reached — a
//      whole family of eleven (callback) plus five romance, two trust and one
//      cover event, none of which fire without a franchise ledger the guard
//      did not install. The seasons now run on the same returnee fixture the
//      400-season sweep uses, AND a second arm executes every registered
//      event's fire() directly, at four different rolls so each side of every
//      fork runs. That arm asserts its own coverage over `EVENTS`, so a new
//      event cannot slip in unexercised: the assertion is a rule over the
//      pool, never a list of ids.
//   3. SOURCE. No file under js/tr/castle/ may import js/knowledge.js at all.
//      Cheaper, blunter, and it fails at the moment the import is typed rather
//      than at the moment a season happens to reach that event. It walks the
//      castle tree RECURSIVELY and catches `await import('...')` as well as a
//      static `from '...'`, because a non-static import is exactly what an
//      author reaching for the knowledge layer would find first.
//
// FILENAME. Deliberately NOT *-audit.test.js: vitest.config.js excludes that
// pattern from `npm test`, and this project has now shipped two guards into
// that hole. This one is collected by the ordinary run — verified by running
// it, not by reading the config.
import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { learnStacks } = vi.hoisted(() => ({ learnStacks: [] }));

// Wrap `learn` for every importer in this file's module graph — deduction.js,
// roundtable.js and murder.js included, so the spy's own liveness is provable
// (see the "guard on the guard" assertion below) rather than assumed.
vi.mock('../js/knowledge.js', async (importOriginal) => {
  const orig = await importOriginal();
  return {
    ...orig,
    learn: (...args) => {
      learnStacks.push(new Error('learn-call-site').stack || '');
      return orig.learn(...args);
    },
  };
});

import { gs, setGs, setPlayers } from '../js/core.js';
import { resetKnowledge } from '../js/knowledge.js';
import { initTraitorsState } from '../js/tr/state.js';
import { recordAlignment } from '../js/tr/roles.js';
import { createTraitorsSceneApi } from '../js/tr/scene-api.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { EVENTS } from '../js/tr/events.js';
import { seedFranchiseHistory } from './helpers/tr-castle-fixture.js';
import { PROBE_CAST, PROBE_EP, forkRng, probeWorld } from './helpers/tr-probe-world.js';
import roster from '../franchise_roster.json';

// Side-effect imports: headless.js already pulls the whole pool in, but the
// direct-execution arm reads EVENTS itself and must not depend on that.
import '../js/tr/castle/trust.js';
import '../js/tr/castle/suspicion.js';
import '../js/tr/castle/grief.js';
import '../js/tr/castle/cover.js';
import '../js/tr/castle/romance.js';
import '../js/tr/castle/callback.js';
import '../js/tr/castle/testing.js';
import '../js/tr/castle/journey.js';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
const GUARD_SEASONS = 20;

/** Windows stacks use backslashes; normalise before looking for the frame. */
const BACKSLASH = String.fromCharCode(92);
function hasCastleFrame(stack) {
  return stack.split(BACKSLASH).join('/').includes('/js/tr/castle/');
}

/** Line comments only — every file below discusses learn() in its own prose. */
function _stripComments(src) {
  return src.split(String.fromCharCode(10))
    .filter(l => !l.trim().startsWith('//')).join(String.fromCharCode(10));
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CASTLE_DIR = path.join(HERE, '..', 'js', 'tr', 'castle');

describe('CASTLE EVENTS WRITE ZERO BELIEFS (the plan\'s #1 constraint)', () => {
  it(`no learn() call in ${GUARD_SEASONS} real seasons originates inside js/tr/castle/`, () => {
    // Stack capture is the expensive part of this guard, and the default
    // limit of 10 frames is already more than enough to reach the castle
    // fire() from inside learn(): learn -> the wrapper -> fire -> pickEvent.
    const prevLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 10;
    learnStacks.length = 0;
    try {
      for (let i = 1; i <= GUARD_SEASONS; i++) {
        setPlayers(ROSTER);
        // WITHOUT THIS LINE the whole callback family (11 events), five
        // romance, two trust and one cover event never run inside this guard,
        // and a belief write parked in any of them stays green. Same fixture
        // as the 400-season sweep, deliberately.
        seedFranchiseHistory(CAST);
        playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
      }
    } finally {
      Error.stackTraceLimit = prevLimit;
    }

    // GUARD ON THE GUARD. If the mock ever stops being applied — a rename of
    // knowledge.js, a castle module importing through a different path, vitest
    // changing how factories resolve — the assertion below would pass on an
    // empty sample and this file would become the eighteenth test in this
    // project that cannot fail. The legitimate writers (deduction, roundtable,
    // murder) emit thousands of these per sixty seasons.
    expect(learnStacks.length,
      'the learn() spy recorded nothing at all — the mock is not wired, so the assertion below is vacuous')
      .toBeGreaterThan(100);

    const fromCastle = learnStacks.filter(hasCastleFrame);
    const sample = fromCastle.slice(0, 2).join('\n---\n');
    expect(fromCastle.length,
      `${fromCastle.length} of ${learnStacks.length} learn() calls came from a castle event:\n${sample}`)
      .toBe(0);
  });

  // ── ARM 2: EXECUTE EVERY EVENT, NOT THE ONES A SEASON HAPPENED TO REACH ──
  //
  // Seasons are the realistic arm; they are not the complete one, and this
  // guard's job is completeness. Here every registered event's fire() is run
  // directly in the probe world at four rolls, so both the rare events and
  // the far side of every fork execute. The coverage assertion below is what
  // stops this from silently narrowing again: it is derived from EVENTS, so
  // an event added tomorrow is covered the moment it is registered, or this
  // test goes red naming it.
  const SWEEP_ROLLS = [0.05, 0.35, 0.65, 0.95];

  it('every registered event\'s fire() runs here, and none of them reaches learn()', () => {
    const prevLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 10;
    learnStacks.length = 0;
    const ran = new Set();
    const inert = [];
    try {
      for (const ev of EVENTS) {
        let produced = false;
        for (const roll of SWEEP_ROLLS) {
          probeWorld({ aTraitor: true, bTraitor: true, turret: true });
          const ctx = { ep: PROBE_EP, window: ev.window, act: 'middle',
            living: [...PROBE_CAST], actors: [PROBE_CAST[0], PROBE_CAST[1]] };
          let out = null;
          try { out = ev.fire(ctx, forkRng(roll)); } catch { /* recorded as inert below */ }
          if (out != null) produced = true;
        }
        if (produced) ran.add(ev.id); else inert.push(ev.id);
      }
    } finally {
      Error.stackTraceLimit = prevLimit;
    }

    // COVERAGE, asserted as a rule over the pool. An event whose fire() cannot
    // be made to produce an outcome in the richest world this suite can build
    // is either dead content or content this guard cannot see inside — both
    // are reasons to go red, not to shrink the claim.
    expect(inert, 'these registered events produced no outcome at any roll, so the belief gate never looked inside them: ' + inert.join(', '))
      .toEqual([]);
    expect(ran.size, 'coverage regressed below the registry').toBe(EVENTS.length);

    const fromCastle = learnStacks.filter(hasCastleFrame);
    const sample = fromCastle.slice(0, 2).join('\n---\n');
    expect(fromCastle.length,
      fromCastle.length + ' learn() calls came from a castle event while executing the whole pool:' + sample)
      .toBe(0);
  });

  // ── ARM 4: THE SANCTIONED WRITE PATH IS A CLOSED SET ────────────────
  //
  // Plan 10 Task 4 gives a castle scene a way to move a belief that it did not
  // have before: `createTraitorsSceneApi(...).addBelief`, which delegates to
  // `sceneEvidence` in deduction.js — the file whose channels have been
  // measured against a control — and leaves a receipt naming the cause.
  //
  // That does not relax the three arms above and this arm is why. The three
  // arms forbid a castle FRAME from reaching learn(); this one forbids the
  // laundering route around them, which is a NEW importer of learn() appearing
  // anywhere under js/tr/. The set is closed and small, and js/tr/scene-api.js
  // is deliberately NOT in it: the write path a scene uses does not hold the
  // primitive, it asks the priced channel for one.
  const LEARN_IMPORTERS = ['deduction.js', 'murder-variants.js', 'powers.js',
    'roles.js', 'roundtable.js'];

  it('only the priced channels import learn(), and the scene API is not one of them', () => {
    const TR_DIR = path.join(HERE, '..', 'js', 'tr');
    const found = [];
    (function walk(dir) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { walk(full); continue; }
        if (!e.name.endsWith('.js')) continue;
        const src = _stripComments(fs.readFileSync(full, 'utf8'));
        // The IMPORT, not the word: these files discuss learn() in prose.
        if (/import\s*\{[^}]*\blearn\b[^}]*\}\s*from\s*['"][^'"]*knowledge\.js['"]/.test(src)) {
          found.push(path.relative(TR_DIR, full).split(BACKSLASH).join('/'));
        }
      }
    })(TR_DIR);
    expect(found.sort(), 'the set of files holding the belief primitive changed')
      .toEqual([...LEARN_IMPORTERS].sort());
    expect(found, 'the scene API must reach beliefs through the priced channel, not hold the primitive')
      .not.toContain('scene-api.js');
  });

  it('every belief the scene API writes leaves a receipt naming its cause', () => {
    setPlayers(ROSTER);
    setGs({ bonds: {}, activePlayers: CAST.slice(0, 5) });
    gs.tr = initTraitorsState();
    resetKnowledge();
    for (const n of CAST.slice(0, 5)) recordAlignment(n, false, 1, 'selection');

    learnStacks.length = 0;
    const api = createTraitorsSceneApi({ ep: 3 });
    api.addBelief(CAST[0], CAST[1], 0.5, { source: 'contradicted her dinner timeline' });

    // GUARD ON THE GUARD, again: if the write silently stopped happening this
    // assertion would pass on an empty sample.
    expect(learnStacks.length, 'the scene API wrote no belief at all').toBe(1);
    const written = (gs.tr.receipts || []).filter(r => r.kind === 'belief');
    expect(written.length, 'a belief was written with no receipt behind it').toBe(1);
    expect(written[0].source).toBe('contradicted her dinner timeline');
    // And the receipt cannot be forged: there is no way to record one without
    // performing the write, because the read surface has no writer on it.
    expect(typeof api.receipts).toBe('function');
    expect(Object.keys(api)).not.toContain('record');
  });

  it('no file under js/tr/castle/ imports js/knowledge.js', () => {
    const offenders = [];
    // RECURSIVE. A subdirectory under js/tr/castle/ is the cheapest way to put
    // a file outside a flat readdirSync, and it costs nothing to walk.
    const files = [];
    (function walk(dir) {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (e.name.endsWith('.js')) files.push(full);
      }
    })(CASTLE_DIR);
    expect(files.length, 'found no castle sources to scan — the path is wrong and this test is vacuous')
      .toBeGreaterThan(5);
    for (const full of files) {
      const src = fs.readFileSync(full, 'utf8');
      // Strip line comments so the family headers, which discuss learn() and
      // knowledge.js by name on purpose, do not read as violations.
      const code = src.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      // `from '...'` catches a static import or re-export; `import(` on its
      // own catches the dynamic form, which the old `from`-only pattern let
      // straight through.
      if (/(from|import)\s*\(?\s*['"][^'"]*knowledge\.js['"]/.test(code)) {
        offenders.push(path.relative(CASTLE_DIR, full));
      }
    }
    expect(offenders, `castle modules importing the knowledge layer: ${offenders.join(', ')}`).toEqual([]);
  });
});
