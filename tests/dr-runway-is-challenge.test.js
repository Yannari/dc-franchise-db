// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-runway-is-challenge.test.js — a design night has one look, judged once
// ══════════════════════════════════════════════════════════════════════
//
// On a Ball, a Design challenge and a Runway challenge the thing she presents
// on the main stage IS the thing the challenge set her to make. The week ran
// `runwayScore` on top of the challenge anyway, so the same garment was scored
// twice on two independent dice — and could disagree with itself, marking a
// queen down on the walk she had just won the challenge with. The screen drew
// a Runway section narrating a look the challenge had narrated a moment
// earlier.
//
// `runwayIsChallenge` in js/dr/data/challenges.js says which challenges
// deliver a look. Set it on a new one and the second walk goes away with it.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { dragScreens } from '../js/vp-dr/screens.js';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';

const STATS = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const DRAG = ['acting','comedy','dance','design','runway','lipsync','singing'];
const CAST = Array.from({ length: 10 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'wildcard', age: 25,
  stats: Object.fromEntries(STATS.map((s, j) => [s, 3 + ((i * 7 + j * 3) % 7)])),
  drag: Object.fromEntries(DRAG.map((s, j) => [s, 3 + ((i * 5 + j * 4) % 7)])),
}));

const week = (maxiId, seed = 99) => playDragSeason({
  cast: CAST, seed,
  config: { drSchedule: [{ episode: 2, maxiId }], drFinale: 'top4' },
}).rows[1];

const look = row => ({
  section: dragScreens(row).map(s => s.id).includes('dr-runway'),
  marker: (row.dr.scenes || []).some(s => s.kind === 'runway'),
  walks: (row.dr.scenes || []).filter(s => /^stage:walk/.test(s.kind)).length,
});

const DESIGN = MAXI_TYPES.filter(m => m.runwayIsChallenge).map(m => m.id);

describe('a challenge whose deliverable is the look', () => {
  it('is exactly the three that build one', () => {
    // Not an arbitrary list: if a fourth design challenge is added and the
    // flag is forgotten, this is where that shows up.
    expect(DESIGN.sort()).toEqual(['ball', 'design', 'runway-challenge']);
  });

  it('walks no second runway', () => {
    for (const id of DESIGN) {
      const row = week(id);
      expect(row.dr.challenge.id, `${id} did not run`).toBe(id);
      const l = look(row);
      expect(l.section, `${id} still draws a Runway section`).toBe(false);
      expect(l.marker, `${id} still calls a runway category`).toBe(false);
      expect(l.walks, `${id} still narrates ${l.walks} walk beats`).toBe(0);
    }
  });

  it('scores the look once — the walk IS the challenge result', () => {
    for (const id of DESIGN) {
      const row = week(id);
      for (const n of row.dr.living) {
        const r = row.dr.runway[n];
        expect(r.isChallenge, `${id}/${n}`).toBe(true);
        // The panel and the chart read runway[n].score, so it still has to be
        // there — it just is not a second opinion any more.
        expect(typeof r.score).toBe('number');
      }
    }
  });

  it('leaves every other challenge with its runway — the control arm', () => {
    /* WITHOUT THIS the assertions above pass on a build that removed the
       runway from the whole show. */
    for (const id of ['acting', 'talent-show', 'snatch-game']) {
      const row = week(id);
      const l = look(row);
      expect(l.section, `${id} lost its runway`).toBe(true);
      expect(l.marker, `${id} lost its category call`).toBe(true);
      expect(l.walks, `${id} narrates no walks`).toBeGreaterThan(0);
    }
  });

  it('still separates the two on a night the panel disagrees about', () => {
    // Across several seeds, because one seed agreeing proves nothing.
    for (const seed of [7, 21, 44]) {
      const row = week('design', seed);
      expect(dragScreens(row).map(s => s.id)).not.toContain('dr-runway');
      const first = row.dr.living[0];
      expect(row.dr.runway[first].walks.length).toBe(1);
    }
  });
});
