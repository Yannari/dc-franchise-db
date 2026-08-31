// The worker's ranking-blurb prompt, read as text.
//
// The prompt tells the model "Use ${showName}'s own vocabulary and nothing
// else. Do not import words from another format" — and then, three lines
// later, showed it TOTAL DRAMA'S EXAMPLES for a Traitors request, because the
// examples table fell back to the default show whenever it had no entry:
//
//     const examples = EXAMPLES[showName] || EXAMPLES["Total Drama"];
//
// The examples ARE the tone specification. A model handed "stripped Julia's
// idol at Tribal with Knowledge is Power" writes about idols and Tribal, and
// this prompt governs prose the public site serves.
//
// The worker is a Cloudflare module with no test harness, so it is read as
// SOURCE. That is a weaker check than executing it, and it is the reason this
// file states what it is looking at rather than asserting on a shape: if the
// table is renamed, these fail loudly instead of passing on nothing.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { join } from 'node:path';
import { SHOWS } from '../js/shows.js';

const SRC = fs.readFileSync(join(process.cwd(), 'worker/worker-episode-live.js'), 'utf8');

/** The EXAMPLES table, as text, so its arms can be read one at a time. */
function examplesBlock() {
  const start = SRC.indexOf('const EXAMPLES = {');
  expect(start, 'worker-episode-live.js no longer has an EXAMPLES table')
    .toBeGreaterThan(-1);
  const end = SRC.indexOf('const examples =', start);
  expect(end, 'the EXAMPLES table is no longer followed by its selector')
    .toBeGreaterThan(start);
  /* COMMENTS STRIPPED. A source-text check that counts comments is checking
     the wrong thing — the note explaining this very bug quotes "idols,
     Tribal, fire-making", and left in it would fail the arm it documents.
     Same lesson as the ternary ratchet in show-list-duplication.test.js. */
  return SRC.slice(start, end)
    // CRLF first: `.` does not match a carriage return, so the line-comment
    // strip below matches nothing at all on a CRLF file.
    .replace(/\r\n?/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map(l => l.replace(/(^|\s)\/\/.*$/, '')).join('\n');
}

describe('the ranking-blurb prompt is about the show it names', () => {
  it('never falls back to another show\'s examples', () => {
    const selector = SRC.slice(SRC.indexOf('const examples ='),
      SRC.indexOf('const examples =') + 200);
    // Being shown nothing is recoverable; being shown the wrong show is not.
    for (const show of Object.values(SHOWS)) {
      expect(selector,
        `the examples fall back to ${show.name} for a show that has none of its own`)
        .not.toContain(`|| EXAMPLES["${show.name}"]`);
    }
  });

  it('carries an arm for every registered show, or none for that show', () => {
    // Not a demand that every show have examples — a show with none is
    // handled. A demand that a show WITH an arm has its own words in it.
    const block = examplesBlock();
    const named = Object.values(SHOWS).filter(s => block.includes(`"${s.name}":`));
    expect(named.length, 'the examples table names no registered show at all')
      .toBeGreaterThan(1);
  });

  it('writes each show\'s examples in that show\'s own words', () => {
    const block = examplesBlock();
    // Split the table into one chunk per named show, in file order.
    const marks = Object.values(SHOWS)
      .map(s => ({ name: s.name, at: block.indexOf(`"${s.name}":`) }))
      .filter(x => x.at >= 0)
      .sort((a, b) => a.at - b.at);
    const chunkFor = i => block.slice(marks[i].at,
      i + 1 < marks.length ? marks[i + 1].at : block.length).toLowerCase();

    // Words that cannot be true of another show. Kept short deliberately:
    // this is a smoke test over a file nothing can execute, not a second
    // copy of tests/show-vocabulary.test.js.
    const OWN = {
      'Total Drama': ['idol', 'tribal', 'merge', 'challenge'],
      'Big Brother': ['veto', 'head of household', 'nominated', 'houseguest'],
      'The Traitors': ['traitor', 'faithful', 'banish', 'murder', 'round table'],
    };
    for (const [i, mark] of marks.entries()) {
      const mine = OWN[mark.name];
      if (!mine) continue;
      const chunk = chunkFor(i);
      expect(mine.some(w => chunk.includes(w)),
        `${mark.name}'s examples contain none of its own vocabulary`).toBe(true);
      for (const [other, theirs] of Object.entries(OWN)) {
        if (other === mark.name) continue;
        const stolen = theirs.filter(w => !mine.includes(w) && chunk.includes(w));
        expect(stolen, `${mark.name}'s examples use ${other}'s words`).toEqual([]);
      }
    }
  });

  it('still tells the model not to import another format\'s words', () => {
    // The instruction was already there and already correct. It was the
    // examples underneath it that contradicted it, which is why the
    // instruction alone is not the guard.
    expect(SRC).toContain('Do not import words from');
  });
});
