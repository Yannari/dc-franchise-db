// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-mini-guess.test.js — Guess Who: the mini with a right answer in it
// ══════════════════════════════════════════════════════════════════════
//
// Something belongs to one of the queens — a wig, a shoe, a perfume, a work
// station an hour before the runway — and the room has to work out whose.
//
// It is the mirror of Spill the T and the pair only works if they stay
// mirrored. That one has NO right answer and pays you for agreeing with
// everybody else; this one has exactly one, so a room agreeing in a body is
// simply a room that is wrong together. What it scores is how well she knows
// the woman standing next to her, which makes it the only mini on the list
// that pays a queen for the room she has built.
//
// THE BUG THIS FILE EXISTS FOR. The first build scored each candidate by her
// own loudness, so the loudest designer in the room was everybody's answer on
// every wig round and the room was systematically wrong — 12.8% correct
// against 9.1% chance, and not one round the room ever got. A guess is a
// RESEMBLANCE: the thing in front of her belongs to somebody who sits
// somewhere on one axis, and the queens who sit near there are the plausible
// answers. Measured after: 23.9%, and a close friend at 58%.
import { describe, expect, it } from 'vitest';
import { runMini } from '../js/dr/mini.js';
import { miniById, MINI_TYPES } from '../js/dr/data/minis.js';
import { GUESS_ITEMS, guessRounds } from '../js/dr/data/guess.js';
import { MAXI_EVENTS } from '../js/dr/data/maxi-events.js';
import { playDragSeason } from '../js/dr/season.js';
import { dragScreens, sceneSections } from '../js/vp-dr/screens.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const castOf = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'floater', age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};
const asMap = list => Object.fromEntries(list.map(p => [p.name, p]));

const playedRow = () => {
  const bonds = {};
  const key = (a, b) => [a, b].sort().join('|');
  const season = playDragSeason({
    cast: castOf(12, 555), seed: 77,
    config: { drSchedule: [{ episode: 3, miniId: 'guess-who' }] },
    bond: (a, b) => bonds[key(a, b)] || 0,
    addBond: (a, b, d) => { bonds[key(a, b)] = (bonds[key(a, b)] || 0) + d; },
    popDelta: () => {},
  });
  return season.rows.find(r => r.dr?.mini?.id === 'guess-who') || null;
};

describe('the items', () => {
  it('exposes one dimension each, or none at all', () => {
    for (const item of GUESS_ITEMS) {
      expect(item.prompt.endsWith('?'), `${item.id} is not a question`).toBe(true);
      /* `axis` may be null — a perfume is knowable only from having stood
         next to her — but it must never be a value that varies by voter, or
         the same item would be a different question for each queen. */
      if (item.axis === null) {
        expect(item.intimate, `${item.id} has no axis and is not intimate`).toBe(true);
        continue;
      }
      const players = castOf(6, 3);
      for (const p of players) {
        const v = item.axis(p);
        expect(Number.isFinite(v), `${item.id} scored NaN`).toBe(true);
        expect(item.axis(p), `${item.id} is not a pure function of the queen`).toBe(v);
      }
      expect(new Set(players.map(p => item.axis(p))).size,
        `${item.id} puts the whole room in the same place`).toBeGreaterThan(1);
    }
  });

  it('asks about a different queen every round', () => {
    /* Four items all belonging to the same woman is one queen's segment and
       eleven queens with nothing to do, and it makes round two guessable
       from round one. */
    const players = asMap(castOf(10, 9));
    const living = Object.keys(players);
    for (let s = 1; s <= 10; s++) {
      const res = runMini({ living, mini: miniById('guess-who'), players,
        rng: rngFor(s * 17), bond: () => 0 });
      expect(res.guess.length).toBe(guessRounds(living.length));
      expect(new Set(res.guess.map(r => r.owner)).size,
        'the same queen owned two items').toBe(res.guess.length);
      expect(new Set(res.guess.map(r => r.item)).size,
        'the same item went up twice').toBe(res.guess.length);
    }
  });
});

