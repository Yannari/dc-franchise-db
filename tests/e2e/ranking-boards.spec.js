// A ranking board per show, and each show finding its own.
//
// Big Brother 1's seventeen players were applied into rankings_database.json,
// which declares itself Total Drama's. Every reader gates on that declaration,
// so they were simultaneously IN the file and invisible: rankings.html printed
// "No Big Brother rankings yet" while the houseguests sat at ranks 13, 26, 28
// and so on, pushing every Total Drama player below them down a place.
//
// Asserted on what a reader sees rather than on the files, because the files
// were never the thing that was wrong — nothing was reading more than one.
import { test, expect } from '@playwright/test';

const TD_PLAYERS = 152;
const BB_PLAYERS = 17;

test('the rankings page has a board for each show', async ({ page }) => {
  await page.goto('/rankings.html?show=big-brother');
  await page.waitForSelector('.player-card', { timeout: 20000 });
  await page.waitForTimeout(500);

  // The panel this bug produced. Its absence is the regression under test.
  await expect(page.locator('text=No Big Brother rankings yet')).toHaveCount(0);
  await expect(page.getByText('Misha', { exact: false }).first()).toBeVisible();
});

test('a houseguest is ranked on the Big Brother board, not Total Drama\'s', async ({ page }) => {
  await page.goto('/rankings.html?show=big-brother');
  await page.waitForTimeout(1500);
  const bb = await page.evaluate(async () => {
    const mod = await import('/js/ranking-boards.js');
    const boards = await mod.loadRankingBoards();
    const byFormat = Object.fromEntries(boards.map(b => [mod.boardFormat(b), b]));
    return {
      formats: boards.map(mod.boardFormat).sort(),
      bbCount: (byFormat['big-brother']?.rankings || []).length,
      tdCount: (byFormat['total-drama']?.rankings || []).length,
      // A rank is a position on ONE board, so each starts at 1.
      bbTop: (byFormat['big-brother']?.rankings || []).find(r => r.rank === 1)?.name,
      tdTop: (byFormat['total-drama']?.rankings || []).find(r => r.rank === 1)?.name,
      // Nobody from the house may appear on the camp's board. Checked by name:
      // both boards carry both social columns (the updater writes the other
      // show's as a zero), so a field's presence says nothing about the show.
      strays: (byFormat['total-drama']?.rankings || [])
        .filter(r => ['Misha','Jules','Joel','Tobias','Ireland','Aaron','Jane','Dylon','Gyselle',
          'Natasha','Felipe','Hasan','Nico','Harriett','Zella','Amberly','Stella'].includes(r.name))
        .map(r => r.name),
      // Ranks must be 1..N with no gaps on either board.
      bbRanks: (byFormat['big-brother']?.rankings || []).map(r => r.rank).sort((a, b) => a - b),
    };
  });

  expect(bb.formats).toEqual(['big-brother', 'total-drama']);
  expect(bb.bbCount).toBe(BB_PLAYERS);
  expect(bb.tdCount).toBe(TD_PLAYERS);
  expect(bb.strays).toEqual([]);
  expect(bb.bbTop).toBe('Misha');
  expect(bb.bbRanks).toEqual(Array.from({ length: BB_PLAYERS }, (_, i) => i + 1));
  expect(bb.tdTop).toBeTruthy();
});

test('a player page shows the ranking from their own show', async ({ page }) => {
  // The parameter is `player`, not `id`.
  await page.goto('/player.html?player=misha&show=big-brother');
  await page.waitForSelector('.pp-tier-pill', { timeout: 25000 });
  await page.waitForTimeout(500);

  // Misha won BB1 and tops that board. Before the split her tier came from a
  // Total Drama board that did not apply to her, so the page showed none.
  const tier = (await page.locator('.pp-tier-pill').first().textContent() || '').trim();
  expect(tier).not.toMatch(/unranked/i);
  expect(tier).toMatch(/S Tier/);
  // #1 of SEVENTEEN -- the Big Brother board's size, not Total Drama's 152.
  await expect(page.getByText('#1 / 17')).toBeVisible();
});

test('both shows keep their own board under "all shows"', async ({ page }) => {
  await page.goto('/rankings.html?show=all');
  await page.waitForSelector('.show-group-heading', { timeout: 20000 });
  const headings = await page.locator('.show-group-heading').allTextContents();
  // Separate sections, not one merged list — a Big Brother score and a Total
  // Drama score are computed on different rubrics and do not share a ladder.
  expect(headings.length).toBe(2);
  expect(headings.join(' ')).toMatch(/Big Brother/);
  expect(headings.join(' ')).toMatch(/Total Drama/);
});
