// The scenes that happen in front of people are played in front of people (js/ch/state.js CROWD_KINDS). The user,
// 2026-10-16, of a payback "in front of everybody, so there's no confusion" that aired as two people alone: "it
// doesnt read well ... we need more 3+ people conversation".
import { describe, it, expect, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { CROWD_KINDS } from '../js/ch/state.js';
import { challengeCast } from './helpers/ch-cast.js';

describe('crowd scenes', () => {
  const runs = [];
  beforeAll(() => {
    for (const seed of [611, 612, 613]) {
      const { cast, names, background } = challengeCast(24, seed);
      setPlayers(cast);
      const r = playChallengeSeason({ cast: names, background, seed });
      airSeason(r.state);
      runs.push(r);
    }
  });
  const aired = () => runs.flatMap(r => r.episodes.flatMap(e => e.aired || []));
  const speakers = a => new Set((a.script?.lines || []).filter(l => l.kind === 'say' && l.by && l.by !== 'TJ').map(l => l.by));

  it('says a line to the room only when there is a room', () => {
    const TO_ROOM = /\b(you all know|then you all|in front of everybody, so|since we're all here|just so everybody knows)\b/i;
    const bad = aired().filter(a => CROWD_KINDS.has(a.kind) && speakers(a).size < 3)
      .flatMap(a => a.script.lines.filter(l => l.kind === 'say' && TO_ROOM.test(l.text)).map(l => `${a.kind}: ${l.text}`));
    expect(bad).toEqual([]);
  });

  it('gives the people in the room something to say', () => {
    const pub = aired().filter(a => CROWD_KINDS.has(a.kind) && a.scene?.data?.crowd?.length);
    expect(pub.length).toBeGreaterThan(30);
    const spoke = pub.filter(a => a.scene.data.crowd.some(n => speakers(a).has(n)));
    expect(spoke.length / pub.length).toBeGreaterThan(0.35);
  });

  it('still reaches the final with every finalist (a quit after the last Arena no longer leaves seven)', () => {
    for (const r of runs) expect(r.state.final.finalists.length).toBe(8);
  });
});
