// The bar on the screen has to be true.
//
// `tests/bb-comp-profile-drift.test.js` catches a competition that hand-writes a
// second stat mix INSTEAD OF calling `aptitude(name, comp.stats)`. It cannot see
// a competition that never calls `aptitude` at all — which is every competition
// in the batch-one and batch-two expansion, because each one blends its own
// numbers for its own mechanic.
//
// So twelve competitions declared a profile nobody checked, and an audit found:
// Who Said It? and Drunk Speeches declared `social` and `temperament` that were
// never read; The Black Box declared `physical` and never read it; Punch, Slap,
// Kick read `intuition` it never declared; and three declared `temperament` as
// a WEIGHT while using it as a SPREAD, which tells a viewer that calm
// houseguests are better at being knocked off a spinning disc.
//
// This reads the source instead: every stat the simulate body multiplies must
// be declared, and every stat declared must be multiplied somewhere.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BB_COMPETITIONS } from '../js/bb-comps/index.js';

const SOURCES = ['social', 'recall', 'duress', 'stamina', 'handwork', 'jury-quiz', 'final-hoh']
  // Read off the working directory: vitest runs from the repo root, and
  // resolving against import.meta.url lands on the drive root under Windows.
  .map(f => readFileSync(join(process.cwd(), 'js', 'bb-comps', `${f}.js`), 'utf8'));

const IDS = ['bb-social-zingbot', 'bb-social-drink-or-bluff', 'bb-recall-who-said-it',
  'bb-recall-drunk-speeches', 'bb-duress-punch-slap-kick', 'bb-duress-black-box',
  'bb-stamina-dizzy-discs', 'bb-stamina-log-roll', 'bb-stamina-hold-up',
  'bb-hand-caged-eggs', 'bb-hand-laser-maze', 'bb-hand-water-rescue'];

/**
 * The block of source between this competition's id and the next one's, plus
 * the whole file it lives in.
 *
 * The file matters because a competition can read a stat through a helper
 * declared at the top of its module — `nerve()` reads temperament as a spread
 * for two of these — and scanning the block alone reports that as unread.
 */
function bodyOf(id) {
  for (const src of SOURCES) {
    const at = src.indexOf(`id: '${id}'`);
    if (at < 0) continue;
    const next = src.indexOf("\n  id: '", at + 10);
    return { block: src.slice(at, next < 0 ? src.length : next), file: src };
  }
  return { block: '', file: '' };
}

/** Every stat name the body actually multiplies by something. */
function statsRead(body) {
  const found = new Set();
  for (const m of body.matchAll(/stat\([^,]+,\s*'(\w+)'\)/g)) found.add(m[1]);
  // The recall quizzes read their weights through `attentionOf(name, statOf,
  // <comp>.stats)`, which is the declared object itself — so anything declared
  // is by definition read.
  if (/attentionOf\(name, statOf, \w+\.stats\)/.test(body)) return null;
  // Same exemption, and the one this file was written to encourage: a
  // competition that calls `aptitude(name, ...)` is reading a profile object
  // rather than naming stats inline. Passing the declared `stats` reads all of
  // it by construction; passing a named sub-profile (a competition with two
  // genuinely different skills in it, like the log roll's feet and hands) is
  // the same thing spread over more than one object, and the drift guard in
  // bb-comp-profile-drift.test.js is what holds those to the declared blend.
  if (/\baptitude\(\s*\w+\s*,/.test(body)) return null;
  return found;
}

describe('a competition declares the stats it reads', () => {
  for (const id of IDS) {
    it(`${id}`, () => {
      const comp = BB_COMPETITIONS.find(c => c.id === id);
      expect(comp, `${id} is not in the library`).toBeTruthy();
      const declared = Object.keys(comp.stats || {});
      expect(declared.length, `${id} declares no stats`).toBeGreaterThan(1);

      const total = Object.values(comp.stats).reduce((a, b) => a + b, 0);
      expect(total, `${id} weights sum to ${total}`).toBeCloseTo(1, 1);

      const { block, file } = bodyOf(id);
      expect(block.length, `${id} source block not found`).toBeGreaterThan(100);
      const read = statsRead(block);
      if (read === null) return;   // reads the declared object directly

      // A spread stat is used, but deliberately not as a weight — so it must be
      // read by the body and must NOT appear among the declared weights.
      // `nerve()` is the shared helper that reads temperament as a spread, so a
      // competition using it is reading that stat without naming it inline.
      if (comp.spreadStat) {
        const viaHelper = comp.spreadStat === 'temperament'
          && (/nerve\(/.test(block) || /nerve\(/.test(file));
        expect(read.has(comp.spreadStat) || viaHelper,
          `${id} declares spreadStat it never reads`).toBe(true);
        expect(declared).not.toContain(comp.spreadStat);
        read.delete(comp.spreadStat);
      }

      // Stats that drive a consequence rather than the score are declared under
      // `effectStats` and drawn apart from the weights.
      for (const stat of Object.keys(comp.effectStats || {})) {
        // A stat can legitimately do both jobs; drop only the ones that appear
        // nowhere in the scoring profile, or a competition looks as though it
        // never reads what it actually scores on.
        if (!declared.includes(stat)) read.delete(stat);
      }

      for (const stat of declared) {
        expect(read.has(stat), `${id} declares ${stat} and never reads it`).toBe(true);
      }
      for (const stat of read) {
        expect(declared, `${id} reads ${stat} without declaring it`).toContain(stat);
      }
    });
  }

  it('nothing quietly reintroduces temperament as a weight it has not earned', () => {
    // The house rule: low temperament means volatile, not weak-willed. It is a
    // legitimate WEIGHT only where steadiness genuinely is the skill, and every
    // such competition has to say so in a comment next to the profile.
    const allowed = new Set(['bb-hand-caged-eggs', 'bb-hand-laser-maze',
      'bb-stamina-log-roll', 'bb-stamina-hold-up', 'bb-social-drink-or-bluff']);
    for (const id of IDS) {
      const comp = BB_COMPETITIONS.find(c => c.id === id);
      if (!comp?.stats?.temperament) continue;
      expect(allowed.has(id), `${id} weights temperament without being on the justified list`).toBe(true);
    }
  });
});
