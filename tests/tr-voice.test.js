// ══════════════════════════════════════════════════════════════════════
// tr-voice.test.js — contemporary, and different per person
// ══════════════════════════════════════════════════════════════════════
//
// writing-contracts.md, "Modern individual voice contract": castle atmosphere
// may be gothic, contestant speech may not. "Corpus tests compare normalized
// sentence structure, not only exact strings, and reject a cast whose dialogue
// remains interchangeable after names are removed."
//
// SO THE MEASUREMENT IS AFTER NAMES ARE STRIPPED. A layer that pasted the
// speaker's name onto one shared sentence would score 100% distinct on raw
// strings and 1 distinct line here, which is the number that matters.
import { describe, expect, it, beforeEach } from 'vitest';
import { setPlayers } from '../js/core.js';
import {
  lineInVoice, attributedLineInVoice, voiceOf, actionPurpose, declaredPurposes,
  VOICE_PURPOSES, VOICE_REGISTERS, VOICE_BY_ARCHETYPE,
} from '../js/tr/castle/voice.js';

// ── THE CAST ──────────────────────────────────────────────────────────
//
// Named after the archetype each one carries, so an assertion about "Hero"
// reads as an assertion about the hero branch rather than about a lookup
// table. Every archetype here is on AGENTS.md's valid list; the stat lines
// differ so the stats fallback has something to distinguish when it is asked.
const ARCHETYPES = ['hero', 'hothead', 'mastermind', 'schemer', 'villain',
  'social-butterfly', 'loyal-soldier', 'floater', 'goat', 'underdog',
  'wildcard', 'perceptive-player', 'showmancer', 'chaos-agent'];

const ROSTER = ARCHETYPES.map((a, i) => ({
  name: a.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(''),
  slug: a, gender: 'nb', archetype: a,
  stats: { physical: 5, endurance: 5, mental: 4 + (i % 6), social: 3 + (i % 7),
    strategic: 2 + (i % 8), loyalty: 4 + (i % 5), boldness: 3 + (i % 6),
    intuition: 4 + (i % 5), temperament: 2 + (i % 7) },
}));
const CAST = ROSTER.map(p => p.name);

const FACTS = Object.freeze({ a: 'Gabby', v: 'Miriam',
  claim: 'she went straight upstairs after dinner' });
const ctx = { seed: 'ep4|library' };

/** Names out. What is left is the sentence shape, which is the thing measured. */
function stripName(line) {
  let out = String(line);
  for (const n of [...CAST, 'Gabby', 'Miriam'].sort((x, y) => y.length - x.length)) {
    out = out.split(n).join('~');
  }
  return out;
}

beforeEach(() => setPlayers(ROSTER));

describe('the cast does not share one voice', () => {
  it('keeps most of the cast distinct after names are removed', () => {
    const lines = CAST.map(name => stripName(lineInVoice(name, 'challenge-accusation', FACTS, ctx)));
    expect(new Set(lines).size).toBeGreaterThan(CAST.length * 0.65);
  });

  it('and it is distinct for every purpose, not only the one that was tuned', () => {
    for (const purpose of VOICE_PURPOSES) {
      const lines = CAST.map(n => stripName(lineInVoice(n, purpose, FACTS, ctx)));
      expect(new Set(lines).size,
        `${purpose}: the cast collapses onto ${new Set(lines).size} sentence shapes`)
        .toBeGreaterThan(CAST.length * 0.65);
    }
  });

  it('MUTANT: a register-only layer would fail the same band', () => {
    // THE NUMBER THE DEFECT PRODUCES. Before this file, the reaction card was
    // chosen by (class x register) alone, so a fourteen-person cast produced
    // AT MOST four sentence shapes. That is 4/14 = 29%, well under the 65%
    // band — which is what makes the band above a measurement of the
    // per-person index rather than a restatement of "there are four pools".
    const registerOnly = CAST.map(n => voiceOf(n));
    expect(new Set(registerOnly).size).toBeLessThanOrEqual(VOICE_REGISTERS.length);
    expect(new Set(registerOnly).size).toBeLessThan(CAST.length * 0.65);
  });

  it('the same person says different things on different nights', () => {
    const monday = lineInVoice('Hero', 'answer-accusation', FACTS, { seed: 'ep3|hall' });
    const seen = new Set();
    for (const day of ['ep4|hall', 'ep5|hall', 'ep6|hall', 'ep7|hall', 'ep8|hall']) {
      seen.add(lineInVoice('Hero', 'answer-accusation', FACTS, { seed: day }));
    }
    seen.add(monday);
    expect(seen.size, 'one person has one catchphrase for the season').toBeGreaterThan(2);
  });

  it('and is deterministic: the same scene renders the same line twice', () => {
    // The VP and the text backlog retranscribe one stored narration. A voice
    // layer that drew fresh would put different words on the two, which is
    // the shape js/vp-tr/screens.js exists to prevent one level up.
    const a = lineInVoice('Mastermind', 'challenge-accusation', FACTS, ctx);
    const b = lineInVoice('Mastermind', 'challenge-accusation', FACTS, ctx);
    expect(a).toBe(b);
  });
});

