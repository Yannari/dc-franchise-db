// No theme may silently lose an act it authored.
//
// `themeScheduleEntries` REFUSES an act that resolves at or before the act
// above it — correct on a season too short for the whole arc, and an authoring
// bug on every cast size. It says so in a console.warn and nowhere else, which
// means a theme can lose a card on every season anybody ever plays and look
// completely fine on the timeline.
//
// Two themes were doing exactly that when this test was written: High Roller's
// dropped the Wildcard's first night, and Summer Camp dropped Camp Comeback
// entirely — both because a RECURRENCE IS EXPANDED IN FULL before the next act
// is considered, so nothing can interleave with a cadence. One cadence per
// window, and fixed-week acts either side of it.
import { describe, expect, it } from 'vitest';
import { BB_THEMES, themeScheduleEntries } from '../js/bb/themes.js';

// The casts this simulator actually runs, plus the small end where the
// end-anchored acts genuinely do collide and dropping IS correct.
const NORMAL = [14, 16, 18, 20];

describe('theme arcs', () => {
  it('never drop an act at a cast anybody plays', () => {
    const warns = [];
    const orig = console.warn;
    console.warn = (...a) => warns.push(a.join(' '));
    try {
      for (const id of Object.keys(BB_THEMES)) {
        for (const cast of NORMAL) {
          themeScheduleEntries(BB_THEMES[id], { weeks: cast - 3, existing: [] });
        }
      }
    } finally { console.warn = orig; }
    expect(warns, `themes dropped acts:\n${warns.join('\n')}`).toEqual([]);
  });

  it('lay down every card they say they book', () => {
    for (const [id, theme] of Object.entries(BB_THEMES)) {
      const seen = new Set();
      for (const cast of NORMAL) {
        for (const e of themeScheduleEntries(theme, { weeks: cast - 3, existing: [] })) {
          seen.add(e.type);
        }
      }
      for (const booked of theme.books || []) {
        expect(seen.has(booked),
          `${id} lists ${booked} in books but never schedules it at any normal cast`).toBe(true);
      }
    }
  });

  it('stay in the order they were authored in', () => {
    for (const [id, theme] of Object.entries(BB_THEMES)) {
      for (const cast of NORMAL) {
        const eps = themeScheduleEntries(theme, { weeks: cast - 3, existing: [] })
          .map(e => e.episode);
        const sorted = [...eps].sort((a, b) => a - b);
        expect(eps, `${id} at cast ${cast} came out unordered`).toEqual(sorted);
        expect(new Set(eps).size, `${id} at cast ${cast} double-booked a week`)
          .toBe(eps.length);
      }
    }
  });
});
