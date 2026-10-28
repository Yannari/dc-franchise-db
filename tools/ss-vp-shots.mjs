// The Secret Story stepped viewer, screenshotted (part 4): a real season played in the page, the player
// opened on an episode, and one shot per kind of moment (the Voice, a confessional, a call, a prop,
// the secret card, a title card), so the House of Secrets' look can be checked by eye.
//   (python serve.py 4173; 127.0.0.1, since headless Chromium's localhost can be IPv6)   node tools/ss-vp-shots.mjs [episode] [max] [kinds]
//   kinds: comma list of voice,dr,say,host,beat,ask,prop,card,rest (default: all)
// Shots land in $SS_SHOTS (default shots/ss-vp)/e<ep>-<n>-<kind>-<screen>.png.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { seedCast } from '../tests/e2e/helpers.js';

const [ep = '2', max = '24', kinds = 'voice,dr,say,host,beat,ask,prop,card,rest'] = process.argv.slice(2);
const base = process.env.SS_URL || 'http://127.0.0.1:4173';
const OUT = process.env.SS_SHOTS || 'shots/ss-vp';
const want = new Set(kinds.split(','));
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, baseURL: base });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource|404/.test(m.text())) errors.push(m.text()); });
// (outside requests, the web fonts and the CDN, are not needed for a look and can hang a headless load)
await page.route(url => !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(String(url)), r => r.abort());
await page.goto('/simulator.html', { waitUntil: 'domcontentloaded', timeout: 90_000 });
await page.waitForFunction(() => typeof window.renderCast === 'function' && typeof window.simulateNext === 'function', null, { timeout: 90_000 });
// a real cast, so the faces are on the stage (falls back to the e2e testers)
const real = await page.evaluate(async () => {
  try {
    const r = await (await fetch('franchise_roster.json')).json();
    const list = (Object.values(r)[0] || []).filter(p => p.slug && p.stats && /^[mf]$/.test(p.gender || ''));
    const pick = [...list.filter(p => p.gender === 'm').slice(0, 7), ...list.filter(p => p.gender === 'f').slice(0, 7)];
    if (pick.length < 14) return false;
    window.players = pick.map((p, i) => ({ name: p.name, slug: p.slug, gender: p.gender, sexuality: p.sexuality || 'straight', archetype: p.archetype, stats: { ...p.stats }, tribe: i % 2 ? 'Red' : 'Blue', id: 'r' + i }));
    window.renderCast();
    return true;
  } catch { return false; }
});
if (!real) await seedCast(page, { count: 14 });
await page.waitForFunction(() => typeof window.simulateNext === 'function');
await page.evaluate(m => { window.__ssMap = m; }, want.has('map'));
await page.evaluate(() => {
  localStorage.setItem('bb-vp', 'stepped');
  localStorage.setItem('bb-map', window.__ssMap ? 'map' : 'linear');
  localStorage.setItem('bb-houselife', 'segments');
  window.seasonConfig.format = 'secret-story';
  window.seasonConfig.finaleSize = 3;
  window.seasonConfig.jurySize = 0;
});
for (let i = 0; i < Number(ep); i++) {
  await page.evaluate(() => window.simulateNext());
  await page.waitForFunction(n => (window.gs?.episodeHistory || []).length >= n, i + 1, { timeout: 120_000 });
}
await page.evaluate(n => window.openVisualPlayer(n), Number(ep));
await page.waitForFunction(() => (window.vpScreens || []).length > 3, null, { timeout: 60_000 });
await page.waitForTimeout(800);
// every screen's steps, by kind; the first of each kind on each screen
const plan = await page.evaluate(wantList => {
  const want = new Set(wantList);
  const out = [];
  const R = window._bbx || {};
  const seen = new Set();
  for (const r of Object.values(R)) {
    const S = r.screens[r.si];
    // map: a House Life screen's house map, before its first line
    if (want.has('map') && r.map && !seen.has('map')) { seen.add('map'); out.push({ uid: r.uid, idx: -1, kind: 'map', id: S.id || 'houselife' }); }
    // hl: a few spoken lines of House Life (its own scenes, on the house's plates)
    if (want.has('hl') && S && S.kind === 'houselife') { let k = 0; S.steps.forEach((st, i) => { if (st.k === 'say' && k < 4 && i % 7 === 3) { k++; out.push({ uid: r.uid, idx: i, kind: 'hl', id: `${S.id}-${i}` }); } }); }
    if (!S || !/^bb-ss-/.test(S.id || '')) continue;
    if (want.has('rest')) out.push({ uid: r.uid, idx: -1, kind: 'rest', id: S.id });
    S.steps.forEach((st, k) => {
      const kind = st.kitties ? 'kitties' : st.signs ? 'signs' : st.coins ? 'coins' : st.ask ? 'ask' : st.prop ? 'prop' : st.card ? 'card' : st.k;
      const key = `${S.id.replace(/-w\d+.*/, '')}|${kind}`;
      if (!want.has(kind) || seen.has(key)) return;
      seen.add(key); out.push({ uid: r.uid, idx: k, kind, id: S.id });
    });
  }
  return out;
}, [...want]);
console.log('moments', plan.length);
let n = 0;
for (const m of plan.slice(0, Number(max))) {
  const at = await page.evaluate(uid => (window.vpScreens || []).findIndex(s => (s.html || '').includes(`data-uid="${uid}"`)), m.uid);
  if (at < 0) continue;
  await page.evaluate(i => window.vpGoTo(i), at);
  await page.waitForTimeout(500);
  if (m.idx >= 0) await page.evaluate(([uid, k]) => window.bbxJump(uid, k + 1), [m.uid, m.idx]);
  await page.waitForTimeout(Number(process.env.SS_WAIT || 1700));
  const el = await page.$(`#bbx-st-${m.uid}`);
  if (!el) continue;
  const file = `${OUT}/e${ep}-${String(++n).padStart(2, '0')}-${m.kind}-${m.id.replace(/[^a-z0-9-]/gi, '').slice(0, 40)}.png`;
  // SS_PAGE=1: the whole viewer (the side panel, the nav), not only the stage
  if (process.env.SS_PAGE) await page.screenshot({ path: file }); else await el.screenshot({ path: file });
  console.log(file);
}
if (errors.length) console.log('ERRORS\n' + [...new Set(errors)].slice(0, 12).join('\n'));
await browser.close();
