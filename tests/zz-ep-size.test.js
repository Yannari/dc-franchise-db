// @vitest-environment jsdom
// SCRATCH: spoken lines per episode, by part. Never commit; delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';
const chals = fs.readFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/chals.txt', 'utf8').trim().split('\n').map(l => l.trim().split(/\s+/));
const pre = chals.filter(c => c[1] !== 'post-merge').map(c => c[0]), post = chals.filter(c => c[1] !== 'pre-merge').map(c => c[0]);
it('size', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players.filter(r => r.stats && r.archetype);
  const rows = [];
  for (const seed of [1, 2, 3]) {
    let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
    const cast = [...roster].sort((a, b) => a.name.localeCompare(b.name)).map(p => [r(), p]).sort((a, b) => a[0] - b[0]).slice(0, 16).map((x, i) => ({ ...x[1], tribe: i % 2 ? 'Bass' : 'Gophers' }));
    const sched = Array.from({ length: 12 }, (_, k) => ({ id: 'c' + (k + 2), episode: k + 2, type: (k + 2 <= 6 ? pre : post)[(seed * 7 + (k + 2) * 5) % (k + 2 <= 6 ? pre : post).length] }));
    seededRun(() => runOneSeason({ romance: 'enabled', twistSchedule: sched }, 16, cast), seed);
    for (const ep of core.gs.episodeHistory) {
      if (ep.isFinale) continue;
      const spoken = ls => (ls || []).filter(l => l.kind !== 'beat').length;
      let camp = 0, scenes = 0;
      for (const c of Object.keys(ep.campEvents || {})) for (const ph of ['pre', 'post']) for (const e of campFeed(ep, c, ph)) { scenes++; camp += spoken(e.lines) || (e.text ? 1 : 0); }
      const st = ep.tribalStory || {};
      const tribal = (st.qa || []).reduce((a, q) => a + spoken(q.lines), 0) + (st.booth || []).length + spoken(st.reveal) + spoken(st.room) + spoken(st.exit) + spoken(st.after) + (st.plays || []).reduce((a, p) => a + spoken(p.lines), 0);
      const prev = (ep.tdPreviously || []).length;
      rows.push({ ep: ep.num, scenes, camp, tribal, prev, total: camp + tribal + prev });
    }
  }
  const q = (k, p) => { const a = rows.map(r => r[k]).sort((x, y) => x - y); return a[Math.floor(p * (a.length - 1))]; };
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/ep-size.txt', ['scenes', 'camp', 'tribal', 'prev', 'total'].map(k => `${k}: p25 ${q(k, .25)} median ${q(k, .5)} p75 ${q(k, .75)}`).join('\n'));
});
