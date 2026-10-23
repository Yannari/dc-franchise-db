// The franchise calendar's cards say what is playing and what to start next (js/calendar-view.js).
//
// The user, 2026-10-23: "now for a finished season and up next for a season playing now and it doesnt really
// tell me that soon i should start bb2". "Now" was the latest finale, and "Up next" the earliest projected bar,
// which was the season being played; BB2, premiering while it aired, was never mentioned.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const src = fs.readFileSync(path.join(process.cwd(), 'js/calendar-view.js'), 'utf8');

describe('the calendar cards', () => {
  it('calls the season in the simulator "Playing now" and the finished one "Last aired"', () => {
    expect(src).toMatch(/card\('now', liveRun, 'Playing now'/);
    expect(src).toMatch(/card\('last', nowRun, 'Last aired'/);
    expect(src).not.toMatch(/card\('now', nowRun, 'Now'/);
  });

  it('names the next season to start when it premieres while the live one airs, booked or not', () => {
    expect(src).toMatch(/ghosts\.filter\(g => !g\.live && !g\.started && !g\.possible && g\.start <= live\.finale\)/);
    expect(src).toMatch(/'Start next · due now' : 'Start next · soon'/);
  });

  it('never offers the season being played as "Up next"', () => {
    expect(src).toMatch(/const upNext = ghosts\.find\(g => !g\.live\)/);
  });

  it('marks the live season as NOW on the rail and the board', () => {
    expect(src).toMatch(/state\.model\.nowMark = liveRun \|\| state\.model\.nowRun/);
    expect(src.match(/state\.model\.nowMark === r\) cls\.push\('is-now'\)/g)).toHaveLength(2);
  });
});
