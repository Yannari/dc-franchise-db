import { it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rel } from '../js/ci/state.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';
it('gw', () => {
  let n = 0, friend = 0, blocker = 0, neither = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const cast = rosterCast(13, seed); setPlayers(cast); const names = cast.map(p => p.name);
    const { state } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
    for (const sc of state.scenes.filter(s => s.kind === 'goodbye' && s.data.warning)) {
      const h = sc.who[0], o = sc.data.warning.about;
      const b = state.blocked.find(x => x.handle === h);
      n++;
      const aff = rel(h, o, 'affection');
      if (aff > 3) friend++; if (aff > 3 && !b?.by?.includes(o)) (globalThis.__fnb = (globalThis.__fnb || 0) + 1); if (aff > 3 && b?.by?.includes(o)) (globalThis.__fb = (globalThis.__fb || 0) + 1);
      if (b?.by?.includes(o)) blocker++; else if (aff <= 3) neither++;
    }
  }
  console.log('FNB', globalThis.__fnb || 0, 'FB', globalThis.__fb || 0); console.log(`GW warnings ${n} | at a friend (affection > 3) ${friend} | at a blocker ${blocker} | at neither ${neither}`);
}, 900000);
