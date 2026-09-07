// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-vp-registry.test.js — one list, and nothing falls off the end of it
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it, beforeEach } from 'vitest';
import { DRAG_SCREENS, dragScreens, dragScreensRevealed, sceneSections } from '../js/vp-dr/screens.js';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
function cast(n = 12, seed = 1) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Queen${i + 1}`, slug: `queen${i + 1}`, gender: ['f', 'nb'][i % 2],
    archetype: 'hero', age: 25, stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}
const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
const { rows } = playDragSeason({
  cast: cast(12, 6), seed: 11,
  bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => { const k = key(a, b); bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d)); },
});

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; });

describe('the registry', () => {
  it('is the twenty-seven screens, in the running order', () => {
    expect(DRAG_SCREENS.length).toBe(27);
    const ids = DRAG_SCREENS.map(s => s.id);
    expect(ids[0]).toBe('dr-arrivals');
    expect(ids).toContain('dr-chart');
    expect(new Set(ids).size).toBe(27);
    expect(new Set(DRAG_SCREENS.map(s => s.suffix)).size, 'two screens share a suffix')
      .toBe(27);
    for (const s of DRAG_SCREENS) {
      expect(typeof s.when, s.id).toBe('function');
      expect(typeof s.build, s.id).toBe('function');
      expect(s.suffix, s.id).toBeTruthy();
      expect(s.label, s.id).toBeTruthy();
    }
  });

  it('every screen builds on every episode it claims', () => {
    for (const row of rows) {
      for (const s of DRAG_SCREENS) {
        if (!s.when(row)) continue;
        let html;
        expect(() => { html = s.build(row); }, `${s.id} on episode ${row.num}`).not.toThrow();
        expect(html.length, `${s.id} is empty on episode ${row.num}`).toBeGreaterThan(200);
      }
    }
  });

  it('NO SCENE FALLS OFF THE END OF THE SHOW', () => {
    /* The guard this file is arranged around. An episode carries 100-130
       scenes across ~150 kinds, and the engine grows new ones every task —
       so a screen list that files scenes by matching kinds would silently
       drop any kind nobody wrote a rule for. Sections are opened by markers
       and everything after one belongs to it, which stays true as kinds are
       added. If this ever fails, a scene is being played and shown nowhere. */
    for (const row of rows) {
      const total = (row.dr.scenes || []).length;
      const filed = [...sceneSections(row).values()].reduce((n, list) => n + list.length, 0);
      expect(filed, `episode ${row.num} lost ${total - filed} of ${total} scenes`).toBe(total);
    }
  });

  it('files a scene under exactly one screen, never two', () => {
    for (const row of rows) {
      const seen = new Set();
      for (const list of sceneSections(row).values()) {
        for (const sc of list) {
          expect(seen.has(sc), `a scene is on two screens in episode ${row.num}`).toBe(false);
          seen.add(sc);
        }
      }
    }
  });

  it('the premiere shows arrivals and no other episode does', () => {
    const hasArrivals = r => dragScreens(r).some(s => s.id === 'dr-arrivals');
    // Only assert the negative where the engine does not emit the marker; the
    // positive is Task 5's to make true, and asserting it now would be
    // asserting a screen that does not exist yet.
    for (const row of rows.slice(1)) expect(hasArrivals(row), `episode ${row.num}`).toBe(false);
  });

  it('the finale is not given a runway it never had', () => {
    // A finale row carries `finale`, no call and no runway. Screens that read
    // those must decline it rather than build an empty frame.
    const finale = rows[rows.length - 1];
    const ids = dragScreens(finale).map(s => s.id);
    expect(ids).not.toContain('dr-runway');
    expect(ids).not.toContain('dr-critiques');
    expect(ids.length, 'the finale drew nothing at all').toBeGreaterThan(0);
  });

  it('every ordinary episode reaches the stage and the lip sync', () => {
    for (const row of rows.filter(r => !r.dr.finale)) {
      const ids = dragScreens(row).map(s => s.id);
      for (const want of ['dr-main-stage', 'dr-critiques', 'dr-lipsync']) {
        expect(ids, `episode ${row.num} has no ${want}`).toContain(want);
      }
      /* THE COLD OPEN IS NOT ON THE PREMIERE, and that is the rule rather
         than a gap. It is the morning AFTER an elimination — the empty
         station, the lipstick message, the room going back over last night —
         and on episode one nobody has left and the queens are still coming
         through the door. The entrances are the opening. */
      const premiere = row.num === 1;
      expect(ids.includes('dr-cold-open'), `episode ${row.num} cold open`)
        .toBe(!premiere);
      expect(ids.includes('dr-arrivals'), `episode ${row.num} arrivals`)
        .toBe(premiere);
    }
  });
});

describe('the transcript reads the same list', () => {
  it('builds every screen the viewing party would', () => {
    const row = rows[4];
    const live = dragScreens(row).map(s => s.id);
    const told = dragScreensRevealed(row).map(s => s.id);
    expect(told).toEqual(live);
  });

  it('DOES NOT CONSUME THE VIEWER\'S OWN REVEALS', () => {
    /* Reveal state is keyed by episode number. Building the transcript
       against the real row would mark that episode fully revealed, and the
       viewer would come back to a screen already opened with nothing left to
       click. The shadow row is renumbered negative, which cannot collide. */
    const row = rows[4];
    dragScreensRevealed(row);
    for (const s of DRAG_SCREENS) {
      const live = window._tvState[`dr:${row.num}:${s.suffix}`];
      expect(live?.idx ?? -1, `${s.id} was opened by the transcript`).toBe(-1);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// The smackdown had a full bracket and no screen at all
// ══════════════════════════════════════════════════════════════════════
describe('the smackdown screen', () => {
  /* The episode carried eight queens, three rounds, a song per duel, scores
     and a champion — and none of its scene kinds matched a section, so all
     eight fell into the cold-open fallback and the night arrived blank. It
     was reachable, booked, simulated, and invisible. */
  it('draws the bracket rather than falling through to the cold open', async () => {
    const { playDragSeason } = await import('../js/dr/season.js');
    const { dragScreens } = await import('../js/vp-dr/screens.js');
    const { rngFor } = await import('../js/dr/rng.js');
    const S = ['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'];
    const g = rngFor(9); const r = () => 1 + Math.floor(g() * 10);
    const cast = Array.from({ length: 12 }, (_, i) => ({
      name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
      archetype: 'hero', age: 22 + i,
      stats: Object.fromEntries(S.map(k => [k, r()])),
      drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
    }));
    const { rows } = playDragSeason({ cast, seed: 4, config: { drSmackdown: true } });
    const sm = rows.find(x => x.dr.smackdown);
    expect(sm, 'no smackdown episode').toBeTruthy();

    const ids = dragScreens(sm).map(s => s.id);
    expect(ids, 'the smackdown has no screen').toContain('dr-smackdown');
    expect(ids, 'it fell through to the cold open again').not.toContain('dr-cold-open');

    const html = dragScreens(sm).find(s => s.id === 'dr-smackdown').html;
    // Every duel is on the bracket, and the champion has somewhere to stand.
    for (const d of sm.dr.smackdown.duels) {
      expect(html, `${d.a} vs ${d.b} is not on the bracket`).toContain(d.song);
    }
    expect(html).toMatch(/sd-champ/);
    // And it reads: every scene carried text:'' before this.
    const body = html.replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<!--dr-chrome-->[\s\S]*?<!--\/dr-chrome-->/g, '')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    expect(body.length, 'the bracket has no words on it').toBeGreaterThan(800);
  });

  it('never narrates a duel as an upset when it was not one', async () => {
    const { smackdownScenes } = await import('../js/dr/smackdown.js');
    /* "The winner was not the favourite" alone called 31% of duels an upset,
       which makes the word mean nothing — lip sync ability has little to do
       with how long a queen lasted. She has to have gone home clearly earlier
       AND won it clearly. */
    const duels = [{
      round: 1, a: 'Early', b: 'Late', song: 'X',
      scores: { Early: 9, Late: 3 }, winner: 'Early', loser: 'Late',
    }];
    const order = ['Early', 'A', 'B', 'C', 'Late'];
    const near = ['Early', 'Late'];
    const tierOf = f => smackdownScenes({
      field: ['Early', 'Late'], duels, champion: 'Early', title: 't',
      rng: () => 0, expectedOf: n => f.indexOf(n),
    }).find(s => s.kind === 'smackdown-duel').data.tier;
    expect(tierOf(order), 'a real upset was not called one').toBe('upset');
    expect(tierOf(near), 'beating the queen who left a week later is not an upset')
      .not.toBe('upset');
  });
});
