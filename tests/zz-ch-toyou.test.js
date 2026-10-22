import { it } from 'vitest';
import { DAILIES } from '../js/ch/dailies.js';
import { ARENA_GAMES } from '../js/ch/arena.js';
import { toYou } from '../js/vp-ch-ep/steps.js';
import { rulesOf } from '../js/vp-ch-ep/games.js';
it('toYou', () => { for (const g of [...DAILIES, ...ARENA_GAMES]) for (const r of rulesOf(g.desc)) console.log(g.id, '|', toYou(r)); });
