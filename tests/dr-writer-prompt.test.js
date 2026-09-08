// ══════════════════════════════════════════════════════════════════════
// tests/dr-writer-prompt.test.js — what the episode writer is told
// ══════════════════════════════════════════════════════════════════════
//
// The writer is the one part of this system that can invent, which makes the
// prompt and the beat sheet the only things standing between a finished
// season and a script about a show that does not exist. The failure mode is
// specific and has happened before on Big Brother: given a prompt describing
// a different format, the model reconciles the difference by improvising, and
// the improvisation is where the facts go.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildDragBeatSheet, dragBeatSheetText } from '../js/dr/writer.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const worker = readFileSync('worker/worker-episode-live.js', 'utf8');

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

function cast(n, seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: {
      acting: r(), comedy: r(), dance: r(), design: r(), runway: r(),
      lipsync: r(), singing: r(), voice: 'Dry, fast, never explains the joke.',
    },
  }));
}

const CAST = cast(12, 1300);
const PLAYERS = Object.fromEntries(CAST.map(p => [p.name, p]));
const { rows } = playDragSeason({ cast: CAST, seed: 2 });

describe('the worker knows this show', () => {
  it('has its own override block, not a fallback to another show', () => {
    expect(worker).toMatch(/DR_OVERRIDE/);
    expect(worker).toMatch(/function isDragRace/);
    const block = worker.slice(worker.indexOf('const DR_OVERRIDE'));
    expect(block).toMatch(/maxi challenge/i);
    expect(block).toMatch(/runway/i);
    expect(block).toMatch(/lip sync/i);
    expect(block).toMatch(/werk room/i);
  });

  it('is actually reached — every override site branches on it', () => {
    /* THE BUG CLASS THIS PROJECT KEEPS HITTING: a block that is written,
       correct, and never selected. The Big Brother override is chosen at
       three separate sites and a drag season must be chosen at all three, or
       one pipeline stage silently writes a Total Drama episode. */
    const bbSites = worker.match(/isBigBrother\(/g) || [];
    const drSites = worker.match(/isDragRace\(/g) || [];
    // One definition plus one call per site, on both shows.
    expect(drSites.length, 'drag is checked at fewer sites than Big Brother')
      .toBeGreaterThanOrEqual(bbSites.length - 1);
  });

  it('tells the writer outright that there is no vote', () => {
    const block = worker.slice(worker.indexOf('const DR_OVERRIDE'),
      worker.indexOf('const DR_OVERRIDE') + 8000);
    expect(block).toMatch(/THERE IS NO VOTE/);
    expect(block).toMatch(/no jury|no ballot/i);
    // And the distinction that costs the show its biggest scene.
    expect(block).toMatch(/NAMED IN THE BOTTOM/);
  });

  it('has its own ranking-blurb examples', () => {
    // The examples ARE the tone specification. A show with none gets the
    // instruction alone — which is recoverable — but this one should have
    // its own rather than rely on that.
    expect(worker).toMatch(/"Drag Race": \[/);
    const i = worker.indexOf('"Drag Race": [');
    const block = worker.slice(i, worker.indexOf('],', i));
    expect(foreignWordsIn(block.toLowerCase(), 'drag-race')).toEqual([]);
  });
});

describe('the beat sheet', () => {
  const row = rows[3];
  const sheet = buildDragBeatSheet(row, { players: PLAYERS });
  const text = sheet.beats.join('\n');

  it('carries the episode in order and nothing invented', () => {
    expect(sheet.header).toMatch(/Episode 4/);
    expect(sheet.beats.length).toBeGreaterThan(8);
    expect(text).toContain(row.dr.challenge.name);
    for (const n of row.dr.call.bottom) expect(text).toContain(n);
  });

  it('states the mechanism, so the writer does not invent a vote', () => {
    const lower = text.toLowerCase();
    expect(lower).toMatch(/there is no ballot/);
    expect(lower).toMatch(/panel/);
    // Every mention of a vote must be a denial of one.
    for (const m of lower.match(/[^.]*\b(vote|ballot|jury)\b[^.]*/g) || []) {
      expect(m, `a vote stated as fact: "${m.trim()}"`).toMatch(/\bno\b|not\b|none/);
    }
  });

  /* THE ROOM IS NOT `dr.living`. `living` is the roster AFTER the exit, so on
     its own it lists eight queens on a night nine competed — and the writer
     drops tonight's eliminated queen from the whole script: no entrance, no
     werk room, no lip sync, and then she goes home. */
  it('lists everybody who was in the room, including the queen who left', () => {
    for (const r of rows) {
      const s = buildDragBeatSheet(r, { players: PLAYERS });
      const line = s.beats.find(b => b.startsWith('IN THE WERK ROOM TONIGHT'));
      if (!line) continue;
      for (const x of r.exits || []) {
        const n = typeof x === 'string' ? x : x?.name;
        expect(line, `episode ${r.num} left ${n} out of her own episode`).toContain(n);
      }
      const perfs = Object.keys(r.dr.performances || {});
      for (const n of perfs) {
        expect(line, `episode ${r.num}: ${n} performed but was not in the room`).toContain(n);
      }
    }
  });

  it('distinguishes being named in the bottom from lip syncing', () => {
    // Both fates must be labelled differently wherever both occurred, or the
    // writer gives a saved queen a lip sync she never danced.
    const withBoth = rows.find(r => (r.dr.call?.atRisk || []).length
      && (r.dr.call?.bottom || []).length);
    if (!withBoth) return;
    const s = buildDragBeatSheet(withBoth, { players: PLAYERS }).beats.join('\n');
    expect(s).toMatch(/did NOT lip sync/);
    expect(s).toMatch(/THE BOTTOM TWO/);
  });

  it("carries each queen's own voice, authored and not invented", () => {
    expect(Object.keys(sheet.voices).length).toBeGreaterThan(0);
    for (const v of Object.values(sheet.voices)) expect(typeof v).toBe('string');
    // A queen with nothing on file is ABSENT, never a blank string — the
    // prompt has to tell "no voice on file" from "her voice is empty".
    const bare = buildDragBeatSheet(row, { players: {} });
    expect(Object.keys(bare.voices).length).toBe(0);
  });

  it('renders to flat text the worker can be sent', () => {
    const t = dragBeatSheetText(row, { players: PLAYERS });
    expect(t).toContain(sheet.header);
    expect(t).toMatch(/VOICES/);
    expect(t.length).toBeGreaterThan(500);
  });

  it('runs on every episode of a season, finale included', () => {
    for (const r of rows) {
      const s = buildDragBeatSheet(r, { players: PLAYERS });
      expect(s.beats.length, `episode ${r.num} produced nothing`).toBeGreaterThan(3);
    }
    const fin = buildDragBeatSheet(rows[rows.length - 1], { players: PLAYERS });
    expect(fin.beats.join('\n')).toMatch(/crowned/);
  });
});
