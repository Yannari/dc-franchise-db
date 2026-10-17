// ch-pairs-run.test.js — a Pairs season is REACHABLE from the run tab: the setup's options reach the engine, the cast
// problems are said, a season plays one episode per press to the share-or-keep, and the rows carry the pairs.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers, players, seasonConfig } from '../js/core.js';
import { simulateChallengeEpisode, challengeCastProblem, challengeSeasonShape, challengeOptions, partnerPins,
  challengeVoteShape } from '../js/ch-run.js';
import { setFranchiseLedger } from '../js/franchise-meta.js';
import { challengeCast } from './helpers/ch-cast.js';

function freshPairs(n = 16, extra = {}, castSeed = 3) {
  Object.assign(seasonConfig, { format: 'the-challenge', seasonNumber: 1, chSetup: {}, chFinalists: 6, chGenderBlind: false,
    twistSchedule: [], name: null, chMode: 'pairs', chPairing: 'rivals', chPairShape: 'mixed', chFinalPairs: 3, ...extra });
  setPlayers(challengeCast(n, castSeed).cast);
  setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ch: { seed: 909 }, seasonNumber: 1 });
  setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
}
const playAll = () => { const out = []; for (let i = 0; i < 40; i++) { const r = simulateChallengeEpisode(); if (!r) break; out.push(r); } return out; };

describe('a Pairs season from the run tab', () => {
  it('the setup reaches the engine as options.pairs, and the cast cards set partners only both ways', () => {
    freshPairs();
    const [a, b, c] = players;
    a.chPartner = b.name; b.chPartner = a.name; c.chPartner = a.name;
    expect(partnerPins()).toEqual({ [a.name]: b.name, [b.name]: a.name });
    expect(challengeOptions()).toMatchObject({ pairs: { pairing: 'rivals', shape: 'mixed', finalPairs: 3 } });
    delete a.chPartner; delete b.chPartner; delete c.chPartner;
    Object.assign(seasonConfig, { chMode: 'solo' });
    expect(challengeOptions().pairs).toBe(null);
  });

  it('says why a cast cannot play pairs', () => {
    freshPairs(16);
    setPlayers(players.slice(0, 15));
    expect(challengeCastProblem()).toMatch(/even number/);
    freshPairs(8);
    expect(challengeCastProblem()).toMatch(/more pairs than the final/);
    freshPairs(16, { chPairing: 'fresh-meat' });
    expect(challengeCastProblem()).toMatch(/Fresh Meat/);
  });

  it('plays to the final one press at a time, in pairs, and ends on the money', () => {
    freshPairs(16);
    expect(challengeCastProblem()).toBe(null);
    const shape = challengeSeasonShape();
    // eight pairs, three into the final: five eliminations
    expect(shape.filter(e => !e.final).reduce((t, e) => t + e.plannedElims, 0)).toBe(5);
    const rows = playAll();
    expect(rows.length).toBeGreaterThan(2);
    const final = rows.at(-1).ch.final;
    expect(final.champions.length).toBe(2);
    expect(final.choices.length).toBeGreaterThan(0);
    expect(final.pairPodium.all.length).toBeGreaterThan(0);
    expect(challengeVoteShape(rows.at(-1))).toMatch(/^Champions: /);
    for (const r of rows.slice(0, -1)) {
      expect(r.ch.pairs.start.length).toBeGreaterThan(0);
      for (const d of r.ch.duels) { expect(d.pairs).toBe(true); expect(d.winners.length).toBe(2); expect(d.losers.length).toBe(2); }
      for (const v of r.ch.votes) for (const b of v.ballots) expect(b.pair).toContain(b.target);
      if (r.ch.arena.length) expect(challengeVoteShape(r)).toMatch(/ & .* beat .* & /);
    }
    expect(gs.phase).toBe('complete');
  });
});
