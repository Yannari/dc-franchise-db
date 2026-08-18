// Nobody talks to themselves, and nobody has a relationship with themselves.
//
// Found by reading a played week: "Aaron gets Aaron alone — three chairs, and
// Aaron is not waiting for a competition to decide which ones matter", followed
// by a recorded relationship change reading "Aaron & Aaron +0.3".
//
// The cause is a shape worth guarding rather than a typo. The Block Buster's
// winner comes OFF the block, which means they stop being a nominee and start
// being a VOTER — and `voters` is built by excluding the Head of Household and
// the nominees, so it contains them. The scene where that winner works the
// loosest ballots was drawing from a pool that included their own.
//
// Two fixes, and this file guards both: the caller no longer pitches to itself,
// and addBond refuses a self-bond outright so the next caller to make the same
// mistake cannot write `x||x` into the bond store.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Ryan', 'Will', 'Eva', 'Arlo'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'challenge-beast', 'perceptive-player', 'chaos-agent', 'schemer'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'twist', theme: '' });
  seasonConfig.twistSchedule = [];
  seasonConfig.themeArcStamped = '';
  setGs({ ...gs, bb: null });
}

beforeEach(house);

describe('the bond store refuses a relationship with yourself', () => {
  it('writes nothing for addBond(x, x)', () => {
    addBond('Bowie', 'Bowie', 5);
    expect(gs.bonds[bKey('Bowie', 'Bowie')], 'a self-bond reached the store').toBeUndefined();
    expect(getBond('Bowie', 'Bowie')).toBe(0);
  });

  it('still moves an ordinary pair', () => {
    addBond('Bowie', 'Chase', 2);
    expect(getBond('Bowie', 'Chase')).toBeGreaterThan(0);
  });

  it('survives a missing name instead of writing an undefined key', () => {
    addBond('Bowie', null, 3);
    addBond(undefined, 'Chase', 3);
    for (const key of Object.keys(gs.bonds || {})) {
      expect(key, 'a bond was keyed on a missing name').not.toMatch(/undefined|null/);
    }
  });
});

describe('no scene casts the same houseguest twice', () => {
  it('across played seasons, with the arena on', () => {
    const offenders = [];
    const selfBonds = new Set();
    for (const seed of [313, 414, 515, 616, 717, 818]) {
      house();
      // The Block Buster is what produces a saved nominee who then votes, and
      // that is the exact seam this guards — without it the sweep is blind to
      // the bug it exists for.
      seasonConfig.bbSafetyMode = 'triple';
      seasonConfig.bbSafetyStopsAt = 5;
      withSeededRandom(seed, () => {
        for (let i = 0; i < 30; i++) {
          if (!simulateBBEpisode()) break;
          if (gs.bb?.over) break;
        }
      });

      for (const key of Object.keys(gs.bonds || {})) {
        const [a, b] = key.split('||');
        if (a && a === b) selfBonds.add(key);
      }

      for (const w of gs.bb?.weeks || []) {
        for (const act of w.acts || []) {
          for (const beat of [...(act.beats || []), ...(act.socialBeats || [])]) {
            const cast = (beat?.players || []).filter(Boolean);
            if (cast.length !== new Set(cast).size) {
              offenders.push(`S${seed} W${w.num} [${beat.badgeText || act.type}] `
                + `${cast.join(' + ')}`);
            }
            // The prose gives it away even when the cast list does not: an
            // effects line naming one person on both sides of a bond.
            for (const eff of beat?.effects || []) {
              const m = /^(.+?) & (.+?) [+-]/.exec(String(eff?.text || ''));
              if (m && m[1] === m[2]) {
                offenders.push(`S${seed} W${w.num} effect: ${eff.text}`);
              }
            }
          }
        }
      }
    }
    expect([...selfBonds], 'a self-bond reached gs.bonds').toEqual([]);
    expect(offenders.slice(0, 8), offenders.slice(0, 8).join(' | ')).toEqual([]);
  }, 600000);
});
