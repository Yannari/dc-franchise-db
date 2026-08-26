import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('a coach can be voted for and never votes', () => {
  it('takes a separate list of targets', () => {
    // simulateVotes uses ONE list for both the voters and the candidates, so a
    // coach cannot be added to it — they would start casting ballots. The
    // target list has to be separate, which is the same boundary as "coaches
    // never touch the ballot", stated twice.
    const voting = readFileSync('js/voting.js', 'utf8');
    expect(voting).toMatch(/export function simulateVotes\([^)]*extraTargets/);
  });

  it('never adds an extra target to the voter pool', () => {
    const voting = readFileSync('js/voting.js', 'utf8');
    const fn = voting.slice(voting.indexOf('export function simulateVotes'));
    const body = fn.slice(0, fn.indexOf('\nexport '));
    // The voter pool must be built from tribalPlayers alone.
    expect(body).not.toMatch(/eligibleVoters[^\n]*extraTargets/);
  });
});

describe('the resentment engine (emotional defection) can also target a coach', () => {
  it('threads extraTargets from simulateVotes into evaluateEmotionalDefection', () => {
    // A coach's negative bond with a passed-over contestant is the twist's main
    // emotional pathway — it has to run through the same revenge-vote mechanic
    // as everyone else, or the twist never does the thing it exists to do.
    const voting = readFileSync('js/voting.js', 'utf8');
    expect(voting).toMatch(/export function evaluateEmotionalDefection\([^)]*extraTargets/);
    const fn = voting.slice(voting.indexOf('export function simulateVotes'));
    const body = fn.slice(0, fn.indexOf('\nexport '));
    expect(body).toMatch(/evaluateEmotionalDefection\([^)]*extraTargets\)/);
  });

  it('never adds an extra target to evaluateEmotionalDefection\'s voter pool', () => {
    const voting = readFileSync('js/voting.js', 'utf8');
    const fn = voting.slice(voting.indexOf('export function evaluateEmotionalDefection'));
    const body = fn.slice(0, fn.indexOf('\nexport '));
    // eligibleVoters (majority count) must stay tribalPlayers-only — a coach
    // must never be counted as, or cast, a ballot here either.
    expect(body).not.toMatch(/eligibleVoters[^\n]*extraTargets/);
    expect(body).toMatch(/const eligibleVoters = tribalPlayers\.filter/);
  });
});
