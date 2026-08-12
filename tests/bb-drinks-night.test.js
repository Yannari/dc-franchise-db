// The house gets alcohol once a week, and a startling share of the real show
// happens on that night: the row that had been coming for eight days arrives,
// somebody says the thing they had decided not to say.
//
// Written as a MULTIPLIER rather than a card. One more "they had a nice
// evening" beat adds texture and changes nothing; what drink actually does is
// let the events already in the catalogue fire that were sitting under the
// threshold all week.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { nightModifier, isDrinksNight } from '../js/bb-events/drinks-night.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { withSeededRandom } from './helpers/rng.js';
import { readFileSync } from 'node:fs';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee',
  'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
  'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead',
  'wildcard', 'chaos-agent', 'perceptive-player'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

let beats = [], weeks = 0, nights = 0;

beforeAll(() => {
  for (const seed of [3, 11, 23, 41]) {
    setGs(null);
    setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(),
      gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
      stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3 + seed) % 10)])) })));
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats,
      pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
      bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
    seasonConfig.twistSchedule = [];
    initGameState();
    globalThis.gs = gs;
    withSeededRandom(seed, () => { for (let i = 0; i < 8; i++) simulateBBEpisode(); });
    for (const w of gs.bb.weeks) {
      weeks++;
      let had = false;
      for (const act of (w.acts || [])) {
        for (const b of (act.socialBeats || [])) {
          beats.push(b);
          if (b.eventId === 'drinks-night') had = true;
        }
      }
      if (had) nights++;
    }
  }
}, 900000);

const idsOf = prefix => beats.filter(b => String(b.eventId || '').startsWith(prefix));

describe('the night happens, and reaches the transcript', () => {
  it('is an occasion rather than the weather', () => {
    // Measured at every eligible week this hit 78% — six a season, and the
    // opening scene is the same scene each time, so it stopped reading as a
    // night and started reading as furniture. Two or three a season is where
    // the beats it unlocks still feel caused by the drink.
    const perSeason = nights / 4;
    expect(perSeason, 'too rare to be a rhythm at all').toBeGreaterThan(1.5);
    expect(perSeason, 'so often it stops being an occasion').toBeLessThan(4);
  });

  it('drinks on the same nights when a season is replayed', () => {
    // Chosen from the week number, not a roll, so a seeded replay matches.
    const src = readFileSync('js/bb-events/drinks-night.js', 'utf8');
    expect(src).toMatch(/% 3 !== 2/);
  });

  it('happens at most once a week', () => {
    // The flag lives on the week so two acts cannot each declare it drinks night.
    for (const seedWeeks of [gs.bb.weeks]) {
      for (const w of seedWeeks) {
        const opens = (w.acts || []).flatMap(a => a.socialBeats || [])
          .filter(b => b.eventId === 'drinks-night');
        expect(opens.length, `week ${w.num} opened the bar twice`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('carries every beat it wrote', () => {
    for (const id of ['drinks-night', 'drinks-confession', 'drinks-grievance', 'drinks-stayed-sharp']) {
      expect(idsOf(id).length, `${id} never fired in 32 weeks`).toBeGreaterThan(0);
    }
  });

  it('keeps the blow-up rare across the SEASON, not rare within the night', () => {
    // The measure that matters is how often a house has a public row at all,
    // not what share of drinking nights produce one — on a night the house
    // drinks, the grievance surfacing IS the point. Once nights became an
    // occasion this asserted the wrong thing: it demanded fewer blow-ups than
    // nights, which would mean some drinks nights are just a quiet evening.
    expect(idsOf('drinks-grievance').length / weeks,
      'a screaming row most weeks is the weather, not a grievance').toBeLessThan(0.5);
  });

  it('changes something every time, per the house rule', () => {
    for (const b of idsOf('drinks-')) {
      expect(b.players?.length, `${b.eventId} named nobody`).toBeGreaterThan(0);
      expect(b.badgeText, `${b.eventId} has no badge`).toBeTruthy();
    }
  });
});

describe('the multiplier, not the card, is the point', () => {
  it('raises the odds of a fight and lowers the odds of careful work', () => {
    expect(nightModifier('social', 'social-blow-up')).toBeGreaterThan(1.5);
    expect(nightModifier('deals', 'deals-competing')).toBeLessThan(1);
    expect(nightModifier('social', 'social-paranoia'))
      .toBeLessThan(nightModifier('social', 'social-blow-up'));
  });

  it('leaves an ordinary night alone', () => {
    expect(isDrinksNight({ act: 'nominations', week: {} })).toBe(false);
    expect(isDrinksNight({ act: 'eviction', week: {} })).toBe(false);
    expect(isDrinksNight(null)).toBe(false);
  });

  it('is applied by the scheduler, not merely exported', () => {
    // The whole design fails silently if nothing multiplies by it.
    const src = readFileSync('js/bb/house-events.js', 'utf8');
    expect(src).toMatch(/_nightFactor\(beatCtx, event\)/);
    expect(src).toMatch(/import \{ isDrinksNight, nightModifier \}/);
  });

  it('does not modify its own beats', () => {
    const src = readFileSync('js/bb/house-events.js', 'utf8');
    expect(src).toMatch(/startsWith\('drinks-'\)/);
  });
});

describe('a seeded season still replays', () => {
  it('rolls the seeded rng rather than Math.random', () => {
    // A bare roll here makes a replayed season diverge from the one it replays.
    const src = readFileSync('js/bb-events/drinks-night.js', 'utf8');
    const fires = src.slice(src.indexOf('const drinksNight'));
    expect(fires).not.toMatch(/Math\.random\(\) </);
  });

  it('is registered, or none of it is reachable', () => {
    expect(HOUSE_EVENTS.some(e => e.id === 'drinks-night')).toBe(true);
  });
});
