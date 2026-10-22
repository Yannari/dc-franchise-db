// SCRATCH: the one-command recorder, as the user would run it
import { chromium } from 'playwright';
import fs from 'fs';
const save = fs.readFileSync('assets/audio/td/vo-test/season-vo-test.json', 'utf8');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200))); page.on('dialog', d => d.accept());
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(2500); await page.mouse.click(5, 5);
await page.evaluate(async s => { const cast = await import('./js/cast-ui.js'); cast._applySeasonSave(JSON.parse(s)); }, save); await page.waitForTimeout(1200);
const t = Date.now();
const [dl, msg] = await Promise.all([page.waitForEvent('download', { timeout: 600000 }), page.evaluate(() => window.tdVoiceRecord(2))]);
await dl.saveAs('C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/72f2bf8d-4bd7-49ce-be1b-22d6dfbc5749/scratchpad/rec-ep2.json');
const j = JSON.parse(fs.readFileSync('C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/72f2bf8d-4bd7-49ce-be1b-22d6dfbc5749/scratchpad/rec-ep2.json', 'utf8'));
console.log(msg, '|', j.lines.length, 'lines in', Math.round((Date.now() - t) / 1000), 's; Heather/Owen/Gwen', ['Heather', 'Owen', 'Gwen'].map(n => j.lines.filter(l => l.by === n).length).join('/'), '| errors', errs.length ? errs : 'none');
await b.close();
