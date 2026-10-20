// Screenshots of the moments the user asked about (2026-10-19), found anywhere in the season, to LOOK at:
//   (serve the repo: python -m http.server 8765)   node tools/rr-vp-look.mjs [seed] [teams] [kinds,...]
// kinds: company, alone, elevator, cabin, confess, confess2, intro, exit, plates (every plate in use, with its people),
//   closecrowd, closecut, plane4, plane4close, fail, done, slam, tip, galleyclose, talkclose
// Shots land in shots/rr-vp/look-*.png. RR_URL sets the page.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [seed = '8', teams = '12', kindArg = 'company,alone,elevator,cabin,confess,confess2,intro,exit'] = process.argv.slice(2);
const base = process.env.RR_URL || 'http://127.0.0.1:8765/rr.html';
// RR_PINS=2:coast-palace,3:geyser-island books those legs (rr.html ?pins=): a place being built plays only when booked
const PINS = (process.env.RR_PINS ? '&pins=' + encodeURIComponent(process.env.RR_PINS) : '')
  // RR_TWISTS=3:head-to-head,5:boomerang-blind books those twists (rr.html ?twists=)
  + (process.env.RR_TWISTS ? '&twists=' + encodeURIComponent(process.env.RR_TWISTS) : '');
mkdirSync('shots/rr-vp', { recursive: true });
const FIND = {
  company: '(s, t, k) => s.kind === "world" && s.mode !== "mat" && s.seg !== "don-opener" && s.seg !== "team-intro" && (s.crowd || []).some(c => c.pos[k] && c.work) && t.by',
  companyact: '(s, t, k) => s.kind === "world" && s.mode === "act" && (s.crowd || []).some(c => c.pos[k]) && k >= 1',
  alone: '(s, t, k) => s.kind === "world" && s.crowdWin && !s.crowd && s.stretchKind && s.stretchKind !== "travel" && t.by && k >= 1',
  elevator: '(s, t, k) => s.kind === "world" && s.stretch === "tower" && s.side === "skydeck" && s.mode !== "act" && t.by',
  cabin: '(s, t) => s.mode === "cabin" && t.by',
  confess: '(s, t) => s.kind === "iv" && s.people.length === 1 && t.by && s.team',
  confess2: '(s, t) => s.kind === "iv" && s.people.length === 2 && t.by && t.react',
  intro: '(s, t, k) => s.seg === "team-intro" && s.kind === "world" && t.by && k >= 1',
  exit: '(s, t, k) => s.leaveAt && s.leaveAt[k]',
  exitafter: '(s, t, k) => s.leaveAt && Object.keys(s.leaveAt).some(x => +x < k) && t.by',
  react: '(s, t) => !!t.crowdReact',
  // the three rough edges of 2026-10-19: a close-up with the crowd near, a full plane, a failed try's stamp
  closecrowd: '(s, t, k) => s.kind === "world" && t.cam && t.cam.shot !== "wide" && (s.crowd || []).some(c => c.pos[k]) && t.by',
  closecut: '(s, t, k) => s.kind === "world" && t.cam && t.cam.shot !== "wide" && (t.hide || []).some(h => h.startsWith("c:")) && t.by',
  plane4: '(s, t) => s.mode === "cabin" && s.teams.length >= 4 && t.by',
  plane4close: '(s, t) => s.mode === "cabin" && s.teams.length >= 4 && t.by && t.cam && t.cam.shot !== "wide"',
  fail: '(s, t) => !!t.stamp && t.stamp.text === "TRY AGAIN"',
  done: '(s, t) => !!t.stamp && t.stamp.text === "DONE!"',
  slam: '(s, t) => !!t.slam && s.kind === "world"',
  tip: '(s, t) => t.part === "tip"',
  galleyclose: '(s, t) => s.mode === "cabin" && s.plate?.f === "galley" && t.by && t.cam && t.cam.shot !== "wide"',
  talkclose: '(s, t) => s.mode === "talk" && s.teams.length >= 2 && t.by && t.cam && t.cam.shot !== "wide"',
  // the finale (2026-10-20): the runners-up's chase cut in before the crown, the crown, a proposal on the winners' mat
  chase: '(s, t, k) => s.kind === "world" && s.stretch === "footrace" && t.by && k >= 1',
  crown: '(s, t) => s.seg === "don-crown" && t.by',
  propose: '(s, t, k) => s.seg === "proposal" && t.by && k >= 2',
  // the twists (2026-10-20): the cards, Don's rule, the Zip-It, a team sent back, a Yield
  cards: '(s, t, k) => s.seg === "boomerang-vote" && k >= 1',
  rule: '(s, t, k) => s.seg === "don-rule" && k >= 1',
  zip: '(s, t, k) => s.seg === "zip-it" && t.by && k >= 1',
  sentback: '(s, t, k) => s.seg === "boomerang-hit" && t.by && k >= 1',
  yielded: '(s, t, k) => s.seg === "yield" && k >= 1',
  blindhit: '(s, t, k) => s.seg === "boomerang-hit" && s.ending === "blind-guess" && k >= 1',
  reveal: '(s, t, k) => s.seg === "boomerang-reveal" && k >= 2',
  duel: '(s, t, k) => s.seg === "head-to-head" && k >= 1',
  intersect: '(s, t, k) => s.seg === "superteam-pick" && k >= 1',
};
// RR_PLATES=task-9436302,task-22412499: a talk step on each of those plates
for (const f of (process.env.RR_PLATES || '').split(',').filter(Boolean)) FIND['plate-' + f] = `(s, t, k) => s.kind === "world" && s.plate?.f === "${f}" && t.by && k >= 1`;
// RR_MODES=sculpt,swing: a step of each kind of work or ride, on its act plate (RR_ACT_PLATE=f picks the plate)
for (const m of (process.env.RR_MODES || '').split(',').filter(Boolean)) FIND['mode-' + m] = `(s, t, k) => s.kind === "world" && s.mode === "act" && s.plate?.mode === "${m}" && k >= 1`;
// RR_ACTS=task-9436826,present-9437594: a step of the ride or the task shot on each of those act plates
for (const f of (process.env.RR_ACTS || '').split(',').filter(Boolean)) FIND['act-' + f] = `(s, t, k) => s.kind === "world" && s.mode === "act" && s.plate?.f === "${f}" && k >= 1`;
const kinds = [...kindArg.split(',').filter(k => FIND[k]), ...Object.keys(FIND).filter(k => k.startsWith('plate-') || k.startsWith('mode-') || k.startsWith('act-'))];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) errors.push(r.status() + ' ' + r.url()); });
await page.goto(`${base}?seed=${seed}&teams=${teams}&ep=1&step=0${PINS}`);
await page.waitForFunction(() => window.__rr?.ep, null, { timeout: 60000 });
const legs = await page.evaluate(() => document.querySelectorAll('#rr-ep option').length);
for (const kind of kinds) {
  let found = null;
  for (let e = 0; e < legs && !found; e++) {
    await page.evaluate(e => window.__rr.goto(e, 0), e);
    const k = await page.evaluate(`(() => { const p = ${FIND[kind]}; const r = window.__rr; return r.flat.findIndex(f => { const s = r.ep.screens[f.si]; return p(s, s.steps[f.idx], f.idx); }); })()`);
    if (k >= 0) found = { e, k };
  }
  if (!found) { console.log(kind, ': none in this season'); continue; }
  const info = await page.evaluate(({ e, k }) => { window.__rr.goto(e, 0); window.__rr.step(Math.max(0, k - 1), false); window.__rr.step(k, true);
    const f = window.__rr.flat[k], s = window.__rr.ep.screens[f.si], t = s.steps[f.idx];
    return `leg ${e + 1} click ${k} ${s.id} ${s.seg} ${s.plate?.f || ''} | ${t.by || ''}: ${String(t.text || '').slice(0, 90)}`; }, found);
  for (const [i, ms] of [[0, 350], [1, 1600]]) {
    await page.waitForTimeout(ms);
    const file = `shots/rr-vp/look-${kind}${i ? '' : '-mid'}.png`;
    await page.locator('#rr-stage-holder').screenshot({ path: file });
    if (i) console.log(file, '\n   ', info);
  }
}
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].join('\n'));
await browser.close();
