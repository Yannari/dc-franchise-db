// ci-visit-clash.test.js — a visit that turns into an argument (user,
// 2026-10-02: "is it possible we have an argument during a visit?").
// ci/blocking.js chooseVisit/clash, lines/visit-clash.js, vp-ci/visit-stage.js.
import { describe, expect, it, beforeEach } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState, bump, rel } from '../js/ci/state.js';
import { initMind } from '../js/ci/mind.js';
import { chooseVisit, clash } from '../js/ci/blocking.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';
import { circleScreens } from '../js/vp-ci/steps.js';
import { stageInner } from '../js/vp-ci/stage.js';

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
function room(over = {}) {
  const s = newState(1); s.day = 4;
  for (const n of ['V', 'I', 'X']) {
    s.people[n] = { name: n, gender: 'f', sexuality: 'straight', archetype: 'floater', stats: { ...STATS, ...(over[n] || {}) }, age: 25 };
    const h = `@${n.toLowerCase()}`;
    s.profiles[h] = { handle: h, players: [n], mode: 'honest', gap: 0, tells: [], shown: { gender: 'f', age: 25 } };
    s.active.push(h); initMind(s, h);
  }
  // the blocked player has gone; the Influencer and one other remain
  s.active = s.active.filter(h => h !== '@v');
  return s;
}

describe('who comes for a fight', () => {
  beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));
  it('the same grudge is a fight in a hothead and a question in a calm player', () => {
    const hot = room({ V: { boldness: 9, temperament: 2 } });
    bump('@v', '@i', 'resentment', 5);
    expect(chooseVisit(hot, () => 0, '@v', ['@i']).motive).toBe('confront');
    setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });
    const calm = room({ V: { boldness: 3, temperament: 8 } });
    bump('@v', '@i', 'resentment', 5);
    expect(chooseVisit(calm, () => 0, '@v', ['@i']).motive).toBe('answers');
  });
});

describe('what the argument costs', () => {
  beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));
  it('a short-fused Influencer fires back, comes out shaken and resents the visitor', () => {
    const s = room({ V: { boldness: 9, temperament: 2 }, I: { boldness: 9, temperament: 2 } });
    bump('@v', '@i', 'resentment', 6);
    const stress = s.mind['@i'].stress;
    const c = clash(s, streamFor(1, 'c'), '@v', '@i');
    expect(c.style).toBe('fire');
    expect(s.mind['@i'].stress).toBeGreaterThan(stress);
    expect(rel('@i', '@v', 'resentment')).toBeGreaterThan(0);
  });
  it('an even-tempered Influencer takes it, and feels it', () => {
    const s = room({ V: { boldness: 9, temperament: 2 }, I: { boldness: 3, temperament: 9 } });
    const guilt = s.mind['@i'].guilt;
    const c = clash(s, streamFor(2, 'c'), '@v', '@i');
    expect(c.style).toBe('take');
    expect(s.mind['@i'].guilt).toBeGreaterThan(guilt);
  });
});

describe('arguments in played seasons', () => {
  it('happen about once a season, play as an argument, and the room runs hot', () => {
    let visits = 0, clashes = 0, heated = 0;
    const ends = new Set(), styles = new Set();
    for (let seed = 1; seed <= 20; seed++) {
      const cast = rosterCast(13, seed); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { rows } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed });
      for (const row of rows) for (const s of (row.ci.aired || []).filter(x => x.kind === 'visit')) {
        visits++;
        const cl = s.d?.clash;
        if (!cl) continue;
        clashes++; ends.add(cl.end); styles.add(cl.style);
        const keys = s.script.blocks.map(b => b.key);
        expect(keys).toContain(`visit.talk.confront.${cl.style}`);
        expect(keys).toContain(`visit.talk2.confront.${cl.end}`);
        expect(keys).not.toContain('visit.kiss');
        // the viewer: the argument's own lines play in a heated room
        if (heated < 3) {
          const screen = circleScreens(row).find(x => x.kind === 'visit' && x.d?.clash);
          const i = screen.steps.findIndex(x => /^visit\.talk\.confront/.test(x.key || ''));
          const div = document.createElement('div'); div.innerHTML = stageInner(row, screen, i, false);
          expect(div.querySelector('.cva.heated'), 'heated room').not.toBeNull();
          heated++;
        }
      }
    }
    const rate = clashes / visits;
    expect(rate).toBeGreaterThan(0.05);
    expect(rate).toBeLessThan(0.3);
    expect([...ends].sort()).toEqual(['cooled', 'walkout']);
    expect(styles.size).toBeGreaterThanOrEqual(2);
  });
});
