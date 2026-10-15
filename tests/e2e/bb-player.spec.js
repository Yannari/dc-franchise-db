// The Big Brother viewer's player bar and TV mode, in a real browser (the user, 2026-10-15: "a media player for the
// screen we're in... auto mode with speed... in house life I can't advance forward, backward"). Scene skips, line
// steps across a conversation's start, the seek bar, the speed, play/pause, a TV mode that covers the window with
// the bar over the picture, Intel inside it, and the bar fading on a still mouse.
import { test, expect } from '@playwright/test';
import { APP_URL, seedCast, attachErrorTracking } from './helpers.js';

const SHOTS = process.env.SHOTS || 'test-results';

test('the player bar drives a House Life screen, and TV mode fills the window', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1400, height: 900 });
  const errors = attachErrorTracking(page);
  await page.goto(APP_URL);
  await seedCast(page, { count: 12 });
  await page.waitForFunction(() => typeof window.simulateNext === 'function');
  await page.evaluate(() => {
    localStorage.setItem('bb-vp', 'stepped');
    localStorage.setItem('bb-map', 'map');
    localStorage.setItem('bb-houselife', 'segments');
    window.seasonConfig.format = 'big-brother';
    window.seasonConfig.jurySize = 7;
    window.simulateNext();
  });
  await page.waitForFunction(() => (window.gs?.episodeHistory || []).length >= 1, null, { timeout: 120_000 });
  await page.evaluate(() => window.openVisualPlayer(1));
  await page.waitForFunction(() => (window.vpScreens || []).length > 3);
  // the first House Life screen with conversations
  const at = await page.evaluate(() => (window.vpScreens || []).findIndex(s => /bbx-bar/.test(s.html || '') && /House life|houselife/i.test((s.label || '') + (s.html || '').slice(0, 4000)) && /bbx-ticks"><i/.test(s.html || '')));
  expect(at, 'no House Life screen with scene ticks').toBeGreaterThanOrEqual(0);
  await page.evaluate(i => window.vpGoTo(i), at);
  await page.waitForSelector('.bbx .bbx-bar', { state: 'attached' });
  await page.waitForTimeout(800);
  const uid = await page.evaluate(() => document.querySelector('.bbx[data-uid]').dataset.uid);
  const state = () => page.evaluate(u => ({ idx: window._bbx[u].idx, mode: window._bbx[u].map?.mode, count: document.getElementById(`bbx-count-${u}`)?.textContent, seek: document.getElementById(`bbx-seek-${u}`)?.value, play: document.getElementById(`bbx-auto-${u}`)?.dataset.st || 'play', speed: document.getElementById(`bbx-speed-${u}`)?.textContent }), uid);
  console.log('start', JSON.stringify(await state()));
  await page.screenshot({ path: `${SHOTS}/bbp-0-map.png` });

  // next scene from the map: into the first conversation
  await page.click('.bbx-bar button[title^="Next scene"]');
  await page.waitForTimeout(900);
  const s1 = await state(); console.log('next scene', JSON.stringify(s1));
  expect(s1.mode).toBe('play');
  // a line forward, a line back
  await page.click('.bbx-bar button[title^="Next line"]'); await page.waitForTimeout(200);
  const s2 = await state(); console.log('next line', JSON.stringify(s2));
  expect(s2.idx).toBe(s1.idx + 1);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(200);
  expect((await state()).idx).toBe(s1.idx);
  // next scene again, then back past the start of a conversation into the one before
  await page.keyboard.press('Shift+ArrowRight'); await page.waitForTimeout(400);
  const s3 = await state(); console.log('scene 2', JSON.stringify(s3));
  expect(s3.idx).toBeGreaterThan(s2.idx);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(300);
  const s4 = await state(); console.log('back across', JSON.stringify(s4));
  expect(s4.idx).toBe(s3.idx - 1);
  expect(s4.mode).toBe('play');
  // the seek bar, pulled with the mouse: the bubble says the line, the stage follows, and letting go keeps it
  const box = await page.locator(`#bbx-seek-${uid}`).boundingBox();
  const xAt = f => box.x + 7 + f * (box.width - 14);
  await page.mouse.move(xAt(0.1), box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(xAt(0.3), box.y + box.height / 2, { steps: 8 });
  const mid = await page.evaluate(u => ({ idx: window._bbx[u].idx, tip: document.getElementById(`bbx-tip-${u}`)?.textContent, on: document.getElementById(`bbx-tip-${u}`)?.classList.contains('on') }), uid);
  console.log('dragging', JSON.stringify(mid));
  expect(mid.on).toBe(true);
  expect(mid.tip.startsWith(`${mid.idx + 1} / `)).toBe(true);
  await page.screenshot({ path: `${SHOTS}/bbp-1b-drag.png` });
  await page.mouse.move(xAt(0.5), box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  const after = await state(); console.log('released', JSON.stringify(after));
  expect(Math.abs((after.idx + 1) / Number(after.count.split('/')[1]) - 0.5)).toBeLessThan(0.05);
  // a click on the bar jumps there
  const box2 = await page.locator(`#bbx-seek-${uid}`).boundingBox();
  await page.mouse.click(box2.x + 7 + 0.2 * (box2.width - 14), box2.y + box2.height / 2); await page.waitForTimeout(300);
  const clicked = await state(); console.log('clicked', JSON.stringify(clicked));
  expect(Math.abs((clicked.idx + 1) / Number(clicked.count.split('/')[1]) - 0.2)).toBeLessThan(0.05);
  // speed and play
  await page.click(`#bbx-speed-${uid}`);
  const s5 = await state(); console.log('speed', s5.speed);
  expect(s5.speed).not.toBe('1×');
  await page.keyboard.press(' '); await page.waitForTimeout(2500);
  const s6 = await state(); console.log('playing', JSON.stringify(s6));
  expect(s6.play).toBe('pause');
  expect(s6.idx).toBeGreaterThan(2);
  await page.keyboard.press(' '); await page.waitForTimeout(200);
  expect((await state()).play).toBe('play');
  await page.keyboard.press(' '); await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}/bbp-1-bar-playing.png` });
  // the pause icon is visible: its colour is not the button's (it was cyan on cyan, the user: "there's no pause icon")
  const ink = await page.evaluate(u => { const b = document.getElementById(`bbx-auto-${u}`); const cs = getComputedStyle(b); return { fg: cs.color, bg: cs.backgroundColor, svg: !!b.querySelector('svg rect') }; }, uid);
  console.log('pause button', JSON.stringify(ink));
  expect(ink.svg).toBe(true);
  expect(ink.fg).not.toBe(ink.bg);
  await page.keyboard.press(' '); await page.waitForTimeout(200);
  await page.screenshot({ path: `${SHOTS}/bbp-1-bar.png` });

  // TV mode: the screen block covers the window, the bar overlays the picture, Intel still opens
  await page.keyboard.press('f'); await page.waitForTimeout(600);
  const tv = await page.evaluate(u => {
    const scr = document.getElementById(`bbx-scr-${u}`).getBoundingClientRect();
    const st = document.getElementById(`bbx-st-${u}`).getBoundingClientRect();
    const bar = document.querySelector('.bbx .bbx-bar').getBoundingClientRect();
    return { on: document.getElementById('visual-player').classList.contains('bbx-tv'), scr: [scr.width, scr.height], st: [Math.round(st.width), Math.round(st.height)], barBottom: Math.round(bar.bottom), vh: innerHeight, vw: innerWidth };
  }, uid);
  console.log('tv', JSON.stringify(tv));
  expect(tv.on).toBe(true);
  expect(tv.scr[0]).toBe(tv.vw);
  expect(tv.scr[1]).toBe(tv.vh);
  expect(Math.max(tv.st[0], tv.st[1] * 16 / 9)).toBeGreaterThan(tv.vw * 0.95 - 1);
  await page.screenshot({ path: `${SHOTS}/bbp-2-tv.png` });
  await page.keyboard.press('i'); await page.waitForTimeout(300);
  expect(await page.evaluate(() => !!document.querySelector('.bbx.intel-open'))).toBe(true);
  await page.screenshot({ path: `${SHOTS}/bbp-3-tv-intel.png` });
  await page.keyboard.press('i');
  // still mouse: the bar fades
  await page.waitForTimeout(3000);
  expect(await page.evaluate(() => document.getElementById('visual-player').classList.contains('bbx-idle'))).toBe(true);
  await page.mouse.move(300, 300); await page.waitForTimeout(100);
  expect(await page.evaluate(() => document.getElementById('visual-player').classList.contains('bbx-idle'))).toBe(false);
  await page.screenshot({ path: `${SHOTS}/bbp-4-tv-moved.png` });
  expect(errors.pageErrors, JSON.stringify(errors.pageErrors)).toEqual([]);
});
