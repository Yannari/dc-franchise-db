// The power table on the season page: who ran each week, as faces.
//
// Two things here have already been wrong once and are cheap to keep right.
// The block is assembled from THREE lists and each one alone lies — the
// openers lose the replacement nominee (BB1 week two votes on somebody who
// was never nominated, and evicts her), and the final pair loses everybody
// the veto took down. And the table only earns its place when the season
// actually recorded power: Total Drama exports carry the eliminated player
// and the ballots, nothing else, so a camp would draw a column of dashes.
import { test, expect } from '@playwright/test';

const openWiki = async (page, season) => {
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`/season_ref.html?season=${season}`);
  await page.waitForSelector('.sr-tab', { timeout: 20000 });
  await page.getByRole('button', { name: /Wiki/ }).click();
  await page.waitForTimeout(2000);
  return errors;
};

test('a Big Brother season draws every chair, with faces', async ({ page }) => {
  const errors = await openWiki(page, 'bb-1');
  await page.waitForSelector('.sr-pow-t', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  expect(errors, 'the page threw while building the table').toEqual([]);
  expect(await page.locator('.sr-pow-t thead th').allTextContents())
    .toEqual(['Week', 'Head of Household', 'Power of Veto', 'On the block', 'Evicted']);
  expect(await page.locator('.sr-pow-t tbody tr').count()).toBe(15);

  // Every chip is a face, not a bare name: no unresolved lookups, no 404s.
  const chips = await page.locator('.sr-pow-t .sr-chip').count();
  const faces = await page.locator('.sr-pow-t .sr-chip-av img').count();
  expect(faces, 'a chip resolved to no cast entry').toBe(chips);
  expect(await page.$$eval('.sr-pow-t img',
    els => els.filter(e => !e.complete || e.naturalWidth === 0).length),
  'an avatar failed to load').toBe(0);

  // Replacement nominees are on the block and must be drawn there.
  expect(await page.locator('.sr-nom.is-late').count(),
    'no replacement nominees drawn — the block is being built from the openers')
    .toBeGreaterThan(0);
  expect(await page.locator('.sr-nom.is-saved').count()).toBeGreaterThan(0);

  // Week two is the case that caught it: Millie goes up after the veto and
  // is the one evicted, so she must appear on the block AND in the last cell.
  const wk2 = page.locator('.sr-pow-t tbody tr').nth(1);
  expect(await wk2.locator('.sr-nom').count()).toBe(3);
  await expect(wk2.locator('.sr-chip.is-out .sr-chip-n')).toHaveText('Millie');

  // A tie is not a margin. It says so.
  const tied = page.locator('.sr-pow-wk span.is-tied');
  expect(await tied.count(), 'BB1 has two ties the HOH broke').toBe(2);
  expect(await tied.first().getAttribute('title')).toContain('broke it and evicted');
});

test('a season that recorded no power draws no table', async ({ page }) => {
  const errors = await openWiki(page, '13');
  expect(errors).toEqual([]);
  expect(await page.locator('.sr-pow-t').count(),
    'drew a power table for a season whose export holds no immunity winner').toBe(0);
  // The section it would have replaced is still there.
  expect((await page.locator('#sr-panel-wiki h2').allTextContents()).join(' '))
    .toContain('Voting history');
});
