// The Coup d'Etat has to be watchable, not just correct.
//
// Reported from a played week, and the transcript was genuinely unreadable:
// the Head of Household nominated Chase and Scary Girl, then a card announced
// that Priya "takes Zee off the block and puts up Chase and Scary Girl" — Zee
// was not on the block and those two already were — and THEN the veto meeting
// ran, vetoed Chase, seated Zee, and adjourned saying the final block was
// Chase and Scary Girl.
//
// The simulation was right the whole time. The ORDER was wrong: the coup
// resolves after the ceremony but its act was pushed before the ceremony's, so
// the viewer met the overruling before the thing it overruled — and the
// ceremony then reported the coup's block as its own outcome, contradicting
// its own replacement in the same breath.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { grantPower } from '../js/bb/powers.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = [];
}

/** Hand somebody the Coup and play the week it fires in. */
function playCoup() {
  for (let seed = 1; seed <= 20; seed++) {
    house();
    // Granted before the week runs, the way a distributor would have.
    grantPower('coup-d-etat', 'Millie', { week: 1, visibility: 'public', source: 'test' });
    const ep = withSeededRandom(seed * 31 + 5, () => simulateBBEpisode());
    const coup = (ep.acts || []).find(a => a.type === 'power-played' && a.powerId === 'coup-d-etat');
    if (coup) return { ep, coup };
  }
  return null;
}

describe("the Coup d'Etat", () => {
  beforeEach(house);

  it('happens after the ceremony it overrules, not before it', () => {
    const played = playCoup();
    expect(played, 'no coup fired in 20 seeds').toBeTruthy();
    const { ep } = played;
    const types = (ep.acts || []).map(a => a.type === 'power-played' ? `power:${a.powerId}` : a.type);
    const cer = types.indexOf('veto-ceremony');
    const cou = types.indexOf("power:coup-d-etat");
    expect(cer, 'no veto ceremony in the week').toBeGreaterThan(-1);
    expect(cou, 'no coup act').toBeGreaterThan(-1);
    expect(cou, 'the coup was shown before the ceremony it overrules')
      .toBeGreaterThan(cer);
  });

  it('does not make the ceremony announce the block it just lost', () => {
    const played = playCoup();
    expect(played, 'no coup fired in 20 seeds').toBeTruthy();
    const { ep, coup } = played;
    const cer = (ep.acts || []).find(a => a.type === 'veto-ceremony');
    // The ceremony reports what the ceremony did. If it used the veto, the
    // person it seated is on ITS block — even though the coup removed them
    // thirty seconds later.
    if (cer.used && cer.replacement) {
      expect(cer.nominees, 'the ceremony lost its own replacement')
        .toContain(cer.replacement);
    }
    // And the coup's removals are people who were actually on that block.
    for (const name of coup.removed || []) {
      expect(cer.nominees, `${name} was "taken off" a block they were not on`)
        .toContain(name);
    }
  });

  it('leaves the week on the block the coup named', () => {
    const played = playCoup();
    expect(played, 'no coup fired in 20 seeds').toBeTruthy();
    const { ep, coup } = played;
    expect(ep.finalNominees.slice().sort()).toEqual([...coup.nominees].sort());
    // Neither of the two people whose safety was earned can be seated.
    expect(coup.nominees).not.toContain(ep.hoh);
    expect(coup.nominees).not.toContain(ep.vetoWinner);
    // And whoever it saved is not the person the house votes on.
    for (const name of coup.removed || []) {
      expect(ep.finalNominees, `${name} was saved and is still up`).not.toContain(name);
    }
  });

  it('reads in order in the transcript', () => {
    const played = playCoup();
    expect(played, 'no coup fired in 20 seeds').toBeTruthy();
    const text = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]);
    const cer = text.indexOf('VETO CEREMONY');
    const cou = text.indexOf('IS PLAYED');
    if (cer > -1 && cou > -1) {
      expect(cou, 'the transcript overrules the ceremony before holding it')
        .toBeGreaterThan(cer);
    }
  });
});
