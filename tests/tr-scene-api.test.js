// ══════════════════════════════════════════════════════════════════════
// tr-scene-api.test.js — the write path, and the receipt that proves a
// consequence had a cause
// ══════════════════════════════════════════════════════════════════════
//
// The defect this file guards against does not throw and does not fail any
// other test: a card reads "Gabby leaves with a contradiction she can repeat
// at the Round Table" and nothing in the season is different afterwards. Every
// assertion below is a question the causal writing contract asks of a scene —
// which record made it eligible, who knows that record, and what stored
// consequence follows — turned into something a machine can check.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { resetKnowledge } from '../js/knowledge.js';
import { initTraitorsState, voteIntentFor as stateVoteIntent,
  murderPreferenceFor as stateMurderPref, emotionalOverrideFor,
  receiptsForEp } from '../js/tr/state.js';
import { recordAlignment } from '../js/tr/roles.js';
import { getBond } from '../js/bonds.js';
import { openThread } from '../js/tr/threads.js';
import { emotionalStateOf } from '../js/tr/events.js';
import { chooseBanishmentVote, suspicion, seedTraitorKnowledge } from '../js/tr/deduction.js';
import { formPreference } from '../js/tr/murder.js';
import { rpBuildTraitorsDebug } from '../js/vp-tr/debug.js';
import { createTraitorsSceneApi, claimsKnownTo, contradictionsKnownTo,
  seasonReceipts, EMOTIONAL_STATES } from '../js/tr/scene-api.js';
import { sceneEvidenceThreshold } from '../js/tr/deduction.js';
import { getFact } from '../js/knowledge.js';

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
// SHARP, and deliberately only one of them. The strength floor below which a
// nudge does not register RISES with read skill (`_assess` dismisses weak
// evidence more decisively the better you read a room), so a cast of identical
// players cannot show that the floor is a proportional mechanic rather than a
// bug. Alec reads at 8/8; everybody else is average.
const SHARP = { ...STATS, mental: 8, intuition: 8 };
const CAST = ['Gabby', 'Julia', 'Alec', 'Finn', 'Manu'];

/** A castle with five people in it and nothing else assumed. */
function world({ traitors = ['Julia'] } = {}) {
  setPlayers(CAST.map(n => ({ name: n, slug: n.toLowerCase(), gender: 'nb',
    archetype: 'floater', stats: { ...(n === 'Alec' ? SHARP : STATS) } })));
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  resetKnowledge();
  for (const n of CAST) recordAlignment(n, traitors.includes(n), 1, 'selection');
}

beforeEach(() => world());

/** Deterministic, injectable, and never Math.random. */
function fixedRng(v = 0.5) { return () => v; }

