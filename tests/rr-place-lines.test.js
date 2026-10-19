// The Ridonculous Race: every place talks like itself and every challenge has its own lines (the user,
// 2026-10-18: "we need dialogues per place and per challenge"). A place joins PLACES only with its words.
import { describe, it, expect } from 'vitest';
import { PLACES } from '../js/rr/places.js';
import { POOLS } from '../js/rr/script/lines/index.js';

const TASKS = ['allin', 'botch', 'either', 'superteam'];
// how many of a place's own entries each moment needs, at each of its challenges
const PER_TASK = { 'don-demo': 2, 'task-start': 2, 'task-try.first-try': 1, 'task-try.after-fails': 1, 'task-try.struggling': 1,
  'task-done': 1, 'attempt-fail': 2 };
const PER_PLACE = { 'don-opener': 2, 'arrival-awe': 2 };

const entriesFor = (prefix, test) => Object.entries(POOLS)
  .filter(([k]) => k === prefix || k.startsWith(prefix + '.'))
  .flatMap(([, l]) => l).filter(e => test(e.when || {}));

describe('rr place lines', () => {
  it('task ids are unique across the library (a challenge is named by its id alone)', () => {
    const seen = {};
    for (const p of Object.values(PLACES)) for (const s of p.stretches.filter(s => TASKS.includes(s.kind))) {
      expect(seen[s.id], `${s.id} in ${p.id} and ${seen[s.id]}`).toBeUndefined();
      seen[s.id] = p.id;
    }
  });

  // the places written so far (the place library is being written one at a time; this list goes when all are in)
  const WRITTEN = new Set(['red-sand-desert']);
  for (const p of Object.values(PLACES).filter(p => WRITTEN.has(p.id))) {
    it(`${p.name} has its own opener and arrival`, () => {
      for (const [k, n] of Object.entries(PER_PLACE)) expect(entriesFor(k, w => w.place === p.id).length, `${p.id} ${k}`).toBeGreaterThanOrEqual(n);
    });
    it(`${p.name}: every challenge has its own lines`, () => {
      for (const s of p.stretches.filter(s => TASKS.includes(s.kind))) {
        for (const [k, n] of Object.entries(PER_TASK)) expect(entriesFor(k, w => w.taskId === s.id).length, `${s.id} ${k}`).toBeGreaterThanOrEqual(n);
        if (s.kind === 'botch') expect(entriesFor('whose-botch', w => w.taskId === s.id).length, `${s.id} whose-botch`).toBeGreaterThanOrEqual(2);
        if (s.kind === 'either') expect(entriesFor('decide-side', w => w.taskId === s.id).length, `${s.id} decide-side`).toBeGreaterThanOrEqual(2);
      }
    });
  }
});

describe('rr place lines on air', () => {
  let res, eps;
  const setup = async () => {
    if (res) return;
    const { playRaceSeason } = await import('../js/rr/season.js');
    const { airSeason } = await import('../js/rr/episode.js');
    const { setPlayers } = await import('../js/core.js');
    const { raceCast } = await import('./helpers/rr-cast.js');
    const { cast, teams } = raceCast(12, 1);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 1 });
    eps = airSeason(res);
  };

  it("a place's own opener airs when it has one, and Don shows every challenge", async () => {
    await setup();
    const i = eps.findIndex(ep => ep.segments.some(s => s.kind === 'don-opener' && String(s.lineId).startsWith('rsd.')));
    expect(i, 'Red Sand Desert opened with its own lines').toBeGreaterThanOrEqual(0);
    const ep = eps[i];
    for (const task of ['spices', 'stew']) expect(ep.segments.some(s => s.kind === 'don-demo' && s.stretch === task), task).toBe(true);
  });

  it('at a challenge with its own lines, most teams are seen doing the challenge', async () => {
    await setup();
    const ep = eps.find(ep => ep.segments.some(s => s.kind === 'don-opener' && String(s.lineId).startsWith('rsd.')));
    for (const task of ['spices', 'stew']) {
      const at = ep.segments.filter(s => s.stretch === task);
      const teams = new Set(at.flatMap(s => s.teams));
      const doing = new Set(at.filter(s => ['task-start', 'task-try', 'task-done', 'attempt-fail', 'whose-botch', 'quit-task'].includes(s.kind)).flatMap(s => s.teams));
      expect(doing.size, `${task}: ${doing.size} of ${teams.size}`).toBeGreaterThanOrEqual(Math.ceil(teams.size / 2));
    }
  });
});
