// ══════════════════════════════════════════════════════════════════════
// dr-prose-counts.test.js — prose may not state how many queens are left
// ══════════════════════════════════════════════════════════════════════
//
// "The door goes and it is her, out of drag, in a suit that costs more than
// anybody's entire wardrobe, and thirteen queens stop mid-sentence." That line
// is in a pool the host can draw in ANY episode, and it was read on a screen
// whose own header said QUEENS LEFT 04. Six lines across five pools claimed a
// cast size or a room size the season had no obligation to match — the cast is
// configurable and the room empties every week.
//
// A line may still say "two queens stand before me" at a lip sync, because two
// is what a lip sync structurally is. What it may not do is count the room.
//
// Found by reading a rendered screen against its own HUD, not by a test — so
// this is the test.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Anchored to this file, not the process CWD: run from a git worktree a bare
// relative path opens the MAIN checkout and reports on code the branch has
// already changed. See docs/ADDING-A-SHOW.md 11.5 L.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = 'js/dr/data';

/* NARROW ON PURPOSE, and the narrowing is the whole design of this guard.
   A first version flagged any number word beside "queens" and lit up nine
   files, most of them correctly written: "three queens walk past her
   station" and "three queens agree at once" are a few people doing a thing,
   which is prose, not a claim about the field. Only a count that asserts a
   TOTAL can be wrong, so only a count wearing a totalling word is matched.
   The prose that says a size without one of these words — "eight queens,
   one bracket" — is beyond a regex and was fixed by hand; this catches the
   next one that phrases it the ordinary way. */
const COUNT = '(three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen'
  + '|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)';

// The words that turn a count into a claim about how many there are.
const TOTAL = '(left|remaining|in the (?:room|competition|house)|other queens'
  + '|of us left|of them left)';

/* BUILT WITH String.raw, and that is not a style choice. Written as a plain
   template literal those backslash-b sequences are JavaScript escapes —
   backspace characters — not word boundaries, so the first version matched
   nothing at all while reporting eighteen passes. Verified by planting a
   violation and watching it go red. */
const RE = new RegExp(
  String.raw`\b${COUNT}\b(?:\s+\w+){0,2}\s+queens?\s+${TOTAL}\b`
  + String.raw`|\b${COUNT}\b\s+${TOTAL}\b`, 'gi');

describe('no prose pool counts the room', () => {
  const files = readdirSync(DIR).filter(f => f.endsWith('.js'));

  it('has pools to check', () => expect(files.length).toBeGreaterThan(8));

  for (const f of files) {
    it(`${DIR}/${f} states no cast size`, () => {
      const src = readFileSync(`${DIR}/${f}`, 'utf8');
      /* Comments are documentation, not prose the viewer sees — the finale's
         header block describes season 9's four-queen bracket and should. */
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      const hits = [...code.matchAll(RE)].map(m => m[0]);
      expect(hits, `${f} counts the room: ${hits.join(' | ')}`).toEqual([]);
    });
  }
});

describe('EVERY PLACEHOLDER A POOL USES IS ONE THE WRITER FILLS', () => {
  /* A finalist's biggest moment of the season went to screen reading:

       "You have {bottoms} bottoms and each time you came back harder."
       "{wins} wins. {bottoms} times in the bottom. Still here."

     `fill()` in js/dr/finale.js substituted {a}, {b} and {c} and dropped every
     other key on the floor. The values were never missing — `emit` had been
     handing all seven to it, computed correctly, in `subs`; the substituter
     simply did not know the tokens existed. Nothing errored, and the pools'
     own header documents the seven, which is how it read as finished work.

     So this asserts the two halves against each other: every token any pool
     writes must be one the substituter can resolve. It is a source guard
     because the alternative is playing a season and hoping the tier that uses
     {record} comes up. */
  const FINALE = join(ROOT, 'js/dr/data/finale-beats.js');
  const FILLER = join(ROOT, 'js/dr/finale.js');

  it('the finale pools use no token finale.js cannot fill', () => {
    const pools = readFileSync(FINALE, 'utf8');
    const filler = readFileSync(FILLER, 'utf8');
    const used = new Set([...pools.matchAll(/\{([a-zA-Z]+)\}/g)].map(m => m[1]));
    expect(used.size, 'the pools stopped using placeholders at all').toBeGreaterThan(3);

    /* What the writer can resolve: the keys it always defines, plus every key
       it builds into `subs`. Read off the source rather than hardcoded, so
       adding a token to `subs` is enough to license it. */
    const always = new Set(['a', 'b', 'c']);
    const subsBlock = filler.match(/return \{ tier, subs: \{([\s\S]*?)\} \};/);
    expect(subsBlock, 'the interview subs block moved or was renamed').toBeTruthy();
    /* Both property forms. `{ wins: String(wins), best, worst }` mixes
       key:value with SHORTHAND, and reading only `key:` missed `best` and
       `worst` — the guard then reported two correctly-filled tokens as
       unfillable, which is a guard lying in the safe direction but lying. */
    for (const part of subsBlock[1].split(',')) {
      const m = part.trim().match(/^([a-zA-Z_$][\w$]*)\s*(?::|$)/);
      if (m) always.add(m[1]);
    }

    const unfillable = [...used].filter(k => !always.has(k)).sort();
    expect(unfillable, 'these appear in the prose and nothing substitutes them — '
      + 'they reach the screen as literal {braces}').toEqual([]);
  });

  it('fill() substitutes generically rather than a hardcoded three', () => {
    const filler = readFileSync(FILLER, 'utf8');
    const fn = filler.match(/const fill = [\s\S]*?\n\};/);
    expect(fn, 'fill() moved or was renamed').toBeTruthy();
    // A per-token .replace() chain is the shape that caused this: it silently
    // ignores everything it was not told about.
    expect(fn[0], 'fill() is back to naming its tokens one at a time')
      .toMatch(/\[a-zA-Z\]\+|\[a-z\]\+/);
  });
});
