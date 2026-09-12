// ══════════════════════════════════════════════════════════════════════
// wiki-fill-record.test.js — the writer was told nothing and said so
// ══════════════════════════════════════════════════════════════════════
//
// The fill ran, the worker answered, and the paragraph it produced read:
//
//   "During her time on the show, Quin ultimately emerged as the winner of
//    Drag Race Season 1. The available record preserved no named alliances,
//    competition counts, or final vote total for her run. With no dialogue
//    recorded in her thread, her season was documented primarily through its
//    outcome."
//
// Every word of that was true about the REQUEST. Quin won five maxi
// challenges; what the writer was handed was `placed 1; winner` and an empty
// timeline.
//
// Two show-blind reads did it, and they are the bug class CLAUDE.md opens with:
//
//  * `attachRecords` branched `format === 'big-brother' ? the house : Total
//    Drama`, which makes every other show Total Drama. A drag placement has no
//    `challengeWins`, no `immunityWins` and no `idolsFound` — its numbers are
//    on `row.dr` — so the loop added nothing at all.
//
//  * `timelineFor` reads `doc.weeks` (the house) and `doc.votingHistory` (the
//    camp). A drag season has neither, so every queen's timeline was empty —
//    while `doc.gameHistory` held the season written out a round at a time,
//    naming who won, who was high, who lip synced and who went home.
//
// The registry already declares what each show counts (`articleStats.comps`),
// and the rounds were already written. Neither needed inventing.
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { attachRecords, timelineFor } from '../js/wiki-fill-run.js';
import { sliceCastThreads } from '../js/wiki-fill.js';
import { SHOWS } from '../js/shows.js';

const doc = p => JSON.parse(readFileSync(p, 'utf8'));
const threadsFor = (d, format) => {
  const t = sliceCastThreads([], (d.placements || []).map(p => p.name));
  attachRecords(d, t, format);
  return t;
};

describe('the record block', () => {
  it('asks the registry rather than branching on one show', () => {
    const src = readFileSync('js/wiki-fill-run.js', 'utf8');
    // Comments stripped first: the note explaining the fix quotes the old
    // line, and a guard that reads its own documentation finds it every time.
    const fn = src.slice(src.indexOf('export function attachRecords'))
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(fn, 'still hard-branched on big-brother, so every other show is Total Drama')
      .not.toMatch(/format === 'big-brother'/);
    expect(fn).toMatch(/articleStats/);
  });

  /* Every show that declares competition columns must be able to state them.
     A show added later gets this case for free, which is the point. */
  for (const [format, show] of Object.entries(SHOWS)) {
    const cols = show?.articleStats?.comps || [];
    it.runIf(cols.length)(`${format} can say what it counts`, () => {
      // A placement carrying one of everything, built from the show's own paths.
      const row = { name: 'Test', placement: 3, status: 'Finalist' };
      for (const [path] of cols) {
        const parts = String(path).split('.');
        let o = row;
        while (parts.length > 1) { const k = parts.shift(); o = (o[k] ||= {}); }
        o[parts[0]] = 2;
      }
      const t = threadsFor({ placements: [row] }, format);
      for (const [, label] of cols) {
        expect(t[0].record.toLowerCase(),
          `${format}: "${label}" is declared and never reaches the writer`)
          .toContain(String(label).toLowerCase());
      }
    });
  }

  it('states no number that did not happen', () => {
    // A list of zeroes is how a paragraph ends up about what somebody did not do.
    const t = threadsFor({ placements: [{ name: 'T', placement: 9, dr: { wins: 0, highs: 3 } }] },
      'drag-race');
    expect(t[0].record).toContain('3 highs');
    expect(t[0].record).not.toMatch(/0 maxi/i);
  });
});

describe('the timeline', () => {
  it('falls back to the rounds when a show has neither weeks nor ballots', () => {
    const d = {
      placements: [{ name: 'Quin', placement: 1 }],
      gameHistory: [
        { n: 1, prose: 'Minnie Skurr won the maxi challenge. Quin was high.' },
        { n: 2, prose: 'Somebody else entirely won and nothing here names her.' },
      ],
    };
    const out = timelineFor(d, 'Quin');
    expect(out.length, 'a season with rounds written produced no timeline').toBe(1);
    expect(out[0]).toMatch(/^ep1: /);
    expect(out[0], 'took the whole round rather than the sentences about her')
      .not.toMatch(/Minnie Skurr won/);
    expect(out[0]).toMatch(/Quin was high/);
  });

  it('does not repeat a camp or a house in prose', () => {
    /* The fallback must not fire where the real record exists, or the timeline
       says everything twice. */
    const d = {
      placements: [{ name: 'Quin', placement: 1 }],
      votingHistory: [{ episode: 1, winner: 'Quin' }],
      gameHistory: [{ n: 1, prose: 'Quin won the challenge and it is said here too.' }],
    };
    const out = timelineFor(d, 'Quin');
    expect(out).toEqual(['ep1: won the challenge']);
  });
});

/* ── AND AGAINST THE SEASON THE REPORT CAME FROM ── */
const DR = 'data/seasons/dr-1-data.json';
describe.runIf(existsSync(DR))('the exported drag season', () => {
  const d = doc(DR);
  const winner = (d.placements || []).find(p => p.placement === 1) || {};

  it('tells the writer what the winner actually won', () => {
    const t = threadsFor(d, 'drag-race').find(x => x.name === winner.name);
    expect(t, 'the winner is not in the cast threads').toBeTruthy();
    const wins = winner.dr?.wins || 0;
    expect(wins, 'this season has no maxi wins recorded at all').toBeGreaterThan(0);
    expect(t.record, `the winner won ${wins} and the record does not say so`)
      .toMatch(new RegExp(`${wins} maxi`, 'i'));
  });

  it('gives every queen a timeline', () => {
    const t = threadsFor(d, 'drag-race');
    const empty = t.filter(x => !(x.timeline || []).length).map(x => x.name);
    expect(empty, `no round names these queens: ${empty.join(', ')}`).toEqual([]);
  });
});
