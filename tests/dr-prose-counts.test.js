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
