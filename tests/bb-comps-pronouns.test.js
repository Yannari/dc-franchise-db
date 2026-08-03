// Singular they, conjugated correctly.
//
// `pronouns()` hands back they/them for any non-binary houseguest and carries
// no notion of verb agreement, so every competition line has to be written for
// it by hand. One competition forgot and printed "they knows it before the
// count even finishes" at a real houseguest; a sweep then found the same defect
// in thirty more lines across six files, including competitions written months
// apart. It is not a typo class, it is a missing tool — `vb()` in
// bb-comps/_shared.js is the tool, and this test is what keeps it used.
//
// Runs an all-non-binary house so EVERY line renders in its they/them form.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { runBBCompetition } from '../js/bb/comps.js';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const CAST = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map((name, i) =>
  ({ name, archetype: 'floater', gender: 'nb', sexuality: 'straight', stats: spread(i + 1) }));
const HOUSE = CAST.map(p => p.name);
const seededRng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

// Third-person singular verbs that must never follow a singular "they".
const SINGULAR_AFTER_THEY = new RegExp(
  '\bthey (is|has|was|does|goes|gets|makes|takes|knows|thinks|wants|keeps|comes|holds'
  + '|lets|loses|stands|lands|pours|discovers|needs|runs|walks|looks|says|laughs'
  + '|reaches|finishes|rushes|stares|spends|realises)\b', 'i');

describe('competition narration and singular they', () => {
  beforeEach(() => {
    seedGame(CAST, { episode: 0, eliminated: ['K', 'L'], namedAlliances: [] });
    gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
    gs.popularity = {};
    seasonConfig.romance = 'off';
    HOUSE.forEach(n => {
      gs.bb.stats[n] = { hohWins: 0, vetoWins: 0, blockBusterWins: 0,
        timesNominated: 0, timesSaved: 0, timesOnTheBlock: 0 };
    });
  });

  it('never conjugates a singular they as singular', () => {
    const bad = new Set();
    for (const comp of BB_COMPETITIONS) {
      const type = comp.types.includes('hoh') ? 'hoh' : comp.types[0];
      for (let seed = 0; seed < 25; seed++) {
        const result = runBBCompetition({
          type, participants: HOUSE.slice(0, 8), house: HOUSE.slice(0, 10),
          library: BB_COMPETITIONS, forcedId: comp.id, rng: seededRng(seed * 37 + 5),
          week: { num: 5, houseAtStart: HOUSE }, nominees: ['G', 'H'],
        });
        for (const b of [...(result.beats || []), ...(result.events || [])]) {
          const m = SINGULAR_AFTER_THEY.exec(b.text || '');
          if (m) bad.add(`${comp.id}: "${m[0]}" — ${b.text.slice(0, 110)}`);
        }
        const m = SINGULAR_AFTER_THEY.exec(result.text || '');
        if (m) bad.add(`${comp.id} (summary): "${m[0]}"`);
      }
    }
    expect([...bad]).toEqual([]);
  });
});
