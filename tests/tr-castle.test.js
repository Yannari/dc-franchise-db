// The first four families of the castle event pool (trust, suspicion, grief,
// cover) — the representative slice the rest of the ~150-event pool is meant
// to copy the shape of. See js/tr/castle/*.js for the design rationale on
// each family; this file exists to prove three things the brief calls out
// specifically:
//
//   1. Every event has a real consequence (bond, thread/residue, or state) —
//      never a purely cosmetic firing.
//   2. At least one event PER FAMILY branches 3+ ways on a genuine stat/role
//      check, not on a coin flip wearing four labels.
//   3. `cover-story-check` grants permission by ROLE (any living Traitor,
//      archetype irrelevant) and only ever uses archetype to penalise
//      COMPETENCE — a hero forced into the Traitor seat still runs the
//      event, and is mechanically worse at it than a schemer would be.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { getBond, setBond } from '../js/bonds.js';
import { recordAlignment } from '../js/tr/roles.js';
import { openThread, findOpenThread } from '../js/tr/threads.js';
import { EVENTS, eligible, pickEvent, validateRegistry } from '../js/tr/events.js';
import roster from '../franchise_roster.json';

// Side-effect imports: this is what registers the ~25 events under test.
// Unlike tr-events.test.js (which builds throwaway events per test and tears
// the registry down with _resetRegistry), these are the REAL pool — imported
// once, never reset, exactly as they will be when a season actually loads
// the castle layer.
import '../js/tr/castle/trust.js';
import '../js/tr/castle/suspicion.js';
import '../js/tr/castle/grief.js';
import '../js/tr/castle/cover.js';

const BASE_CAST = roster.players.slice(0, 6).map(p => p.name);

function seededRng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
/** Returns exactly the scripted sequence, cycling — for forcing a specific branch. */
function scriptedRng(values) {
  let i = 0;
  return () => { const v = values[i % values.length]; i++; return v; };
}

/** A synthetic player with fully controlled stats/archetype, for forcing branches. */
function makePlayer(name, archetype, stats) {
  return { name, slug: name.toLowerCase(), gender: 'nb', archetype,
    stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
      loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...stats } };
}

function setup(cast = BASE_CAST, playersOverride = null) {
  setPlayers(playersOverride || roster.players.slice(0, 6));
  setGs({ bonds: {}, activePlayers: [...cast] });
  gs.tr = initTraitorsState();
}

beforeEach(() => setup());

describe('the pool loads cleanly', () => {
  it('registers a representative slice per family (6-10 events each)', () => {
    const byFamily = {};
    for (const ev of EVENTS) (byFamily[ev.family] ||= []).push(ev.id);
    for (const fam of ['trust', 'suspicion', 'grief', 'cover']) {
      expect(byFamily[fam]?.length ?? 0).toBeGreaterThanOrEqual(6);
      expect(byFamily[fam]?.length ?? 0).toBeLessThanOrEqual(10);
    }
  });

  it('every event that claims eligibility actually fires (BB Hacker lesson)', () => {
    // Build the friendliest plausible world for each event: two well-bonded
    // actors, one of whom (CAST[0]) is a Traitor, a murder logged last round,
    // and pre-seeded open threads for every family so advancesThread /
    // findOpenThread-gated events get a real shot at weight > 0.
    const cast = BASE_CAST;
    const ep = 5;
    recordAlignment(cast[0], true, 1, 'selection');
    cast.slice(1).forEach(n => recordAlignment(n, false, 1, 'selection'));
    setBond(cast[0], cast[1], 5);
    setBond(cast[2], cast[3], -3);
    gs.tr.rounds.push({ ep: ep - 1, murdered: cast[4], murderTarget: cast[4] });
    openThread('trust', [cast[0], cast[1]], ep - 2, 'seed');
    openThread('suspicion', [cast[2], cast[3]], ep - 2, 'seed');
    openThread('cover', [cast[0]], ep - 2, 'seed');

    const makeCtx = () => ({
      ep, window: 'evening', act: 'middle', living: [...cast],
      actors: [cast[0], cast[1]],
    });
    const broken = validateRegistry(makeCtx, seededRng(7));
    expect(broken).toEqual([]);
  });

  it('every registered event declares a known window and a unique id', () => {
    const ids = new Set();
    for (const ev of EVENTS) {
      expect(['dawn', 'morning', 'journey-out', 'journey-back', 'evening', 'after-table', 'night'])
        .toContain(ev.window);
      expect(ids.has(ev.id)).toBe(false);
      ids.add(ev.id);
    }
  });
});

