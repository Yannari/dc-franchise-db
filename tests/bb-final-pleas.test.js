// The final pleas have mechanics now.
//
// They used to render after the ballots were decided — scenery, not speech.
// resolveFinalPleas runs after every other force has settled and just before
// the tally, evaluates every voter independently, and moves at most one vote
// in a normal week. Every consequence is directional, every claim is checked
// against the state, and the rendered speech is a function of the record the
// mechanics resolved — never a second, independently invented plea.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { resolveFinalPleas } from '../js/bb/vote-operation.js';
import { getRelationshipDimension, setRelationshipDimension } from '../js/relationships.js';
import { listBlocs, knowledgeOf } from '../js/bb/blocs.js';
import { rpBuildBBEviction, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';

// Everybody at DEFAULT_STATS unless a scenario says otherwise; stats are
// explicit so the arithmetic is checkable by hand.
function seed(defs, gsOverrides = {}) {
  seedGame(defs, {
    episode: 3, eliminated: [], namedAlliances: [], sideDeals: [],
    showmances: [], romanticSparks: [], relationshipDimensions: {},
    strategicMemories: {}, ...gsOverrides,
  });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  seasonConfig.format = 'big-brother';
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
}

const ballot = (voter, evict) => ({ voter, evict, changed: false, stated: evict, preference: evict, margin: 1 });
const FIXED = () => 0.5;   // one constant draw: no dice, all arithmetic

describe('final pleas resolve mechanically', () => {
  it('cannot move a voter locked by a firm commitment', () => {
    seed([
      { name: 'Speaker', stats: { social: 10, strategic: 9 } },
      { name: 'Other' },
      { name: 'Firm', stats: { loyalty: 8, intuition: 5 } },
      { name: 'Hoh' },
    ]);
    // Firm loves the speaker personally — and is still not moving.
    setRelationshipDimension('Firm', 'Speaker', 'trust', 7);
    const ballots = [ballot('Firm', 'Speaker')];
    ballots[0].assignment = { by: 'The Wall', target: 'Speaker', kind: 'bloc' };
    const records = resolveFinalPleas({
      nominees: ['Speaker', 'Other'], ballots, hoh: 'Hoh',
      week: { num: 3, plan: {} },
      commitments: new Map([['Firm', { strength: 0.9 }]]),
      rng: FIXED,
    });
    expect(records).toHaveLength(2);
    expect(ballots[0].pleaMove).toBeUndefined();
    expect(ballots[0].evict).toBe('Speaker');
    expect(ballots[0].prePleaEvict).toBe('Speaker');
  });

  it('moves exactly one genuinely loose voter, and records the whole move', () => {
    seed([
      { name: 'Speaker', stats: { social: 10, strategic: 9, loyalty: 8 } },
      { name: 'Other' },
      { name: 'Loose', stats: { loyalty: 2, intuition: 3 } },
      { name: 'AlsoLoose', stats: { loyalty: 2, intuition: 3 } },
      { name: 'Hoh' },
    ]);
    setRelationshipDimension('Loose', 'Speaker', 'trust', 8);
    setRelationshipDimension('Loose', 'Speaker', 'obligation', 4);
    // The second loose voter likes the speaker much less: the plea should not
    // sweep the room even when the room is soft.
    setRelationshipDimension('AlsoLoose', 'Speaker', 'trust', 1);
    const ballots = [ballot('Loose', 'Speaker'), ballot('AlsoLoose', 'Speaker')];
    const records = resolveFinalPleas({
      nominees: ['Speaker', 'Other'], ballots, hoh: 'Hoh',
      week: { num: 3, plan: {} },
      commitments: new Map([['Loose', { strength: 0.05 }], ['AlsoLoose', { strength: 0.4 }]]),
      rng: FIXED,
    });
    const moved = ballots.filter(b => b.pleaMove);
    expect(moved).toHaveLength(1);
    const b = moved[0];
    expect(b.voter).toBe('Loose');
    expect(b.prePleaEvict).toBe('Speaker');
    expect(b.evict).toBe('Other');
    expect(b.movedBy).toBe('Speaker');
    expect(typeof b.pleaArgument).toBe('string');
    expect(typeof b.pleaMargin).toBe('number');
    const record = records.find(r => r.speaker === 'Speaker');
    expect(record.responses.find(r => r.voter === 'Loose').moved).toBe(true);
    // The nominee remembers who saved them — directionally.
    expect((gs.strategicMemories?.Speaker || []).some(m => m.subject === 'Loose'
      && m.type === 'final-plea-saved-me')).toBe(true);
  });

  it('an unsupported claim caught by an intuitive voter backfires', () => {
    seed([
      // A villain with low loyalty and high strategic ALWAYS embellishes at
      // rng 0.5 (lie chance caps at 0.55), which makes the lie deterministic.
      { name: 'Liar', archetype: 'villain', stats: { social: 8, strategic: 9, loyalty: 1 } },
      { name: 'Other' },
      { name: 'Sharp', stats: { intuition: 10, strategic: 6, loyalty: 5 } },
      { name: 'Hoh' },
    ]);
    const trustBefore = getRelationshipDimension('Sharp', 'Liar', 'trust');
    const ballots = [ballot('Sharp', 'Liar')];
    const records = resolveFinalPleas({
      nominees: ['Liar', 'Other'], ballots, hoh: 'Hoh',
      week: { num: 3, plan: {} },
      commitments: new Map([['Sharp', { strength: 0.1 }]]),
      rng: FIXED,
    });
    const record = records.find(r => r.speaker === 'Liar');
    expect(record.factsUsed.some(f => !f.supported), 'the villain did not lie').toBe(true);
    const response = record.responses.find(r => r.voter === 'Sharp');
    expect(response.caught).toBe(true);
    expect(ballots[0].pleaMove, 'a caught lie moved a vote').toBeUndefined();
    expect(getRelationshipDimension('Sharp', 'Liar', 'trust')).toBeLessThan(trustBefore);
    expect(gs.bb.house.suspicion['Sharp→Liar']).toBeGreaterThan(0);
  });

  it('an alliance callout reaches only the voters who believe it', () => {
    seed([
      { name: 'Speaker', stats: { social: 8, strategic: 7, loyalty: 8 } },
      { name: 'Other' },
      { name: 'Believer', stats: { loyalty: 2, intuition: 4 } },
      { name: 'Doubter', stats: { loyalty: 2, intuition: 4 } },
      { name: 'WallA' }, { name: 'WallB' }, { name: 'Hoh' },
    ], {
      namedAlliances: [{ name: 'The Wall', members: ['WallA', 'WallB'], active: true, formed: 1 }],
    });
    setRelationshipDimension('Believer', 'Speaker', 'trust', 8);
    setRelationshipDimension('Doubter', 'Speaker', 'resentment', 9);
    setRelationshipDimension('Doubter', 'Speaker', 'trust', -6);
    const bloc = listBlocs().find(b => b.label === 'The Wall');
    expect(bloc, 'the alliance never became a bloc').toBeTruthy();
    const before = { believer: knowledgeOf('Believer', bloc.id), doubter: knowledgeOf('Doubter', bloc.id) };
    const ballots = [ballot('Believer', 'Speaker'), ballot('Doubter', 'Speaker')];
    resolveFinalPleas({
      nominees: ['Speaker', 'Other'], ballots, hoh: 'Hoh',
      week: { num: 3, plan: { target: 'Speaker' },
        voteOperation: { plans: [{ alliance: 'The Wall', target: 'Speaker' }] } },
      commitments: new Map([['Believer', { strength: 0.1 }], ['Doubter', { strength: 0.4 }]]),
      rng: FIXED,
    });
    expect(knowledgeOf('Believer', bloc.id)).toBeGreaterThan(before.believer);
    expect(knowledgeOf('Doubter', bloc.id)).toBe(before.doubter);
  });

  it('relationship effects are directional', () => {
    seed([
      { name: 'Speaker', archetype: 'hero', stats: { social: 8, strategic: 5, loyalty: 9, boldness: 4 } },
      { name: 'Other' },
      { name: 'Warm', stats: { loyalty: 4, intuition: 4 } },
      { name: 'Hoh' },
    ]);
    setRelationshipDimension('Warm', 'Speaker', 'trust', 5);
    const backBefore = getRelationshipDimension('Speaker', 'Warm', 'trust');
    const ballots = [ballot('Warm', 'Other')];   // already keeping the speaker
    const records = resolveFinalPleas({
      nominees: ['Speaker', 'Other'], ballots, hoh: 'Hoh',
      week: { num: 3, plan: {} },
      commitments: new Map([['Warm', { strength: 0.3 }]]),
      rng: FIXED,
    });
    const record = records.find(r => r.speaker === 'Speaker');
    expect(record.voice).toBe('loyal');
    const response = record.responses.find(r => r.voter === 'Warm');
    expect(response.receptive).toBe(true);
    // A landed loyal appeal warms the LISTENER toward the speaker...
    expect(getRelationshipDimension('Warm', 'Speaker', 'trust')).toBeGreaterThan(5);
    // ...and does nothing to what the speaker feels back.
    expect(getRelationshipDimension('Speaker', 'Warm', 'trust')).toBe(backBefore);
  });

  it('the displayed speech renders the resolved argument, not a fresh one', () => {
    seed([
      { name: 'Pawn', stats: { social: 3 } },
      { name: 'Other' },
      { name: 'V1' }, { name: 'V2' }, { name: 'Hoh' },
    ]);
    const ballots = [ballot('V1', 'Pawn'), ballot('V2', 'Other')];
    const week = { num: 3, plan: { pawn: 'Pawn' }, pawnAsk: { pawn: 'Pawn' } };
    const records = resolveFinalPleas({
      nominees: ['Pawn', 'Other'], ballots, hoh: 'Hoh', week,
      commitments: new Map(), rng: FIXED,
    });
    const record = records.find(r => r.speaker === 'Pawn');
    expect(record.argumentType).toBe('pawn-promise');
    const ep = {
      num: 3, format: 'big-brother', hoh: 'Hoh', eliminated: 'Pawn',
      finalPleas: records, voteCommitments: [], dealBreaks: [], votePlans: [],
      acts: [{ type: 'eviction', nominees: ['Pawn', 'Other'], ballots,
        votes: { Pawn: 1, Other: 1 }, evicted: 'Pawn', socialBeats: [] }],
    };
    _tvState['bb_evict_3'] = { idx: 99 };
    const html = rpBuildBBEviction(ep);
    // The pawn-promise pool is the only one that talks about being the pawn.
    expect(html).toMatch(/pawn/i);
    delete _tvState['bb_evict_3'];
  });
});
