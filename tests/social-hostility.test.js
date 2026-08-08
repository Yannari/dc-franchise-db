// tests/social-hostility.test.js
// Where the cruelty stops.
//
// This feed is meant to be genuinely nasty — reality-TV fandom is vicious, and a
// sanitised version would be a lie about what these shows do to people. Fans can
// call somebody fake, insufferable, a coward, a floater, the worst winner in
// franchise history, ugly inside and out.
//
// What they cannot do is attack race, sexuality, religion, disability or gender
// identity. The cast carries canonical ethnicities and sexualities, and that is
// the line where "depicting a pile-on" becomes "generating slurs about a gay
// character".
//
// This is a guard about CONTENT, and it runs over every string the library
// holds — so a contribution that crosses the line fails immediately instead of
// being caught in review, or not at all. Codex is expected to add to this
// library; the test is the contract.
import { describe, expect, it } from 'vitest';
import { PERSONAS } from '../js/social/personas.js';
import { TOPICS } from '../js/social/topics.js';
import { PLATFORMS } from '../js/social/platforms.js';
// The phrasings live in sampler.js, not topics.js — topics declare which SHAPES
// they can take, the sampler holds the words. Walking personas/topics/platforms
// alone would be a guard passing over an almost empty set, which is worse than
// no guard: every actual post string is in PHRASINGS and DECORATIONS.
import { PHRASINGS, DECORATIONS } from '../js/social/sampler.js';

/**
 * Terms that mark an attack on a protected characteristic.
 *
 * Deliberately broad and deliberately blunt: a false positive costs one reworded
 * line, a false negative ships a slur. Word-boundary matched so "classic" does
 * not trip on "ass".
 */
const FORBIDDEN = [
  // race / ethnicity / nationality
  'racist', 'racial', 'ghetto', 'thug', 'a savage', 'savages', 'so exotic',
  'exotic looking', 'go back to', 'your people', 'articulate for', 'ching',
  'chink', 'spic', 'wetback', 'illegal alien', 'colored people', 'a colored',
  'oriental',
  // sexuality / gender identity
  'faggot', 'fag', 'dyke', 'tranny', 'shemale', 'homo', 'gay agenda',
  'not a real man', 'not a real woman', 'it/its', 'confused about her gender',
  'confused about his gender',
  // religion
  'terrorist', 'jihad', 'christ killer', 'raghead',
  // disability / neurodivergence
  'retard', 'retarded', 'spastic', 'cripple', 'crippled', 'crippling',
  'psycho ward', 'is autistic', 'so autistic', 'acting autistic',
  "'s autistic",
];

/** Every string the library holds, with a label saying where it came from. */
function allStrings() {
  const out = [];
  const walk = (node, where) => {
    if (typeof node === 'string') { out.push({ text: node, where }); return; }
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${where}[${i}]`));
    if (node && typeof node === 'object') {
      return Object.entries(node).forEach(([k, v]) => walk(v, `${where}.${k}`));
    }
  };
  walk(PERSONAS, 'personas');
  walk(TOPICS, 'topics');
  walk(PLATFORMS, 'platforms');
  walk(PHRASINGS, 'sampler.phrasings');
  walk(DECORATIONS, 'sampler.decorations');
  return out;
}

/** Does this string cross the line? Returns the term it crossed on, or null. */
export function crossesTheLine(text) {
  const lower = String(text).toLowerCase();
  for (const term of FORBIDDEN) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Terms starting with a letter need a non-letter (or start-of-string)
    // boundary before them. Terms that start with punctuation — the
    // contraction "'s autistic" — already carry their own boundary and a
    // leading [^a-z] check would reject the letter right before the
    // apostrophe (the "e" in "she's").
    const leadBoundary = /^[a-z]/i.test(term) ? '(^|[^a-z])' : '';
    const pattern = new RegExp(`${leadBoundary}${escaped}(?:s)?([^a-z]|$)`);
    if (pattern.test(lower)) return term;
  }
  return null;
}

describe('the line the library must not cross', () => {
  it('holds no attack on a protected characteristic', () => {
    // A guard that passes because it is looking at nothing is worse than no
    // guard. If the phrasing library moves and this walk stops reaching it, the
    // count collapses and this line fails before the denylist gets a chance to.
    expect(allStrings().length,
      'the guard is walking an almost empty library').toBeGreaterThan(300);
    const offences = allStrings()
      .map(s => ({ ...s, term: crossesTheLine(s.text) }))
      .filter(s => s.term);
    expect(offences.map(o => `${o.where}: "${o.term}"`),
      'a string in the library attacks a protected characteristic').toEqual([]);
  });

  it('actually catches one when it is there', () => {
    // The canary. A guard that has only ever seen clean input has not been
    // tested — it has been assumed. This repo shipped a registry guard that was
    // silently passing because its pattern could not match the shape it was
    // written to catch.
    expect(crossesTheLine('she is such a retard')).toBe('retard');
    expect(crossesTheLine('typical THUG behaviour')).toBe('thug');
    expect(crossesTheLine('go back to where you came from')).toBe('go back to');
    expect(crossesTheLine('a house full of thugs')).toBe('thug');
    expect(crossesTheLine('they are all retards')).toBe('retard');
    expect(crossesTheLine('what a crippled excuse for a player')).toBe('crippled');
    expect(crossesTheLine("she's autistic i swear")).toBe("'s autistic");
  });

  it('still allows fandom to be vicious', () => {
    // If this fails, the guard is too broad and has eaten the feature.
    for (const line of [
      'she is the single worst winner this franchise has ever produced',
      'insufferable. fake. i cannot watch another second of this',
      'he is a coward and a floater and he will be in the final two anyway',
      'that was the dumbest move i have seen in fifteen seasons',
      'ugly personality, uglier gameplay',
      'that read was savage and she deserved every word of it',
      'he cannot cook and he used every spice in the kitchen',
    ]) {
      expect(crossesTheLine(line), `the guard blocked legitimate fandom: "${line}"`).toBe(null);
    }
  });
});
