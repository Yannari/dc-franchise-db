// ══════════════════════════════════════════════════════════════════════
// bb-alliance-overlap — a new alliance is not an old one formed twice
// ══════════════════════════════════════════════════════════════════════
//
// Read 2026-10-15: The Lifeline [Nichelle, Scary, Emmah, Ripper, Chase] and, a week later, The Majority [Ripper,
// Chase, Caleb, Scary, Zee] — three of the five in both, and both went on recruiting each other's members. A
// pitch reached for the pitcher's closest people, who were the alliance they already had. Now a pitch reaches
// people the pitcher is not allied with, and no group (new or grown) may share two or more members AND half of the
// smaller group with another (js/bb/shared-strategy.js tooClose). The alliance inside an alliance is its own,
// deliberate, shape and is not counted.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Beth', 'Owen'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'perceptive-player', 'challenge-beast'];

describe('alliances in a played season', () => {
  it('never holds two alliances that are mostly the same people', () => {
    const heavy = [];
    let alliancesSeen = 0;
    for (const seed of [400, 200]) {
      seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] })), { episode: 0, eliminated: [], namedAlliances: [] });
      Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
      Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
      for (let w = 0; w < 8; w++) {
        withSeededRandom(seed * 100 + w, () => simulateBBEpisode());
        const house = gs.activePlayers || [];
        const als = (gs.namedAlliances || []).filter(a => a.active !== false && !a.dissolved)
          .map(a => ({ name: a.name, id: a.id, parent: a.parent || null, m: (a.members || []).filter(n => house.includes(n)) }))
          .filter(a => a.m.length >= 2);
        alliancesSeen += als.length;
        for (let i = 0; i < als.length; i++) for (let j = i + 1; j < als.length; j++) {
          const [x, y] = [als[i], als[j]];
          if (x.parent === y.id || y.parent === x.id) continue;
          const shared = x.m.filter(n => y.m.includes(n)).length;
          if (shared >= 2 && shared * 2 >= Math.min(x.m.length, y.m.length)) heavy.push(`seed ${seed} week ${w + 1}: ${x.name}[${x.m}] / ${y.name}[${y.m}]`);
        }
      }
    }
    expect(alliancesSeen, 'no alliances formed at all: the guard measured nothing').toBeGreaterThan(10);
    expect(heavy.slice(0, 5)).toEqual([]);
  });
});
