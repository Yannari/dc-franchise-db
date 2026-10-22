// @vitest-environment jsdom
// SCRATCH (TD storylines spec): measure played seasons the way the transcripts were measured
// (scenes per camp, lines per scene, people per scene, who goes unseen). Never commit; delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';

const CLASSIC = ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'];
const SEEDS = (process.env.SEEDS || '4242,777,31337').split(',').map(Number);

function castFor(seed, roster) {
  const pool = roster.filter(r => r.stats && r.archetype);
  let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
  const names = process.env.CAST ? process.env.CAST.split(',') : seed === 4242 ? CLASSIC : [...pool].sort((a, b) => a.name.localeCompare(b.name))
    .map(p => [r(), p.name]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(x => x[1]);
  return names.map((n, i) => ({ ...roster.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
}

const q = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a[Math.floor(p * (a.length - 1))]; };

it('measure', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const lens = [], sizes = [], perCamp = [], out = [], read = [];
  let slots = 0, noScene = 0, noLine = 0, noConf = 0;
  const kinds = {};
  const wear = {};
  for (const seed of SEEDS) {
    // the user: assume twist challenges every episode (CHALS=0 turns it off)
    const chals = fs.readFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/chals.txt', 'utf8').trim().split(String.fromCharCode(10)).map(l => l.trim().split(/\s+/));
    const pre = chals.filter(c => c[1] !== 'post-merge').map(c => c[0]), post = chals.filter(c => c[1] !== 'pre-merge').map(c => c[0]);
    const sched = process.env.CHALS === '0' ? [] : Array.from({ length: 12 }, (_, k) => ({ id: 'c' + (k + 2), episode: k + 2, type: (k + 2 <= 6 ? pre : post)[(seed * 7 + (k + 2) * 5) % (k + 2 <= 6 ? pre : post).length] }));
    seededRun(() => runOneSeason({ romance: 'enabled', twistSchedule: sched }, 16, castFor(seed, roster)), seed);
    const streak = {}, best = {};
    const usedIds = {};
    for (const ep of core.gs.episodeHistory) {
      if (ep.isFinale) continue;
      const alive = [...new Set([...(ep.tribesAtStart || []).flatMap(t => t.members || []), ...(ep.votingLog || []).map(v => v.voter), ...(ep.tribalPlayers || [])])].filter(n => core.players.some(p => p.name === n));
      const inScene = new Set(), spoke = new Set(), conf = new Set();
      read.push(`\n===== S${seed} EP ${ep.num}${ep.isMerge ? ' MERGE' : ''} out=${ep.eliminated || ''}`); for (const l of ep.tdPreviously || []) read.push('   PREV ' + (l.text || l));
      for (const camp of Object.keys(ep.campEvents || {})) {
        let n = 0;
        for (const ph of ['pre', 'post']) for (const e of campFeed(ep, camp, ph)) {
          read.push('[' + camp + '/' + ph + '] ' + (e.story ? 'STORY ' + e.kind + (e.storyline ? ' <' + e.storyline + '>' : '') : 'RAW ' + (e.scene?.kind || '-') + ' ' + e.type) + ' {' + (e.players || []).join(',') + '}' + (e.lineId ? ' #' + e.lineId : '') + String.fromCharCode(10) + (e.lines || []).map(l => l.kind === 'beat' ? '   (' + l.text + ')' : '   ' + l.by + (l.kind === 'conf' ? ' [conf]' : '') + ': ' + l.text).join(String.fromCharCode(10)));
          const lines = e.lines || [];
          if (e.story && e.lineId) { const k = e.kind + '.' + (e.scene?.data?.ending || e.step || ''); (usedIds[k] ||= []).push(e.lineId); }
          const said = lines.filter(l => l.kind !== 'beat' && l.kind !== 'conf');
          n++;
          lens.push(said.length);
          const who = new Set(said.map(l => l.by));
          sizes.push(who.size);
          (e.players || []).forEach(p => inScene.add(p));
          said.forEach(l => spoke.add(l.by));
          lines.filter(l => l.kind === 'conf').forEach(l => conf.add(l.by));
          const k = e.story ? 'STORY' : `${e.scene?.kind || '-'}.${e.scene?.data?.ending || ''}`;
          kinds[k] = (kinds[k] || 0) + 1;
        }
        perCamp.push(n);
        void 0;
      }
      const st = ep.tribalStory;
      if (st) for (const q of st.qa || []) { const k = 'tqa.' + q.topic; const w = (wear[k] ||= { fires: 0, rep: 0, ids: [] }); w.fires++; const id = q.lines.map(l => l.text).join('|').slice(0, 60); if ((w.ids ||= []).includes(id)) w.rep++; else w.ids.push(id); }
      if (st) for (const pl of st.plays || []) read.push('[PLAY] ' + pl.player + String.fromCharCode(10) + pl.lines.map(l => '   ' + (l.by || '') + ': ' + l.text).join(String.fromCharCode(10)));
      if (st) {
        const f = l => l.kind === 'beat' ? `   (${l.text})` : `   ${l.by}${l.kind === 'conf' ? ' [conf]' : ''}: ${l.text}`;
        read.push(`[READING${st.room?.length ? ' ROOM' : ''}] ` + [...(st.qa || []).flatMap(x => x.lines.map(l => ({ ...l, text: '?' + l.text }))), ...(st.reveal || []), ...(st.room || []).map(l => ({ ...l, text: '*' + l.text })), ...(st.after || [])].map(f).join(String.fromCharCode(10)));
      }
      for (const p of alive) {
        slots++;
        if (!inScene.has(p)) noScene++;
        if (!spoke.has(p)) noLine++;
        if (!conf.has(p)) noConf++;
        streak[p] = spoke.has(p) ? 0 : (streak[p] || 0) + 1;
        best[p] = Math.max(best[p] || 0, streak[p]);
      }
    }
    for (const [k, ids] of Object.entries(usedIds)) { const w = (wear[k] ||= { fires: 0, rep: 0 }); w.fires += ids.length; w.rep += ids.length - new Set(ids).size; }
    out.push(`seed ${seed} longest run with no camp line: ` + Object.entries(best).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v]) => `${n} ${v}`).join(', '));
  }
  const b = { '<=4': 0, '5-9': 0, '10-19': 0, '20+': 0 };
  lens.forEach(n => b[n <= 4 ? '<=4' : n < 10 ? '5-9' : n < 20 ? '10-19' : '20+']++);
  const sz = {}; sizes.forEach(s => { const k = s >= 5 ? '5+' : s; sz[k] = (sz[k] || 0) + 1; });
  out.unshift(
    `scenes per camp per episode: median ${q(perCamp, .5)} p90 ${q(perCamp, .9)}`,
    `spoken lines per event: n=${lens.length} p25 ${q(lens, .25)} median ${q(lens, .5)} p75 ${q(lens, .75)} p90 ${q(lens, .9)} max ${Math.max(...lens)}`,
    `length buckets: ` + Object.entries(b).map(([k, v]) => `${k} ${(100 * v / lens.length).toFixed(0)}%`).join(', '),
    `speakers per event: ` + Object.entries(sz).map(([k, v]) => `${k} ${(100 * v / sizes.length).toFixed(0)}%`).join(', '),
    `alive slots ${slots}: not in any event ${(100 * noScene / slots).toFixed(0)}%, no spoken camp line ${(100 * noLine / slots).toFixed(0)}%, no confessional ${(100 * noConf / slots).toFixed(0)}%`,
    `families: ` + Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${k}`).join('\n'),
  );
  fs.writeFileSync(process.env.OUT || 'C:/Users/yanna/AppData/Local/Temp/tdtx/sim-measure.txt', out.join('\n'));
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/dbg.txt', (globalThis.__dbg || 'none') + JSON.stringify({ mentor: core.gs.tdStory?.mentor, arcs: core.gs.tdStory?.arcs2, elim: (core.gs.episodeHistory||[]).map(h => h.num + ':' + h.eliminated) }));
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/sim-read.txt', read.join('\n'));
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/sim-wear.txt', Object.entries(wear).sort((x, y) => y[1].rep - x[1].rep || y[1].fires - x[1].fires)
    .map(([k, v]) => `${k.padEnd(40)} fires/season ${(v.fires / SEEDS.length).toFixed(1).padStart(5)}  repeats ${v.rep}`).join('\n'));
}, 900000);
