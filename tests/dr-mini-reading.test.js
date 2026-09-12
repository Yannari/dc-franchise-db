// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-mini-reading.test.js — the library says what happened in it
// ══════════════════════════════════════════════════════════════════════
//
// Reported off a rendered library: "there is actually no reading" and "why
// is everyone saying two things to the same person". Three defects, all of
// them the card disagreeing with the engine that filled it.
//
// 1. The aim label was drawn on EVERY card, including the host calling the
//    next queen up — so "Next up... Quin!" was captioned "Quin reads Ginger
//    Hollywood", and each queen appeared to address the same victim twice:
//    once with no read in the card, once with the read.
//
// 2. `— and it lands` was gated on `m.detail[n].pulled`, and `pulled` is set
//    when the BOND IS HIGH: she likes her target and softened it. The label
//    therefore printed exactly when the punch was pulled, over prose reading
//    "there is no joke in it and the room hears that there is no joke in it".
//
// 3. `stage.js` emits a `passed` tier for a queen who stands up with nothing,
//    and the `mini-attempt` beat had no such tier — so `emit`'s
//    `tiers.find(id) || tiers[0]` handed her NAILED, and a queen who froze
//    was captioned "She is very good at this and everybody enjoys it".
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { dragScreens } from '../js/vp-dr/screens.js';
import { CHALLENGE_BEATS } from '../js/dr/data/challenge-beats.js';
import { MINI_TIER_IDS, MINI_PASS_ID, MINI_VOICES, miniLinesFor,
  lineAngle } from '../js/dr/data/mini-voices.js';
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
const library = seed => {
  const season = playDragSeason({
    cast: cast(12, seed * 7919 + 13), seed: seed * 31 + 5,
    config: { drSchedule: [{ episode: 3, miniId: 'reading' }] },
    bond: () => 0, addBond: () => {}, popDelta: () => {},
  });
  return season.rows.find(r => r.dr?.mini?.id === 'reading') || null;
};

describe('every tier the engine can emit has a caption', () => {
  it('mini-attempt covers every tier including the pass', () => {
    const beat = CHALLENGE_BEATS.find(b => b.id === 'mini-attempt');
    const have = new Set(beat.tiers.map(t => t.id));
    for (const id of [...MINI_TIER_IDS, MINI_PASS_ID]) {
      expect(have, `mini-attempt cannot caption "${id}", so emit falls back to `
        + `${beat.tiers[0].id} and says the opposite`).toContain(id);
    }
  });

  it('never captions a pass as a triumph', () => {
    for (let s = 1; s <= 15; s++) {
      const row = library(s);
      if (!row) continue;
      for (const sc of row.dr.scenes) {
        if (sc.kind !== 'chal:mini-attempt' || sc.data?.tier !== 'passed') continue;
        const nailed = CHALLENGE_BEATS.find(b => b.id === 'mini-attempt')
          .tiers.find(t => t.id === 'nailed').note;
        expect(sc.data.note, 'a queen who passed was told she was very good')
          .not.toBe(nailed);
        expect(sc.data.note.length).toBeGreaterThan(10);
      }
    }
  });
});

describe('the card and the paragraph under it agree', () => {
  it('only the read itself carries a "reads X" label', () => {
    const row = library(1);
    if (!row) return;
    window._tvState = {};
    const html = dragScreens(row).find(s => s.id === 'dr-mini')?.html || '';
    const labels = (html.match(/class="dr-aim-k">/g) || []).length;
    const reads = row.dr.scenes.filter(s => s.kind === 'chal:mini-attempt'
      || s.kind === 'chal:mini-win').length;
    const turns = row.dr.scenes.filter(s => s.kind === 'chal:mini-turn').length;
    expect(turns, 'the host never called anybody up').toBeGreaterThan(0);
    /* One label per READ, and none on the host calling her up. Before this
       it was one per card, so the count included every announcement. */
    expect(labels, 'the announcement cards claim a read they do not contain')
      .toBe(reads);
  });

  it('says it landed only when it landed', () => {
    for (let s = 1; s <= 12; s++) {
      const row = library(s);
      if (!row) continue;
      window._tvState = {};
      const html = dragScreens(row).find(s2 => s2.id === 'dr-mini')?.html || '';
      const lands = (html.match(/ — and it lands/g) || []).length;
      const nailed = row.dr.scenes.filter(x => (x.kind === 'chal:mini-attempt'
        || x.kind === 'chal:mini-win') && x.data?.tier === 'nailed').length;
      expect(lands, 'the verdict on the label disagrees with the tier').toBe(nailed);
    }
  });

  it('never says it landed over a read that died', () => {
    /* The shape of the original bug, asserted directly: a flat read must
       not be labelled as a hit, whatever the bond between them was. */
    for (let s = 1; s <= 12; s++) {
      const row = library(s);
      if (!row) continue;
      const flat = row.dr.scenes.filter(x => x.kind === 'chal:mini-attempt'
        && (x.data?.tier === 'flat' || x.data?.tier === 'passed'));
      for (const sc of flat) {
        expect(['flat', 'passed']).toContain(sc.data.tier);
        expect(sc.data.pulled === true && sc.data.tier === 'nailed').toBe(false);
      }
    }
  });
});

