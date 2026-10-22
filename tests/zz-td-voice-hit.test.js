// @vitest-environment jsdom
// SCRATCH: of the spoken lines that aired, how many came out in the SPEAKER's own voice (a variant
// for one of their tags, after the age rule), and on the most-aired entries, which voices of the
// people who actually spoke them are still missing per turn. Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';
import { STORY_POOLS } from '../js/td/story/lines/index.js';
import { voiceOf } from '../js/td/story/voice.js';
const SEEDS = (process.env.SEEDS || '4242,777,31337,99,2024,555').split(',').map(Number);
const AGE = new Set(['kid', 'teen', 'adult', 'grown']);
const HARD = ['cruel', 'schemer', 'proud', 'tough', 'blunt', 'dry', 'bossy'];
function castFor(seed, roster) {
  const pool = roster.filter(r => r.stats && r.archetype);
  let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
  const names = [...pool].sort((a, b) => a.name.localeCompare(b.name)).map(p => [r(), p.name]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(x => x[1]);
  return names.map((n, i) => ({ ...roster.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
}
it('voice hit', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const byId = {};
  for (const es of Object.values(STORY_POOLS)) for (const e of es) byId[e.id] = e;
  let spoken = 0, hit = 0;
  const air = {}; // id -> { n, miss: { turn: { tag: count } } }
  for (const seed of SEEDS) {
    seededRun(() => runOneSeason({ romance: 'enabled' }, 16, castFor(seed, roster)), seed);
    for (const ep of core.gs.episodeHistory) for (const camp of Object.keys(ep.campEvents || {})) for (const ph of ['pre', 'post']) for (const ev of campFeed(ep, camp, ph)) {
      const e = byId[ev.lineId]; if (!e) continue;
      const a = (air[e.id] ||= { n: 0, miss: {} }); a.n++;
      for (const l of ev.lines || []) {
        if (l.kind === 'beat' || !l.by || l.turn == null || l.turn < 0) continue;
        const t = e.turns[l.turn]; if (!t || !(t.say || t.conf)) continue;
        spoken++;
        const tags = voiceOf(l.by); const hard = tags.some(x => HARD.includes(x));
        const usable = tags.filter(x => !(hard && AGE.has(x)));
        // a voice-gated entry is written in that voice for its gated role: its base line is theirs
        const gate = [].concat((t.by === 'a' ? e.when?.voice : t.by === 'b' ? e.when?.voiceB : null) || []);
        if (usable.some(x => t.v?.[x]) || usable.slice(0, 3).some(x => gate.includes(x))) { hit++; continue; }
        const lead = usable.find(x => !AGE.has(x)) || usable[0]; if (!lead) continue;
        ((a.miss[l.turn] ||= {})[lead] = (a.miss[l.turn][lead] || 0) + 1);
      }
    }
  }
  const top = Object.entries(air).sort((x, y) => y[1].n - x[1].n).slice(0, +(process.env.TOP || 60));
  const out = [`spoken ${spoken}, in the speaker's own voice ${hit} (${(100 * hit / spoken).toFixed(1)}%)`];
  for (const [id, a] of top) {
    const e = byId[id]; const miss = Object.entries(a.miss); if (!miss.length) continue;
    out.push(`## ${a.n} ${id}`);
    for (const [ti, tags] of miss) { const t = e.turns[ti]; out.push(`  ${ti} ${t.by}${t.conf ? '[c]' : ''}: ${(t.say || t.conf).slice(0, 110)}  MISSING ${Object.entries(tags).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k}${n > 1 ? '×' + n : ''}`).join(' ')}  HAS {${Object.keys(t.v || {}).join(',')}}`); }
  }
  if (process.env.RANK) {
    const rows = [];
    for (const [id, a] of Object.entries(air)) for (const [ti, tags] of Object.entries(a.miss)) { const n = Object.values(tags).reduce((x, y) => x + y, 0); rows.push([n, id, ti, byId[id].turns[ti], tags]); }
    rows.sort((x, y) => y[0] - x[0]);
    out.push('## RANKED');
    for (const [n, id, ti, t, tags] of rows.slice(0, +process.env.RANK)) out.push(`${n} ${id} ${ti} ${t.by}${t.conf ? '[c]' : ''}: ${(t.say || t.conf).slice(0, 120)}  MISSING ${Object.entries(tags).sort((x, y) => y[1] - x[1]).map(([k, c]) => k + (c > 1 ? 'x' + c : '')).join(' ')}`);
  }
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/voice-hit.txt', out.join('\n'));
}, 900000);
