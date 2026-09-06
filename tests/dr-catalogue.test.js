// ══════════════════════════════════════════════════════════════════════
// dr-catalogue.test.js — the eighteen maxi types, the minis, the songs
// ══════════════════════════════════════════════════════════════════════
//
// The description rule is enforced here and it is not a style note: `desc` is
// the only place the viewer is told what the queens are physically DOING. The
// narration says what happened, not what the rules were, so a one-line desc
// leaves a result nobody can follow.
import { describe, expect, it } from 'vitest';
import { MAXI_TYPES, TENTPOLES, maxiById } from '../js/dr/data/challenges.js';
import { MINI_TYPES, miniById } from '../js/dr/data/minis.js';
import { SONGS, songById } from '../js/dr/data/songs.js';
import { DRAG_STATS } from '../js/dr/queen.js';

describe('maxi catalogue', () => {
  it('has the fan wiki\'s types, with the Roast split out, six of them tentpoles', () => {
    // NINETEEN, not the wiki's eighteen, and the difference is deliberate.
    // The wiki files the Roast under Stand-Up because they share a mechanic —
    // a running order, a written set, a live room. They are different WEEKS to
    // book, though: a roast has a guest of honour and a panel to insult, and
    // one of the six tentpoles is the Roast specifically. So they are two
    // entries here and one module in js/dr/chal/, which is the right split:
    // the catalogue is what a season can schedule, not what the wiki counts.
    expect(MAXI_TYPES.length).toBe(19);
    expect(new Set(MAXI_TYPES.map(m => m.id)).size).toBe(19);
    expect(maxiById('roast')).toBeTruthy();
    expect(maxiById('stand-up')).toBeTruthy();
    expect(TENTPOLES.length).toBe(6);
    for (const t of TENTPOLES) expect(maxiById(t)?.tentpole, `${t} is not a tentpole`).toBe(true);
    expect(MAXI_TYPES.filter(m => m.tentpole).length).toBe(6);
  });

  it('every entry is well-formed', () => {
    for (const m of MAXI_TYPES) {
      const sum = Object.values(m.blend).reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1), `${m.id}'s blend does not sum to 1`).toBeLessThan(1e-9);
      // A blend may only name real craft stats. This is where an invented one
      // ("improv", which this show folded into acting) would show up.
      for (const k of Object.keys(m.blend)) expect(DRAG_STATS, `${m.id} blends ${k}`).toContain(k);
      expect(['pre', 'main'], m.id).toContain(m.stage);
      expect(['solo', 'pairs', 'teams', 'cast', 'partnered'], m.id).toContain(m.format);
      expect(['themed', 'design', 'ball', 'makeover'], m.id).toContain(m.runway);
      expect(['none', 'draft', 'captains', 'host', 'random'], m.id).toContain(m.assignment);
      expect([null, 'characters', 'parts', 'slots'], m.id).toContain(m.roles);
      expect(m.minCast, m.id).toBeGreaterThanOrEqual(4);
      expect(m.chalStyle, m.id).toBeTruthy();
    }
  });

  it('every description tells the viewer what they are actually doing', () => {
    for (const m of MAXI_TYPES) {
      // Two sentences minimum and 200 characters minimum, the same bar the
      // Big Brother comp descriptions are held to.
      expect(m.desc.length, `${m.id}'s desc is too short to explain anything`).toBeGreaterThan(200);
      expect(m.desc.split(/[.!?] /).length, `${m.id}'s desc is one sentence`).toBeGreaterThan(2);
      // It has to say what goes WRONG, or the result reads as arbitrary.
      expect(m.desc, `${m.id}'s desc never says what fails`).toMatch(/fail|wrong|sink|bur|lose|los|dies|cost|bomb/i);
      // And how you win. Singular or plural: "the biggest laughs win" and
      // "the strongest trio wins" both state the win condition.
      expect(m.desc, `${m.id}'s desc never says how to win`).toMatch(/\bwins?\b/i);
    }
  });

  it('the challenge styles spread, so the scheduler can avoid repeats', () => {
    const styles = new Set(MAXI_TYPES.map(m => m.chalStyle));
    expect(styles.size, 'too few styles for category-aware pacing').toBeGreaterThanOrEqual(3);
    // No single style may dominate, or "never two in a row" becomes unsatisfiable.
    for (const s of styles) {
      const n = MAXI_TYPES.filter(m => m.chalStyle === s).length;
      expect(n, `${s} covers too much of the catalogue`).toBeLessThan(MAXI_TYPES.length * 0.6);
    }
  });

  it('maxiById refuses to guess', () => {
    expect(maxiById('nonsense')).toBe(null);
  });
});

describe('minis', () => {
  it('each buys something in the maxi', () => {
    expect(MINI_TYPES.length).toBeGreaterThanOrEqual(6);
    for (const m of MINI_TYPES) {
      expect(['pick-order', 'captain', 'first-pick', 'prize'], m.id).toContain(m.buys);
      const sum = Object.values(m.blend).reduce((a, b) => a + b, 0);
      expect(Math.abs(sum - 1), `${m.id}'s blend does not sum to 1`).toBeLessThan(1e-9);
      for (const k of Object.keys(m.blend)) expect(DRAG_STATS, `${m.id} blends ${k}`).toContain(k);
    }
    expect(miniById('nonsense')).toBe(null);
  });
});

describe('songs', () => {
  it('are tagged so the lip sync can read them', () => {
    expect(SONGS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(SONGS.map(s => s.title)).size, 'a title appears twice').toBe(SONGS.length);
    for (const s of SONGS) {
      expect(['ballad', 'mid', 'dance', 'uptempo'], s.title).toContain(s.tempo);
      expect(['sad', 'fierce', 'funny', 'sexy', 'rage'], s.title).toContain(s.mood);
      expect(['breakdown', 'key-change', 'spoken', 'dance-break', 'none'], s.title).toContain(s.hook);
      expect(s.artist, `${s.title} has no artist`).toBeTruthy();
    }
  });

  it('covers every mood and tempo, so no lip sync is unplayable', () => {
    for (const mood of ['sad', 'fierce', 'funny', 'sexy', 'rage']) {
      expect(SONGS.filter(s => s.mood === mood).length, `no ${mood} song`).toBeGreaterThan(1);
    }
    for (const tempo of ['ballad', 'mid', 'dance', 'uptempo']) {
      expect(SONGS.filter(s => s.tempo === tempo).length, `no ${tempo} song`).toBeGreaterThan(1);
    }
    expect(songById('nonsense')).toBe(null);
  });
});
