// ci-party-life.test.js — parties, apartment life, videos from home (Plan 3a).
import { describe, expect, it } from 'vitest';
import { streamFor } from '../js/dr/rng.js';
import { rel, bump } from '../js/ci/state.js';
import { mood } from '../js/ci/mind.js';
import { runCircleChat } from '../js/ci/feed.js';
import { runParty } from '../js/ci/party.js';
import { NEVER_HAVE_I_EVER, PARTY_THEMES } from '../js/ci/games-data.js';
import { room } from './helpers/ci-room.js';

describe('parties', () => {
  it('never throws the same theme twice, and delivers its props', () => {
    const s = room(6, 1);
    const seen = [];
    for (let i = 0; i < PARTY_THEMES.length; i++) {
      const sc = runParty(s, streamFor(1, `p${i}`));
      expect(sc.kind).toBe('party');
      expect(sc.data.props.length).toBeGreaterThanOrEqual(3);
      seen.push(sc.data.theme);
    }
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('plays Never Have I Ever: four rounds, statements from the list, admissions public', () => {
    const s = room(6, 2);
    const sc = runParty(s, streamFor(2, 'p'));
    expect(sc.data.rounds).toHaveLength(4);
    for (const r of sc.data.rounds) {
      expect(NEVER_HAVE_I_EVER.map(x => x.id)).toContain(r.statement);
      expect(s.active).toContain(r.by);
    }
    expect(new Set(sc.data.rounds.map(r => r.by)).size).toBe(4);
  });

  it('lowers loneliness for everyone and warms the flirty pairs', () => {
    const s = room(6, 3);
    bump('@q0', '@q1', 'attraction', 5); bump('@q1', '@q0', 'attraction', 5);
    const before = Object.fromEntries(s.active.map(h => [h, mood(s, h, 'loneliness')]));
    runParty(s, streamFor(3, 'p'));
    for (const h of s.active) expect(mood(s, h, 'loneliness')).toBeLessThan(before[h]);
    expect(rel('@q0', '@q1', 'attraction')).toBeGreaterThan(5);
  });

  it('a catfish slips more at a party than in an ordinary Circle Chat (control arm)', () => {
    const count = party => {
      let n = 0;
      for (let seed = 1; seed <= 150; seed++) {
        const s = room(6, seed);
        Object.assign(s.profiles['@q0'], { mode: 'catfish', gap: 2 });
        const before = s.scenes.length;
        if (party) runParty(s, streamFor(seed, 'x')); else runCircleChat(s, streamFor(seed, 'x'));
        for (const sc of s.scenes.slice(before)) n += (sc.data.slips || []).filter(x => x.by === '@q0' && !x.misread).length;
      }
      return n;
    };
    expect(count(true)).toBeGreaterThan(count(false));
  });
});

import { HABITS, habitsOf, apartmentLife, videoFromHome } from '../js/ci/life.js';
import { feel } from '../js/ci/mind.js';

describe('apartment life', () => {
  it('gives each profile two habits that stay the same all season, drawn from who they are', () => {
    const s = room(6, 4);
    s.people.Q0.stats.physical = 10; s.people.Q0.stats.mental = 1;
    const first = Object.fromEntries(s.active.map(h => [h, habitsOf(s, streamFor(4, h), h)]));
    for (const h of s.active) {
      expect(first[h]).toHaveLength(2);
      for (const x of first[h]) expect(HABITS).toContain(x);
    }
    for (let day = 2; day <= 6; day++) { s.day = day; apartmentLife(s, streamFor(4, `l${day}`)); }
    for (const h of s.active) expect(s.habits[h]).toEqual(first[h]);
  });

  it('shows the two loneliest players each day, and the routine helps', () => {
    const s = room(6, 5);
    feel(s, '@q3', 'loneliness', 8); feel(s, '@q4', 'loneliness', 7);
    const before = { q3: 0, q4: 0 };
    before.q3 = s.mind['@q3'].loneliness; before.q4 = s.mind['@q4'].loneliness;
    const scenes = apartmentLife(s, streamFor(5, 'l'));
    expect(scenes.map(x => x.who[0]).sort()).toEqual(['@q3', '@q4']);
    for (const sc of scenes) {
      expect(sc.kind).toBe('life');
      expect(s.habits[sc.who[0]]).toContain(sc.data.habit);
      expect(sc.seenBy).toEqual([sc.who[0]]);
    }
    expect(mood(s, '@q3', 'loneliness') + mood(s, '@q4', 'loneliness')).toBeLessThan(before.q3 + before.q4 + 0.01);
  });
});

describe('videos from home', () => {
  it('is seen by its player only, eases homesickness, and weighs on a catfish', () => {
    const s = room(5, 6);
    Object.assign(s.profiles['@q0'], { mode: 'catfish', gap: 2 });
    feel(s, '@q0', 'homesick', 6); feel(s, '@q1', 'homesick', 6);
    const g0 = mood(s, '@q0', 'guilt'), g1 = mood(s, '@q1', 'guilt');
    const h0 = mood(s, '@q0', 'homesick');
    const scenes = videoFromHome(s, streamFor(6, 'v'), ['@q0', '@q1']);
    expect(scenes).toHaveLength(2);
    for (const sc of scenes) { expect(sc.kind).toBe('home-video'); expect(sc.seenBy).toEqual(sc.who); }
    expect(mood(s, '@q0', 'homesick')).toBeLessThan(h0);
    expect(mood(s, '@q0', 'guilt')).toBeGreaterThan(g0);
    expect(mood(s, '@q1', 'guilt')).toBe(g1);
    expect(s.homeVideosSeen).toEqual(expect.arrayContaining(['@q0', '@q1']));
  });
});