describe('the guessing', () => {
  it('never asks a queen to identify her own things', () => {
    const players = asMap(castOf(9, 21));
    const living = Object.keys(players);
    const res = runMini({ living, mini: miniById('guess-who'), players,
      rng: rngFor(404), bond: () => 0 });
    for (const r of res.guess) {
      expect(Object.keys(r.votes), 'the owner guessed her own item')
        .not.toContain(r.owner);
      expect(r.of, 'the round counted a guess nobody made')
        .toBe(Object.keys(r.votes).length);
      expect(r.knew.every(n => r.votes[n] === r.owner)).toBe(true);
      expect(r.count).toBe(r.knew.length);
      const counted = {};
      for (const g of Object.values(r.votes)) counted[g] = (counted[g] || 0) + 1;
      expect(r.tally, 'the tally is not the ballots').toEqual(counted);
    }
    /* And she is scored over the rounds she was ASKED, not over all of them:
       the owner sits her own round out, so a raw count would quietly punish
       whoever came up least often. */
    for (const n of living) {
      const asked = res.guess.filter(r => r.owner !== n).length;
      expect(res.detail[n].of, `${n} was scored over the wrong denominator`).toBe(asked);
      expect(res.detail[n].right).toBeLessThanOrEqual(asked);
    }
  });

  it('pays the queen who knows the room, over and over', () => {
    /* The measurement the design exists for, and the one that caught the
       first build scoring candidates by their own loudness: a queen close to
       the owner must get it right far more often than a stranger. Measured
       over forty seasons — close 58%, flat 10%, cold 5% — so these floors sit
       well inside what was seen and well outside chance. */
    const players = asMap(castOf(12, 31));
    const living = Object.keys(players);
    let closeHit = 0; let close = 0; let coldHit = 0; let cold = 0;
    for (let s = 1; s <= 60; s++) {
      /* A fixed, lopsided room: each queen is close to the two either side of
         her and cannot stand everybody else. */
      const idx = Object.fromEntries(living.map((n, i) => [n, i]));
      const bond = (a, b) => (Math.abs(idx[a] - idx[b]) <= 2 ? 6 : -4);
      const res = runMini({ living, mini: miniById('guess-who'), players,
        rng: rngFor(s * 101 + 7), bond });
      for (const r of res.guess) {
        for (const [v, g] of Object.entries(r.votes)) {
          if (bond(v, r.owner) > 0) { close++; if (g === r.owner) closeHit++; } else { cold++; if (g === r.owner) coldHit++; }
        }
      }
    }
    const near = closeHit / close; const far = coldHit / cold;
    // eslint-disable-next-line no-console
    console.log(`a queen she knows: ${(near * 100).toFixed(1)}%   a stranger: `
      + `${(far * 100).toFixed(1)}%   chance: ${(100 / (living.length - 1)).toFixed(1)}%`);
    expect(near, 'knowing her bought nothing').toBeGreaterThan(0.4);
    expect(near, 'the bond is the only thing in the game').toBeLessThan(0.95);
    expect(near / Math.max(0.01, far), 'a stranger does as well as a friend')
      .toBeGreaterThan(2);
  });

  it('is beatable and is not a coin flip', () => {
    const players = asMap(castOf(12, 77));
    const living = Object.keys(players);
    let hit = 0; let of = 0;
    for (let s = 1; s <= 40; s++) {
      const res = runMini({ living, mini: miniById('guess-who'), players,
        rng: rngFor(s * 53 + 11), bond: () => 0 });
      for (const r of res.guess) {
        of += r.of; hit += r.count;
      }
    }
    const rate = hit / of;
    // eslint-disable-next-line no-console
    console.log(`a room with no bonds at all gets ${(rate * 100).toFixed(1)}% `
      + `(chance ${(100 / (living.length - 1)).toFixed(1)}%)`);
    /* Even with nothing between them the likeness is evidence, so the room
       beats chance — and does not run away with it, because a wig is not a
       signed confession. */
    expect(rate, 'the likeness is worth nothing').toBeGreaterThan(1.3 / (living.length - 1));
    expect(rate, 'the room simply knows the answer').toBeLessThan(0.5);
  });
});

