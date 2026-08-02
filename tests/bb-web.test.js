// The relationship layers have to be visible in a house.
//
// The dimensions decide nominations, vetoes, votes and recruitment — and
// until this screen existed they appeared nowhere a viewer looks. Debug gets
// the numbers (The Web), House Status gets the qualitative reads, and both
// render from the week's SNAPSHOT so a replay shows that week's feelings.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { rpBuildBBDebug, rpBuildBBOverview, getTribeRelationshipHighlights } from '../js/vp-screens.js';
import { addRelationshipDimension } from '../js/relationships.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks',
  'Emmah','Millie','Caleb','Wayne','Raj'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind','hero','floater','villain','schemer','goat','hothead'][i % 7] }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal,
    getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, getTribeRelationshipHighlights });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, twistSchedule: [],
    bbSafetyMode: 'off', bbHaveNots: 'twist', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
}

describe('the relationship layers are visible in a house', () => {
  it('snapshots the dimensions with the week', () => {
    reset();
    const ep = simulateBBEpisode();
    expect(ep.closingState?.relationshipDimensions, 'the week froze no dimensions').toBeTruthy();
    expect(Object.keys(ep.closingState.relationshipDimensions).length).toBeGreaterThan(0);
    expect(ep.closingState?.relationshipCauses, 'the week froze no cause trails').toBeTruthy();
  });

  it('Debug has a Web tab with the numbers and a plain read', () => {
    reset();
    const ep = simulateBBEpisode();
    localStorage.setItem('vp_bbdebug_tab', 'web');
    const html = rpBuildBBDebug(ep);
    expect(html).toContain('THE WEB');
    for (const col of ['LIKING', 'TRUST', 'GAME RESPECT', 'FEAR', 'OWES', 'RESENTMENT', 'ATTRACTION']) {
      expect(html).toContain(col);
    }
    localStorage.removeItem('vp_bbdebug_tab');
  });

  it('House Status tells the directional stories with their cause', () => {
    reset();
    const ep = simulateBBEpisode();
    // Force a strong directional read into the LIVE store, then re-simulate so
    // the next week's snapshot carries it — the screen reads snapshots.
    const [a, b] = gs.activePlayers;
    addRelationshipDimension(a, b, 'fear', 8);
    addRelationshipDimension(a, b, 'obligation', 8);
    const ep2 = simulateBBEpisode();
    const html = rpBuildBBOverview(ep2, 'closing');
    expect(html).toContain('RELATIONSHIPS THAT MATTER');
    expect(html).toMatch(/is wary of|owes|resents|respects the game of|does not trust/);
  });

  it('a replayed week shows that week\'s feelings, not today\'s', () => {
    reset();
    const ep1 = simulateBBEpisode();
    const frozen = JSON.stringify(ep1.closingState.relationshipDimensions);
    // The house keeps living...
    simulateBBEpisode();
    // ...and the first week's snapshot has not moved with it.
    expect(JSON.stringify(ep1.closingState.relationshipDimensions)).toBe(frozen);
  });
});
