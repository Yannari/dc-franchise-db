// The Ridonculous Race: a scene fits where it happens and an interview is about what just happened (the user,
// 2026-10-18, on a mind-game at the airport whose partners "go at the task twice as hard", followed by a "proud"
// interview written for a sabotage: "two random scenes, I don't get the correlation").
import { describe, it, expect, beforeAll } from 'vitest';
import { playRaceSeason } from '../js/rr/season.js';
import { airSeason } from '../js/rr/episode.js';
import { setPlayers } from '../js/core.js';
import { POOLS } from '../js/rr/script/lines/index.js';
import { getPlace } from '../js/rr/places.js';
import { raceCast } from './helpers/rr-cast.js';

const TASK_KINDS = ['allin', 'botch', 'either', 'superteam', 'route'];
const TASK_WORDS = /\b(task|judge)\b/i;
const byId = Object.fromEntries(Object.values(POOLS).flat().map(e => [e.id, e]));

describe('rr context', () => {
  const seasons = [];
  beforeAll(() => {
    for (const seed of [1, 2, 3]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      const res = playRaceSeason({ teams, seed });
      seasons.push({ res, eps: airSeason(res) });
    }
  });

  it('a conversation away from a task never talks as if it were at one', () => {
    let checked = 0;
    for (const { res, eps } of seasons) eps.forEach((ep, i) => {
      const stretches = Object.fromEntries((getPlace(res.legs[i].place)?.stretches || []).map(s => [s.id, s]));
      for (const seg of ep.segments) {
        if (!seg.lines || seg.kind.startsWith('don-') || seg.kind.startsWith('int-') || seg.kind.startsWith('task-') || seg.kind === 'attempt-fail') continue;
        const s = stretches[seg.stretch];
        if (!s || TASK_KINDS.includes(s.kind)) continue;
        checked++;
        for (const l of seg.lines) expect(l.text, `leg ${ep.n} ${seg.kind} @${seg.stretch} (${seg.lineId})`).not.toMatch(TASK_WORDS);
      }
    });
    expect(checked).toBeGreaterThan(50);
  });

  it('an interview about a moment is written for that kind of moment', () => {
    let checked = 0;
    for (const { res, eps } of seasons) {
      const scenes = Object.fromEntries(res.state.scenes.map(s => [s.id, s]));
      for (const ep of eps) for (const seg of ep.segments) {
        if (!['int-feeling', 'int-strategy', 'int-about-team', 'int-contradict'].includes(seg.kind) || seg.scene == null) continue;
        const iv = scenes[seg.scene], cause = scenes[iv.data.about];
        if (!cause) continue;
        const entry = byId[String(seg.lineId).split(',')[0]];
        expect(entry, `${seg.kind} ${seg.lineId}`).toBeTruthy();
        expect([].concat(entry.when?.cause), `${seg.kind} after ${cause.kind} (${seg.lineId})`).toContain(cause.kind);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(5);
  });

  it('a scheme that backfired is never followed by a proud interview', () => {
    let n = 0;
    for (const { res } of seasons) {
      const scenes = Object.fromEntries(res.state.scenes.map(s => [s.id, s]));
      for (const iv of res.state.scenes.filter(s => s.kind === 'int-strategy' && s.data.about != null)) {
        const cause = scenes[iv.data.about];
        if (['steels-them', 'later-flight-attempt', 'takes-high-road', 'backfires', 'seen', 'caught-out'].includes(cause.data.ending)) {
          expect(iv.data.ending, `${cause.kind}/${cause.data.ending}`).not.toBe('proud');
          n++;
        }
      }
    }
    expect(n).toBeGreaterThan(0);
  });
});
