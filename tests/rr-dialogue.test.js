// The Ridonculous Race: the writer, and the rules every pool is held to (dialogue plan, Task 3).
import { describe, it, expect } from 'vitest';
import { POOLS, PRUNED, variantFails } from '../js/rr/script/lines/index.js';
import { KITS, identityLine } from '../js/rr/script/identity.js';
import { writeScene, DIRECTOR_KINDS } from '../js/rr/script/write.js';
import { RR_FACT_KEYS } from '../js/rr/script/facts.js';
import { SCENES, playScene, emit } from '../js/rr/scenes.js';
import { REAL } from '../js/rr/places.js';
import { fixtureCtx } from './helpers/rr-catalogue.js';

const ROLE_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'don', 'local'];
const SLOT_KEYS = ['placing', 'teaser', 'teams', 'team', 'teamB', 'identity', 'identityB', 'place', 'task', 'side', 'partner', 'crush', 'target', 'reward', 'penalty', 'amount', 'local'];
const PRON = ['sub', 'obj', 'pos', 'posAdj', 'ref', 'Sub', 'Obj', 'PosAdj'];
// this show has no vote (spec §8; manual §19.4 "the format's own words")
const VOTE_WORDS = /\b(vote[sd]?|voting|ballots?|tribal|jury|evict(ed|ion)?|nominat(e|ed|ion)|the Arena|immunity)\b/i;
const HEAD_COUNT = /\b(you|us|we) (two|three|four|five|six)\b|\bthe (three|four|five|six) of (us|you)\b|\ball (three|four|five|six) of\b/i;
// the conversations that are scenes in themselves: a fight, a crush, a deal
const QUICK = new Set(['mat-montage', 'task-montage']);
const LONG = new Set(['blame', 'old-wound', 'silent-treatment', 'makeup', 'breakup', 'back-together', 'homesick', 'fear-through',
  'refuse', 'money-worry', 'crush-confided', 'confession-attempt', 'confession', 'near-kiss', 'jealousy', 'alliance-pitch',
  'alliance-betrayal', 'deal', 'deal-broken', 'trash-talk', 'confront', 'accusation', 'help-offer', 'rescue', 'console']);
const TOKEN = /\{(\w+)(?:\.(\w+))?\}/g;
const textOf = t => [t.say, t.conf, t.beat, ...Object.values(t.v || {}).flat()].filter(Boolean);

