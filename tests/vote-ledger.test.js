// What a vote tally cannot tell you.
//
// Built from a hand-written analysis the machine could not produce. The
// transcript said a player used a hidden power and her target left, so the only
// causal story available was that the power did it — and the analysis that
// mattered was one line the prose never contained:
//
//   "Ireland benefited from a consensus that existed beyond her."
//
// That is not an inference. It is arithmetic over `votingLog`, which has
// carried `stated` and `changed` per ballot all along and was never shown to
// anything that draws conclusions.
import { describe, expect, it } from 'vitest';
import { voteLedger, ledgerLine } from '../js/analysis/vote-ledger.js';

// Week 2 as played: Stella out 10-3, with the six the transcript lists as
// "already locked without being asked".
const LOCKED = ['Aaron', 'Felipe', 'Hasan', 'Joel', 'Misha', 'Nico'];
const WHIPPED = ['Amberly', 'Tobias', 'Gyselle', 'Zella'];
const KEPT_HER = ['Dylon', 'Harriett', 'Natasha'];

const week2 = () => ({
  hoh: 'Nico',
  plan: { target: 'Misha' },
  evicted: 'Stella',
  initialNominees: ['Stella', 'Jules', 'Joel'],
  finalNominees: ['Stella', 'Jules'],
  votingLog: [
    ...LOCKED.map(voter => ({ voter, voted: 'Stella', changed: false, stated: 'Stella' })),
    ...WHIPPED.map((voter, i) => ({ voter, voted: 'Stella', changed: true, stated: 'Stella',
      blocMove: i < 2 ? 'The Plot Twist' : 'The Power Couple' })),
    ...KEPT_HER.map(voter => ({ voter, voted: 'Jules', changed: false, stated: 'Jules' })),
  ],
  voteOperation: {
    majority: 7,
    plans: [
      { alliance: 'The Power Couple', target: 'Stella', members: ['Natasha', 'Gyselle', 'Zella'] },
      { alliance: 'The Plot Twist', target: 'Stella', members: ['Amberly', 'Tobias', 'Ireland'] },
    ],
  },
});

describe('the week Ireland was called a mastermind', () => {
  it('reads the result exactly as the screens already do', () => {
    const l = voteLedger(week2());
    expect(l.evictee).toBe('Stella');
    expect(l.margin).toBe('10-3');
    expect(l.majority).toBe(7);
  });

  it('says the majority was there before anybody worked on it', () => {
    // The correction the whole thing exists for. Six votes never had to be
    // moved — one short of the seven needed — so the week was very nearly
    // decided before a single conversation happened.
    const l = voteLedger(week2());
    expect(l.influence.alreadyThere).toBe(6);
    expect(l.influence.neededMoving).toBe(1);
    expect(l.influence.movedVotes).toHaveLength(4);
  });

  it('counts groups that arrived at the name separately', () => {
    // Two coalitions landing on Stella independently is the strongest evidence
    // that the outcome was not one person's doing.
    const l = voteLedger(week2());
    expect(l.influence.blocsThatAgreedIndependently.map(b => b.alliance).sort())
      .toEqual(['The Plot Twist', 'The Power Couple']);
  });

  it('separates getting what you wanted from doing anything', () => {
    // Nico's plan named Misha and Stella left, so the Head of Household did not
    // get their target — while the tally looks like a triumph either way. These
    // are different facts and the screens have only ever shown the second.
    const l = voteLedger(week2());
    expect(l.outcome.hohGotTarget).toBe(false);
    expect(l.outcome.hohTarget).toBe('Misha');
    expect(l.outcome.renomWasNeeded).toBe(true);
  });

  it('states it without grading it', () => {
    // "Ireland got what she wanted but I don't think she had a good HOH" and
    // "her target went home ten to three" are both true readings. A line that
    // picks one is worse than a line that lets the disagreement stand.
    const line = ledgerLine(voteLedger(week2()));
    expect(line).toContain('10-3');
    expect(line).toContain('6');
    expect(line).toMatch(/never had to be moved|already there/);
    expect(line).not.toMatch(/bad|good|poor|excellent|mastermind/i);
  });

  it('reports a genuinely whipped vote as one', () => {
    // The other half: when the room was actually turned, the ledger has to say
    // so, or it just replaces one bias with another.
    const whipped = week2();
    whipped.votingLog = [
      ...['Aaron', 'Felipe'].map(voter => ({ voter, voted: 'Stella', changed: false, stated: 'Stella' })),
      ...['Hasan', 'Joel', 'Misha', 'Nico', 'Amberly', 'Tobias'].map(voter =>
        ({ voter, voted: 'Stella', changed: true, stated: 'Jules', blocMove: 'The Plot Twist' })),
      ...KEPT_HER.map(voter => ({ voter, voted: 'Jules', changed: false, stated: 'Jules' })),
    ];
    const l = voteLedger(whipped);
    expect(l.influence.rodeConsensus).toBe(false);
    expect(l.influence.alreadyThere).toBe(2);
    expect(l.influence.neededMoving).toBe(4);
    // And six people said one name and wrote another, which is the house's
    // information problem rather than the HOH's.
    expect(l.brokenWord).toHaveLength(6);
  });

  it('declines on a night with no vote', () => {
    expect(voteLedger({ hoh: 'Nico' })).toBeNull();
    expect(voteLedger(null)).toBeNull();
    expect(ledgerLine(null)).toBe('');
  });
});