describe('being known, or not', () => {
  const run = bond => runMini({
    living: Object.keys(asMap(castOf(11, 41))),
    mini: miniById('guess-who'), players: asMap(castOf(11, 41)),
    rng: rngFor(9), bond,
  });

  it('charges the queen nobody could place', () => {
    /* A FLAT BOND IS NOT A ROOM OF STRANGERS. The first version of this ran
       with `bond: () => -6` and never saw the event at all, because a
       constant cancels out of the comparison — every candidate is equally
       unknown, so the likeness alone decides and somebody lands on her. The
       queen nobody can place is produced by an UNEVEN room, which is what a
       real season has. */
    const players = asMap(castOf(11, 41));
    const living = Object.keys(players);
    const idx = Object.fromEntries(living.map((n, i) => [n, i]));
    let fired = 0; let rounds = 0;
    for (let s = 1; s <= 30; s++) {
      const res = runMini({ living, mini: miniById('guess-who'), players,
        rng: rngFor(s * 37 + 3),
        // Two cliques who know each other and nobody in between.
        bond: (a, b) => (idx[a] % 2 === idx[b] % 2 ? 5 : -5) });
      rounds += res.guess.length;
      for (const e of res.events) {
        if (e.type !== 'nobody-knew-it-was-hers') continue;
        fired++;
        const r = res.guess.find(x => x.item === e.data.item);
        expect(r.count, 'somebody knew and she was charged anyway').toBe(0);
        expect(e.pop[e.players[0]]).toBeLessThan(0);
      }
    }
    expect(fired, 'no queen in thirty games went unrecognised').toBeGreaterThan(0);
    /* And it is not most rounds either. A verdict that lands on a fifth of
       the rounds is a verdict; one that lands on all of them is the format
       saying nobody knows anybody, which is not a show. */
    expect(fired / rounds, 'the room never places anybody').toBeLessThan(0.5);
  });

  it('never charges her and credits her for the same round', () => {
    const res = run((a, b) => ((a.length + b.length) % 9) - 3);
    const byItem = {};
    for (const e of res.events) {
      if (!['nobody-knew-it-was-hers', 'the-room-knew-her-instantly'].includes(e.type)) continue;
      (byItem[e.data.item] ||= []).push(e.type);
    }
    for (const [item, list] of Object.entries(byItem)) {
      expect(list.length, `${item} drew two verdicts`).toBe(1);
    }
  });

  it('gives the friend who missed it one card, and only when she was close', () => {
    const warm = run(() => 6);
    const miss = warm.events.filter(e => e.type === 'her-own-girl-missed-it');
    for (const r of warm.guess) {
      expect(miss.filter(e => e.data.item === r.item).length,
        'more than one betrayal card in one round').toBeLessThanOrEqual(1);
    }
    for (const e of miss) {
      const r = warm.guess.find(x => x.item === e.data.item);
      expect(r.votes[e.players[0]], 'she got it right and was charged anyway')
        .not.toBe(r.owner);
      expect(e.bond[0][2], 'the miss cost nothing').toBeLessThan(0);
    }
    const strangers = run(() => -6);
    expect(strangers.events.some(e => e.type === 'her-own-girl-missed-it'),
      'a room of strangers produced a betrayal').toBe(false);
  });
});

