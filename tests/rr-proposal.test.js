// A couple can propose on the mat (the user, 2026-10-19: "couples on the race... maybe a proposal at the finish line").
// Only a couple who are not married or engaged yet, only when they're close, and only after a win: rarely after a leg
// win, more often at the finish. A yes makes them engaged; a 'not yet' costs them.
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

function coupleSeason(seed) {
  const { cast, teams } = raceCast(8, seed);
  for (const t of teams) { t.rel = 'dating'; t.identity = null; t.name = `${t.a} & ${t.b}`; }
  setPlayers(cast);
  // close: carried bonds, the way a season starts from the franchise's history
  const res = playRaceSeason({ teams, seed, carried: { sums: teams.map(t => ({ a: t.a, b: t.b, delta: 6 })) } });
  return { res, eps: airSeason(res) };
}

describe('rr proposal', () => {
  it('a close couple who win can propose on the mat; it airs, in their words, and a yes makes them engaged', () => {
    let found = 0;
    for (let seed = 1; seed <= 12 && found < 2; seed++) {
      const { res, eps } = coupleSeason(seed);
      for (const sc of res.state.scenes.filter(s => s.kind === 'proposal')) {
        found++;
        const t = res.state.teams[sc.data.team];
        expect(['dating', 'newly-dating', 'on-off', 'once-engaged']).toContain(t.rel);
        const seg = eps.flatMap(e => e.segments).find(s => s.scene === sc.id);
        expect(seg, 'the proposal aired').toBeTruthy();
        expect(seg.lines.length).toBeGreaterThanOrEqual(4);
        // the leg it happened on, not their history: the premiere, written after the season, still meets a dating couple
        if (sc.data.ending === 'yes') expect(t.engagedAt).toBe(sc.leg);
        else expect(t.engagedAt).toBeFalsy();
        expect(t.history?.engaged).not.toBe(true);
        // after a win: the leg's first team, or the finale's winners
        const leg = res.legs.find(l => l.n === sc.leg);
        expect(leg.order[0]).toBe(sc.data.team);
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it('never between partners who are family, married or already engaged', () => {
    for (const rel of ['married', 'siblings', 'bffs']) {
      const { cast, teams } = raceCast(8, 2);
      for (const t of teams) t.rel = rel;
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed: 2, carried: { sums: teams.map(t => ({ a: t.a, b: t.b, delta: 6 })) } });
      expect(res.state.scenes.filter(s => s.kind === 'proposal').length, rel).toBe(0);
    }
  });
});

describe('an engagement on the race reaches the franchise', () => {
  it("the race's record lists a couple team with its stage: engaged after a yes on the mat", async () => {
    const { rrLedgerRecord } = await import('../js/rr/ledger-record.js');
    let checked = 0;
    for (let seed = 1; seed <= 12 && !checked; seed++) {
      const { res } = coupleSeason(seed);
      const yes = res.state.scenes.find(s => s.kind === 'proposal' && s.data.ending === 'yes');
      if (!yes) continue;
      const t = res.state.teams[yes.data.team];
      const rec = rrLedgerRecord(res.state, res);
      const sh = rec.players[t.a].showmances.find(x => x.partner === t.b);
      expect(sh).toMatchObject({ ended: 'intact', stage: 'engaged' });
      // a couple who are just dating are recorded as dating
      const other = Object.values(res.state.teams).find(x => x.id !== t.id && !x.engagedAt);
      expect(rec.players[other.a].showmances.find(x => x.partner === other.b)).toMatchObject({ stage: 'dating' });
      checked++;
    }
    expect(checked).toBe(1);
  });

  it('the next show meets them engaged', async () => {
    const { setFranchiseLedger } = await import('../js/franchise-meta.js');
    const { carriedFor } = await import('../js/franchise-carry.js');
    const { seasonConfig, setSeasonConfig } = await import('../js/core.js');
    setSeasonConfig({ ...seasonConfig, testSeason: false });
    setFranchiseLedger({ v: 2, active: 'td', franchises: { td: { name: 'Total Drama', seasons: {
      'rr-1': { format: 'ridonculous-race', source: 'live', seasonName: 'The Ridonculous Race 1', players: {
        Ann: { placement: 1, winner: true, showmances: [{ partner: 'Bo', ended: 'intact', stage: 'engaged' }] },
        Bo: { placement: 1, winner: true, showmances: [{ partner: 'Ann', ended: 'intact', stage: 'engaged' }] },
      } },
    } } } });
    // a race season reads the whole franchise's history (shows.js historyFromLedger), once its engine is loaded
    await import('../js/rr-run.js');
    const out = carriedFor([{ name: 'Ann' }, { name: 'Bo' }], { format: 'ridonculous-race' }, { lifeLog: [], lifeSeasons: [] });
    expect(out.kin.find(k => [k.a, k.b].sort().join() === 'Ann,Bo')).toMatchObject({ kin: 'engaged', from: 'ledger' });
  });
});
