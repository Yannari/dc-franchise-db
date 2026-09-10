// ══════════════════════════════════════════════════════════════════════
// dr-confessional.test.js — the piece to camera
// ══════════════════════════════════════════════════════════════════════
//
// The pools ship EMPTY, so every one of these fills a tier by hand first.
// That is the point rather than a workaround: a feature whose tests only ever
// see the unwritten state is a feature nobody has run, and this one has to be
// correct on the day somebody writes forty lines into it — not audited then.
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  confessionalsFor, candidatesFor, heatOf, mayBeShady, talksToCamera,
} from '../js/dr/confessional.js';
import {
  CONFESSIONAL_TIERS, CONFESSIONAL_IDS, unwrittenConfessionalTiers,
} from '../js/dr/data/confessional-lines.js';
import { rngFor } from '../js/dr/rng.js';
import { playDragSeason } from '../js/dr/season.js';

/** Fill every tier with four distinguishable lines, and put them back after. */
const FILLED = {};
function fillAll() {
  for (const t of CONFESSIONAL_TIERS) {
    FILLED[t.id] = t.lines;
    t.lines = [1, 2, 3, 4].map(n => `[${t.id}#${n}] {a} on {b}.`);
  }
}
function restore() {
  for (const t of CONFESSIONAL_TIERS) t.lines = FILLED[t.id] ?? t.lines;
}

const queen = (name, over = {}) => ({
  name,
  archetype: over.archetype || 'floater',
  stats: {
    strategic: 5, loyalty: 5, boldness: 10, intuition: 5, temperament: 5,
    ...(over.stats || {}),
  },
});

const ROOM = ['Ada', 'Bex', 'Cleo', 'Dot'];
const PLAYERS = {
  Ada: queen('Ada', { archetype: 'villain' }),
  Bex: queen('Bex', { archetype: 'villain' }),
  Cleo: queen('Cleo', { archetype: 'hero' }),
  Dot: queen('Dot', { archetype: 'villain' }),
};

/** A pair scene that cooled, i.e. one that can carry a shady reaction. */
const cold = (i, a = 'Ada', b = 'Bex') => ({
  id: `cold-${i}`, slot: 'werk-morning', players: [a, b], effects: { bond: -2 }, text: '',
});
const warm = (i, a = 'Ada', b = 'Bex') => ({
  id: `warm-${i}`, slot: 'werk-morning', players: [a, b], effects: { bond: +2 }, text: '',
});

// Always emit where the rules allow it, so the structural assertions are not
// at the mercy of the rate.
const always = { chance: 1, max: 99 };

describe('every pool is written', () => {
  it('reports no backlog', () => {
    expect(unwrittenConfessionalTiers()).toEqual([]);
  });

  it('emits cards now that the pools are filled', () => {
    const rows = confessionalsFor({
      scenes: [cold(1), cold(2), cold(3)], room: ROOM, players: PLAYERS,
      rng: rngFor(1), ...always,
    });
    expect(rows.length, 'filled pools should produce cards').toBeGreaterThan(0);
  });
});

