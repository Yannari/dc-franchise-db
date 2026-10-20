// When a season has to be played (js/air-watch.js). The user, 2026-10-20:
// "prevent me when a season gotta be played/premiered so that mistake dont
// happen again, even if im in the middle of another show". The mistake: Total
// Drama 15 ran into September, and three seasons due that spring and summer
// had not been played, so the rule "never before the latest finale" would
// have moved them all a year.
import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  liveSeason, dueSeasons, exportWarning, airWatchHtml, stampAirWindow, loadSeasonsDb, readLocks, windowOf,
} from '../js/air-watch.js';

// Numbers high enough that no 2027 booking (`booked` on the show's registry entry) applies.
const SEASONS = [
  { format: 'total-drama', seasonNumber: 20, airYear: 2030, airSlot: 'fall', episodeCount: 12 },
  { format: 'big-brother', seasonNumber: 5, airYear: 2030, airSlot: 'summer', episodeCount: 12 },
];
const rows = n => Array.from({ length: n }, (_, i) => ({ num: i + 1 }));
const td21 = (aired, extra = {}) => ({ gs: { episodeHistory: rows(aired), phase: 'post-merge', ...extra }, cfg: { format: 'total-drama', seasonNumber: 21 } });

beforeEach(() => { localStorage.clear(); });

describe('the season being played', () => {
  it('airs in its window, one episode a week, measured against the last season of its show', () => {
    const { gs, cfg } = td21(4);
    const live = liveSeason(gs, cfg, SEASONS);
    expect(live).toMatchObject({ format: 'total-drama', number: 21, short: 'TD 21', aired: 4, total: 12 });
    expect(live.window).toEqual({ airYear: 2031, airSlot: 'spring' });
    expect(live.current.toISOString().slice(0, 10)).toBe('2031-04-28');
  });

  it('a show that plays the whole season on the first press is measured by its queue', () => {
    const live = liveSeason({ episodeHistory: rows(3), _ciQueue: rows(9) }, { format: 'the-circle', seasonNumber: 9 }, SEASONS);
    expect(live.total).toBe(12);
    expect(live.done).toBe(false);
  });

  it('is nothing once that season is on the calendar', () => {
    expect(liveSeason({ episodeHistory: rows(3) }, { format: 'big-brother', seasonNumber: 5 }, SEASONS)).toBeNull();
    expect(liveSeason({ episodeHistory: [] }, { format: 'total-drama', seasonNumber: 21 }, SEASONS)).toBeNull();
  });
});

describe('what is due while it airs', () => {
  it('names the season that premieres during it, and where it would move', () => {
    const { gs, cfg } = td21(16);
    const live = liveSeason(gs, cfg, SEASONS);
    const bb = dueSeasons(SEASONS, live).find(d => d.format === 'big-brother');
    expect(bb).toMatchObject({ number: 6, window: { airYear: 2031, airSlot: 'summer' }, moves: { airYear: 2032, airSlot: 'summer' } });
    expect(bb.overdue, 'TD 21 episode 16 is after the July premiere').toBe(true);
  });

  it('not overdue while the premiere is still ahead', () => {
    // Last Total Drama ran 20 episodes, so this one is measured to August.
    const seasons = SEASONS.map(r => (r.format === 'total-drama' ? { ...r, episodeCount: 20 } : r));
    const { gs, cfg } = td21(4);
    const live = liveSeason(gs, cfg, seasons);
    const bb = dueSeasons(seasons, live).find(d => d.format === 'big-brother');
    expect(bb.overdue).toBe(false);
    expect(airWatchHtml(live, [bb])).toMatch(/premieres July \d+, 2031, in \d+ weeks of TD 21/);
  });

  it('leaves out a season that has started (its window is locked) and a booked one', () => {
    const { gs, cfg } = td21(16);
    const live = liveSeason(gs, cfg, SEASONS);
    const locked = dueSeasons(SEASONS, live, { 'big-brother#6': { airYear: 2031, airSlot: 'summer' } });
    expect(locked.some(d => d.format === 'big-brother')).toBe(false);
    // The Circle's first season is booked for spring 2027 and keeps it.
    expect(dueSeasons(SEASONS, live).some(d => d.format === 'the-circle')).toBe(false);
  });

  it('the export asks, naming each move', () => {
    const { gs, cfg } = td21(16);
    const live = liveSeason(gs, cfg, SEASONS);
    const ask = exportWarning(SEASONS, live);
    expect(ask).toContain('BB 6: Summer 2031 → Summer 2032');
    expect(ask).toContain('Export anyway?');
    expect(exportWarning(SEASONS, null)).toBe('');
  });

  it('the Run tab banner says it, and says nothing when nothing is due', () => {
    const { gs, cfg } = td21(16);
    const live = liveSeason(gs, cfg, SEASONS);
    const html = airWatchHtml(live, dueSeasons(SEASONS, live));
    expect(html).toContain('Due now');
    expect(html).toContain('BB 6');
    expect(html).toContain('Summer 2032');
    expect(airWatchHtml(live, [])).toBe('');
  });
});

describe("a season's date is fixed when it starts", () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ seasons: SEASONS }) }));
  });

  it('stamps gs.airWindow and a lock the calendar can read, once, never overwriting', async () => {
    await loadSeasonsDb();
    const gs = { episodeHistory: rows(1) };
    stampAirWindow(gs, { format: 'big-brother', seasonNumber: 6 });
    expect(gs.airWindow).toEqual({ airYear: 2031, airSlot: 'summer' });
    expect(readLocks()['big-brother#6']).toEqual({ airYear: 2031, airSlot: 'summer' });
    gs.airWindow = { airYear: 2040, airSlot: 'fall' };
    stampAirWindow(gs, { format: 'big-brother', seasonNumber: 6 });
    expect(gs.airWindow).toEqual({ airYear: 2040, airSlot: 'fall' });
  });

  it('nothing before the first episode', async () => {
    await loadSeasonsDb();
    const gs = { episodeHistory: [] };
    stampAirWindow(gs, { format: 'big-brother', seasonNumber: 6 });
    expect(gs.airWindow).toBeUndefined();
  });

  it("a lock outranks the rule after something else is exported", () => {
    const later = [...SEASONS, { format: 'total-drama', seasonNumber: 21, airYear: 2031, airSlot: 'spring', episodeCount: 26 }];
    expect(windowOf(later, 'big-brother', 6, {})).toEqual({ airYear: 2032, airSlot: 'summer' });
    expect(windowOf(later, 'big-brother', 6, { 'big-brother#6': { airYear: 2031, airSlot: 'summer' } }))
      .toEqual({ airYear: 2031, airSlot: 'summer' });
  });
});
