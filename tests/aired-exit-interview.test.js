// Kristal-talKs exit interviews on the queue-aired shows: recorded as each
// row airs (js/exit-interview/aired.js), kept across a re-run's rebuild, and
// the abandoned timeline's dropped.
// Spec: docs/superpowers/specs/2026-10-21-kristal-exit-interviews-design.md
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers, seasonConfig, players } from '../js/core.js';
import { simulatePerfectMatchEpisode, rerunPerfectMatchEpisode } from '../js/pm-run.js';
import { simulateChallengeEpisode } from '../js/ch-run.js';
import { simulateCircleEpisode } from '../js/ci-run.js';
import { setFranchiseLedger } from '../js/franchise-meta.js';
import { publishedExits } from '../js/exit-interview/house.js';
import { makeIslanders } from './helpers/pm-cast.js';
import { challengeCast } from './helpers/ch-cast.js';
import { makePlayers } from './helpers/ci-cast.js';

const SHOWS = {
  'perfect-match': {
    fresh() {
      Object.assign(seasonConfig, { format: 'perfect-match', seasonNumber: 3, pmSetup: {}, twistSchedule: [], pmRoleCounts: {} });
      setPlayers(makeIslanders(22, 5));
      setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], pm: { seed: 3004 } });
    },
    air: simulatePerfectMatchEpisode,
  },
  'the-challenge': {
    fresh() {
      Object.assign(seasonConfig, { format: 'the-challenge', seasonNumber: 1, chSetup: {}, chFinalists: 6,
        chGenderBlind: false, twistSchedule: [], name: null });
      setPlayers(challengeCast(16, 3).cast);
      setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ch: { seed: 909 }, seasonNumber: 1 });
      setFranchiseLedger({ v: 2, active: 'main', franchises: { main: { name: 'Main', seasons: {} } } });
    },
    air: simulateChallengeEpisode,
  },
  'the-circle': {
    fresh() {
      Object.assign(seasonConfig, { format: 'the-circle', seasonNumber: 3, name: '', ciSetup: {}, ciPool: [], twistSchedule: [],
        ciDays: null, ciFinalists: 5, ciNewcomerRule: 'rate-not-rated', ciPickBy: 'stats', ciAI: false, franchiseMeta: false });
      setPlayers(makePlayers(13, 4));
      setGs({ initialized: true, episodeHistory: [], popularity: {}, activePlayers: [], ci: { seed: 404 }, seasonNumber: 3 });
    },
    air: simulateCircleEpisode,
  },
};

function playAll(air) {
  const left = new Map();     // name -> the episode they left on
  // Nobody has left who never arrived: start from the first night's own room.
  let room = [];
  for (let i = 0; i < 60; i++) {
    const row = air();
    if (!row) break;
    const start = room.length ? room : (row.ch?.house || []);
    for (const n of start) if (!gs.activePlayers.includes(n) && !left.has(n)) left.set(n, row.num);
    room = [...gs.activePlayers];
  }
  return left;
}

describe('every queue-aired show records its boots as they air', () => {
  for (const [show, { fresh, air }] of Object.entries(SHOWS)) {
    it(show, () => {
      fresh();
      const left = playAll(air);
      expect(gs.phase).toBe('complete');
      // Nobody records who never set foot in the room.
      const everIn = new Set(gs.episodeHistory.flatMap(r => [...(r.pm?.villa || []), ...(r.ch?.people || []), ...(r.ch?.house || []), ...(r.ci?.people || [])]));
      for (const r of (gs.exitInterviews || []).filter(x => x.show === show)) expect(everIn.has(r.guest), r.guest).toBe(true);
      const recs = (gs.exitInterviews || []).filter(r => r.show === show);
      expect(left.size).toBeGreaterThan(2);
      for (const [name, ep] of left) {
        const r = recs.find(x => x.guest === name && x.kind !== 'finalist');
        expect(r, `${name} left in ${ep}`).toBeTruthy();
        expect(r.week).toBe(ep);
      }
      const finalists = recs.filter(r => r.kind === 'finalist');
      expect(finalists.length).toBe(gs.activePlayers.length);
      expect(finalists.some(r => r.placement === 1)).toBe(true);
      const keys = recs.map(r => `${r.guest}|${r.week}|${r.kind}`);
      expect(new Set(keys).size).toBe(keys.length);
      for (const r of recs) if (r.prediction) expect(r.stillIn).toContain(r.prediction);
      expect(publishedExits(show).length).toBe(recs.length);
    });
  }
});

describe('a re-run', () => {
  it('keeps what aired before the re-run night and drops what the abandoned timeline recorded', () => {
    SHOWS['perfect-match'].fresh();
    const air = SHOWS['perfect-match'].air;
    for (let i = 0; i < 8; i++) air();
    const before = (gs.exitInterviews || []).map(r => `${r.guest}|${r.week}`);
    const early = before.filter(k => Number(k.split('|')[1]) < 5);
    expect(rerunPerfectMatchEpisode(5)).toBeTruthy();
    air();
    const after = (gs.exitInterviews || []).map(r => `${r.guest}|${r.week}`);
    for (const k of early) expect(after).toContain(k);
    expect(after.filter(k => Number(k.split('|')[1]) > 5)).toEqual([]);
  });
});
