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
import { chooseBanishmentVote, suspicion } from '../js/tr/deduction.js';
import { formPreference } from '../js/tr/murder.js';
import { rpBuildTraitorsDebug } from '../js/vp-tr/debug.js';
import { createTraitorsSceneApi, claimsKnownTo, contradictionsKnownTo,
  seasonReceipts, EMOTIONAL_STATES } from '../js/tr/scene-api.js';

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
  loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
const CAST = ['Gabby', 'Julia', 'Alec', 'Finn', 'Manu'];

/** A castle with five people in it and nothing else assumed. */
function world({ traitors = ['Julia'] } = {}) {
  setPlayers(CAST.map(n => ({ name: n, slug: n.toLowerCase(), gender: 'nb',
    archetype: 'floater', stats: { ...STATS } })));
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
    expect(() => api.popDelta('Gabby', 1, {})).toThrow(/source/);
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

    api.popDelta('Gabby', 3, { source: 'pushed a question nobody else would' });
    expect(gs.popularity.Gabby).toBe(3);

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
      'bond', 'popularity', 'emotion', 'vote-intent', 'murder-preference',
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

  it('a claim reaches its listeners and nobody else, and two of them make a contradiction', () => {
    const api = createTraitorsSceneApi({ ep: 3, participants: ['Gabby', 'Julia', 'Alec'] });
    api.recordClaim('Julia', 'went straight upstairs after dinner',
      { about: 'Julia', listeners: ['Gabby'], source: 'Gabby asked her to account for the hour' });
    api.recordClaim('Alec', 'saw Julia beside the library after dinner',
      { about: 'Julia', listeners: ['Gabby'], source: 'Gabby compared the accounts with Alec' });

    expect(claimsKnownTo('Gabby', 'Julia').map(c => c.speaker)).toEqual(['Julia', 'Alec']);
    expect(claimsKnownTo('Finn', 'Julia'), 'Finn was never told any of this').toEqual([]);

    const clash = contradictionsKnownTo('Gabby', 'Julia');
    expect(clash.length, 'Gabby holds two incompatible accounts and can name both')
      .toBeGreaterThan(0);
    expect(contradictionsKnownTo('Finn', 'Julia')).toEqual([]);

    // The propagation receipts are what make "who knows this" answerable.
    expect(gs.tr.propagation.map(p => `${p.from}->${p.to}`))
      .toEqual(['Julia->Gabby', 'Alec->Gabby']);
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
    const writers = ['addBond', 'addBelief', 'recordClaim', 'propagate', 'setVoteIntent',
      'addMurderPreference', 'popDelta', 'setEmotionalState', 'openArc', 'advanceArc',
      'resolveArc'];
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
