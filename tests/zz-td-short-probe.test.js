// @vitest-environment jsdom
// SCRATCH: which camp scenes are short (<= 5 spoken lines), how often, and do the challenge threads air. Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';

const SEEDS = (process.env.SEEDS || '4242,777,31337').split(',').map(Number);
function castFor(seed, roster) {
  const pool = roster.filter(r => r.stats && r.archetype);
  let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
  const names = [...pool].sort((a, b) => a.name.localeCompare(b.name)).map(p => [r(), p.name]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(x => x[1]);
  return names.map((n, i) => ({ ...roster.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
}
it('short probe', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const chals = fs.readFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/chals.txt', 'utf8').trim().split(String.fromCharCode(10)).map(l => l.trim().split(/\s+/));
  const pre = chals.filter(c => c[1] !== 'post-merge').map(c => c[0]), post = chals.filter(c => c[1] !== 'pre-merge').map(c => c[0]);
  const short = {}, all = {}; let items = 0, shortN = 0, lines = 0; const thr = {}; let hist = 0; const samples = {};
  for (const seed of SEEDS) {
    const sched = Array.from({ length: 12 }, (_, k) => ({ id: 'c' + (k + 2), episode: k + 2, type: (k + 2 <= 6 ? pre : post)[(seed * 7 + (k + 2) * 5) % (k + 2 <= 6 ? pre : post).length] }));
    seededRun(() => runOneSeason({ romance: 'enabled', twistSchedule: sched }, 16, castFor(seed, roster)), seed);
    for (const ep of core.gs.episodeHistory) {
      if (ep.isFinale) continue;
      for (const camp of Object.keys(ep.campEvents || {})) for (const ph of ['pre', 'post']) for (const e of campFeed(ep, camp, ph)) {
        const spoken = (e.lines || []).filter(l => l.kind !== 'beat').length;
        const k = e.story ? (e.kind || ('?' + (e.type || '') + ' ' + (e.scene?.kind || ''))).split('.').slice(0, 3).join('.') : 'RAW ' + (e.type || '?') + (e.scene?.kind ? ' ' + e.scene.kind : '');
        items++; lines += spoken; all[k] = (all[k] || 0) + 1;
        if (spoken <= 5) { shortN++; short[k] = (short[k] || 0) + 1; if (!samples[k]) samples[k] = (e.lines || []).map(l => (l.by ? l.by + ': ' : '') + l.text).join(' / ').slice(0, 260); }
        if (/^thr\./.test(e.kind || '')) thr[e.kind] = (thr[e.kind] || 0) + 1;
        if ((e.lines || []).some(l => l.recall && /history|days|carrying|forgot|waited|Remember/.test(l.text))) hist++;
      }
    }
  }
  const out = [`items ${items}, short(<=5 spoken) ${shortN} (${Math.round(shortN / items * 100)}%), spoken/item ${(lines / items).toFixed(1)}`, `threads ${JSON.stringify(thr)}`, `history recalls ~${hist}`, '', 'TOP SHORT:'];
  for (const [k, n] of Object.entries(short).sort((a, b) => b[1] - a[1]).slice(0, 40)) out.push(`${String(n).padStart(4)} / ${String(all[k]).padStart(4)}  ${k}  ::  ${samples[k]}`);
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/short-probe.txt', out.join('\n'));
});
