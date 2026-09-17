// ══════════════════════════════════════════════════════════════════════
// tests/dr-vp-crowd.test.js — every queen in a scene has her face on its card
// ══════════════════════════════════════════════════════════════════════
//
// The werk-room, Untucked and generic cards drew `players.slice(0, 2)`, so
// "Ripper & Brightly & MK & Julia" was drawn with two faces.
import { it, expect } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { dragScreens } from '../js/vp-dr/screens.js';
const STATS = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
it('a card that names three or more queens draws every one of their faces', () => {
  const out = []; let big = 0;
  for (const seed of [1, 2, 3]) {
    const rng = rngFor(seed * 31); const r = () => 1 + Math.floor(rng() * 10);
    const cast = Array.from({ length: 14 }, (_, i) => ({ name: `Qn${i + 1}`, slug: `qn${i + 1}`, gender: 'f', archetype: 'floater',
      stats: Object.fromEntries(STATS.map(k => [k, r()])), drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } }));
    const { rows } = playDragSeason({ cast, seed, config: {}, bond: () => 0, addBond: () => {}, popDelta: () => {} });
    for (const row of rows) {
      for (const scr of dragScreens(row)) {
        const host = document.createElement('div'); host.innerHTML = scr.html;
        for (const step of host.querySelectorAll('.dr-step')) {
          const h = step.querySelector('h3, b.dr-disp');
          const names = (h?.textContent || '').split(' & ').map(x => x.trim()).filter(x => /^Qn\d+$/.test(x));
          if (names.length < 3) continue;
          big++;
          const faces = [...step.querySelectorAll('img.dr-por, .dr-initials')].map(x => x.getAttribute('alt') || x.getAttribute('title'));
          const missing = names.filter(n => !faces.includes(n));
          if (missing.length) out.push(`${row.num} ${scr.id}: ${names.join(',')} missing ${missing.join(',')}`);
        }
      }
    }
  }
  expect(out, 'a card named a queen and drew no face for her').toEqual([]);
  expect(big, 'no crowd scene was rendered, so nothing was tested').toBeGreaterThan(0);
});
