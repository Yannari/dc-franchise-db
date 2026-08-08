// tests/show-pages.e2e.test.js
// The pages in a real browser, driven by URL rather than by clicking — which is
// the reason the switcher's state lives in the URL at all.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const BASE = 'http://localhost:4179';
let server, browser;

beforeAll(async () => {
  server = spawn('python', ['serve.py', '4179'], { cwd: process.cwd(), stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));
  browser = await chromium.launch();
}, 60000);

afterAll(async () => { await browser?.close(); server?.kill(); });

const open = async (path) => {
  const page = await browser.newPage();
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  return page;
};

describe('seasons.html', () => {
  it('shows both shows, under their own headings', async () => {
    const page = await open('/seasons.html');
    const headings = await page.$$eval('[data-show-group]', els => els.map(e => e.dataset.showGroup));
    expect(headings).toEqual(['total-drama', 'big-brother']);
    expect(await page.$$eval('[data-season-format]', e => e.length)).toBe(15);
    await page.close();
  });

  it('narrows to one show from the URL', async () => {
    const page = await open('/seasons.html?show=big-brother');
    const formats = await page.$$eval('[data-season-format]', els =>
      [...new Set(els.map(e => e.dataset.seasonFormat))]);
    expect(formats).toEqual(['big-brother']);
    expect(await page.$$eval('[data-season-format]', e => e.length)).toBe(1);
    await page.close();
  });

  it('treats a nonsense show as all of them', async () => {
    const page = await open('/seasons.html?show=wrestling');
    expect(await page.$$eval('[data-season-format]', e => e.length)).toBe(15);
    await page.close();
  });
});

describe('awards.html', () => {
  it('narrows to one show from the URL', async () => {
    const page = await open('/awards.html?show=big-brother');
    const formats = await page.$$eval('[data-season-format]', els =>
      [...new Set(els.map(e => e.dataset.seasonFormat))]);
    expect(formats).toEqual(['big-brother']);
    await page.close();
  });
});

describe('rankings.html', () => {
  it('says why a show has no board yet', async () => {
    const page = await open('/rankings.html?show=big-brother');
    expect(await page.textContent('body')).toMatch(/No Big Brother rankings yet/);
    await page.close();
  });

  it('still ranks Total Drama, with fame stars', async () => {
    const page = await open('/rankings.html?show=total-drama');
    expect(await page.$$eval('.fame-rating', e => e.length)).toBeGreaterThan(0);
    await page.close();
  });
});
