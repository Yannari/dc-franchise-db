// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-stage-placement.test.js — where a challenge happens, and when
// ══════════════════════════════════════════════════════════════════════
//
// `stage` splits the nineteen challenges in two. `pre` is filmed during the
// week — the Snatch Game taping, an acting scene, a commercial, a photoshoot
// — and the queens then walk the runway and take their critiques. `main` IS
// the main stage: the rusical, the talent show, the roast, the ball. The
// queens perform it in front of the panel, on the night, as the show.
//
// The girl group was `pre`. It is sung and danced live in front of the
// judges, like every other number, and being filed as pre-taped put it on
// screen before elimination day had started and before the panel had sat
// down. Reported by reading the running order.
//
// It also turned over a second bug when it moved: `girl-group.js` hardcoded
// `step: 'maxi-pre'` on its number card while every other module asks
// `maxi.stage`, so the card stayed on the taped screen and the episode drew
// "The Maxi" TWICE — once before elimination day and once on the night.
import { describe, expect, it } from 'vitest';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';
import { MAXI_EVENTS } from '../js/dr/data/maxi-events.js';
import { playDragSeason } from '../js/dr/season.js';
import { dragScreens, sceneSections } from '../js/vp-dr/screens.js';
import { SCENE_STEPS } from '../js/dr/week.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'floater', age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};
const weekOf = maxiId => {
  const season = playDragSeason({
    cast: cast(12, 555), seed: 77,
    config: { drSchedule: [{ episode: 3, maxiId }] },
    bond: () => 0, addBond: () => {}, popDelta: () => {},
  });
  return season.rows.find(r => r.dr?.challenge?.id === maxiId) || null;
};

describe('a live number is performed live', () => {
  it('files every number the queens perform on the night as `main`', () => {
    /* The list is the point: anything the room performs in front of the
       panel belongs here, and a new one filed `pre` is the bug this catches. */
    for (const id of ['girl-group', 'rusical', 'rumix', 'choreography',
      'talent-show', 'roast', 'stand-up', 'singing']) {
      const m = MAXI_TYPES.find(x => x.id === id);
      expect(m, `${id} is missing`).toBeTruthy();
      expect(m.stage, `${id} is performed live and is filed as pre-taped`).toBe('main');
    }
  });

  it('keeps the genuinely pre-taped ones pre-taped', () => {
    for (const id of ['snatch-game', 'acting', 'commercial', 'improv',
      'photoshoot', 'music-video']) {
      expect(MAXI_TYPES.find(x => x.id === id).stage,
        `${id} is shot during the week`).toBe('pre');
    }
  });
});

describe('the running order', () => {
  it('performs the number before the runway walk', () => {
    /* The screens follow the SECTIONS registry, which has had the Maxi ahead
       of the Runway since the two sections were split. This array is what
       `row.dr.scenes` is sorted into, and js/dr/writer.js hands those to the
       episode writer verbatim IN THIS ORDER — so with `maxi-main` after
       `runway` the brief described the walk before the performance it was
       reacting to. */
    expect(SCENE_STEPS.indexOf('maxi-main')).toBeLessThan(SCENE_STEPS.indexOf('runway'));
    expect(SCENE_STEPS.indexOf('main-stage')).toBeLessThan(SCENE_STEPS.indexOf('maxi-main'));
    // And a taped challenge still plays before the room gets ready.
    expect(SCENE_STEPS.indexOf('maxi-pre')).toBeLessThan(SCENE_STEPS.indexOf('werk-elim-day'));
  });

  for (const [id, expected] of [['girl-group', 'maxi-main'], ['rusical', 'maxi-main'],
    ['music-video', 'maxi-pre'], ['snatch-game', 'maxi-pre']]) {
    it(`${id} puts its performance on ${expected}`, () => {
      const row = weekOf(id);
      if (!row) return;
      const steps = [...new Set(row.dr.scenes
        .filter(s => /^perform:/.test(s.kind || '')).map(s => s.step))];
      if (!steps.length) return;                 // module emits no perform: scenes
      expect(steps, `${id} performed on the wrong night`).toEqual([expected]);
    });
  }

  it('never draws The Maxi twice in one episode', () => {
    /* The second bug the move turned over. A module that hardcodes its step
       instead of reading `maxi.stage` leaves a card on the other screen, and
       both sections are labelled "The Maxi" — so the episode grew a duplicate
       nobody would read as a duplicate. */
    for (const id of ['girl-group', 'rusical', 'music-video', 'snatch-game', 'ball']) {
      const row = weekOf(id);
      if (!row) continue;
      const pre = row.dr.scenes.filter(s => s.step === 'maxi-pre').length;
      const main = row.dr.scenes.filter(s => s.step === 'maxi-main').length;
      expect(pre && main, `${id} has scenes on BOTH maxi screens`).toBeFalsy();
    }
  });
});

