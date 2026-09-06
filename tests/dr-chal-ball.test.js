// ══════════════════════════════════════════════════════════════════════
// dr-chal-ball.test.js — three walks, one of them built this morning
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { BALL_THEMES } from '../js/dr/chal/ball.js';
import { DRAG_STYLES } from '../js/dr/queen.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { runMaxi, applyEvents } from '../js/dr/maxi.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
});
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve'];
// Spread seeds — consecutive ones barely move this LCG's first draw.
const seeded = i => rngFor(i * 7919 + 13);

function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)])), cfg = {}) {
  return {
    living: Object.keys(players), players, maxi: maxiById('ball'), rng: seeded(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: () => 0, addBond: () => {}, popDelta: () => {}, miniWinner: null, mini: null, cfg,
  };
}

describe('the themes', () => {
  it('are twelve sets of three, with exactly one look built in the room', () => {
    expect(BALL_THEMES.length).toBeGreaterThanOrEqual(12);
    expect(new Set(BALL_THEMES.map(t => t.id)).size).toBe(BALL_THEMES.length);
    for (const t of BALL_THEMES) {
      expect(t.categories.length, t.id).toBe(3);
      expect(t.categories.filter(c => c.sewn).length, t.id).toBe(1);
      for (const c of t.categories) {
        expect(c.label, t.id).toBeTruthy();
        expect(c.styles.length, `${t.id}/${c.label}`).toBeGreaterThan(0);
        for (const s of c.styles) expect(DRAG_STYLES, `${t.id}/${c.label}`).toContain(s);
      }
    }
  });

  it('spreads its categories across styles, so no one queen owns every ball', () => {
    const seen = new Set(BALL_THEMES.flatMap(t => t.categories.flatMap(c => c.styles)));
    expect(seen.size).toBeGreaterThanOrEqual(8);
  });
});

describe('the ball', () => {
  it('hands the week three walks instead of one', () => {
    const out = runMaxi(ctx());
    expect(out.runwayOverride.walks.length).toBe(3);
    expect(out.runwayOverride.walks.filter(w => w.sewn).length).toBe(1);
    expect(out.runwayOverride.theme).toBeTruthy();
  });

  it('honours a booked theme and otherwise picks one', () => {
    expect(runMaxi(ctx(1, undefined, { ballTheme: 'monster-ball' }))
      .performances.Ada.detail.themeId).toBe('monster-ball');
    const picked = new Set();
    for (let i = 0; i < 30; i++) picked.add(runMaxi(ctx(i)).performances.Ada.detail.themeId);
    expect(picked.size, 'every season booked the same ball').toBeGreaterThan(3);
  });

  it('records all three looks per queen, scored separately', () => {
    const out = runMaxi(ctx(2));
    for (const n of NAMES) {
      const looks = out.performances[n].detail.looks;
      expect(looks.length, n).toBe(3);
      expect(looks.filter(l => l.sewn).length, n).toBe(1);
      for (const l of looks) expect(Number.isFinite(l.score), `${n}/${l.label}`).toBe(true);
    }
  });

  it('a seamstress beats a stylist here, because the sewn look counts double', () => {
    const p = Object.fromEntries(NAMES.map(n =>
      [n, mk(n, n === 'Ada' ? { design: 10, runway: 6 } : { design: 3, runway: 8 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, p));
      if (Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Ada') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.45);
  });

  it('a bad build is a malfunction that costs her; a great one is a showstopper', () => {
    const has = (players, type) => {
      for (let i = 0; i < 30; i++) {
        const e = runMaxi(ctx(i, players)).events.find(x => x.type === type);
        if (e) return e;
      }
      return null;
    };
    const bad = has(Object.fromEntries(NAMES.map(n => [n, mk(n, { design: 1 })])), 'wardrobe-malfunction');
    const good = has(Object.fromEntries(NAMES.map(n => [n, mk(n, { design: 10 })])), 'showstopper');
    expect(bad, 'nobody with 1 design ever fumbled a garment').toBeTruthy();
    expect(Object.values(bad.pop)[0]).toBeLessThan(0);
    expect(good, 'nobody with 10 design ever built anything').toBeTruthy();
    expect(Object.values(good.pop)[0]).toBeGreaterThan(0);
  });

  it('and the build carries into the walk rather than just being a caption', () => {
    // The same queen, same seed, differing only in what she managed to sew.
    const score = design => {
      let s = 0;
      for (let i = 0; i < 30; i++) {
        const p = Object.fromEntries(NAMES.map(n => [n, mk(n, n === 'Ada' ? { design } : {})]));
        s += runMaxi(ctx(i, p)).performances.Ada.detail.looks.find(l => l.sewn).score;
      }
      return s / 30;
    };
    expect(score(9)).toBeGreaterThan(score(2) + 2);
  });

  it('every event it fires survives the consequence check', () => {
    for (let i = 0; i < 20; i++) {
      const c = ctx(i);
      expect(() => applyEvents(runMaxi(c).events, c), `seed ${i}`).not.toThrow();
    }
  });
});
