// ══════════════════════════════════════════════════════════════════════
// dr-chal-snatch.test.js — the character draft and the six-round taping
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { SNATCH_CHARACTERS } from '../js/dr/data/snatch-characters.js';
import { DRAG_STYLES } from '../js/dr/queen.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';
import { characterById } from '../js/dr/data/snatch-characters.js';
import { playDragSeason } from '../js/dr/season.js';
import { runMaxi, applyEvents } from '../js/dr/maxi.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
  ...over,
});
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
// Spread seeds: this LCG's first draw barely moves across consecutive ones.
const seeded = i => rngFor(i * 7919 + 13);

function ctx(seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)])), bonds = {}) {
  return {
    living: Object.keys(players), players, maxi: maxiById('snatch-game'), rng: seeded(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: () => {}, popDelta: () => {}, miniWinner: 'Ada', mini: null, cfg: {},
  };
}

describe('the character list', () => {
  it('is thirty fictional archetypes, graded, in styles a queen can have', () => {
    expect(SNATCH_CHARACTERS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(SNATCH_CHARACTERS.map(c => c.id)).size).toBe(SNATCH_CHARACTERS.length);
    for (const c of SNATCH_CHARACTERS) {
      expect(c.difficulty, c.id).toBeGreaterThanOrEqual(1);
      expect(c.difficulty, c.id).toBeLessThanOrEqual(5);
      expect(['comedy', 'acting'], c.id).toContain(c.needs);
      expect(DRAG_STYLES, `${c.id} has a style no queen can have`).toContain(c.style);
    }
  });

  it('names real people, and still says which SHAPE of bit each one is', () => {
    /* This used to assert the opposite — every name had to begin with "The",
       because no real person may appear anywhere in this simulator. That rule
       is deliberately overruled for this file and only this file: the Snatch
       Game is the one challenge whose premise is impersonating somebody the
       audience knows, and "she did the Ageless Diva" describes a Snatch Game
       rather than being one. The archetypes survive as a field, so the shape
       is still there and several people live inside each shape. */
    for (const c of SNATCH_CHARACTERS) {
      expect(c.archetype, `${c.id} belongs to no archetype`).toBeTruthy();
      expect(c.name, `${c.id} kept a placeholder name`).not.toMatch(/^The /);
    }
    // Every archetype has more than one person in it, or it is a label rather
    // than a shape and two seasons will draw the same impression.
    const byArch = {};
    for (const c of SNATCH_CHARACTERS) (byArch[c.archetype] ||= []).push(c.id);
    const lonely = Object.entries(byArch).filter(([, v]) => v.length < 2).map(([k]) => k);
    expect(lonely, 'these archetypes hold one person each').toEqual([]);
  });

  it('stocks both ends of the difficulty range', () => {
    // Or the pick has no stakes: everybody reaches for the same easy shelf.
    const d = SNATCH_CHARACTERS.map(c => c.difficulty);
    expect(Math.min(...d)).toBe(1);
    expect(Math.max(...d)).toBe(5);
    // And enough of them that a long season does not run out.
    expect(SNATCH_CHARACTERS.length).toBeGreaterThan(40);
  });
});

describe('the draft', () => {
  it('every queen leaves with a different character', () => {
    for (let s = 0; s < 20; s++) {
      const chosen = Object.values(runMaxi(ctx(s)).assignment.picks).map(p => p.choice);
      expect(chosen.length).toBe(6);
      expect(new Set(chosen).size, `seed ${s} double-booked a character`).toBe(6);
    }
  });

  it('the first pick gets a first choice; somebody later does not', () => {
    /* OVER SEEDS, NOT ON ONE. This asserted both halves on seed 3 alone, and
       seed 3 is one of the three draws in sixty where six identical queens
       happen to shortlist six different characters and nobody collides — so
       a healthy draft (57 of 60 seeds produce a penalty) read as a broken
       one. The property is the claim; a single roll is not evidence of it. */
    let anyPaid = 0;
    for (let s = 0; s < 20; s += 1) {
      const picks = runMaxi(ctx(s)).assignment.picks;
      // The queen who picks first ALWAYS gets what she asked for.
      expect(picks.Ada.penalty, `seed ${s}: the first pick paid a penalty`).toBe(0);
      if (Object.values(picks).some(p => p.penalty > 0)) anyPaid += 1;
    }
    // And somebody further down the order usually does not. Measured 57/60.
    expect(anyPaid, 'no seed produced a contested pick at all').toBeGreaterThan(14);
  });

  it('a queen reaches for a character in her own style', () => {
    const styled = Object.fromEntries(NAMES.map(n => [n, mk(n, { style: 'spooky' })]));
    const out = runMaxi(ctx(1, styled));
    const first = SNATCH_CHARACTERS.find(c => c.id === out.assignment.picks.Ada.choice);
    expect(first.style).toBe('spooky');
  });
});

describe('the taping', () => {
  it('records six rounds for everybody', () => {
    const out = runMaxi(ctx(2));
    for (const n of NAMES) expect(out.performances[n].detail.rounds.length, n).toBe(6);
  });

  it('a comedy queen beats a fashion queen at this, on average', () => {
    const funny = Object.fromEntries(NAMES.map(n =>
      [n, mk(n, n === 'Bee' ? { comedy: 10, acting: 9 } : { comedy: 3, acting: 3 })]));
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      const out = runMaxi(ctx(i, funny));
      const best = Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0];
      if (best === 'Bee') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.5);
  });

  // Measured, not assumed. A +2 edge wins most nights and loses some; parity
  // is a coin toss between six queens. Only a gap nobody real has is a lock,
  // which is the shape we want — craft decides Snatch Game, and it decides it
  // by degrees rather than by a switch.
  //
  //   craft edge over the room   +0    +1    +2    +3    +4    +5
  //   wins the taping           8.5%  37%   72%   92%   99%   100%
  it('scales with the gap: an edge is an edge, not a guarantee', () => {
    const rate = bonus => {
      const players = Object.fromEntries(NAMES.map(n =>
        [n, mk(n, n === 'Bee' ? { comedy: 5 + bonus, acting: 5 + bonus } : {})]));
      let w = 0;
      for (let i = 0; i < 200; i++) {
        const out = runMaxi(ctx(i, players));
        if (Object.entries(out.performances).sort((a, b) => b[1].perf - a[1].perf)[0][0] === 'Bee') w++;
      }
      return w / 200;
    };
    const even = rate(0);
    const edge = rate(2);
    // At parity nobody is favoured: one queen in six.
    expect(even).toBeGreaterThan(0.03);
    expect(even).toBeLessThan(0.2);
    // Two points of craft is worth a lot, and still loses sometimes.
    expect(edge).toBeGreaterThan(0.55);
    expect(edge).toBeLessThan(0.9);
  });

  it('can kill somebody on the panel, and says which character did it', () => {
    const weak = Object.fromEntries(NAMES.map(n =>
      [n, mk(n, n === 'Fay' ? { comedy: 1, acting: 1 } : { comedy: 8, acting: 8 })]));
    let died = null;
    for (let i = 0; i < 40 && !died; i++) {
      died = runMaxi(ctx(i, weak)).events.find(e => e.type === 'dying' && e.players[0] === 'Fay');
    }
    expect(died, 'a queen with 1 comedy survived forty tapings').toBeTruthy();
    expect(died.pop.Fay).toBe(-3);
    expect(died.data.character).toBeTruthy();
    expect(died.data.flops).toBeGreaterThanOrEqual(3);
  });

  it('does not kill the funniest queen in the room', () => {
    const strong = Object.fromEntries(NAMES.map(n => [n, mk(n, { comedy: 10, acting: 10 })]));
    for (let i = 0; i < 30; i++) {
      expect(runMaxi(ctx(i, strong)).events.some(e => e.type === 'dying'), `seed ${i}`).toBe(false);
    }
  });

  it('two friends sitting together build a bit, and both are paid for it', () => {
    const bonds = Object.fromEntries(
      NAMES.flatMap(a => NAMES.map(b => [[a, b].sort().join('|'), 8])));
    let act = null;
    for (let i = 0; i < 20 && !act; i++) {
      act = runMaxi(ctx(i, undefined, bonds)).events.find(e => e.type === 'double-act');
    }
    expect(act, 'a room that all like each other never once played off itself').toBeTruthy();
    expect(act.players.length).toBe(2);
    expect(act.pop[act.players[0]]).toBeGreaterThan(0);
    expect(act.pop[act.players[1]]).toBeGreaterThan(0);
    expect(act.bond[0][2]).toBeGreaterThan(0);
  });

  it('a room that hates each other never builds one', () => {
    const bonds = Object.fromEntries(
      NAMES.flatMap(a => NAMES.map(b => [[a, b].sort().join('|'), -8])));
    for (let i = 0; i < 20; i++) {
      expect(runMaxi(ctx(i, undefined, bonds)).events.some(e => e.type === 'double-act')).toBe(false);
    }
  });

  it('every event it fires survives the consequence check', () => {
    for (let i = 0; i < 20; i++) {
      const c = ctx(i);
      expect(() => applyEvents(runMaxi(c).events, c), `seed ${i}`).not.toThrow();
    }
  });
});

