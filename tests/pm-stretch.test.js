// The stretch (pm/stretch.js): the episodes up to the next fire pit follow one
// main story and up to two smaller ones (docs/superpowers/specs/2026-10-30-pm-stretch-payoff-design.md).
import { describe, it, expect, beforeAll } from 'vitest';
import { playReadSeason } from './helpers/pm-read.js';
import { storyScore, exitNight } from '../js/pm/stretch.js';

const SEEDS = [7, 12, 21];
const seasons = {};
beforeAll(() => {
  for (const seed of SEEDS) {
    const log = [];
    globalThis.__PM_STRETCH_LOG = log;
    seasons[seed] = { ...playReadSeason(seed), log };
    globalThis.__PM_STRETCH_LOG = null;
  }
});

describe('pm stretch', () => {
  it('ends a stretch on the nights somebody can leave', () => {
    expect(exitNight({ moment: 'recoupling' })).toBe(true);
    expect(exitNight({ moment: 'public-vote' })).toBe(true);
    expect(exitNight({ moment: 'villa' })).toBe(false);
    expect(exitNight({ moment: 'casa-nights' })).toBe(false);
  });

  it('plans every villa episode between the first night and the final recoupling', () => {
    for (const seed of SEEDS) {
      const { log, rows } = seasons[seed];
      const finalRe = rows.find(r => r.pm?.finalRecoupling)?.num ?? Infinity;
      const casa = new Set(rows.filter(r => r.pm?.casaRoom).map(r => r.num));
      for (const x of log) {
        if (x.ep === 1 || x.ep > finalRe || casa.has(x.ep) || ['final', 'reunion', 'casa-open', 'casa-nights', 'stick-or-twist'].includes(x.moment)) continue;
        expect(x.off, `seed ${seed} ep${x.ep} ${x.moment}`).toBe(false);
        expect(x.a, `seed ${seed} ep${x.ep} has a main story`).toBeTruthy();
      }
    }
  });

  it("puts the plan's stories at the top of the day", () => {
    for (const seed of SEEDS) for (const x of seasons[seed].log) {
      if (x.off) continue;
      expect(x.headline.slice(0, x.plan.length), `seed ${seed} ep${x.ep}`).toEqual(x.plan);
    }
  });

  it('keeps the main story to the fire pit unless it is over', () => {
    for (const seed of SEEDS) {
      const { log, state } = seasons[seed];
      for (let i = 1; i < log.length; i++) {
        const [p, x] = [log[i - 1], log[i]];
        if (p.off || x.off || x.ep > p.ceremony || !p.a) continue;
        const t = state.threads.find(z => z.id === p.a);
        if (t.over && t.endEp <= x.ep) continue;
        expect(x.a, `seed ${seed} ep${x.ep}`).toBe(p.a);
      }
    }
  });

  it('answers every story the stretch followed: none fades, fizzles or just settles', () => {
    for (const seed of SEEDS) {
      const { state, rows } = seasons[seed];
      const kept = new Set(rows.flatMap(r => (r.pm?.events || []).filter(e => e.kind === 'secret-kept').map(e => e.players.join('|'))));
      for (const t of state.threads.filter(x => state.planned?.[x.id])) {
        if (!t.over) continue;
        expect(['faded', 'fizzled', 'settled'], `seed ${seed} ${t.type} ${t.id} ep${t.ep}-${t.endEp}`).not.toContain(t.why);
      }
      // A secret nobody told by its fire pit is kept on camera.
      expect(kept.size + state.threads.filter(x => x.type === 'secret' && state.planned?.[x.id]).length).toBeGreaterThan(0);
    }
  });

  it("holds the main story's picks back: whoever is in it stands up last", () => {
    const tier = r => (r === 'a' ? 2 : r === 'b' ? 1 : 0);
    let seen = 0;
    for (const seed of SEEDS) for (const r of seasons[seed].rows) {
      const ps = (r.pm?.events || []).filter(e => e.kind === 'recouple-pick' && !e.extra.first);
      for (let i = 1; i < ps.length; i++) {
        // A refused picker picks again in place, and a final-recoupling repick goes to the end.
        if (r.pm.finalRecoupling) continue;
        expect(tier(ps[i].extra.storyRole), `seed ${seed} ep${r.num} pick ${i}`).toBeGreaterThanOrEqual(tier(ps[i - 1].extra.storyRole));
        if (ps[i].extra.storyRole === 'a') seen++;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('ends every villa episode on a hook, the last scene of the episode', async () => {
    const { phasesOf } = await import('../js/pm/transcript.js');
    for (const seed of SEEDS) {
      const { rows } = seasons[seed];
      const finalEp = rows.find(r => r.moment === 'final')?.num ?? Infinity;
      let hooks = 0, villa = 0;
      for (const r of rows) {
        if (r.num >= finalEp - 1 || r.pm?.casaRoom || ['casa-open', 'casa-nights'].includes(r.moment)) continue;
        villa++;
        const phases = phasesOf(r);
        if (phases[phases.length - 1][0] === 'hook') hooks++;
        expect(phases.slice(0, -1).some(p => p[0] === 'hook'), `seed ${seed} ep${r.num}: a hook only ever last`).toBe(false);
      }
      expect(hooks, `seed ${seed}`).toBeGreaterThanOrEqual(villa - 2);
    }
  });

  it('scores a story by what it puts at stake, proportionally', () => {
    const state = { ep: 5, villa: ['A', 'B', 'C'], couples: [['B', 'C']], profiles: {} };
    const graft = { type: 'graft', ep: 3, heat: 1, c: 'A', t: 'B', p: 'C' };
    const progress = { type: 'progress', ep: 3, heat: 1, a: 'B', b: 'C' };
    expect(storyScore(state, graft)).toBeGreaterThan(storyScore(state, progress));
    expect(storyScore(state, { ...graft, ep: 1 })).toBeGreaterThan(storyScore(state, graft));
  });
});
