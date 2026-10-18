// The Ridonculous Race: what the first season read found (engine plan, Task 21 step 4).
// Each test is one contradiction the transcript showed; the mechanism was fixed, not the text.
import { describe, it, expect } from 'vitest';
import { SCENES, playScene, whenOf, interviewAfter, prepare } from '../js/rr/scenes.js';
import { advanceThreads } from '../js/rr/threads.js';
import { talkAtStretch } from '../js/rr/talk.js';
import { playLeg } from '../js/rr/leg.js';
import { PLACES } from '../js/rr/places.js';
import { streamFor } from '../js/dr/rng.js';
import { setGs } from '../js/core.js';
import { fixtureCtx } from './helpers/rr-catalogue.js';
import { raceCast, raceState } from './helpers/rr-cast.js';

describe('rr season read (2026-10-18)', () => {
  it('a team helped by another gains time; nobody gets a negative penalty', () => {
    const ctx = fixtureCtx('help-offer');
    playScene(ctx, 'help-offer', () => 0.5, { ending: 'accepted' });
    for (const v of Object.values(ctx.state.pending)) expect(v).toBeGreaterThanOrEqual(0);
    expect(ctx.delays.some(([id, m]) => id === ctx.other.id && m < 0)).toBe(true);
    setGs({ bonds: {}, popularity: {} });
    const st = raceState(12, 8); st.lastOrder = [...st.order]; st.leg = 1;
    const r = playLeg(st, { n: 2, kind: 'elim', money: 100 }, PLACES['red-sand-desert'], PLACES['fire-mountain-isle'], streamFor(8, 'g'));
    for (const v of Object.values(r.penalties)) expect(v).toBeGreaterThanOrEqual(0);
  });

  it('Don meets each team on the mat at the minute it arrives', () => {
    setGs({ bonds: {}, popularity: {} });
    const st = raceState(8, 9); st.lastOrder = [...st.order]; st.leg = 1;
    const r = playLeg(st, { n: 2, kind: 'elim', money: 100, reward: 'cash' }, PLACES['red-sand-desert'], PLACES['fire-mountain-isle'], streamFor(9, 'd'));
    const places = r.scenes.filter(s => s.kind === 'don-place');
    expect(places.length).toBeGreaterThan(5);
    for (const s of places) {
      const mat = r.log.find(l => l.id === s.data.team && l.stretch === 'mat');
      expect(s.data.t, s.data.team).toBe(mat.from);
    }
  });

  it('an interview follows only a moment that mattered, and says what it was', () => {
    // trivial: a clear tip
    const a = fixtureCtx('tip-read');
    const tip = playScene(a, 'tip-read', () => 0.5, { ending: 'clear' });
    for (let s = 1; s <= 30; s++) expect(interviewAfter(a.state, tip, streamFor(s, 'i'))).toBeNull();
    // a caught scheme is never 'proud'
    const b = fixtureCtx('push', { doerArchetype: 'villain' });
    const push = playScene(b, 'push', () => 0.5, { ending: 'seen' });
    for (let s = 1; s <= 40; s++) {
      const iv = interviewAfter(b.state, push, streamFor(s, 'p'));
      if (iv?.kind === 'int-strategy') expect(iv.data.ending).toBe('justifies');
      b.state.scenes = b.state.scenes.filter(x => !x.kind.startsWith('int-'));
    }
    // a team you just helped is respected, not feared
    const c = fixtureCtx('help-offer');
    const help = playScene(c, 'help-offer', () => 0.5, { ending: 'accepted' });
    for (let s = 1; s <= 40; s++) {
      const iv = interviewAfter(c.state, help, streamFor(s, 'h'));
      if (iv?.kind === 'int-about-team') expect(iv.data.ending).toBe('respect');
      c.state.scenes = c.state.scenes.filter(x => !x.kind.startsWith('int-'));
    }
  });

  it('a warm moment with another team is never felt as hurt', () => {
    const ctx = fixtureCtx('plane-row');
    ctx.moment = 'plane';
    const sc = playScene(ctx, 'plane-row', () => 0.5, { ending: 'seatmates-talk' });
    for (let s = 1; s <= 60; s++) {
      const iv = interviewAfter(ctx.state, sc, streamFor(s, 'w'));
      if (iv?.kind === 'int-feeling') expect(iv.data.ending).toBe('glad');
      ctx.state.scenes = ctx.state.scenes.filter(x => !x.kind.startsWith('int-'));
    }
  });

  it('an old wound that came out does not keep coming out', () => {
    const ctx = fixtureCtx('old-wound');
    ctx.moment = 'fail';
    const before = whenOf(SCENES['old-wound'], ctx);
    const sc = playScene(ctx, 'old-wound', () => 0.5, { ending: 'surfaces' });
    advanceThreads(ctx.state, sc);
    const told = playScene(Object.assign(ctx, { _ready: false }), 'old-wound', () => 0.5, { ending: 'told-calmly' });
    advanceThreads(ctx.state, told);
    expect(before).toBeGreaterThan(0);
    expect(whenOf(SCENES['old-wound'], Object.assign(ctx, { _ready: false }))).toBeLessThanOrEqual(before * 0.2);
  });

  it('nobody sabotages or lies to a team it is allied with', () => {
    for (const k of ['push', 'steal', 'course-sabotage', 'fake-shortcut', 'mind-game', 'lie']) {
      const ctx = fixtureCtx(k, { doerArchetype: 'villain' });
      ctx.moment = 'overlap';
      ctx.state.rivalry[[ctx.team.id, ctx.other.id].sort().join('|')] = 3;
      ctx.state.alliances.push({ id: 1, teams: [ctx.team.id, ctx.other.id], since: 1, ended: null });
      expect(whenOf(SCENES[k], ctx), k).toBe(0);
    }
  });

  it('a room changes only the people seated in it', () => {
    for (const [k, e] of [['plane-row', 'fear-of-flying'], ['bus-ride', 'squabble'], ['bus-ride', 'lead-lost'], ['closed-for-night', 'prank']]) {
      const ctx = fixtureCtx(k);
      const st = ctx.state;
      const seat = [st.teams[st.order[0]].a, st.teams[st.order[1]].b, st.teams[st.order[2]].a, st.teams[st.order[3]].b];
      ctx.people = seat;
      ctx.moment = SCENES[k].moments[0];
      const sc = playScene(ctx, k, () => 0.5, { ending: e });
      for (const ef of sc.data.effects) {
        if (ef[0] === 'bond') { expect(seat, `${k}/${e}`).toContain(ef[1]); expect(seat).toContain(ef[2]); }
        if (ef[0] === 'mind') expect(seat, `${k}/${e}`).toContain(ef[1]);
      }
    }
  });

  it('a crush can be either partner of either team, and one person carries one crush at a time', () => {
    const seen = new Set();
    for (let s = 1; s <= 60; s++) {
      const ctx = fixtureCtx('flirt', { seed: s });
      ctx.moment = 'overlap';
      if (whenOf(SCENES.flirt, ctx) <= 0) continue;
      const sc = playScene(ctx, 'flirt', () => 0.5, { ending: 'returned' });
      const t1 = ctx.state.teams[ctx.team.id];
      seen.add(sc.data.facts.lovers[0] === t1.a ? 'a' : 'b');
    }
    expect([...seen].sort()).toEqual(['a', 'b']);
    // an open crush on someone else makes a new one rare
    const ctx = fixtureCtx('crush-noticed', { seed: 3 });
    ctx.moment = 'overlap';
    const w0 = whenOf(SCENES['crush-noticed'], ctx);
    if (w0 > 0) {
      const [x] = prepare(ctx) && [ctx.A];
      ctx.state.threads = [{ id: 'th1', thread: 'crush', who: [x, 'Somebody Else'], step: 1, since: 1, lastLeg: 1, closed: null }];
      const ctx2 = Object.assign(ctx, { _ready: false, _lovers: null });
      expect(whenOf(SCENES['crush-noticed'], ctx2)).toBeLessThanOrEqual(w0 * 0.2);
    }
  });

  it('partners only gloat when someone is there to hear it, and plan the leg at its start', () => {
    const ctx = fixtureCtx('celebrate');
    ctx.present = [ctx.team.id];
    expect(SCENES.celebrate._endings['gloat-at-others'].w(prepare(ctx))).toBe(0);
    const p = fixtureCtx('plan-the-leg');
    p.stretch = { id: 'run', kind: 'travel', mode: 'foot', base: 10 };
    p.moment = 'quiet';
    const late = whenOf(SCENES['plan-the-leg'], p);
    const q = fixtureCtx('plan-the-leg');
    q.stretch = { id: 'airport', kind: 'travel', mode: 'flight', base: 300 };
    q.moment = 'plane';
    expect(late).toBeLessThan(whenOf(SCENES['plan-the-leg'], q));
  });

  it('a cast never has two teams with the same identity', () => {
    for (const seed of [1, 2, 3, 4]) {
      const ids = raceCast(18, seed).teams.map(t => t.identity).filter(Boolean);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
