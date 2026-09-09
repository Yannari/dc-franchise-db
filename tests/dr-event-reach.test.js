// ══════════════════════════════════════════════════════════════════════
// dr-event-reach.test.js — no authored event is unreachable
// ══════════════════════════════════════════════════════════════════════
//
// "We have a ton of events and nothing is used." Measured, and the answer
// was one real bug and three false alarms — which is the reason this file
// exists in this shape rather than as a rate check.
//
// THE REAL ONE: js/dr/chal/makeover.js reads `cfg.makeoverPool` and NOTHING
// EVER WROTE IT. Seven partner cohorts are authored — superfans, veterans,
// seniors, athletes, the pit crew, loved ones, and the queens already sent
// home — and every makeover in every season ran the default. Six cohorts
// were dead data, and `reunion`, which needs a partner who is herself a
// queen, could not fire at all: nought across twenty-five seasons.
//
// THE THREE FALSE ALARMS were all the measuring harness, and they are why
// this file is careful about its cast:
//
//   · an ALL-HERO cast makes canScheme() false for everybody, so
//     `stole-a-bit` and `spotlight-hog` read as dead when they are uncast.
//   · playDragSeason WITHOUT a bond function returns 0 for every pair, so
//     `double-act` and the makeover `reunion` read as dead when they are
//     ungated. A headless harness is not the game.
//
// With a mixed cast and real bonds, all three fire. So the cast below is
// the assertion as much as the expectations are.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';
import { MAXI_EVENTS } from '../js/dr/data/maxi-events.js';
import { PARTNER_COHORTS } from '../js/dr/chal/makeover.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
/* A ROOM WITH SCHEMERS IN IT. Heroes never scheme, by the project's own
   archetype rule, so a cast of them silently disables a whole class. */
const ARCH = ['villain', 'mastermind', 'schemer', 'hero', 'loyal-soldier',
  'social-butterfly', 'hothead', 'wildcard', 'floater', 'underdog', 'goat',
  'perceptive-player'];

function cast(seed) {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: 12 }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
    archetype: ARCH[i % ARCH.length], age: 22 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
}

/** One season with the given challenge pinned, played with real bonds. */
function play(seed, pin) {
  const bonds = {}; const key = (a, b) => [a, b].sort().join('|');
  return playDragSeason({
    cast: cast(300 + seed), seed,
    config: { drSchedule: [pin] },
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => {
      const k = key(a, b);
      bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d));
    },
    popDelta: () => {},
  }).rows;
}

const SEASONS = 12;

