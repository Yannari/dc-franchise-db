// The villa's conversations built from movements (js/pm/talk/, the 2026-10-22
// rebuild: docs/superpowers/specs/2026-10-22-pm-dialogue-rebuild-design.md).
// Every rule the old pools were held to (tests/pm-lines.test.js), plus the
// movements' own: a plan only names movements that exist, a placeholder only
// appears where the scene has somebody to fill it, and a required movement
// almost never comes up empty in a played season.
import { describe, expect, it } from 'vitest';
import { TALK } from '../js/pm/talk/index.js';
import { FACT_KEYS, TALK_MISSES } from '../js/pm/script.js';
import { SLOTS, REGIONAL_WORDS } from '../js/pm/lines/dialect.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import { brandsIn } from './helpers/brand-names.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';

const ENTRIES = Object.entries(TALK).flatMap(([kind, t]) => [
  ...Object.entries(t.moves).flatMap(([slot, pool]) => pool.map(e => [kind, slot, e])),
  ...t.notes.map(e => [kind, 'note', e]), ...(t.stages || []).map(e => [kind, 'stage', e])]);
const texts = e => [e.stage, e.beat, ...(e.turns || []).map(t => t[1])].filter(Boolean);
const spoken = e => (e.turns || []).map(t => t[1]);
const narration = e => [e.stage, e.beat].filter(Boolean);
const tag = (kind, slot, e) => `${kind}.${slot} ${e.id}`;

// Who a kind casts beyond {a} and {b}, and what fills {about}.
const THREE = new Set([
  'betray-see', 'betray-confront', 'villa-happy', 'redeem-doubt', 'grass-talk', 'parents-named', 'parents-advice', 'parents-mediate', 'exw-stir', 'exw-partner',
  'gossip', 'advice', 'jealous-confront', 'jealous-retaliate', 'kin-vet', 'kin-protect', 'ex-jealous', 'debrief', 'date-picked', 'date-back',
  'rival-shade', 'rival-play', 'code-call', 'rival-row', 'rival-step-back', 'rival-won', 'crush-confide', 'crush-watch',
  'triangle-rivals', 'triangle-case', 'triangle-ultimatum', 'triangle-teams', 'triangle-choice', 'camp-rally', 'camp-confront', 'camp-clash', 'camp-lobby', 'camp-split', 'camp-switch', 'camp-after', 'feud-confront', 'feud-interrupt', 'feud-shade', 'feud-ick', 'game-two-faced', 'game-suspect', 'game-called', 'pile-in', 'arrival-chat', 'first-toast', 'bombshell-react']);
const DEBRIEF_THREE = ['robbed', 'stole', 'twisted-on', 'twisted', 'miss', 'blame', 'eyeing', 'bomb-fancy', 'bomb-threat'];
const ABOUT_ALWAYS = new Set(['casa-miss', 'kin-protect']);
const ABOUT_CAUSES = ['jealous', 'envy', 'rival', 'stole', 'told'];
// Kinds whose {a} is always coupled with somebody outside the scene ({pa}).
const PA_ALWAYS = new Set(['loyalty', 'vent', 'bed-share']);
const list = v => [].concat(v ?? []);

