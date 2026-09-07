// ══════════════════════════════════════════════════════════════════════
// dr-chal-acting.test.js — three challenges, not one with three weightings
// ══════════════════════════════════════════════════════════════════════
//
// Acting, the commercial and improv shared the design module, which made three
// of nineteen challenges the same challenge. These assertions are mostly about
// them being DIFFERENT FROM EACH OTHER, because that is the thing that was
// broken and the thing that can silently break again.
import { describe, expect, it } from 'vitest';
import { SCRIPTS, PRODUCTS, PREMISES } from '../js/dr/data/scenes.js';
import { runMaxi, applyEvents } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, drag = {}, stats = {}) => ({
  name, slug: name.toLowerCase(), archetype: 'hero',
  stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), ...stats },
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5, ...drag },
});
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay', 'Gia', 'Hex'];
const seeded = i => rngFor(i * 7919 + 13);

function ctx(id, seed = 1, players = Object.fromEntries(NAMES.map(n => [n, mk(n)]))) {
  const bonds = {};
  return {
    living: Object.keys(players), players, maxi: maxiById(id), rng: seeded(seed),
    state: { record: Object.fromEntries(Object.keys(players).map(n => [n, []])), flags: {} },
    bond: (a, b) => bonds[[a, b].sort().join('|')] || 0,
    addBond: (a, b, d) => { const k = [a, b].sort().join('|'); bonds[k] = (bonds[k] || 0) + d; },
    popDelta: () => {}, miniWinner: 'Ada', mini: null, cfg: {},
  };
}

describe('the scene data', () => {
  it('scripts have named parts, one lead each, and a mix of what they need', () => {
    expect(SCRIPTS.length).toBeGreaterThanOrEqual(8);
    for (const s of SCRIPTS) {
      expect(s.blurb, s.id).toBeTruthy();
      expect(s.parts.filter(p => p.role === 'lead').length, s.id).toBe(1);
      expect(new Set(s.parts.map(p => p.name)).size, `${s.id} names a part twice`).toBe(s.parts.length);
      for (const p of s.parts) expect(['acting', 'comedy'], `${s.id}/${p.name}`).toContain(p.needs);
      // A script that wants one craft all the way down is one night repeated.
      expect(new Set(s.parts.map(p => p.needs)).size, `${s.id} needs one craft`).toBeGreaterThan(1);
    }
  });

  it('products and premises are named and distinct', () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(10);
    expect(PREMISES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(PRODUCTS.map(p => p.id)).size).toBe(PRODUCTS.length);
    expect(new Set(PREMISES.map(p => p.id)).size).toBe(PREMISES.length);
    // Every product carries the trap, which is what makes finding an angle
    // a decision rather than a dice roll.
    for (const p of PRODUCTS) expect(p.angle, p.id).toBeTruthy();
  });
});

describe('acting', () => {
  it('casts every queen in a NAMED part from one script', () => {
    const out = runMaxi(ctx('acting'));
    const script = out.assignment.script;
    expect(script, 'no script was chosen').toBeTruthy();
    for (const n of NAMES) {
      const part = out.performances[n].detail.part;
      expect(part, n).toBeTruthy();
      expect(out.performances[n].detail.script, n).toBe(script.name);
    }
  });

  it('nobody in a cast plays the same part', () => {
    for (let i = 0; i < 20; i++) {
      const out = runMaxi(ctx('acting', i));
      for (const t of out.assignment.teams) {
        const parts = t.map(n => out.performances[n].detail.part);
        expect(new Set(parts).size, `seed ${i}`).toBe(parts.length);
      }
    }
  });

  it('a forgetful queen drops a line and it costs her', () => {
    const forgetful = Object.fromEntries(NAMES.map(n => [n, mk(n, {}, { mental: 1 })]));
    let dropped = null;
    for (let i = 0; i < 20 && !dropped; i++) {
      dropped = runMaxi(ctx('acting', i, forgetful)).events.find(e => e.type === 'dropped-a-line');
    }
    expect(dropped, 'nobody with no memory ever dropped a line').toBeTruthy();
    expect(Object.values(dropped.pop)[0]).toBeLessThan(0);
    expect(dropped.data.part).toBeTruthy();
  });

  it('a bold queen talks over her scene partner, and the partner remembers', () => {
    const bold = Object.fromEntries(NAMES.map(n => [n, mk(n, {}, { boldness: 10 })]));
    let stepped = null;
    for (let i = 0; i < 25 && !stepped; i++) {
      stepped = runMaxi(ctx('acting', i, bold)).events.find(e => e.type === 'stepped-on-her');
    }
    expect(stepped, 'a whole cast at ten boldness never once talked over anybody').toBeTruthy();
    expect(stepped.bond[0][2]).toBeLessThan(0);
    expect(stepped.players.length).toBe(2);
  });

  it('a queen who can neither act nor land a joke gets the one-note note', () => {
    const flat = Object.fromEntries(NAMES.map(n => [n, mk(n, { acting: 2, comedy: 2 })]));
    const out = runMaxi(ctx('acting', 1, flat));
    expect(out.events.some(e => e.type === 'one-note')).toBe(true);
  });
});

