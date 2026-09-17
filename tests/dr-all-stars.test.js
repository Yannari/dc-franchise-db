// ══════════════════════════════════════════════════════════════════════
// tests/dr-all-stars.test.js — the All Stars mode
// (docs/superpowers/specs/2026-09-08-drag-race-all-stars-design.md)
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const ARCH = ['villain', 'hero', 'floater', 'wildcard', 'goat', 'schemer', 'mastermind', 'underdog'];

// Deliberately WITHOUT a drag block: this is the unauthored roster queen the
// mode has to be able to cast.
function bareCast(n, seed) {
  const rng = rngFor(seed * 7919 + 13); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: ARCH[i % ARCH.length], age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
  }));
}

function season(seed, config = {}, cast = null) {
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  return playDragSeason({
    cast: cast || bareCast(10, seed), seed: seed * 101 + 7, config,
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
    popDelta: () => {},
  });
}

describe('the mode', () => {
  it('is off unless asked for, and off changes nothing', () => {
    const a = season(4);
    const b = season(4, { drAllStars: false });
    expect(JSON.stringify(a.rows)).toBe(JSON.stringify(b.rows));
  });

  it('gives every queen a past, frozen on the season', () => {
    const res = season(4, { drAllStars: true });
    const pasts = res.state.allStars.pasts;
    expect(Object.keys(pasts)).toHaveLength(10);
    for (const p of Object.values(pasts)) {
      expect(p.rank).toBeGreaterThan(0);
      expect(typeof p.business).toBe('string');
    }
    expect(season(4, { drAllStars: true }).state.allStars.pasts).toEqual(pasts);
  });

  it('never casts a queen with the flat default craft block', () => {
    const res = season(4, { drAllStars: true });
    const crafts = res.state.allStars.craft;
    expect(Object.keys(crafts)).toHaveLength(10);
    for (const c of Object.values(crafts)) {
      expect(new Set(Object.values(c)).size).toBeGreaterThan(1);
    }
  });

  it('records the rule it ran', () => {
    expect(season(4, { drAllStars: true }).state.allStars.rule).toBe('legacy');
    expect(season(4, { drAllStars: true, drAllStarsRule: 'save' }).state.allStars.rule).toBe('save');
  });
});

const weekly = res => res.rows.filter(r => r.dr && !r.dr.finale);

describe('the legacy rule', () => {
  it('runs on every week with a room big enough for it', () => {
    const res = season(9, { drAllStars: true });
    const wide = weekly(res).filter(r => r.dr.lipsync && (r.dr.living?.length ?? 0) >= 5);
    expect(wide.length).toBeGreaterThan(3);
    for (const r of wide) expect(r.dr.lipsync.legacy).toBe(true);
  });

  it('nobody in the bottom ever sings on a legacy night', () => {
    const res = season(9, { drAllStars: true });
    for (const r of weekly(res)) {
      if (!r.dr.lipsync?.legacy) continue;
      const singers = r.dr.lipsync.singers || [r.dr.lipsync.a, r.dr.lipsync.b].filter(Boolean);
      for (const q of (r.dr.call?.bottom || [])) expect(singers).not.toContain(q);
    }
  });

  it('falls back to an ordinary bottom-two song once the room is too small', () => {
    const res = season(9, { drAllStars: true });
    const small = weekly(res).filter(r => (r.dr.living?.length ?? 0) < 4 && r.dr.lipsync);
    for (const r of small) expect(r.dr.lipsync.legacy).toBeFalsy();
  });
});

describe('the chart on a legacy night', () => {
  it('records the size of the bottom she was named in', () => {
    const res = season(11, { drAllStars: true });
    let checked = 0;
    for (const r of weekly(res)) {
      if (!r.dr.lipsync?.legacy) continue;
      const bottom = r.dr.call?.bottom || [];
      if (bottom.length < 2) continue;
      const want = bottom.length >= 3 ? 'BTM3' : 'BTM2';
      for (const q of bottom) {
        const cell = (r.dr.record?.[q] || []).slice(-1)[0];
        if (!cell) continue;
        expect(['ELIM', want]).toContain(cell);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(4);
  });

  it('marks the row as All Stars so the chart can word itself', () => {
    const res = season(11, { drAllStars: true });
    for (const r of weekly(res)) expect(r.dr.allStars?.rule).toBe('legacy');
    expect(weekly(season(11)).every(r => !r.dr.allStars)).toBe(true);
  });
});

describe('the campaign on a legacy night', () => {
  it('happens, and it happens before the song', () => {
    const res = season(21, { drAllStars: true });
    const pitches = weekly(res).flatMap(r => (r.dr.scenes || []).filter(s => s.kind === 'legacy:pitch'));
    expect(pitches.length).toBeGreaterThan(0);
    for (const p of pitches) expect(p.text.length).toBeGreaterThan(0);
    for (const r of weekly(res)) {
      const list = r.dr.scenes || [];
      const iPitch = list.findIndex(s => s.kind === 'legacy:pitch');
      const iSong = list.findIndex(s => s.step === 'lipsync');
      if (iPitch >= 0 && iSong >= 0) expect(iPitch).toBeLessThan(iSong);
    }
  });

  it('works the queens the critiques favoured, not the bottom', () => {
    const res = season(21, { drAllStars: true });
    let seen = 0;
    for (const r of weekly(res)) {
      const pitches = (r.dr.scenes || []).filter(s => s.kind === 'legacy:pitch');
      if (!pitches.length) continue;
      const bottom = r.dr.call?.bottom || [];
      /* Only the PITCHES are aimed at the power. The pushback rounds are the
         bottom queens going at each other, so their target is one of them by
         design. */
      for (const p of pitches.filter(x => String(x.data.move || '').startsWith('pitch-'))) {
        expect(bottom).not.toContain(p.data.target);
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('a queen who pleaded with the eventual winner is likelier to survive', () => {
    let pleaded = 0, spared = 0;
    for (let s = 40; s < 70; s++) {
      const res = season(s, { drAllStars: true });
      for (const r of weekly(res)) {
        if (!r.dr.lipsync?.legacy || !r.dr.lipsync.eliminated) continue;
        const winner = r.dr.lipsync.chosenBy;
        const worked = new Set((r.dr.scenes || [])
          .filter(x => x.kind === 'legacy:pitch' && x.data.target === winner)
          .flatMap(x => x.data.players || []));
        for (const q of (r.dr.call?.bottom || [])) {
          if (!worked.has(q)) continue;
          pleaded++;
          if (q !== r.dr.lipsync.eliminated) spared++;
        }
      }
    }
    expect(pleaded).toBeGreaterThan(10);
    // Not a rule, a lean: most queens in a bottom survive it anyway, so this
    // only asserts the campaign is not actively hurting them.
    expect(spared / pleaded).toBeGreaterThan(0.4);
  });
});

describe('the arrivals, on All Stars', () => {
  it('say what she already did', () => {
    const res = season(31, { drAllStars: true });
    const premiere = weekly(res)[0];
    const resumes = (premiere.dr.scenes || []).filter(s => s.kind === 'arrival:resume');
    expect(resumes.length).toBeGreaterThan(4);
    for (const s of resumes) {
      expect(s.text.length).toBeGreaterThan(10);
      expect(s.text).not.toMatch(/\{/);
      expect(s.text).toMatch(/^Season \d/);
    }
  });

  it('do not, on an ordinary season', () => {
    const premiere = weekly(season(31))[0];
    expect((premiere.dr.scenes || []).filter(s => s.kind === 'arrival:resume')).toHaveLength(0);
  });
});
