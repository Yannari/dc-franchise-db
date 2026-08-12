// Should a power be forced out on its last week, or allowed to expire?
//
// Not forced. A power carried for a month and never spent is a real Big
// Brother outcome — the careful player waiting for a perfect week that never
// came — and the transcript already has a screen for exactly that. Forcing it
// replaces a story with a move nobody chose.
//
// What decides it is what spending COSTS. A secret power reveals nothing when
// played, so sitting on it until it dies buys its holder nothing and they
// should nearly always spend. A public one with no target tells the house you
// had it and gets nothing back, and letting that expire is correct play.
//
// The old rule did neither: one flat floor for both, and it computed the
// holder's nerve and then ignored it — so the bold and the timid behaved
// identically in the one week where character should decide it.
import { describe, expect, it } from 'vitest';
import { spendPull } from '../js/bb/powers.js';

const last = o => spendPull({ weeksLeft: 0, ...o });

describe('the last week a power exists', () => {
  it('is never certain, in either direction', () => {
    // No forcing, and no guaranteed waste either.
    for (const exposes of [true, false]) {
      for (const nerve of [0, 0.5, 1]) {
        for (const need of [0, 0.5, 1]) {
          const p = last({ need, nerve, exposes });
          expect(p).toBeGreaterThan(0);
          expect(p).toBeLessThan(1);
        }
      }
    }
  });

  it('spends a secret power far more readily than a public one', () => {
    // Same holder, same absence of need — the difference is only what it costs.
    const secret = last({ need: 0, nerve: 0.5, exposes: false });
    const public_ = last({ need: 0, nerve: 0.5, exposes: true });
    expect(secret).toBeGreaterThan(public_ + 0.3);
  });

  it('lets a real need take either of them to the ceiling', () => {
    expect(last({ need: 1, nerve: 0.5, exposes: true })).toBeCloseTo(0.97, 2);
    expect(last({ need: 1, nerve: 0.5, exposes: false })).toBeCloseTo(0.97, 2);
  });

  it('finally lets nerve decide, which it used not to', () => {
    // The old branch was `0.55 + need * 0.42` — boldness computed, then unused.
    const bold = last({ need: 0, nerve: 1, exposes: true });
    const timid = last({ need: 0, nerve: 0, exposes: true });
    expect(bold).toBeGreaterThan(timid);
  });

  it('keeps a timid holder of a public power likely to die with it', () => {
    // The character the whole no-forcing argument exists to protect.
    expect(last({ need: 0, nerve: 0, exposes: true })).toBeLessThan(0.35);
  });

  it('leaves a bold holder of a secret power almost certain to spend it', () => {
    expect(last({ need: 0, nerve: 1, exposes: false })).toBeGreaterThan(0.8);
  });
});

describe('weeks before the last one are unchanged', () => {
  it('still lets patience hold a power back', () => {
    const early = spendPull({ need: 0.4, weeksLeft: 3, nerve: 0.2 });
    const late = spendPull({ need: 0.4, weeksLeft: 0, nerve: 0.2, exposes: false });
    expect(late).toBeGreaterThan(early);
  });

  it('defaults to treating a power as public when nobody says', () => {
    // Conservative: a caller that forgets to pass visibility gets the floor
    // that assumes spending costs something.
    expect(last({ need: 0, nerve: 0.5 })).toBe(last({ need: 0, nerve: 0.5, exposes: true }));
  });
});
