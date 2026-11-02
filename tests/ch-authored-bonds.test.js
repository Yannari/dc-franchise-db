// Who knew whom before a Challenge season. The user, 2026-11-02: two sisters set as Unbreakable on the
// Relationships tab walked in Neutral (the season plays in its own gs, which started every bond at zero), and
// "relationship from other shows it all appear as neutral in intel" (the franchise scaled each past season by its
// place among ALL seasons, so Perfect Match 1, sorted after Total Drama 15 to 2, carried 0.5^16 of a grudge).
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers, seasonConfig, setRelationships } from '../js/core.js';
import { simulateChallengeEpisode } from '../js/ch-run.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { setFranchiseLedger, buildFranchiseMeta, seasonKey } from '../js/franchise-meta.js';
import { challengeCast } from './helpers/ch-cast.js';

const pk = (a, b) => [a, b].sort().join('||');
const startBond = (row, a, b) => row.ch?.intel?.start?.bonds?.[pk(a, b)] ?? row.intel?.start?.bonds?.[pk(a, b)] ?? 0;

describe('the Relationships tab reaches The Challenge', () => {
  it('a pair the author set Unbreakable starts the season close', () => {
    const { cast, names, background } = challengeCast(16, 4);
    setPlayers(cast);
    const [a, b] = names;
    const plain = playChallengeSeason({ cast: names, background, seed: 7 });
    const set = playChallengeSeason({ cast: names, background, seed: 7, authored: { [pk(a, b)]: 10 } });
    expect(Math.abs(plain.state.episodes[0].intel.start.bonds[pk(a, b)] || 0)).toBeLessThan(3);
    expect(set.state.episodes[0].intel.start.bonds[pk(a, b)]).toBeGreaterThanOrEqual(8);
  });

  it('from the run tab: the row the viewer reads has them close', () => {
    Object.assign(seasonConfig, { format: 'the-challenge', seasonNumber: 1, chSetup: {}, chFinalists: 6,
      chGenderBlind: false, twistSchedule: [], name: null });
    const { cast, names } = challengeCast(16, 3);
    setPlayers(cast);
    setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ch: { seed: 909 }, seasonNumber: 1 });
    setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
    const [a, b] = [names[2], names[5]];
    setRelationships([{ id: 'r1', a, b, type: 'unbreakable', bond: 10, kin: 'siblings', leanA: 0, leanB: 0, note: '' }]);
    try {
      const row = simulateChallengeEpisode();
      expect(row).toBeTruthy();
      expect(gs.episodeHistory[0]).toBe(row);
      expect(startBond(row, a, b)).toBeGreaterThanOrEqual(8);
    } finally { setRelationships([]); }
  });
});

describe('a past season on another show carries in full', () => {
  it("a pair's only shared season counts at full weight, wherever it sorts among the franchise's seasons", () => {
    const rec = players => ({ players });
    const p = (o = {}) => ({ placement: 5, winner: false, allies: [], rivals: [], showmances: [], betrayed: [], ...o });
    const seasons = {};
    for (let n = 1; n <= 15; n++) seasons[n] = rec({ [`Td${n}`]: p() });
    seasons[seasonKey('perfect-match', 1)] = rec({ Zed: p({ showmances: [{ partner: 'Ana', ended: 'breakup' }] }), Ana: p({ showmances: [{ partner: 'Zed', ended: 'breakup' }] }) });
    // two who shared two seasons: the latest counts in full, the one before at half
    seasons[14].players.Kim = p({ rivals: ['Lee'] }); seasons[14].players.Lee = p({ rivals: ['Kim'] });
    seasons[15].players.Kim = p({ allies: ['Lee'] }); seasons[15].players.Lee = p({ allies: ['Kim'] });
    setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons } } });
    const meta = buildFranchiseMeta(['Zed', 'Ana', 'Kim', 'Lee'].map(name => ({ name })), { format: 'the-challenge' });
    const pair = (a, b, kind) => meta.seededPairs.find(sp => pk(sp.a, sp.b) === pk(a, b) && sp.kind === kind)?.bondDelta;
    expect(pair('Zed', 'Ana', 'showmance-broken')).toBeLessThanOrEqual(-3);
    expect(pair('Kim', 'Lee', 'allies')).toBeGreaterThanOrEqual(3);
    expect(pair('Kim', 'Lee', 'rivals')).toBeCloseTo(-1.5 - 0.75, 5);
  });
});