describe('contemporary, and archetype-correct', () => {
  it('uses no costume-drama vocabulary anywhere in the corpus', () => {
    const lines = [];
    for (const purpose of VOICE_PURPOSES) {
      for (const name of CAST) lines.push(lineInVoice(name, purpose, FACTS, ctx));
    }
    expect(lines.join(' ')).not.toMatch(/\b(?:I shall|most troubling|I find your account|henceforth)\b/i);
    // ...and the sweep found something to check, or the assertion is free.
    expect(lines.length).toBe(VOICE_PURPOSES.length * CAST.length);
  });

  it('a hero can own a mistake and a hothead escalates', () => {
    expect(lineInVoice('Hero', 'admit-fault', FACTS, ctx))
      .toMatch(/my fault|that's on me|I got it wrong/i);
    expect(lineInVoice('Hothead', 'answer-accusation', FACTS, ctx))
      .toMatch(/you|come on|just say/i);
  });

  it('every accountability line in every register actually admits something', () => {
    // The purpose IS the admission. A branch of `admit-fault` that hedges is
    // the "four rewritten versions of the same result" the variation contract
    // rejects, in the one place where the words are the mechanic.
    for (const name of CAST) {
      for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']) {
        expect(lineInVoice(name, 'admit-fault', FACTS, { seed }),
          `${name} does not own it`).toMatch(/my fault|that's on me|I got it wrong/i);
      }
    }
  });

  it('nice archetypes land in the warm register and never the escalating one', () => {
    // AGENTS.md's archetype behaviour rules, enforced at the voice layer:
    // hero, loyal-soldier, social-butterfly, showmancer, underdog and goat
    // never scheme, sabotage, steal or ambush — and `blunt` is the register
    // that escalates.
    for (const nice of ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer']) {
      expect(VOICE_BY_ARCHETYPE[nice]).toBe('warm');
    }
    for (const nice of ['underdog', 'goat']) {
      expect(VOICE_BY_ARCHETYPE[nice]).toBe('guarded');
    }
    expect(VOICE_BY_ARCHETYPE.hothead).toBe('blunt');
  });

  it('falls back to stats when the roster row carries no archetype', () => {
    setPlayers([{ name: 'Nobody', slug: 'nobody', gender: 'nb',
      stats: { physical: 5, endurance: 5, mental: 5, social: 9, strategic: 3,
        loyalty: 9, boldness: 4, intuition: 4, temperament: 6 } }]);
    expect(voiceOf('Nobody')).toBe('warm');
    expect(VOICE_REGISTERS).toContain(voiceOf('Unknown Person'));
  });

  it('an unknown purpose is an authoring bug and throws', () => {
    expect(() => lineInVoice('Hero', 'brood-gothically', FACTS, ctx)).toThrow(/unknown purpose/);
    expect(() => lineInVoice(null, 'admit-fault', FACTS, ctx)).toThrow(/a speaker is a name/);
  });
});

describe('the facts are read and never written', () => {
  it('leaves the supplied facts exactly as they arrived', () => {
    const facts = { a: 'Gabby', v: 'Miriam', claim: 'she went straight upstairs' };
    const before = JSON.stringify(facts);
    for (const purpose of VOICE_PURPOSES) lineInVoice('Schemer', purpose, facts, ctx);
    expect(JSON.stringify(facts)).toBe(before);
  });

  it('substitutes the other person into the line when the line names one', () => {
    const line = lineInVoice('Hothead', 'challenge-accusation', { a: 'Gabby' }, { seed: 'x' });
    expect(line).not.toMatch(/\{[a-z]+\}/);
  });
});

describe('the reaction answers the action that was printed', () => {
  it('declares a purpose only for scenes whose family register answers the wrong thing', () => {
    const declared = declaredPurposes();
    expect(declared.length).toBeGreaterThan(0);
    for (const d of declared) {
      expect(VOICE_PURPOSES).toContain(d.purpose);
      expect(d.eventId).toMatch(/^[a-z-]+$/);
    }
  });

  it('the reviewer\'s rendered example gets an answer about the question that was asked', () => {
    // THE LIVE DEFECT, NAMED. `grief-suspicion-of-timing` is two people doing
    // forensics over breakfast; it is `family: 'grief'`, so it was answered
    // out of the grief-comfort register and the card read "{b} sits down
    // beside {a} and stays until {a} has stopped" over an interrogation.
    // Stopped what.
    const s = { eventId: 'grief-suspicion-of-timing', branch: 'timing', family: 'grief' };
    expect(actionPurpose(s)).toBe('theorise-with');
    expect(actionPurpose({ ...s, branch: 'would-not-play' })).toBe('refuse-to-theorise');
  });

  it('an undeclared scene keeps the register it has always had', () => {
    // OPT-IN, NOT A HEURISTIC. An event added next year with no entry in the
    // table degrades to the shipped behaviour rather than to a wrong guess.
    expect(actionPurpose({ eventId: 'grief-empty-chair', branch: 'sat-elsewhere' })).toBeNull();
    expect(actionPurpose({ eventId: 'nothing-at-all' })).toBeNull();
    expect(actionPurpose(null)).toBeNull();
    expect(actionPurpose({ eventId: 'grief-suspicion-of-timing', branch: 'not-a-branch' })).toBeNull();
  });
});

describe('the attributed form names the person saying it', () => {
  it('every attributed line in every register carries the speaker\'s name', () => {
    // WHY THIS ARM EXISTS. `tests/tr-castle-prose.test.js` requires every
    // composed REACTION card to name a participant — "the establishing card and
    // the reaction card are the two a reader cannot resolve from anywhere
    // else". Bare dialogue cannot satisfy that, and it went red the first time
    // the voice layer was wired into the screen. The attribution is the fix,
    // and this is the arm that keeps it: a lead-in that lost its `{b}` would
    // break the screen's guard three files away, on a scene nobody was looking
    // at.
    for (const name of CAST) {
      for (const purpose of VOICE_PURPOSES) {
        for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
          const line = attributedLineInVoice(name, purpose, FACTS, { seed });
          expect(line, `${name}/${purpose}/${seed} names nobody`).toContain(name);
          expect(line, 'an unfilled placeholder reached the card').not.toMatch(/\{[a-z]+\}/);
        }
      }
    }
  });

  it('the attribution varies, so nobody has one way of speaking all season', () => {
    const leads = new Set();
    for (const seed of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']) {
      leads.add(attributedLineInVoice('Hothead', 'answer-accusation', FACTS, { seed })
        .split('“')[0].trim());
    }
    expect(leads.size, 'one lead-in for every scene of the season').toBeGreaterThan(3);
  });

  it('and it still contains the words the bare line had', () => {
    const bare = lineInVoice('Hero', 'admit-fault', FACTS, ctx);
    expect(attributedLineInVoice('Hero', 'admit-fault', FACTS, ctx)).toContain(bare);
  });
});
