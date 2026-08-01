// The visibility rule, enforced.
//
// From the design spec: a result is never presented without its cause being
// visible somewhere. These cover the three systems that ran every week and
// appeared on no screen — who is hunting whom, what people wrongly believe,
// and the arithmetic behind a competition — plus the record that only ever
// showed up as a row of small icons.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { rpBuildBBOverview, rpBuildBBDebug, getTribeRelationshipHighlights } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks',
  'Emmah','Millie','Caleb','Wayne','Raj'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind','hero','floater','villain','schemer','goat','hothead'][i % 7] }));

function playWeeks(n, over = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal,
    getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, getTribeRelationshipHighlights });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, twistSchedule: [],
    bbSafetyMode: 'off', bbHaveNots: 'every-week', bbDepartures: 'off', romance: 'enabled',
    setting: 'bb-house', ...over });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
  let g = 0;
  while (!houseIsAtFinale() && g++ < n) { if (!simulateBBEpisode()) break; }
  return gs.episodeHistory[gs.episodeHistory.length - 1];
}

describe('House Status shows what drives the house', () => {
  it('says who is coming for whom', () => {
    const html = rpBuildBBOverview(playWeeks(5));
    expect(html).toContain('WHO IS COMING FOR WHOM');
    // setBBTarget runs constantly; if none of it reaches the screen the
    // section is there and empty, which is the bug this guards.
    expect((html.match(/class="bbh-row"/g) || []).length,
      'targets are set every week and none were drawn').toBeGreaterThan(0);
  });

  it('says what people believe, where it is wrong', () => {
    const html = rpBuildBBOverview(playWeeks(5));
    expect(html).toContain('WHAT PEOPLE BELIEVE');
    const rows = (html.match(/class="bbm-row"/g) || []).length;
    if (rows) {
      // Both numbers, so the gap is checkable rather than asserted.
      expect(html).toContain('believes');
      expect(html).toContain('truth');
    }
  });
});

describe('the debug screen accounts for the week', () => {
  const ep = playWeeks(4);
  // The debug screen is tabbed now, the same way Total Drama's is, so a test
  // has to open the tab it is asking about rather than expecting one page to
  // carry everything.
  const onTab = tab => {
    localStorage.setItem('vp_bbdebug_tab', tab);
    try { return rpBuildBBDebug(ep); } finally { localStorage.removeItem('vp_bbdebug_tab'); }
  };

  it('shows every lever behind a competition score', () => {
    const html = onTab('comps');
    // A surprising winner has to be explainable: aptitude, luck, and each
    // modifier the engine actually applied.
    expect(html).toMatch(/aptitude [\d.]+/);
    expect(html).toMatch(/luck -?[\d.]+/);
    // Slop only shows when a have-not actually played the competition. Whether
    // one did depends on the draw, so asserting it unconditionally made this a
    // test about who got picked rather than about the debug screen.
    const playedOnSlop = (ep.acts || []).some(a => a.competition
      && Object.values(a.competition.debug?.scoreBreakdown || {}).some(b => b.haveNot));
    if (playedOnSlop) {
      expect(html, 'a have-not played and the penalty never showed').toMatch(/slop -[\d.]+/);
    }
  });

  it('shows the vote ballot by ballot with its reason', () => {
    const html = onTab('votes');
    expect(html).toContain('the vote');
    expect(html).toMatch(/commitment [\d.]+/);
  });

  it('shows the competition record, not just icons', () => {
    const html = onTab('stats');
    expect(html).toContain('competition record');
    // Block Buster wins sit between the veto and the nominations now: winning
    // your own way off the block is a competition win the house watched.
    expect(html).toMatch(/HOH \d+  ·  veto \d+  ·  block buster \d+  ·  nominated \d+/);
  });

  it('reports whether the shared upkeep ran', () => {
    const html = onTab('week');
    expect(html).toContain('upkeep');
    // Eight shared systems run each week; silence about them is how the
    // romance pipeline stayed broken.
    expect(html).toMatch(/all eight ran|FAILED/);
  });
});
