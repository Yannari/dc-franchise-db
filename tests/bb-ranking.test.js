import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { buildSeasonOverviewModel } from '../js/run-ui.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';
import * as ratings from '../js/ratings.js';
const R=JSON.parse(readFileSync(resolve(process.cwd(),'franchise_roster.json'),'utf8'));
const POOL=(Array.isArray(R)?R:R.players||Object.values(R)[0]).filter(p=>p?.stats&&p.name);
const CAST=Array.from({length:14},(_,i)=>POOL[(i*11+3)%POOL.length]).map(p=>({name:p.name,
  archetype:p.archetype||'floater',gender:p.gender||'m',sexuality:p.sexuality||'straight',stats:{...p.stats}}));
describe('the season pulse on Big Brother', () => {
  // The ranking read three competition counters and nothing else on this show:
  // gs.bb.stats also records timesNominated, timesSaved and timesOnTheBlock,
  // and gs.bb.powers records who holds what. Surviving four blocks counted for
  // precisely nothing, which on Big Brother is frequently the whole story of a
  // winner.
  let model;
  beforeAll(() => {
    Object.assign(globalThis, ratings);
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
      ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
      popularityEnabled: true });
    seasonConfig.twistSchedule = [];
    gs.riPlayers = gs.riPlayers || []; gs.tribes = gs.tribes || [];
    withSeededRandom(4242, () => {
      for (let w = 0; w < 9 && gs.phase !== 'complete'; w++) simulateBBEpisode();
    });
    model = buildSeasonOverviewModel(gs, players);
  }, 900000);

  it('knows it is Big Brother and scores the house in sections', () => {
    expect(model.isBB).toBe(true);
    expect(model.powerRanking.length).toBeGreaterThan(2);
    for (const p of model.powerRanking) {
      const keys = (p.sections || []).map(s => s.key);
      for (const need of ['comp', 'block', 'power', 'vote', 'social']) {
        expect(keys, `${p.name} has no ${need} section`).toContain(need);
      }
    }
  });

  it('counts the block, not just the competitions', () => {
    // The dimension that was missing entirely. Somebody in a nine-week house
    // has been nominated.
    const blocks = model.powerRanking.map(p => p.sections.find(s => s.key === 'block'));
    expect(blocks.some(b => b.points > 0), 'nobody scored for surviving the block').toBe(true);
  });

  it('does not print a block line that contradicts itself', () => {
    // '2 nominated, 0 survived the vote, 1 pulled down' shipped, because
    // timesOnTheBlock already excludes anybody the veto removed and the saves
    // were being subtracted from it a second time.
    for (const p of model.powerRanking) {
      const d = p.sections.find(s => s.key === 'block').detail;
      const m = d.match(/^(\d+) nominated · (\d+) survived the vote(?: · (\d+) pulled down)?/);
      if (!m) { expect(d).toBe('never nominated'); continue; }
      const [, noms, survived, pulled] = m.map(Number);
      expect(Number(survived) + Number(pulled || 0),
        `${p.name}: "${d}" does not add up`).toBeLessThanOrEqual(Number(noms));
    }
  });

  it('scores the pulse as exactly the sum of its sections', () => {
    // The number and its breakdown cannot be allowed to disagree, which they
    // would the first time one was edited without the other.
    for (const p of model.powerRanking) {
      const sum = p.sections.reduce((s, x) => s + x.points, 0) + p.momentum * 0.08;
      expect(p.pulse, `${p.name}: pulse does not match its own sections`)
        .toBeCloseTo(Math.round(sum * 10) / 10, 1);
    }
  });
});
