// A theme that cannot explain itself is a theme the viewer is lost inside.
//
// Written because a real viewer said so: "there should be screen explaining the
// theme and whats going on each week cause im just confused on whats the pit
// boss etc... please dont let the user be lost by the theme all of the themes
// not just one."
//
// Before this, a theme only ever SPOKE — four one-liner mood beats a week — and
// no surface anywhere said what the season was or who was narrating it. The
// primer is the descriptor's own explanation, aimed at the viewer instead of at
// the next engineer, and this guard holds every registered theme to having one.
import { beforeEach, describe, expect, it } from 'vitest';
import { BB_THEMES, THEME_LIST, themeTwistAnnouncement } from '../js/bb/themes.js';
import { gs, players, relationships, seasonConfig, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

describe('every registered theme explains itself', () => {
  for (const id of THEME_LIST) {
    const theme = BB_THEMES[id];

    describe(id, () => {
      const p = () => theme.primer;

      it('has a primer', () => {
        expect(p()).toBeTruthy();
      });

      it('says what the season is, who is running it, and what to watch', () => {
        for (const field of ['what', 'who', 'watch']) {
          expect(typeof p()[field], `${field} is prose`).toBe('string');
          // Long enough to be an explanation rather than a label.
          expect(p()[field].length, `${field} is too short to explain anything`)
            .toBeGreaterThan(80);
        }
      });

      it('lists the rules this season adds', () => {
        expect(Array.isArray(p().rules)).toBe(true);
        expect(p().rules.length).toBeGreaterThanOrEqual(2);
        for (const r of p().rules) expect(r.length).toBeGreaterThan(20);
      });

      it('names both registers and the turn between them', () => {
        expect(p().register.neutral.length).toBeGreaterThan(10);
        expect(p().register.hostile.length).toBeGreaterThan(10);
        expect(p().turn.headline).toBe(p().turn.headline.toUpperCase());
        expect(p().turn.headline.length).toBeGreaterThan(3);
        expect(p().turn.body.length).toBeGreaterThan(40);
      });

      it('gives the antagonist its own words for announcing a rule', () => {
        expect(p().announce.length).toBeGreaterThanOrEqual(4);
        for (const line of p().announce) {
          expect(line, 'every announce line carries the rule').toContain('{detail}');
        }
      });

      // The recurring bug class this whole engine exists to prevent: one
      // season's vocabulary printed over another's. A hotel must not announce
      // its twists in a casino's words, and vice versa.
      it('never speaks in another theme\'s voice', () => {
        const mine = JSON.stringify(p()).toLowerCase();
        const others = THEME_LIST.filter(o => o !== id)
          .map(o => BB_THEMES[o].antagonist?.name)
          .filter(Boolean);
        for (const name of others) {
          expect(mine, `${id}'s primer names ${name}`).not.toContain(name.toLowerCase());
        }
      });
    });
  }

  it('never lets the High Roller\'s antagonist say "the house"', () => {
    // The roster owns that phrase. Every other surface in this simulator uses
    // it for the houseguests, so the Pit Boss says the floor, the room, the
    // edge. Its voice pools are already held to this; the primer is a new
    // surface and needs the same rule.
    const p = BB_THEMES['high-rollers'].primer;
    expect(JSON.stringify(p).toLowerCase()).not.toMatch(/\bthe house\b/);
  });
});

// ── THE ANNOUNCEMENT VOICE ──────────────────────────────────────────────
//
// `themeTwistAnnouncement` used to pick its words with
// `theme.id === 'machine-summer' ? [CORA's lines] : [the Den's lines]`, so
// EVERY theme that was not CORA announced its twists in the Den's voice. A
// hotel said "the Den has changed the terms of this week"; so did a casino.
// The engine that exists to stop one season's vocabulary printing over
// another's was the thing doing it.
describe('a theme announces its own twists in its own words', () => {
  const TWIST = 'bb-double-eviction';
  const announcement = {
    twist: TWIST,
    name: 'Double Eviction',
    rule: 'Two houseguests leave tonight.',
    sting: 'Nobody is told which two.',
  };

  /** A themed season, mid-run, with this twist booked BY THE THEME this week. */
  const seasonOn = (id) => {
    seasonConfig.format = 'big-brother';
    seasonConfig.theme = id;
    seasonConfig.twistSchedule = [{ episode: 4, type: TWIST, source: 'theme' }];
    setGs({ bb: { weeks: [], seasonSalt: 11, theme: { id, mood: 'neutral', booked: [], said: [] } } });
    gs.activePlayers = ['Bowie', 'Chase', 'Ripper'];
  };

  beforeEach(() => { seasonConfig.twistSchedule = []; });

  for (const id of THEME_LIST) {
    it(`${id} speaks for itself`, () => {
      seasonOn(id);
      const said = themeTwistAnnouncement(announcement, { week: 4 });
      expect(said, `${id} announced nothing`).toBeTruthy();
      expect(said.speaker).toBe(BB_THEMES[id].antagonist.name);

      // The line is one of THIS theme's, with the rule interpolated into it.
      const mine = BB_THEMES[id].primer.announce
        .map(l => l.replace('{detail}', `${announcement.name}: ${announcement.rule} ${announcement.sting}`));
      expect(mine).toContain(said.line);
      expect(said.line).toContain('Two houseguests leave tonight.');

      // And it is nobody else's.
      for (const other of THEME_LIST.filter(o => o !== id)) {
        const name = BB_THEMES[other].antagonist?.name;
        if (name) expect(said.line, `${id} spoke as ${name}`).not.toContain(name);
      }
    });
  }

  it('says nothing at all rather than borrowing another theme\'s words', () => {
    // The old failure mode was a fallback. A theme with no pool must go quiet.
    BB_THEMES.mute = { ...BB_THEMES['high-rollers'], id: 'mute', primer: { announce: [] } };
    try {
      seasonOn('mute');
      expect(themeTwistAnnouncement(announcement, { week: 4 })).toBeNull();
    } finally {
      delete BB_THEMES.mute;
    }
  });
});

// ── THE TWO ACTS, IN A REAL SEASON ──────────────────────────────────────
describe('the season introduces itself and announces its own turn', () => {
  const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
    'Hicks', 'Emmah', 'Millie', 'Caleb'];
  const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
    'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
  const CAST = NAMES.map((name, i) => ({
    name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
  }));

  const house = (theme) => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
      ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
      bbHaveNots: 'off', bbSafetyMode: 'off', theme });
    seasonConfig.twistSchedule = [];
  };

  const actsOfType = (type) => gs.bb.weeks.flatMap(w => (w.acts || []).filter(a => a.type === type));

  it('draws the card once, on night one', () => {
    withSeededRandom(5, () => {
      house('high-rollers');
      simulateBBEpisode();
      simulateBBEpisode();
      const cards = actsOfType('theme-primer');
      expect(cards).toHaveLength(1);
      expect(cards[0].week).toBe(1);
      expect(cards[0].speaker).toBe('The Pit Boss');
      expect(cards[0].primer.what.length).toBeGreaterThan(80);
    });
  });

  it('draws no card at all on an unthemed season', () => {
    withSeededRandom(5, () => {
      house('none');
      simulateBBEpisode();
      expect(actsOfType('theme-primer')).toHaveLength(0);
      expect(actsOfType('theme-turn')).toHaveLength(0);
    });
  });

  // The turn is a CHANGE of register, not a week that happens to be hostile.
  // High Roller's books `hostile` at TWO anchors on purpose — a proportional
  // one and a house-size backstop — so an implementation that announced on
  // every matching act would announce the same turn twice.
  // ── THE STANDING BAND ────────────────────────────────────────────────
  it('says on every House Life screen who is running the season', () => {
    withSeededRandom(5, () => {
      house('high-rollers');
      simulateBBEpisode();
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      const html = (buildVPScreens(ep) || []).map(s => s.html).join('');
      expect(html).toContain('THIS SEASON');
      expect(html).toContain('The Pit Boss');
      // Week one is hospitable, so the band must be showing the NEUTRAL line.
      expect(html).toContain('Hospitality');
      expect(html).not.toContain('Accounting');
    });
  });

  it('draws no band at all on an unthemed season', () => {
    withSeededRandom(5, () => {
      house('none');
      simulateBBEpisode();
      const ep = gs.episodeHistory[gs.episodeHistory.length - 1];
      const html = (buildVPScreens(ep) || []).map(s => s.html).join('');
      expect(html).not.toContain('THIS SEASON');
    });
  });

  // The trap this whole engine already fell into once: the reader dressed every
  // episode in the theme's CURRENT mood, so replaying week 2 of a season that
  // later turned showed the escalated room and the turn appeared to have
  // happened before it did. The band reads the WEEK, so a replay of week one
  // stays hospitable no matter how the season ended up.
  it('dresses a replayed week in the register that week actually had', () => {
    withSeededRandom(5, () => {
      house('high-rollers');
      for (let i = 0; i < 9 && (gs.activePlayers || []).length > 4; i++) simulateBBEpisode();
      expect(gs.bb.weeks.some(w => w.themeMood === 'hostile'), 'the season never turned').toBe(true);

      const first = gs.episodeHistory[0];
      const html = (buildVPScreens(first) || []).map(s => s.html).join('');
      expect(html).toContain('Hospitality');
      expect(html).not.toContain('Accounting');
    });
  });

  it('announces the turn exactly once, though the arc books it twice', () => {
    withSeededRandom(5, () => {
      house('high-rollers');
      for (let i = 0; i < 9 && (gs.activePlayers || []).length > 4; i++) simulateBBEpisode();
      const turns = actsOfType('theme-turn');
      expect(turns).toHaveLength(1);
      expect(turns[0].from).toBe('neutral');
      expect(turns[0].to).toBe('hostile');
      expect(turns[0].headline).toBe('THE COMPS HAVE STOPPED');
      expect(turns[0].registers.from).toContain('Hospitality');
      expect(turns[0].registers.to).toContain('Accounting');
    });
  });
});
