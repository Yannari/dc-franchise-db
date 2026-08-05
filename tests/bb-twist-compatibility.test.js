// Declared incompatibility has to mean something at simulate time.
//
// Every twist card declares what it cannot run beside — `incompatible` for
// another card, `incompatibleModes` for a season-long setting like the Block
// Buster — and until now those declarations were enforced ONLY by the Format
// Designer's own UI. twistModeClashes had exactly three call sites: rendering
// the catalog, adding a card, and the quick-setup validator. All three run
// while you are authoring.
//
// Nothing re-checked when the schedule changed underneath them:
//
//   - schedule a twist, THEN switch a clashing mode on, and it still runs
//   - a preset, a save, or the randomizer can put an illegal pair on one week
//   - Big Brother's bbTwistsForWeek filtered by format membership and nothing
//     else, so two mutually-incompatible BB twists both ran
//
// The Total Drama path already dropped a card-vs-card clash at simulate time
// (episode.js) but ignored modes entirely. These are the checks that make the
// declaration authoritative wherever the schedule came from.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG, twistsClash } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, bbTwistsForWeek } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twists = [], cfg = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', ...cfg });
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
}

describe('a schedule the designer would have refused', () => {
  beforeEach(() => house());

  it('drops a twist that clashes with a card already on the week', () => {
    // Both reshape the block with a third chair, and each names the other in
    // its catalog entry. Put on the same week by a preset or a save, they used
    // to both run and seat two extra nominees.
    house(['bb-roadkill', 'bb-den-of-temptation']);
    const live = bbTwistsForWeek(1);
    expect(live, 'both block-reshaping twists survived the same week').toHaveLength(1);
    // The first one scheduled keeps the week — an arbitrary but stable rule,
    // and the same one the Total Drama path already used.
    expect(live[0]).toBe('bb-roadkill');
  });

  it('is order-stable rather than alphabetical', () => {
    house(['bb-den-of-temptation', 'bb-roadkill']);
    expect(bbTwistsForWeek(1)).toEqual(['bb-den-of-temptation']);
  });

  it('drops a twist that clashes with a season MODE switched on later', () => {
    // THE REPORTED SHAPE. The Den is scheduled while the Block Buster is off —
    // perfectly legal, the catalog allows it — and then the mode is switched
    // on. Nothing re-validated the schedule, so a twist the designer would now
    // refuse to add went on running.
    house(['bb-den-of-temptation']);
    expect(bbTwistsForWeek(1), 'the legal case broke').toEqual(['bb-den-of-temptation']);

    seasonConfig.bbSafetyMode = 'block-buster';
    expect(bbTwistsForWeek(1), 'the Den survived the Block Buster being switched on')
      .toEqual([]);

    // ...and switching it back off restores it, because nothing was destroyed.
    seasonConfig.bbSafetyMode = 'off';
    expect(bbTwistsForWeek(1)).toEqual(['bb-den-of-temptation']);
  });

  it('leaves a compatible pair alone', () => {
    // The check must not be a blunt instrument: these two share no clash.
    house(['bb-app-store', 'bb-double-eviction']);
    expect(bbTwistsForWeek(1).sort()).toEqual(['bb-app-store', 'bb-double-eviction']);
  });

  it('still honours the standing Have-Nots setting', () => {
    house([], { bbHaveNots: 'every-week' });
    expect(bbTwistsForWeek(1)).toContain('bb-have-nots');
  });

  it('does not drop a have-nots that the every-week mode added', () => {
    // bb-have-nots declares incompatibleModes: ['block-buster'] on its card,
    // and the standing mode adds it after the filter — so a season running
    // both settings must not end up with the engine and the card disagreeing.
    house([], { bbHaveNots: 'every-week', bbSafetyMode: 'block-buster' });
    const live = bbTwistsForWeek(1);
    // Whatever the answer is, it must be internally consistent: the standing
    // setting is a season-long choice the user made explicitly, so it wins.
    expect(live).toContain('bb-have-nots');
  });
});

describe('the week that actually plays', () => {
  it('never runs two block-reshaping twists in one played week', () => {
    house(['bb-roadkill', 'bb-den-of-temptation']);
    const ep = withSeededRandom(31, () => simulateBBEpisode());
    const seated = (ep.acts || []).filter(a =>
      a.type === 'roadkill' || a.type === 'temptation-curse').length;
    expect(seated, 'two twists both seated a third chair').toBeLessThan(2);
  });
});

describe('the declarations themselves', () => {
  it('are read symmetrically even where they are written one way', () => {
    // Twenty-seven pairs in this catalog are declared in one direction only —
    // the newer card names the older ones and the older ones were never edited
    // back. That is harmless for the Format Designer's add-check, which looks
    // both ways, and fatal for anything that walks a schedule in order.
    //
    // The resolver is symmetric rather than the data, so this asserts the
    // BEHAVIOUR. Requiring the data to be mutual would mean twenty-seven hand
    // edits that rot again the next time somebody adds a card.
    const oneWay = [];
    for (const t of TWIST_CATALOG) {
      for (const other of t.incompatible || []) {
        // Five cards list their own id, a by-product of the "every other
        // challenge" arrays being written by hand. Harmless, and mildly useful
        // — it stops the designer putting the same card on a week twice — so
        // it is not an asymmetry to fix.
        if (other === t.id) continue;
        if (!TWIST_CATALOG.some(c => c.id === other)) {
          oneWay.push(`${t.id} names ${other}, which is not in the catalog`);
          continue;
        }
        // Both directions must answer the same, whichever way it was written.
        if (!twistsClash(t.id, other) || !twistsClash(other, t.id)) {
          oneWay.push(`${t.id} vs ${other} resolves asymmetrically`);
        }
      }
    }
    // A name that is not a card is a declaration that can never fire. This
    // caught tied-destinies refusing 'pre-merge', which is a phase and not a
    // card, so the rule had been doing nothing since it was written.
    expect(oneWay).toEqual([]);
  });

  it('drops the same pair whichever order the schedule lists them in', () => {
    // The order-dependence a one-way declaration used to cause, checked on a
    // real one: Split House names the Battle of the Block, and not vice versa.
    house(['bb-split-house', 'bb-battle-of-the-block']);
    expect(bbTwistsForWeek(1)).toEqual(['bb-split-house']);
    house(['bb-battle-of-the-block', 'bb-split-house']);
    expect(bbTwistsForWeek(1)).toEqual(['bb-battle-of-the-block']);
  });
});