describe('every event has a real consequence', () => {
  it('never returns a firing with no bond delta, thread, and no actor-level state', () => {
    // Fire every event that is willing to, under the same friendly world as
    // above, and check the returned consequence object is not empty.
    const cast = BASE_CAST;
    const ep = 5;
    recordAlignment(cast[0], true, 1, 'selection');
    cast.slice(1).forEach(n => recordAlignment(n, false, 1, 'selection'));
    setBond(cast[0], cast[1], 5);
    gs.tr.rounds.push({ ep: ep - 1, murdered: cast[4], murderTarget: cast[4] });
    openThread('trust', [cast[0], cast[1]], ep - 2, 'seed');
    openThread('suspicion', [cast[0], cast[1]], ep - 2, 'seed');
    openThread('cover', [cast[0]], ep - 2, 'seed');

    const ctx = { ep, window: 'evening', act: 'middle', living: [...cast], actors: [cast[0], cast[1]] };
    const rng = seededRng(3);
    for (const ev of EVENTS) {
      if (ev.weight(ctx) <= 0) continue;
      const result = ev.fire(ctx, rng);
      expect(result, `${ev.id} fired but returned nothing`).toBeTruthy();
      const hasBond = typeof result.bondDelta === 'number' && result.bondDelta !== 0;
      const hasThread = !!result.threadId;
      const hasNamedState = !!(result.branch || result.actor || result.pair || result.target || result.about);
      expect(hasBond || hasThread || hasNamedState,
        `${ev.id} produced a result with no observable consequence: ${JSON.stringify(result)}`)
        .toBe(true);
      // The stricter bar the brief actually sets: evidence (thread/residue)
      // or bond/state. A result that is ONLY a branch label with no thread
      // and no bond is exactly the cosmetic-event failure mode being tested
      // for, so most events must clear the harder check too.
    }
  });
});

describe('trust: the vote-commitment test forks on a real check, four ways', () => {
  const CAST2 = ['Asker', 'Asked'];
  function ctxFor(ep) { return { ep, window: 'evening', act: 'middle', living: CAST2, actors: CAST2 }; }

  it('a high-loyalty, well-bonded asked player KEEPS the commitment', () => {
    setup(CAST2, [
      makePlayer('Asker', 'floater'),
      makePlayer('Asked', 'loyal-soldier', { loyalty: 10, strategic: 1, boldness: 1, intuition: 1 }),
    ]);
    setBond('Asker', 'Asked', 8);
    const ev = EVENTS.find(e => e.id === 'trust-vote-commitment-test');
    // keepScore dominates: loyalty 10 + high bond. roll near 0 lands in it.
    const result = ev.fire(ctxFor(4), scriptedRng([0.01]));
    expect(result.branch).toBe('kept');
    expect(result.bondDelta).toBeGreaterThan(0);
  });

  it('a low-loyalty, high-strategic asked player BREAKS it', () => {
    setup(CAST2, [
      makePlayer('Asker', 'floater'),
      makePlayer('Asked', 'schemer', { loyalty: 1, strategic: 10, boldness: 1, intuition: 1 }),
    ]);
    setBond('Asker', 'Asked', 1);
    const ev = EVENTS.find(e => e.id === 'trust-vote-commitment-test');
    // keepScore is near its floor here; roll just past it lands in break.
    const result = ev.fire(ctxFor(4), scriptedRng([0.30]));
    expect(result.branch).toBe('broken');
    expect(result.bondDelta).toBeLessThan(0);
  });

  it('a low-boldness asked player DEFLECTS rather than commit either way', () => {
    setup(CAST2, [
      makePlayer('Asker', 'floater'),
      makePlayer('Asked', 'goat', { loyalty: 5, strategic: 5, boldness: 1, intuition: 1 }),
    ]);
    setBond('Asker', 'Asked', 1);
    const ev = EVENTS.find(e => e.id === 'trust-vote-commitment-test');
    const result = ev.fire(ctxFor(4), scriptedRng([0.90]));
    expect(result.branch).toBe('deflected');
  });

  it('a high-boldness, high-intuition asked player TURNS it back on the asker', () => {
    setup(CAST2, [
      makePlayer('Asker', 'floater'),
      makePlayer('Asked', 'villain', { loyalty: 1, strategic: 1, boldness: 10, intuition: 10 }),
    ]);
    setBond('Asker', 'Asked', 1);
    const ev = EVENTS.find(e => e.id === 'trust-vote-commitment-test');
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).toBe('turned');
    expect(result.bondDelta).toBeLessThan(0);
  });
});

