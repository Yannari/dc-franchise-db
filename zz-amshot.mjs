// SCRATCH (not committed): play an Aftermath in the browser, screenshot every new set. node zz-amshot.mjs [setting] [ep]
import { chromium, firefox } from 'playwright';
import fs from 'fs';
const [setting = 'hosted-camp', epS = '6', eng = 'chromium'] = process.argv.slice(2); const at = +epS;
fs.mkdirSync('shots/am', { recursive: true });
const b = await (eng === 'firefox' ? firefox : chromium).launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0, 300)));
page.on('console', m => { if (m.type() === 'error' && !/favicon|404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
await page.goto('http://127.0.0.1:8791/simulator.html'); await page.waitForTimeout(3000);
const made = await page.evaluate(async ({ setting, at }) => {
  const core = await import('./js/core.js'), ss = await import('./js/savestate.js'), epm = await import('./js/episode.js'), fin = await import('./js/finale.js');
  const roster = await (await fetch('franchise_roster.json')).json();
  const N = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
  core.setPlayers(N.map((n, i) => ({ ...roster.players.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' })));
  core.setSeasonConfig({ ...core.seasonConfig, name: 'Playtest', setting, teams: 2, mergeAt: 10, romance: 'enabled', popularityEnabled: true, aftermath: 'enabled', twistSchedule: [] });
  ss.initGameState();
  for (let i = 0; i < at; i++) { window.gs = core.gs; if (core.gs.episodeHistory.some(e => e.isFinale)) break; try { if (core.gs.phase === 'finale') { const fe = fin.simulateFinale(); const am = await import('./js/aftermath.js'); if (fe?.winner && !fe.aftermath) { am.generateAftermathShow(fe); const h = core.gs.episodeHistory[core.gs.episodeHistory.length - 1]; if (h && fe.aftermath) h.aftermath = fe.aftermath; } } else epm.simulateEpisode(); } catch (e) { console.error('sim', e); break; } }
  const eps = core.gs.episodeHistory.filter(e => e.aftermath).map(e => e.num); const fnum = core.gs.episodeHistory.find(e => e.isFinale)?.num;
  return { fnum, reunion: core.gs.episodeHistory.filter(e => e.aftermath?.isReunion).map(e => e.num), winner: core.gs.episodeHistory.find(e => e.isFinale)?.winner, eps, hosts: (core.gs.aftermathHosts || []).map(h => h.name) };
}, { setting, at });
console.log('season', JSON.stringify(made));
if (process.env.FIN) { const t = await page.evaluate(n => { const e = window.gs.episodeHistory.find(h => h.num === n); return (e?.aftermath?.show?.blocks || []).map(b => `--- [${b.set}]${b.title ? ' ' + b.title.name : ''}` + String.fromCharCode(10) + b.lines.map(l => l.beat ? '   (' + l.beat + ')' : l.by + ': ' + l.text).join(String.fromCharCode(10))).join(String.fromCharCode(10)); }, made.fnum); fs.writeFileSync('shots/am/reunion.txt', t); }
const n = process.env.FIN && made.fnum ? made.fnum : made.eps[made.eps.length - 1];
await page.evaluate(n => window.openVisualPlayer(n), n); await page.waitForTimeout(1500);
const screens = await page.evaluate(() => (window.vpScreens || []).map(s => s.id));
const si = screens.indexOf('aftermath-show');
console.log('screens', screens.join(' '), 'am at', si);
await page.evaluate(i => { window.vpCurrentScreen = i; window.renderVPScreen(); }, si); await page.waitForTimeout(1200);
const uid = await page.evaluate(() => document.querySelector('.tdx')?.dataset.uid || null);
let last = '', k = 0;
for (let i = 0; i < 400 && uid; i++) {
  const sig = await page.evaluate(() => (document.querySelector('.tdx-loc .place')?.innerText || '') + '|' + (document.querySelector('.tdx-tb') ? 'tb' : '') + (document.querySelector('.tdx-hammer') ? 'H' : ''));
  if (sig !== last) { last = sig; if (k < 30) { await page.locator('.tdx').first().screenshot({ path: `shots/am/${eng}-${String(i).padStart(3, '0')}-${sig.replace(/[^a-z0-9]+/gi, '_').slice(0, 30)}.png`, timeout: 4000 }).catch(() => {}); k++; } console.log(i, sig); }
  const dlg = await page.evaluate(() => document.querySelector('.tdx-dlg')?.innerText || '');
  if (/hammer swings|knocks/i.test(dlg)) { await page.waitForTimeout(450); await page.locator('.tdx').first().screenshot({ path: `shots/am/${eng}-${String(i).padStart(3, '0')}-HAMMER.png`, timeout: 4000 }).catch(() => {}); console.log(i, 'HAMMER', dlg.slice(0, 80)); }
  const before = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx || '', uid);
  await page.evaluate(u => window.tdxNext(u), uid); await page.waitForTimeout(260);
  const after = await page.evaluate(u => document.querySelector(`.tdx[data-uid="${u}"]`)?.dataset.idx || '', uid);
  if (before === after && i > 5) break;
}
console.log('errors', errs.length ? '\n' + [...new Set(errs)].slice(0, 12).join('\n') : 'none');
await b.close();
