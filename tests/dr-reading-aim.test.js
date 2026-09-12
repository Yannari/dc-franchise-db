// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-reading-aim.test.js — the card said one name and the joke said another
// ══════════════════════════════════════════════════════════════════════
//
// "It still says Gigi Cherie when she's reading Quin."
//
// Two cards in the same turn, both captioned "reads Gigi Cherie". The first
// paragraph read Gigi Cherie. The second read Quin.
//
// A reading turn is SEVERAL reads — she puts the glasses on and takes two or
// three of them apart, one card each (js/dr/mini.js decides how many from how
// the turn is going). The caption was looked up by the READER:
//
//   const aimOf = n => (m.detail?.[n]?.target) || null;
//
// and `m.detail[queen].target` is her PRIMARY read. So every card in her turn
// was labelled with the first name she said while the paragraph underneath
// named the second and the third. Measured on one seed: 8 of 18 cards
// mislabelled. The scene has carried its own `target` since the turn was split
// into one card per read; the caption reads it from there now.
//
// And the dump that showed it showed something else. Q10's three reads were
// all "I have seen better sewing on a pillow from a hotel room" with only the
// name changed. The read ANGLE is a property of the target — her weakest
// craft — so three draws who share a worst craft produce three identical
// premises, and the pool for a given angle can be one line deep. A later read
// now prefers a target the turn has not already made that joke about.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rpBuildMini } from '../js/vp-dr/challenge.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const cast = (n, seed) => {
  const r = rngFor(seed); const d = () => 1 + Math.floor(r() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'hero', age: 25,
    stats: Object.fromEntries(STATS.map(k => [k, d()])),
    drag: { acting: d(), comedy: d(), dance: d(), design: d(), runway: d(), lipsync: d(), singing: d() },
  }));
};

/** A reading mini, booked rather than hoped for. */
function reading(seed) {
  const s = playDragSeason({
    cast: cast(10, 800 + seed), seed,
    config: { drSchedule: [{ episode: 3, miniId: 'reading' }] },
  });
  return s.rows.find(r => r.dr?.mini?.id === 'reading');
}
const SEEDS = [2, 7, 15, 23];

describe('a read is captioned with the queen it is about', () => {
  it('puts this read\'s target on the card, not her first one', () => {
    let multi = 0;
    for (const seed of SEEDS) {
      const row = reading(seed);
      if (!row) continue;
      const m = row.dr.mini;
      for (const sc of row.dr.scenes || []) {
        if (sc.kind !== 'chal:mini-attempt') continue;
        const who = (sc.data.players || [])[0];
        expect(sc.data.target ?? null,
          `${who}'s read carries no target for the card to draw`).not.toBe(undefined);
        if (sc.data.target && sc.data.target !== m.detail?.[who]?.target) multi++;
      }
    }
    /* The case only exists on a turn of more than one read, so the guard has
       to prove those happened — otherwise it passes on a season where every
       queen read once and the bug could not show. */
    expect(multi, 'no queen read more than one person, so nothing was tested')
      .toBeGreaterThan(0);
  });

  /* READ THE RENDERED CARD. The caption and the paragraph are built in
     different places from different fields, which is exactly how they came to
     disagree, so the case compares what is actually drawn. */
  it('never draws a caption the paragraph contradicts', () => {
    const bad = [];
    let checked = 0;
    for (const seed of SEEDS) {
      const row = reading(seed);
      if (!row) continue;
      const html = rpBuildMini(row).replace(/<style[\s\S]*?<\/style>/g, '');
      for (const card of html.split('dr-minirow').slice(1)) {
        const cap = (card.match(/dr-aim-k">reads ([^<—]+)/) || [])[1];
        const para = (card.match(/<p>([^<]*)<\/p>/) || [])[1] || '';
        // The read opens by naming her: "Q7, your acting has one speed".
        const named = (para.match(/&quot;(Q\d+)/) || para.match(/"(Q\d+)/) || [])[1];
        if (!cap || !named) continue;
        checked++;
        if (named !== cap.trim()) bad.push(`captioned "${cap.trim()}" over: ${para}`);
      }
    }
    expect(checked, 'no read card was drawn at all').toBeGreaterThan(10);
    expect(bad, `caption contradicts the joke:\n${bad.join('\n')}`).toEqual([]);
  });
});

describe('a turn is not the same joke three times', () => {
  it('changes the premise between reads', () => {
    const repeats = [];
    let turns = 0;
    for (const seed of SEEDS) {
      const row = reading(seed);
      if (!row) continue;
      for (const [queen, d] of Object.entries(row.dr.mini.detail || {})) {
        const reads = d.reads || [];
        if (reads.length < 2) continue;
        turns++;
        const angles = reads.map(r => r.angle);
        /* Not a hard ban: every queen still standing can genuinely be worst
           at the same craft, and inventing a different angle would be the
           prose deciding a fact. What must not happen is a turn with NO
           variety in it when the room offered some. */
        if (new Set(angles).size === 1 && angles.length >= 3) {
          repeats.push(`${queen} (seed): ${angles.join(', ')}`);
        }
      }
    }
    expect(turns, 'nobody took a turn of more than one read').toBeGreaterThan(2);
    expect(repeats, `a turn ran one premise three times:\n${repeats.join('\n')}`)
      .toEqual([]);
  });

  it('does not print the same sentence twice in one turn', () => {
    for (const seed of SEEDS) {
      const row = reading(seed);
      if (!row) continue;
      const byQueen = {};
      for (const sc of row.dr.scenes || []) {
        if (sc.kind !== 'chal:mini-attempt' || !sc.text) continue;
        const who = (sc.data.players || [])[0];
        (byQueen[who] ||= []).push(sc.text);
      }
      for (const [queen, texts] of Object.entries(byQueen)) {
        if (texts.length < 2) continue;
        /* The name is filled at render time, so two cards can differ by a
           name and still be the same joke. Strip the names before comparing. */
        const shapes = texts.map(t => t.replace(/Q\d+/g, '{}'));
        expect(new Set(shapes).size,
          `${queen} told the same joke ${texts.length} ways (seed ${seed}):\n${texts.join('\n')}`)
          .toBe(shapes.length);
      }
    }
  });
});
