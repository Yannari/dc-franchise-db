// A team's identity line at a challenge opens the moment; it never comes after the exchange's last word. Found by the
// 2026-10-20 season read (seeds 41, 42): the line was added at the end of every task beat, after the punchline
// ("Please don't. People walk on it." / "This is a highlight run, Luis."), so the joke died on a line that answered
// nothing. And a kit line written for one kind of task is said only at that kind ("Let me talk to him" at catching an
// emu; "Pull steady" at a sand palace; "find the rhythm" at a caricature).
import { describe, it, expect } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { KITS } from '../js/rr/script/identity.js';

const TASK = new Set(['task-start', 'task-try', 'task-done', 'attempt-fail']);

describe('rr identity lines at a challenge', () => {
  it('opens the moment: never the last word of a task beat', () => {
    let n = 0;
    const late = [];
    // (three seasons: two came out with exactly ten such lines on 2026-10-21, and the guard measured its sample)
    for (const seed of [41, 42, 43]) {
      const { cast, teams } = raceCast(12, seed);
      setPlayers(cast);
      for (const ep of airSeason(playRaceSeason({ teams, seed }))) for (const s of ep.segments) {
        if (!TASK.has(s.kind)) continue;
        // (first of all: after an action line it splits the action from the reaction to it, "(a picker fills her basket
        // without looking)" / "Six plates, two arms" / "She's not even looking")
        const at = s.lines.findIndex(l => l.auto);
        if (at < 0) continue;
        n++;
        if (at > 0) late.push(`leg ${ep.n} ${s.kind} ${s.lineId}: "${s.lines[at].text}" after "${s.lines[at - 1].text}"`);
      }
    }
    expect(n).toBeGreaterThan(10);
    expect(late).toEqual([]);
  }, 240000);

  it('says a line written for one kind of task only at that kind', () => {
    const tagged = Object.values(KITS).flatMap(k => ['voice', 'specific'].flatMap(p => (k[p]?.good || []).filter(l => typeof l === 'object')));
    expect(tagged.length).toBeGreaterThan(0);
    for (const l of tagged) {
      expect(Array.isArray(l.for) && l.for.length, JSON.stringify(l)).toBeTruthy();
      expect(typeof l.s).toBe('string');
    }
    const servers = KITS.servers.voice.good.find(l => typeof l === 'object' && /talk to him/.test(l.s));
    expect(servers?.for).toEqual(['people']);
  });
});
