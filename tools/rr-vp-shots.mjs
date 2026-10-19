// Screenshots of the Ridonculous Race viewer, one per scene kind, to LOOK at.
//   (serve the repo: python serve.py 8765)   node tools/rr-vp-shots.mjs [seed] [teams] [eps] [--all]
// eps: a comma list of episode numbers (default 2,5). Shots land in shots/rr-vp/.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [seed = '8', teams = '12', epList = '2,5'] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const all = process.argv.includes('--all');
const base = process.env.RR_URL || 'http://127.0.0.1:8765/rr.html';
mkdirSync('shots/rr-vp', { recursive: true });

const KINDS = {
  logo: '(s) => s.kind === "logo"',
  previously: '(s) => s.kind === "map"',
  replay: '(s) => !!s.replay',
  chill: '(s) => s.seg === "don-narrate" && s.ending === "chill"',
  beat: '(s, t) => t.part === "beat" && s.kind === "world"',
  title: '(s) => s.kind === "title"',
  opener: '(s) => s.seg === "don-opener"',
  tip: '(s, t) => t.part === "tip"',
  gate: '(s) => s.hud?.task === "THE AIRPORT"',
  cabin: '(s) => s.mode === "cabin"',
  flight: '(s) => s.kind === "flight"',
  landing: '(s) => s.mode === "landing"',
  ride: '(s, t, k) => s.mode === "act" && s.plate?.mode === "ride" && k === 1',
  task: '(s) => s.mode === "talk" && ["allin", "botch", "either"].includes(s.stretchKind) && s.teams.length >= 2',
  act: '(s, t, k) => s.mode === "act" && s.plate?.mode !== "ride" && k === 1',
  swim: '(s, t, k) => ["swim", "dive"].includes(s.plate?.mode) && k === 1',
  hop: '(s, t, k) => s.plate?.mode === "hop" && k === 1',
  work: '(s, t, k) => !!s.work && k === 1',
  fail: '(s, t, k) => s.plan?.fail === k',
  confess: '(s) => s.kind === "iv" && s.caption',
  pause: '(s, t) => t.part === "pause" && s.seg === "don-place"',
  rank: '(s, t) => !!t.rank && !t.rank.out && s.seg === "don-place"',
  montage: '(s, t, k) => s.seg === "mat-montage" && k === 2',
  elim: '(s, t) => t.slam?.text === "ELIMINATED"',
  nonelim: '(s, t) => t.slam?.text === "NON-ELIMINATION"',
  crown: '(s, t) => t.slam?.text === "THE WINNERS!"',
  end: '(s) => s.kind === "end"',
  crowd: '(s, t, k) => (s.crowd || []).filter(c => c.pos[k]).length >= 2 && s.mode !== "mat"',
  crowdride: '(s, t, k) => s.mode === "act" && s.plate?.mode === "ride" && (s.crowd || []).some(c => c.pos[k]) && k >= 1',
  close: '(s, t) => t.cam?.shot === "close" && !t.slam && t.part !== "pause"',
  matcrowd: '(s, t, k) => s.mode === "mat" && (s.crowd || []).length >= 2',
  follow: '(s, t, k) => t.cam?.shot === "follow" && k >= 1',
  intro: '(s, t, k) => s.seg === "team-intro" && s.kind === "world" && (s.crowd || []).length >= 3',
};

const browser = await chromium.launch();
const [VW, VH] = (process.env.RR_VIEW || '1600x1000').split('x').map(Number);
const page = await browser.newPage({ viewport: { width: VW, height: VH } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) errors.push(r.status() + ' ' + r.url()); });
page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });
for (const n of epList.split(',').map(Number)) {
  await page.goto(`${base}?seed=${seed}&teams=${teams}&ep=${n}&step=0&intel=${process.env.RR_INTEL || '0'}`);
  await page.waitForFunction(() => window.__rr?.ep, null, { timeout: 60000 });
  const only = process.env.RR_KINDS ? process.env.RR_KINDS.split(',') : null;
  for (const [name, fn] of Object.entries(KINDS).filter(([n]) => !only || only.includes(n))) {
    const ks = await page.evaluate(`(() => { const p = ${fn}; const r = window.__rr; const out = [];
      r.flat.forEach((f, k) => { const s = r.ep.screens[f.si]; if (p(s, s.steps[f.idx], f.idx)) out.push(k); }); return out; })()`);
    if (!ks.length) continue;
    for (const k of all ? ks.slice(0, 3) : [ks[Math.floor(ks.length / 2)]]) {
      // arrive at it the way a viewer does: the step before, then a click
      await page.evaluate(k => { window.__rr.step(Math.max(0, k - 1), false); window.__rr.step(k, true); }, k);
      await page.waitForTimeout(name === 'title' || name === 'logo' ? 1200 : 1700);
      const file = `shots/rr-vp/s${seed}-e${n}-${name}${all ? '-' + k : ''}${process.env.RR_TAG || ''}.png`;
      if (process.env.RR_STAGE) await page.locator('#rr-stage-holder').screenshot({ path: file }); else await page.screenshot({ path: file, fullPage: true });
      console.log(file);
    }
  }
}
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].join('\n'));
await browser.close();
