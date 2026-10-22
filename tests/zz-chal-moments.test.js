// @vitest-environment jsdom
// SCRATCH: play seasons with a twist challenge every episode; list what each challenge leaves in camp.
// Never commit; delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
const chals = fs.readFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/chals.txt', 'utf8').trim().split('\n').map(l => l.trim().split(/\s+/));
const pre = chals.filter(c => c[1] !== 'post-merge').map(c => c[0]), post = chals.filter(c => c[1] !== 'pre-merge').map(c => c[0]);
const SEEDS = (process.env.SEEDS || '1,2,3,4').split(',').map(Number);
it('moments', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players.filter(r => r.stats && r.archetype);
  const seen = {};
  for (const seed of SEEDS) {
    let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
    const cast = [...roster].sort((a, b) => a.name.localeCompare(b.name)).map(p => [r(), p]).sort((a, b) => a[0] - b[0]).slice(0, 16).map((x, i) => ({ ...x[1], tribe: i % 2 ? 'Bass' : 'Gophers' }));
    const sched = [];
    for (let e = 2; e <= 13; e++) { const list = e <= 6 ? pre : post; sched.push({ id: `c${e}`, episode: e, type: list[(seed * 7 + e * 5) % list.length] }); }
    seededRun(() => runOneSeason({ romance: 'enabled', twistSchedule: sched }, 16, cast), seed);
    for (const ep of core.gs.episodeHistory) {
      const tw = (ep.twists || []).map(t => t.type).find(t => chals.some(c => c[0] === t));
      if (!tw) continue;
      for (const camp of Object.keys(ep.campEvents || {})) for (const ph of ['pre', 'post']) for (const ev of ep.campEvents[camp]?.[ph] || []) {
        if (!ev) continue;
        const k = `${tw} | ${ev.type} | ${ev.badgeText || ''} | ${(ev.players || []).length}p | ${ev.scene?.kind || 'NOSCENE'}`;
        (seen[k] ||= { n: 0, text: String(ev.text || '').slice(0, 140) }).n++;
      }
    }
  }
  seen.__dbg = { n: 0, text: core.gs.episodeHistory.map(e => e.num + ':' + (e.twists || []).map(t => t.type).join('+')).join(' ') };
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/chal-moments.txt', Object.entries(seen).sort().map(([k, v]) => `${v.n}\t${k}\t${v.text}`).join('\n'));
});