describe('a confessional, once there is one to give', () => {
  beforeEach(fillAll);
  afterEach(restore);

  it('reacts to a scene, and is flagged as its own kind of shot', () => {
    const rows = confessionalsFor({
      scenes: [cold(1)], room: ROOM, players: PLAYERS, rng: rngFor(3), ...always,
    });
    expect(rows.length).toBe(1);
    const sc = rows[0].scene;
    expect(sc.confessional).toBe(true);
    expect(sc.reactsTo, 'it does not know what it is about').toBe('cold-1');
    expect(rows[0].index).toBe(0);
  });

  it('puts ONE queen in the shot, and who she is about rides beside it', () => {
    /* She is alone with a camera. A second name in `players` grows a second
       portrait on the card and it stops being a confessional. */
    for (let seed = 1; seed <= 40; seed++) {
      const rows = confessionalsFor({
        scenes: [cold(1), warm(2, 'Cleo', 'Dot')], room: ROOM, players: PLAYERS,
        rng: rngFor(seed), ...always,
      });
      for (const r of rows) {
        expect(r.scene.players.length, 'two faces in a confessional').toBe(1);
        expect(r.scene.about, 'she is talking about herself').not.toBe(r.scene.players[0]);
      }
    }
  });

  it('moves her edit and never a bond', () => {
    /* Nobody in the room heard it, so a confessional that changed how two
       queens felt would be a relationship they cannot account for. */
    for (let seed = 1; seed <= 40; seed++) {
      const rows = confessionalsFor({
        scenes: [cold(1), warm(2)], room: ROOM, players: PLAYERS,
        rng: rngFor(seed), ...always,
      });
      for (const r of rows) {
        expect(r.scene.effects.bond, 'a confessional moved a bond').toBeUndefined();
        expect(Object.keys(r.scene.effects.pop || {}), 'no consequence at all').toHaveLength(1);
      }
    }
  });

  it('fills every placeholder', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rows = confessionalsFor({
        scenes: [cold(1), warm(2)], room: ROOM, players: PLAYERS,
        rng: rngFor(seed), ...always,
      });
      for (const r of rows) {
        expect(r.scene.text, `braces left in "${r.scene.text}"`).not.toMatch(/\{[ab]\}/);
        expect(r.scene.text).toContain(r.scene.players[0]);
      }
    }
  });

  it('never leaves a hole where the other queen would be', () => {
    /* `alone` follows a scene with nobody else in it, so a line written with
       {b} in it has nothing to name. It produced "Q9 looks at the camera
       about ." on a real season before this was guarded. */
    const solo = i => ({ id: `solo-${i}`, slot: 'prep', players: ['Ada'],
      effects: { pop: { a: -1 } }, text: '' });
    for (let seed = 1; seed <= 40; seed++) {
      const rows = confessionalsFor({
        scenes: [solo(1), solo(2), solo(3)], room: ROOM, players: PLAYERS,
        rng: rngFor(seed), ...always,
      });
      for (const r of rows) {
        expect(r.scene.tier).toBe('alone');
        expect(r.scene.text, `a hole in "${r.scene.text}"`).not.toMatch(/about\s*\./);
        expect(r.scene.text).not.toMatch(/\{b\}/);
      }
    }
  });

  it('drops an alone line that names a second queen rather than the episode', () => {
    const t = CONFESSIONAL_TIERS.find(x => x.id === 'alone');
    t.lines = ['{a} says something about {b}.'];   // every line unusable
    const rows = confessionalsFor({
      scenes: [{ id: 's', slot: 'prep', players: ['Ada'], effects: { pop: { a: -1 } } }],
      room: ROOM, players: PLAYERS, rng: rngFor(2), ...always,
    });
    expect(rows, 'it rendered a sentence with a hole in it').toEqual([]);
  });

  it('never runs two in a row', () => {
    const scenes = [cold(1), cold(2), cold(3), cold(4), cold(5), cold(6)];
    for (let seed = 1; seed <= 30; seed++) {
      const rows = confessionalsFor({
        scenes, room: ROOM, players: PLAYERS, rng: rngFor(seed), ...always,
      });
      const idx = rows.map(r => r.index);
      for (let i = 1; i < idx.length; i++) {
        expect(idx[i] - idx[i - 1], 'two camera frames back to back').toBeGreaterThan(1);
      }
    }
  });

  it('caps how many a screen gets', () => {
    const scenes = Array.from({ length: 12 }, (_, i) => cold(i));
    for (let seed = 1; seed <= 30; seed++) {
      const rows = confessionalsFor({
        scenes, room: ROOM, players: PLAYERS, rng: rngFor(seed), chance: 1, max: 2,
      });
      expect(rows.length).toBeLessThanOrEqual(2);
    }
  });

  it('gives a queen at most one per episode, across slots', () => {
    const spoken = new Set();
    const seen = [];
    for (const slot of ['cold-open', 'werk-morning', 'prep', 'werk-elim-day']) {
      const rows = confessionalsFor({
        scenes: [cold(1), cold(2), cold(3)], room: ROOM, players: PLAYERS,
        rng: rngFor(7), spoken, slot, ...always,
      });
      for (const r of rows) seen.push(r.scene.players[0]);
    }
    expect(new Set(seen).size, 'the same queen talked twice').toBe(seen.length);
  });

  it('never puts the shady read in a nice queen\'s mouth', () => {
    /* The franchise rule, unchanged: nice archetypes never scheme, and drag's
       version of scheming is the read. Being hurt is not scheming, so
       `taken-cold` is not gated — only the two tiers that ARE shade. */
    const nice = { Ada: queen('Ada', { archetype: 'hero' }),
      Bex: queen('Bex', { archetype: 'loyal-soldier' }),
      Cleo: queen('Cleo', { archetype: 'goat' }),
      Dot: queen('Dot', { archetype: 'underdog' }) };
    for (let seed = 1; seed <= 60; seed++) {
      const rows = confessionalsFor({
        scenes: [cold(1), cold(2), cold(3)], room: ROOM, players: nice,
        rng: rngFor(seed), ...always,
      });
      for (const r of rows) {
        expect(['did-cold', 'watched-cold'],
          `${r.scene.players[0]} (nice) spoke the ${r.scene.tier} tier`)
          .not.toContain(r.scene.tier);
      }
    }
  });

  it('only lets somebody who was there speak about it', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rows = confessionalsFor({
        scenes: [cold(1, 'Ada', 'Bex')], room: ROOM, players: PLAYERS,
        rng: rngFor(seed), ...always,
      });
      for (const r of rows) expect(ROOM).toContain(r.scene.players[0]);
    }
  });

  it('a replay of the same seed says the same thing', () => {
    const run = () => confessionalsFor({
      scenes: [cold(1), warm(2), cold(3)], room: ROOM, players: PLAYERS,
      rng: rngFor(11), ...always,
    }).map(r => `${r.index}:${r.scene.tier}:${r.scene.players[0]}:${r.scene.text}`);
    expect(run()).toEqual(run());
  });
});

