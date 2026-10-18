// ch-pairs-run.test.js — a Pairs season is REACHABLE from the run tab: the setup's options reach the engine, the cast
// problems are said, a season plays one episode per press to the share-or-keep, and the rows carry the pairs.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers, players, seasonConfig } from '../js/core.js';
import { simulateChallengeEpisode, challengeCastProblem, challengeSeasonShape, challengeOptions, partnerPins,
  challengeVoteShape } from '../js/ch-run.js';
import { setFranchiseLedger } from '../js/franchise-meta.js';
import { chStepScreens } from '../js/vp-ch-ep/steps.js';
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

  it('a custom season plays the pairs made in the Casting Room, and says who still needs a partner', () => {
    freshPairs(16, { chPairing: 'custom' });
    const m = players.filter(p => p.gender === 'm'), f = players.filter(p => p.gender === 'f');
    m.forEach((p, i) => { p.chPartner = f[i].name; f[i].chPartner = p.name; });
    expect(challengeCastProblem()).toBe(null);
    const want = new Set(m.map((p, i) => [p.name, f[i].name].sort().join('|')));
    const rows = playAll();
    const first = rows[0].ch.pairs?.start?.length ? rows[0].ch.pairs.start : rows[0].ch.pairs.end;
    expect(first.length).toBeGreaterThan(0);
    for (const [a, b] of first) expect(want.has([a, b].sort().join('|')), `${a} & ${b}`).toBe(true);
    // TJ says the pairs were set, and a pair's first moment airs
    for (const k of ['pairs-revealed', 'pair-reveal']) expect(rows[0].ch.aired.find(x => x.kind === k)?.lines?.length, k).toBeGreaterThan(0);
    // a player with no partner, and a pair outside the season's shape, are said before it starts
    freshPairs(16, { chPairing: 'custom' });
    players.forEach(p => { p.chPartner = ''; });   // the helper's cast objects are shared between calls
    const m2 = players.filter(p => p.gender === 'm'), f2 = players.filter(p => p.gender === 'f');
    m2.slice(1).forEach((p, i) => { p.chPartner = f2[i + 1].name; f2[i + 1].chPartner = p.name; });
    expect(challengeCastProblem()).toMatch(/still need a partner/);
    m2[0].chPartner = m2[1].name; f2[0].chPartner = f2[1].name;
    m2[1].chPartner = m2[0].name; f2[1].chPartner = f2[0].name;
    expect(challengeCastProblem()).toMatch(/a man and a woman/);
    players.forEach(p => { p.chPartner = ''; });
  });

  it('the vote\'s board shows both of a pair, the pair voted in tonight included', () => {
    // the board read the pairs as the episode ENDED, and the pair voted in had gone home by then: one face (2026-10-18)
    freshPairs(16);
    const rows = playAll().filter(r => !r.ch.final && (r.ch.votes || []).length);
    let checked = 0;
    for (const row of rows) {
      let pairs = null;
      for (const s of chStepScreens(row)) for (const st of s.steps) {
        if (st.scene?.pairs) pairs = st.scene.pairs;
        if (!st.vote) continue;
        expect(pairs?.[st.vote[1]], `episode ${row.num}: ${st.vote[1]} has no partner on the board`).toBeTruthy();
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
});
