// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-challenge.test.js — the brief, the draft, prep, and the maxi
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it, beforeEach } from 'vitest';
import {
  rpBuildMini, rpBuildMaxiAnnounce, rpBuildChoice, rpBuildPrep, rpBuildMaxi,
} from '../js/vp-dr/challenge.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { playDragSeason } from '../js/dr/season.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
const { rows } = playDragSeason({
  cast: cast(12, 6), seed: 3,
  bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
});
const ordinary = rows.filter(r => !r.dr.finale);
const strip = h => h.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
const byId = id => ordinary.find(r => r.dr.challenge?.id === id);

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('the brief', () => {
  it('DRAWS THE DESCRIPTION IN FULL', () => {
    /* `desc` is the only place the viewer is told what the queens are
       physically doing — the narration says what happened, not what the
       rules were. A truncated brief leaves a result nobody can follow, which
       is a project rule with its own test on the Big Brother side. */
    for (const row of ordinary) {
      const cat = maxiById(row.dr.challenge.id);
      if (!cat?.desc) continue;
      const text = strip(rpBuildMaxiAnnounce(row)).replace(/\s+/g, ' ');
      expect(text, `episode ${row.num}: the brief was cut`)
        .toContain(cat.desc.replace(/\s+/g, ' ').trim());
    }
  });

  it('names the challenge and its format', () => {
    const row = ordinary[0];
    const html = rpBuildMaxiAnnounce(row);
    expect(html).toContain(row.dr.challenge.name);
    expect(html).toMatch(/dr-fmt/);
  });
});

describe('the maxi', () => {
  it('gives every queen who performed a card, with her score', () => {
    for (const row of ordinary) {
      const html = rpBuildMaxi(row);
      const names = Object.keys(row.dr.performances || {});
      expect(html.length, `episode ${row.num} drew nothing`).toBeGreaterThan(400);
      for (const n of names) expect(html, `${n} on episode ${row.num}`).toContain(n);
      const steps = (html.match(/id="dr-step-maxi-\d+"/g) || []);
      expect(steps.length, `episode ${row.num}`).toBe(names.length);
    }
  });

  it('SNATCH GAME SHOWS THE CHARACTER AND SIX ROUNDS', () => {
    // A generic score card over this would throw away everything that makes
    // a Snatch Game a Snatch Game.
    const row = byId('snatch-game');
    expect(row, 'no Snatch Game in this season').toBeTruthy();
    const html = rpBuildMaxi(row);
    const one = Object.values(row.dr.performances)[0];
    expect(html).toContain(one.detail.character);
    // One mark per round she answered.
    const perQueen = (html.match(/dr-mark/g) || []).length;
    expect(perQueen).toBeGreaterThanOrEqual(one.detail.rounds.length);
  });

  it('THE BALL SHOWS THREE LOOKS AND FLAGS THE SEWN ONE', () => {
    const row = byId('ball');
    expect(row, 'no Ball in this season').toBeTruthy();
    const html = rpBuildMaxi(row);
    const one = Object.values(row.dr.performances)[0];
    for (const look of one.detail.looks) expect(html).toContain(look.label);
    expect(html, 'the sewn look is not marked').toContain('✂');
  });

  it('the makeover names her partner and the team challenges name the team', () => {
    const mk = byId('makeover');
    if (mk) {
      const one = Object.values(mk.dr.performances)[0];
      expect(rpBuildMaxi(mk)).toContain(one.detail.partner);
    }
    const gg = byId('girl-group') || byId('music-video');
    if (gg) expect(rpBuildMaxi(gg)).toMatch(/dr-team/);
  });

  it('THE RAIL NEVER SHOWS A SCORE THE VIEWER HAS NOT REACHED', () => {
    const row = byId('snatch-game') || ordinary[0];
    rpBuildMaxi(row);
    const panels = window._drSidebar.maxi;
    const order = (row.dr.assignment?.order || []).filter(n => row.dr.performances[n]);
    const running = order.length ? order : Object.keys(row.dr.performances);
    expect(panels.length).toBe(running.length);
    for (const later of running.slice(1)) {
      expect(panels[0], `${later} was on the board before her turn`).not.toContain(`>${later}<`);
    }
  });

  it('falls back to a plain card rather than a blank one', () => {
    // A challenge type nobody has designed a panel for still plays and still
    // reads — it simply looks plain. A blank would be the failure.
    const fake = {
      num: 2,
      dr: {
        challenge: { id: 'not-a-real-type', name: 'Something New' },
        performances: { Queen1: { perf: 7.2, detail: {} } },
        assignment: { order: ['Queen1'] },
      },
    };
    const html = rpBuildMaxi(fake);
    expect(html).toContain('Queen1');
    expect(html).toContain('7.2');
  });
});

describe('the rest of the challenge screens', () => {
  it('the mini names the winner and what the win buys', () => {
    const row = ordinary.find(r => r.dr.mini);
    const html = rpBuildMini(row);
    expect(html).toContain(row.dr.mini.winner);
    expect(html).toContain(row.dr.mini.name);
  });

  it('every screen builds or declines, on every ordinary episode', () => {
    for (const row of ordinary) {
      for (const [name, fn] of [['mini', rpBuildMini], ['announce', rpBuildMaxiAnnounce],
        ['choice', rpBuildChoice], ['prep', rpBuildPrep], ['maxi', rpBuildMaxi]]) {
        let html;
        expect(() => { html = fn(row); }, `${name} on episode ${row.num}`).not.toThrow();
        // Declining is fine; a stub is not.
        if (html) expect(html.length, `${name} on episode ${row.num}`).toBeGreaterThan(300);
      }
    }
  });

  it("speaks this show's words only", () => {
    for (const row of ordinary.slice(0, 4)) {
      for (const fn of [rpBuildMini, rpBuildMaxiAnnounce, rpBuildPrep, rpBuildMaxi]) {
        const text = strip(fn(row) || '');
        expect(foreignWordsIn(text, 'drag-race'), `episode ${row.num}`).toEqual([]);
      }
    }
  });
});