describe('the parts it is built from', () => {
  it('reads the direction off the scene\'s own consequences', () => {
    expect(heatOf({ effects: { bond: -1 } })).toBe('cold');
    expect(heatOf({ effects: { bond: 3 } })).toBe('warm');
    // No bond: the edit stands in, because a scene that cost her the room is
    // a cold scene whether or not two queens fell out over it.
    expect(heatOf({ effects: { pop: { a: -2 } } })).toBe('cold');
    expect(heatOf({ effects: { pop: { a: 2 } } })).toBe('warm');
    expect(heatOf({ effects: {} }), 'a scene with no direction').toBe(null);
  });

  it('places the actor, the one it happened to, and the watchers', () => {
    const c = candidatesFor(cold(1, 'Ada', 'Bex'), ROOM);
    const byName = Object.fromEntries(c.map(x => [x.name, x.tier]));
    // players[0] is the actor everywhere in the werk room — applyWerkScene
    // reads it as the `a` of both the bond and the pop map.
    expect(byName.Ada).toBe('did-cold');
    expect(byName.Bex).toBe('taken-cold');
    expect(byName.Cleo).toBe('watched-cold');
    expect(byName.Dot).toBe('watched-cold');
  });

  it('a solo scene has only her to talk about it', () => {
    const c = candidatesFor({ id: 's', players: ['Ada'], effects: { pop: { a: -1 } } }, ROOM);
    expect(c).toMatchObject([{ name: 'Ada', tier: 'alone', about: null }]);
    expect(c.length).toBe(1);
  });

  it('gives the queen with something riding on it the loudest claim', () => {
    /* A witness used to be drawn flat out of the room: the queen with no
       relationship to either of them spoke as often as the one whose closest
       ally had just been read. */
    const bond = (x, y) => ((x === 'Cleo' || y === 'Cleo')
      && (x === 'Ada' || y === 'Ada') ? 9 : 0);
    const c = candidatesFor(cold(1, 'Ada', 'Bex'), ROOM, bond);
    const stake = Object.fromEntries(c.map(x => [x.name, x.stake]));
    expect(stake.Cleo, 'the invested witness has no more claim than a stranger')
      .toBeGreaterThan(stake.Dot);
  });

  it('has her talk about the one she actually has feelings about', () => {
    /* Which of the two a witness named used to be a coin flip. */
    const bond = (x, y) => (([x, y].includes('Cleo') && [x, y].includes('Bex')) ? 8 : 0);
    const c = candidatesFor(cold(1, 'Ada', 'Bex'), ROOM, bond);
    const cleo = c.find(x => x.name === 'Cleo');
    expect(cleo.about(() => 0.99)).toBe('Bex');
    expect(cleo.about(() => 0.01), 'the tie-break overrode a real tie').toBe('Bex');
  });

  it('still flips a coin when she has no reason to prefer either', () => {
    const c = candidatesFor(cold(1, 'Ada', 'Bex'), ROOM);   // no bonds at all
    const cleo = c.find(x => x.name === 'Cleo');
    expect(new Set([cleo.about(() => 0.1), cleo.about(() => 0.9)]).size).toBe(2);
  });

  it('applies the franchise eligibility rule and no other', () => {
    expect(mayBeShady({ archetype: 'villain' })).toBe(true);
    expect(mayBeShady({ archetype: 'hero', stats: { strategic: 10, loyalty: 1 } })).toBe(false);
    // Neutral: strategic >= 6 AND loyalty <= 4.
    expect(mayBeShady({ archetype: 'floater', stats: { strategic: 7, loyalty: 3 } })).toBe(true);
    expect(mayBeShady({ archetype: 'floater', stats: { strategic: 7, loyalty: 5 } })).toBe(false);
    expect(mayBeShady({ archetype: 'floater', stats: { strategic: 5, loyalty: 3 } })).toBe(false);
  });

  it('lets the bold talk more than the quiet', () => {
    expect(talksToCamera({ stats: { boldness: 10 } }))
      .toBeGreaterThan(talksToCamera({ stats: { boldness: 1 } }));
  });
});

