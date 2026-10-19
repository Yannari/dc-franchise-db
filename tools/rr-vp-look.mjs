// Screenshots of the moments the user asked about (2026-10-19), found anywhere in the season, to LOOK at:
//   (serve the repo: python -m http.server 8765)   node tools/rr-vp-look.mjs [seed] [teams] [kinds,...]
// kinds: company, alone, elevator, cabin, confess, confess2, intro, exit, plates (every plate in use, with its people)
// Shots land in shots/rr-vp/look-*.png. RR_URL sets the page.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [seed = '8', teams = '12', kindArg = 'company,alone,elevator,cabin,confess,confess2,intro,exit'] = process.argv.slice(2);
const base = process.env.RR_URL || 'http://127.0.0.1:8765/rr.html';
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
};
// RR_PLATES=task-9436302,task-22412499: a talk step on each of those plates
for (const f of (process.env.RR_PLATES || '').split(',').filter(Boolean)) FIND['plate-' + f] = `(s, t, k) => s.kind === "world" && s.plate?.f === "${f}" && t.by && k >= 1`;
const kinds = [...kindArg.split(',').filter(k => FIND[k]), ...Object.keys(FIND).filter(k => k.startsWith('plate-'))];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) errors.push(r.status() + ' ' + r.url()); });
await page.goto(`${base}?seed=${seed}&teams=${teams}&ep=1&step=0`);
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
