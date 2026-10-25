// The Perfect Match viewer inside the simulator's Visual Player, screenshotted: a synthetic
// season (tests/helpers/pm-cast.js) is played in the page, put in gs.episodeHistory, and
// the player opened on an episode. One shot per set the episode visits (the first line of
// the first scene there), so a new backdrop or a staging change can be looked at.
//   (serve the repo: python -m http.server 8771)   node tools/pm-vp-shots.mjs [seed] [episode] [max] [sets|story|kind:<kind>]
// Shots land in $PM_SHOTS (default shots/pm-vp)/s<seed>-e<ep>-<n>-<set>.png.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [seed = '7', ep = '6', max = '14', mode = 'sets'] = process.argv.slice(2);
const base = process.env.PM_URL || 'http://127.0.0.1:8771/';
const OUT = process.env.PM_SHOTS || 'shots/pm-vp';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
await page.goto(base + 'simulator.html');
await page.waitForFunction(() => typeof window.openVisualPlayer === 'function', null, { timeout: 60000 });
const eps = await page.evaluate(async ([seed, ep]) => {
  const core = await import('./js/core.js');
  const season = await import('./js/pm/season.js');
  const { makeIslanders, roleSetup } = await import('./tests/helpers/pm-cast.js');
  const cast = makeIslanders(22, seed);
  core.setPlayers(cast);
  const names = cast.map(p => p.name);
  const { rows } = season.playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
  window.gs = { ...(window.gs || {}), episodeHistory: rows };
  try { localStorage.setItem('vp_debug', 'false'); } catch { /* */ }
  window.openVisualPlayer(ep);
  return rows.length;
}, [Number(seed), Number(ep)]);
await page.waitForSelector('.pmv', { timeout: 30000 });
await page.waitForTimeout(800);
// Every screen's steps, and the set each one stands in.
const plan = await page.evaluate(mode => {
  const out = [], seen = new Set();
  const any = Object.values(window._pmv)[0];
  any.screens.forEach((sc, si) => sc.steps.forEach((st, k) => {
    // sets: the first step on each set; story: a spoken line of each story kind;
    // kind:<kind>: every step of that kind (e.g. kind:where, Casa's cuts)
    const key = mode === 'story' ? (st.story && k > 0 && st.part === 'line' ? st.story.type : null)
      : mode.startsWith('kind:') ? (st.kind === mode.slice(5) ? `${st.kind}${si}-${k}` : null) : st.bg;
    if (!key || seen.has(key)) return;
    seen.add(key); out.push({ si, k, bg: key });
  }));
  return out;
}, mode);
let n = 0;
for (const { si, k, bg } of plan.slice(0, Number(max))) {
  await page.evaluate(i => window.vpGoTo(i), si);
  await page.waitForTimeout(500);
  for (let i = 0; i <= k; i++) {
    await page.evaluate(() => { const r = document.querySelector('.pmv[data-uid]'); window.pmRevealNext(r.dataset.uid); });
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1400);
  const el = await page.$('.pmv-stage');
  const file = `${OUT}/s${seed}-e${ep}-${String(++n).padStart(2, '0')}-${bg}.png`;
  await (el || page).screenshot({ path: file });
  console.log(file);
}
console.log(`episodes ${eps}`, errors.length ? 'ERRORS:\n' + [...new Set(errors)].slice(0, 10).join('\n') : 'no errors');
await browser.close();