describe('the scene consequence API', () => {
  // ── THE BRIEF'S CAUSE-TO-DECISION TEST ────────────────────────────────
  it('carries a witnessed contradiction into belief and later vote reasoning', () => {
    const api = createTraitorsSceneApi({ ep:3 });
    api.addBelief('Gabby', 'Julia', 0.7, { source:'contradicted her dinner timeline', truthStatus:'unknown' });
    const receipt = api.receipts()[0];
    expect(receipt.source).toBe('contradicted her dinner timeline');
    expect(suspicion('Gabby', 'Julia', 3)).toBeGreaterThan(0);
  });

  // ── PROVENANCE ────────────────────────────────────────────────────────
  it('stores the whole provenance shape, not only the delta', () => {
    const api = createTraitorsSceneApi({ ep: 3, sceneId: 'ep3-library-alibi',
      eventId: 'alibi-timeline-challenged' });
    api.addBelief('Gabby', 'Julia', 0.7,
      { source: 'contradicted her dinner timeline', truthStatus: 'unknown' });
    const r = api.receipt();
    for (const k of ['observer', 'subject', 'belief', 'source', 'confidence', 'truthStatus', 'ep']) {
      expect(r, `the receipt has no ${k}`).toHaveProperty(k);
    }
    expect(r.observer).toBe('Gabby');
    expect(r.subject).toBe('Julia');
    expect(r.belief).toBe(0.7);
    expect(r.truthStatus).toBe('unknown');
    expect(r.ep).toBe(3);
    expect(r.eventId).toBe('alibi-timeline-challenged');
    // WHAT THE SCENE SAID IT WAS WORTH AND WHAT THE STORE ACTUALLY HOLDS ARE
    // DIFFERENT NUMBERS, and collapsing them is how a receipt starts lying:
    // 0.7 is over ALIGNMENT_CRED_CEILING, so the belief lands lower.
    expect(r.confidence).toBeLessThan(r.belief);
    expect(r.confidence).toBeGreaterThan(0);
  });

  it('refuses any write whose cause cannot be said out loud', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    expect(() => api.addBelief('Gabby', 'Julia', 0.5, {})).toThrow(/source/);
    expect(() => api.addBond('Gabby', 'Julia', -0.5, {})).toThrow(/source/);
    expect(() => api.popDelta('Gabby', 'heroic', {})).toThrow(/source/);
    expect(() => api.setVoteIntent('Gabby', 'Julia', {})).toThrow(/source/);
    expect(api.receipts(), 'a refused write still recorded a receipt').toEqual([]);
  });

  it('a source is a sentence a later scene can repeat, and the debug line prints it', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    api.addBelief('Gabby', 'Julia', 0.7,
      { source: 'contradicted her dinner timeline', truthStatus: 'unknown' });
    expect(api.receipt().debugLine)
      .toBe('belief · Gabby → Julia +0.7 · source: contradicted her dinner timeline');
  });

  // ── ONE WRITE PATH PER STATE TYPE ─────────────────────────────────────
  it('every write path actually moves the state it claims to move', () => {
    const api = createTraitorsSceneApi({ ep: 3, sceneId: 's1' });

    api.addBond('Gabby', 'Julia', -2, { source: 'the timeline argument' });
    expect(getBond('Gabby', 'Julia')).toBe(-2);

    // THROUGH crowd.js, NEVER gs.popularity DIRECTLY. The colour is the API,
    // and it carries the affection/spectacle pairing a bare number cannot.
    api.popDelta('Gabby', 'heroic', { source: 'pushed a question nobody else would' });
    expect(gs.popularity.Gabby).toBe(3);            // CROWD_COLOURS.heroic.affection
    expect(gs.tr.notoriety.Gabby).toBe(1);          // ... and its spectacle

    api.setEmotionalState('Manu', 'paranoid', { source: 'blamed for the checkpoint penalty' });
    expect(emotionalOverrideFor(gs, 'Manu', 3).state).toBe('paranoid');

    api.setVoteIntent('Gabby', 'Julia', { source: 'said she would raise it tonight' });
    expect(stateVoteIntent(gs, 'Gabby', 3).target).toBe('Julia');

    api.addMurderPreference('Julia', 'Gabby', 0.8, { source: 'Gabby has been saying her name' });
    expect(stateMurderPref(gs, 'Julia', 'Gabby', 3)).toBe(0.8);

    const arc = api.openArc('suspicion', ['Gabby', 'Julia'], { source: 'the dinner timeline' });
    expect(arc.state).toBe('open');
    api.advanceArc(arc.id, 'Alec remembers it differently', { source: 'Alec was asked' });
    expect(arc.beats.length).toBe(2);
    api.resolveArc(arc.id, 'denied-convincingly', { source: 'Julia produced the hour' });
    expect(arc.state).toBe('closed');

    // Nine writes, nine receipts, in order. A write with no receipt is the
    // whole defect this file exists for.
    expect(api.receipts().map(r => r.kind)).toEqual([
      'bond', 'crowd', 'emotion', 'vote-intent', 'murder-preference',
      'arc-open', 'arc-advance', 'arc-resolve',
    ]);
    expect(api.receipts().every(r => r.source && r.ep === 3)).toBe(true);
  });

  it('refuses an outcome no downstream branch has heard of, and an unknown emotional state', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    const arc = api.openArc('suspicion', ['Gabby', 'Julia'], { source: 'the dinner timeline' });
    expect(() => api.resolveArc(arc.id, 'vibes-shifted', { source: 'x' })).toThrow(/unknown outcome/);
    expect(() => api.setEmotionalState('Gabby', 'furious', { source: 'x' })).toThrow(/not one of/);
    expect(EMOTIONAL_STATES).toEqual(['content', 'paranoid', 'desperate']);
  });

  // ── CAUSE REACHES DECISION ────────────────────────────────────────────
  it('a promised vote moves the ballot, and no promise leaves it where it was', () => {
    // The four contract questions, in one arm. RECORD: Gabby said in a scene
    // she would write Julia down. KNOWS: Gabby, who said it. CAUSE: the vote
    // intent. CONSEQUENCE: the ballot.
    const api = createTraitorsSceneApi({ ep: 3, participants: ['Gabby', 'Julia'] });
    // Julia is deliberately NOT first in the pool: with a flat rng every
    // candidate takes the same noise term and a stable sort hands the ballot
    // to whoever sorts first, which would make the control arm agree with the
    // live arm for a reason that has nothing to do with the promise.
    const pool = ['Alec', 'Julia', 'Finn', 'Manu'];
    // A control arm first: with no intent stored, the same seeded ballot is
    // decided by noise alone. Without this the assertion below is a coin flip
    // dressed up as a measurement.
    const control = chooseBanishmentVote('Gabby', pool, 3, fixedRng(0.9));
    api.setVoteIntent('Gabby', 'Julia', { source: 'she said she would raise it tonight', strength: 2 });
    const withIntent = chooseBanishmentVote('Gabby', pool, 3, fixedRng(0.9));
    expect(withIntent).toBe('Julia');
    expect(control, 'the control arm already voted Julia, so this proves nothing')
      .not.toBe('Julia');
  });

  it('a scene-set murder preference reaches the conclave shortlist', () => {
    world({ traitors: ['Julia'] });
    const api = createTraitorsSceneApi({ ep: 3 });
    const before = formPreference('Julia', 3, fixedRng(0.5)).target;
    const other = ['Gabby', 'Alec', 'Finn', 'Manu'].find(n => n !== before);
    api.addMurderPreference('Julia', other, 40,
      { source: `${other} has been saying her name all afternoon` });
    expect(formPreference('Julia', 3, fixedRng(0.5)).target).toBe(other);
  });

  it('a scene-set emotional state overrides the room, and expires at the next table', () => {
    expect(emotionalStateOf('Manu')).toBe('content');
    const api = createTraitorsSceneApi({ ep: 1 });
    api.setEmotionalState('Manu', 'desperate', { source: 'blamed for the checkpoint penalty' });
    expect(emotionalStateOf('Manu')).toBe('desperate');
    // The room speaks and the override is spent: rounds.length becomes 1, so
    // the episode currently in progress is 2 and the episode-1 override is
    // no longer live.
    gs.tr.rounds.push({ ep: 1, ballots: [], accusations: [] });
    expect(emotionalStateOf('Manu')).toBe('content');
  });

  // ── KNOWLEDGE PROPAGATION AND REACTION RADIUS ─────────────────────────
  it('a scene may not write for somebody who was not in it', () => {
    const api = createTraitorsSceneApi({ ep: 3, participants: ['Gabby', 'Julia'] });
    expect(() => api.addBelief('Finn', 'Julia', 0.5, { source: 'the timeline' }))
      .toThrow(/not in this scene/);
    expect(() => api.setVoteIntent('Finn', 'Julia', { source: 'the timeline' }))
      .toThrow(/not in this scene/);
    // And the person who WAS there is written normally.
    expect(api.addBelief('Gabby', 'Julia', 0.5, { source: 'the timeline' })).toBeTruthy();
  });

  it('a claim reaches its listeners and nobody else', () => {
    const api = createTraitorsSceneApi({ ep: 3, participants: ['Gabby', 'Julia', 'Alec'] });
    api.recordClaim('Julia', 'went straight upstairs after dinner',
      { about: 'Julia', listeners: ['Gabby'], source: 'Gabby asked her to account for the hour' });
    api.recordClaim('Alec', 'saw Julia beside the library after dinner',
      { about: 'Julia', listeners: ['Gabby'], source: 'Gabby compared the accounts with Alec' });

    expect(claimsKnownTo('Gabby', 'Julia').map(c => c.speaker)).toEqual(['Julia', 'Alec']);
    expect(claimsKnownTo('Finn', 'Julia'), 'Finn was never told any of this').toEqual([]);

    // The propagation receipts are what make "who knows this" answerable.
    expect(gs.tr.propagation.map(p => `${p.from}->${p.to}`))
      .toEqual(['Julia->Gabby', 'Alec->Gabby']);
  });

  it('a contradiction is declared, never inferred from two different sentences', () => {
    const api = createTraitorsSceneApi({ ep: 3, participants: ['Gabby', 'Julia', 'Alec'] });
    // TWO UNRELATED REMARKS ABOUT THE SAME PERSON. Different strings, same
    // subject, both heard by Gabby — and NOT a contradiction. The naive rule
    // (any two different claims about a person clash) would return this pair,
    // which is why this arm exists and why `length > 0` alone proved nothing.
    api.recordClaim('Julia', 'thinks the mission money was a disgrace',
      { about: 'Julia', listeners: ['Gabby'], source: 'over breakfast' });
    api.recordClaim('Alec', 'says Julia was first to the crates',
      { about: 'Julia', listeners: ['Gabby'], source: 'in the van' });
    expect(contradictionsKnownTo('Gabby', 'Julia'),
      'two unrelated remarks read as somebody caught in a lie').toEqual([]);

    // NOW THE REAL PAIR, declared by the second claim against the first.
    const a = api.recordClaim('Julia', 'went straight upstairs after dinner',
      { about: 'Julia', listeners: ['Gabby'], source: 'Gabby asked her to account for the hour' });
    api.recordClaim('Alec', 'saw Julia beside the library after dinner', {
      about: 'Julia', listeners: ['Gabby'], contradicts: [a.id],
      source: 'Gabby compared the accounts with Alec',
    });
    const clash = contradictionsKnownTo('Gabby', 'Julia');
    expect(clash.length).toBe(1);
    expect(clash[0].map(c => c.speaker)).toEqual(['Julia', 'Alec']);

    // AND THE KNOWLEDGE HALF. Finn heard neither account, so there is nothing
    // for him to hold up against anything.
    expect(contradictionsKnownTo('Finn', 'Julia')).toEqual([]);
  });

  it('a claim cannot contradict an account that is not on the record', () => {
    const api = createTraitorsSceneApi({ ep: 3, participants: ['Alec'] });
    expect(() => api.recordClaim('Alec', 'saw Julia beside the library',
      { about: 'Julia', contradicts: ['claim-that-never-happened'], source: 'in the van' }))
      .toThrow(/not a\s+stored claim/);
  });

  it('an audience-only confessional informs no contestant, and says so on the receipt', () => {
    const api = createTraitorsSceneApi({ ep: 3, participants: ['Julia'] });
    api.recordClaim('Julia', 'I answered too fast and Gabby noticed', {
      about: 'Julia', listeners: ['Gabby'], channel: 'confessional-audience-only',
      source: 'a confessional after the library',
    });
    expect(claimsKnownTo('Gabby', 'Julia'),
      'an audience-only confessional reached a contestant').toEqual([]);
    const p = api.receipts().find(r => r.kind === 'propagation');
    expect(p.applied).toBe(false);
    expect(p.blockedBy).toMatch(/audience-only/);
    expect(gs.tr.propagation).toEqual([]);
  });

  // ── OBSERVER SAFETY AND THE CEILING ───────────────────────────────────
  it('no scene can hand anybody certainty about an alignment', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    // Even asked for 1.0, and even when the read happens to be correct.
    api.addBelief('Gabby', 'Julia', 1, { source: 'she went white at the question', truthStatus: 'true' });
    expect(suspicion('Gabby', 'Julia', 3)).toBeLessThan(0.62);
    expect(api.receipt().confidence).toBeLessThan(0.62);
  });

  it('a knowingly false plant must be rolled, and cannot be committed blind', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    expect(() => api.addBelief('Gabby', 'Finn', 0.5,
      { source: 'Julia told her Finn was upstairs', truthStatus: 'false' }))
      .toThrow(/rng/);
    // With the scene's own rng it goes through — and never Math.random.
    const r = api.addBelief('Gabby', 'Finn', 0.5,
      { source: 'Julia told her Finn was upstairs', truthStatus: 'false', rng: fixedRng(0.05) });
    expect(r.truthStatus).toBe('false');
  });

  // ── THE DECLARED truthStatus DRIVES DETECTION, NOT GROUND TRUTH ───────
  //
  // THE SUBJECT OF THESE TWO ARMS IS JULIA, WHO REALLY IS A TRAITOR. That is
  // the whole point of them. `_assess` (js/knowledge.js) decides whether a
  // claim is seen through by branching on `fact.truth`, so a plant about a
  // real Traitor is a claim whose FACT is true — and inside learn() there is
  // no detection path at all. If the detection roll ever moves back down into
  // learn(), both of these go red, because both sides of the fork below are
  // reachable only when the DECLARED truthStatus is what is being consulted.
  it('a plant about a real Traitor can still be seen through', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    // detectP at readSkill 0.5, cred 0.5 = 0.5*0.8 + (0.4-0.5)*0.5 = 0.35.
    const caught = api.addBelief('Gabby', 'Julia', 0.5, {
      source: 'Alec swore he saw her in the turret', truthStatus: 'false', rng: fixedRng(0.01),
    });
    expect(caught.applied, 'the plant landed even though Gabby caught it').toBe(false);
    expect(caught.blockedBy).toMatch(/saw through/);
    expect(suspicion('Gabby', 'Julia', 3)).toBe(0);
  });

  it('and lands when it is not', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    const landed = api.addBelief('Gabby', 'Julia', 0.5, {
      source: 'Alec swore he saw her in the turret', truthStatus: 'false', rng: fixedRng(0.99),
    });
    expect(landed.applied).toBe(true);
    expect(suspicion('Gabby', 'Julia', 3)).toBeGreaterThan(0);
  });

  it('a sharper reader is harder to lie to', () => {
    // The same plant, the same roll, two observers. Alec reads at 8/8 and
    // Gabby at 5/5, so detectP is 0.59 against 0.35 and a draw between the two
    // separates them. This is what proves the detection is PROPORTIONAL to the
    // observer rather than a coin flip attached to the flag.
    const api = createTraitorsSceneApi({ ep: 3 });
    const roll = fixedRng(0.45);
    expect(api.addBelief('Gabby', 'Julia', 0.5,
      { source: 'a whisper in the corridor', truthStatus: 'false', rng: roll }).applied).toBe(true);
    expect(api.addBelief('Alec', 'Julia', 0.5,
      { source: 'a whisper in the corridor', truthStatus: 'false', rng: roll }).applied).toBe(false);
  });

  // ── THE STRENGTH FLOOR, EXPLICIT RATHER THAN SILENT ───────────────────
  it('a nudge below the observer\'s notice is refused out loud, with the number', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    const floor = sceneEvidenceThreshold('Gabby');
    expect(floor).toBeGreaterThan(0);
    const r = api.addBelief('Gabby', 'Julia', floor / 2, { source: 'a look across the table' });
    expect(r.applied, 'a sub-threshold nudge silently landed').toBe(false);
    expect(r.blockedBy).toMatch(/below Gabby's notice/);
    expect(r.blockedBy, 'the refusal does not say what the threshold was')
      .toContain(String(Math.round(floor * 100) / 100));
    expect(suspicion('Gabby', 'Julia', 3)).toBe(0);
  });

  it('the floor rises with read skill, which is the mechanic and not a bug', () => {
    // A sharp reader dismisses weak evidence more decisively — `_assess`'s own
    // design, at the `deduced` tier a scene writes in. The same nudge that
    // registers on Gabby does not register on Alec, and that is the assertion:
    // if the two were equal the floor would be an accident of the formula.
    expect(sceneEvidenceThreshold('Alec')).toBeGreaterThan(sceneEvidenceThreshold('Gabby'));
    const nudge = (sceneEvidenceThreshold('Gabby') + sceneEvidenceThreshold('Alec')) / 2;
    const api = createTraitorsSceneApi({ ep: 3 });
    expect(api.addBelief('Gabby', 'Julia', nudge, { source: 'a look across the table' }).applied)
      .toBe(true);
    expect(api.addBelief('Alec', 'Julia', nudge, { source: 'a look across the table' }).applied)
      .toBe(false);
  });

  // ── A COVER STORY THAT WORKED ─────────────────────────────────────────
  it('lowers a read without erasing what was recorded', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    api.addBelief('Gabby', 'Julia', 0.6, { source: 'contradicted her dinner timeline' });
    const before = suspicion('Gabby', 'Julia', 3);
    expect(before).toBeGreaterThan(0);

    const r = api.lowerBelief('Gabby', 'Julia', 0.3, { source: 'Alec vouched for the whole hour' });
    expect(r.applied).toBe(true);
    expect(r.kind).toBe('doubt');
    expect(r.delta).toBe(-0.3);
    const after = suspicion('Gabby', 'Julia', 3);
    expect(after, 'the cover story did not lower anything').toBeLessThan(before);
    expect(after, 'doubt went negative — there is no evidence of innocence in this format')
      .toBeGreaterThanOrEqual(0);

    // AND THE FACT SURVIVES. The record of what was said is still there, the
    // belief entry is still there, and the reason it was formed is still
    // citable — a cover buries a read, it does not unremember it.
    const fact = getFact('alignment:Julia');
    expect(fact, 'the cover story deleted the fact').toBeTruthy();
    expect(fact.beliefs.Gabby, 'the cover story deleted the belief record').toBeTruthy();
    expect(fact.beliefs.Gabby.source).toBe('contradicted her dinner timeline');
  });

  it('a cover story cannot talk somebody out of something they watched happen', () => {
    // The turret. Julia and a fellow Traitor know each other at `public`
    // credibility, the one tier a scene may never touch.
    world({ traitors: ['Julia', 'Finn'] });
    seedTraitorKnowledge(3);
    const before = suspicion('Julia', 'Finn', 3);
    expect(before).toBeGreaterThan(0.9);
    const r = createTraitorsSceneApi({ ep: 3 })
      .lowerBelief('Julia', 'Finn', 0.9, { source: 'he made a convincing show of doubting her' });
    expect(r.applied).toBe(false);
    expect(r.blockedBy).toMatch(/certainty/);
    expect(suspicion('Julia', 'Finn', 3)).toBe(before);
  });

  it('lowering a read nobody holds is refused, not invented', () => {
    const r = createTraitorsSceneApi({ ep: 3 })
      .lowerBelief('Gabby', 'Manu', 0.3, { source: 'he explained the whole afternoon' });
    expect(r.applied).toBe(false);
    expect(r.blockedBy).toMatch(/no read to lower/);
  });

  // ── AUTHORING ERRORS FAIL LOUDLY ──────────────────────────────────────
  it('a name that is not in the season throws instead of writing nothing', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    // The old behaviour: a silent null on `addBond`, and — worse — a belief
    // recorded about a person who does not exist, because sceneEvidence will
    // happily recordFact for them.
    expect(() => api.addBelief('Gabbi', 'Julia', 0.5, { source: 'the timeline' }))
      .toThrow(/not in this season/);
    expect(() => api.addBond('Gabby', 'Juliaa', 1, { source: 'the timeline' }))
      .toThrow(/not in this season/);
    expect(() => api.popDelta('nobody', 'heroic', { source: 'the timeline' }))
      .toThrow(/not in this season/);
    expect(() => api.openArc('trust', ['Gabby', 'Ghost'], { source: 'the timeline' }))
      .toThrow(/not in this season/);
    // NOTHING WAS WRITTEN ANYWHERE. No fact minted for the invented name (the
    // old silent path let `sceneEvidence` recordFact one), no belief filed
    // under the misspelling, and no receipt claiming a consequence.
    expect(getFact('alignment:Gabbi'),
      'a fact was minted for a person who does not exist').toBeFalsy();
    expect(getFact('alignment:Juliaa')).toBeFalsy();
    expect(getFact('alignment:Julia').beliefs.Gabbi,
      'a belief was filed under a misspelt observer').toBeUndefined();
    expect(api.receipts()).toEqual([]);
  });

  it('a missing name, a self-reference and a zero delta all throw', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    expect(() => api.addBond(null, 'Julia', 1, { source: 'x' })).toThrow(/must be a player name/);
    expect(() => api.addBond('Gabby', 'Gabby', 1, { source: 'x' })).toThrow(/same person/);
    expect(() => api.addBelief('Gabby', 'Gabby', 0.5, { source: 'x' })).toThrow(/same person/);
    expect(() => api.addBond('Gabby', 'Julia', 0, { source: 'x' }))
      .toThrow(/not a consequence/);
    expect(() => api.addMurderPreference('Julia', 'Gabby', NaN, { source: 'x' }))
      .toThrow(/non-zero finite/);
    expect(() => api.popDelta('Gabby', 3, { source: 'x' }))
      .toThrow(/not a crowd colour/);
  });

  // ── THE AUDIENCE LEDGERS STAY SINGLE-PATH ─────────────────────────────
  it('scores the crowd through crowd.js, so both ledgers move together', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    api.popDelta('Gabby', 'cruel', { source: 'she read Manu\'s note out to the room' });
    // cruel = { affection: -3.0, spectacle: 1.5 }. A bare number could not
    // have said that the country found it enormous television AND disliked it.
    expect(gs.popularity.Gabby).toBe(-3);
    expect(gs.tr.notoriety.Gabby).toBe(1.5);
    expect(api.receipt().debugLine)
      .toBe('crowd · Gabby cruel -3 · source: she read Manu\'s note out to the room');
  });

  it('a Traitor gets no credit for kindness, because crowd.js damps it', () => {
    // Not a rule this file implements — a rule it inherits by delegating. If
    // popDelta ever writes gs.popularity directly again, this goes red.
    world({ traitors: ['Julia'] });
    const api = createTraitorsSceneApi({ ep: 3 });
    api.popDelta('Julia', 'heroic', { source: 'she went back for Manu' });
    api.popDelta('Gabby', 'heroic', { source: 'she went back for Manu' });
    expect(gs.popularity.Julia).toBeLessThan(gs.popularity.Gabby);
  });

  it('a write the engine refused is recorded as refused, not as a success', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    const r = api.advanceArc('thread-that-does-not-exist', 'a beat', { source: 'x' });
    expect(r).toBeNull();
    expect(api.receipt().applied).toBe(false);
    expect(api.receipt().debugLine).toMatch(/NOT APPLIED/);
  });

  // ── THE CANONICAL EFFECTS ARRAY ───────────────────────────────────────
  it('projects the writing record\'s effects array from the receipts themselves', () => {
    const api = createTraitorsSceneApi({ ep: 3, sceneId: 'ep3-library-alibi' });
    api.addBelief('Gabby', 'Julia', 0.7,
      { source: 'Julia contradicted her post-dinner timeline', truthStatus: 'unknown' });
    api.addBond('Gabby', 'Julia', -0.5, { source: 'Julia contradicted her post-dinner timeline' });
    expect(api.effects()).toEqual([
      { kind: 'belief', observer: 'Gabby', subject: 'Julia', delta: 0.7,
        source: 'Julia contradicted her post-dinner timeline' },
      { kind: 'bond', players: ['Gabby', 'Julia'], delta: -0.5,
        source: 'Julia contradicted her post-dinner timeline' },
    ]);
  });

  // ── THE SEASON LEDGER ─────────────────────────────────────────────────
  it('mirrors onto the season so a later episode can find it, keyed by episode', () => {
    createTraitorsSceneApi({ ep: 2 })
      .addBond('Gabby', 'Alec', 1, { source: 'they cooked together' });
    createTraitorsSceneApi({ ep: 3 })
      .addBond('Gabby', 'Finn', 1, { source: 'he backed her at the table' });
    expect(seasonReceipts().length).toBe(2);
    expect(receiptsForEp(gs, 3).map(r => r.subject ?? r.players.join('+')))
      .toEqual(['Gabby+Finn']);
  });

  it('a receipt cannot be recorded without a state write', () => {
    const api = createTraitorsSceneApi({ ep: 3 });
    // `receipt`/`receipts`/`effects` are the whole read surface, and there is
    // no `record`/`push`/`log` beside them. If one is ever added, the promise
    // that every receipt corresponds to a real write is gone.
    const writers = ['addBond', 'addBelief', 'lowerBelief', 'recordClaim', 'propagate',
      'setVoteIntent', 'addMurderPreference', 'popDelta', 'setEmotionalState', 'openArc',
      'advanceArc', 'resolveArc'];
    const readers = ['receipt', 'receipts', 'effects'];
    const fns = Object.keys(api).filter(k => typeof api[k] === 'function');
    expect(fns.sort()).toEqual([...writers, ...readers].sort());
  });
});

