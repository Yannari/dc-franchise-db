import { chromium } from 'playwright';
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
const only = process.argv[2] ? process.argv[2].split(',') : ['hosted-camp', 'film-lot', 'world-tour', 'survival-island'];
for (const setting of only) {
  await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(3500);
  await page.evaluate(async (setting) => {
    const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js');
    const roster = await (await fetch('franchise_roster.json')).json();
    const N = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna'];
    core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'A' : 'B' })));
    core.setSeasonConfig({ ...core.seasonConfig, name: 'Playtest', setting, teams: 2, mergeAt: 8, romance: 'enabled', ri: false }); ss.initGameState(); epm.simulateEpisode();
  }, setting);
  await page.evaluate(() => window.openVisualPlayer(1)); await page.waitForTimeout(1200);
  const seen = {};
  for (let i = 0; i < 400; i++) {
    const t = await page.evaluate(() => { const t = document.querySelector('.tdx'); return t ? t.dataset.uid : null; });
    if (!t) { const more = await page.evaluate(() => { const b = document.querySelector('.vp-next, [onclick*="vpNext"]'); window.vpNext(); return true; }); await page.waitForTimeout(400); continue; }
    await page.evaluate(u => window.tdxNext(u), t);
    await page.waitForTimeout(350);
    const st = await page.evaluate(() => {
      const c = document.querySelector('.tdx-gl'); const src = c?.dataset.src || document.querySelector('.tdx-plate')?.style.backgroundImage || '';
      return { src, ride: [...document.querySelectorAll('.tdx-ride')].map(r => r.className).join('|'), cls: [...document.querySelectorAll('.tdx-tok')].map(x => x.className).join('|'), dlg: document.querySelector('.tdx-dlg')?.innerText?.slice(0, 90) || '' };
    });
    const tag = st.ride ? 'ride-' + st.ride.split(' ').pop() : /yacht|bus-door|boat-side|drop|exit|limo|pier|boat-deck/.test(st.src) ? st.src.split('/').pop() : null;
    if (tag && (seen[tag] || 0) < (process.argv[3] ? 6 : 2)) {
      seen[tag] = (seen[tag] || 0) + 1;
      await page.waitForTimeout(/jump|chute|board/.test(st.cls) || st.ride ? 1500 : 600);
      await page.locator('.tdx').first().screenshot({ path: `shots/ride-${setting}-${tag}-${seen[tag]}.png` });
      console.log(setting, i, tag, st.dlg.replace(/\n/g, ' '));
    }
    if (await page.evaluate(() => /Next episode|Season over/.test(document.body.innerText.slice(-400))) && i > 300) break;
  }
}
console.log(errs.slice(0, 4)); await b.close();
