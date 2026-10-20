// The race's music, one bed at a time (the user, 2026-10-19: "theres seem to be an overlap of music sometimes").
// Every looping source the page starts is watched (Web Audio: the beds are looped buffers) and counted every 50 ms:
// how many are playing at full (not fading out) and how many sound at all (a crossfade is two, never more), across
// fast clicking, a chapter change, a leg switch and Auto, in rr.html and in the simulator's Visual Player.
//   (serve the repo: python -m http.server 8765)   node tools/rr-vp-audio-check.mjs [seed] [teams]
import { chromium } from 'playwright';

const [seed = '8', teams = '12'] = process.argv.slice(2);
const base = (process.env.RR_URL || 'http://127.0.0.1:8765/rr.html').replace(/rr\.html$/, '');
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const WATCH = () => {
  const beds = [];
  window.__beds = beds;
  window.__worst = { full: 0, sounding: 0, at: '' };
  // a gap: once music has started, a stretch with no bed sounding at all (the old one gone before the new one came)
  window.__gap = { now: 0, max: 0, last: 0 };
  const start = AudioBufferSourceNode.prototype.start, stop = AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.start = function (...a) { if (this.loop) beds.push({ n: this, stopAt: Infinity, ctx: this.context }); return start.apply(this, a); };
  AudioBufferSourceNode.prototype.stop = function (when) { const b = beds.find(x => x.n === this); if (b) b.stopAt = Math.min(b.stopAt, when || this.context.currentTime); return stop.apply(this, arguments); };
  setInterval(() => {
    const live = beds.filter(b => b.stopAt > b.ctx.currentTime);
    const full = live.filter(b => b.stopAt === Infinity).length;
    const t = performance.now(), g = window.__gap;
    if (beds.length && !live.length && !window.__noGap) { g.now += t - (g.last || t); g.max = Math.max(g.max, g.now); } else g.now = 0;
    g.last = t;
    if (full > window.__worst.full || live.length > window.__worst.sounding) window.__worst = { full: Math.max(full, window.__worst.full), sounding: Math.max(live.length, window.__worst.sounding), at: window.__label || '' };
  }, 50);
};
let bad = 0;
const report = async (page, label) => {
  const w = await page.evaluate(() => {
    const w = window.__worst; window.__worst = { full: 0, sounding: 0, at: '' };
    const gap = Math.round(window.__gap.max); window.__gap.max = 0;
    const started = window.__beds.length - (window.__mark || 0); window.__mark = window.__beds.length;
    return { ...w, total: window.__beds.length, gap, started };
  });
  const ok = w.full <= 1 && w.sounding <= 2 && w.gap <= 300;
  if (!ok) bad++;
  console.log(`${ok ? 'ok ' : 'BAD'} ${label}: at most ${w.full} bed at full, ${w.sounding} sounding, ${w.started} beds started, longest silence ${w.gap} ms (${w.total} started so far)`);
};

