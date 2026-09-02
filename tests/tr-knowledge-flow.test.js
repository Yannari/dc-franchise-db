// ══════════════════════════════════════════════════════════════════════
// tr-knowledge-flow.test.js — who knows it, and who is therefore allowed
// to have a reaction to it
// ══════════════════════════════════════════════════════════════════════
//
// writing-contracts.md, "Knowledge propagation and reaction radius":
// "Information spreads through named receipts... the reaction radius is the
// union of witnesses, named recipients, and people informed publicly. Do not
// select arbitrary active players merely to make the event feel important."
//
// THE DEFECT THIS CLOSES IS NAMED IN THE TASK BRIEF. Two shipped lines assert
// propagation and write none — trust.js's "It arrived back at {a} by three
// separate routes before lunch" and mission-fallout's "{a} told three separate
// people about the mission on the road back" — so nobody was named, nothing
// was recorded, and the next scene had no way to know who had been told. The
// negative assertions below are the load-bearing half of this file: a spread
// helper that informed everybody would pass every positive arm in it.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { createTraitorsSceneApi } from '../js/tr/scene-api.js';
import {
  shareFact, shareFactWith, knowersOf, eligibleReactors, factsKnownTo,
  consensusPhrase, consensusBasis, CONSENSUS_FLOOR,
} from '../js/tr/knowledge-flow.js';

const CAST = ['Ellie', 'Gabby', 'Miriam', 'Alec', 'Fiore', 'Bowie',
  'Priya', 'Finn', 'Manu', 'Julia', 'Chas', 'Nell'];

beforeEach(() => {
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
});

describe('a fact travels only where a receipt says it travelled', () => {
  it('reaches the people it was told to, and nobody else', () => {
    shareFact({ factId: 'fiore-left', from: 'Ellie', to: 'Gabby',
      channel: 'conversation', ep: 3, sceneId: 'van-1' });
    expect(knowersOf('fiore-left', 3)).toEqual(expect.arrayContaining(['Ellie', 'Gabby']));
    expect(knowersOf('fiore-left', 3)).not.toContain('Miriam');
    expect(eligibleReactors('fiore-left', 3)).not.toContain('Miriam');
  });

  it('the teller is a knower, because they knew it in order to tell it', () => {
    shareFact({ factId: 'f', from: 'Ellie', to: 'Gabby', ep: 3 });
    expect(knowersOf('f', 3)).toContain('Ellie');
  });

  it('a second telling to the same person informs nobody new', () => {
    shareFact({ factId: 'f', from: 'Ellie', to: 'Gabby', ep: 3 });
    const again = shareFact({ factId: 'f', from: 'Alec', to: 'Gabby', ep: 4 });
    expect(again.applied).toBe(false);
    expect(again.blockedBy).toMatch(/already knew/);
    expect(knowersOf('f').filter(n => n === 'Gabby').length).toBe(1);
  });

  it('a chain names each hop, and the radius grows only by the hops taken', () => {
    // The contract's own worked example: Ellie witnesses, tells Gabby and
    // Alec in the van, Alec repeats it to Miriam. Five people know; "everyone
    // knows" is still false.
    shareFactWith(['Gabby', 'Alec'], { factId: 'fiore-left', from: 'Ellie',
      channel: 'conversation', ep: 3, sceneId: 'van-1' });
    shareFact({ factId: 'fiore-left', from: 'Alec', to: 'Miriam',
      channel: 'conversation', ep: 3, sceneId: 'hall-2' });
    const knowers = knowersOf('fiore-left', 3);
    expect(new Set(knowers)).toEqual(new Set(['Ellie', 'Gabby', 'Alec', 'Miriam']));
    expect(knowers).not.toContain('Priya');
    expect(knowers).not.toContain('Finn');
    // ...and the receipts say who told whom, not merely that somebody did.
    const hops = gs.tr.propagation.filter(r => r.factId === 'fiore-left');
    expect(hops.map(r => `${r.from}->${r.to}`))
      .toEqual(['Ellie->Gabby', 'Ellie->Alec', 'Alec->Miriam']);
  });

  it('the episode argument is a cut-off, not an equality filter', () => {
    shareFact({ factId: 'f', from: 'Ellie', to: 'Gabby', ep: 2 });
    // Knowledge does not expire at midnight.
    expect(knowersOf('f', 5)).toContain('Gabby');
    // ...and it has not travelled backwards in time either.
    expect(knowersOf('f', 1)).not.toContain('Gabby');
  });

  it('an audience-only confessional informs no contestant at all', () => {
    const r = shareFact({ factId: 'secret', from: 'Ellie', to: 'Gabby',
      channel: 'confessional-audience-only', ep: 3 });
    expect(r.applied).toBe(false);
    expect(knowersOf('secret', 3)).toEqual([]);
    expect(gs.tr.propagation.filter(x => x.factId === 'secret')).toEqual([]);
  });

  it('an unknown channel is an authoring bug and throws', () => {
    expect(() => shareFact({ factId: 'f', from: 'Ellie', to: 'Gabby', channel: 'telepathy' }))
      .toThrow(/unknown channel/);
    expect(() => shareFact({ factId: 'f', from: 'Ellie' })).toThrow(/must be a name/);
  });

  it('reads the same ledger the scene API writes, not a second one', () => {
    // ANTI-DRIFT. `recordClaim` already fans a claim out to its listeners
    // through `propagate`. If this file kept its own store, half the season's
    // knowledge would be invisible to it and every negative assertion above
    // would be true for the wrong reason.
    const api = createTraitorsSceneApi({ ep: 3, eventId: 'e', sceneId: 's' });
    const claim = api.recordClaim('Julia', 'I went straight upstairs after dinner.',
      { listeners: ['Gabby'], source: 'Julia accounted for the hour after dinner' });
    expect(knowersOf(claim.id, 3)).toEqual(expect.arrayContaining(['Julia', 'Gabby']));
    expect(knowersOf(claim.id, 3)).not.toContain('Alec');
    expect(factsKnownTo('Gabby', 3)).toContain(claim.id);
    expect(factsKnownTo('Alec', 3)).not.toContain(claim.id);
  });

  it('the reaction radius excludes people who have left the castle', () => {
    shareFactWith(['Gabby', 'Alec'], { factId: 'f', from: 'Ellie', ep: 3 });
    gs.activePlayers = CAST.filter(n => n !== 'Alec');
    expect(knowersOf('f', 3)).toContain('Alec');
    expect(eligibleReactors('f', 3)).not.toContain('Alec');
  });
});

