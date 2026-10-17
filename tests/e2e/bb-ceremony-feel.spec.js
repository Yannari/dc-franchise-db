// Big Brother's ceremonies as a game (the user's #9, 2026-10-16): the veto player pick draws chips out of a bag, each
// one turning over, while the field fills a slot at a time; the night of the HOH competition, the room opens, the key
// turns and the whole house pours in. Plays three weeks, then paints those moments and screenshots them.
import { test, expect } from '@playwright/test';
import { APP_URL, seedCast, attachErrorTracking } from './helpers.js';

const SHOTS = process.env.SHOTS || 'test-results';

test('the veto draw and the HOH room', async ({ page }) => {
  test.setTimeout(400_000);
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
  });
  for (let i = 0; i < 3; i++) {
    const n = await page.evaluate(() => (window.gs?.episodeHistory || []).length);
    await page.evaluate(() => window.simulateNext());
    await page.waitForFunction(k => (window.gs?.episodeHistory || []).length > k, n, { timeout: 120_000 });
  }
  const ep = await page.evaluate(() => (window.gs.episodeHistory || []).length);
  await page.evaluate(n => window.openVisualPlayer(n), ep);
  await page.waitForFunction(() => (window.vpScreens || []).length > 5);
  const shoot = async (id, at, name, wait = 2600) => {
    const si = await page.evaluate(x => (window.vpScreens || []).findIndex(s => s.id === x), id);
    expect(si, id).toBeGreaterThanOrEqual(0);
    await page.evaluate(i => window.vpGoTo(i), si);
    await page.waitForSelector('.bbx[data-uid]', { state: 'attached' });
    await page.waitForTimeout(600);
    const uid = await page.evaluate(() => document.querySelector('.bbx[data-uid]').dataset.uid);
    const idx = await page.evaluate(([u, f]) => { const S = window._bbx[u].screens[window._bbx[u].si]; return typeof f === 'number' ? f : S.steps.findIndex(st => new RegExp(f).test(st.t || '')); }, [uid, at]);
    expect(idx, `${name}: ${at}`).toBeGreaterThanOrEqual(0);
    await page.evaluate(([u, n]) => window.bbxJump(u, n + 1), [uid, idx]);
    await page.waitForTimeout(wait);
    const plate = await page.evaluate(() => document.querySelector('.bbx-stage [data-plate]')?.dataset.plate || null);
    console.log(name, 'step', idx, 'plate', plate);
    await page.locator('.bbx-stage').screenshot({ path: `${SHOTS}/bbc-${name}.png` });
    return plate;
  };
  await shoot('bb-vdraw', '^[^ ]+ draws', 'draw-chip-mid', 50);
  await shoot('bb-vdraw', '^[^ ]+ draws', 'draw-chip');
  expect(await page.locator('.bbx-stage .vfield .vfs').count()).toBeGreaterThanOrEqual(6);
  await shoot('bb-vdraw', "That's our|So that's the field|players\. May", 'draw-field');
  expect(await shoot('bb-hohroom', 'The key turns', 'hohroom-door', 50)).toBe('hoh-suite');
  await shoot('bb-hohroom', 'photos|Photos', 'hohroom-crowd');
  await shoot('bb-hohroom', '.', 'hohroom-end', 1200);
  // an island moment (bb-events/island-life.js) on its own spot, from whichever of the three weeks has one
  let shot = null;
  for (let e = ep; e >= 1 && !shot; e--) {
    await page.evaluate(n => window.openVisualPlayer(n), e);
    await page.waitForFunction(() => (window.vpScreens || []).length > 5);
    shot = await page.evaluate(() => {
      for (const [vi, V] of (window.vpScreens || []).entries()) {
        const u = /data-uid="([^"]+)"/.exec(V.html || '')?.[1];
        const X = u && window._bbx[u];
        const S = X && X.screens[X.si];
        const k = S ? (S.steps || []).findIndex(st => /^island-/.test(String(st.scene?.step || ''))) : -1;
        if (k >= 0) return { vi, u, k, step: S.steps[k].scene.step, plate: S.steps[k].scene.plate };
      }
      return null;
    });
  }
  expect(shot, 'an island moment in three weeks').toBeTruthy();
  await page.evaluate(i => window.vpGoTo(i), shot.vi);
  await page.waitForTimeout(600);
  await page.evaluate(([u, n]) => window.bbxJump(u, n + 1), [shot.u, shot.k]);
  await page.waitForTimeout(1500);
  const plate = await page.evaluate(u => document.querySelector(`#bbx-st-${u} [data-plate]`)?.dataset.plate || null, shot.u);
  console.log('island', shot.step, 'plate', plate);
  expect(plate).toBe(shot.plate);
  await page.locator(`#bbx-st-${shot.u}`).screenshot({ path: `${SHOTS}/bbc-island.png` });
  expect(errors.pageErrors, JSON.stringify(errors.pageErrors)).toEqual([]);
});