describe('the segment reaches a screen', () => {
  it('renders the question, the answers and the reveal', () => {
    const row = playedRow();
    expect(row, 'the mini was never scheduled').toBeTruthy();
    const rounds = row.dr.mini.rounds || [];
    expect(rounds.length, 'the rounds never reached the row').toBeGreaterThan(0);
    expect(row.dr.scenes.filter(s => s.kind === 'chal:mini-guess').length)
      .toBe(rounds.length);
    /* NOBODY PERFORMS IN THIS ONE, same as the vote. */
    expect(row.dr.scenes.filter(s => s.kind === 'chal:mini-attempt').length,
      'a guessing mini rendered performance cards').toBe(0);
    window._tvState = {};
    const screen = dragScreens(row).find(s => /Mini/i.test(s.label || ''));
    expect(screen, 'no mini screen').toBeTruthy();
    for (const r of rounds) {
      expect(screen.html.includes(r.prompt.slice(0, 20)),
        `the screen never asked "${r.prompt}"`).toBe(true);
      /* THE REVEAL IS THE CARD. Without it the screen is a bar chart of
         wrong answers with no answer under it. */
      expect(screen.html).toContain(`It was ${r.owner}'s.`);
      expect(screen.html).toContain(r.count === 0
        ? `Not one of ${r.of} knew.` : `${r.count} of ${r.of} knew.`);
    }
  });

  it('files the whole segment on the mini screen and nowhere else', () => {
    const row = playedRow();
    if (!row) return;
    const sections = sceneSections(row);
    expect((sections.get('dr-mini') || []).some(s => s.kind === 'chal:mini-guess'),
      'the guess cards left the mini screen').toBe(true);
    for (const [id, list] of sections) {
      if (id === 'dr-mini') continue;
      expect(list.some(s => s.kind === 'chal:mini-guess'),
        `a guess card leaked onto ${id}`).toBe(false);
    }
  });

  it('still announces the mini and still names the winner, in that order', () => {
    const row = playedRow();
    if (!row) return;
    const kinds = row.dr.scenes.filter(s => s.step === 'mini').map(s => s.kind);
    expect(kinds.indexOf('chal:mini-announce')).toBeLessThan(kinds.indexOf('chal:mini-guess'));
    expect(kinds.lastIndexOf('chal:mini-guess')).toBeLessThan(kinds.indexOf('chal:mini-win'));
  });
});

describe('the catalogue, and the quiz it stopped pretending to be', () => {
  it('registers Guess Who with a desc that explains the game', () => {
    const m = MINI_TYPES.find(x => x.id === 'guess-who');
    expect(m, 'the mini is not registered').toBeTruthy();
    expect(m.interaction).toBe('guess');
    expect(m.desc.length).toBeGreaterThan(200);
    expect(/right answer|got the most/i.test(m.desc),
      'the desc never says how you win it').toBe(true);
  });

  it('keeps the quiz, under a name that is not a lie', () => {
    /* It was `Herstory Quiz`, which promises trivia, resolved as `targets`,
       which is one queen doing a bit about another — and the thirty-two lines
       actually written for it agree with the interaction, not the name: a
       question about {b} scored on the funniest WRONG answer. The name was
       the defect. */
    const m = MINI_TYPES.find(x => x.id === 'quiz');
    expect(m, 'the quiz was deleted along with its pool').toBeTruthy();
    expect(m.interaction).toBe('targets');
    expect(/quiz/i.test(m.name), 'the name still promises trivia').toBe(false);
    expect(m.desc.length, 'the desc still does not explain it').toBeGreaterThan(200);
  });

  it('registers the three consequences, ready for their prose', () => {
    for (const id of ['nobody-knew-it-was-hers', 'the-room-knew-her-instantly',
      'her-own-girl-missed-it']) {
      const spec = MAXI_EVENTS.find(e => e.id === id);
      expect(spec, `${id} fires and is not in the catalogue`).toBeTruthy();
      expect(spec.from).toBe('mini');
      expect(spec.note.length, `${id} has no brief for the writer`).toBeGreaterThan(40);
    }
  });
});
