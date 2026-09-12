// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-crown-lipsync-prose.test.js — the season's climax, narrated by nobody
// ══════════════════════════════════════════════════════════════════════
//
// "There's no prose for the lipsync for the crown so we don't know what's
// happening."
//
// The `finale-duel` scene shipped `text: ''`. Every other beat of the finale
// is written — the host's setup speech, an interview with each queen before
// she fights — and then the fight itself was two portraits, two energy bars
// and a verdict, with not one word about what either queen DID. Three times
// on a bracket finale.
//
// Nothing had to be invented to fix it. Every ordinary lip sync in the show is
// narrated off the SONG: js/dr/stage.js tiers each queen by her score and
// draws from the tempo pool, then names the one moment the record is decided
// at from the hook pool. Those pools are written, they are about lip syncing
// rather than about a week, and the finale had simply never called them.
//
// AND THE ORDER IS THE POINT. The VS card is where the bars fill and the
// verdict lands, so it goes last. Putting the prose after it read: here is the
// winner, and here is what the two of them did about it — the result before
// the performance, which is the one rule this show does not break.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rpBuildCrownLipSync } from '../js/vp-dr/finale-screens.js';
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
const finaleOf = seed => {
  const s = playDragSeason({ cast: cast(12, 950 + seed), seed });
  return s.rows[s.rows.length - 1];
};
const SEEDS = [5, 12, 21];

describe('the lip sync for the crown says what happened', () => {
  for (const seed of SEEDS) {
    it(`narrates every duel, seed ${seed}`, () => {
      const fin = finaleOf(seed);
      const scenes = (fin?.dr?.scenes || []).filter(s => s.step === 'finale-lipsync');
      const duels = scenes.filter(s => s.data?.duel);
      expect(duels.length, 'the finale ran no lip sync at all').toBeGreaterThan(0);

      for (let i = 0; i < duels.length; i++) {
        const round = i + 1;
        const said = scenes.filter(s => s.data?.round === round
          && (s.kind === 'finale:duel-beat' || s.kind === 'finale:duel-hook'));
        expect(said.length,
          `round ${round} was fought and nobody said what happened`)
          .toBeGreaterThan(0);
        for (const sc of said) {
          expect(sc.text, 'a narration card with no words in it').toBeTruthy();
          expect(sc.text.length).toBeGreaterThan(40);
          expect(sc.text, 'an unfilled placeholder').not.toMatch(/\{[a-z]\}/);
        }
        /* BOTH QUEENS. A duel narrated from one side is half a fight. */
        const who = new Set(said.filter(s => s.kind === 'finale:duel-beat')
          .flatMap(s => s.data.players || []));
        const d = duels[i].data.duel;
        expect([...who].sort(), `round ${round} narrated one queen only`)
          .toEqual([d.a, d.b].filter(Boolean).sort());
      }
    });
  }

  it('never lands the verdict before the performance', () => {
    /* The standing rule: nothing on a screen may know the call before the
       host makes it. The VS card reveals the winner, so every word about the
       fight has to come before it. */
    for (const seed of SEEDS) {
      const fin = finaleOf(seed);
      const scenes = (fin?.dr?.scenes || []).filter(s => s.step === 'finale-lipsync');
      const rounds = new Set(scenes.filter(s => s.data?.duel).map(s => s.data.round));
      for (const round of rounds) {
        const idx = scenes.findIndex(s => s.data?.duel && s.data.round === round);
        const after = scenes.slice(idx + 1).filter(s => s.data?.round === round
          && (s.kind === 'finale:duel-beat' || s.kind === 'finale:duel-hook'));
        expect(after.map(s => s.kind),
          `round ${round} describes the lip sync after revealing who won it`)
          .toEqual([]);
      }
    }
  });

  it('names no winner in the prose itself', () => {
    // The cards say what she did. The verdict is the VS card's job.
    for (const seed of SEEDS) {
      const fin = finaleOf(seed);
      const said = (fin?.dr?.scenes || [])
        .filter(s => s.kind === 'finale:duel-beat' || s.kind === 'finale:duel-hook');
      for (const sc of said) {
        expect(sc.text, `a lip sync card called the result: ${sc.text}`)
          .not.toMatch(/\bwins the (lip sync|round|crown)\b|\bis crowned\b|\btakes the crown\b/i);
      }
    }
  });

  it('draws the words on the crown screen', () => {
    /* Written and filed nowhere is the same as not written — the bug class
       §11.5 of docs/ADDING-A-SHOW.md exists for. */
    const fin = finaleOf(5);
    const html = rpBuildCrownLipSync(fin).replace(/<style[\s\S]*?<\/style>/g, '');
    expect(html, 'the crown screen does not render at all').toBeTruthy();
    const said = (fin.dr.scenes || [])
      .filter(s => s.kind === 'finale:duel-beat' || s.kind === 'finale:duel-hook');
    expect(said.length).toBeGreaterThan(0);
    for (const sc of said) {
      // A distinctive slice, so the check cannot pass on a coincidence.
      const probe = sc.text.slice(0, 40).replace(/[&<>"]/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
      }[c]));
      expect(html, `this was written and never drawn: ${sc.text.slice(0, 60)}`)
        .toContain(probe);
    }
  });
});
