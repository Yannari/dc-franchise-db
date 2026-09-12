// ══════════════════════════════════════════════════════════════════════
// dr-mini.test.js — a mini is aimed at somebody
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { runMini, applyMiniEvents } from '../js/dr/mini.js';
import { MINI_TYPES, miniById } from '../js/dr/data/minis.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, over = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: Object.fromEntries(STATS.map(k => [k, 5])),
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
  ...over,
});
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay'];
const players = Object.fromEntries(NAMES.map(n => [n, mk(n)]));
const seeded = i => rngFor(i * 7919 + 13);

const run = (id, over = {}) => runMini({
  living: NAMES, mini: miniById(id), players, rng: seeded(1),
  bond: () => 0, star: {}, ...over,
});

describe('the catalogue', () => {
  it('every mini declares what kind of thing it is', () => {
    for (const m of MINI_TYPES) {
      /* `vote` is the fourth: the room answers a question about itself and
         nobody performs. It is scored on matching the majority rather than on
         a craft roll, which is why js/dr/stage.js renders it on its own
         branch — see js/dr/data/spill.js. `guess` is its mirror: the room
         works out whose thing it is, and there IS a right answer. */
      expect(['solo', 'targets', 'pairs', 'vote', 'guess'],
        `${m.id} has interaction "${m.interaction}"`)
        .toContain(m.interaction);
      expect(['pick-order', 'captain', 'first-pick', 'prize'], m.id).toContain(m.buys);
      expect(m.blend, m.id).toBeTruthy();
    }
  });

  it('the two that are about another queen are marked as such', () => {
    // Reading and Puppet Parody are one queen doing a bit ABOUT another. That
    // is the whole segment, and it used to resolve as a private stat roll.
    expect(miniById('reading').interaction).toBe('targets');
    expect(miniById('puppets').interaction).toBe('targets');
    expect(miniById('wig-swap').interaction).toBe('pairs');
    expect(miniById('photoshoot').interaction).toBe('solo');
  });
});

describe('every mini still resolves', () => {
  it('scores everybody and names a winner, whatever the shape', () => {
    for (const m of MINI_TYPES) {
      const out = run(m.id);
      expect(Object.keys(out.scores).length, m.id).toBe(NAMES.length);
      expect(NAMES, m.id).toContain(out.winner);
      for (const n of NAMES) expect(Number.isFinite(out.scores[n]), `${m.id}/${n}`).toBe(true);
    }
  });

  it('the winner is the highest score', () => {
    for (const m of MINI_TYPES) {
      const out = run(m.id);
      expect(out.scores[out.winner], m.id).toBe(Math.max(...Object.values(out.scores)));
    }
  });

  it('a solo mini stays a clean stat roll and produces no events', () => {
    for (const id of ['photoshoot', 'dance-off', 'quick-drag']) {
      expect(run(id).events, id).toEqual([]);
    }
  });

  it('and a comedy queen still wins the comedy mini', () => {
    const p = { ...players, Bee: mk('Bee', { comedy: 10, acting: 9 }) };
    let wins = 0;
    for (let i = 0; i < 40; i++) {
      if (run('reading', { players: p, rng: seeded(i) }).winner === 'Bee') wins++;
    }
    expect(wins / 40).toBeGreaterThan(0.5);
  });
});

describe('a mini that is aimed at somebody', () => {
  it('gives every queen a target', () => {
    const out = run('reading');
    for (const n of NAMES) expect(out.detail[n].target, n).toBeTruthy();
    for (const n of NAMES) expect(out.detail[n].target, n).not.toBe(n);
  });

  it('a bold queen aims at the biggest name in the room', () => {
    const star = { Ada: 2, Bee: 2, Cleo: 2, Dot: 2, Eve: 2, Fay: 10 };
    const p = { ...players, Ada: mk('Ada', {}, { stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), boldness: 10 } }) };
    let atFay = 0;
    for (let i = 0; i < 60; i++) {
      if (run('reading', { players: p, star, rng: seeded(i) }).detail.Ada.target === 'Fay') atFay++;
    }
    expect(atFay / 60).toBeGreaterThan(0.25);
  });

  it('a read that lands is worth something; one that misses costs her', () => {
    const sharp = Object.fromEntries(NAMES.map(n => [n, mk(n, { comedy: 10, acting: 10 })]));
    const blunt = Object.fromEntries(NAMES.map(n => [n, mk(n, { comedy: 1, acting: 1 })]));
    let landed = null;
    let missed = null;
    for (let i = 0; i < 30 && !(landed && missed); i++) {
      landed = landed || run('reading', { players: sharp, rng: seeded(i) })
        .events.find(e => e.type === 'read-landed');
      missed = missed || run('reading', { players: blunt, rng: seeded(i) })
        .events.find(e => e.type === 'read-missed');
    }
    expect(landed, 'nobody sharp ever landed a read').toBeTruthy();
    expect(Object.values(landed.pop)[0]).toBeGreaterThan(0);
    expect(missed, 'nobody blunt ever missed').toBeTruthy();
    expect(Object.values(missed.pop)[0]).toBeLessThan(0);
  });

  it('she pulls it on a friend, and the friend notices', () => {
    const bond = () => 8;
    let pulled = null;
    for (let i = 0; i < 30 && !pulled; i++) {
      pulled = run('reading', { bond, rng: seeded(i) })
        .events.find(e => e.type === 'pulled-the-punch');
    }
    expect(pulled, 'a room of close friends never once softened a read').toBeTruthy();
    expect(pulled.bond[0][2]).toBeGreaterThan(0);
  });

  it('and a read of somebody she cannot stand has more teeth than one of a friend', () => {
    const mean = b => {
      let t = 0;
      for (let i = 0; i < 60; i++) {
        const out = run('reading', { bond: () => b, rng: seeded(i) });
        t += Object.values(out.scores).reduce((x, y) => x + y, 0) / NAMES.length;
      }
      return t / 60;
    };
    expect(mean(-8)).toBeGreaterThan(mean(8));
  });
});

