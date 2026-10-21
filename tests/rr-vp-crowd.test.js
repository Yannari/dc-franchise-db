// The Ridonculous Race viewer's background and exits (js/vp-rr-ep/steps.js). The user, 2026-10-19:
//   "if they are alone they are alone but even in close space we have people running around should they even be
//    at this part of the leg? also they are people but they never interact"
//   "it says x and y are gone but theyre still on the screen"
// So: no crowd in a closed space; nobody behind a team the log has alone; whoever is behind does the task the shot
// is about (never laps around a conversation); and a line that sends people away takes them off the stage.
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { episodeScreens, closedShot, exitsIn, planExits, onStage, MAX_CROWD } from '../js/vp-rr-ep/steps.js';
import { PLACES } from '../js/rr/places.js';
import { stretchPlates } from '../js/vp-rr-ep/plates.js';

const SEASONS = [[12, 8], [8, 3], [6, 5]];
const played = [];
beforeAll(() => {
  for (const [n, seed] of SEASONS) {
    const { cast, teams } = raceCast(n, seed);
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const eps = airSeason(res);
    played.push({ n, seed, res, eps, built: eps.map((_, i) => episodeScreens(res, eps, i)) });
  }
});
const each = fn => { for (const p of played) p.built.forEach((ep, i) => fn(ep, p, i)); };
const TASK_KINDS = new Set(['either', 'botch', 'allin', 'route', 'superteam']);
const PATH = new Set(['climb', 'walk', 'hop', 'run', 'zip', 'para', 'swim', 'dive', 'ride', 'swing', 'push', 'coals', 'roll']);
const premiere = s => s.seg === 'don-opener' || s.seg === 'team-intro';

describe('rr viewer: the rest of the race behind a shot', () => {
  it('puts nobody behind a shot in a closed space (an elevator, a cabin, a cab, a stairwell, a small room)', () => {
    let closed = 0;
    each(ep => {
      for (const s of ep.screens) {
        if (s.kind !== 'world') continue;
        if (closedShot(s)) { closed++; expect(s.crowd, `${s.id} ${s.seg} on ${s.plate?.f}: a crowd in a closed space`).toBeFalsy(); }
      }
    });
    expect(closed).toBeGreaterThan(20);
    // the plates the user named
    expect(closedShot({ kind: 'world', mode: 'talk', stretch: 'tower', plate: { f: 'task-9434868', closed: true } })).toBe(true);
    expect(closedShot({ kind: 'world', mode: 'cabin', plate: { f: 'cabin', race: true } })).toBe(true);
  });

  it('leaves a team alone when the log has it alone at that stretch', () => {
    let alone = 0;
    each((ep, p, i) => {
      const leg = p.res.legs[i];
      for (const s of ep.screens) {
        if (s.kind !== 'world' || premiere(s) || s.mode === 'mat' || !s.crowdWin) continue;
        const [t0, t1] = s.crowdWin;
        const company = new Set(leg.log.filter(r => r.stretch === s.stretch && !s.teams.includes(r.id) && r.from <= t1 + 1 && r.to >= t0 - 1).map(r => r.id));
        if (!company.size) { alone++; expect(s.crowd, `${s.id}: a crowd behind a team the log has alone`).toBeFalsy(); }
        for (const c of s.crowd || []) expect(company.has(c.team), `${s.id}: ${c.team} is not at ${s.stretch} then`).toBe(true);
      }
    });
    expect(alone).toBeGreaterThan(30);
  });

  it('has the teams behind do the task the shot is about, never run laps around a conversation', () => {
    let working = 0;
    each(ep => {
      for (const s of ep.screens) {
        if (s.kind !== 'world' || premiere(s) || s.mode === 'mat') continue;
        const stretch = PLACES[s.place]?.stretches.find(x => x.id === s.stretch);
        const task = stretch && TASK_KINDS.has(stretch.kind);
        // (a task done in two halves shows its second half's work on its own plate)
        const sp = stretchPlates(s.place, s.stretch, s.side);
        const act = sp?.act2 && sp.act2.f === s.plate.f ? sp.act2 : sp?.act;
        for (const c of s.crowd || []) {
          if (task) {
            // on the task's own path (a climb, a swim, the final footrace) they do what the path is; anywhere else at
            // a task they are at its work, never running through
            if (s.mode === 'act' && s.plate.path && PATH.has(s.plate.mode)) expect(c.as, `${s.id}: ${c.team} is not doing the task`).toBe(s.plate.mode);
            else {
              expect(c.as, `${s.id} ${s.seg}: ${c.team} runs through a task area`).not.toBe('run');
              // (a stage's own shot: the teams behind do what that stage shows, creeping past the guards with the artifact)
              const want = (s.seg === 'task-stage' && s.mode === 'act' && s.plate.mode) || act?.mode;
              expect(c.work, `${s.id}: ${c.team} stands about at a task`).toBe(want); working++;
            }
          } else if (c.as === 'run') {
            // a road: one pass through, never back and forth
            const xs = c.pos.filter(Boolean).map(p => p[0]);
            const up = xs.every((x, k) => !k || x >= xs[k - 1]), down = xs.every((x, k) => !k || x <= xs[k - 1]);
            expect(up || down, `${s.id}: ${c.team} runs back and forth`).toBe(true);
          }
        }
      }
    });
    expect(working).toBeGreaterThan(5);
  });

  it('keeps the background small: two teams at most, except the start line', () => {
    each(ep => {
      for (const s of ep.screens) if (s.crowd && s.seg !== 'don-opener') expect(s.crowd.length, `${s.id} ${s.seg}`).toBeLessThanOrEqual(MAX_CROWD);
    });
    expect(MAX_CROWD).toBeLessThanOrEqual(2);
  });

  it('puts the teams in a conversation in the foreground, never behind it', () => {
    each(ep => {
      for (const s of ep.screens) for (const c of s.crowd || []) {
        const names = s.members?.[c.team] || [];
        for (const st of s.steps) expect(names.includes(st.by), `${s.id}: ${st.by} talks from the background`).toBe(false);
        expect(names.some(n => (s.who || []).includes(n)), `${s.id}: ${c.team} is in the scene but staged behind it`).toBe(false);
      }
    });
  });

  it('has the teams behind react to the big moments in front (a glance, a cheer, a wince)', () => {
    let n = 0;
    each(ep => {
      for (const s of ep.screens) s.steps.forEach((st, k) => {
        if (!st.crowdReact) return;
        n++;
        expect(['glance', 'cheer', 'wince']).toContain(st.crowdReact);
        expect((s.crowd || []).some(c => c.pos[k]), `${s.id} step ${k}: a reaction with nobody behind`).toBe(true);
      });
    });
    expect(n).toBeGreaterThan(10);
  });
});

