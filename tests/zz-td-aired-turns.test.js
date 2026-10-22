// @vitest-environment jsdom
// SCRATCH: the story entries that air most, with each spoken turn and the variant tags it already has.
// Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';
import { STORY_POOLS } from '../js/td/story/lines/index.js';
import VOICES from '../js/td/story/lines/voices/index.js';
const SEEDS = (process.env.SEEDS || '4242,777,31337,99').split(',').map(Number);
function castFor(seed, roster) {
  const pool = roster.filter(r => r.stats && r.archetype);
  let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
  const names = [...pool].sort((a, b) => a.name.localeCompare(b.name)).map(p => [r(), p.name]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(x => x[1]);
  return names.map((n, i) => ({ ...roster.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
}
it('aired turns', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const count = {};
  for (const seed of SEEDS) {
    seededRun(() => runOneSeason({ romance: 'enabled' }, 16, castFor(seed, roster)), seed);
    for (const ep of core.gs.episodeHistory) {
      for (const camp of Object.keys(ep.campEvents || {})) for (const ph of ['pre', 'post']) for (const e of campFeed(ep, camp, ph)) if (e.lineId) count[e.lineId] = (count[e.lineId] || 0) + 1;
    }
  }
  const byId = {};
  for (const [k, es] of Object.entries(STORY_POOLS)) for (const e of es) byId[e.id] = { k, e };
  let w = 0, wv = 0, wt = {};
  for (const [id, n] of Object.entries(count)) { const e = byId[id]?.e; if (!e) continue; for (const t of e.turns || []) if (t.say || t.conf) { w += n; if (t.v) { wv += n; for (const k of Object.keys(t.v)) wt[k] = (wt[k] || 0) + n; } } }
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/aired-cover.txt', `aired spoken turns ${w}, with any variant ${wv} (${(100 * wv / w).toFixed(1)}%)\n` + Object.entries(wt).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${(100 * n / w).toFixed(1)}%`).join('\n'));
  const top = Object.entries(count).filter(([id]) => byId[id] && !VOICES[id]).sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 40));
  const out = [];
  for (const [id, n] of top) {
    const { k, e } = byId[id];
    out.push(`## ${n} ${id} ${k} ${e.when ? JSON.stringify(e.when) : ''}`);
    e.turns.forEach((t, i) => { if (t.say || t.conf) out.push(`  ${i} ${t.by}${t.conf ? '[c]' : ''}: ${(t.say || t.conf).slice(0, 120)}  {${Object.keys(t.v || {}).join(',')}}`); });
  }
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/aired-turns.txt', out.join('\n'));
}, 900000);
