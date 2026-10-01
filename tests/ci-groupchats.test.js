// ci-groupchats.test.js — the group chats that are not alliances
// (groupchats.js). User, 2026-10-01: "I feel there's not enough group chat."
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rel, bump } from '../js/ci/state.js';
import { peaceChat, planChat, inPlanAgainst, PEACE_CHANCE, PLAN_CHANCE } from '../js/ci/groupchats.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { room } from './helpers/ci-room.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const runs = [1, 2, 3, 4, 5, 6].map(seed => {
  const cast = rosterCast(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
});
const all = runs.flatMap(r => r.state.scenes.filter(s => s.kind === 'group-chat').map(sc => ({ sc, state: r.state })));
const of = ev => all.filter(x => x.sc.data.event === ev);

describe('a season has group chats beyond its alliances', () => {
  it('more than one an episode, and each kind turns up', () => {
    const eps = runs.reduce((n, r) => n + r.rows.length, 0);
    expect(all.length / eps).toBeGreaterThan(1.2);
    for (const ev of ['squad', 'peace', 'plan']) expect(of(ev).length, ev).toBeGreaterThan(0);
  });
  it('every one is written and airs as a group chat', () => {
    for (const ev of ['squad', 'peace', 'plan']) for (const { sc } of of(ev)) expect(sc.script?.blocks?.length, ev).toBeGreaterThan(1);
  });
});

describe('a friend group', () => {
  it('is named by whoever starts it; a girls\' or guys\' name only when it is all girls or all guys', () => {
    const GIRLS = ['The Girls', 'Girls Just Wanna Have Fun', 'Queens Only', 'The Glam Squad', 'Sisterhood', 'The Besties', 'Hot Girl Chat'];
    for (const { sc, state } of of('squad')) {
      expect(sc.data.name).toBeTruthy();
      expect(sc.who.length).toBeGreaterThanOrEqual(3);
      if (GIRLS.includes(sc.data.name)) for (const h of sc.who) expect(state.profiles[h].shown.gender).toBe('f');
      // (a player who types in lowercase types the name in lowercase too)
      expect(sc.script.blocks[0].lines.some(l => `${l.text} ${l.spoken || ''}`.toLowerCase().includes(sc.data.name.toLowerCase()))).toBe(true);
    }
  });
});

describe('clearing the air', () => {
  it('a warm talk cools the feud and warms both to the peacemaker; a cold one makes it worse', () => {
    for (const [roll, want] of [[0, 'warm'], [0.99, 'neutral']]) {
      const s = room(6);
      bump('@q0', '@q1', 'resentment', 6); bump('@q1', '@q0', 'resentment', 5);
      for (const x of ['@q0', '@q1']) { bump('@q2', x, 'affection', 5); bump(x, '@q2', 'affection', 3); }
      const before = rel('@q0', '@q1', 'resentment');
      const sc = peaceChat(s, () => (roll === 0 ? 0 : roll));
      expect(PEACE_CHANCE).toBeGreaterThan(0);
      if (!sc) continue;
      expect(sc.data.mediator).toBe('@q2');
      expect(sc.data.ending).toBe(want);
      expect(rel('@q0', '@q1', 'resentment')).toBeLessThan(before);
    }
    const s = room(6);
    bump('@q0', '@q1', 'resentment', 9); bump('@q1', '@q0', 'resentment', 9);
    for (const x of ['@q0', '@q1']) { bump('@q2', x, 'affection', 5); bump(x, '@q2', 'affection', 3); }
    const seq = [0, 0, 0.6]; let i = 0;
    const sc = peaceChat(s, () => seq[Math.min(i++, seq.length - 1)]);
    if (sc?.data.ending === 'cold') expect(rel('@q0', '@q1', 'resentment')).toBeGreaterThan(9);
  });
});

describe('a ratings plan', () => {
  it('names someone outside the chat; whoever agrees rates them down; whoever says no knows about it', () => {
    for (const { sc, state } of of('plan')) {
      expect(sc.who).not.toContain(sc.data.target);
      expect(sc.who[0]).toBe(sc.data.by);
      const c = state.claims.find(x => x.kind === 'targeting' && x.holder === sc.data.by && x.about === sc.data.target && x.day === sc.day);
      for (const d of sc.data.declined) expect(state.know[d]?.[c.id]).toBeTruthy();
    }
    const s = room(7);
    for (const o of ['@q1', '@q2']) { bump('@q0', o, 'trust', 3); bump('@q0', o, 'affection', 3); bump(o, '@q0', 'trust', 4); bump(o, '@q0', 'affection', 4); }
    bump('@q0', '@q5', 'resentment', 6);
    const sc = planChat(s, () => 0);
    expect(PLAN_CHANCE).toBeGreaterThan(0);
    expect(sc.data.target).toBe('@q5');
    for (const a of sc.data.agreed) expect(inPlanAgainst(s, a, '@q5')).toBe(true);
    expect(inPlanAgainst(s, '@q0', '@q5')).toBe(true);
    s.day += 2;
    expect(inPlanAgainst(s, '@q0', '@q5')).toBe(false);
  });
  it('never brings in someone holding a grudge against the one asking', () => {
    const s = room(7);
    for (const o of ['@q1', '@q2', '@q3']) { bump('@q0', o, 'trust', 3); bump('@q0', o, 'affection', 3); bump(o, '@q0', 'trust', 4); bump(o, '@q0', 'affection', 4); }
    bump('@q1', '@q0', 'trust', 3); bump('@q1', '@q0', 'resentment', 4);   // closest, but sore
    const sc = planChat(s, () => 0);
    expect(sc.who).not.toContain('@q1');
  });
});