describe('rr dialogue: the rules every pool is held to', () => {
  const keys = Object.keys(POOLS);

  it('every pool is for a real kind and ending', () => {
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      const [kind, ending] = k.split('.');
      const known = SCENES[kind] || DIRECTOR_KINDS[kind];
      expect(known, k).toBeTruthy();
      const endings = SCENES[kind]?.endings || DIRECTOR_KINDS[kind];
      expect(ending === 'any' || endings.includes(ending), k).toBe(true);
    }
  });

  it('every pool has two entries that need no fact', () => {
    for (const k of keys) expect(POOLS[k].filter(e => !e.when || !Object.keys(e.when).length).length, k).toBeGreaterThanOrEqual(2);
  });

  it('entries gate only on whitelisted facts, and name only parts and slots that exist', () => {
    for (const [k, list] of Object.entries(POOLS)) for (const e of list) {
      for (const f of Object.keys(e.when || {})) expect(RR_FACT_KEYS, `${e.id} when.${f}`).toContain(f);
      for (const t of e.turns) {
        for (const f of Object.keys(t.when || {})) expect(RR_FACT_KEYS, `${e.id} turn when.${f}`).toContain(f);
        if (t.by) expect(ROLE_KEYS, `${e.id} by ${t.by}`).toContain(t.by);
        for (const s of textOf(t)) for (const m of s.matchAll(TOKEN)) {
          expect([...ROLE_KEYS, ...SLOT_KEYS], `${e.id}: {${m[1]}}`).toContain(m[1]);
          if (m[2]) expect(PRON, `${e.id}: {${m[1]}.${m[2]}}`).toContain(m[2]);
        }
      }
    }
  });

  it('no real place, no vote words, no head counts in a room, nobody says their own name', () => {
    for (const [k, list] of Object.entries(POOLS)) {
      const group = SCENES[k.split('.')[0]]?.cast === 'group';
      for (const e of list) for (const t of e.turns) for (const s of textOf(t)) {
        expect(REAL.test(s), `${e.id}: ${s}`).toBe(false);
        expect(VOTE_WORDS.test(s), `${e.id}: ${s}`).toBe(false);
        if (group) expect(HEAD_COUNT.test(s), `${e.id}: ${s}`).toBe(false);
        if (t.by && t.by !== 'don' && t.by !== 'local' && !t.beat) expect(new RegExp(`\\{${t.by}\\}`).test(s), `${e.id}: ${t.by} says own name: ${s}`).toBe(false);
      }
    }
  });

  it('entries are whole exchanges: 3 to 12 turns, and 6 to 12 for the scenes that are conversations', () => {
    for (const [k, list] of Object.entries(POOLS)) for (const e of list) {
      const n = e.turns.length;
      // the big cast's quick moments are a line or two; everything else is a scene
      if (QUICK.has(k.split('.')[0])) { expect(n, `${e.id}`).toBeLessThanOrEqual(3); continue; }
      expect(n, `${e.id}`).toBeGreaterThanOrEqual(LONG.has(k.split('.')[0]) ? 6 : 3);
      expect(n, `${e.id}`).toBeLessThanOrEqual(12);
    }
  });

  it('a word the reply picks up survives in every variant of the line it answers', () => {
    for (const list of Object.values(POOLS)) for (const e of list) for (const t of e.turns) {
      for (const w of t.keep || []) for (const v of Object.values(t.v || {}).flat()) expect(v.toLowerCase(), `${e.id} keep "${w}"`).toContain(w.toLowerCase());
    }
  });

  it('the voice gate drops a variant that loses the line', () => {
    expect(variantFails('Yes!', 'I saw {b} and {c} by the taxis, and they were looking at our tip.', 0, 'a')).toBeTruthy();
    expect(variantFails('Go! Now! Fast!', 'We should go now.')).toBe('fragments');
    expect(variantFails('I saw {b} at the taxis with our tip.', 'I saw {b} and {c} by the taxis, and they were looking at our tip.', 0, 'a')).toBeNull();
    expect(PRUNED).toBeTruthy();
  });
});

describe('rr dialogue: the writer', () => {
  it('writes a partner moment with names in, no braces left', () => {
    const ctx = fixtureCtx('tip-read');
    const sc = playScene(ctx, 'tip-read', () => 0.5, { ending: 'clear' });
    const w = writeScene(ctx.state, sc);
    expect(w).toBeTruthy();
    expect(w.lines.length).toBeGreaterThanOrEqual(3);
    for (const l of w.lines) expect(l.text).not.toMatch(/[{}]/);
    const t = ctx.state.teams[ctx.team.id];
    expect(w.lines.filter(l => l.kind !== 'beat').every(l => [t.a, t.b].includes(l.by))).toBe(true);
  });

  it('Don speaks as Don', () => {
    const ctx = fixtureCtx('don-place');
    const t = ctx.state.teams[ctx.team.id];
    const sc = emit(ctx.state, 'don-place', [t.a, t.b], 'plain', { team: ctx.team.id, place: 3, t: 400, stretch: 'mat', effects: [['placed', ctx.team.id, 3]] });
    const w = writeScene(ctx.state, sc);
    expect(w.lines.some(l => l.by === 'Don')).toBe(true);
    expect(w.lines.map(l => l.text).join(' ')).toMatch(/third/);
  });

  it('an identity line comes from the team\'s own kit; a custom identity hears only voice lines', () => {
    const builtIn = Object.keys(KITS)[0];
    expect(builtIn).toBeTruthy();
    const kit = KITS[builtIn];
    const ctx = fixtureCtx('tip-read');
    const t = ctx.state.teams[ctx.team.id];
    t.identity = builtIn;
    const all = new Set([...Object.values(kit.voice).flat(), ...Object.values(kit.specific).flat()]);
    for (let i = 0; i < 20; i++) {
      const line = identityLine(ctx.state, t.a, 'good', () => i / 20);
      if (line) expect(all.has(line)).toBe(true);
    }
    t.identity = null;
    t.custom = { name: 'Synchronized Swimmers', voice: builtIn, strength: builtIn };
    const voice = new Set(Object.values(kit.voice).flat());
    for (let i = 0; i < 20; i++) {
      const line = identityLine(ctx.state, t.a, 'good', () => i / 20);
      if (line) expect(voice.has(line)).toBe(true);
    }
  });
});
