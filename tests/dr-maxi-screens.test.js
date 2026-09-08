// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-maxi-screens.test.js — every challenge gets a screen, not seven of them
// ══════════════════════════════════════════════════════════════════════
//
// The maxi section opened on a hardcoded list of seven scene kinds and
// there are nineteen challenges. The other twelve emit their own kinds, so
// NINE of them opened no maxi section at all — The Talent Show
// Extravaganza, The Rusical, Acting, Design, Photoshoot, Choreography,
// Commercial, the Runway Challenge and the Lalaparuza each ran a full
// challenge with no screen. The scenes existed the whole time: thirty-one
// of them on the talent show, swept into whichever screen was open before
// it and rendered under that heading.
//
// Reported by playing a season and looking for the screen. No assertion in
// this repo could have caught it, because every one of them was written
// against a challenge that happened to be on the list.
//
// An allowlist of kinds is the wrong shape: it has to be extended every
// time a challenge is added and nothing fails when it is not. This is the
// denylist version — play EVERY challenge and demand a screen — so the
// twentieth is covered on the day it is written.
import { describe, expect, it, beforeEach } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { dragScreens } from '../js/vp-dr/screens.js';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const rng = rngFor(3); const r = () => 1 + Math.floor(rng() * 10);
const cast = Array.from({ length: 12 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
  archetype: 'hero', age: 22 + i,
  stats: Object.fromEntries(STATS.map(k => [k, r()])),
  drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
}));

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('every maxi challenge reaches a screen', () => {
  it('has challenges to check', () => expect(MAXI_TYPES.length).toBeGreaterThan(15));

  for (const t of MAXI_TYPES) {
    it(`${t.id} draws a maxi screen with its performances on it`, () => {
      const out = playDragSeason({
        cast, seed: 11, config: { drSchedule: [{ episode: 3, maxiId: t.id }] },
      });
      const row = out.rows.find(x => x.dr?.challenge?.id === t.id);
      expect(row, `${t.id} never ran`).toBeTruthy();

      const screen = dragScreens(row).find(x => x.id === 'dr-maxi');
      expect(screen, `${t.id} ran a full challenge and drew no maxi screen`).toBeTruthy();

      /* AND THE SCREEN CARRIES THE CHALLENGE, not merely exists. A section
         that opens and holds somebody else's scenes is the same bug wearing
         a screen. */
      const host = document.createElement('div');
      host.innerHTML = screen.html;
      host.querySelectorAll('style').forEach(e => e.remove());
      const text = host.textContent.replace(/\s+/g, ' ').trim();
      expect(text.length, `${t.id}: the maxi screen is empty`).toBeGreaterThan(400);
      expect(host.querySelectorAll('.dr-step').length,
        `${t.id}: the maxi screen has no revealable cards`).toBeGreaterThan(0);
    });
  }
});
