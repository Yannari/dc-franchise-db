// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// transcript-header.test.js — every show tells the Control Room who is in it
// ══════════════════════════════════════════════════════════════════════
//
// Reported as "the transcript doesn't even handle the player section", and
// "traitors and drag race doesn't follow the format to a tea like big brother
// and total drama".
//
// current-season.html learns the cast, the active roster and the departures
// from `=== HEADER ===` blocks and from nothing else. Total Drama emits them
// (_textMeta/_textCast in js/text-backlog.js) and Big Brother emits them
// (js/bb-structured.js). The Traitors and Drag Race opened straight into
// narration and emitted none, so a synced season of either arrived with no
// players attached to it.
//
// The parsers are copied here from current-season.html rather than imported --
// it is a page, not a module. That makes them a MODEL of the real thing, so
// the last test in this file checks the page still contains what is modelled.
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as core from '../js/core.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { rosterHeaderFor, transcriptHeaderLines } from '../js/transcript-header.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const DRAG = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'wildcard', age: 25,
  stats: Object.fromEntries(STATS.map((s, j) => [s, 3 + ((i * 7 + j * 3) % 7)])),
  drag: Object.fromEntries(DRAG.map((s, j) => [s, 3 + ((i * 5 + j * 4) % 7)])),
}));

// ── current-season.html's parsers, copied ──
const parseBlock = (text, re) => {
  const lines = (text || '').split(/\r?\n/).map(l => l.trim());
  const start = lines.findIndex(l => re.test(l));
  if (start === -1) return [];
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^===/.test(lines[i])) break;
    if (lines[i]) out.push(lines[i]);
  }
  return out;
};
const castOf = t => parseBlock(t, /^===\s*CAST\b/i);
const rosterOf = t => parseBlock(t, /^===\s*(?:TRIBES|STILL IN(?:\s|\b))/i);
const goneOf = t => parseBlock(t, /^===\s*ELIMINATED\b/i);

describe('the header every show owes the Control Room', () => {
  it('names the roster block in the show its own words', () => {
    /* The recurring bug this codebase exists to stop: one show's vocabulary
       printed over another. "Still in the house" over a castle is the same
       defect as "was evicted" over a camp. */
    expect(rosterHeaderFor('big-brother')).toBe('STILL IN THE HOUSE');
    expect(rosterHeaderFor('traitors')).toBe('STILL IN THE CASTLE');
    expect(rosterHeaderFor('drag-race')).toBe('STILL IN THE COMPETITION');
    // And an unregistered show still gets something a parser can read.
    expect(rosterHeaderFor('nonesuch')).toMatch(/^STILL IN/);
  });

  it('emits all three blocks the parsers look for', () => {
    const text = transcriptHeaderLines({ num: 4 }, {
      format: 'traitors', active: ['A', 'B'], eliminated: ['C'],
      cast: ['A', 'B', 'C'],
    }).join('\n');
    expect(castOf(text)).toEqual(['A', 'B', 'C']);
    expect(rosterOf(text)).toEqual(['A', 'B']);
    expect(goneOf(text)).toEqual(['C']);
  });

  it('says "None yet." rather than an empty block on night one', () => {
    // An empty block and an absent block parse the same; the reader should be
    // able to tell "nobody has gone" from "this season does not say".
    const text = transcriptHeaderLines({ num: 1 }, {
      format: 'drag-race', active: ['A'], eliminated: [], cast: ['A'],
    }).join('\n');
    expect(goneOf(text)).toEqual(['None yet.']);
  });
});

describe('a drag transcript, through the real parsers', () => {
  beforeEach(() => {
    core.setPlayers(CAST.map(p => ({ ...p })));
    core.setSeasonConfig({
      ...core.defaultConfig(), format: 'drag-race', seasonNumber: 1,
      name: 'Drag Race 1', drFinale: 'top4', drSchedule: [], twistSchedule: [],
    });
    core.setGs({ episodeHistory: [], eliminated: [], popularity: {}, phase: 'stage', _drSeed: 4711 });
  });

  it('hands over the cast, the room and the queens who have gone', async () => {
    const dr = await import('../js/dr-run.js');
    for (let i = 0; i < 3; i++) dr.simulateDragEpisode();
    const row = core.gs.episodeHistory[2];
    const text = generateSummaryText(row);

    expect(castOf(text).length, 'no CAST block on a drag transcript').toBe(12);
    const roster = rosterOf(text);
    expect(roster).toEqual([...row.dr.living]);
    // The departures are derived, so check they are the complement and not,
    // say, the whole cast or an empty list that happens to parse.
    const gone = goneOf(text);
    expect(gone.length).toBe(12 - roster.length);
    for (const n of gone) expect(roster).not.toContain(n);
    expect(text).toContain('SEASON: Drag Race 1');
    expect(text).toContain('Queens Remaining: ' + roster.length);
  });

  it('counts down as queens go home, rather than printing the same room', () => {
    /* THE CONTROL ARM. A header hard-coded from `players` would satisfy every
       assertion above on episode one and be wrong from episode two onward. */
    return import('../js/dr-run.js').then(dr => {
      const sizes = [];
      for (let i = 0; i < 4; i++) {
        dr.simulateDragEpisode();
        const row = core.gs.episodeHistory[core.gs.episodeHistory.length - 1];
        sizes.push(rosterOf(generateSummaryText(row)).length);
      }
      expect(new Set(sizes).size, `the roster never changed: ${sizes}`).toBeGreaterThan(1);
      expect(sizes[sizes.length - 1]).toBeLessThan(sizes[0]);
    });
  });
});

describe('the page still reads what these tests model', () => {
  it('keeps a roster matcher that accepts the new headers', () => {
    const html = readFileSync(join(root, 'current-season.html'), 'utf8');
    expect(html).toContain('STILL IN(?:');
    // And the two it always had.
    expect(html).toMatch(/TRIBES\|STILL IN/);
  });

  it('is wired into both writers', () => {
    expect(readFileSync(join(root, 'js/vp-dr/summary.js'), 'utf8'))
      .toContain('transcriptHeaderLines');
    expect(readFileSync(join(root, 'js/text-backlog.js'), 'utf8'))
      .toContain('transcriptHeaderLines');
  });
});
