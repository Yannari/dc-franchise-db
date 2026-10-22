// SCRATCH: record episode 2 twice in one browser; which lines change between plays?
import { chromium } from 'playwright';
import fs from 'fs';
const save = fs.readFileSync('assets/audio/td/vo-test/season-vo-test.json', 'utf8');
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
page.on('dialog', d => d.accept());
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500);
await page.evaluate(async s => { const c = await import('./js/cast-ui.js'); c._applySeasonSave(JSON.parse(s)); }, save); await page.waitForTimeout(1200);
const rec = () => page.evaluate(async () => { const m = await import('./js/vp-td-ep/sound.js'); return (await m.recordEpisodeLines(2)).map(l => ({ id: l.id, by: l.by, k: l.k, screen: l.screen, text: l.text })); });
const a = await rec(), b2 = await rec();
const ids = new Set(a.map(l => l.id));
const fresh = b2.filter(l => !ids.has(l.id));
console.log('first', a.length, 'second', b2.length, 'new in second:', fresh.length, 'by kind', JSON.stringify(fresh.reduce((o, l) => (o[l.k] = (o[l.k] || 0) + 1, o), {})));
for (const l of fresh.slice(0, 4)) { const twin = a.find(x => x.by === l.by && x.screen === l.screen && x.k === l.k && x.text !== l.text); console.log(' ', l.screen, l.by, '\n    1st:', twin?.text?.slice(0, 90), '\n    2nd:', l.text.slice(0, 90)); }
await b.close();
