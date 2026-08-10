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
import { voteLedger, ledgerLine, positionLedger, weekLedger,
  relationshipLedger, relationshipLines } from '../js/analysis/vote-ledger.js';

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

// ── the other half: what the week did TO the person who ran it ──
//
// "She entered the week as an invisible player with a secret power and left as
// someone everyone now knows can make things happen." That is a position
// change, and both ends of it are on the record — `openingState` and
// `closingState` carry bonds and `intentions`, which is who is hunting whom.
// Nothing had ever subtracted one from the other.
const HOUSE = ['Ireland', 'Nico', 'Dylon', 'Zella', 'Amberly', 'Tobias'];
const intents = pairs => Object.fromEntries(HOUSE.map(n => [n, { targets: pairs[n] || [] }]));
const bonds = v => Object.fromEntries(HOUSE.filter(n => n !== 'Ireland')
  .map(n => [['Ireland', n].sort().join('||'), v]));

const irelandWeek = () => ({
  ...week2(),
  openingState: { intentions: intents({}), bonds: bonds(2), alliances: [
    { name: 'The Plot Twist', members: ['Ireland', 'Amberly', 'Tobias'] }] },
  closingState: { intentions: intents({ Dylon: ['Ireland'], Zella: ['Ireland'] }), bonds: bonds(0.5),
    alliances: [{ name: 'The Plot Twist', members: ['Ireland', 'Amberly', 'Tobias'] }] },
});

describe('what the week did to the person who ran it', () => {
  it('counts the people now pointing at them who were not before', () => {
    const p = positionLedger(irelandWeek(), 'Ireland');
    expect(p.hunters.before).toBe(0);
    expect(p.hunters.after).toBe(2);
    expect(p.hunters.gained.sort()).toEqual(['Dylon', 'Zella']);
    expect(p.moreVisible, 'walked out of the week no more watched than she walked in').toBe(true);
  });

  it('reads the room cooling on them', () => {
    const p = positionLedger(irelandWeek(), 'Ireland');
    expect(p.standing.before).toBe(2);
    expect(p.standing.after).toBe(0.5);
    expect(p.standing.delta).toBe(-1.5);
  });

  it('averages standing, so a shrinking house is not read as a collapse', () => {
    const rec = irelandWeek();
    // Same feelings, one fewer houseguest to hold them.
    rec.closingState.bonds = Object.fromEntries(
      Object.entries(bonds(2)).filter(([k]) => !k.includes('Zella')));
    rec.closingState.intentions = intents({});
    const p = positionLedger(rec, 'Ireland');
    expect(p.standing.delta, 'losing a houseguest read as losing the room').toBe(0);
  });

  it('declines when the record has no bookends to compare', () => {
    expect(positionLedger(week2(), 'Ireland')).toBeNull();
    expect(positionLedger(null)).toBeNull();
  });
});

describe('the three axes, as components rather than a grade', () => {
  it('reports outcome, execution and position separately', () => {
    // The whole point: they disagree. A week can deliver the result, cost more
    // than it needed to, and leave the person worse off — and collapsing that
    // into one number is what made the machine call it a masterclass.
    const w = weekLedger(irelandWeek(), 'Ireland');
    expect(w.outcome.margin).toBe('10-3');
    expect(w.execution.movesSpent).toBe(4);
    expect(w.execution.movesNeeded).toBe(1);
    expect(w.execution.blockRebuilt).toBe(true);
    expect(w.position.moreVisible).toBe(true);
  });

  it('notices when an ally was put up, which is half of "it went well"', () => {
    const rec = irelandWeek();
    rec.initialNominees = ['Stella', 'Jules', 'Amberly'];
    const w = weekLedger(rec, 'Ireland');
    expect(w.outcome.alliesNominated, 'an allied nominee is not reported anywhere')
      .toEqual(['Amberly']);
  });

  it('never returns a verdict', () => {
    const w = weekLedger(irelandWeek(), 'Ireland');
    expect(JSON.stringify(w)).not.toMatch(/"(grade|rating|score|verdict)"/i);
  });
});

