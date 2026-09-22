import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KINDS } from '../js/pm/events.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'js', 'pm');
const strip = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '');
const VALID_STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty',
  'boldness', 'intuition', 'temperament'];

describe('engine rules', () => {
  for (const f of readdirSync(DIR).filter(x => x.endsWith('.js'))) {
    const src = strip(readFileSync(join(DIR, f), 'utf8'));
    it(`${f} never calls Math.random`, () => { expect(src).not.toMatch(/Math\.random/); });
    it(`${f} reads only the nine stats`, () => {
      for (const [, key] of src.matchAll(/stats\??\.([a-zA-Z]+)/g)) expect(VALID_STATS, `${f}: stats.${key}`).toContain(key);
    });
  }
  it('every template uses placeholders, never a name', () => {
    for (const [kind, def] of Object.entries(KINDS)) {
      for (const t of def.tpl) expect(t, kind).toMatch(/\{a\}/);
    }
  });
});
