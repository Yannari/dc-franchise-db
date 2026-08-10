// Every prompt in the episode worker was written for Total Drama. A Big
// Brother week went through them anyway, against a vocabulary with no word
// for what happened in it, and the model improvised the difference: it named
// the wrong Head of Household, listed the veto winner as a nominee, had a
// houseguest both claim and deny holding power two paragraphs apart, and
// dropped a house meeting that the simulator had printed in full.
//
// These check the override exists, reaches all three writers, and does not
// repeat the mistake that took this whole worker down once before: a stray
// backtick inside a template literal, which is a syntax error in a file with
// no build step to catch it.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const worker = readFileSync('worker/worker-episode-live.js', 'utf8');

/** The named template literal, delimiters included. */
function literal(name) {
  const start = worker.indexOf('const ' + name + ' = `');
  expect(start, name + ' is missing').toBeGreaterThan(-1);
  const open = worker.indexOf('`', start);
  const close = worker.indexOf('`', open + 1);
  return worker.slice(open, close + 1);
}

describe('the Big Brother override', () => {
  it('detects the format from the source text, not a caller flag', () => {
    // Callers never learned to pass a format, and a missing flag would fail
    // silently back to the Total Drama prompt — which is the bug.
    expect(worker).toMatch(/function isBigBrother\(text\)/);
    expect(worker).toMatch(/HEAD OF HOUSEHOLD\|NOMINATION CEREMONY\|POWER OF VETO/);
  });

  it('reaches all three writers', () => {
    // enhanceSummary and generateSummary get the full format replacement;
    // generateEpisode writes scenes, so it gets vocabulary and the fact-lock.
    expect(worker).toMatch(/isBigBrother\(simulatorSummary\) \? BB_OVERRIDE/);
    expect(worker).toMatch(/isBigBrother\(rawText\) \? BB_OVERRIDE/);
    expect(worker).toMatch(/const bbScreen = isBigBrother\(summaryText\)/);
    // First in the prompt: it disclaims everything after it.
    expect(worker).toMatch(/const instructions = `\$\{bbBlock\}You are a Total Drama/);
    expect(worker).toMatch(/const instructions = `\$\{bbScreen\}/);
  });

  it('carries no stray backtick', () => {
    // 14 of them inside one template took the whole worker offline before.
    const block = literal('BB_OVERRIDE');
    expect(block.slice(1, -1)).not.toContain('`');
  });

  it('gives house events a section of their own', () => {
    // The real cause of the dropped meeting: the Total Drama structure has
    // nowhere for a scene that is not attached to a challenge or a vote, so
    // the model folded it into strategy prose and then out of existence.
    const block = literal('BB_OVERRIDE');
    expect(block).toMatch(/## HOUSE LIFE/);
    expect(block).toMatch(/MANDATORY SECTION/);
    expect(block).toMatch(/never empty/i);
  });

  it('locks the facts a rewrite kept losing', () => {
    const block = literal('BB_OVERRIDE');
    for (const fact of [/who won Head of Household/, /who was nominated/,
                        /replacement/, /every vote/, /who was evicted/]) {
      expect(block).toMatch(fact);
    }
    // The roles that got swapped: one person can hold two of them at once.
    expect(block).toMatch(/ROLE DRIFT/);
    // Hidden powers are why the narration contradicted itself.
    expect(block).toMatch(/house's belief and the truth/);
  });

  it('states the vote rule the Total Drama prompt has no concept of', () => {
    const block = literal('BB_OVERRIDE');
    expect(block).toMatch(/NOMINEES DO NOT VOTE/);
    expect(block).toMatch(/does not vote unless there is\n *a tie|does not vote unless there was a tie/);
  });

  it('bans the vocabulary that has no meaning in this format', () => {
    const block = literal('BB_OVERRIDE');
    for (const term of ['tribal council', 'immunity challenge', 'merge', 'Chris']) {
      expect(block).toContain(term);   // named in the mapping, so it can be banned
    }
    expect(block).toMatch(/-> *EVICTED|-> *evicted/);
  });
});

describe('Total Drama is left alone', () => {
  it('adds nothing when the summary is not a Big Brother week', () => {
    const fn = new Function('text', worker.slice(
      worker.indexOf('function isBigBrother'),
      worker.indexOf('const BB_OVERRIDE')) + '\nreturn isBigBrother(text);');
    expect(fn('=== IMMUNITY CHALLENGE ===\nThe tribe wins.')).toBe(false);
    expect(fn('')).toBe(false);
    expect(fn(null)).toBe(false);
    expect(fn('NOMINATION CEREMONY — Nico')).toBe(true);
  });
});
