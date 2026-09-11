// ══════════════════════════════════════════════════════════════════════
// dr-scene-effects-match-prose.test.js — the badge has to mean the card
// ══════════════════════════════════════════════════════════════════════
//
// `the-room-takes-sides` was one event with one `effects` block and four lines
// that did not agree about what had happened. One had {b} turning ON {a}. The
// other three had {a} taking {b}'s SIDE against a queen at the far end of the
// couch — "{b} looks relieved to have backup", "{b} goes 'thank you'".
//
// The single bond was -1.5. So three nights in four the badge said the pair
// had fallen out, on a card describing one of them defending the other: Riot
// took -1.5 with Sharon Needles for having Sharon's back.
//
// ── WHY THIS IS NARROW ON PURPOSE ─────────────────────────────────────
//
// The first version of this swept every line for warm words under a negative
// bond and returned seventeen events, nearly all of them correct: these pools
// are FULL of warm words meaning cold things, and that is the writing working.
// `apology-refused` is four apologies not being accepted. `congratulations-
// not-meant` is a hug with a knife in it. `good-luck-she-does-not` is in the
// name. A guard that flagged those would be deleted within a week.
//
// So it matches only phrases that cannot be ironic about WHO IS ON WHOSE SIDE
// — the structural fact the effects encode. "Takes {b}'s side" is not a way of
// saying she turned on her.
import { describe, expect, it } from 'vitest';
import { UNTUCKED_EVENTS } from '../js/dr/data/untucked-events.js';
import { WERK_EVENTS } from '../js/dr/data/werk-events.js';

/** She is helping {b}, stated so plainly it cannot be read the other way. */
const ALLIED = [
  /takes \{b\}'s side/i,
  /\{b\} looks relieved to have backup/i,
  /\{b\} goes "thank you\."/i,
];

const paired = list => list.filter(e => (e.lines || []).length
  && typeof e.effects?.bond === 'number' && e.effects.bond !== 0);

describe('an event whose lines take a side', () => {
  for (const [where, list] of [['untucked', UNTUCKED_EVENTS], ['werk', WERK_EVENTS]]) {
    it(`pays the bond that side implies (${where})`, () => {
      const wrong = [];
      for (const e of paired(list)) {
        if (e.effects.bond > 0) continue;
        for (const line of e.lines) {
          if (ALLIED.some(re => re.test(line))) {
            wrong.push(`${e.id}: bond ${e.effects.bond} on "${line.slice(0, 90)}…"`);
          }
        }
      }
      expect(wrong, 'these cards describe one queen backing another and '
        + 'charge the pair for it').toEqual([]);
    });
  }

  it('kept both halves of the scene that was split', () => {
    /* Weighing in and backing up are opposite scenes, and the fix was to make
       them two events rather than to delete the lines of one. */
    const butt = UNTUCKED_EVENTS.find(e => e.id === 'the-room-takes-sides');
    const back = UNTUCKED_EVENTS.find(e => e.id === 'takes-her-side');
    expect(butt, 'the room no longer takes sides at all').toBeTruthy();
    expect(back, 'nobody can back anybody up any more').toBeTruthy();
    expect(butt.effects.bond).toBeLessThan(0);
    expect(back.effects.bond).toBeGreaterThan(0);
    /* Between them they still carry every line the single event had -- the
       fix was to split the scene, not to throw away the half that did not
       fit. (Both pools were then topped up to the four variants
       tests/dr-untucked-events.test.js requires, so this checks the originals
       survived rather than counting.) */
    const all = [...butt.lines, ...back.lines].join(' | ');
    for (const beat of ['has been watching the argument', 'Can I say something?',
      'weighs in from the couch', 'well actually']) {
      expect(all, `the split lost "${beat}"`).toContain(beat);
    }
    // And both still have a consequence — applyWerkScene throws without one.
    for (const e of [butt, back]) expect(Object.keys(e.effects).length).toBeGreaterThan(0);
  });
});
