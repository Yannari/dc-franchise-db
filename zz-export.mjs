import { chromium } from 'playwright';
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true }); const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0, 300))); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
page.on('dialog', d => { errs.push('dialog: ' + d.message().slice(0, 200)); d.accept(); });
await page.goto('http://127.0.0.1:8797/simulator.html'); await page.waitForTimeout(2500);
await page.evaluate(async () => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Heather', 'Owen', 'Gwen', 'Duncan', 'Courtney', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent', 'Alejandro'];
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Exp', setting: 'hosted-camp', teams: 2, mergeAt: 10 });
  ss.initGameState(); window.gs = core.gs; window.simulateNext(); window.simulateNext(); window.renderSeasonHub();
});
console.log('exportSeasonJson on window:', await page.evaluate(() => typeof window.exportSeasonJson), '| hub Export onclick:', await page.evaluate(() => [...document.querySelectorAll('.hub-secondary-actions button')].find(x => x.textContent.trim() === 'Export')?.getAttribute('onclick')));
const dl = page.waitForEvent('download', { timeout: 8000 }).then(d => 'download: ' + d.suggestedFilename()).catch(() => 'no download');
await page.evaluate(() => { const x = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Export Season'); x.click(); });
console.log(await dl);
console.log(errs.length ? errs : 'no errors'); await b.close();
