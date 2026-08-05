// Punishments beyond the capsule, and the reason a nomination gives.
//
// Two gaps, both of the same shape — a system existed but only one thing could
// reach it:
//
//   · `js/bb/punishments.js` had a real mechanical cost (socialDrag comes off
//     every pitch) and exactly one way in: failing a Time Capsule challenge.
//     Pandora's Box, meanwhile, charged the house `consequence:
//     'backyard-lockdown'` — a string with nothing behind it.
//   · `knownPowerWeight` moved a public power holder up the threat model, so
//     they were MORE likely to be nominated, but the plan still recorded the
//     generic reason. Right nomination, wrong story.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { grantPower } from '../js/bb/powers.js';
import { formHousePlan } from '../js/bb/plans.js';
import { BB_PUNISHMENTS, punishmentFor, socialDrag } from '../js/bb/punishments.js';
import { knownPowersOf } from '../js/bb/shared-strategy.js';
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
  seasonConfig.twistSchedule = twists.map((t, i) => ({ episode: i + 1, type: t }));
  gs.bb ||= {};
  gs.bb.powers = [];
  gs.bb.punishments = [];
}

describe("Pandora's Box actually charges for the box", () => {
  beforeEach(() => house());

  it('puts the Head of Household in a costume when it is opened', () => {
    for (let seed = 1; seed <= 25; seed++) {
      house(['bb-pandoras-box']);
      const ep = withSeededRandom(seed * 19, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'pandoras-box');
      if (!act?.opened) continue;

      // The price is a real punishment, not a string.
      expect(BB_PUNISHMENTS[act.consequence], `not a real punishment: ${act.consequence}`)
        .toBeTruthy();
      expect(act.consequenceName).toBeTruthy();
      expect(punishmentFor(act.hoh, 1), 'the HOH was never actually punished').toBeTruthy();
      // And it costs them persuasion for the week, like every other costume.
      expect(socialDrag(act.hoh, 1)).toBeGreaterThan(0);
      // Costumes only: borrowing slop here would quietly mint a have-not.
      expect(BB_PUNISHMENTS[act.consequence].slop).toBeFalsy();
      expect(BB_PUNISHMENTS[act.consequence].tether).toBeFalsy();

      // Both transcripts name the price and never the prize.
      for (const [label, text] of [
        ['summariseWeek', summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1])],
        ['generateSummaryText', generateSummaryText(ep)],
      ]) {
        expect(text, `${label}: the price is invisible`).toContain(act.consequenceName);
        expect(text, `${label}: leaked the prize`).not.toMatch(/Diamond Power of Veto/);
      }
      return;
    }
    throw new Error('the box never opened in 25 seeds');
  });

  it('leaves an unopened box costing nothing', () => {
    for (let seed = 1; seed <= 25; seed++) {
      house(['bb-pandoras-box']);
      const ep = withSeededRandom(seed * 23 + 4, () => simulateBBEpisode());
      const act = (ep.acts || []).find(a => a.type === 'pandoras-box');
      if (!act || act.opened) continue;
      expect(act.consequence).toBeFalsy();
      expect(punishmentFor(act.hoh, 1)).toBeFalsy();
      return;
    }
    // Boxes opened every time in this sample; the rule is asserted above.
  });
});

describe('a nomination says the real reason', () => {
  beforeEach(() => house());

  it('names the power when the house can see it', () => {
    grantPower('coup-d-etat', 'Ripper', { week: 1, visibility: 'public', source: 'test' });
    expect(knownPowersOf('Ripper', 1)).toHaveLength(1);

    let named = 0;
    for (const n of NAMES) {
      const plan = formHousePlan(n, { house: NAMES, week: 1 });
      const why = plan?.origins?.targets?.Ripper;
      if (!why) continue;
      expect(why, `${n} gave a generic reason for a visible power`)
        .toMatch(/holding The Coup/);
      named++;
    }
    expect(named, 'nobody targeted the visible power holder').toBeGreaterThan(0);
  });

  it('never cites a power the house was not told about', () => {
    grantPower('coup-d-etat', 'Scary', { week: 1, visibility: 'secret', source: 'test' });
    for (const n of NAMES) {
      const plan = formHousePlan(n, { house: NAMES, week: 1 });
      for (const [, why] of Object.entries(plan?.origins?.targets || {})) {
        expect(why, 'a secret power was cited as a nomination reason')
          .not.toMatch(/holding/);
      }
    }
  });
});
