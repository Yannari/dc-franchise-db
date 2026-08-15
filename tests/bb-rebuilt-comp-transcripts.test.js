// The rebuilt competitions reach BOTH transcripts, in full.
//
// A competition's beats only exist for the screens if something renders them,
// and Big Brother has two writers that do it independently: `summariseWeek` in
// bb-run.js and `generateBBSummaryText` in text-backlog.js. Both walk
// `act.competition.beats` generically, which is exactly why this is worth
// pinning rather than assuming — a generic walker keeps working right up until
// a competition emits its story somewhere other than `beats`, and then that
// week reads as one line in the text while the screen shows forty cards.
//
// These three were rebuilt from single scored rolls into competitions that
// narrate thirty-odd beats each. That is a tenfold change in what the
// transcript has to carry, and neither writer was touched to do it.
import { afterAll, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn', 'Ennui', 'Sky'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
    'villain', 'loyal-soldier', 'floater'][i % 8],
}));

const REBUILT = [
  { id: 'bb-endurance-soak', name: 'Cold Comfort' },
  { id: 'bb-endurance-wall', name: 'Hold the Line' },
  { id: 'bb-mental-puzzle', name: 'Cut and Cover' },
  { id: 'bb-luck-draw', name: 'Pure Chance' },
];

function house(compId) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = [];
  // Pin the competition into the week's Head of Household slot.
  seasonConfig.bbCompSchedule = [{ episode: 1, hoh: compId }];
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.namedAlliances = []; gs.jury = [];
  gs.episode = 0;
}

afterAll(() => {
  seasonConfig.twistSchedule = [];
  seasonConfig.bbCompSchedule = [];
  delete seasonConfig.format;
});

describe('the rebuilt competitions reach both transcripts', () => {
  for (const comp of REBUILT) {
    it(`${comp.name} is written out in full by both writers`, () => {
      const ep = withSeededRandom(4242 + comp.id.length, () => { house(comp.id); return simulateBBEpisode(); });
      const act = (ep.acts || []).find(a => a.type === 'hoh');
      expect(act?.competition?.id, `${comp.name} did not run in the HOH slot`).toBe(comp.id);

      const emitted = (act.competition.beats || []).map(b => b.text).filter(Boolean);
      // The whole point of the rebuild: these narrate a night, not a result.
      const floor = comp.id === 'bb-luck-draw' ? 8 : 12;
      expect(emitted.length, `${comp.name} emitted only ${emitted.length} beats`).toBeGreaterThan(floor);

      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      const both = [
        ['summariseWeek', summariseWeek(week)],
        ['generateBBSummaryText', generateBBSummaryText(ep)],
      ];

      for (const [label, text] of both) {
        expect(typeof text, `${label} returned no text`).toBe('string');
        expect(text, `${label} never names ${comp.name}`).toContain(comp.name);
        // Every single beat, not a summary of them and not the first few.
        const missing = emitted.filter(t => !text.includes(t));
        expect(missing.length,
          `${label} dropped ${missing.length}/${emitted.length} of ${comp.name}'s beats — first: ${missing[0]}`)
          .toBe(0);
      }
    });
  }

  it('the rules of each competition are stated where its beats are', () => {
    // The narration says what happened, never what the rules were. A reader
    // handed forty beats about forced pieces and hauled ground with no
    // statement of the mechanic cannot follow any of it.
    for (const comp of REBUILT) {
      const ep = withSeededRandom(99 + comp.id.length, () => { house(comp.id); return simulateBBEpisode(); });
      const act = (ep.acts || []).find(a => a.type === 'hoh');
      const desc = act?.competition?.desc || '';
      expect(desc.length, `${comp.name} has no rules to state`).toBeGreaterThan(120);
      const week = gs.bb.weeks[gs.bb.weeks.length - 1];
      expect(summariseWeek(week), `summariseWeek omits ${comp.name}'s rules`).toContain(desc);
    }
  });
});