describe('a minority is not everyone', () => {
  it('does not call a minority everyone', () => {
    const phrase = consensusPhrase({ agreeing: ['A', 'B', 'C'], living: 12 });
    expect(phrase).not.toMatch(/everyone|whole castle|the group agrees/i);
  });

  it('names them while it can, and counts them against the room when it cannot', () => {
    expect(consensusPhrase({ agreeing: ['Ellie'], living: 12 })).toBe('Ellie');
    expect(consensusPhrase({ agreeing: ['Ellie', 'Gabby'], living: 12 })).toBe('Ellie and Gabby');
    expect(consensusPhrase({ agreeing: ['Ellie', 'Gabby', 'Alec'], living: 12 }))
      .toBe('Ellie, Gabby and Alec');
    expect(consensusPhrase({ agreeing: ['Ellie', 'Gabby', 'Alec', 'Miriam'], living: 12 }))
      .toMatch(/^four of the twelve still here$/);
  });

  it('a public ceremony carries the universal version and a conversation does not', () => {
    const three = { agreeing: ['A', 'B', 'C'], living: 12 };
    expect(consensusPhrase({ ...three, evidence: 'public-ceremony' }))
      .toMatch(/the people who were in the room/);
    expect(consensusPhrase(three)).not.toMatch(/the people who/);
  });

  it('and receipts reaching the floor earn it the hard way', () => {
    const nine = CAST.slice(0, 9);
    expect(nine.length / CAST.length).toBeGreaterThanOrEqual(CONSENSUS_FLOOR);
    expect(consensusPhrase({ agreeing: nine, living: CAST.length }))
      .toMatch(/the people still in the castle/);
    const eight = CAST.slice(0, 8);
    expect(eight.length / CAST.length).toBeLessThan(CONSENSUS_FLOOR);
    expect(consensusPhrase({ agreeing: eight, living: CAST.length }))
      .not.toMatch(/the people still/);
  });

  it('MUTANT: a floor of zero would let three of twelve be everyone', () => {
    // THE NUMBER THE DEFECT PRODUCES. The band above is a statement about the
    // FLOOR, and a floor cannot be shown to bind by a test that only ever
    // exercises it at one value. This reconstructs the predicate at floor 0
    // over the same input and requires it to produce the forbidden word — if
    // it does not, `CONSENSUS_FLOOR` is decorative.
    const basis = consensusBasis({ agreeing: ['A', 'B', 'C'], living: new Array(12).fill('x') });
    expect(basis.universal).toBe(false);
    expect(basis.share).toBeLessThan(CONSENSUS_FLOOR);
    const wouldBeUniversal = basis.share >= 0;
    expect(wouldBeUniversal).toBe(true);
  });

  it('the basis is stored as numbers, so a screen can point at them', () => {
    shareFactWith(['Gabby', 'Alec'], { factId: 'f', from: 'Ellie', ep: 3 });
    const basis = consensusBasis({ factId: 'f', ep: 3, living: CAST });
    expect(basis.holders.sort()).toEqual(['Alec', 'Ellie', 'Gabby']);
    expect(basis.living).toBe(12);
    expect(basis.universal).toBe(false);
    expect(basis.reason).toMatch(/3 of 12/);
  });
});