// ══════════════════════════════════════════════════════════════════════
// AND IT COSTS THE SEASON NOTHING
// ══════════════════════════════════════════════════════════════════════
//
// The first wiring drew from the week's own generator. The confessional pass
// runs before the mini, the maxi and the judging, so every number it took
// shifted every decision after it and the season stopped producing events it
// used to: `roasted-the-panel` went from firing to unreachable across the
// reach suite, a written event killed by an unrelated feature spending random
// numbers upstream of it. Caught by a suite that is not about confessionals
// at all, which is the only reason it was caught.
//
// So the pass draws its own stream, and this is the property that says so:
// filling forty lines into these pools must not move one other thing in the
// season. It is asserted with the pools FULL, because empty pools make it
// true for free.
describe('writing the pools does not rewrite the season', () => {
  beforeEach(fillAll);
  afterEach(restore);

  const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
    'loyalty', 'boldness', 'intuition', 'temperament'];
  const cast = (n, seed) => {
    const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
    return Array.from({ length: n }, (_, i) => ({
      name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f',
      archetype: ['villain', 'hero', 'schemer', 'floater', 'mastermind', 'goat'][i % 6],
      age: 21 + i,
      stats: Object.fromEntries(STATS.map(k => [k, r()])),
      drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
    }));
  };
  const play = () => playDragSeason({
    cast: cast(12, 5), seed: 5, config: {},
    bond: () => 0, addBond: () => {}, popDelta: () => {},
  });
  // Everything the season produced EXCEPT the confessionals themselves.
  const fingerprint = s => s.rows.map(row => [
    row.num,
    row.exits.map(x => x.name).join('+'),
    (row.dr.call?.win || []).join('+'),
    row.dr.scenes.filter(x => !x.data?.confessional)
      .map(x => `${x.kind}:${(x.data?.players || []).join('/')}`).join(' '),
  ].join('|')).join(' ~ ');

  it('emits confessionals with the pools full', () => {
    const n = play().rows.flatMap(r => r.dr.scenes).filter(x => x.data?.confessional).length;
    expect(n, 'the wiring produced nothing end to end').toBeGreaterThan(0);
  });

  it('changes nothing else about the season', () => {
    const withThem = fingerprint(play());
    restore();                       // pools empty again
    const without = fingerprint(play());
    fillAll();
    expect(withThem, 'the confessional pass moved the season around it')
      .toBe(without);
  });
});
