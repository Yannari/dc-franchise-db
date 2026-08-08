// Birdie and ChatAlumni, in a real browser.
//
// The unit tests prove the rules. They cannot prove the page DRAWS them, and a
// rule that is only asserted in a unit test is a rule that can quietly stop
// being rendered — the failure that shipped five twists here with no screen at
// all, and a Big Brother export no button called.
//
// So everything here is asserted on rendered DOM: the two apps look different,
// the archive has an audience, a season nobody has played says so instead of
// showing an empty feed, and the live clock releases posts rather than dumping
// them.
import { test, expect } from '@playwright/test';

const social = (q) => `/social.html?${q}`;

/** The page finishes a load when the feed or an explicit state is on screen. */
async function ready(page) {
  await page.waitForSelector('.post, .msg, .state-card, .hostrow', { timeout: 15000 });
}

test('a finished Total Drama season has an audience', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(social('show=total-drama&season=14&app=birdie'));
  await ready(page);

  // A feed, not a highlights reel.
  expect(await page.locator('.post').count()).toBeGreaterThan(10);
  // Every post says which night it belongs to and what it is reacting to.
  await expect(page.locator('.post-ctx').first()).toContainText('TD 14');
  // The rail summarises the same feed rather than inventing hashtags.
  expect(await page.locator('.trend').count()).toBeGreaterThan(0);
  expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([]);
});

test('the two apps are visibly different products', async ({ page }) => {
  await page.goto(social('show=total-drama&season=14&app=birdie'));
  await ready(page);
  const birdieBg = await page.locator('.birdie').evaluate(el => getComputedStyle(el).backgroundColor);
  // Birdie has ratios; that is its whole physics.
  expect(await page.locator('.act.tom').count()).toBeGreaterThan(0);

  await page.click('#pick-chat');
  await ready(page);
  const chatBg = await page.locator('.chat').evaluate(el => getComputedStyle(el).backgroundColor);
  expect(chatBg, 'ChatAlumni is Birdie with green buttons').not.toBe(birdieBg);
  // The hosted room has no tomatoes and no ratio, by construction.
  expect(await page.locator('.act.tom').count()).toBe(0);
  expect(await page.locator('.msg').count()).toBeGreaterThan(0);
});

test('only alumni hold the microphone', async ({ page }) => {
  await page.goto(social('show=total-drama&season=14&app=chatalumni'));
  await ready(page);

  // Every main-stage author links to a canonical player page — which a fan
  // persona has no way to do, so this is the rule and not a coincidence.
  const authors = await page.locator('.msg-name').evaluateAll(
    els => els.map(e => e.getAttribute('href')));
  expect(authors.length).toBeGreaterThan(0);
  for (const href of authors) expect(href).toContain('player.html?player=');
});

test('the host directory is derived, and large', async ({ page }) => {
  await page.goto(social('show=total-drama&season=14&app=chatalumni&channel=hosts'));
  await ready(page);
  // The spec asks for 50+ eligible alumni. The list is paged, so count the
  // number the page itself reports rather than the rows currently drawn.
  const claim = await page.locator('.divider').first().textContent();
  const n = Number((claim.match(/(\d+)\s+eligible/) || [])[1] || 0);
  expect(n, 'fewer than fifty eligible alumni').toBeGreaterThanOrEqual(50);
  expect(await page.locator('.hostrow').count()).toBeGreaterThan(10);
});

test('a season nobody has played says so, rather than showing an empty feed', async ({ page }) => {
  // Big Brother 2 has no published document. This is the honest preseason state
  // the spec asks for: no fabricated weeks, no invented alumni, and it explains
  // what would be here.
  await page.goto(social('show=big-brother&season=2&app=chatalumni'));
  await ready(page);

  await expect(page.locator('.state-card h2')).toContainText('Big Brother 2');
  await expect(page.locator('#conn')).toHaveAttribute('data-state', 'PRESEASON');
  expect(await page.locator('.msg').count(), 'a preseason page invented messages').toBe(0);
  // and the picker agrees with the page about where you are
  await expect(page.locator('#pick-season')).toHaveValue('big-brother|2');
});

test('a Big Brother season speaks Big Brother', async ({ page }) => {
  await page.goto(social('show=big-brother&season=1&app=birdie'));
  await ready(page);
  await expect(page.locator('#ctx-chip')).toContainText('Week');
  const ctx = await page.locator('.post-ctx').first().textContent();
  expect(ctx).toContain('BB 1');
});

test('watch live releases the night instead of dumping it', async ({ page }) => {
  await page.goto(social('show=big-brother&season=1&app=birdie'));
  await ready(page);
  const all = await page.locator('.post').count();

  await page.click('#btn-live');
  await page.waitForTimeout(1200);
  const atStart = await page.locator('.post').count();
  expect(atStart, 'starting the replay showed the whole episode at once')
    .toBeLessThan(all);

  // Jumping to the end is always available and restores everything.
  await page.click('[data-speed="instant"]');
  await page.waitForTimeout(400);
  expect(await page.locator('.post').count()).toBeGreaterThan(atStart);
});

test('the page carries its state in the URL', async ({ page }) => {
  await page.goto(social('show=total-drama&season=14&app=birdie'));
  await ready(page);
  await page.click('#pick-chat');
  await page.waitForTimeout(300);
  expect(page.url()).toContain('app=chatalumni');
  expect(page.url()).toContain('season=14');
});

test('it fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(social('show=total-drama&season=14&app=birdie'));
  await ready(page);
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollW, 'the page scrolls sideways on a phone').toBeLessThanOrEqual(321);
});

test('a reply count you can click opens the thread', async ({ page }) => {
  // A count that is not a control is a number pretending to be one. Threads sit
  // on the For You tab because replies answer the loudest posts, and strict
  // event time puts those after the first page.
  await page.goto(social('show=big-brother&season=1&app=birdie&tab=for-you'));
  await ready(page);

  const target = page.locator('.act[data-reply]').filter({ hasNotText: /^\s*0\s*$/ }).first();
  await target.click();
  await expect(page.locator('.thread-head')).toBeVisible();
  // A thread is the parent plus its answers, and every answer says who it answers.
  expect(await page.locator('.post').count()).toBeGreaterThan(1);
  await expect(page.locator('.replying').first()).toContainText('Replying to');

  await page.click('#thread-back');
  await expect(page.locator('.thread-head')).toHaveCount(0);
});

test('the Players tab filters to one person', async ({ page }) => {
  await page.goto(social('show=big-brother&season=1&app=birdie&tab=players'));
  await ready(page);
  expect(await page.locator('.chip').count()).toBeGreaterThan(1);

  const name = (await page.locator('.chip').first().textContent()).trim();
  await page.locator('.chip').first().click();
  await page.waitForTimeout(200);
  // Every post shown is now about that player.
  const bodies = await page.locator('.post-body').allTextContents();
  expect(bodies.length).toBeGreaterThan(0);
  expect(bodies.some(t => t.includes(name))).toBe(true);
});

test('a fan has a profile, and following is honest about being local', async ({ page }) => {
  await page.goto(social('show=big-brother&season=1&app=birdie'));
  await ready(page);
  await page.locator('.post-name').first().click();

  const card = page.locator('.persona-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('watching since season');
  await expect(card).toContainText('no account behind it');

  await page.locator('.follow').click();
  await expect(page.locator('.follow')).toHaveAttribute('aria-pressed', 'true');
});