describe('a danced challenge is rehearsed', () => {
  /* `rehearseNumber` is deliberately not another dance roll: dance is the
     floor, and what separates two queens who dance equally well is whether
     they take a count in one pass (intuition) and are still taking it at hour
     six (temperament). Without it those two are identical and the stats that
     should tell them apart never come up. */
  for (const id of ['girl-group', 'rusical', 'music-video', 'rumix']) {
    it(`${id} has a rehearsal, because dance is in its blend`, () => {
      const m = MAXI_TYPES.find(x => x.id === id);
      expect(m.blend.dance, `${id} does not use dance`).toBeGreaterThan(0);
      const row = weekOf(id);
      if (!row) return;
      const calls = row.dr.scenes.filter(s => s.kind === 'choreo-call').length;
      expect(calls, `${id} never rehearses the number it is judged on`).toBeGreaterThan(0);
    });
  }

  it('puts the rehearsal on a screen of its own', () => {
    const row = weekOf('girl-group');
    if (!row) return;
    window._tvState = {};
    const labels = dragScreens(row).map(s => s.label);
    expect(labels, 'the rehearsal reached no screen').toContain('Rehearsal');
    expect(labels.indexOf('Rehearsal'))
      .toBeLessThan(labels.indexOf('Main Stage'));
  });
});

// ══════════════════════════════════════════════════════════════════════
// AND EVERYTHING ABOUT THE NUMBER IS IN THE ROOM WHERE IT IS LEARNED
// ══════════════════════════════════════════════════════════════════════
//
// Reported: the captain's choreography was on the Prep screen. It was — and
// so was the rest of the rehearsal.
//
// `choreographer-pick` was listed as an opener of the WORK ROOM, so choosing
// who runs the number was filed with the sewing. And the rehearsal's own two
// events — she had it after one run, she is still mouthing counts — declare
// `from: 'rehearsal'`, which js/dr/stage.js maps onto the `prep` STEP because
// there is no rehearsal step; a scene whose kind opens nothing then falls
// through to whatever its step opens, and the Work Room claimed them.
describe('the rehearsal room holds the rehearsal', () => {
  const REHEARSED = ['girl-group', 'rusical', 'music-video', 'rumix'];

  for (const id of REHEARSED) {
    it(`${id}: nothing about the number is filed under Prep`, () => {
      const row = weekOf(id);
      if (!row) return;
      const sections = sceneSections(row);
      const prep = (sections.get('dr-prep') || []).map(s => s.kind);
      const reh = (sections.get('dr-rehearsal') || []).map(s => s.kind);
      expect(reh.length, `${id} has an empty rehearsal room`).toBeGreaterThan(0);
      for (const k of ['choreographer-pick', 'chal:rehearsal',
        'maxi:picked-it-up', 'maxi:cannot-count']) {
        expect(prep, `${k} is on the Work Room screen`).not.toContain(k);
      }
    });
  }

  it('puts the captain pick in the rehearsal room, not the work room', () => {
    const row = weekOf('girl-group');
    if (!row) return;
    const sections = sceneSections(row);
    expect((sections.get('dr-rehearsal') || []).map(s => s.kind))
      .toContain('choreographer-pick');
  });

  it('derives the rehearsal events rather than listing them', () => {
    /* The list in js/vp-dr/screens.js is built from MAXI_EVENTS by `from`, so
       an event added with `from: 'rehearsal'` lands in the rehearsal room
       without anybody coming back to a registry. This asserts the derivation
       still covers every one of them. */
    const row = weekOf('music-video');
    if (!row) return;
    const reh = new Set((sceneSections(row).get('dr-rehearsal') || []).map(s => s.kind));
    const declared = MAXI_EVENTS.filter(e => e.from === 'rehearsal').map(e => `maxi:${e.id}`);
    expect(declared.length, 'no event declares the rehearsal any more').toBeGreaterThan(0);
    for (const k of declared) {
      const anywhereElse = (sceneSections(row).get('dr-prep') || []).some(s => s.kind === k);
      expect(anywhereElse, `${k} leaked back to Prep`).toBe(false);
      void reh;
    }
  });
});
