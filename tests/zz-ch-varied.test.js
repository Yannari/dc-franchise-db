import { it } from 'vitest';
import { POOLS, LONGER } from '../js/ch/script/lines/index.js';
const ONLY = (process.env.IDS || '').split(',').filter(Boolean);
it('varied originals followed by a new turn', () => {
  const byId = {}; for (const l of Object.values(POOLS)) for (const e of l) byId[e.id] = e;
  for (const [id, spec] of Object.entries(LONGER)) {
    if (ONLY.length && !ONLY.some(p => id.startsWith(p))) continue;
    spec.forEach((x, k) => {
      if (typeof x !== 'number') return;
      const t = byId[id].turns[k];
      const next = spec[k + 1];
      if (t?.v && Object.keys(t.v).length && next && typeof next !== 'number') {
        const alts = Object.values(t.v).flat().slice(0, 3).join(' / ');
        console.log('VAR', id, '|', (t.say || t.conf || '').slice(0, 50), '[', alts.slice(0, 90), '] =>', (next.say || next.conf || next.beat).slice(0, 60));
      }
    });
  }
});