// ── the part people actually watch ──
//
// "The relationship between Stella and Tobias was really interesting to watch."
// Tobias made a final three promise in week one and voted her out in week two.
// No screen said so: the vote card showed a name and the analysis called it a
// coalition decision. The one fact that made it worth watching was never
// printed, and it was on the record the whole time.
const bk = (a, b) => [a, b].sort().join('||');

const stellaWeek = () => ({
  evicted: 'Stella',
  votingLog: [
    { voter: 'Tobias', voted: 'Stella', changed: true, stated: 'Stella' },
    { voter: 'Harriett', voted: 'Jules', changed: false, stated: 'Jules' },
    { voter: 'Aaron', voted: 'Stella', changed: false, stated: 'Stella' },
  ],
  openingState: {
    bonds: { [bk('Tobias', 'Stella')]: 6, [bk('Harriett', 'Jules')]: 5, [bk('Aaron', 'Stella')]: 0 },
    alliances: [
      { name: 'The Final Three', members: ['Tobias', 'Stella', 'Misha'] },
      { name: 'The Pipeline', members: ['Harriett', 'Stella', 'Jules'] },
    ],
    perceivedBonds: {},
  },
  closingState: {
    bonds: { [bk('Tobias', 'Stella')]: 1, [bk('Harriett', 'Jules')]: 5, [bk('Aaron', 'Stella')]: 0 },
    alliances: [],
    perceivedBonds: {
      'Jules→Harriett': { perceived: 6 },
      'Harriett→Jules': { perceived: 1 },
    },
  },
});

describe('the relationships, which are the part people watch', () => {
  it('names somebody writing down a partner’s name', () => {
    const r = relationshipLedger(stellaWeek());
    const tobias = r.brokenPromises.find(p => p.voter === 'Tobias');
    expect(tobias, 'a final-three partner was evicted and nothing said so').toBeTruthy();
    expect(tobias.against).toBe('Stella');
    expect(tobias.alliance).toBe('The Final Three');
    expect(tobias.bond, 'read the bond from AFTER the fallout instead of before the choice').toBe(6);
    expect(tobias.left).toBe(true);
  });

  it('catches the alliance vote even when the friendship was thin', () => {
    // Harriett voted her own Pipeline member. Low drama in the bond, high in
    // the alliance — and it is the alliance that made it a betrayal.
    const r = relationshipLedger(stellaWeek());
    expect(r.brokenPromises.map(p => p.voter)).toContain('Harriett');
    expect(r.brokenPromises.find(p => p.voter === 'Harriett').alliance).toBe('The Pipeline');
  });

  it('leaves a vote against a stranger out of it', () => {
    const r = relationshipLedger(stellaWeek());
    expect(r.brokenPromises.map(p => p.voter), 'a vote costing nothing was reported as a betrayal')
      .not.toContain('Aaron');
  });

  it('reports what came apart', () => {
    const r = relationshipLedger(stellaWeek());
    const pair = r.colder.find(m => [m.a, m.b].includes('Tobias'));
    expect(pair.from).toBe(6);
    expect(pair.to).toBe(1);
    expect(pair.delta).toBe(-5);
  });

  it('finds the one holding it tighter than the other', () => {
    // Directional perceived bonds make "he thinks they are closer than she
    // does" a fact rather than a reading — and it is reliably the next thing
    // to break.
    const r = relationshipLedger(stellaWeek());
    expect(r.oneSided[0]).toMatchObject({ believer: 'Jules', other: 'Harriett', gap: 5 });
  });

  it('says it the way somebody would say it', () => {
    const lines = relationshipLines(relationshipLedger(stellaWeek()));
    expect(lines.join(' ')).toContain("Tobias wrote down Stella's name");
    expect(lines.join(' ')).toContain('The Final Three');
    expect(lines.join(' ')).toMatch(/Jules thinks that friendship with Harriett/);
  });

  it('declines without bookends', () => {
    expect(relationshipLedger({ votingLog: [] })).toBeNull();
    expect(relationshipLines(null)).toEqual([]);
  });
});
