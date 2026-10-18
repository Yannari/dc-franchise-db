// The Ridonculous Race: threads that carry storylines across legs (engine plan, Task 14).
import { describe, it, expect } from 'vitest';
import { THREADS, advanceThreads, threadSteps } from '../js/rr/threads.js';
import { playScene } from '../js/rr/scenes.js';
import { fixtureCtx } from './helpers/rr-catalogue.js';

const IDS = ['crush', 'rivalry', 'debt', 'secret', 'curse', 'team-bond', 'alliance', 'villain', 'underdog', 'breakup', 'broke', 'injury', 'leader'];

// Play a scene with a forced ending in the fixture and let the threads read it.
function play(ctx, kind, ending, extra = {}) {
  Object.assign(ctx, extra, { _ready: false });
  const sc = playScene(ctx, kind, () => 0.5, { ending });
  advanceThreads(ctx.state, sc);
  return sc;
}
const open = (st, id) => st.threads.filter(t => t.thread === id && !t.closed);

describe('rr threads', () => {
  it('has the thirteen threads of the catalogue', () => {
    expect(Object.keys(THREADS).sort()).toEqual([...IDS].sort());
    for (const t of Object.values(THREADS)) {
      expect(t.opens.length, t.id).toBeGreaterThan(0);
      expect(t.steps.length, t.id).toBeGreaterThan(0);
      expect(['person', 'team', 'teams']).toContain(t.who);
    }
  });

  it('a crush opens, survives an interrupted confession with its weight growing, and closes on a mutual one', () => {
    const ctx = fixtureCtx('crush-noticed');
    const st = ctx.state;
    const [x] = [st.teams[ctx.team.id].a];
    const y = st.teams[ctx.other.id].a;
    play(ctx, 'crush-noticed', 'radar', { people: [x, y] });
    expect(open(st, 'crush')).toHaveLength(1);
    expect(open(st, 'crush')[0].who.sort()).toEqual([x, y].sort());

    play(ctx, 'confession-attempt', 'interrupted', { people: [x, y] });
    expect(open(st, 'crush')).toHaveLength(1);
    const w3 = threadSteps(st, st.people).find(s => s.threadId === open(st, 'crush')[0].id).weight;
    st.leg = 4;
    const w4 = threadSteps(st, st.people).find(s => s.threadId === open(st, 'crush')[0].id).weight;
    expect(w4).toBeGreaterThan(w3);

    play(ctx, 'confession', 'mutual', { people: [x, y] });
    expect(open(st, 'crush')).toHaveLength(0);
    expect(st.threads.find(t => t.thread === 'crush').closed).toBe('confession:mutual');
  });

  it('a rivalry advances through trash talk, a shove and a confrontation', () => {
    const ctx = fixtureCtx('trash-talk', { doerArchetype: 'villain' });
    const st = ctx.state;
    play(ctx, 'trash-talk', 'exchange');
    const r = open(st, 'rivalry')[0];
    expect(r).toBeTruthy();
    const s0 = r.step;
    play(ctx, 'shove', 'shove');
    expect(r.step).toBeGreaterThan(s0);
    const s1 = r.step;
    play(ctx, 'confront', 'denied');
    expect(r.step).toBeGreaterThan(s1);
    expect(r.closed).toBeFalsy();
  });

  it('a closed thread offers nothing', () => {
    const ctx = fixtureCtx('alliance-pitch');
    const st = ctx.state;
    play(ctx, 'alliance-pitch', 'accepted');
    expect(threadSteps(st, st.people).some(s => THREADS.alliance.steps.includes(s.kindId))).toBe(true);
    play(ctx, 'alliance-betrayal', 'discovered', { });
    // a hero can't betray: force the record through a schemer
    if (!open(st, 'alliance').length) {
      expect(threadSteps(st, st.people).filter(s => st.threads.find(t => t.id === s.threadId)?.thread === 'alliance')).toHaveLength(0);
    } else {
      st.threads.find(t => t.thread === 'alliance').closed = 'test';
      expect(threadSteps(st, st.people).filter(s => st.threads.find(t => t.id === s.threadId)?.thread === 'alliance')).toHaveLength(0);
    }
  });

  it('only offers a step when everyone in the thread is there', () => {
    const ctx = fixtureCtx('trash-talk');
    const st = ctx.state;
    play(ctx, 'trash-talk', 'exchange');
    const mine = [st.teams[ctx.team.id].a, st.teams[ctx.team.id].b];
    expect(threadSteps(st, mine).filter(s => st.threads.find(t => t.id === s.threadId).thread === 'rivalry')).toHaveLength(0);
  });

  it('a thread whose team is eliminated closes as gone', () => {
    const ctx = fixtureCtx('money-worry');
    const st = ctx.state;
    st.money[ctx.team.id] = 10;
    play(ctx, 'money-worry', 'plan');
    const b = open(st, 'broke')[0];
    expect(b).toBeTruthy();
    st.gone.push(ctx.team.id);
    advanceThreads(st, null);
    expect(b.closed).toBe('gone');
  });
});
