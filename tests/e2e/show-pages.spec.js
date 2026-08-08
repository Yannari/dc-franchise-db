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

test('a two-show career is described as two careers', async ({ page }) => {
  // "3 seasons" is true and useless for somebody who played two of one show and
  // one of another: it reads as a three-season veteran of one franchise, which
  // is a different career.
  await page.goto('/player.html?player=bowie');
  await page.waitForSelector('.pp-showhead', { timeout: 15000 });

  await expect(page.locator('.pp-meta')).toContainText('2 Total Drama');
  await expect(page.locator('.pp-meta')).toContainText('1 Big Brother');

  // Each show gets its own heading and its own bars, because the career totals
  // are cross-format sums — one "Challenge Wins" bar belongs to neither show.
  const heads = await page.locator('.pp-showhead').allTextContents();
  expect(heads).toHaveLength(2);
  expect(await page.locator('.pp-statbars').count()).toBe(2);

  // Big Brother keeps counters Total Drama has no equivalent for, and they were
  // computed into byShow and displayed nowhere at all.
  const chips = await page.locator('.pp-chip .l').allTextContents();
  expect(chips).toContain('HOH');
  expect(chips).toContain('Vetoes');
  expect(chips).toContain('Times Nominated');
});

test('a one-show career is not made to look like two', async ({ page }) => {
  await page.goto('/player.html?player=alejandro');
  await page.waitForSelector('.pp-statbars', { timeout: 15000 });
  expect(await page.locator('.pp-showhead').count()).toBe(0);
  await expect(page.locator('.pp-meta')).toContainText('4 seasons');
});

test('the wiki is its own tab, and one article per show', async ({ page }) => {
  // A character's Big Brother article and their Total Drama article are
  // different articles. Stacked under one heading — which is how this first
  // shipped — every section had to be read twice to work out which show it was
  // about.
  await page.goto('/player.html?player=bowie');
  await page.waitForSelector('.pp-viewtab', { timeout: 15000 });
  await expect(page.locator('#pp-view-wiki')).toBeHidden();

  await page.click('#pv-wiki');
  await expect(page.locator('.wk-article')).toBeVisible();
  // Laid out like a fandom article: infobox, contents, sections.
  await expect(page.locator('.wk-infobox')).toBeVisible();
  await expect(page.locator('.wk-lead')).toContainText('Bowie');

  const td = await page.locator('.wk-section h2').allTextContents();
  expect(td.join(' ')).toContain('Season 9');
  await expect(page.locator('.wk-ib-show')).toContainText('Total Drama');
});

test('the wiki follows the show switcher', async ({ page }) => {
  await page.goto('/player.html?player=bowie&view=wiki&show=big-brother');
  await page.waitForSelector('.wk-article', { timeout: 15000 });
  await expect(page.locator('.wk-ib-show')).toContainText('Big Brother');

  const heads = await page.locator('.wk-section h2').allTextContents();
  expect(heads.join(' '), 'the Big Brother article is showing Total Drama seasons')
    .not.toContain('Season 9');
});

test('a show they never played says so, with a way across', async ({ page }) => {
  // Not an empty page with headings and nothing under them.
  await page.goto('/player.html?player=alejandro&view=wiki&show=big-brother');
  await page.waitForSelector('.wk-empty', { timeout: 15000 });
  await expect(page.locator('.wk-empty h2')).toContainText('No Big Brother article');

  await page.click('[data-wiki-show="total-drama"]');
  await expect(page.locator('.wk-article')).toBeVisible();
  await expect(page.locator('.wk-ib-show')).toContainText('Total Drama');
});
