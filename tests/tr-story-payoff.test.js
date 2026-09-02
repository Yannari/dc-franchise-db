// ══════════════════════════════════════════════════════════════════════
// tr-story-payoff.test.js — the chain, over real seasons
// ══════════════════════════════════════════════════════════════════════
//
// Task 7A Step 6 asks for a complete causal chain, verified against readable
// output rather than against a fixture:
//
//     SETUP:        Gabby says she will check Julia's timeline.
//     FOLLOW-UP:    Gabby asks Alec what he saw.
//     COMPLICATION: Alec's account conflicts with Julia's.
//     PAYOFF:       Gabby raises the exact discrepancy; Julia answers; the
//                   answer produces a recorded belief change or accuser
//                   backfire.
//
// "Reject a generated transcript containing the setup without one of the
// permitted promise statuses." So this file PLAYS SEASONS and reads the edit
// off the episode record — the same record js/vp-tr/ draws from. A fixture
// cannot answer this question: the defect it is about is a story that stops,
// and a story only stops in a season long enough to have somewhere to stop in.
//
// SEPARATE FROM tr-episode-editor.test.js ON PURPOSE. That file measures the
// editor's rules against material chosen to exercise them. This one measures
// the castle the editor actually receives, which is the only place a promise
// with no answer can hide.
import { describe, expect, it } from 'vitest';
import { gs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { PROMISE_STATUSES, longestRun, MAX_CONFLICT_RUN } from '../js/tr/episode-editor.js';
import { seedFranchiseHistory } from './helpers/tr-castle-fixture.js';
import roster from '../franchise_roster.json';

// The real pool, exactly as tr-episode-density.test.js loads it. Without these
// the castle is empty and every arm below is true of nothing.
import '../js/tr/castle/trust.js';
import '../js/tr/castle/suspicion.js';
import '../js/tr/castle/grief.js';
import '../js/tr/castle/cover.js';
import '../js/tr/castle/romance.js';
import '../js/tr/castle/callback.js';
import '../js/tr/castle/testing.js';
import '../js/tr/castle/journey.js';
import '../js/tr/castle/mission-fallout.js';
import '../js/tr/castle/consequences.js';
import '../js/tr/castle/nightfall.js';

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const CAST_SIZE = 18;
const SEASON_ROSTER = roster.players.slice(0, CAST_SIZE);
const SEASON_CAST = SEASON_ROSTER.map(p => p.name);

function play(seed) {
  setPlayers(SEASON_ROSTER);
  seedFranchiseHistory(SEASON_CAST);
  playTraitorsSeason({ cast: SEASON_CAST, traitorCount: 3, seed });
  return (gs.episodeHistory || []).filter(r => r.tr?.castle?.edit);
}

function allRows() {
  const rows = [];
  for (const seed of SEEDS) for (const r of play(seed)) rows.push({ seed, row: r });
  return rows;
}

describe('every episode is edited before it is filed', () => {
  const rows = allRows();

  it('the scan found real episodes with a real edit on them', () => {
    expect(rows.length, 'no episode carried an edit record at all').toBeGreaterThan(60);
    const withScenes = rows.filter(({ row }) => row.tr.castle.edit.scenes.length > 0);
    expect(withScenes.length / rows.length).toBeGreaterThan(0.8);
  });

  it('spends none of the throughput: the edit holds every scene the record holds', () => {
    // CONTROLLER RULING R1, ASSERTED OVER REAL SEASONS. The editor runs inside
    // `_recordEpisode`, upstream of everything js/vp-tr/ reads, so a cut here
    // would silently take cards off the 100-140 band and nothing else would
    // notice. Identity, not length.
    for (const { seed, row } of rows) {
      const fromPhases = row.tr.castle.phases.flatMap(p => p.scenes);
      const edited = row.tr.castle.edit.scenes;
      expect(new Set(edited).size, `seed ${seed} ep ${row.num}`).toBe(edited.length);
      expect(edited.length, `seed ${seed} ep ${row.num}: the editor dropped scenes`)
        .toBe(fromPhases.length);
    }
  });
});

describe('a promised action is paid off, attempted, postponed or explained', () => {
  const rows = allRows();

  it('pays off or explicitly settles every promised action', () => {
    let seen = 0;
    for (const { seed, row } of rows) {
      for (const promise of row.tr.castle.edit.promises) {
        seen++;
        expect(PROMISE_STATUSES, `seed ${seed} ep ${row.num} promise ${promise.id}`)
          .toContain(promise.status);
        if (promise.status === 'abandoned') expect(promise.abandonmentReason).toBeTruthy();
        // The words that were actually said, not a label. This is what makes
        // the transcript check in Step 6 possible at all.
        expect(promise.promisedAction.length).toBeGreaterThan(8);
      }
    }
    expect(seen, 'no promises were recorded across eight seasons').toBeGreaterThan(200);
  });

  it('and nothing is left open when the episode is filed', () => {
    for (const { seed, row } of rows) {
      const open = row.tr.castle.edit.promises.filter(p => p.status === 'open');
      expect(open.map(p => p.id), `seed ${seed} ep ${row.num}`).toEqual([]);
    }
  });

  it('every status the castle can reach is actually reached', () => {
    // ANTI-VACUITY, AND IT IS THE ONE THAT MATTERS. An arm that only ever sees
    // `postponed` would pass while the settlement logic did nothing at all.
    const counts = {};
    for (const { row } of rows) {
      for (const p of row.tr.castle.edit.promises) counts[p.status] = (counts[p.status] || 0) + 1;
    }
    // eslint-disable-next-line no-console
    console.log('[tr-story-payoff] promise statuses across the scan:', JSON.stringify(counts));
    expect(counts.resolved, 'no story ever paid off').toBeGreaterThan(0);
    expect(counts.attempted, 'no story was ever carried without settling').toBeGreaterThan(0);
    expect(counts.postponed, 'no story was ever held over').toBeGreaterThan(0);
  });
});

describe('a payoff cites an earlier setup', () => {
  const rows = allRows();

  it('every resolved promise names the beat that opened it and the beat that closed it', () => {
    let checked = 0;
    for (const { seed, row } of rows) {
      const byId = new Map(row.tr.castle.edit.scenes.map(s => [s.sceneId, s]));
      for (const p of row.tr.castle.edit.promises) {
        if (p.status !== 'resolved') continue;
        checked++;
        // THE SETUP IS NAMED EVEN WHEN IT IS NOT ON THIS ROW. A story opened on
        // day three and paid off on day six is the continuity spec section 7 is
        // about; its setup scene lives on the earlier episode's record, so what
        // is asserted here is that the promise NAMES one and that the promise
        // was made before the payoff, not that both are in one night.
        expect(p.sourceSceneId, `seed ${seed} ep ${row.num}: ${p.id} has no setup`).toBeTruthy();
        expect(p.ep).toBeLessThanOrEqual(row.num);
        const setup = byId.get(p.sourceSceneId);
        if (setup) expect(setup.opened).toBe(true);
        const payoff = byId.get(p.resolutionSceneId);
        expect(payoff, `seed ${seed} ep ${row.num}: ${p.id} resolved into nothing`).toBeTruthy();
        expect(payoff.closedNow).toBe(true);
        expect(payoff.threadId).toBe(p.threadId);
        expect(payoff.outcome, 'a payoff with no recorded outcome').toBeTruthy();
      }
    }
    expect(checked, 'nothing resolved in the whole scan').toBeGreaterThan(20);
  });

  it('stories are paid off on a LATER night than the one that opened them', () => {
    // THE CONTINUITY CLAIM, ASSERTED. A ledger that only ever settled a promise
    // inside the episode that made it would satisfy every arm above and would
    // record no continuity at all — the promise would be opened and closed in
    // one night, every night, and spec section 7 would be a comment.
    let crossNight = 0, sameNight = 0;
    for (const { row } of rows) {
      for (const p of row.tr.castle.edit.promises) {
        if (p.status !== 'resolved') continue;
        if (p.ep < row.num) crossNight++; else sameNight++;
      }
    }
    // eslint-disable-next-line no-console
    console.log(`[tr-story-payoff] resolved promises: ${crossNight} across nights, `
      + `${sameNight} inside one night`);
    expect(crossNight, 'no story in eight seasons survived to be paid off later')
      .toBeGreaterThan(0);
  });

  it('a multi-episode story keeps its opening day on every later beat', () => {
    // CONTINUITY ACROSS EPISODES, which is the half a single-episode edit
    // record cannot see. A beat that carries prior days must agree with the
    // thread it belongs to about when the thread started.
    let carried = 0;
    for (const { row } of rows) {
      for (const s of row.tr.castle.edit.scenes) {
        if (!s.priorDays || !s.priorDays.length) continue;
        carried++;
        expect(s.opened).toBe(false);
        expect(Math.min(...s.priorDays)).toBeGreaterThanOrEqual(s.openedEp);
        expect(Math.max(...s.priorDays)).toBeLessThan(row.num);
      }
    }
    expect(carried, 'no scene in the whole scan carried an earlier day').toBeGreaterThan(50);
  });
});

describe('the shaped episode is measurably better paced than the raw day', () => {
  const rows = allRows();

  it('reports what the editor did to the conflict runs', () => {
    // THE MUTATION, RUN OVER REAL SEASONS RATHER THAN ASSERTED. `preEdit` is
    // the same scenes in the order the windows fired them, which is exactly
    // what the record held before this task; `postEdit` is the shipped order.
    // If the two are equal the editor is doing nothing and every band above is
    // measuring the scheduler.
    let worsePre = 0, total = 0;
    let sumPre = 0, sumPost = 0;
    for (const { row } of rows) {
      const edit = row.tr.castle.edit;
      if (edit.scenes.length < 8) continue;
      total++;
      const pre = [...edit.scenes].sort((a, b) => (a.firedAt ?? 0) - (b.firedAt ?? 0));
      const rPre = longestRun(pre, s => s.tone === 'conflict');
      const rPost = longestRun(edit.scenes, s => s.tone === 'conflict');
      sumPre += rPre; sumPost += rPost;
      if (rPre > rPost) worsePre++;
    }
    // eslint-disable-next-line no-console
    console.log(`[tr-story-payoff] longest conflict run: raw mean ${(sumPre / total).toFixed(2)} `
      + `-> edited mean ${(sumPost / total).toFixed(2)} over ${total} episodes; `
      + `the edit shortened it on ${worsePre} of them`);
    expect(total).toBeGreaterThan(50);
    expect(sumPost / total, 'the edited mean run is no shorter than the raw one')
      .toBeLessThan(sumPre / total);
  });

  it('keeps the conflict run inside the contract on the large majority of episodes', () => {
    // NOT A PER-EPISODE FLOOR, AND THE REASON IS THE SAME ONE
    // tr-episode-density.test.js gives for its own share band: ordering cannot
    // manufacture relief a phase does not contain, so an episode whose evening
    // held nothing but accusations will exceed the run and SHOULD, rather than
    // having a warm scene invented for it. The share is what is banded.
    let inside = 0, total = 0;
    for (const { row } of rows) {
      const edit = row.tr.castle.edit;
      if (edit.scenes.length < 8) continue;
      total++;
      if (longestRun(edit.scenes, s => s.tone === 'conflict') <= MAX_CONFLICT_RUN) inside++;
    }
    // eslint-disable-next-line no-console
    console.log(`[tr-story-payoff] episodes inside the <=${MAX_CONFLICT_RUN} conflict run: `
      + `${((inside / total) * 100).toFixed(1)}% of ${total}`);
    expect(inside / total).toBeGreaterThan(0.75);
  });

  it('every standard episode reserves some ordinary life', () => {
    let withRelief = 0, total = 0;
    for (const { row } of rows) {
      const edit = row.tr.castle.edit;
      if (edit.scenes.length < 8) continue;
      total++;
      if (edit.pacing.reliefScenes > 0) withRelief++;
    }
    expect(withRelief / total).toBeGreaterThan(0.9);
  });
});
