// @vitest-environment jsdom
// SCRATCH: walk each twist-challenge episode's own data for event-shaped records. Never commit; delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
const chals = fs.readFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/chals.txt', 'utf8').trim().split('\n').map(l => l.trim().split(/\s+/));
const pre = chals.filter(c => c[1] !== 'post-merge').map(c => c[0]), post = chals.filter(c => c[1] !== 'pre-merge').map(c => c[0]);
const SKIP = new Set(['campEvents', 'gsSnapshot', 'tribalStory', 'campStory', 'twistStory', 'votingLog', 'campAccess', 'tribesAtStart', 'alliances', 'votePitches', 'pitchIntel', 'tdFirstImp', 'tdAuction', 'tdPreviously', 'exileStory', 'twists']);
it('walk', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players.filter(r => r.stats && r.archetype);
  const per = {};
  for (const seed of (process.env.SEEDS || '1,2,3,4,5,6').split(',').map(Number)) {
    let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
    const cast = [...roster].sort((a, b) => a.name.localeCompare(b.name)).map(p => [r(), p]).sort((a, b) => a[0] - b[0]).slice(0, 16).map((x, i) => ({ ...x[1], tribe: i % 2 ? 'Bass' : 'Gophers' }));
    const sched = [];
    for (let e = 2; e <= 13; e++) { const list = e <= 6 ? pre : post; sched.push({ id: `c${e}`, episode: e, type: list[(seed * 7 + e * 5) % list.length] }); }
    seededRun(() => runOneSeason({ romance: 'enabled', twistSchedule: sched }, 16, cast), seed);
    const names = new Set(core.players.map(p => p.name));
    for (const ep of core.gs.episodeHistory) {
      const tw = (ep.twists || []).map(t => t.type).find(t => chals.some(c => c[0] === t));
      if (!tw) continue;
      const rec = (per[tw] ||= { eps: 0, keys: new Set(), n: 0, badges: {} }); rec.eps++;
      const walk = (o, path, d) => {
        if (!o || typeof o !== 'object' || d > 6) return;
        if (Array.isArray(o)) { o.forEach((x, i) => walk(x, path + '[]', d + 1)); return; }
        const ppl = Array.isArray(o.players) ? o.players.filter(x => names.has(x)) : [];
        const one = typeof o.player === 'string' && names.has(o.player) ? [o.player] : [];
        const who = ppl.length ? ppl : one;
        if (who.length && (o.badge || o.badgeText || o.type) && (o.text || o.desc)) {
          rec.n++; rec.keys.add(path.split('.')[1] || path);
          const b = String(o.badge || o.badgeText || o.type);
          rec.badges[b] = (rec.badges[b] || 0) + 1;
          return;
        }
        for (const [k, v] of Object.entries(o)) if (!SKIP.has(k) && typeof v === 'object') walk(v, path + '.' + k, d + 1);
      };
      for (const [k, v] of Object.entries(ep)) if (!SKIP.has(k) && typeof v === 'object') walk(v, 'ep.' + k, 0);
    }
  }
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/chal-walk.txt', Object.entries(per).sort().map(([t, r]) => `${t}\teps ${r.eps}\tevents ${r.n}\tkeys ${[...r.keys].join(',')}\t${Object.entries(r.badges).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([b, n]) => b + ':' + n).join('; ')}`).join('\n'));
});
