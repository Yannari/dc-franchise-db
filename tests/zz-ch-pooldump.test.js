import { it } from 'vitest';
import { POOLS, LONGER } from '../js/ch/script/lines/index.js';
import { ROLES } from '../js/ch/script/roles.js';
const KINDS = (process.env.KINDS || '').split(',');
it('dump', () => {
  for (const [key, list] of Object.entries(POOLS)) {
    if (!KINDS.includes(key.split('.')[0])) continue;
    console.log(`POOL ${key}`);
    for (const e of list) {
      if (LONGER[e.id]) { console.log(`  ${e.id} (done)`); continue; }
      console.log(`  ${e.id}${e.when ? ' when ' + JSON.stringify(e.when) : ''}`);
      e.turns.forEach((t, i) => console.log(`    ${i}${t.v && Object.keys(t.v).length ? '*' : ' '} ${t.beat ? '(' + t.beat + ')' : `${t.by}${t.conf ? '[c]' : ''}: ${t.say || t.conf}`}`));
    }
  }
  for (const k of KINDS) console.log(`ROLE ${k}: ${String(ROLES[k] || '').slice(0, 300)}`);
});