describe('rr viewer: a line that sends people away takes them off the stage', () => {
  const names = ['Ara', 'Evie', 'Bruno', 'Kai'];
  const teamNames = { t1: 'Shimmer Sisters', t2: 'Gym Bros' };
  it('reads who leaves from the words', () => {
    expect(exitsIn('Ara and Evie are gone before anyone can say anything else. Bruno rubs his arm.', names, teamNames)).toEqual(['Ara', 'Evie']);
    expect(exitsIn('Bruno storms off.', names, teamNames)).toEqual(['Bruno']);
    expect(exitsIn('Kai and Bruno run off toward the market.', names, teamNames)).toEqual(['Kai', 'Bruno']);
    expect(exitsIn('The Gym Bros are out of there.', names, teamNames)).toEqual(['t2']);
    expect(exitsIn('Evie walks away without a word.', names, teamNames)).toEqual(['Evie']);
    expect(exitsIn('Ara leaves.', names, teamNames)).toEqual(['Ara']);
    // not a departure
    expect(exitsIn('Ara wants to leave.', names, teamNames)).toEqual([]);
    expect(exitsIn('Before Bruno leaves, he turns back.', names, teamNames)).toEqual([]);
    expect(exitsIn('Kai leaves a note on the bench.', names, teamNames)).toEqual([]);
    expect(exitsIn('Nobody is gone yet.', names, teamNames)).toEqual([]);
    expect(exitsIn('Evie is not gone.', names, teamNames)).toEqual([]);
  });

  it('walks them off at that step and keeps them off until a later line brings them back (the screenshot)', () => {
    const s = {
      kind: 'world', mode: 'talk', teams: ['t1', 't2'], members: { t1: ['Ara', 'Evie'], t2: ['Bruno', 'Kai'] },
      marks: { t1: [30, 90], t2: [60, 90] },
      steps: [
        { by: 'Ara', team: 't1', part: 'say', text: 'Watch your elbows.' },
        { by: null, part: 'beat', text: 'Ara and Evie are gone before anyone can say anything else. Bruno rubs his arm.' },
        { by: 'Bruno', team: 't2', part: 'say', text: 'Did she just shove me?' },
        { by: 'Kai', team: 't2', part: 'say', text: 'She did.' },
        { by: 'Evie', team: 't1', part: 'say', text: 'Forgot the map!' },
      ],
    };
    planExits(s, { teamNames });
    expect(s.leaveAt).toEqual({ 1: ['t1'] });
    expect([0, 1, 2, 3, 4].map(k => onStage(s, 't1', k))).toEqual([true, false, false, false, true]);
    expect([0, 1, 2, 3, 4].map(k => onStage(s, 't2', k))).toEqual([true, true, true, true, true]);
    expect(s.backAt).toEqual({ 4: ['t1'] });
  });

  it('takes one partner off and leaves the other', () => {
    const s = { kind: 'world', mode: 'talk', teams: ['t1', 't2'], members: { t1: ['Ara', 'Evie'], t2: ['Bruno', 'Kai'] }, marks: { t1: [30, 90], t2: [60, 90] },
      steps: [{ by: null, part: 'beat', text: 'Bruno storms off.' }, { by: 'Kai', team: 't2', part: 'say', text: 'Great.' }] };
    planExits(s, { teamNames });
    expect(onStage(s, 't2', 1)).toBe(true);
    expect(s.offAt[1].t2).toEqual(['Bruno']);
  });

  it('never leaves anyone talking from off the stage, across every season', () => {
    let exits = 0;
    each(ep => {
      for (const s of ep.screens) {
        if (s.kind !== 'world') continue;
        exits += Object.keys(s.leaveAt || {}).length;
        s.steps.forEach((st, k) => {
          if (!st.team || !s.teams.includes(st.team)) return;
          expect(onStage(s, st.team, k), `${s.id} step ${k}: ${st.by} talks after leaving`).toBe(true);
          expect((s.offAt?.[k]?.[st.team] || []).includes?.(st.by) ? false : true, `${s.id} step ${k}: ${st.by} talks after leaving`).toBe(true);
        });
      }
    });
    expect(exits).toBeGreaterThan(0);
  });
});
