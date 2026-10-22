// @vitest-environment jsdom
// SCRATCH (step 5, the finale and the Aftermath): dump what a played season's finale and Aftermath shows say. Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdFinalTribalScreen, tdFinaleDecisionScreen, tdFanFinaleScreen, tdWinnerScreen } from '../js/vp-td-ep/finale.js';
import { tdStepTranscript } from '../js/vp-td-ep/steps.js';
import { pronouns } from '../js/players.js';

const OUT = 'C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/2d1e6251-1cdc-40bd-802d-421780223329/scratchpad/read';
const R = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const SEASONS = [
  { file: 'hosted', setting: 'hosted-camp', seed: 1729, names: ['Gwen','Leshawna','Heather','Duncan','Courtney','Owen','Lindsay','Trent','Julia','Millie','Aubrey','Lake','Gabby','Bowie','Yul','Bruno'] },
  { file: 'carnival', setting: 'carnival', seed: 3131, names: ['Alessio','Amelie','Anastasia','Benji','Diego','Hannah','Isabel','Ivy','Jade','Logan','Lynda','Marissa','Natalia','Richard','Spencer','Tristan'] },
  { file: 'island', setting: 'survival-island', seed: 4711, names: ['Zee','Nura','Dunia','Ernesto','Evie','Finn','Manu','Oliwia','Ren','Sami','Ara','Natasha','Misha','Stella','Joel','Ireland'] },
];
it('dumps the finale and the Aftermath', () => {
  globalThis.FRANCHISE_ROSTER = R;
  for (const S of SEASONS) {
    if (process.env.ONLY && process.env.ONLY !== S.file) continue;
    const cast = S.names.map((n, i) => ({ ...R.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ romance: 'enabled', setting: S.setting, twistSchedule: [], aftermath: 'enabled' }, 16, cast), S.seed);
    const out = [];
    for (const ep of core.gs.episodeHistory) {
      const a = ep.aftermath;
      if (a?.show) {
        out.push(`\n\n########## AFTERMATH after EP ${ep.num} (#${a.number}) hosts=${(a.show.hosts || []).map(h => h.name).join(', ')}`);
        for (const b of a.show.blocks || []) {
          out.push(`\n--- [${b.set}]${b.title ? ' ' + b.title.kicker + ': ' + b.title.name : ''} seats=${Object.keys(b.seats || {}).join(',')}`);
          for (const l of b.lines) out.push(l.beat ? `(${l.beat})` : `${l.by}: ${l.text}`);
        }
      }
      if (ep.isFinale) {
        out.push(`\n\n########## FINALE EP ${ep.num} winner=${ep.winner || core.gs.winner || '?'} finalists=${JSON.stringify(ep.finalists || ep.finalCast || [])}`);
        for (const [name, fn] of [['final tribal', tdFinalTribalScreen], ['decision', tdFinaleDecisionScreen], ['fan vote', tdFanFinaleScreen], ['winner', tdWinnerScreen]]) {
          let scr = null; try { scr = fn(ep, { host: 'Chris', setting: S.setting, pronouns }); } catch (e) { out.push(`!! ${name} threw ${e.message}`); }
          if (!scr) continue;
          out.push(`\n=== ${name} (${scr.steps?.length || 0} steps)`);
          out.push(...tdStepTranscript(scr).map(l => (typeof l === 'string' ? l : JSON.stringify(l))));
        }
      }
    }
    fs.writeFileSync(`${OUT}/${S.file}-finale.txt`, out.join('\n'));
  }
}, 900000);
