// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-placeholders.test.js — no {c} reaches the screen
// ══════════════════════════════════════════════════════════════════════
//
// Reported from a played episode, verbatim: "she helps Quin and {c} and loses
// two hours of her own day doing it". The placeholder, on screen, in the show.
//
// Every scene carries two pieces of prose — the `text` and the `note` that a
// badge draws — and only the text was ever filled. The note was handed through
// raw at FOUR separate sites (werk, untucked, maxi events, the performance
// tiers), each one a line or two below a filled `text`, which is exactly how
// it survived being written four times.
//
// Sweeping real output found them all; no test did, and one had been on screen
// since the werk room shipped.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const S = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const A = ['villain','hero','floater','wildcard','goat','schemer','social-butterfly','mastermind','underdog','perceptive-player'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', archetype: A[i % A.length], age: 21 + i,
    stats: Object.fromEntries(S.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};

/** Every string a screen or a transcript can draw, from a real season. */
function prose(seasons = 12) {
  const out = [];
  for (let s = 0; s < seasons; s++) {
    const run = playDragSeason({
      cast: cast(14, 400 + s), seed: s, config: { drFinale: 'top4', drReunion: true },
    });
    for (const row of run.rows) {
      for (const sc of row.dr?.scenes || []) {
        for (const v of [sc.text, sc.note, sc.data?.note, sc.data?.text]) {
          if (typeof v === 'string' && v) out.push([sc.kind, v]);
        }
      }
    }
  }
  return out;
}

describe('the prose that reaches a screen', () => {
  const all = prose();

  it('produced enough to be worth checking', () => {
    // Without this the assertions below pass on an empty season.
    expect(all.length).toBeGreaterThan(2000);
  });

  it('contains no unfilled name placeholder', () => {
    const bad = [];
    for (const [kind, v] of all) {
      // {a}..{d} are names; {j} judge, {s} song, {c} also serves as category
      // in some pools — all of them are filled at render and none may survive.
      for (const m of v.matchAll(/\{[a-z]\}/g)) bad.push(`${kind} ${m[0]} :: ${v.slice(0, 70)}`);
    }
    const uniq = [...new Set(bad)];
    expect(uniq, `${uniq.length} unfilled placeholders reached a screen`).toEqual([]);
  });

  it('contains no empty substitution where a name should be', () => {
    /* The other half of the same bug: a placeholder filled with '' leaves
       "she helps Quin and  and loses" — a hole rather than a token, which is
       harder to spot and reads as a typo. */
    const bad = [];
    for (const [kind, v] of all) {
      if (/\s{2,}[a-z]/.test(v) || / and  |,  |  \./.test(v)) {
        bad.push(`${kind} :: ${v.slice(0, 70)}`);
      }
    }
    expect([...new Set(bad)].slice(0, 5), 'a name substituted as empty').toEqual([]);
  });
});
