// Voice overlays (js/td/story/lines/voices/batch*.js) add variants to a scene's turns BY INDEX. When a
// scene is rewritten with more turns, its overlays stay where they were and land on someone else's
// line: the user, 2026-10-10, "why did Finn say that" (Bruno's confessional, "Finn couldn't even look
// at me!", spoken by Finn). Nineteen overlay keys in thirteen batches had drifted like that.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { STORY_POOLS } from '../js/td/story/lines/index.js';

const byId = new Map(Object.values(STORY_POOLS).flat().map(e => [e.id, e]));
const DIR = path.resolve('js/td/story/lines/voices');
const words = t => new Set(String(t || '').toLowerCase().replace(/\{[^}]+\}/g, ' x ').match(/[a-z']+/g) || []);
const sim = (a, b) => { const A = words(a), B = words(b); if (A.size < 4 || B.size < 4) return 0; let n = 0; for (const w of A) if (B.has(w)) n++; return n / Math.min(A.size, B.size); };
const norm = t => String(t || '').toLowerCase().replace(/[^a-z{} ]/g, '').replace(/\s+/g, ' ').trim();
const base = t => (t ? (t.say || t.conf || '') : '');
// read and judged where they are: a variant that only shares words with a later line
const FINE = new Set(['nv4.n2:8', 'nar.l1:2', 'nrn.p1:2', 'nl5.f3:1', 'nl.n1:7']);

describe('voice overlays sit on the turn they were written for', () => {
  it('no overlay is much closer to another turn of its scene, or copies one', async () => {
    const bad = [];
    for (const f of fs.readdirSync(DIR).filter(x => /^batch\d+\.js$/.test(x))) {
      const mod = (await import(pathToFileURL(path.join(DIR, f)).href)).default;
      for (const [id, byIdx] of Object.entries(mod)) {
        const e = byId.get(id); if (!e) continue;
        for (const [is, vs] of Object.entries(byIdx)) {
          const i = +is; if (FINE.has(`${id}:${i}`)) continue;
          const texts = Object.values(vs), here = e.turns[i];
          if (!here || !here.by) { bad.push(`${f} ${id} ${i}: no spoken turn there`); continue; }
          const score = j => texts.reduce((s, x) => s + sim(x, base(e.turns[j])), 0) / texts.length;
          const sHere = score(i);
          e.turns.forEach((t, j) => { if (j !== i && t.by && score(j) >= 0.5 && score(j) - sHere >= 0.3) bad.push(`${f} ${id} ${i}: reads like turn ${j}`); });
          const own = norm(base(here));
          for (const x of texts) { const n = norm(x); if (n !== own && n.split(' ').length >= 2 && e.turns.some((t, k) => k !== i && t.by && norm(base(t)) === n)) { bad.push(`${f} ${id} ${i}: "${x}" is another turn's line`); break; } }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('nobody names themselves in the third person (an overlay on the wrong speaker)', () => {
    const bad = [];
    // introductions say their own name, and so does a line about who they've become
    const OWN = sl => new RegExp(`(I'm|I am|name's|name is|And I'm|the) \\{${sl}\\}|^\\{${sl}\\}!`);
    for (const [k, pool] of Object.entries(STORY_POOLS)) for (const e of pool) e.turns.forEach((t, i) => {
      if (!t.by || t.by === 'h') return;
      const re = new RegExp(`\\{${t.by}\\}(?!\\.)`);
      for (const [vk, x] of [['base', base(t)], ...Object.entries(t.v || {})]) if (re.test(String(x)) && !OWN(t.by).test(String(x))) bad.push(`${e.id} [${k}] turn ${i} (${vk}): ${String(x).slice(0, 80)}`);
    });
    expect(bad).toEqual([]);
  });
});
