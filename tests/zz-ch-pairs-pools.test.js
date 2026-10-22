// scratch: which pair pools air more often than they have entries (repeats inside a season)
import { it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeCast } from './helpers/ch-cast.js';
import { POOLS } from '../js/ch/script/lines/index.js';

it('pair pools: airings vs entries', () => {
  const air = {}, repeats = {};
  const methods = ['rivals', 'ties', 'fresh-meat', 'pick'];
  let seasons = 0;
  for (const pairing of methods) for (const seed of [11, 12]) {
    const { cast, names, background } = challengeCast(24, seed);
    if (pairing === 'fresh-meat') {
      const m = names.filter(n => background[n].gender === 'm'), f = names.filter(n => background[n].gender === 'f');
      for (const [i, n] of m.entries()) background[n].rookie = i < 6;
      for (const [i, n] of f.entries()) background[n].rookie = i >= 6;
    }
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed, options: { pairs: { pairing } } });
    airSeason(r.state);
    seasons++;
    const seen = {};
    for (const e of [...r.episodes, r.state.finalEp]) for (const a of e.aired || []) {
      const scripts = a.kind === 'ceremony' ? a.ceremony.map(c => c.script).filter(Boolean) : [a.script].filter(Boolean);
      for (const s of scripts) {
        if (!s.lineId) continue;
        const key = Object.keys(POOLS).find(k => POOLS[k].some(x => x.id === s.lineId));
        if (!key || !/pairs|^pair|^share|^partner/.test(key)) continue;
        air[key] = (air[key] || 0) + 1;
        const k2 = `${key}|${s.lineId}`;
        seen[k2] = (seen[k2] || 0) + 1;
        if (seen[k2] > 1) repeats[key] = (repeats[key] || 0) + 1;
      }
    }
  }
  const rows = Object.entries(air).map(([k, n]) => ({ k, perSeason: n / seasons, entries: POOLS[k].length, rep: (repeats[k] || 0) / seasons }))
    .sort((a, b) => b.rep - a.rep || b.perSeason - a.perSeason);
  console.log('\npool'.padEnd(44), 'air/season  entries  repeats/season');
  for (const r of rows) console.log(r.k.padEnd(44), r.perSeason.toFixed(1).padStart(8), String(r.entries).padStart(8), r.rep.toFixed(1).padStart(10));
}, 300000);
