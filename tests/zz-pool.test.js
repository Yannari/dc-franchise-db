import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { finalCompPool, finalCompChoices } from '../js/bb-finale.js';
it('pool', () => {
  const out = [];
  for (const role of ['endurance', 'skill']) {
    const { usual, rest } = finalCompChoices(role);
    out.push(`${role} USUAL (${usual.length}): ${usual.map(c => c.name).join(' | ')}`);
    out.push(`${role} REST  (${rest.length}): ${rest.map(c => c.name).join(' | ')}`);
  }
  const hoh = BB_COMPETITIONS.filter(c => c.types.includes('hoh'));
  out.push(`total ${BB_COMPETITIONS.length}, hoh-capable ${hoh.length}`);
  const byCat = {};
  hoh.forEach(c => { (byCat[c.category] ||= []).push(c.name); });
  Object.entries(byCat).forEach(([k, v]) => out.push(`  hoh ${k} (${v.length}): ${v.join(', ')}`));
  const byC = {};
  BB_COMPETITIONS.forEach(c => { (byC[c.category] ||= []).push(`${c.name}[${c.types.join('/')}]`); });
  Object.entries(byC).forEach(([k, v]) => out.push(`ALL ${k} (${v.length}): ${v.join(', ')}`));
  const fin = BB_COMPETITIONS.filter(c => c.types.includes('final'));
  out.push(`final-typed: ${fin.map(c => `${c.name}[${c.finalRole}]`).join(', ')}`);
  writeFileSync('pool.txt', out.join('\n'));
});
