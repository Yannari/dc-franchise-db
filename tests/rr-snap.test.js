// The Ridonculous Race: what a scene may know, kept when it is played (dialogue plan, Task 1).
import { describe, it, expect, beforeAll } from 'vitest';
import { SCENES, playScene, SNAP_KEYS } from '../js/rr/scenes.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { addBond, getBond } from '../js/bonds.js';
import { raceCast } from './helpers/rr-cast.js';
import { fixtureCtx } from './helpers/rr-catalogue.js';

const TASKS = ['either', 'botch', 'allin', 'route', 'superteam'];

describe('rr scene snapshot', () => {
  let res;
  beforeAll(() => {
    const { cast, teams } = raceCast(8, 3);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 3, options: { twists: { 3: 'boomerang' } } });
  });

  it('every catalogue scene keeps its snapshot, with every key', () => {
    const scenes = res.state.scenes.filter(s => SCENES[s.kind]);
    expect(scenes.length).toBeGreaterThan(100);
    for (const s of scenes) {
      expect(s.data.snap, `#${s.id} ${s.kind}`).toBeTruthy();
      for (const k of SNAP_KEYS) expect(k in s.data.snap, `#${s.id} ${s.kind} lacks ${k}`).toBe(true);
    }
  });

  it('the snapshot is how things stood at the scene, not after', () => {
    const ctx = fixtureCtx('bond-moment');
    const t = ctx.state.teams[ctx.team.id];
    addBond(t.a, t.b, 6 - getBond(t.a, t.b));
    const sc = playScene(ctx, 'bond-moment', () => 0.5, { ending: 'laugh' });
    expect(sc.data.snap.band).toBe('friends');
    addBond(t.a, t.b, -14);
    expect(sc.data.snap.band).toBe('friends');
    expect(sc.data.snap.leg).toBe(3);
    expect(sc.data.snap.stretchKind).toBe('botch');
  });

  it('the time of day is the leg clock plus the scene minute', () => {
    const ctx = fixtureCtx('bond-moment');
    ctx.state.clock = 420;
    ctx.t = 100;
    const sc = playScene(ctx, 'bond-moment', () => 0.5, { ending: 'laugh' });
    expect(sc.data.snap.tod).toBe(520);
  });

  it('every team has one task row per task stretch it ran, per leg', () => {
    const st = res.state;
    let checked = 0;
    const express = new Set(st.scenes.filter(s => s.kind === 'express-used').map(s => `${s.leg}|${s.data.team}|${s.data.stretch}`));
    for (const leg of res.legs) {
      const runs = {};
      for (const l of leg.log) {
        const s = leg.route && l.stretch;
        if (!s) continue;
        const kind = (leg.stretchKinds || {})[l.stretch];
        if (!TASKS.includes(kind)) continue;
        if (express.has(`${leg.n}|${l.id}|${l.stretch}`)) continue;
        if (l.to === l.from) continue;                      // held then stopped where it stood
        const k = `${l.id}|${l.stretch}`;
        runs[k] = (runs[k] || 0) + 1;
      }
      for (const [k, n] of Object.entries(runs)) {
        const [team, stretch] = k.split('|');
        const rows = st.taskLog.filter(r => r.leg === leg.n && r.team === team && r.stretch === stretch);
        expect(rows.length, `leg ${leg.n} ${k}`).toBe(n);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(50);
  });
});
