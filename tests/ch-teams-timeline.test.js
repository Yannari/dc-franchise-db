// The Challenge's merge is a Teams season's break-up, and the Season Timeline marks it (the user, 2026-10-18: "we
// should have the merge badge in the season timeline"): before the season, on the morning the house is down to the
// finalists and four more; never in a team-final season, which plays as teams to the end.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs, players, setPlayers, seasonConfig, relationships, TWIST_CATALOG, seasonFormat, selectedEpisodes } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { renderTimeline } from '../js/run-ui.js';
import { challengeCast } from './helpers/ch-cast.js';

function season(extra = {}) {
  setPlayers(challengeCast(20, 4).cast);
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ch: { seed: 717 }, seasonNumber: 1 });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey,
    bondLabel, romanticCompat, TWIST_CATALOG, seasonFormat, selectedEpisodes });
  Object.assign(seasonConfig, { format: 'the-challenge', seasonNumber: 1, chSetup: {}, chFinalists: 6, chGenderBlind: false, twistSchedule: [],
    name: null, chMode: 'teams', chTeaming: 'draft', chTeamCount: '2', chTeamEnd: 'breakup', ...extra });
}
const html = () => { renderTimeline(); return document.getElementById('fd-timeline').innerHTML; };

beforeEach(() => { document.body.innerHTML = '<div id="fd-timeline"></div>'; });
afterAll(() => { seasonConfig.twistSchedule = []; delete seasonConfig.format; delete seasonConfig.chMode; });

describe('a Teams season on the Season Timeline', () => {
  it('marks the break-up once, in the show\'s words, with the merge\'s marker', () => {
    season();
    const h = html();
    // 20 players, 6 finalists: the teams break on the morning ten are left
    expect(h.match(/TEAMS BREAK UP · \d+ left/g) || []).toHaveLength(1);
    expect(h).toMatch(/fd-ep-marker merge[^>]*>TEAMS BREAK UP/);
    expect(h).not.toContain('MERGE ·');
  });

  it('marks nothing in a team final or a solo season', () => {
    season({ chTeamEnd: 'team-final' });
    expect(html()).not.toContain('TEAMS BREAK UP');
    season({ chMode: 'solo' });
    expect(html()).not.toContain('TEAMS BREAK UP');
  });
});
