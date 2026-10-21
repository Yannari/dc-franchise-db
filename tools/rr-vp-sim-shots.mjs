// The Ridonculous Race viewer inside the SIMULATOR's Visual Player (js/vp-rr-ep/vp.js), screenshotted.
// A race is put in the page the way the run tab leaves it (gs.rr: the teams and the seed, the aired legs in
// gs.episodeHistory), the same cast rr.html draws (cast.js castFromRoster), and the pane is opened on a leg.
//   (serve the repo: python -m http.server 8765)   node tools/rr-vp-sim-shots.mjs [seed] [teams] [leg] [kinds]
// kinds: a comma list of crowd, close, mat, confess, act (default all). Shots land in shots/rr-vp/sim-*.png.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [seed = '8', teams = '12', leg = '2', kindList = 'crowd,close,mat,confess,act,ride'] = process.argv.slice(2);
const base = (process.env.RR_URL || 'http://127.0.0.1:8765/rr.html').replace(/rr\.html$/, '');
mkdirSync('shots/rr-vp', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
await page.goto(base + 'simulator.html');
await page.waitForFunction(() => typeof window.openVisualPlayer === 'function', null, { timeout: 60000 });
const legs = await page.evaluate(async ([seed, n, leg]) => {
  const { castFromRoster, rosterPlayers } = await import('./js/vp-rr-ep/cast.js');
  const { racePlayed } = await import('./js/rr-run.js');
  const roster = rosterPlayers(await (await fetch('franchise_roster.json')).json());
  const { cast, teams } = castFromRoster(roster, n, seed);
  window.players = cast;
  window.gs = { ...(window.gs || {}), rr: { teams, seed }, episodeHistory: [] };
  const played = racePlayed();
  window.gs.episodeHistory = played.res.legs.slice(0, leg).map(l => ({ num: l.n, format: 'ridonculous-race', rr: { placeName: l.placeName, kind: l.kind } }));
  localStorage.setItem('rr-vp', 'stepped');
  window.openVisualPlayer(leg);
  return played.res.legs.length;
}, [Number(seed), Number(teams), Number(leg)]);
await page.waitForSelector('.rrx .rr-frame', { timeout: 30000 });
await page.waitForTimeout(1200);
const KINDS = {
  crowd: '(s, t, k) => (s.crowd || []).filter(c => c.pos[k]).length >= 2 && s.mode !== "mat"',
  close: '(s, t) => t.cam?.shot === "close" && !t.slam && t.part !== "pause"',
  mat: '(s, t) => !!t.rank && !t.rank.out',
  confess: '(s) => s.kind === "iv" && s.caption',
  act: '(s, t, k) => s.mode === "act" && s.plate?.mode !== "ride" && k === 1',
  ride: '(s, t, k) => s.mode === "act" && s.plate?.mode === "ride" && k >= 1',
};
for (const name of kindList.split(',')) {
  // find the part and the line: the pane holds one part (a chapter) at a time
  const where = await page.evaluate(fn => {
    const p = eval(fn); const key = document.querySelector('.rrx[data-key]').dataset.key, R = window._rrx[key];
    const out = [];
    R.chapters.forEach((c, ci) => { let at = 0; for (let si = c.from; si <= c.to; si++) R.e.screens[si].steps.forEach((st, k) => { if (p(R.e.screens[si], st, k)) out.push({ ci, at }); at++; }); });
    return out[Math.floor(out.length / 2)] || null;
  }, KINDS[name]);
  if (!where) { console.log('no', name); continue; }
  // (the player stays in its part: open the part, then skip to the line before inside it)
  await page.evaluate(({ ci }) => window.vpGoTo(ci), where);
  await page.waitForTimeout(900);
  await page.evaluate(({ at }) => window.rrxSkip(document.querySelector('.rrx .rrx-btn.go'), Math.max(0, at - 1)), where);
  await page.waitForTimeout(300);
  await page.evaluate(() => window.rrxNext(document.querySelector('.rrx .rrx-btn.go')));
  await page.waitForTimeout(1700);
  const file = `shots/rr-vp/sim-s${seed}-l${leg}-${name}.png`;
  await page.screenshot({ path: file });
  console.log(file);
}
console.log(`legs ${legs}`, errors.length ? 'ERRORS:\n' + [...new Set(errors)].slice(0, 10).join('\n') : 'no errors');
await browser.close();
