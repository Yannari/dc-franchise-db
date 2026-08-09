// The Randomize button offered Island, Action and World Tour to a house.
//
// `showRandomizerPanel` rendered the Total Drama panel on any season — series
// checkboxes for shows a Big Brother house has never heard of — and the button
// underneath ran `randomizeChallenges`, which schedules TWIST_CATALOG challenge
// twists. A Big Brother week has no slot for one. So pressing it was an offer
// to fill in something that does not exist, while the two pickers that DO exist
// on every week sat on Auto.
//
// The house gets its own panel, filling the Head of Household and the veto,
// under the same mix rule the engine uses at run time — so the plan and the
// play agree rather than being two ideas of what kind of season this is.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, relationships, seasonConfig, selectedEpisodes, seasonFormat,
  TWIST_CATALOG } from '../js/core.js';
import { ordinal, pronouns, pStats, romanticCompat } from '../js/players.js';
import { bKey, bondLabel, getBond, getPerceivedBond } from '../js/bonds.js';
import { randomizeBBComps, showRandomizerPanel, _clearBBComps } from '../js/run-ui.js';
import { bbCompetitionsForSlot } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

function season(format = 'big-brother') {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG,
    seasonFormat, selectedEpisodes, bbCompetitionsForSlot });
  Object.assign(seasonConfig, { format, finaleSize: 3, jurySize: 7, mergeAt: 12,
    teams: 2, bbHaveNots: 'off', bbSafetyMode: 'off', ri: false });
  seasonConfig.twistSchedule = [];
  seasonConfig.bbCompSchedule = [];
  document.body.innerHTML = '<div id="fd-timeline"></div>';
}

beforeEach(() => season());
afterAll(() => {
  seasonConfig.bbCompSchedule = [];
  seasonConfig.twistSchedule = [];
  delete seasonConfig.format;
});

const panelText = () => document.getElementById('randomizer-panel')?.textContent || '';

describe('the panel knows which show it is on', () => {
  it('does not offer Total Drama series to a house', () => {
    showRandomizerPanel();
    const text = panelText();
    expect(text, 'the panel was never rendered').toContain('Randomize');
    for (const series of ['Island', 'Action', 'World Tour', 'Revenge']) {
      expect(text, `a house was offered ${series}`).not.toContain(series);
    }
  });

  it('offers the mix instead, which is what a house can actually choose', () => {
    showRandomizerPanel();
    expect(document.getElementById('bb-rand-mix'), 'no mix control').toBeTruthy();
    expect(panelText()).toMatch(/Head of Household/);
  });

  it('still gives Total Drama its series', () => {
    season('total-drama');
    showRandomizerPanel();
    const text = panelText();
    expect(text).toContain('Island');
    expect(document.getElementById('bb-rand-mix'), 'a camp got the house panel').toBeFalsy();
  });
});

describe('filling the weeks', () => {
  it('pins a competition on both slots of every week', () => {
    const filled = randomizeBBComps({ mix: 'balanced' });
    expect(filled, 'nothing was filled').toBeGreaterThan(0);
    const schedule = seasonConfig.bbCompSchedule;
    expect(schedule.length).toBeGreaterThan(3);
    for (const entry of schedule) {
      expect(entry.hoh, `week ${entry.episode} has no Head of Household`).toBeTruthy();
      expect(entry.veto, `week ${entry.episode} has no veto`).toBeTruthy();
    }
  });

  it('only pins competitions that can actually serve the slot', () => {
    randomizeBBComps({ mix: 'balanced' });
    const hohIds = new Set((bbCompetitionsForSlot('hoh') || []).map(c => c.id));
    const vetoIds = new Set((bbCompetitionsForSlot('veto') || []).map(c => c.id));
    for (const entry of seasonConfig.bbCompSchedule) {
      expect(hohIds.has(entry.hoh), `${entry.hoh} cannot run as an HOH`).toBe(true);
      expect(vetoIds.has(entry.veto), `${entry.veto} cannot run as a veto`).toBe(true);
    }
  });

  it('spends the library before repeating itself', () => {
    // A season that runs the same competition three times while four others
    // never air is the fault the engine's freshness rule exists to stop, and a
    // plan drawn here has to obey it too or the button undoes it.
    randomizeBBComps({ mix: 'balanced' });
    const picked = seasonConfig.bbCompSchedule.flatMap(e => [e.hoh, e.veto]);
    const distinct = new Set(picked).size;
    expect(distinct / picked.length, 'the plan repeats itself heavily')
      .toBeGreaterThan(0.7);
  });

  it('leans when asked to', () => {
    const spendOf = mix => {
      seasonConfig.bbCompSchedule = [];
      randomizeBBComps({ mix });
      const byId = new Map();
      for (const slot of ['hoh', 'veto']) {
        for (const c of bbCompetitionsForSlot(slot) || []) byId.set(c.id, c);
      }
      const spent = {};
      for (const entry of seasonConfig.bbCompSchedule) {
        for (const id of [entry.hoh, entry.veto]) {
          for (const [stat, w] of Object.entries(byId.get(id)?.stats || {})) {
            spent[stat] = (spent[stat] || 0) + w;
          }
        }
      }
      return spent;
    };
    const mental = spendOf('mental');
    const physical = spendOf('physical');
    expect(mental.mental || 0, 'a mental season asked for no more mental than a physical one')
      .toBeGreaterThan(physical.mental || 0);
  });

  it('puts every week back on Auto when asked', () => {
    randomizeBBComps({ mix: 'balanced' });
    expect(seasonConfig.bbCompSchedule.length).toBeGreaterThan(0);
    _clearBBComps();
    expect(seasonConfig.bbCompSchedule).toEqual([]);
  });
});
