// Each theme's twist room (to-edit/F-twists, the user, 2026-10-31: "we need plates for the season twist for all the
// themes"): built for its own theme only, chosen by the twist's screen, and never by an ordinary house scene.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { RESORT } from '../js/vp-bb-ep/resort.js';
import { plateFor, plateHtml, setPlateTheme, pickPlate } from '../js/vp-bb-ep/plates.js';

const TWISTS = {
  'sanctum-noms': 'mystery', 'sanctum-eviction': 'mystery', 'jankie-world': 'machine', 'ai-arena': 'machine',
  'temptation-den': 'temptation', 'temptation-tree': 'temptation', 'high-rollers-room': 'high-rollers',
  'camp-yard': 'summer-camp', 'pandoras-box': 'summer-school', 'clique-hallway': 'summer-school',
};
const SOURCES = ['js/vp-bb-ep/steps.js', 'js/vp-bb-ep/steps-ports.js'].map(f => readFileSync(f, 'utf8')).join('\n');

describe('the twist rooms', () => {
  for (const [id, theme] of Object.entries(TWISTS)) {
    it(`${id} is ${theme}'s alone, and its screen names it`, () => {
      expect(RESORT.have[theme]?.[id], `${id} not built for ${theme}`).toContain('day');
      for (const t of Object.keys(RESORT.have)) if (t !== theme) expect(RESORT.have[t]?.[id], `${id} built for ${t}`).toBeFalsy();
      expect(SOURCES).toContain(`plate: '${id}'`);
      setPlateTheme(theme);
      const set = (RESORT.plates[id].room === 'backyard') ? 'yard' : 'ceremony';
      expect(plateFor({ set, plate: id, id: 'x' })).toBe(id);
      expect(plateHtml({ set, plate: id, id: 'x', time: '10:00' }, theme)).toContain(`resort/${theme}/${id}-day`);
      // another season asking for it gets its ordinary room
      setPlateTheme('default');
      expect(plateFor({ set, plate: id, id: 'x' })).not.toBe(id);
    });
  }

  it('never turns up in an ordinary house scene', () => {
    for (const theme of new Set(Object.values(TWISTS))) {
      setPlateTheme(theme);
      for (const set of ['yard', 'ceremony', 'dining', 'kitchen', 'storage', 'hoh', 'bathroom', 'finale']) {
        for (let i = 0; i < 40; i++) expect(Object.keys(TWISTS)).not.toContain(pickPlate(set, `${set}${i}`, 'the pool, the bar, the hallway, the storage room'));
      }
    }
    setPlateTheme('default');
  });
});