describe('the host, who is now in the room', () => {
  it('engages somebody every round instead of scoring into a vacuum', () => {
    const beats = runMaxi(ctx(1)).scenes.find(s => s.kind === 'snatch-taping').data.hostBeats;
    expect(beats.length, 'the host never once said anything').toBeGreaterThan(3);
    for (const b of beats) {
      expect(b.round).toBeGreaterThanOrEqual(1);
      expect(typeof b.worked).toBe('boolean');
    }
  });

  it('goes where the television is — the best answer or the worst, never the middle', () => {
    for (let s = 0; s < 15; s++) {
      const out = runMaxi(ctx(s));
      const { rounds, hostBeats } = out.scenes.find(x => x.kind === 'snatch-taping').data;
      for (const b of hostBeats) {
        const answers = rounds[b.round - 1].answers.slice().sort((x, y) => y.score - x.score);
        const isTop = answers[0].name === b.name;
        const isBottom = answers[answers.length - 1].name === b.name;
        expect(isTop || isBottom, `seed ${s}: host went to the middle of the desk`).toBe(true);
      }
    }
  });

  it('a queen who can take a setup runs with it; one who cannot is left to hang', () => {
    const sharp = Object.fromEntries(NAMES.map(n => [n, mk(n, { comedy: 10 },
      { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 10 } })]));
    const blunt = Object.fromEntries(NAMES.map(n => [n, mk(n, { comedy: 1 },
      { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 1 } })]));
    const find = (p, type) => {
      for (let i = 0; i < 20; i++) {
        const e = runMaxi(ctx(i, p)).events.find(x => x.type === type);
        if (e) return e;
      }
      return null;
    };
    const played = find(sharp, 'host-played-along');
    const hung = find(blunt, 'left-to-hang');
    expect(played, 'nobody sharp ever took a setup').toBeTruthy();
    expect(played.pop[played.players[0]]).toBeGreaterThan(0);
    expect(hung, 'nobody blunt was ever left hanging').toBeTruthy();
    expect(hung.pop[hung.players[0]]).toBeLessThan(0);
  });

  it('and the exchange actually moves her score', () => {
    // If the host reached the transcript but not the number it would be a
    // scene about nothing, which is the bug this was built to fix.
    let checked = 0;
    for (let s = 0; s < 20 && checked < 3; s++) {
      const out = runMaxi(ctx(s));
      const { hostBeats } = out.scenes.find(x => x.kind === 'snatch-taping').data;
      for (const b of hostBeats) {
        expect(Math.abs(b.delta), 'a host beat worth nothing').toBeGreaterThan(0);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('never lets one queen have the whole taping', () => {
    for (let s = 0; s < 20; s++) {
      const { hostBeats } = runMaxi(ctx(s)).scenes.find(x => x.kind === 'snatch-taping').data;
      const per = {};
      for (const b of hostBeats) per[b.name] = (per[b.name] || 0) + 1;
      for (const [n, c] of Object.entries(per)) {
        expect(c, `seed ${s}: ${n} got ${c} host beats`).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe('THE PICK IS A DECISION, AND DIFFICULTY IS A GAMBLE', () => {
  /* Two things were wrong and only measuring found either.

     THE PICK HAD NO MOTIVE. The shortlist was one sum for the whole cast —
     style match, the stat the character needs, MINUS its difficulty — so
     every queen in every season shortlisted the safest thing she could carry
     and hard characters came off the board only when the easy ones were gone.
     Nobody ever chose a tightrope.

     AND DIFFICULTY ONLY EVER COST. It was subtracted and the round noise was
     flat, so a hard character was strictly worse. Pooled over 120 tapings
     before the fix: hard characters bombed 40% of the time and shone 7%,
     against 17% and 28% for easy ones. */
  const STATS2 = ['physical', 'endurance', 'mental', 'social', 'strategic',
    'loyalty', 'boldness', 'intuition', 'temperament'];
  const mk = (n, seed, bold) => {
    const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
    return Array.from({ length: n }, (_, i) => {
      const stats = Object.fromEntries(STATS2.map(k => [k, r()]));
      stats.boldness = bold;
      return {
        name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'floater', age: 25, stats,
        drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
      };
    });
  };
  const avgDifficulty = bold => {
    const out = [];
    for (let seed = 1; seed <= 60; seed++) {
      const s = playDragSeason({ cast: mk(12, seed, bold), seed,
        config: { drSchedule: [{ episode: 5, maxiId: 'snatch-game' }] },
        bond: () => 0, addBond: () => {}, popDelta: () => {} });
      const ep = s.rows.find(r => r.dr.challenge?.id === 'snatch-game');
      if (!ep) continue;
      for (const p of Object.values(ep.dr.assignment.picks)) {
        const c = characterById(p.choice);
        if (c) out.push(c.difficulty);
      }
    }
    return out.reduce((a, b) => a + b, 0) / out.length;
  };

  it('a bold room reaches further than a timid one', () => {
    /* THE CLAIM HOLDS; THE THRESHOLD WAS CALIBRATED ON OLDER BOLDNESS.
       A bold room does still reach — brave is above timid on every sample
       size tried — but the gap is about 0.35, not the 0.4 this demanded
       (12 seeds: 2.49 vs 2.80; 60 seeds: 2.57 vs 2.93).
       It shrank on purpose. `riskFor` used to read boldness as the SIZE of
       the reach; it now reads it as the odds of reaching at all, which was
       the fix for a season nobody could win — a queen with boldness 10 used
       to hand the panel a 10.0 every single week. A smaller, still-positive
       gap is the new mechanic working, not the old one decaying.
       Re-measured at 60 seeds rather than 12, so the number the threshold
       sits under is worth trusting. */
    const timid = avgDifficulty(1);
    const brave = avgDifficulty(10);
    expect(brave, `timid ${timid.toFixed(2)} vs brave ${brave.toFixed(2)}`)
      .toBeGreaterThan(timid + 0.25);
  });

  it('a hard character swings wider than an easy one', () => {
    /* The first attempt at this scaled the ROUND noise by difficulty and
       changed nothing measurable: across six rounds it averaged out and the
       spread was flat at about 2.2 whatever she picked. Whether a character
       WORKS is one fact about the night, not six independent ones. */
    /* ── AND THE SECOND ATTEMPT MEASURED IT WRONG ────────────────────
       This ran 40 seeds (hard n=83) and compared the spread of
       `perf - craftBaseline`. Both halves of that were a problem.

       THE SAMPLE. An sd estimated from 83 values has error bars wider than
       the effect being tested, and the effect is real but modest. At 40
       seeds the comparison flipped sign on rng drift alone — which is what
       happened: it went red on a commit that changed how many draws
       `riskFor` takes and nothing about this mechanic at all.

       THE ESTIMATOR. Subtracting a baseline that CORRELATES with `perf`
       does not isolate anything — Var(perf - base) carries -2Cov(perf,
       base), and the covariance differs between the two piles, so the
       subtraction reversed the ordering it was meant to clean up. Raw perf
       had hard wider (4.47 vs 4.33) and the residual said the opposite.

       What is left is the population difference the residual was reaching
       for: the queens who take easy characters are a broader group. Pooling
       the spread WITHIN craft bands answers that without subtracting
       anything correlated. Measured over 200 seeds (hard n=422):
       easy 3.70, hard 3.87, and sd rises monotonically with difficulty
       (diff 1: 4.28 ... diff 5: 4.65). */
    const easy = []; const hard = [];
    for (let seed = 1; seed <= 200; seed++) {
      const cast0 = mk(12, seed * 3, 6);
      const s = playDragSeason({ cast: cast0, seed,
        config: { drSchedule: [{ episode: 5, maxiId: 'snatch-game' }] },
        bond: () => 0, addBond: () => {}, popDelta: () => {} });
      const ep = s.rows.find(r => r.dr.challenge?.id === 'snatch-game');
      if (!ep) continue;
      for (const p of Object.values(ep.dr.assignment.picks)) {
        const c = characterById(p.choice);
        const perf = ep.dr.performances?.[p.name]?.perf;
        if (!c || perf == null) continue;
        const q = s.rows[0] && cast0.find(x => x.name === p.name);
        /* THE BASELINE HAS TO BE THE ENGINE'S BASELINE. This subtracted a
           flat comedy*0.55 + acting*0.35, which is what the score used to
           be. The weights TILT on `needs` now — a part she has to inhabit
           leans on acting, a loud quotable one on comedy — so a flat
           baseline left that tilt sitting in the residual as noise, on top
           of the variance the test is trying to measure. It is a difference
           of up to 0.28 x (comedy - acting), which on a random cast is
           easily wider than the swing itself: the easy pile came out with a
           LARGER spread than the hard one and the mechanic looked broken
           while working. Same weights as js/dr/chal/snatch-game.js. */
        /* The craft band she is in, on the engine's OWN weights — they tilt
           on `needs`, so a flat comedy*0.55 + acting*0.35 is not the
           baseline any more (js/dr/chal/snatch-game.js). */
        const wComedy = c.needs === 'acting' ? 0.34 : 0.62;
        const base = q ? q.drag.comedy * wComedy + q.drag.acting * (0.9 - wComedy) : 0;
        const at = { perf, band: Math.floor(base) };
        if (c.difficulty <= 2) easy.push(at);
        else if (c.difficulty >= 4) hard.push(at);
      }
    }
    expect(hard.length, 'nobody ever took a hard character').toBeGreaterThan(200);
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
    /* The spread WITHIN each craft band, pooled. Bands of one craft point,
       and a band needs eight queens in it before it is allowed an opinion. */
    const pooled = (set) => {
      const by = {};
      for (const r of set) (by[r.band] ||= []).push(r.perf);
      let num = 0; let den = 0;
      for (const v of Object.values(by)) {
        if (v.length < 8) continue;
        num += sd(v) ** 2 * (v.length - 1); den += v.length - 1;
      }
      return Math.sqrt(num / den);
    };
    const [sHard, sEasy] = [pooled(hard), pooled(easy)];
    expect(sHard, `hard sd ${sHard.toFixed(3)} vs easy ${sEasy.toFixed(3)}`)
      .toBeGreaterThan(sEasy);
    // And it is a gamble rather than a tax: the ceiling has to be reachable.
    const easyMean = mean(easy.map(r => r.perf));
    const shone = hard.filter(r => r.perf > easyMean + 1.5).length / hard.length;
    expect(shone, 'a hard character never pays off').toBeGreaterThan(0.1);
  });
});

describe('A ROOM THAT AGREES WITH ITSELF STILL PICKS DIFFERENTLY', () => {
  /* The bug this exists for, from a played season: thirteen queens, and the
     board read "12 of 13 lost a pick" with every single one of them losing it
     to the queen who picked first.

     The cause was not the draft. A franchise roster player arrives with no
     `drag` block, so dragOf defaults EVERY drag stat to 5 and derives the
     same style — which makes a whole cast numerically identical. Craft alone
     then produces one shortlist in one order, thirteen times: everybody's
     first choice was the same person, the first queen took him, and the
     shared top eight ran out so four queens got no character at all.

     A talent is something a person HAS, not something her stats imply. The
     shortlist carries a personal draw now, seeded so a replay is identical. */
  const BARE = n => Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
    archetype: ['villain', 'hero', 'schemer', 'floater', 'mastermind', 'goat'][i % 6],
    age: 21 + i,
    stats: Object.fromEntries(['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'].map(k => [k, 5])),
    // deliberately no `drag` block: this is the shape that caused it
  }));
  const run = (maxiId, seed) => {
    const s = playDragSeason({ cast: BARE(13), seed,
      config: { drSchedule: [{ episode: 2, maxiId }] },
      bond: () => 0, addBond: () => {}, popDelta: () => {} });
    const ep = s.rows.find(r => r.dr.challenge?.id === maxiId);
    return ep ? Object.values(ep.dr.assignment.picks) : null;
  };

  it('an identical cast does not all reach for the same character', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const picks = run('snatch-game', seed);
      if (!picks) continue;
      const byWinner = {};
      for (const p of picks) if (p.lostTo) byWinner[p.lostTo] = (byWinner[p.lostTo] || 0) + 1;
      const worst = Math.max(0, ...Object.values(byWinner));
      expect(worst, `one queen took ${worst} of ${picks.length} first choices on seed ${seed}`)
        .toBeLessThan(picks.length / 2);
    }
  });

  it('the board never runs out of characters', () => {
    // Eight was a shorter list than the cast, so a room that agreed with
    // itself exhausted it and queens were handed a "leftover" placeholder.
    for (let seed = 1; seed <= 6; seed++) {
      const picks = run('snatch-game', seed);
      if (!picks) continue;
      const leftovers = picks.filter(p => String(p.choice).startsWith('leftover-'));
      expect(leftovers.map(p => p.name), `seed ${seed} ran out`).toEqual([]);
    }
  });

  it('and an identical cast does not all bring the same act', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const picks = run('talent-show', seed);
      if (!picks) continue;
      const distinct = new Set(picks.map(p => p.choice)).size;
      expect(distinct, `seed ${seed}: ${distinct} act(s) across ${picks.length} queens`)
        .toBeGreaterThan(2);
    }
  });
});
