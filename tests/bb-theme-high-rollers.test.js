// The money, in a real week.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { balance } from '../js/bb/bb-bucks.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';
import { themeById, advanceThemeArc } from '../js/bb/themes.js';
import { setGs } from '../js/core.js';
// Read from the repo root rather than off `import.meta.url`: the suite runs in
// jsdom, where the module URL is not a file: URL and `fileURLToPath` throws.
// This is the same door `tests/bb-themes.test.js` opens the markup through.
import { readFileSync } from 'node:fs';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house({ theme = 'high-rollers' } = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme });
  seasonConfig.twistSchedule = [];
}

describe('the floor pays every week', () => {
  it('pays the house on a High Roller\'s season', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) >= 50)).toBe(true);
    });
  });

  it('pays nobody on a season running another theme', () => {
    withSeededRandom(7, () => {
      house({ theme: 'summer-of-mystery' });
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) === 0)).toBe(true);
    });
  });

  it('pays nobody on an unthemed season', () => {
    withSeededRandom(7, () => {
      house({ theme: 'none' });
      simulateBBEpisode();
      expect(NAMES.every(n => balance(n) === 0)).toBe(true);
    });
  });

  it('emits the act into the week', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const week = gs.bb.weeks[0];
      expect(week.acts.some(a => a.type === 'bb-bucks')).toBe(true);
    });
  });

  it('snapshots the ledger onto the week, so a replay shows that week\'s money', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const one = gs.bb.weeks[0].bucksLedger;
      simulateBBEpisode();
      const two = gs.bb.weeks[1].bucksLedger;
      expect(one.find(l => l.name === 'Bowie').balance)
        .toBeLessThan(two.find(l => l.name === 'Bowie').balance);
    });
  });

  it('carries the snapshot onto the episode', () => {
    withSeededRandom(7, () => {
      house();
      simulateBBEpisode();
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      expect(Array.isArray(ep.bucksLedger)).toBe(true);
      expect(ep.bucksLedger.length).toBe(NAMES.length);
    });
  });
});

// ── the descriptor itself ────────────────────────────────────────────────
//
// Everything above runs a season and asserts what the money did. This block
// asserts the thing that MAKES it a season: the descriptor, its registration,
// and the one field the payout is gated on. Registering the id without
// `economy: 'bb-bucks'` fires nothing and throws nothing — the cases above go
// red and this one names why.
describe('the descriptor', () => {
  const theme = () => themeById('high-rollers');

  it('is registered', () => {
    expect(theme()).toBeTruthy();
    expect(theme().name).toBe("High Roller's");
  });

  it('declares the economy the engine gates on', () => {
    expect(theme().economy).toBe('bb-bucks');
  });

  it('binds to the resort', () => {
    expect(theme().house).toBe('bb-resort');
  });

  it('has a Pit Boss with both registers at every hook', () => {
    const voice = theme().antagonist.voice;
    for (const hook of ['open', 'noms', 'veto', 'vote', 'finale', 'crown']) {
      expect(voice[hook].neutral.length, `${hook}/neutral`).toBeGreaterThanOrEqual(4);
      expect(voice[hook].hostile.length, `${hook}/hostile`).toBeGreaterThanOrEqual(4);
    }
  });

  // The roster owns the phrase. Every other surface in this simulator says
  // "the house" to mean the twelve people playing, so an antagonist who says
  // it makes `summariseWeek` ambiguous in its own transcript. The Pit Boss
  // says the floor, the room, the edge.
  it('never says "the house" for the room — that is the roster\'s word', () => {
    const voice = theme().antagonist.voice;
    const all = Object.values(voice).flatMap(h => [...(h.neutral || []), ...(h.hostile || [])]);
    expect(all.some(line => /\bthe house\b/i.test(line))).toBe(false);
  });

  // The mood turn is NOT a schedule entry. `themeScheduleEntries` skips any act
  // without a `book` — moods change no week's card, they change the register the
  // week is narrated in — so `advanceThemeArc` is the engine that walks them and
  // the only honest place to assert the turn happens. Asking the scheduler would
  // pass or fail for reasons that have nothing to do with this theme.
  it('turns cold before the endgame at every cast size', () => {
    for (const weeks of [9, 12, 15, 17]) {
      seasonConfig.format = 'big-brother';
      seasonConfig.theme = 'high-rollers';
      setGs({ bb: { weeks: [],
        theme: { id: 'high-rollers', mood: 'neutral', booked: [], said: [] } } });
      let turned = 0;
      for (let w = 1; w <= weeks; w++) {
        if (advanceThemeArc(w, weeks) === 'hostile') { turned = w; break; }
      }
      expect(turned, `weeks=${weeks}: the floor never went cold`).toBeGreaterThan(0);
      expect(turned, `weeks=${weeks}: turned on the last week`).toBeLessThan(weeks);
    }
  });

  it('books no twists yet — the room is Plan 2', () => {
    expect(theme().books).toEqual([]);
    expect(theme().arc.some(a => a.book)).toBe(false);
  });

  it('is offered in the config select, which is hand-written markup', () => {
    const html = readFileSync('simulator.html', 'utf8');
    const select = html.match(/<select id="cfg-theme"[\s\S]*?<\/select>/)[0];
    expect(select).toContain('value="high-rollers"');
  });
});