describe('every authored maxi event can happen', () => {
  for (const t of MAXI_TYPES) {
    const mine = MAXI_EVENTS.filter(e => e.from === t.id);
    if (!mine.length) continue;

    it(`${t.id}: all ${mine.length} of its events fire`, () => {
      const seen = new Set();
      /* THE MAKEOVER NEEDS MORE ROOM, and saying why is the point: its
         cohort is drawn from seven per season and `reunion` then needs a
         real bond with the partner it drew, so twelve seasons cycling the
         cohorts land on the eliminated queens twice and prove nothing. It
         alternates onto that cohort and gets double the seasons — the guard
         is about REACHABILITY, not about how often a cohort comes up. */
      /* AND THE CONJUNCTION EVENTS, which is a general problem rather than
         two special cases. Some events need several independent things to go
         the same way at once: the ball's `showstopper` wants high design AND
         a good prep AND favourable noise; the photoshoot's `blank-frame`
         wants EVERY frame under the bar, not one. Twelve seasons is a coin
         toss on whether a conjunction like that appears at all — both of
         these passed on one RNG stream and failed on the next without
         anything about the challenge changing, purely because an unrelated
         edit elsewhere shifted the draw by a few calls.
         A reachability guard that depends on the seed is not measuring
         reachability, so these get double the sample. It costs seconds and it
         is the difference between the guard catching a genuinely dead event
         and the guard reporting on the seed.
         The Rusical joins them for the same reason: `lost-the-words` wants a
         queen who was beaten to her part AND has a poor memory AND draws the
         noise badly, which is deliberately about one queen a season. */
      const CONJUNCTION = new Set(['ball', 'photoshoot', 'rusical']);
      const runs = t.id === 'makeover' || CONJUNCTION.has(t.id) ? SEASONS * 2 : SEASONS;
      for (let s = 0; s < runs; s++) {
        /* The makeover is pinned onto the cohort under test as well as the
           episode: its seven cohorts are drawn at random per season, so a
           cohort-specific event would otherwise depend on the roll. */
        const pin = { episode: 6, maxiId: t.id };
        if (t.id === 'makeover') {
          pin.makeoverPool = s % 2
            ? 'eliminated'
            : PARTNER_COHORTS[(s / 2) % PARTNER_COHORTS.length];
        }
        let rows;
        /* ── SPREAD SEEDS, NOT CONSECUTIVE ONES ──
           This ran seasons 0..11 and js/dr/rng.js warns about exactly that by
           name: the LCG's first draw is a linear function of its seed, so
           small consecutive seeds sample one corner of the distribution
           rather than the distribution. It bit here — the roast's
           `stole-a-bit` was reported unreachable over twelve seasons after an
           unrelated change to how the schedule draws, while the same event
           measured at 41.7% across sixty spread seeds (60 roasts, 25 fires).
           The mechanic was never broken; the sample was.
           `i * 7919 + 13` is the spread rng.js prescribes. */
        try { rows = play(s * 7919 + 13, pin); } catch { continue; }
        const row = rows.find(x => x.dr?.challenge?.id === t.id);
        if (!row) continue;
        /* THE ENGINE'S OWN LIST, NOT ONLY THE RENDERED SCENES. An event whose
           prose is not written yet emits no scene at all — that is deliberate
           and it is what stops an empty card reaching a reader — but it made
           this guard unable to tell "cannot happen" from "not written yet",
           and it reported a brand new event as unreachable on the day it was
           added. `row.events` is what the engine actually fired. */
        for (const ev of row.dr.events || []) {
          if (ev?.type) seen.add(String(ev.type).replace(/^(maxi|mini|werk):/, ''));
        }
        for (const sc of row.dr.scenes || []) {
          if (sc.data?.event) seen.add(sc.data.event);
        }
      }
      const dead = mine.map(e => e.id).filter(id => !seen.has(id));
      expect(dead, `${t.id}: written and unreachable over ${runs} seasons`).toEqual([]);
    });
  }
});

describe('the season chooses a makeover cohort', () => {
  /* THE ASSERTION THAT WOULD HAVE CAUGHT IT, and the one the block above
     cannot make: those tests PIN the cohort themselves, so they prove the
     module can use one and say nothing about whether anything ever picks
     it. js/dr/chal/makeover.js read `cfg.makeoverPool` and no writer
     existed — every makeover in every season ran the default and six of the
     seven authored cohorts were unreachable.
     So this one pins nothing but the challenge. */
  it('uses more than one cohort across a run of seasons', () => {
    const used = new Set();
    let seen = 0;
    for (let s = 0; s < 24; s++) {
      let rows;
      try { rows = play(s, { episode: 6, maxiId: 'makeover' }); } catch { continue; }
      const row = rows.find(x => x.dr?.challenge?.id === 'makeover');
      if (!row) continue;
      seen += 1;
      const key = row.dr.assignment?.poolKey;
      expect(key, 'a makeover ran with no cohort at all').toBeTruthy();
      used.add(key);
    }
    expect(seen, 'no makeover ever ran — nothing was tested').toBeGreaterThan(8);
    expect(used.size,
      `every makeover used the same cohort: ${[...used].join(', ')}`).toBeGreaterThan(1);
  });

  it('holds the eliminated queens back until there are some', () => {
    /* The cohort made of queens the show already sent home cannot be drawn
       in week one, and a season that tried would fall back to superfans
       without saying so. */
    for (let s = 0; s < 12; s++) {
      let rows;
      try { rows = play(s, { episode: 2, maxiId: 'makeover' }); } catch { continue; }
      const row = rows.find(x => x.dr?.challenge?.id === 'makeover');
      if (!row) continue;
      expect(row.dr.assignment?.poolKey,
        'an early makeover drew the eliminated cohort').not.toBe('eliminated');
    }
  });
});