describe('the movements are well-formed', () => {
  it('every plan names movements that exist, featured and short', () => {
    for (const [kind, t] of Object.entries(TALK)) {
      for (const tier of ['featured', 'short']) {
        const p = t.plans[tier];
        expect(p, `${kind} ${tier}`).toBeTruthy();
        const plans = typeof p[0] === 'string' ? [p] : p.map(x => x.plan);
        for (const plan of plans) for (const s of plan) expect(t.moves, `${kind}: ${s}`).toHaveProperty(s.replace(/\?$/, ''));
      }
    }
  });
  it('ids are unique', () => {
    const ids = ENTRIES.map(([, , e]) => e.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
  it('speakers are the cast', () => {
    for (const [k, s, e] of ENTRIES) for (const t of e.turns || []) expect(['a', 'b', 'c', 'd'], tag(k, s, e)).toContain(t[0]);
  });
  it('every condition is a known fact', () => {
    for (const [k, s, e] of ENTRIES) for (const key of Object.keys(e.when || {})) expect(FACT_KEYS, tag(k, s, e)).toContain(key);
    for (const [kind, t] of Object.entries(TALK)) for (const tier of ['featured', 'short']) {
      const p = t.plans[tier];
      if (typeof p[0] !== 'string') for (const x of p) for (const key of Object.keys(x.when || {})) expect(FACT_KEYS, `${kind} plan`).toContain(key);
    }
  });
});

describe('a placeholder only where somebody fills it', () => {
  it('only known placeholders, and never a subject pronoun', () => {
    for (const [k, s, e] of ENTRIES) for (const x of texts(e)) {
      for (const [m] of x.matchAll(/\{(?!~)[^}]*\}/g)) expect(m, tag(k, s, e)).toMatch(/^\{(where|Where|about|age|job|town|day|(pa|pb|a|b|c|d|x|about)(\.(obj|pos|posAdj|ref|Obj|PosAdj|gf))?)\}$/);
      // {age} {job} {town}: an intro tape's, from the character file.
      if (/\{(age|job|town)\}/.test(x)) expect(k, tag(k, s, e)).toBe('intro');
      // {day}: the day a declaration's moment happened (script.js clipSlots).
      if (/\{day\}/.test(x)) expect(k, tag(k, s, e)).toBe('speech');
      // {d} is named only in the one kind that casts four.
      if (/\{d[.}]/.test(x)) expect(k, tag(k, s, e)).toBe('camp-clash');
      expect(x, tag(k, s, e)).not.toMatch(/\{[a-z]+\.(sub|Sub)\}/);
    }
  });
  it('{c} only in a kind that casts three', () => {
    for (const [k, s, e] of ENTRIES) {
      if (!texts(e).some(x => /\{c[.}]/.test(x))) continue;
      // A recoupling names a third only when it is a steal: {c} lost {b}.
      if (k === 'recouple-pick') { expect(e.when?.stoleFrom, tag(k, s, e)).toBe(true); continue; }
      expect(THREE.has(k), tag(k, s, e)).toBe(true);
      if (k === 'debrief') expect(list(e.when?.of).length && list(e.when.of).every(o => DEBRIEF_THREE.includes(o)), tag(k, s, e)).toBe(true);
    }
  });
  it('{pa} behind taken, {pb} behind bTaken', () => {
    for (const [k, s, e] of ENTRIES) {
      const all = texts(e).join(' ');
      if (/\{pa[.}]/.test(all) && !PA_ALWAYS.has(k)) expect(e.when?.taken, tag(k, s, e)).toBe(true);
      if (/\{pb[.}]/.test(all)) expect(e.when?.bTaken, tag(k, s, e)).toBe(true);
    }
  });
  it('{x} behind the scene it names (`after`) or the secret it was with (`hasWith`)', () => {
    for (const [k, s, e] of ENTRIES) {
      if (!texts(e).some(x => /\{x[.}]/.test(x))) continue;
      expect(!!e.when?.after || e.when?.hasWith === true, tag(k, s, e)).toBe(true);
    }
  });
  it('{about} only where the scene has somebody it is about', () => {
    for (const [k, s, e] of ENTRIES) {
      if (!texts(e).some(x => /\{about[.}]/.test(x))) continue;
      if (ABOUT_ALWAYS.has(k)) continue;
      expect(k, tag(k, s, e)).toBe('argument');
      expect(list(e.when?.cause).length && list(e.when.cause).every(c => ABOUT_CAUSES.includes(c)), tag(k, s, e)).toBe(true);
    }
  });
});

describe('the words follow the rules', () => {
  it('no brand names: the villa is its own world (the user: "dont use brand names again")', () => {
    const bad = [];
    for (const [k, s, e] of ENTRIES) for (const x of texts(e)) for (const b of brandsIn(x)) bad.push(`${tag(k, s, e)}: "${b}" in: ${x}`);
    expect(bad).toEqual([]);
  });
  it("no other show's vocabulary", () => {
    for (const [k, s, e] of ENTRIES) for (const x of texts(e)) expect(foreignWordsIn(x, 'perfect-match'), `${tag(k, s, e)}: ${x}`).toEqual([]);
  });
  it('slots only in spoken lines, and every slot exists', () => {
    for (const [k, s, e] of ENTRIES) {
      for (const x of narration(e)) expect(x, `${tag(k, s, e)}: narration is neutral`).not.toMatch(/\{~/);
      for (const x of spoken(e)) for (const [, key] of x.matchAll(/\{~([A-Za-z-]+)\}/g)) expect(SLOTS, tag(k, s, e)).toHaveProperty(key.toLowerCase());
    }
  });
  it('no regional word written straight into a line', () => {
    const bare = x => x.replace(/\{~[A-Za-z-]+\}/g, ' ').toLowerCase();
    const bad = [];
    for (const [k, s, e] of ENTRIES) for (const x of texts(e)) for (const w of REGIONAL_WORDS) {
      if (new RegExp(`\\b${w}\\b`).test(bare(x))) bad.push(`${tag(k, s, e)}: "${w}" in: ${x}`);
    }
    expect(bad).toEqual([]);
  });
  it('no British-only grammar ("I was sat", a bare "Course")', () => {
    for (const [k, s, e] of ENTRIES) for (const x of texts(e)) {
      expect(x, tag(k, s, e)).not.toMatch(/\b(was|were|be|been|is|am|are|'m|'re|'s)\s+(sat|stood)\b/i);
      expect(x, tag(k, s, e)).not.toMatch(/(^|[.!?…]\s+)Course\b/);
    }
  });
  it('no string of shouted fragments ("Why?! This?! Go!")', () => {
    const words = x => x.split(/\s+/).filter(w => /[A-Za-z]/.test(w));
    for (const [k, s, e] of ENTRIES) for (const x of spoken(e)) {
      const ss = x.split(/(?<=[.!?…])\s+/).filter(Boolean);
      const shouted = ss.filter(y => /!\s*$/.test(y)).length;
      expect(ss.length >= 2 && ss.every(y => words(y).length <= 2) && shouted >= 2, `${tag(k, s, e)}: ${x}`).toBe(false);
    }
  });
});

describe('a played season', () => {
  it('rarely leaves a movement it needs unsaid, and featured scenes run long', () => {
    const cast = makeIslanders(12);
    setPlayers(cast);
    const names = cast.map(p => p.name);
    TALK_MISSES.length = 0;
    const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed: 11 });
    const scenes = rows.flatMap(r => r.pm.events).filter(e => e.tier);
    const featured = scenes.filter(e => e.tier === 'featured');
    const turns = featured.map(e => (e.script?.lines || []).filter(l => !l.action).length);
    expect(turns.reduce((a, b) => a + b, 0) / turns.length, 'mean turns in a featured scene').toBeGreaterThan(9);
    expect(TALK_MISSES.length / scenes.length, `misses: ${[...new Set(TALK_MISSES)].join(', ')}`).toBeLessThan(0.03);
  }, 300000);
});
