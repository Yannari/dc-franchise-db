// The voting chart moved off its own nav tab into each Total Drama season's Vote History (the user, 2026-10-21).
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chartFor, voteChartHtml } from '../js/vote-chart.js';
import { NAV_LINKS } from '../js/site-header.js';

const read = p => JSON.parse(readFileSync(join(process.cwd(), p), 'utf8'));
const fixed = read('data/vote-charts.json');

describe('the voting chart', () => {
  it('keeps every hand-written season, finale columns included', () => {
    for (let n = 1; n <= 9; n++) {
      const c = chartFor(n, read(`data/seasons/season${n}-data.json`), fixed);
      expect(c, `season ${n}`).toBeTruthy();
      expect(c.rows.length, `season ${n} rows`).toBeGreaterThan(10);
    }
    expect(fixed.seasons['1'].head[0].some(c => c.c === 'winner-col')).toBe(true);
  });
  it('builds a later season from its own votingHistory', () => {
    const data = read('data/seasons/season15-data.json');
    const c = chartFor(15, data, fixed);
    expect(c.head[0].length - 2).toBe(data.votingHistory.length);
    const html = voteChartHtml(c, { slugOf: n => n.toLowerCase() });
    expect(html).toContain('player.html?player=');
    expect(html).toMatch(/class="hit"/);
    expect(html).not.toMatch(/undefined|\{/);
  });
  it('has no chart for a season without ballots', () => {
    expect(chartFor(1, read('data/seasons/dr-1-data.json'), null)).toBeNull();
  });
  it('is not a nav tab any more, and the season page draws it for Total Drama only', () => {
    expect(NAV_LINKS.some(l => /voting-analytics/.test(l.href))).toBe(false);
    const page = readFileSync(join(process.cwd(), 'season_ref.html'), 'utf8');
    expect(page).toContain("${isDefaultShow ? '<div id=\"sr-vote-chart\"></div>' : ''}");
    expect(page).toContain("import('./js/vote-chart.js')");
  });
});
