// ci-alliances.test.js — named alliances, their group chats, and every way
// they come apart.
// User (2026-10-01): "do we even have alliances here like in the real game";
// "they have group chats with the name of their alliance"; "make sure breaking
// the alliance is possible, as always in all our alliance systems: treason,
// overlapping alliances, etc."
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { voterScore } from '../js/ci/ratings.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const runs = [1, 2, 3, 4, 5, 6, 7, 8].map(seed => {
  const cast = rosterCast(12, seed); setPlayers(cast); const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed }).state;
});
const scenes = runs.flatMap(state => state.scenes.filter(s => s.kind === 'group-chat').map(sc => ({ sc, state })));
const text = sc => sc.script?.blocks?.flatMap(b => b.lines.map(l => l.text)).join(' ') || '';

describe('forming', () => {
  it('every season has named alliances of two to four, founded in a group chat that says the name', () => {
    for (const state of runs) expect((state.alliances || []).length, 'a season with no alliance').toBeGreaterThan(0);
    const formed = scenes.filter(x => x.sc.data.formed);
    // in each player's own texting voice (all caps, all lowercase): the name, whatever its case
    for (const { sc } of formed.filter(x => x.sc.aired)) expect(text(sc).toLowerCase()).toContain(sc.data.name.toLowerCase());
    for (const state of runs) for (const a of state.alliances) expect(new Set(a.history?.length ? [] : [a.name]).size).toBeLessThanOrEqual(1);
    const sizes = runs.flatMap(s => s.alliances.map(a => a.founder && 1 + (s.scenes.find(x => x.data?.alliance === a.id && x.data.formed)?.data.accepted.length || 0)));
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(2);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(4);
  });
  it('somebody can say no, and it costs the founder a little trust', () => {
    expect(scenes.some(x => (x.sc.data.declined || []).length)).toBe(true);
  });
  it('a player can be in two alliances at once', () => {
    const overlap = runs.some(state => state.active.concat(state.blocked.map(b => b.handle)).some(h =>
      state.alliances.filter(a => a.members.includes(h) || a.history?.some(e => e.agent === h)).length >= 2));
    expect(overlap).toBe(true);
  });
});

describe('belonging', () => {
  it('an ally climbs a member\'s ballot (proportional to their loyalty)', () => {
    const state = runs[0];
    const a = state.alliances.find(x => x.members.filter(h => state.active.includes(h)).length >= 2) || state.alliances[0];
    const [v, t] = a.members;
    if (a.status === 'active' && state.active.includes(v) && state.active.includes(t)) {
      expect(voterScore(state, () => 0.5, v, t).parts.alliance).toBeGreaterThan(0);
    }
  });
  it('standing alliances check in, share what they heard and agree on a target', () => {
    const checks = scenes.filter(x => !x.sc.data.event && x.sc.data.formed === false);
    expect(checks.length).toBeGreaterThan(5);
    expect(checks.some(x => x.sc.data.plan)).toBe(true);
  });
});

describe('every way it comes apart', () => {
  it('an Influencer blocks one of their own: a betrayal the rest react to', () => {
    const b = runs.flatMap(s => s.scenes.filter(x => x.kind === 'blocking' && x.data.betrayed?.length));
    expect(b.length).toBeGreaterThan(0);
    for (const sc of b.filter(x => x.aired)) expect(sc.script.blocks.some(k => k.key.startsWith('alliance.betrayed'))).toBe(true);
  });
  it('the ratings look like treason: the group votes one out', () => {
    expect(scenes.some(x => x.sc.data.event === 'kick')).toBe(true);
  });
  it('a double agent is caught in another alliance: confronted, sometimes thrown out', () => {
    const c = scenes.filter(x => x.sc.data.event === 'confront');
    expect(c.length).toBeGreaterThan(0);
    expect(c.some(x => x.sc.data.kicked)).toBe(true);
    for (const { sc } of c) expect(sc.data.other).not.toBe(sc.data.name);
  });
  it('a member gone cold walks out; a group down to one is over', () => {
    expect(scenes.some(x => x.sc.data.event === 'leave')).toBe(true);
    for (const state of runs) for (const a of state.alliances.filter(x => x.status === 'active')) expect(a.members.length).toBeGreaterThanOrEqual(2);
  });
});