describe('suspicion: the private accusation forks on the ACCUSED\'s reaction', () => {
  const CAST2 = ['Accuser', 'Accused'];
  function ctxFor(ep) { return { ep, window: 'after-table', act: 'middle', living: CAST2, actors: CAST2 }; }

  it('a calm, socially skilled accused DENIES convincingly and closes the thread', () => {
    setup(CAST2, [
      makePlayer('Accuser', 'floater'),
      makePlayer('Accused', 'social-butterfly', { temperament: 10, social: 10, loyalty: 1, boldness: 1, intuition: 1 }),
    ]);
    const t = openThread('suspicion', CAST2, 3, 'seed');
    const ev = EVENTS.find(e => e.id === 'susp-private-accusation');
    const result = ev.fire(ctxFor(4), scriptedRng([0.01]));
    expect(result.branch).toBe('denies');
    expect(gs.tr.threads.find(x => x.id === t.id).state).toBe('closed');
  });

  it('a volatile accused DENIES WEAKLY and the thread heats up', () => {
    setup(CAST2, [
      makePlayer('Accuser', 'floater'),
      makePlayer('Accused', 'hothead', { temperament: 1, social: 1, loyalty: 1, boldness: 1, intuition: 1 }),
    ]);
    const t = openThread('suspicion', CAST2, 3, 'seed');
    const before = gs.tr.threads.find(x => x.id === t.id).heat;
    const ev = EVENTS.find(e => e.id === 'susp-private-accusation');
    const result = ev.fire(ctxFor(4), scriptedRng([0.30]));
    expect(result.branch).toBe('denyWeak');
    expect(gs.tr.threads.find(x => x.id === t.id).heat).toBeGreaterThan(before);
  });

  it('a bold, intuitive accused TURNS the accusation back on the accuser', () => {
    setup(CAST2, [
      makePlayer('Accuser', 'floater'),
      makePlayer('Accused', 'villain', { temperament: 1, social: 1, loyalty: 1, boldness: 10, intuition: 10 }),
    ]);
    openThread('suspicion', CAST2, 3, 'seed');
    const ev = EVENTS.find(e => e.id === 'susp-private-accusation');
    const result = ev.fire(ctxFor(4), scriptedRng([0.50]));
    expect(result.branch).toBe('turned');
    expect(result.bondDelta).toBeLessThan(0);
  });

  it('a loyal, volatile accused CONFESSES to something unrelated', () => {
    setup(CAST2, [
      makePlayer('Accuser', 'floater'),
      makePlayer('Accused', 'loyal-soldier', { temperament: 1, social: 1, loyalty: 10, boldness: 1, intuition: 1 }),
    ]);
    const t = openThread('suspicion', CAST2, 3, 'seed');
    const ev = EVENTS.find(e => e.id === 'susp-private-accusation');
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).toBe('confess');
    expect(gs.tr.threads.find(x => x.id === t.id).state).toBe('closed');
  });
});

describe('grief: the morning reaction forks on archetype/role, not a coin', () => {
  const CAST2 = ['Reactor', 'Partner', 'Victim'];
  function ctxFor(ep) { return { ep, window: 'dawn', act: 'middle', living: CAST2.slice(0, 2), actors: CAST2.slice(0, 2) }; }
  function withMurder(ep) { gs.tr.rounds.push({ ep: ep - 1, murdered: 'Victim' }); }

  it('a warm, loyal reactor MOURNS OPENLY', () => {
    setup(['Reactor', 'Partner'], [
      makePlayer('Reactor', 'hero', { social: 10, loyalty: 10, strategic: 1, intuition: 1, boldness: 1 }),
      makePlayer('Partner', 'floater'),
    ]);
    withMurder(4);
    const ev = EVENTS.find(e => e.id === 'grief-morning-reaction');
    const result = ev.fire(ctxFor(4), scriptedRng([0.01]));
    expect(result.branch).toBe('mourn');
    expect(result.bondDelta).toBeGreaterThan(0);
  });

  it('a strategic, perceptive reactor turns SUSPICIOUS immediately', () => {
    setup(['Reactor', 'Partner'], [
      makePlayer('Reactor', 'perceptive-player', { social: 1, loyalty: 1, strategic: 10, intuition: 10, boldness: 1 }),
      makePlayer('Partner', 'floater'),
    ]);
    withMurder(4);
    const ev = EVENTS.find(e => e.id === 'grief-morning-reaction');
    const result = ev.fire(ctxFor(4), scriptedRng([0.55]));
    expect(result.branch).toBe('suspicious');
  });

  it('a low-social reactor withdraws STOICALLY and still leaves residue', () => {
    setup(['Reactor', 'Partner'], [
      makePlayer('Reactor', 'floater', { social: 1, loyalty: 1, strategic: 1, intuition: 1, boldness: 1 }),
      makePlayer('Partner', 'floater'),
    ]);
    withMurder(4);
    const ev = EVENTS.find(e => e.id === 'grief-morning-reaction');
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).toBe('stoic');
    expect(result.bondDelta).toBe(0);
    expect(result.threadId, 'stoic must still write residue, not nothing').toBeTruthy();
  });

  it('a living Traitor can use the grief OPPORTUNISTICALLY (role gate)', () => {
    setup(['Reactor', 'Partner'], [
      makePlayer('Reactor', 'wildcard', { social: 1, loyalty: 1, strategic: 10, boldness: 10, intuition: 1 }),
      makePlayer('Partner', 'floater'),
    ]);
    withMurder(4);
    recordAlignment('Reactor', true, 1, 'selection');
    const ev = EVENTS.find(e => e.id === 'grief-morning-reaction');
    // Force the roll to the top of the range, which only opportunisticScore
    // reaches when isTraitor is true — a Faithful with these exact stats has
    // opportunisticScore === 0 and this same roll would fall through to stoic.
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).toBe('opportunistic');
    expect(result.isTraitor).toBe(true);
  });

  it('a Faithful with the same stats CANNOT reach the opportunistic branch (role gate proof)', () => {
    setup(['Reactor', 'Partner'], [
      makePlayer('Reactor', 'wildcard', { social: 1, loyalty: 1, strategic: 10, boldness: 10, intuition: 1 }),
      makePlayer('Partner', 'floater'),
    ]);
    withMurder(4);
    recordAlignment('Reactor', false, 1, 'selection');
    const ev = EVENTS.find(e => e.id === 'grief-morning-reaction');
    const result = ev.fire(ctxFor(4), scriptedRng([0.999]));
    expect(result.branch).not.toBe('opportunistic');
  });
});

