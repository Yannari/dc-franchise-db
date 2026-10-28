// The cast screen's Secrets tab on a Secret Story season, screenshotted (part 4).
//   (python serve.py 4173)   node tools/ss-cast-shot.mjs [out.png]
import { chromium } from 'playwright';

const out = process.argv[2] || 'shots/ss-cast-secrets.png';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, baseURL: process.env.SS_URL || 'http://127.0.0.1:4173' });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.route(url => !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(String(url)), r => r.abort());
await page.goto('/simulator.html', { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForFunction(() => typeof window.renderCast === 'function' && typeof window.crSetView === 'function', null, { timeout: 90_000 });
await page.evaluate(async () => {
  const r = await (await fetch('franchise_roster.json')).json();
  const list = (Object.values(r)[0] || []).filter(p => p.slug && p.stats && /^[mf]$/.test(p.gender || ''));
  const pick = [...list.filter(p => p.gender === 'm').slice(0, 6), ...list.filter(p => p.gender === 'f').slice(0, 6)];
  window.players = pick.map((p, i) => ({ name: p.name, slug: p.slug, gender: p.gender, sexuality: p.sexuality || 'straight', archetype: p.archetype, stats: { ...p.stats }, id: 'r' + i }));
  window.seasonConfig.format = 'secret-story';
  window.renderCast();
  window.showTab('cast');
  window.crSetView('secrets');
});
await page.waitForTimeout(1500);
const room = await page.$('#cast-room');
await (room || page).screenshot({ path: out, ...(room ? {} : { fullPage: true }) });
console.log(out, errors.length ? `ERRORS ${errors.join(' | ')}` : 'no errors');
await browser.close();
