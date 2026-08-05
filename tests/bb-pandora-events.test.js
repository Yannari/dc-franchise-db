// The box has an aftermath now, and the aftermath is not allowed to know what
// was in the box.
//
// Pandora's Box grants its prize SECRET: the house is told a story about a
// dollar and pays for a locked backyard, and the only place the truth exists is
// gs.bb.powers and the Debug panel. An event family reacting to the box is the
// easiest possible way to leak that by accident — one line of narration
// guessing "he's got a veto in there" and the twist is over.
//
// So these tests do not check that the events are good. They check that they
// are ignorant.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { BB_POWER_DEFINITIONS } from '../js/bb/powers.js';
import { PANDORA_EVENTS } from '../js/bb-events/pandora.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
}

const pandoraBeats = ep => (ep.acts || []).flatMap(a => a.socialBeats || [])
  .filter(b => String(b.eventId || '').startsWith('pandora-'));

describe('the Pandora family', () => {
  beforeEach(() => house(['bb-pandoras-box']));

  it('is registered where the scheduler can reach it', () => {
    expect(PANDORA_EVENTS.length).toBeGreaterThanOrEqual(6);
    const ids = new Set(HOUSE_EVENTS.map(e => e.id));
    for (const e of PANDORA_EVENTS) {
      expect(ids.has(e.id), `${e.id} is written but not in HOUSE_EVENTS`).toBe(true);
      expect(typeof e.weight, `${e.id} has no weight`).toBe('function');
      expect(typeof e.fire, `${e.id} has no fire`).toBe('function');
    }
  });

  it('reacts to a box week at all', () => {
    let seen = 0;
    for (let seed = 1; seed <= 12 && !seen; seed++) {
      house(['bb-pandoras-box']);
      const ep = withSeededRandom(seed * 71 + 3, () => simulateBBEpisode());
      if (!ep.acts?.some(a => a.type === 'pandoras-box')) continue;
      seen = pandoraBeats(ep).length;
    }
    expect(seen, 'a box week produced no reaction from the house').toBeGreaterThan(0);
  });

  it('never names what was in the box', () => {
    // Every power the box could have handed over, by name and by the words
    // people would use for one.
    const powerNames = Object.values(BB_POWER_DEFINITIONS).map(d => d.name);
    const forbidden = [...powerNames, 'Diamond', 'diamond', 'Coup', 'Bonus Life', 'the Cloud',
      'power of veto', 'a power'];
    let checked = 0;
    for (let seed = 1; seed <= 25; seed++) {
      house(['bb-pandoras-box']);
      const ep = withSeededRandom(seed * 71 + 3, () => simulateBBEpisode());
      const beats = pandoraBeats(ep);
      if (!beats.length) continue;
      checked += beats.length;
      for (const b of beats) {
        for (const word of forbidden) {
          expect(b.text, `${b.eventId} named "${word}" — the house does not know that`)
            .not.toContain(word);
        }
      }
    }
    expect(checked, 'no beats were ever checked').toBeGreaterThan(0);
  });

  it('stays silent when the Head of Household is invisible', () => {
    // A sealed week has no public owner for the box, and every one of these
    // events talks ABOUT that owner — so naming one would out the Invisible
    // HOH through the side door.
    let sealedWeeks = 0;
    for (let seed = 1; seed <= 25; seed++) {
      house(['bb-pandoras-box', 'bb-invisible-hoh']);
      const ep = withSeededRandom(seed * 37 + 5, () => simulateBBEpisode());
      if (!ep.hohSecret) continue;
      sealedWeeks++;
      expect(pandoraBeats(ep), 'the box family fired on a sealed week').toEqual([]);
    }
    expect(sealedWeeks, 'no sealed box week was ever produced to check').toBeGreaterThan(0);
  });
});
