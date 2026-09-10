// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-returnee-eliminated.test.js — a queen who walked back on is not
// still on the eliminated list
// ══════════════════════════════════════════════════════════════════════
//
// RED ON PURPOSE until js/dr-run.js clears her. Found by reading a played
// season's console, not by a suite: episode four printed her in `living` and
// in `gs.eliminated` on the same line, and by episode ten she was on the list
// twice.
//
// js/dr-run.js only ever appends to gs.eliminated. Big Brother clears the
// returnee on the way back in -- js/bb/battle-back.js:253 and
// js/bb/week.js:7542 both filter her out -- and drag-race never learned to.
//
// Drag Race's own placements read `exits[]` (see the note at the top of
// js/dr/export.js), so the show itself does not trip on this. The franchise
// layer does: js/aftermath.js:47 unions gs.eliminated into the eliminated set.
import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../js/core.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const DRAG = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
const CAST = Array.from({ length: 13 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'wildcard', age: 25,
  stats: Object.fromEntries(STATS.map((s, j) => [s, 3 + ((i * 7 + j * 3) % 7)])),
  drag: Object.fromEntries(DRAG.map((s, j) => [s, 3 + ((i * 5 + j * 4) % 7)])),
}));

const RETURN_EP = 4;

describe('js/dr-run.js — the returnee through the played path', () => {
  let dr;

  beforeEach(async () => {
    core.setPlayers(CAST.map(p => ({ ...p })));
    core.setSeasonConfig({
      ...core.defaultConfig(), format: 'drag-race', seasonNumber: 3,
      drFinale: 'top4', drSchedule: [{ episode: RETURN_EP, returnee: true }],
      twistSchedule: [],
    });
    core.setGs({ episodeHistory: [], eliminated: [], popularity: {}, phase: 'stage', _drSeed: 4711 });
    dr = await import('../js/dr-run.js');
  });

  it('does not leave a returned queen on gs.eliminated', () => {
    /* She is living and she is on the eliminated list at the same time, and by
       the finale she is on it twice if she goes out again. Big Brother clears
       this on the way back in (js/bb/battle-back.js:253, js/bb/week.js:7542);
       drag-race only ever appends. js/aftermath.js:47 unions this list into the
       eliminated set, so the aftermath meets a queen who is still competing. */
    let returned = null;
    for (let i = 0; i < RETURN_EP; i++) {
      const row = dr.simulateDragEpisode();
      if (row?.dr?.returned) returned = row.dr.returned.name;
    }
    expect(returned, 'the return never fired — the test proves nothing').toBeTruthy();
    expect(core.gs.activePlayers).toContain(returned);
    expect(core.gs.eliminated,
      `${returned} walked back on and is still on the eliminated list`)
      .not.toContain(returned);
  });
});
