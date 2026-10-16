// Big Brother's finale night on the stepped stage, in a real browser (the user, 2026-10-16: the final cut on the
// library plate, the jury questions answered from the living room, no walk to the key box, the winner and America's
// Favourite without the cast around them). Plays a season to the end, then paints the moments and screenshots them.
import { test, expect } from '@playwright/test';
import { APP_URL, seedCast, attachErrorTracking } from './helpers.js';

const SHOTS = process.env.SHOTS || 'test-results';

test('finale night: the living room, the stage, the key box and the whole cast', async ({ page }) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 1400, height: 900 });
  const errors = attachErrorTracking(page);
  await page.goto(APP_URL);
  await seedCast(page, { count: 12 });
  await page.waitForFunction(() => typeof window.simulateNext === 'function');
  await page.evaluate(() => {
    localStorage.setItem('bb-vp', 'stepped');
    localStorage.setItem('bb-map', 'linear');
    localStorage.setItem('bb-houselife', 'segments');
    window.seasonConfig.format = 'big-brother';
    window.seasonConfig.jurySize = 7;
  });
  for (let i = 0; i < 20; i++) {
    const done = await page.evaluate(() => (window.gs?.episodeHistory || []).some(e => e.isFinale) || window.gs?.phase === 'complete');
    if (done) break;
    const n = await page.evaluate(() => (window.gs?.episodeHistory || []).length);
    await page.evaluate(() => window.simulateNext());
    await page.waitForFunction(k => (window.gs?.episodeHistory || []).length > k || window.gs?.phase === 'complete', n, { timeout: 120_000 });
  }
  const fin = await page.evaluate(() => (window.gs.episodeHistory || []).findIndex(e => e.isFinale) + 1);
  expect(fin).toBeGreaterThan(0);
  await page.evaluate(n => window.openVisualPlayer(n), fin);
  await page.waitForFunction(() => (window.vpScreens || []).length > 5);
  const shoot = async (id, at, name) => {
    const si = await page.evaluate(x => (window.vpScreens || []).findIndex(s => s.id === x), id);
    expect(si, id).toBeGreaterThanOrEqual(0);
    await page.evaluate(i => window.vpGoTo(i), si);
    await page.waitForSelector('.bbx[data-uid]', { state: 'attached' });
    await page.waitForTimeout(600);
    const uid = await page.evaluate(() => document.querySelector('.bbx[data-uid]').dataset.uid);
    const idx = await page.evaluate(([u, f]) => { const S = window._bbx[u].screens[window._bbx[u].si]; return typeof f === 'number' ? f : S.steps.findIndex(st => new RegExp(f).test(st.t || '')); }, [uid, at]);
    await page.evaluate(([u, n]) => window.bbxJump(u, n + 1), [uid, idx]);
    await page.waitForTimeout(1400);
    const plate = await page.evaluate(() => document.querySelector('.bbx-stage [data-plate]')?.dataset.plate || null);
    console.log(name, 'step', idx, 'plate', plate);
    await page.locator('.bbx-stage').screenshot({ path: `${SHOTS}/bbf-${name}.png` });
    return plate;
  };
  expect(await shoot('bb-final-cut', 'cast the only vote', 'final-cut')).toBe('living-screens');
  expect(await shoot('bb-ftc-questions', 'take a seat', 'jury-q-seated')).toBe('studio-finale');
  await shoot('bb-jury', 'walks to the box|stops in front of the box|looks at the two keys', 'key-walk');
  await shoot('bb-winner', 'rushes the stage', 'winner-crowd');
  await shoot('bb-afh', 'comes forward', 'afp');
  await shoot('bb-reunion', 'welcome back every houseguest', 'reunion');
  expect(errors.pageErrors, JSON.stringify(errors.pageErrors)).toEqual([]);
});
