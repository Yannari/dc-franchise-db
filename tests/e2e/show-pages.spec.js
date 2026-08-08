// The show switcher, on the pages that used to ignore it.
//
// It is mounted by the site header on EVERY page, so it looked operable
// everywhere and filtered on two. A control that appears to work is worse than
// no control: "show me Big Brother" answered with all 152 players, 134 of whom
// have never been in that house.
//
// Asserted on counts rather than on the control, because the bug was never in
// the switcher — it was in the pages not listening.
import { test, expect } from '@playwright/test';

const BB_PLAYERS = 18;      // the cast of the one Big Brother season played
const ALL_PLAYERS = 152;

test('the timeline shows one show at a time', async ({ page }) => {
  await page.goto('/timeline.html?show=big-brother');
  await page.waitForSelector('th.season-col', { timeout: 15000 });
  await page.waitForTimeout(500);

  const cols = await page.locator('th.season-col a').allTextContents();
  expect(cols.map(c => c.trim())).toEqual(['BB1']);
  expect(await page.locator('tbody tr').count()).toBe(BB_PLAYERS);

  await page.goto('/timeline.html?show=all');
  await page.waitForSelector('th.season-col', { timeout: 15000 });
  await page.waitForTimeout(500);
  expect(await page.locator('th.season-col a').count()).toBeGreaterThan(14);
});

test('the players list shows one show at a time', async ({ page }) => {
  await page.goto('/devotees.html?show=big-brother');
  await page.waitForSelector('.card', { timeout: 15000 });
  await page.waitForTimeout(800);
  expect(await page.locator('.card').count()).toBe(BB_PLAYERS);

  await page.goto('/devotees.html?show=all');
  await page.waitForSelector('.card', { timeout: 15000 });
  await page.waitForTimeout(800);
  expect(await page.locator('.card').count()).toBe(ALL_PLAYERS);
});

test('a leaderboard is scoped to its show', async ({ page }) => {
  // Big Brother's only season was won by Wayne, so he tops a wins board that is
  // genuinely scoped. Alejandro tops it when both shows are counted.
  // Waiting on the board's TEXT rather than a row selector: the markup differs
  // between the worker and the local-JSON fallback, and which one answers is
  // exactly the thing a test must not depend on.
  await page.goto('/leaderboards.html?show=big-brother');
  await expect(page.locator('#board')).toContainText('Wayne', { timeout: 20000 });
  await expect(page.locator('#board')).not.toContainText('Alejandro');

  await page.goto('/leaderboards.html?show=total-drama');
  await expect(page.locator('#board')).toContainText('Alejandro', { timeout: 20000 });
});

test('the social feed follows the show you picked', async ({ page }) => {
  await page.goto('/social.html?show=big-brother');
  await page.waitForSelector('.post, .msg, .state-card', { timeout: 15000 });
  await expect(page.locator('#ctx-chip')).toContainText('Big Brother');
});
