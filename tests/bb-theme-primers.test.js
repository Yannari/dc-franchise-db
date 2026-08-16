// A theme that cannot explain itself is a theme the viewer is lost inside.
//
// Written because a real viewer said so: "there should be screen explaining the
// theme and whats going on each week cause im just confused on whats the pit
// boss etc... please dont let the user be lost by the theme all of the themes
// not just one."
//
// Before this, a theme only ever SPOKE — four one-liner mood beats a week — and
// no surface anywhere said what the season was or who was narrating it. The
// primer is the descriptor's own explanation, aimed at the viewer instead of at
// the next engineer, and this guard holds every registered theme to having one.
import { describe, expect, it } from 'vitest';
import { BB_THEMES, THEME_LIST } from '../js/bb/themes.js';

describe('every registered theme explains itself', () => {
  for (const id of THEME_LIST) {
    const theme = BB_THEMES[id];

    describe(id, () => {
      const p = () => theme.primer;

      it('has a primer', () => {
        expect(p()).toBeTruthy();
      });

      it('says what the season is, who is running it, and what to watch', () => {
        for (const field of ['what', 'who', 'watch']) {
          expect(typeof p()[field], `${field} is prose`).toBe('string');
          // Long enough to be an explanation rather than a label.
          expect(p()[field].length, `${field} is too short to explain anything`)
            .toBeGreaterThan(80);
        }
      });

      it('lists the rules this season adds', () => {
        expect(Array.isArray(p().rules)).toBe(true);
        expect(p().rules.length).toBeGreaterThanOrEqual(2);
        for (const r of p().rules) expect(r.length).toBeGreaterThan(20);
      });

      it('names both registers and the turn between them', () => {
        expect(p().register.neutral.length).toBeGreaterThan(10);
        expect(p().register.hostile.length).toBeGreaterThan(10);
        expect(p().turn.headline).toBe(p().turn.headline.toUpperCase());
        expect(p().turn.headline.length).toBeGreaterThan(3);
        expect(p().turn.body.length).toBeGreaterThan(40);
      });

      it('gives the antagonist its own words for announcing a rule', () => {
        expect(p().announce.length).toBeGreaterThanOrEqual(4);
        for (const line of p().announce) {
          expect(line, 'every announce line carries the rule').toContain('{detail}');
        }
      });

      // The recurring bug class this whole engine exists to prevent: one
      // season's vocabulary printed over another's. A hotel must not announce
      // its twists in a casino's words, and vice versa.
      it('never speaks in another theme\'s voice', () => {
        const mine = JSON.stringify(p()).toLowerCase();
        const others = THEME_LIST.filter(o => o !== id)
          .map(o => BB_THEMES[o].antagonist?.name)
          .filter(Boolean);
        for (const name of others) {
          expect(mine, `${id}'s primer names ${name}`).not.toContain(name.toLowerCase());
        }
      });
    });
  }

  it('never lets the High Roller\'s antagonist say "the house"', () => {
    // The roster owns that phrase. Every other surface in this simulator uses
    // it for the houseguests, so the Pit Boss says the floor, the room, the
    // edge. Its voice pools are already held to this; the primer is a new
    // surface and needs the same rule.
    const p = BB_THEMES['high-rollers'].primer;
    expect(JSON.stringify(p).toLowerCase()).not.toMatch(/\bthe house\b/);
  });
});
