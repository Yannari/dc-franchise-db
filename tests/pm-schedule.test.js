// ══════════════════════════════════════════════════════════════════════
// pm-schedule.test.js — the season's length follows the cast
// ══════════════════════════════════════════════════════════════════════
//
// User: "freedom of the cast — a minimum but no maximum", and "automatic,
// with an option of setting it myself". The fixed sixteen episodes had room
// for six bombshells; a seventh never walked in.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { SEASON_TEMPLATE, buildSchedule, defaultRoleSplit, defaultRoleFor, minimumEpisodes, assignRoles } from '../js/pm/schedule.js';
import { makeIslanders } from './helpers/pm-cast.js';

const arrivals = s => s.reduce((t, e) => t + (e.arrivals?.bombshell || 0), 0);

describe('the builder', () => {
  it('builds EXACTLY the calibration season for the 22-islander cast', () => {
    const strip = s => s.map(({ dumpFormat, bottom, ...e }) => e);
    // The engine's days are the calibration's; the calendar is only the labels.
    expect(buildSchedule({ bombshells: 6, casa: 6 }).map(({ calendar, ...e }) => e)).toEqual(strip(SEASON_TEMPLATE));
    expect(defaultRoleSplit(22)).toEqual({ starters: 10, casa: 6, bombshells: 6 });
  });
  it(`the calendar runs eight weeks whatever the cast (user: "spread the days so it's 8 weeks")`, () => {
    for (const sh of [{ bombshells: 8, casa: 8 }, { bombshells: 6, casa: 6 }, { bombshells: 4, casa: 0 }, { bombshells: 6, casa: 6, episodes: 24 }]) {
      const cal = buildSchedule(sh).filter(e => e.calendar).map(e => e.calendar);
      expect(cal[0][0], JSON.stringify(sh)).toBe(1);
      expect(cal[cal.length - 1][1], JSON.stringify(sh)).toBe(57);
      // No gaps, no overlaps: each episode starts the day after the last one ended.
      for (let i = 1; i < cal.length; i++) expect(cal[i][0], JSON.stringify(sh)).toBe(cal[i - 1][1] + 1);
    }
  });
  it('every bombshell has a night to walk in, at every size and length', () => {
    for (let b = 0; b <= 24; b++) for (const casa of [0, 6, 12]) for (const episodes of [null, 12, 18, 30]) {
      expect(arrivals(buildSchedule({ bombshells: b, casa, episodes })), `b${b} c${casa} e${episodes}`).toBe(b);
    }
  });
  it('no bombshell night without a bombshell, and episodes are numbered 1..n', () => {
    for (let b = 0; b <= 20; b += 3) {
      const s = buildSchedule({ bombshells: b, casa: 6 });
      expect(s.filter(e => e.moment === 'bombshell' && !e.arrivals?.bombshell)).toEqual([]);
      expect(s.map(e => e.ep)).toEqual(s.map((_, i) => i + 1));
      expect(s.at(-1).moment).toBe('reunion');
    }
  });
  it("the author's length is kept, within the spine's minimum", () => {
    for (const episodes of [11, 14, 20, 27]) expect(buildSchedule({ bombshells: 6, casa: 6, episodes }).length).toBe(episodes);
    expect(buildSchedule({ bombshells: 6, casa: 6, episodes: 3 }).length).toBe(minimumEpisodes(6));
  });
  it('a bigger cast makes a longer season, a smaller one a shorter', () => {
    const len = n => buildSchedule(defaultRoleSplit(n)).length;
    expect(len(40)).toBeGreaterThan(len(30));
    expect(len(30)).toBeGreaterThan(len(22));
    expect(len(12)).toBeLessThan(len(22));
  });
});

describe('Starters / Bombshells / Casa Amor (VILLA OPTIONS)', () => {
  const tally = r => ['starter', 'bombshell', 'casa'].map(k => r.filter(x => x === k).length);
  it('all automatic is exactly the automatic split', () => {
    for (const n of [8, 12, 22, 26, 40]) {
      expect(assignRoles(Array(n).fill(null))).toEqual(Array.from({ length: n }, (_, i) => defaultRoleFor(i, n)));
    }
  });
  it('the counts place everyone left on Auto; a role set on an islander stands', () => {
    expect(tally(assignRoles(Array(26).fill(null), { starters: 10, bombshells: 8, casa: 8 }))).toEqual([10, 8, 8]);
    const fixed = Array(26).fill(null); fixed[0] = 'casa'; fixed[25] = 'starter';
    const r = assignRoles(fixed, { starters: 10, bombshells: 8, casa: 8 });
    expect(r[0]).toBe('casa'); expect(r[25]).toBe('starter');
    expect(tally(r)).toEqual([10, 8, 8]);
  });
  it('a count left automatic shares what is left, and automatic starters stay even', () => {
    expect(tally(assignRoles(Array(26).fill(null), { casa: 8 }))).toEqual([10, 8, 8]);
    for (let casa = 0; casa <= 12; casa++) expect(tally(assignRoles(Array(26).fill(null), { casa }))[0] % 2).toBe(0);
  });
});

describe('big casts play out', () => {
  for (const n of [30, 40]) {
    it(`${n} islanders: everyone arrives, and the final is four couples`, () => {
      let fours = 0;
      for (let seed = 1; seed <= 8; seed++) {
        const cast = makeIslanders(n, seed); setPlayers(cast); const names = cast.map(p => p.name);
        const setup = Object.fromEntries(names.map((x, i) => [x, { role: defaultRoleFor(i, n) }]));
        const { rows } = playPerfectMatchSeason({ cast: names, setup, seed });
        const seen = new Set(rows.flatMap(r => [...r.pm.villa, ...(r.exits || []).map(x => x.name)]));
        expect(names.filter(x => !seen.has(x)), `seed ${seed}`).toEqual([]);
        if (rows.find(r => r.moment === 'final').pm.couples.length === 4) fours++;
      }
      // Measured 20 of 20 (30) and 19 of 20 (40) over twenty seeds.
      expect(fours).toBeGreaterThanOrEqual(7);
    });
  }
});
