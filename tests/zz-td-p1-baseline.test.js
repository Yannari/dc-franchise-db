// @vitest-environment jsdom
// SCRATCH (TD spec Phase 1): zero-displacement baseline. Never commit; delete by exact name.
// BASE_OUT=path writes the fingerprint; READ_OUT=path writes every camp event's words.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';

const CASTS = [
  ['Alejandro', 'Heather', 'Gwen', 'Duncan', 'Courtney', 'Owen', 'Izzy', 'Cody', 'Sierra', 'Lindsay', 'Harold', 'Leshawna', 'Noah', 'Bridgette', 'Geoff', 'Trent'],
];
const SEEDS = [4242, 777, 31337, 99, 2024];

it('baseline', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const pool = roster.filter(r => r.stats && r.archetype);
  const fp = [], read = [];
  for (const seed of SEEDS) {
    // seed-picked cast of 16 from the roster (fixed per seed), first season = the classic names
    let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
    const names = seed === 4242 ? CASTS[0] : [...pool].sort((a, b) => a.name.localeCompare(b.name))
      .map(p => [r(), p.name]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(x => x[1]);
    const cast = names.map((n, i) => ({ ...roster.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ romance: 'enabled' }, 16, cast), seed);
    read.push(`\n######## SEED ${seed}: ${names.join(', ')}`);
    for (const ep of core.gs.episodeHistory) {
      fp.push(`S${seed} E${ep.num} imm=${[].concat(ep.immunityWinner || ep.winner || '').join('+')} out=${ep.eliminated || ''}`);
      read.push(`\n===== S${seed} EP ${ep.num}${ep.isMerge ? ' MERGE' : ''} out=${ep.eliminated || ''}`);
      for (const [camp, feed] of Object.entries(ep.campEvents || {})) {
        for (const phase of ['pre', 'post']) {
          for (const e of (Array.isArray(feed) ? (phase === 'pre' ? feed : []) : feed?.[phase] || [])) {
            fp.push(`  ${camp}/${phase} ${e.type}:${(e.players || []).join(',')}:${e.badgeText || ''}`);
            read.push(`[${camp}/${phase}] ${e.type} {${(e.players || []).join(',')}}${e.lines ? ' *' : ''}\n${(e.lines ? e.lines.map(l => l.kind === 'beat' ? `   (${l.text})` : `   ${l.by}${l.kind === 'conf' ? ' [conf]' : ''}: ${l.text}`).join('\n') : '   ' + String(e.text || '').replace(/\n/g, ' / '))}`);
          }
        }
      }
      for (const v of ep.votingLog || []) fp.push(`  vote ${v.voter}>${v.voted}`);
    }
  }
  if (process.env.BASE_OUT) fs.writeFileSync(process.env.BASE_OUT, fp.join('\n'));
  if (process.env.READ_OUT) fs.writeFileSync(process.env.READ_OUT, read.join('\n'));
}, 600000);

// Wear: per season, each scripted family's uses vs distinct entries.
it('wear', () => {
  if (!process.env.WEAR_OUT) return;
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const pool = roster.filter(r => r.stats && r.archetype);
  const rows = {};
  for (const seed of SEEDS) {
    let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
    const names = seed === 4242 ? CASTS[0] : [...pool].sort((a, b) => a.name.localeCompare(b.name))
      .map(p => [r(), p.name]).sort((a, b) => a[0] - b[0]).slice(0, 16).map(x => x[1]);
    const cast = names.map((n, i) => ({ ...roster.find(p => p.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ romance: 'enabled' }, 16, cast), seed);
    const used = {};
    for (const ep of core.gs.episodeHistory) for (const feed of Object.values(ep.campEvents || {})) {
      for (const e of Array.isArray(feed) ? feed : [...(feed?.pre || []), ...(feed?.post || [])]) {
        if (!e.scene) continue;
        const k = e.scene.kind + '.' + (e.scene.data?.ending || 'any');
        (used[k] ||= []).push(e.scene.lineId);
      }
    }
    for (const [k, ids] of Object.entries(used)) {
      const row = (rows[k] ||= { fires: 0, repeats: 0 });
      row.fires += ids.length; row.repeats += ids.length - new Set(ids).size;
    }
  }
  fs.writeFileSync(process.env.WEAR_OUT, Object.entries(rows).sort().map(([k, v]) =>
    `${k.padEnd(28)} fires/season ${(v.fires / SEEDS.length).toFixed(1).padStart(5)}  repeats ${(100 * v.repeats / v.fires).toFixed(0).padStart(3)}%`).join('\n'));
}, 600000);
