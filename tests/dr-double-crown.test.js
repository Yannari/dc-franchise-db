// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-double-crown.test.js — a double win crowns, dresses and hears both
// ══════════════════════════════════════════════════════════════════════
//
// The user, on a played double crown: "this is a double win but you don't
// even feel like it's a double win". The ceremony named both queens and
// then crowned, dressed and heard only one; the screen did not treat the
// double's naming beat as the crowning, so no win music played.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { rpBuildCrowning } from '../js/vp-dr/crowning.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function findDouble() {
  for (let seed = 1; seed <= 400; seed++) {
    const rng = rngFor(seed * 17); const r = () => 1 + Math.floor(rng() * 10);
    // An even, excellent top of the room makes a dead heat at the end likelier.
    const cast = Array.from({ length: 10 }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
      stats: Object.fromEntries(STATS.map(k => [k, r()])),
      drag: { acting: 8, comedy: 8, dance: 8, design: 8, runway: 8, lipsync: 9, singing: 8 } }));
    const { rows } = playDragSeason({ cast, seed, config: { drDoubleCrown: true } });
    const fin = rows[rows.length - 1];
    if (fin?.dr?.finale?.doubleCrown) return fin;
  }
  return null;
}

describe('a double crown', () => {
  const fin = findDouble();

  it('happens at all on a season built for it', () => {
    expect(fin, 'no double crown in 400 even seasons').toBeTruthy();
  });

  it('crowns and hears both winners', () => {
    if (!fin) return;
    const winners = fin.dr.finale.winners;
    expect(winners).toHaveLength(2);
    const beat = b => (fin.dr.scenes || []).filter(s => (s.data?.beat || '') === b);
    for (const w of winners) {
      expect(beat('crown-regalia').some(s => (s.data?.players || [])[0] === w), `${w} was never crowned`).toBe(true);
      expect(beat('crown-speech').some(s => (s.data?.players || [])[0] === w), `${w} never spoke`).toBe(true);
    }
  });

  it('is the crowning on the screen: both lit, the win music on the name', () => {
    if (!fin) return;
    document.body.innerHTML = rpBuildCrowning(fin);
    const named = [...document.querySelectorAll('[data-crownbeat="1"]')];
    expect(named.length, 'the double naming beat is not a crowning beat').toBeGreaterThan(0);
    expect(named[0].dataset.music).toBe('crowned');
    const last = (window._drSidebar?.fincrown || []).slice(-1)[0] || '';
    expect(last).toContain('The winners');
  });
});

/* ── AND NOTHING ELSE ON THE NIGHT SAYS ONE OF THEM LOST ──
   Checked on an All Stars season (seed 29): the crown song called Q4 its
   winner, the crowning's placements read "1 crowned, 2", and the closing
   paragraph had "the winner dancing with the runner-up". */
import { DRAG_SCREENS } from '../js/vp-dr/screens.js';
describe('a double crown on All Stars', () => {
  const S = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
  const mk = seed => { const g = rngFor(seed); const r = () => 1 + Math.floor(g() * 10);
    return Array.from({ length: 12 }, (_, i) => ({ name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25 + i,
      stats: Object.fromEntries(S.map(k => [k, r()])), drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() } })); };
  const out = playDragSeason({ cast: mk(929), seed: 29, config: { drDoubleCrown: true, drAllStars: true } });
  const row = out.rows.at(-1);
  const text = DRAG_SCREENS.filter(sc => !sc.when || sc.when(row))
    .map(sc => (sc.build(row) || '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).join(' ').replace(/\s+/g, ' ');

  it('crowns two', () => {
    expect(row.dr.finale.doubleCrown).toBe(true);
    expect(row.dr.finale.winners).toHaveLength(2);
  });
  it('never calls one of them the runner-up, or the last song her loss', () => {
    expect(text).not.toMatch(/runner-up/i);
    expect(text).not.toMatch(/wins the lip sync for the crown/);
    expect(text).toMatch(/neither of them lost this song/);
  });
  it('puts both first on the placements', () => {
    const [a, b] = row.dr.finale.winners;
    expect(text).toContain(`1 ${a} crowned`);
    expect(text).toContain(`1 ${b} crowned`);
  });
});
