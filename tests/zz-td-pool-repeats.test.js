// @vitest-environment jsdom
// SCRATCH: which story pools run dry in a season (entries aired twice or more). Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { STORY_POOLS } from '../js/td/story/lines/index.js';
const R = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
const SEASONS = [
  { setting: 'hosted-camp', seed: 1729, names: ['Gwen','Leshawna','Heather','Duncan','Courtney','Owen','Lindsay','Trent','Julia','Millie','Aubrey','Lake','Gabby','Bowie','Yul','Bruno'] },
  { setting: 'survival-island', seed: 4711, names: ['Zee','Nura','Dunia','Ernesto','Evie','Finn','Manu','Oliwia','Ren','Sami','Ara','Natasha','Misha','Stella','Joel','Ireland'] },
  { setting: 'film-lot', seed: 9090, names: ['Scott','Jo','Lightning','Dawn','Cameron','Zoey','Mike','Brick','Anne Maria','Sam','Jasmine','Shawn','Sky','Topher','Ella','Max'] },
  { setting: 'world-tour', seed: 2026, names: ['Alejandro','Heather','Gwen','Duncan','Courtney','Owen','Izzy','Cody','Sierra','Lindsay','Harold','Leshawna','Noah','Bridgette','Geoff','Trent'] },
];
it('pools that run dry', () => {
  const poolOf = new Map();
  for (const [k, list] of Object.entries(STORY_POOLS || {})) for (const e of list || []) poolOf.set(e.id, [k, (list || []).length]);
  const tally = {};
  for (const S of SEASONS) {
    const cast = S.names.map((n, i) => ({ ...R.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ romance: 'enabled', setting: S.setting, twistSchedule: [] }, 16, cast), S.seed);
    const uses = core.gs.tdStory?.ledger?.uses || {};
    for (const [id, n] of Object.entries(uses)) if (n >= 2) {
      const [pool, size] = poolOf.get(id) || ['?', 0];
      const t = (tally[pool] ||= { size, extra: 0, ids: new Set() });
      t.extra += n - 1; t.ids.add(id);
    }
  }
  const rows = Object.entries(tally).sort((a, b) => b[1].extra - a[1].extra);
  for (const [pool, t] of rows.slice(0, 45)) console.log(`DRY ${String(t.extra).padStart(3)} extra  size ${String(t.size).padStart(3)}  ${pool}  [${[...t.ids].slice(0, 6).join(' ')}]`);
}, 1800000);