describe('a mini the room does to each other', () => {
  it('pairs everybody up', () => {
    const out = run('wig-swap');
    expect(out.pairs.length).toBe(3);
    expect(out.pairs.flat().filter(Boolean).sort()).toEqual([...NAMES].sort());
    for (const n of NAMES) expect(out.detail[n].partner, n).toBeTruthy();
  });

  it('leaves nobody out of an odd room', () => {
    const five = NAMES.slice(0, 5);
    const out = runMini({
      living: five, mini: miniById('wig-swap'), players, rng: seeded(2), bond: () => 0,
    });
    expect(Object.keys(out.scores).length).toBe(5);
    expect(out.pairs.flat().filter(Boolean).sort()).toEqual([...five].sort());
  });

  it('her partner half-decides her result', () => {
    // The whole point: she wears the wig somebody else styled for her.
    const good = Object.fromEntries(NAMES.map(n => [n, mk(n, { design: 10, runway: 10 })]));
    const bad = Object.fromEntries(NAMES.map(n => [n, mk(n, { design: 1, runway: 1 })]));
    const mean = p => {
      let t = 0;
      for (let i = 0; i < 40; i++) {
        const o = runMini({ living: NAMES, mini: miniById('wig-swap'), players: p, rng: seeded(i), bond: () => 0 });
        t += Object.values(o.scores).reduce((x, y) => x + y, 0) / NAMES.length;
      }
      return t / 40;
    };
    expect(mean(good)).toBeGreaterThan(mean(bad) + 3);
  });

  it('a pair who did well for each other feel it, and so does one who did not', () => {
    const good = Object.fromEntries(NAMES.map(n => [n, mk(n, { design: 10, runway: 10 })]));
    const bad = Object.fromEntries(NAMES.map(n => [n, mk(n, { design: 1, runway: 1 })]));
    const find = (p, type) => {
      for (let i = 0; i < 30; i++) {
        const e = runMini({ living: NAMES, mini: miniById('wig-swap'), players: p, rng: seeded(i), bond: () => 0 })
          .events.find(x => x.type === type);
        if (e) return e;
      }
      return null;
    };
    const proud = find(good, 'did-her-proud');
    const dirty = find(bad, 'did-her-dirty');
    expect(proud, 'nobody ever did a good job on a partner').toBeTruthy();
    expect(proud.bond[0][2]).toBeGreaterThan(0);
    expect(dirty, 'nobody ever did a bad one').toBeTruthy();
    expect(dirty.bond[0][2]).toBeLessThan(0);
  });
});

describe('consequences', () => {
  it('every event a mini fires changes something', () => {
    const ctx = { addBond: () => {}, popDelta: () => {} };
    for (const m of MINI_TYPES) {
      for (let i = 0; i < 20; i++) {
        const out = run(m.id, { rng: seeded(i), bond: (a, b) => (a < b ? 6 : -6) });
        expect(() => applyMiniEvents(out.events, ctx), `${m.id} seed ${i}`).not.toThrow();
        for (const e of out.events) {
          expect(e.players.length, `${m.id}: "${e.type}" names nobody`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('refuses an event that changes nothing', () => {
    expect(() => applyMiniEvents([{ type: 'nothing', players: ['Ada'], bond: [], pop: {}, state: {} }],
      { addBond: () => {}, popDelta: () => {} })).toThrow(/consequence/i);
  });
});