// ── rr.html ──
{
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.addInitScript(WATCH);
  await page.goto(`${base}rr.html?seed=${seed}&teams=${teams}&ep=1&step=0`);
  await page.waitForFunction(() => window.__rr?.ep, null, { timeout: 60000 });
  await page.mouse.click(700, 300);                     // the first gesture unlocks the sound
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__label = 'clicks'; });
  for (let i = 0; i < 60; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(120); }
  await page.waitForTimeout(2500); await report(page, 'rr.html: sixty fast clicks');
  for (let i = 0; i < 25; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(900); }
  await page.waitForTimeout(1500); await report(page, 'rr.html: twenty-five clicks at reading pace');
  // a long stretch of leg 2 at reading pace: how often the moments change, how often the music does, and never a gap
  await page.evaluate(() => { window.__noGap = true; });     // a leg switch starts a new episode: a cut is fine there
  await page.selectOption('#rr-ep', '1'); await page.waitForTimeout(3000);
  await page.evaluate(() => { window.__noGap = false; });
  await report(page, 'rr.html: to leg 2');
  const plan = await page.evaluate(async () => {
    const { planOf, soundAt } = await import('./js/vp-rr-ep/sound.js');
    // (planOf: the plan since 2026-10-19; an older checkout has none, and plays every moment's own bed)
    const r = window.__rr, p = planOf ? planOf(r.ep) : { steps: r.flat.map(() => ({ change: false })) }, from = r.at, n = Math.min(120, r.flat.length - from - 1);
    let raw = 0, planned = 0, prev = null;
    for (let i = from + 1; i <= from + n; i++) {
      const f = r.flat[i], b = soundAt(r.ep, f.si, f.idx).bed?.file || 'none';
      if (prev != null && b !== prev) raw++;
      prev = b;
      if (p.steps[i].change && i > from + 1) planned++;
    }
    return { n, raw, planned };
  });
  for (let i = 0; i < plan.n; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(650); }
  await page.waitForTimeout(3000);
  console.log(`    leg 2, ${plan.n} clicks: the moments change ${plan.raw} times; the plan changes the music ${plan.planned} times`);
  await report(page, `rr.html: ${plan.n} clicks of leg 2 at reading pace`);
  await page.evaluate(() => { window.__noGap = true; });
  await page.selectOption('#rr-ep', '0'); await page.waitForTimeout(3000);
  await page.selectOption('#rr-ep', '3'); await page.waitForTimeout(400);
  await page.selectOption('#rr-ep', '2'); await page.waitForTimeout(3000); await report(page, 'rr.html: leg switches');
  await page.evaluate(() => { window.__noGap = false; });
  await page.click('#rr-auto'); await page.waitForTimeout(25000); await page.click('#rr-auto');
  await page.waitForTimeout(1500); await report(page, 'rr.html: Auto for 25 s');
  await page.close();
}
// ── the simulator's Visual Player ──
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.addInitScript(WATCH);
  await page.goto(base + 'simulator.html');
  await page.waitForFunction(() => typeof window.openVisualPlayer === 'function', null, { timeout: 60000 });
  await page.evaluate(async ([seed, n]) => {
    const { castFromRoster, rosterPlayers } = await import('./js/vp-rr-ep/cast.js');
    const { racePlayed } = await import('./js/rr-run.js');
    const roster = rosterPlayers(await (await fetch('franchise_roster.json')).json());
    const { cast, teams } = castFromRoster(roster, n, seed);
    window.players = cast;
    window.gs = { ...(window.gs || {}), rr: { teams, seed }, episodeHistory: [] };
    const played = racePlayed();
    window.gs.episodeHistory = played.res.legs.slice(0, 3).map(l => ({ num: l.n, format: 'ridonculous-race', rr: { placeName: l.placeName, kind: l.kind } }));
    localStorage.setItem('rr-vp', 'stepped');
    window.openVisualPlayer(1);
  }, [Number(seed), Number(teams)]);
  await page.waitForSelector('.rrx .rr-frame', { timeout: 30000 });
  await page.mouse.click(600, 400);
  await page.waitForTimeout(1500);
  const next = () => page.evaluate(() => window.rrxNext(document.querySelector('.rrx .rrx-btn.go')));
  for (let i = 0; i < 40; i++) { await next(); await page.waitForTimeout(150); }
  await page.waitForTimeout(2500); await report(page, 'simulator: forty fast clicks');
  // chapter changes, a part at a time (a crossfade each: two sounding for 1.2 s), and back
  for (let ci = 1; ci < 4; ci++) { await page.evaluate(ci => window.vpGoTo(ci), ci); await page.waitForTimeout(2000); }
  await page.evaluate(() => window.vpGoTo(0)); await page.waitForTimeout(3000); await report(page, 'simulator: chapter changes');
  // Auto, then a leg switch while it runs
  await page.evaluate(() => window.rrxAuto(document.querySelector('.rrx .rrx-auto'))); await page.waitForTimeout(12000);
  await page.evaluate(() => window.rrxLeg(2)); await page.waitForTimeout(1500);
  await page.waitForSelector('.rrx .rr-frame', { timeout: 30000 });
  await page.waitForTimeout(10000); await report(page, 'simulator: Auto, then a leg switch while it ran');
  await page.close();
}
await browser.close();
console.log(bad ? `${bad} with an overlap` : 'one bed at a time throughout');
process.exit(bad ? 1 : 0);
