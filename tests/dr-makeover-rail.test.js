// ══════════════════════════════════════════════════════════════════════
// dr-makeover-rail.test.js — the second person in the room
// ══════════════════════════════════════════════════════════════════════
//
// A makeover is the only challenge where a large part of what the panel
// scores is somebody who is not a queen, and every rail on this show listed
// the room as though she were doing it alone. Worse: the line-up screen built
// no rail at all, so it ran on whatever the PREVIOUS screen had left in
// `window._drSidebar` — a column of queens with no partners, beside a screen
// whose whole subject is who is paired with whom.
//
// Both halves are asserted here, because they failed for different reasons.

import { beforeEach, describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rpBuildChoice, rpBuildMaxi } from '../js/vp-dr/challenge.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

function cast(n) {
  let s = 7;
  const r = () => { s = (s * 1103515245 + 12345) % 2147483648; return 3 + (s % 7); };
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: 'f',
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
const { rows } = playDragSeason({
  cast: cast(12), seed: 3,
  // A test that needs a makeover books a makeover.
  config: { drSchedule: [{ episode: 4, maxiId: 'makeover' }] },
  bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
});
const row = rows.find(r => r.dr.challenge?.id === 'makeover');

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('the makeover rail', () => {
  it('books one', () => {
    expect(row, 'no makeover in this season').toBeTruthy();
    const picks = Object.values(row.dr.assignment?.picks || {});
    expect(picks.length).toBeGreaterThan(2);
    expect(picks.every(p => p.partner?.portrait),
      'a partner without a face — the rail has nothing to draw').toBe(true);
  });

  it('the line-up builds its own rail instead of inheriting the last screen\'s', () => {
    /* THE ORIGINAL DEFECT. `window._drSidebar` is seeded here with a rail from
       somewhere else; if the screen builds nothing, that is what the viewer
       keeps looking at. */
    window._drSidebar = { choice: ['<h4>SOMEBODY ELSE\u2019S RAIL</h4>'] };
    rpBuildChoice(row);
    const panels = window._drSidebar.choice;
    expect(panels.length, 'one panel per reveal step')
      .toBe((row.dr.scenes || []).filter(s => s.step === 'choice' && s.text).length);
    for (const p of panels) expect(p).not.toContain('SOMEBODY ELSE');
  });

  it('draws every partner\'s face beside the queen he is paired with', () => {
    for (const build of [rpBuildChoice, rpBuildMaxi]) {
      build(row);
      const panels = Object.values(window._drSidebar).flat().filter(Boolean);
      const last = panels[panels.length - 1] || '';
      for (const [n, p] of Object.entries(row.dr.assignment.picks)) {
        if (!last.includes(n)) continue; // a rail may be gated to who has been up
        expect(last, `${build.name}: ${n}'s partner is not in the rail`)
          .toContain(p.partner.portrait);
        expect(last, `${build.name}: ${p.partner.name} is not named`)
          .toContain(p.partner.name);
      }
    }
  });

  it('puts him inside her slot, not in one of his own', () => {
    /* `.dr-slot` is a three-column grid — portrait, name, tag. A fourth child
       breaks the row, so the pair chip lives INSIDE the name cell. A partner
       drawn as his own slot would also be counted as a queen by anything that
       reads the rail. */
    rpBuildChoice(row);
    const rail = window._drSidebar.choice[0];
    const slots = (rail.match(/class="dr-slot/g) || []).length;
    expect(slots, 'one slot per queen, and no slot of his own')
      .toBe(Object.keys(row.dr.assignment.picks).length);
    expect(rail).toMatch(/dr-nm[^]*?dr-mate/);
  });

  it('does not draw a pair chip on a challenge with no partners', () => {
    const other = rows.find(r => r.dr.challenge?.id
      && r.dr.challenge.id !== 'makeover' && r.dr.assignment?.picks);
    if (!other) return;
    rpBuildMaxi(other);
    for (const p of Object.values(window._drSidebar).flat().filter(Boolean)) {
      expect(p, `${other.dr.challenge.id} drew a partner it has not got`)
        .not.toContain('dr-mate');
    }
  });
});
