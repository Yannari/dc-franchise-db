// ci-vp-steps.test.js — an aired Circle day as screens of clicks (Plan 5).
// PURE: a row in, plain data out. One click is one spoken or sent line
// (spec 18.3); the stage kind decides where the camera is.
import { describe, expect, it, beforeAll } from 'vitest';
import { circleScreens, stageOf, faceOf } from '../js/vp-ci/steps.js';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';

let rows;
beforeAll(() => {
  const cast = rosterCast(13, 3); setPlayers(cast);
  const names = cast.map(p => p.name);
  rows = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed: 3 }).rows;
});

describe('screens of steps', () => {
  it('every aired scene with lines is a screen; every line is a step, in order', () => {
    for (const row of rows) {
      const screens = circleScreens(row);
      const aired = row.ci.aired.filter(s => s.script?.blocks?.length);
      expect(screens).toHaveLength(aired.length);
      screens.forEach((sc, i) => {
        const lines = aired[i].script.blocks.flatMap(b => [...(b.lines || []), ...(b.beat ? [{ kind: 'stage', text: b.beat }] : [])]);
        expect(sc.steps.map(s => s.text)).toEqual(lines.map(l => l.text));
      });
    }
  });

  it('a step says what it is: aloud, sent, a reaction, a post, the host, a stage direction', () => {
    const parts = new Set(rows.flatMap(r => circleScreens(r).flatMap(s => s.steps.map(x => x.part))));
    for (const p of ['say', 'send', 'react', 'stage']) expect(parts).toContain(p);
    for (const p of parts) expect(['say', 'send', 'react', 'post', 'video', 'host', 'stage']).toContain(p);
  });

  it('a sent line keeps what the player dictated, for the apartment scene', () => {
    const send = rows.flatMap(r => circleScreens(r).flatMap(s => s.steps)).find(s => s.part === 'send' && s.spoken);
    expect(send.spoken).toMatch(/^Message:/);
  });
});

describe('where the camera is', () => {
  it('a private chat plays in the apartments; the group chat on the Circle itself; an alert slams in', () => {
    expect(stageOf('chat')).toBe('apt');
    expect(stageOf('circle-chat')).toBe('ui');
    expect(stageOf('alert')).toBe('alert');
    expect(stageOf('some-new-kind')).toBe('ui');
  });
  it('every screen is on a stage the painter knows', () => {
    for (const row of rows) for (const s of circleScreens(row)) expect(['apt', 'ui', 'alert', 'arrive', 'rate', 'hangout', 'blocked', 'room', 'video', 'studio']).toContain(s.stage);
  });
});

describe('faces', () => {
  it('a profile shows what the room sees; the apartment cam shows who is really there', () => {
    const row = rows[0];
    const [h, p] = Object.entries(row.ci.profiles).find(([, x]) => x.mode === 'catfish') || [];
    if (!h) return;
    expect(faceOf(row, h, 'profile')).toBe(p.face);          // the persona's photo (or null: its initial)
    expect(faceOf(row, h, 'cam')).toBe(`portrait:${p.people[0]}`);  // the real player on camera
  });
});
