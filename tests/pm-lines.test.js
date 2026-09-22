import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { POOLS, HUT, SPEAKERS, FACT_KEYS, renderScript } from '../js/pm/script.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

// Every entry in every pool, with its variant blocks opened out.
const ENTRIES = [...Object.entries(POOLS).flatMap(([k, pool]) => pool.map(e => [k, e])),
  ...Object.entries(HUT).flatMap(([k, pool]) => pool.map(e => [`hut:${k}`, e]))];
function texts(e) {
  const out = [e.stage, e.beat];
  for (const t of e.turns || []) {
    if (Array.isArray(t)) out.push(t[1]);
    else for (const v of t.vary) { out.push(v.beat); for (const [, x] of v.turns) out.push(x); }
  }
  return out.filter(Boolean);
}
function turns(e) {
  return (e.turns || []).flatMap(t => (Array.isArray(t) ? [t] : t.vary.flatMap(v => v.turns)));
}
const whens = e => [e.when, ...(e.turns || []).flatMap(t => (Array.isArray(t) ? [] : t.vary.map(v => v.when)))].filter(Boolean);
const beats = e => [e.beat, ...(e.turns || []).flatMap(t => (Array.isArray(t) ? [] : t.vary.map(v => v.beat)))].filter(Boolean);

// A knowing last line is how prose starts reading like a translation (spec
// §16.5, round 3). Grows as the read-throughs find more.
const STINGS = ['the energy of', 'nobody asked for', 'which is new', "it doesn't help", 'they both notice',
  'sits with it', 'main character', 'understood the assignment', 'and honestly', 'in this economy'];

