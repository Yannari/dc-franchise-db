// The run strip on a player page: one season, week by week.
//
// It is built from the season document rather than the player record, which
// is the whole point — the record holds totals and totals cannot say whether
// the wins came early. So the guard is that it AGREES with the document, on
// a player whose season is known: Caleb's BB1 is one Head of Household in
// week eight, vetoes in three and eleven through fourteen, and evicted in
// fifteen. If the strip and the season page ever disagree, one of them is
// reading the block wrong, and that has already happened once.
import { test, expect } from '@playwright/test';

const openSeason = async (page, slug, tab) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`/player.html?player=${slug}`);
  await page.waitForSelector('.pp-run', { timeout: 20000 });
  await page.locator('.pp-tab', { hasText: tab }).click();
  await page.waitForTimeout(700);
  return page.locator('.pp-panel.on .pp-run');
};

test('a Big Brother run matches the season it came from', async ({ page }) => {
  const run = await openSeason(page, 'caleb', 'BB1');
  const tiles = run.locator('.pp-wk');
  expect(await tiles.count()).toBe(15);

  const week = n => tiles.nth(n - 1);
  await expect(week(8).locator('.m-h')).toHaveCount(1);       // HOH
  await expect(week(3).locator('.m-v')).toHaveCount(1);       // veto
  for (const n of [11, 12, 13, 14]) await expect(week(n).locator('.m-v')).toHaveCount(1);
  expect(await run.locator('.m-v').count(), 'five vetoes, no more').toBe(5);
  await expect(week(15)).toHaveClass(/is-out/);
  await expect(week(1).locator('.m-h, .m-v, .m-b')).toHaveCount(0);

  // The sentence says the same thing the tiles do.
  const sum = await run.locator('.pp-run-sum').innerText();
  expect(sum).toContain('1 Head of Household and 5 vetoes');
  expect(sum).toContain('Evicted in week 15');

  // Every tile explains itself on hover.
  expect(await week(8).getAttribute('title')).toContain('won Head of Household');
});

test('the winner is told they won, not that they are still standing', async ({ page }) => {
  const run = await openSeason(page, 'wayne', 'BB1');
  expect(await run.locator('.pp-run-sum').innerText()).toContain('Won the season');
  // Nominated once and saved reads as a sentence, not as "1 of them".
  expect(await run.locator('.pp-run-sum').innerText()).not.toMatch(/once, and came off the block \d/);
});

test('a camp gets the votes it drew, and no empty comp tiles', async ({ page }) => {
  const run = await openSeason(page, 'caleb', 'S13');
  expect(await run.locator('.m-h, .m-v, .m-b').count(),
    'a Total Drama export records no comp winners — these cannot be real').toBe(0);
  expect(await run.locator('.m-x').count(), 'no votes drawn at all').toBeGreaterThan(0);
  expect(await run.locator('.pp-run-sum').innerText()).toMatch(/Took \d+ votes across the season/);
  // Episodes after the exit stay on the strip, greyed, so the season keeps
  // its length and an early boot looks like one.
  expect(await run.locator('.pp-wk.is-gone').count()).toBeGreaterThan(0);
});
