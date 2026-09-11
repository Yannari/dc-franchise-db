// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-returnee-rerun.test.js — a queen who came back stays the queen who
// came back, on every later re-run
// ══════════════════════════════════════════════════════════════════════
//
// The aired schedule records THAT a week brought somebody back and, when the
// author asked for one by name, WHO they asked for. It does not record who
// actually walked back on — js/dr/season.js picks her with the week's own dice
// off `state.out`, and `played.push` carries the pin, not the pick. So freezing
// episode four does not replay episode four's return: it RE-DERIVES it, and it
// comes back the same only for as long as the dice and the eliminated list do.
//
// That makes this the one aired fact on the show with no pin behind it. Every
// test here is about a night the viewer has already watched not changing when
// they press ↺ on a much later one.
//
// `sig` in dr-rebook.test.js does not look at `dr.returned`, so a return that
// moved would not have failed a single existing guard.
import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../js/core.js';
import { playDragSeason } from '../js/dr/season.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const DRAG = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
const CAST = Array.from({ length: 13 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'wildcard', age: 25,
  stats: Object.fromEntries(STATS.map((s, j) => [s, 3 + ((i * 7 + j * 3) % 7)])),
  drag: Object.fromEntries(DRAG.map((s, j) => [s, 3 + ((i * 5 + j * 4) % 7)])),
}));

// A night, INCLUDING who came back on it — the field the existing signature
// leaves out and the whole reason this file exists.
const sig = row => JSON.stringify({
  num: row.num,
  maxi: row.dr?.challenge?.id,
  win: row.dr?.call?.win,
  out: (row.exits || []).map(x => x.name),
  living: row.dr?.living,
  returned: row.dr?.returned?.name || null,
  honoured: row.dr?.returned?.honoured ?? null,
});

const RETURN_EP = 4;

describe('a return re-derived under a re-run', () => {
  const play = (pins, reroll) => playDragSeason({
    cast: CAST, seed: 4711,
    config: {
      drSchedule: [{ episode: RETURN_EP, returnee: true }, ...pins],
      drFinale: 'top4', drReroll: reroll || null,
    },
  });

  it('brings somebody back on the week it was booked for', () => {
    // The control arm: without this the rest of the file is unfailable, because
    // `null === null` is a passing comparison on a season with no return at all.
    const first = play([]);
    expect(first.rows[RETURN_EP - 1].dr?.returned?.name).toBeTruthy();
    expect(first.rows.filter(r => r.dr?.returned).length).toBe(1);
  });

  it('is the same queen after a re-run pressed on a much later night', () => {
    const first = play([]);
    const her = first.rows[RETURN_EP - 1].dr.returned.name;

    const frozen = first.schedule.filter(r => r.episode <= 9);
    const again = play(frozen, { from: 10, nonce: 1 });

    expect(again.rows[RETURN_EP - 1].dr?.returned?.name,
      `episode ${RETURN_EP} sent a different queen back after a re-run of episode 10`)
      .toBe(her);
  });

  it('leaves every aired night byte-identical, the return among them', () => {
    /* FROZEN THROUGH SIX, RE-RUN FROM SEVEN, and the episode matters.
       This froze nine and re-ran ten, which is at or past the end of a
       twelve-queen season: three queens left, almost no outcomes available,
       and the same night legitimately comes back. Measured across eight
       seeds and three presses each: a re-run at episode four or six returns
       a different night 24 times out of 24, at episode eight 23 of 24, and
       at episode ten only 3 of 6 -- not because the button broke but because
       there is nothing left for it to decide.
       The control arm below needs a point where divergence is actually
       available, or it fails for a reason that is about the calendar rather
       than the code. The returnee is on episode four, so the frozen prefix
       still covers the thing this file is about. */
    const FROZEN = 6;
    const first = play([]);
    const frozen = first.schedule.filter(r => r.episode <= FROZEN);
    const again = play(frozen, { from: FROZEN + 1, nonce: 1 });

    for (let i = 0; i < FROZEN; i++) {
      expect(sig(again.rows[i]), `episode ${i + 1}`).toBe(sig(first.rows[i]));
    }
    // And the re-run did re-run something, or the check above proves nothing.
    expect(sig(again.rows[FROZEN]), 'the re-run returned the same night')
      .not.toBe(sig(first.rows[FROZEN]));
  });

  it('holds across repeated presses, not just the first', () => {
    const first = play([]);
    const her = first.rows[RETURN_EP - 1].dr.returned.name;
    const frozen = first.schedule.filter(r => r.episode <= 9);
    for (const nonce of [1, 2, 3, 4, 5]) {
      const again = play(frozen, { from: 10, nonce });
      expect(again.rows[RETURN_EP - 1].dr?.returned?.name, `press ${nonce}`).toBe(her);
    }
  });
});
