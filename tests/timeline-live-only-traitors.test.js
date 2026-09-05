// ══════════════════════════════════════════════════════════════════════
// timeline-live-only-traitors.test.js — a projection must not pose as live
// ══════════════════════════════════════════════════════════════════════
//
// Reported: "the season timeline live changing doesn't work for total drama —
// limit it to the traitors."
//
// `buildEpisodeMap` reads the REAL nights off the season's rows for a castle
// and only for a castle. A Traitors season is decided in one call, so every
// night is already on `episodeHistory` or `_trQueue` carrying the `exits` it
// actually made, and the timeline can report what happened.
//
// Total Drama and Big Brother have no such branch — they fall through to the
// PROJECTION, a count derived from seasonConfig before a single episode has
// run. Redrawing that after every episode re-renders the same guess, and where
// the guess has drifted from the season (a medevac, a quit, a twist that took
// two) it redraws a number that is now wrong, repeatedly, while looking like a
// live figure. A projection presented as live is worse than one left alone.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runUi = fs.readFileSync(path.join(ROOT, 'js/run-ui.js'), 'utf8');

describe('the live timeline refresh', () => {
  it('is gated to the show whose rows it can read', () => {
    const at = runUi.indexOf('LIVE-UPDATE THE SEASON TIMELINE');
    expect(at, 'the live-update block is gone').toBeGreaterThan(-1);
    const block = runUi.slice(at, at + 1600);
    expect(block).toContain('isTraitorsSeason()');
    // The call must be INSIDE the gate, not beside it.
    const gate = block.indexOf('if (isTraitorsSeason())');
    const call = block.indexOf('renderTimeline()');
    expect(gate, 'no gate around the refresh').toBeGreaterThan(-1);
    expect(call, 'the refresh is called before the gate').toBeGreaterThan(gate);
  });

  it('asks the shared question rather than re-deriving the format', () => {
    // `isTraitorsSeason()` is the one place that answers this; a local
    // `seasonConfig.format === 'traitors'` here would be the duplicated show
    // list docs/ADDING-A-SHOW.md is written about.
    const at = runUi.indexOf('LIVE-UPDATE THE SEASON TIMELINE');
    const block = runUi.slice(at, at + 1600);
    expect(block, 'the gate re-derives the format instead of asking')
      .not.toMatch(/format\s*===\s*'traitors'/);
  });

  it('leaves the other callers alone', () => {
    // renderTimeline() is drawn from the setup screen and every twist edit,
    // and those are right for every show — the projection IS what the setup
    // screen is for. Only the per-episode refresh was claiming to be live.
    const calls = [...runUi.matchAll(/renderTimeline\(\)/g)].length;
    expect(calls, 'the other timeline callers were removed').toBeGreaterThan(5);
  });
});

describe('buildEpisodeMap reads real rows for exactly one format', () => {
  it('has a castle branch that reads the season, and no other', () => {
    const fn = runUi.slice(runUi.indexOf('export function buildEpisodeMap'),
      runUi.indexOf('export function buildEpisodeMap') + 9000);
    // The castle branch reads the rows the engine actually produced.
    expect(fn).toContain("_fmt === 'traitors'");
    expect(fn).toMatch(/episodeHistory[\s\S]{0,80}_trQueue/);
    // And nothing else does. If a Big Brother or Total Drama branch ever reads
    // episodeHistory here, the gate above should be widened to match it —
    // this fails to make that a decision rather than a drift.
    const beforeCastle = fn.slice(0, fn.indexOf("_fmt === 'traitors'"));
    expect(beforeCastle, 'another format reads the season rows now — widen the gate')
      .not.toMatch(/gs\s*&&\s*gs\.episodeHistory/);
  });
});
