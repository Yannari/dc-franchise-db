import { it } from 'vitest';
import fs from 'node:fs';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens } from '../js/vp-rr-ep/steps.js';
it('frame', () => {
  const src = fs.readFileSync('tests/rr-vp-frame.test.js', 'utf8');
  const SEASONS = eval(src.match(/const SEASONS = (\[[^;]*\]);/)[1]);
  const out = [];
  for (const [n, seed] of SEASONS) {
    const { cast, teams } = raceCast(n, seed); setPlayers(cast);
    const res = playRaceSeason({ teams, seed }); const eps = airSeason(res);
    for (const [e, s] of [[3, 50], [4, 45], [4, 46], [4, 47], [9, 39]]) {
      const ep = episodeScreens(res, eps, e - 1);
      const sc = ep.screens.find(x => x.id === `e${e}s${s}`);
      if (sc) out.push(`seed ${seed} e${e}s${s} ${sc.seg} ${sc.place} ${sc.stretch} mode=${sc.mode} plate=${sc.plate?.f} g=${sc.plate?.g} x=${sc.plate?.x} pmode=${sc.plate?.mode} water=${sc.plate?.water}`);
    }
    break;
  }
  fs.writeFileSync('zz-frame.txt', out.join('\n'));
}, 300000);