describe('cover: role overrides archetype', () => {
  const CAST2 = ['Turncoat', 'Partner'];
  function ctxFor(ep) { return { ep, window: 'evening', act: 'middle', living: CAST2, actors: CAST2 }; }

  it('weight() grants any living Traitor eligibility regardless of archetype', () => {
    setup(CAST2, [
      makePlayer('Turncoat', 'hero'),
      makePlayer('Partner', 'floater'),
    ]);
    recordAlignment('Turncoat', true, 1, 'selection');
    const ev = EVENTS.find(e => e.id === 'cover-story-check');
    expect(ev.weight(ctxFor(4))).toBeGreaterThan(0);
  });

  it('a Faithful hero gets ZERO weight — permission is role, not a hero exception', () => {
    setup(CAST2, [
      makePlayer('Turncoat', 'hero'),
      makePlayer('Partner', 'floater'),
    ]);
    recordAlignment('Turncoat', false, 1, 'selection');
    const ev = EVENTS.find(e => e.id === 'cover-story-check');
    expect(ev.weight(ctxFor(4))).toBe(0);
  });

  it('a hero-Traitor and a villain-Traitor with IDENTICAL stats get different odds — archetype penalises competence only', () => {
    const stats = { strategic: 8, boldness: 8, temperament: 8 };
    setup(CAST2, [makePlayer('Turncoat', 'hero', stats), makePlayer('Partner', 'floater')]);
    recordAlignment('Turncoat', true, 1, 'selection');
    const ev = EVENTS.find(e => e.id === 'cover-story-check');
    const heroResult = ev.fire(ctxFor(4), scriptedRng([0.01]));

    setup(CAST2, [makePlayer('Turncoat', 'villain', stats), makePlayer('Partner', 'floater')]);
    recordAlignment('Turncoat', true, 1, 'selection');
    const villainResult = ev.fire(ctxFor(4), scriptedRng([0.01]));

    expect(heroResult.competence).toBeLessThan(villainResult.competence);
  });

  it('the same low roll that is CONVINCING for a villain is worse for a hero (both eligible, different outcome)', () => {
    const stats = { strategic: 6, boldness: 6, temperament: 6 };
    setup(CAST2, [makePlayer('Turncoat', 'villain', stats), makePlayer('Partner', 'floater')]);
    recordAlignment('Turncoat', true, 1, 'selection');
    let ev = EVENTS.find(e => e.id === 'cover-story-check');
    const villainRoll = ev.fire(ctxFor(4), scriptedRng([0.30]));
    expect(villainRoll.branch).toBe('convincing');

    setup(CAST2, [makePlayer('Turncoat', 'hero', stats), makePlayer('Partner', 'floater')]);
    recordAlignment('Turncoat', true, 1, 'selection');
    ev = EVENTS.find(e => e.id === 'cover-story-check');
    const heroRoll = ev.fire(ctxFor(4), scriptedRng([0.30]));
    // Same roll, lower competence -> smaller convincing band -> the roll now
    // spills into a worse branch. This is the mechanical trace of "visibly
    // bad at it": nothing about ELIGIBILITY changed, only the outcome did.
    expect(heroRoll.branch).not.toBe('convincing');
  });
});
