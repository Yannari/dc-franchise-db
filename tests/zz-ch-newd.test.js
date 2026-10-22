import { it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { chStepScreens } from '../js/vp-ch-ep/steps.js';
import { challengeCast } from './helpers/ch-cast.js';
import { writeFileSync } from 'fs';
it('new dailies', () => {
  const want = new Set(['deep-freeze', 'log-roll', 'road-kill', 'mud-brawl', 'car-jump', 'locked-in', 'the-box', 'buried', 'food-wars', 'trapeze', 'poison-cup', 'who-said-it']);
  const got = {}; const keep = [];
  for (const seed of [5, 9, 21, 33, 47, 60, 77, 91, 102, 120, 133, 150]) {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed }); airSeason(r.state);
    for (const row of challengeRows(r)) {
      const id = row.ch.daily?.id; if (!want.has(id) || got[id]) continue;
      const d = chStepScreens(row).find(s => s.key === 'daily');
      got[id] = d.steps.length;
      console.log('NEW', id, 'seed', seed, 'ep', row.num, 'steps', d.steps.length);
      console.log(d.steps.slice(8, 30).map((x, i) => '   ' + (x.scene ? '[' + x.scene.plate + '] ' : '') + (x.tj ? 'TJ: ' + x.tj : x.say ? x.say[0] + ': ' + x.say[1] : x.conf ? '(c) ' + x.conf[1] : x.dir || '')).join('\n').slice(0, 2400));
      keep.push(row); writeFileSync('tools/ch-art/cuts/rows-'+id+'.json', JSON.stringify([row]));
    }
  }
  writeFileSync('tools/ch-art/cuts/rows-new.json', JSON.stringify(keep));
  console.log('GOT', JSON.stringify(got));
});