describe('the pools are well-formed', () => {
  it('ids are unique', () => {
    const ids = ENTRIES.map(([, e]) => e.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
  it('speakers are a, b, c, dior or narrator', () => {
    for (const [k, e] of ENTRIES) for (const [who] of turns(e)) expect(SPEAKERS, `${k} ${e.id}`).toContain(who);
  });
  it('every condition is a known fact', () => {
    for (const [k, e] of ENTRIES) for (const w of whens(e)) for (const key of Object.keys(w)) {
      expect(FACT_KEYS, `${k} ${e.id}: ${key}`).toContain(key);
    }
  });
  it('a scene only names the people its kind casts', () => {
    // comedy casts one islander, gossip three, everything else two. A {b}
    // in a one-person scene renders as a raw placeholder, or as nobody.
    const CAST = { comedy: 1, gossip: 3 };
    for (const [k, e] of ENTRIES) {
      if (k.startsWith('hut:')) continue;
      const size = CAST[k] || 2;
      const allowed = ['a', 'b', 'c'].slice(0, size);
      for (const x of texts(e)) for (const [, who] of x.matchAll(/\{([abc])[.}]/g)) expect(allowed, `${k} ${e.id}: ${x}`).toContain(who);
      for (const [who] of turns(e)) if (['a', 'b', 'c'].includes(who)) expect(allowed, `${k} ${e.id}`).toContain(who);
    }
  });
  it("{pa} and {pb} only appear where that partner exists", () => {
    // {pa} is a's partner: the entry (or a's own reply) must require `taken`.
    // {pb} is b's partner: the entry must require `bTaken`, or b's own reply `taken`.
    const has = (x, slot) => new RegExp(`\{${slot}[.}]`).test(x);
    for (const [k, e] of ENTRIES) {
      const own = [e.stage, e.beat, ...(e.turns || []).filter(Array.isArray).map(t => t[1])].filter(Boolean);
      for (const x of own) {
        if (has(x, 'pa')) expect(e.when?.taken, `${k} ${e.id}: ${x}`).toBe(true);
        if (has(x, 'pb')) expect(e.when?.bTaken, `${k} ${e.id}: ${x}`).toBe(true);
      }
      for (const blk of (e.turns || []).filter(t => !Array.isArray(t))) for (const v of blk.vary) {
        for (const x of [v.beat, ...v.turns.map(t => t[1])].filter(Boolean)) {
          const aOk = e.when?.taken || (blk.by === 'a' && v.when?.taken);
          const bOk = e.when?.bTaken || (blk.by === 'b' && v.when?.taken);
          if (has(x, 'pa')) expect(!!aOk, `${k} ${e.id}: ${x}`).toBe(true);
          if (has(x, 'pb')) expect(!!bOk, `${k} ${e.id}: ${x}`).toBe(true);
        }
      }
    }
  });
  it('every day-to-day pool has at least three scenes anyone can get', () => {
    // A condition that matches nobody must still find a scene. Gossip is cast
    // only for a witness, so `knows` is always true there and counts as none.
    for (const [k, pool] of Object.entries(POOLS)) {
      const open = pool.filter(e => !e.when || (k === 'gossip' && Object.keys(e.when).join() === 'knows'));
      expect(open.length, k).toBeGreaterThanOrEqual(3);
    }
  });
  it('every variant block has a plain reply with no condition', () => {
    for (const [k, e] of ENTRIES) for (const t of e.turns || []) {
      if (!Array.isArray(t)) expect(t.vary.some(v => !v.when), `${k} ${e.id}`).toBe(true);
    }
  });
});

describe('the words follow the rules', () => {
  it('no subject pronoun: "they" breaks the verb after it ("they is", "they\'s")', () => {
    for (const [k, e] of ENTRIES) for (const x of texts(e)) expect(x, `${k} ${e.id}`).not.toMatch(/\{[abc]\.(sub|Sub)\}/);
  });
  it('no name is written into a pool, only placeholders', () => {
    for (const [k, e] of ENTRIES) for (const x of texts(e)) {
      // A capitalised word straight after a placeholder slot's usual place would be a name;
      // the practical check is that nothing but {a}/{b}/{c} forms appear in braces.
      for (const [m] of x.matchAll(/\{[^}]*\}/g)) expect(m, `${k} ${e.id}`).toMatch(/^\{(pa|pb|a|b|c)(\.(obj|pos|posAdj|ref|Obj|PosAdj))?\}$/);
      expect(x, `${k} ${e.id}`).not.toMatch(/\bDior\b/);
    }
  });
  it("no other show's vocabulary", () => {
    for (const [k, e] of ENTRIES) for (const x of texts(e)) expect(foreignWordsIn(x, 'perfect-match'), `${k} ${e.id}: ${x}`).toEqual([]);
  });
  it('no sting endings', () => {
    for (const [k, e] of ENTRIES) for (const x of [...beats(e), ...turns(e).filter(([w]) => w === 'narrator').map(t => t[1])]) {
      for (const s of STINGS) expect(x.toLowerCase(), `${k} ${e.id}`).not.toContain(s);
    }
  });
});

describe('the reply is the replier\'s own', () => {
  const entry = { id: 't', turns: [['a', 'Can I borrow you?'], { by: 'b', vary: [
    { turns: [['b', 'plain']] },
    { when: { persona: 'wallflower' }, turns: [['b', 'quiet']], beat: 'quiet beat' },
    { when: { archetype: 'hothead' }, turns: [['b', 'hot']] },
  ] }] };
  const state = persona => ({ ep: 1, seed: 1, secrets: [], couples: [], ledger: { firstEp: {} }, emo: {},
    profiles: { A: { persona: 'fuckboy', role: 'starter', stats: { loyalty: 5 } },
      B: { persona, role: 'starter', stats: { loyalty: 5 } } } });
  it("reads b's persona when b replies, not a's", () => {
    setPlayers([{ name: 'A' }, { name: 'B' }]);
    const s = renderScript(entry, ['A', 'B'], state('wallflower'));
    expect(s.lines.map(l => l.text)).toEqual(['Can I borrow you?', 'quiet']);
    expect(s.beat).toBe('quiet beat');
    expect(s.id).toBe('t:1');
  });
  it('reads the archetype from the roster', () => {
    setPlayers([{ name: 'A' }, { name: 'B', archetype: 'hothead' }]);
    expect(renderScript(entry, ['A', 'B'], state('checklist')).lines[1].text).toBe('hot');
  });
  it('falls back to the plain reply when nothing fits', () => {
    setPlayers([{ name: 'A' }, { name: 'B' }]);
    expect(renderScript(entry, ['A', 'B'], state('checklist')).lines[1].text).toBe('plain');
  });
});