// ══════════════════════════════════════════════════════════════════════
// RECEIPTS ARE DEBUG-ONLY
// ══════════════════════════════════════════════════════════════════════
describe('receipts render in Debug and nowhere else', () => {
  it('the debug tab prints the machine sentence the viewer card must never say', () => {
    world();
    const api = createTraitorsSceneApi({ ep: 3, eventId: 'alibi-timeline-challenged' });
    api.addBelief('Gabby', 'Julia', 0.7,
      { source: 'contradicted her dinner timeline', truthStatus: 'unknown' });
    const html = rpBuildTraitorsDebug({ num: 3, tr: { ep: 3, receipts: receiptsForEp(gs, 3) } });
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    expect(text).toContain('belief');
    expect(text).toContain('Gabby');
    expect(text).toContain('contradicted her dinner timeline');
    expect(text).toContain('alibi-timeline-challenged');
  });

  it('an empty row says so rather than throwing', () => {
    const html = rpBuildTraitorsDebug({ num: 3, tr: { ep: 3 } });
    expect(html).toContain('no scene changed anything on this row');
  });

  it('no viewer screen module reads the receipt ledger', async () => {
    // SOURCE RULE, not a render sweep: the render sweep would only catch a
    // receipt that a season happened to produce on the row it drew. The seven
    // screens are the running order a viewer sees, and none of them may reach
    // this ledger at all.
    const fs = await import('node:fs');
    const path = await import('node:path');
    const url = await import('node:url');
    const dir = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'js', 'vp-tr');
    const offenders = [];
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.js') || f === 'debug.js') continue;
      const code = fs.readFileSync(path.join(dir, f), 'utf8')
        .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      if (/receipts|debugLine|scene-api/.test(code)) offenders.push(f);
    }
    expect(offenders, `viewer screens reading the debug ledger: ${offenders.join(', ')}`)
      .toEqual([]);
  });
});
