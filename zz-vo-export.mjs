// SCRATCH: play ep 2 of the imported season, then tdVoiceExport(2) → a download
import { chromium } from 'playwright';
import fs from 'fs';
const save = fs.readFileSync('assets/audio/td/vo-test/season-vo-test.json', 'utf8');
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
page.on('dialog', d => d.accept());
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500);
await page.evaluate(async s => { const cast = await import('./js/cast-ui.js'); cast._applySeasonSave(JSON.parse(s)); }, save); await page.waitForTimeout(1200);
await page.evaluate(() => window.openVisualPlayer(2)); await page.waitForTimeout(1500);
const screens = await page.evaluate(() => (window.vpScreens || []).length);
for (let si = 0; si < screens; si++) {
  await page.evaluate(i => { window.vpCurrentScreen = i; window.renderVPScreen(); }, si); await page.waitForTimeout(500);
  const uid = await page.evaluate(() => document.querySelector('.tdx')?.dataset.uid || null); if (!uid) continue;
  const isMap = await page.evaluate(() => !!document.querySelector('.tdm-root'));
  for (let n = 0; n < (isMap ? 60 : 400); n++) { const a = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx, uid); await page.evaluate(u => window.tdxNext(u), uid); await page.waitForTimeout(isMap ? 90 : 40); const z = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx, uid); if (!isMap && a === z && n > 3) break; }
}
const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => console.log(window.tdVoiceExport(2)))]);
await dl.saveAs('C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/72f2bf8d-4bd7-49ce-be1b-22d6dfbc5749/scratchpad/td-voice-lines-ep2.json');
const j = JSON.parse(fs.readFileSync('C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/72f2bf8d-4bd7-49ce-be1b-22d6dfbc5749/scratchpad/td-voice-lines-ep2.json', 'utf8'));
console.log('exported', j.lines.length, 'lines, episodes', j.episodes, 'sample', JSON.stringify(j.lines.find(l => l.by === 'Gwen')));
await b.close();