describe('the library is a reading challenge', () => {
  it('gives the reading mini its own voiced pool, naming the queen read', () => {
    /* The generic `mini-attempt` lines describe doing A MINI — "{a} goes and
       the room LOSES it" — with no second name in them. A library where
       nobody is named is not a library, so the reading mini carries its own
       pool and every tier of it must actually name a target. */
    const v = (Array.isArray(MINI_VOICES) ? MINI_VOICES : Object.values(MINI_VOICES))
      .find(x => x.id === 'reading');
    expect(v, 'the reading mini lost its voice pool').toBeTruthy();
    expect(v.cast).toBe('targets');
    for (const t of v.tiers) {
      if (t.id === 'announce') continue;          // the host, talking to the room
      expect(t.lines.length, `${t.id} is empty`).toBeGreaterThan(0);
      const naming = t.lines.filter(l => /\{b\}/.test(String(l))).length;
      expect(naming, `${t.id} never names the queen being read`).toBeGreaterThan(0);
    }
  });

  it('reads a real queen, never herself', () => {
    for (let s = 1; s <= 12; s++) {
      const row = library(s);
      if (!row) continue;
      const room = row.houseAtStart || row.dr.living || [];
      for (const sc of row.dr.scenes) {
        if (sc.kind !== 'chal:mini-attempt') continue;
        const [who, at] = sc.data.players || [];
        if (!at) continue;
        expect(at, 'she read herself').not.toBe(who);
        expect(room, 'she read somebody who is not in the room').toContain(at);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════
// A READ IS ABOUT SOMETHING
// ══════════════════════════════════════════════════════════════════════
//
// "I want the prose to actually be dialogue — an actual read, like the show."
// The show's reads are specific: the joke IS that it is about that queen. A
// line written with {b} in it has to be true of whoever {b} turns out to be,
// so every read here was general — and a general read is the one thing a
// library cannot survive.
//
// `angle` is what the read is about, chosen from what is true of the target
// tonight, and checked against her before any line is offered.
describe('the read is about something true', () => {
  it('gives every read an angle, and never one that is false of her', () => {
    for (let s = 1; s <= 12; s++) {
      const row = library(s);
      if (!row) continue;
      const detail = row.dr.mini?.detail || {};
      for (const [who, d] of Object.entries(detail)) {
        if (!d.target) continue;
        expect(d.angle, `${who}'s read is about nothing`).toBeTruthy();
        const a = d.about || {};
        /* The claim each angle makes, asserted against the record it was
           chosen from. A line tagged `never-won` must never be offered to a
           queen who has won. */
        if (d.angle === 'never-won') {
          expect(a.wins, 'never-won said to a winner').toBe(0);
          expect(a.highs, 'never-won said to a queen who placed').toBe(0);
        }
        if (d.angle === 'the-frontrunner') expect(a.wins).toBeGreaterThanOrEqual(2);
        if (d.angle === 'been-in-the-bottom') expect(a.bottoms).toBeGreaterThanOrEqual(2);
        if (d.angle === 'brand-new') expect(a.weeks).toBeLessThanOrEqual(1);
        if (d.angle.startsWith('weak-')) {
          expect(`weak-${a.worst}`, 'the weak craft named is not her worst').toBe(d.angle);
        }
      }
    }
  });

  it('names WHICH craft, because those are different jokes', () => {
    /* One `weak-craft` tier would have handed the writer a single pool for
       six reads — "you cannot sew" and "you cannot dance" are not the same
       joke and must not share lines. */
    const seen = new Set();
    for (let s = 1; s <= 25; s++) {
      const row = library(s);
      if (!row) continue;
      for (const d of Object.values(row.dr.mini?.detail || {})) {
        if (d.angle) seen.add(d.angle);
      }
    }
    const weak = [...seen].filter(a => a.startsWith('weak-'));
    expect(weak.length, 'the craft angle never splits by craft').toBeGreaterThan(2);
    expect(seen.size, 'the reads are all about the same thing').toBeGreaterThan(5);
  });

  it('prefers a fitting line and falls back to the general pool', () => {
    /* Until the angled lines are written every read draws from the untagged
       floor, which is why this change is safe to land before the prose. */
    const general = miniLinesFor('reading', 'nailed', 'never-won');
    expect(general, 'the nailed pool went empty').toBeTruthy();
    expect(general.length).toBeGreaterThan(0);
    // Nothing is tagged yet, so what comes back is the untagged floor.
    for (const l of general) {
      const a = lineAngle(l);
      expect(a === null || a === 'never-won',
        'a line for another angle leaked into this read').toBe(true);
    }
  });
});
