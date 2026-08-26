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
//   2. SOURCE. No file under js/tr/castle/ may import js/knowledge.js at all.
//      Cheaper, blunter, and it fails at the moment the import is typed rather
//      than at the moment a season happens to reach that event.
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

import { setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
const GUARD_SEASONS = 20;

/** Windows stacks use backslashes; normalise before looking for the frame. */
const BACKSLASH = String.fromCharCode(92);
function hasCastleFrame(stack) {
  return stack.split(BACKSLASH).join('/').includes('/js/tr/castle/');
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

  it('no file under js/tr/castle/ imports js/knowledge.js', () => {
    const offenders = [];
    for (const f of fs.readdirSync(CASTLE_DIR).filter(n => n.endsWith('.js'))) {
      const src = fs.readFileSync(path.join(CASTLE_DIR, f), 'utf8');
      // Strip line comments so the family headers, which discuss learn() and
      // knowledge.js by name on purpose, do not read as violations.
      const code = src.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      if (/from\s+['"][^'"]*knowledge\.js['"]/.test(code)) offenders.push(f);
    }
    expect(offenders, `castle modules importing the knowledge layer: ${offenders.join(', ')}`).toEqual([]);
  });
});
