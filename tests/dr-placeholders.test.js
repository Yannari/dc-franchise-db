// ══════════════════════════════════════════════════════════════════════
// dr-placeholders.test.js — no {x} survives onto the screen
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY A SECOND GUARD, WHEN EVERY POOL ALREADY HAS AN ALLOWLIST ──
//
// Because the allowlists check the POOLS and this checks the OUTPUT, and the
// bug that prompted it lives exactly in the gap between them.
//
// `{m}` — whoever ran the room — was added to the prose, the mentor was
// resolved correctly, her portrait rendered correctly, and `fill()` in
// js/dr/stage.js destructures a fixed list of keys that did not include it. So
// the value was handed in, silently dropped, and every line would have printed
// "and {m}" to the viewer. Every per-pool allowlist passed, because the pools
// were right; the renderer was not.
//
// That is a whole class rather than one slip: `fill` is destructured, so ANY
// key a caller passes and the parameter list does not name fails this way, in
// silence, with the placeholder visible on screen. A guard that reads pools
// cannot see it. This one plays real seasons and reads what came out.
//
// It is also the cheapest possible answer to the project's own rule that the
// only way to find a prose bug is to dump a real episode and read it — this
// dumps them and reads them for one specific defect that a human eye skims
// straight past.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
/* A mixed room, for the reason tests/dr-event-reach.test.js spells out: an
   all-hero cast turns off every scheming beat, and a beat that never fires is
   a beat this guard never reads. */
const ARCH = ['villain', 'mastermind', 'schemer', 'hero', 'loyal-soldier',
  'social-butterfly', 'hothead', 'wildcard', 'floater', 'underdog', 'goat',
  'perceptive-player'];

function cast(seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: 12 }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', archetype: ARCH[i % ARCH.length],
    age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

function play(seed, pin) {
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  return playDragSeason({
    cast: cast(500 + seed), seed,
    config: pin ? { drSchedule: [pin] } : {},
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => {
      const k = key(a, b);
      bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d));
    },
  }).rows;
}

/* Single-letter braces only. A line may legitimately contain a brace — a
   quoted line of dialogue about set-building, say — and this is looking for
   the shape `fill` uses and nothing else. */
const LEFTOVER = /\{[a-z]\}/g;

/** Every line of text a season actually put on a screen. */
function everyLine(rows) {
  const out = [];
  for (const row of rows) {
    for (const sc of row?.dr?.scenes || []) {
      if (sc?.text) out.push({ ep: row.num, kind: sc.kind, text: sc.text });
    }
    for (const c of row?.dr?.critiques || []) {
      if (c?.text) out.push({ ep: row.num, kind: `critique:${c.tone || ''}`, text: c.text });
    }
  }
  return out;
}

describe('nothing reaches the viewer with a placeholder still in it', () => {
  it('across ordinary seasons', () => {
    let lines = 0;
    for (let s = 1; s <= 6; s++) {
      const rows = play(s * 7919 + 13, null);
      for (const l of everyLine(rows)) {
        lines += 1;
        const bad = l.text.match(LEFTOVER);
        expect(bad, `ep${l.ep} ${l.kind}: ${bad?.join(' ')} — in "${l.text.slice(0, 120)}"`)
          .toBeNull();
      }
    }
    expect(lines, 'no prose was rendered — nothing was tested').toBeGreaterThan(500);
  });

  /* EVERY CHALLENGE, because a placeholder belongs to a beat and a beat
     belongs to a challenge — six random seasons will not book all nineteen,
     and the one they miss is the one with the hole in it. This is how `{m}`
     would have been caught: it lives only on the Rumix and the music video. */
  it('and on every challenge in the catalogue', () => {
    const seen = [];
    for (const t of MAXI_TYPES) {
      const rows = play(4711, { episode: 4, maxiId: t.id });
      const row = rows.find(x => x.dr?.challenge?.id === t.id);
      if (!row) continue;
      seen.push(t.id);
      for (const l of everyLine([row])) {
        const bad = l.text.match(LEFTOVER);
        expect(bad, `${t.id} ${l.kind}: ${bad?.join(' ')} — in "${l.text.slice(0, 120)}"`)
          .toBeNull();
      }
    }
    expect(seen.length, 'no challenge was booked').toBeGreaterThanOrEqual(MAXI_TYPES.length - 2);
  });
});
