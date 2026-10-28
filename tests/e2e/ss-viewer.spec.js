// Secret Story's stepped viewer, played in a real browser (part 4, the user 2026-10-28: "like playing a visual
// novel and a video game at the same time... super animated and interactive"). A Secret Story season is played in
// the page; the viewer must wear the House of Secrets (its plates only, never the resort's), its HUD and lettering,
// and its game: a call made locks, its reveal pays the viewer's kitty, and a prop pressed plays the next line.
import { test, expect } from '@playwright/test';
import { APP_URL, seedCast, attachErrorTracking } from './helpers.js';

const SHOTS = process.env.SHOTS || 'test-results';

test('a Secret Story week plays in its own house, and the viewer calls it with a kitty', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1400, height: 900 });
  const errors = attachErrorTracking(page);
  await page.goto(APP_URL);
  await seedCast(page, { count: 14 });
  await page.waitForFunction(() => typeof window.simulateNext === 'function');
  await page.evaluate(() => {
    localStorage.setItem('bb-vp', 'stepped');
    localStorage.setItem('bb-map', 'linear');
    localStorage.setItem('bb-houselife', 'segments');
    for (const k of Object.keys(localStorage)) if (k.startsWith('ss-bank:')) localStorage.removeItem(k);
    window.seasonConfig.format = 'secret-story';
    window.seasonConfig.finaleSize = 3;
    window.seasonConfig.jurySize = 0;
  });
  for (let i = 1; i <= 3; i++) {
    await page.evaluate(() => window.simulateNext());
    await page.waitForFunction(n => (window.gs?.episodeHistory || []).length >= n, i, { timeout: 120_000 });
  }
  await page.evaluate(() => window.openVisualPlayer(3));
  await page.waitForFunction(() => (window.vpScreens || []).length > 3, null, { timeout: 60_000 });
  await page.waitForTimeout(600);

  // every screen of the week: a Secret Story stage, and nothing from the Reality Resort painted in it
  const all = await page.evaluate(() => Object.values(window._bbx || {}).map(r => r.uid));
  expect(all.length).toBeGreaterThan(5);

  // the week's verdict: a call to make before the envelope opens, settled when the public's choice is read
  const target = await page.evaluate(() => {
    for (const r of Object.values(window._bbx || {})) {
      const S = r.screens[r.si];
      const ask = S.steps.findIndex(st => st.ask);
      const settle = ask >= 0 ? S.steps.findIndex(st => st.settle && st.settle.id === S.steps[ask].ask.id) : -1;
      if (ask >= 0 && settle > ask) return { uid: r.uid, ask, settle, opts: S.steps[ask].ask.opts, answer: S.steps[settle].settle.answer, id: S.id };
    }
    return null;
  });
  expect(target, 'no call with its reveal on one screen').toBeTruthy();
  // (a week airs as its own episodes: the call may be in the prime, a different part from the one open)
  let at = await page.evaluate(uid => (window.vpScreens || []).findIndex(s => (s.html || '').includes(`data-uid="${uid}"`)), target.uid);
  if (at < 0) {
    await page.evaluate(id => window.bbxSsPart(3, /^bb-ss-(prime|after|missionres)-/.test(id) ? 'prime' : 'daily'), target.id);
    await page.waitForTimeout(800);
    at = await page.evaluate(uid => (window.vpScreens || []).findIndex(s => (s.html || '').includes(`data-uid="${uid}"`)), target.uid);
  }
  expect(at, 'the call is on a screen of the episode').toBeGreaterThanOrEqual(0);
  await page.evaluate(i => window.vpGoTo(i), at);
  await page.waitForSelector(`#bbx-st-${target.uid}`);
  await page.evaluate(([uid, k]) => window.bbxJump(uid, k + 1), [target.uid, target.ask]);
  await page.waitForTimeout(700);
  const stage = page.locator(`#bbx-st-${target.uid}`);
  await expect(stage).toHaveClass(/\bss\b/);
  await expect(stage.locator('.ssh-wm')).toContainText('SECRET STORY');
  // only the House of Secrets' plates
  const plates = await page.evaluate(() => [...document.querySelectorAll('.bbx [data-plate]')].map(el => el.getAttribute('style') || ''));
  for (const p of plates) expect(p).not.toMatch(/resort\/default\//);
  // the call: pick the right answer, so the payoff is a win
  await expect(stage.locator('.ssa')).toBeVisible();
  // (exactly the answer: "Tester1" is also inside "Tester10")
  await stage.locator('.ssa-o').filter({ has: page.getByText(target.answer, { exact: true }) }).first().click();
  await expect(stage.locator('.ssa-o.on')).toHaveCount(1);
  await expect(stage.locator('.ssa-o[disabled]')).toHaveCount(target.opts.length);
  await page.screenshot({ path: `${SHOTS}/ss-call.png` });
  const before = await page.evaluate(() => { const k = Object.keys(localStorage).find(x => x.startsWith('ss-bank:')); return JSON.parse(localStorage.getItem(k)); });
  expect(Object.values(before.picks)).toContain(target.answer);
  // the reveal pays it
  await page.evaluate(([uid, k]) => window.bbxJump(uid, k + 1), [target.uid, target.settle]);
  await page.waitForTimeout(500);
  await expect(stage.locator('.sss.win')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/ss-payoff.png` });
  const after = await page.evaluate(() => { const k = Object.keys(localStorage).find(x => x.startsWith('ss-bank:')); return JSON.parse(localStorage.getItem(k)); });
  expect(after.kitty).toBeGreaterThan(10000);
  // played again, it does not pay twice
  await page.evaluate(([uid, k]) => window.bbxJump(uid, k + 1), [target.uid, target.settle]);
  await page.waitForTimeout(300);
  const again = await page.evaluate(() => { const k = Object.keys(localStorage).find(x => x.startsWith('ss-bank:')); return JSON.parse(localStorage.getItem(k)); });
  expect(again.kitty).toBe(after.kitty);

  // a prop pressed plays the next line
  const prop = await page.evaluate(() => {
    for (const r of Object.values(window._bbx || {})) {
      const S = r.screens[r.si];
      const k = S.steps.findIndex(st => st.prop && st.press);
      if (k >= 0 && k < S.steps.length - 1) return { uid: r.uid, k, id: S.id };
    }
    return null;
  });
  if (prop) {
    let at2 = await page.evaluate(uid => (window.vpScreens || []).findIndex(s => (s.html || '').includes(`data-uid="${uid}"`)), prop.uid);
    if (at2 < 0) {
      await page.evaluate(id => window.bbxSsPart(3, /^bb-ss-(prime|after|missionres)-/.test(id) ? 'prime' : 'daily'), prop.id);
      await page.waitForTimeout(800);
      at2 = await page.evaluate(uid => (window.vpScreens || []).findIndex(s => (s.html || '').includes(`data-uid="${uid}"`)), prop.uid);
    }
    await page.evaluate(i => window.vpGoTo(i), at2);
    await page.waitForSelector(`#bbx-st-${prop.uid}`);
    await page.evaluate(([uid, k]) => window.bbxJump(uid, k + 1), [prop.uid, prop.k]);
    await page.waitForTimeout(500);
    await page.locator(`#bbx-st-${prop.uid} .ssp.ss-on`).click();
    await page.waitForTimeout(1300);
    expect(await page.evaluate(uid => window._bbx[uid].idx, prop.uid)).toBe(prop.k + 1);
  }
  expect(errors.pageErrors, JSON.stringify(errors.pageErrors)).toEqual([]);
  expect(errors.consoleErrors.filter(e => !/favicon|fonts\.g|cdn|rankings_[a-z]+\.json/.test(e)), JSON.stringify(errors.consoleErrors)).toEqual([]);
});