describe('the director', () => {
  it('gives everybody a note, and taking it is a separate thing from hearing it', () => {
    const out = runMaxi(ctx('acting'));
    // The rehearsal exists at all — improv is the one that has none.
    const rehearsal = out.scenes.find(s => s.kind === 'rehearsal');
    expect(rehearsal, 'no rehearsal happened').toBeTruthy();
    expect(rehearsal.data.notes.length).toBe(NAMES.length);
    for (const note of rehearsal.data.notes) {
      expect(typeof note.good).toBe('boolean');
      expect(typeof note.took).toBe('boolean');
    }
  });

  it('a queen who reads the room but will not move ignores a good note', () => {
    const stubborn = Object.fromEntries(NAMES.map(n => [n, mk(n, {}, { intuition: 10, boldness: 1 })]));
    let ignored = null;
    for (let i = 0; i < 25 && !ignored; i++) {
      ignored = runMaxi(ctx('acting', i, stubborn)).events.find(e => e.type === 'ignored-the-note');
    }
    expect(ignored, 'nobody who cannot change course ever ignored a note').toBeTruthy();
  });

  it('and a note actually moves her score', () => {
    // If the direction did not reach the number it would be a scene about
    // nothing, which is the bug this whole module exists to fix.
    const mean = stats => {
      let t = 0;
      for (let i = 0; i < 40; i++) {
        const p = Object.fromEntries(NAMES.map(n => [n, mk(n, {}, stats)]));
        const out = runMaxi(ctx('acting', i, p));
        t += Object.values(out.performances).reduce((s, r) => s + r.parts.prep, 0) / NAMES.length;
      }
      return t / 40;
    };
    // High intuition and high nerve take good notes; the opposite pair do not.
    expect(mean({ intuition: 10, boldness: 10 })).toBeGreaterThan(mean({ intuition: 1, boldness: 1 }));
  });
});

describe('improv is not the acting challenge', () => {
  it('has NO rehearsal at all', () => {
    const out = runMaxi(ctx('improv'));
    expect(out.scenes.find(s => s.kind === 'no-rehearsal'), 'improv rehearsed').toBeTruthy();
    expect(out.scenes.find(s => s.kind === 'rehearsal')).toBeUndefined();
  });

  it('gives every queen a named premise, cold', () => {
    const out = runMaxi(ctx('improv'));
    for (const n of NAMES) expect(out.performances[n].detail.premise, n).toBeTruthy();
  });

  it('takes no prep term, because there was no preparation', () => {
    const out = runMaxi(ctx('improv'));
    for (const n of NAMES) expect(out.performances[n].parts.prep, n).toBe(0);
  });

  it('NERVE beats craft here, which is the whole difference', () => {
    // A cautious queen with better comedy should lose to a fearless one. This
    // is the assertion that stops improv drifting back into an acting check.
    const win = (a, b) => {
      const p = {
        ...Object.fromEntries(NAMES.map(n => [n, mk(n)])),
        Ada: mk('Ada', { comedy: 9, acting: 9 }, { boldness: a }),
        Bee: mk('Bee', { comedy: 4, acting: 4 }, { boldness: b }),
      };
      let bee = 0;
      for (let i = 0; i < 60; i++) {
        const out = runMaxi(ctx('improv', i, p));
        if (out.performances.Bee.perf > out.performances.Ada.perf) bee++;
      }
      return bee / 60;
    };
    // Bee is far worse at comedy and far braver, and it should show.
    expect(win(1, 10)).toBeGreaterThan(0.3);
  });

  it('a nervous queen freezes and a fearless one runs with it', () => {
    const timid = Object.fromEntries(NAMES.map(n => [n, mk(n, {}, { boldness: 1 })]));
    const brave = Object.fromEntries(NAMES.map(n => [n, mk(n, {}, { boldness: 10 })]));
    const find = (p, type) => {
      for (let i = 0; i < 25; i++) {
        const e = runMaxi(ctx('improv', i, p)).events.find(x => x.type === type);
        if (e) return e;
      }
      return null;
    };
    expect(find(timid, 'froze'), 'nobody nervous ever froze').toBeTruthy();
    expect(find(brave, 'ran-with-it'), 'nobody fearless ever ran with it').toBeTruthy();
  });
});

describe('the commercial is not either of them', () => {
  it('pairs the room and gives each pair a named product with a trap', () => {
    const out = runMaxi(ctx('commercial'));
    expect(out.assignment.teams.length).toBe(NAMES.length / 2);
    for (const n of NAMES) {
      expect(out.performances[n].detail.product, n).toBeTruthy();
      expect(typeof out.performances[n].detail.foundAngle, n).toBe('boolean');
    }
  });

  it('both halves of a pair sell the same product', () => {
    const out = runMaxi(ctx('commercial', 3));
    for (const [a, b] of out.assignment.teams) {
      expect(out.performances[a].detail.product).toBe(out.performances[b].detail.product);
    }
  });

  it('finding the angle is worth more than polish', () => {
    let found = null;
    for (let i = 0; i < 20 && !found; i++) {
      found = runMaxi(ctx('commercial', i)).events.find(e => e.type === 'found-the-angle');
    }
    expect(found, 'nobody ever found an angle').toBeTruthy();
    expect(Object.values(found.pop)[0]).toBeGreaterThan(0);
  });
});

describe('consequences', () => {
  it('every event all three fire survives the check', () => {
    for (const id of ['acting', 'commercial', 'improv']) {
      for (let i = 0; i < 15; i++) {
        const c = ctx(id, i);
        expect(() => applyEvents(runMaxi(c).events, c), `${id} seed ${i}`).not.toThrow();
      }
    }
  });
});
