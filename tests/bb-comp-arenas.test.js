// Every competition has a set to be staged in, and every set is rendered for every season.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { ARENAS, arenaFor, COMP_ARENA_MAP } from '../js/bb/comp-arenas.js';

const compIds = () => {
  const ids = new Set();
  for (const f of fs.readdirSync('js/bb-comps')) {
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(`js/bb-comps/${f}`, 'utf8');
    for (const m of src.matchAll(/^\s+id: '((?:bb|pair)-[a-z0-9-]+)'/gm)) ids.add(m[1]);
  }
  return [...ids];
};
const THEMES = ['default', 'temptation', 'machine', 'mystery', 'high-rollers', 'summer-camp', 'summer-school'];

describe('competition arenas', () => {
  it('stages every competition somewhere', () => {
    const homeless = compIds().filter(id => !arenaFor(id));
    expect(homeless, 'no arena: ' + homeless.join(', ')).toHaveLength(0);
  });

  it('maps only competitions that exist, to arenas that exist', () => {
    const ids = new Set(compIds());
    for (const [id, arena] of Object.entries(COMP_ARENA_MAP)) {
      expect(ids.has(id), `${id} is not a competition`).toBe(true);
      expect(ARENAS[arena], `${id} -> ${arena}`).toBeTruthy();
    }
  });

  it('has a render of every arena for every season', () => {
    for (const t of THEMES) for (const a of Object.keys(ARENAS)) {
      expect(fs.existsSync(`assets/bb/house/${t}/${a}-td-b.webp`), `${t}/${a}`).toBe(true);
    }
  });
});