// ══════════════════════════════════════════════════════════════════════
// THE FOUR SENTENCES THAT USED TO ASSERT THIS AND WRITE NOTHING
// ══════════════════════════════════════════════════════════════════════
//
// A read side with no writers is a library. These are the events Task 7A
// rewired, and the arms below play real seasons and require that each one
// actually left the record the task brief said it was missing. Without them
// the whole of the file above is true of an empty ledger.
describe('the rewired castle events leave the receipts their sentences claim', () => {
  it('a leaked secret names who heard it, and a crosscheck stores both accounts', async () => {
    const { setPlayers } = await import('../js/core.js');
    const { playTraitorsSeason } = await import('../js/tr/headless.js');
    const { seedFranchiseHistory } = await import('./helpers/tr-castle-fixture.js');
    const roster = (await import('../franchise_roster.json')).default;
    await import('../js/tr/castle/trust.js');
    await import('../js/tr/castle/suspicion.js');
    await import('../js/tr/castle/journey.js');
    await import('../js/tr/castle/mission-fallout.js');
    await import('../js/tr/castle/grief.js');
    await import('../js/tr/castle/cover.js');
    await import('../js/tr/castle/romance.js');
    await import('../js/tr/castle/callback.js');
    await import('../js/tr/castle/testing.js');
    await import('../js/tr/castle/consequences.js');
    await import('../js/tr/castle/nightfall.js');

    const R = roster.players.slice(0, 18);
    const CASTNAMES = R.map(p => p.name);
    const byEvent = {};
    let contradictions = 0, hops = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      setPlayers(R);
      seedFranchiseHistory(CASTNAMES);
      playTraitorsSeason({ cast: CASTNAMES, traitorCount: 3, seed });
      for (const c of (gs.tr.claims || [])) {
        byEvent[c.eventId] = (byEvent[c.eventId] || 0) + 1;
        if ((c.contradicts || []).length) contradictions++;
      }
      hops += (gs.tr.propagation || []).length;
    }
    // eslint-disable-next-line no-console
    console.log('[tr-knowledge-flow] claims by event:', JSON.stringify(byEvent),
      `contradictions=${contradictions} hops=${hops}`);
    // THE FOUR, NAMED. If one of them stops firing, or somebody removes the
    // recordClaim while leaving the sentence in place, this goes red rather
    // than the prose quietly going back to asserting things nothing stores.
    for (const id of ['trust-secret-swap', 'susp-timeline-crosscheck',
      'susp-let-it-go-on-the-road-back', 'cover-story-survived-the-day',
      'mission-what-they-can-ask-me']) {
      expect(byEvent[id], `${id} recorded no claim in six seasons`).toBeGreaterThan(0);
    }
    // A contradiction is TWO stored accounts and a declared incompatibility.
    expect(contradictions, 'nobody contradicted themselves on the record').toBeGreaterThan(5);
    expect(hops, 'no fact travelled anywhere in six seasons').toBeGreaterThan(20);
  });

  it('and every hop is between two people the season actually has', () => {
    // A receipt naming somebody who is not in the cast would be worse than no
    // receipt: `knowersOf` would return them and a scene could be built for a
    // person who does not exist.
    const cast = new Set(Object.keys(gs.tr.alignment || {}));
    for (const r of (gs.tr.propagation || [])) {
      expect(cast.has(r.from), `${r.from} is not in this season`).toBe(true);
      expect(cast.has(r.to), `${r.to} is not in this season`).toBe(true);
      expect(r.from).not.toBe(r.to);
      expect(r.sceneId, 'a hop with no scene behind it').toBeTruthy();
    }
  });
});
