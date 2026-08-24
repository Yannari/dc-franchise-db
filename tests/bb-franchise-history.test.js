// The house remembers the season before this one.
//
// initGameState already seeded starting bonds from the franchise ledger, so two
// returnees who cut each other last time arrived disliking each other — and no
// Big Brother module read that ledger, so nobody could ever say why. Total Drama
// has had OLD WOUNDS, REUNION and HISTORY at camp since the ledger existed; the
// house, which is built on the vote, had none of it.
//
// Asserted on what a viewer would see: that the beat fires, and that it cites
// the actual reason rather than gesturing at a vague past.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, setGs } from '../js/core.js';
import { FRANCHISE_HISTORY_EVENTS } from '../js/bb-events/franchise-history.js';
import { pastBetween, sharedPast, pastPairs, pastProfile, isVeteran } from '../js/bb-events/_read.js';

const HOUSE = ['Misha', 'Jules', 'Joel', 'Tobias'];

/** A season whose cast played together before, with the ledger to prove it. */
function seedHistory(pairs = null, profiles = null) {
  setGs({
    episodeHistory: [],
    popularity: {},
    activePlayers: [...HOUSE],
    eliminated: [],
    bb: { weeks: [] },
    franchiseMeta: {
      profiles: profiles || {},
      seededPairs: pairs || [
        { a: 'Jules', b: 'Misha', kind: 'betrayal', wronged: true, bondDelta: -3,
          reason: 'Misha betrayed Jules (Season 1)' },
        { a: 'Misha', b: 'Jules', kind: 'betrayal', wronged: false, bondDelta: -1,
          reason: 'Misha betrayed Jules (Season 1)' },
        { a: 'Joel', b: 'Tobias', kind: 'allies', bondDelta: 2,
          reason: 'Rode together to the end (Season 1)' },
      ],
    },
  });
}

const api = () => {
  const calls = { bonds: [], suspicion: [], targets: [] };
  return {
    calls,
    addBond: (a, b, d) => calls.bonds.push([a, b, d]),
    suspicion: (a, b, d) => calls.suspicion.push([a, b, d]),
    setTarget: (a, b, why) => calls.targets.push([a, b, why]),
  };
};

const byId = id => FRANCHISE_HISTORY_EVENTS.find(e => e.id === id);
const ctx = over => ({ week: { num: 1, ...(over?.week || {}) }, act: over?.act ?? 'house', beat: 0 });

beforeEach(() => seedHistory());

describe('reading the ledger from the house', () => {
  it('finds what two returnees did to each other', () => {
    const past = sharedPast('Jules', 'Misha');
    expect(past).toBeTruthy();
    expect(past.reason).toMatch(/betrayed/);
    // The betrayer-side copy says the same sentence from the wrong mouth.
    expect(pastBetween('Jules', 'Misha').every(p => p.wronged !== false)).toBe(true);
  });

  it('finds every pair in the house, worst blood first', () => {
    const pairs = pastPairs(HOUSE);
    expect(pairs.length).toBe(2);
    expect(pairs[0].kind).toBe('betrayal');     // |−3| outranks |+2|
  });

  it('is silent on a cast that has never played', () => {
    setGs({ franchiseMeta: null, activePlayers: [...HOUSE] });
    expect(pastPairs(HOUSE)).toEqual([]);
    expect(sharedPast('Jules', 'Misha')).toBeNull();
    expect(isVeteran('Jules')).toBe(false);
    for (const ev of FRANCHISE_HISTORY_EVENTS) {
      expect(ev.weight(HOUSE, ctx()), `${ev.id} fired on a rookie cast`).toBe(0);
    }
  });
});

describe('the house says why', () => {
  it('surfaces old business, and names it', () => {
    const ev = byId('past-surfaces');
    expect(ev.weight(HOUSE, ctx())).toBeGreaterThan(0);
    const out = ev.fire(HOUSE, ctx(), api());
    expect(out.text).toContain('Season 1');
    expect(out.badgeText).toBe('OLD WOUNDS');
    expect(out.players).toEqual(expect.arrayContaining(['Jules', 'Misha']));
  });

  it('reads a lasting alliance as a threat rather than a wound', () => {
    seedHistory([{ a: 'Joel', b: 'Tobias', kind: 'allies', bondDelta: 2,
      reason: 'Rode together to the end (Season 1)' }]);
    const out = byId('past-surfaces').fire(HOUSE, ctx(), api());
    expect(out.badgeText).toBe('THEY HAVE DONE THIS BEFORE');
    expect(out.badgeClass).toBe('gold');
  });

  it('stays out of the ceremonies', () => {
    for (const act of ['nominations', 'veto-ceremony', 'eviction']) {
      expect(byId('past-surfaces').weight(HOUSE, ctx({ act }))).toBe(0);
    }
  });

  it('does not tell the same story twice in a season', () => {
    const ev = byId('past-surfaces');
    ev.fire(HOUSE, ctx(), api());
    // A new week, so the once-a-week guard is not what is being tested.
    expect(ev.weight(HOUSE, ctx({ week: { num: 2 } }))).toBeGreaterThan(0);
    const second = ev.fire(HOUSE, ctx({ week: { num: 2 } }), api());
    // The betrayal is spent, so the remaining pair is the alliance.
    expect(second.players).toEqual(expect.arrayContaining(['Joel', 'Tobias']));
  });
});

describe('the power changes hands and the debt does not', () => {
  const nomWeek = { num: 2, hoh: 'Misha', nominees: ['Jules', 'Joel'] };

  it('fires when the HOH nominates somebody they have history with', () => {
    const ev = byId('past-nominated-again');
    expect(ev.weight(HOUSE, ctx({ act: 'nominations', week: nomWeek }))).toBeGreaterThan(0);
    const a = api();
    const out = ev.fire(HOUSE, ctx({ act: 'nominations', week: nomWeek }), a);
    expect(out.text).toMatch(/Season 1/);
    expect(out.players).toEqual(expect.arrayContaining(['Jules', 'Misha']));
    // It costs the bond and makes a target, or it is just narration.
    expect(a.calls.bonds.length).toBeGreaterThan(0);
    expect(a.calls.targets[0]?.[0]).toBe('Jules');
    expect(gs.popularity.Jules).toBeGreaterThan(0);   // the audience remembers too
  });

  it('does not fire when the HOH has no history with either nominee', () => {
    const clean = { num: 2, hoh: 'Tobias', nominees: ['Jules', 'Misha'] };
    expect(byId('past-nominated-again').weight(HOUSE, ctx({ act: 'nominations', week: clean }))).toBe(0);
  });
});

describe('eviction night collects an old debt', () => {
  it('fires for a voter with history against a nominee', () => {
    const week = { num: 3, finalNominees: ['Misha', 'Joel'],
      ballots: [{ voter: 'Jules', evict: 'Misha' }, { voter: 'Tobias', evict: 'Misha' }] };
    const ev = byId('past-settled-tonight');
    expect(ev.weight(HOUSE, ctx({ act: 'eviction', week }))).toBeGreaterThan(0);
    const out = ev.fire(HOUSE, ctx({ act: 'eviction', week }), api());
    expect(out.text).toMatch(/Season 1/);
    expect(out.badgeText).toBe('SOME DEBTS CARRY OVER');
    // Settling a score on camera reads cold.
    expect(gs.popularity.Jules).toBeLessThan(0);
  });

  it('only collects a BAD debt — an old ally is not a grudge', () => {
    const week = { num: 3, finalNominees: ['Tobias'],
      ballots: [{ voter: 'Joel', evict: 'Tobias' }] };
    expect(byId('past-settled-tonight').weight(HOUSE, ctx({ act: 'eviction', week }))).toBe(0);
  });
});

describe('a reputation arrives before the player does', () => {
  it('fires on somebody the ledger marks as a schemer', () => {
    seedHistory([], { Misha: { knownSchemer: 0.8, resume: ['Cut three allies to reach the end'] } });
    const ev = byId('past-known-for-it');
    expect(ev.weight(HOUSE, ctx())).toBeGreaterThan(0);
    const a = api();
    const out = ev.fire(HOUSE, ctx(), a);
    expect(out.text).toContain('Cut three allies');
    expect(out.players).toEqual(['Misha']);
    // The house watches them, which is the whole cost of a reputation.
    expect(a.calls.suspicion.length).toBeGreaterThan(0);
    expect(a.calls.suspicion.every(([, subject]) => subject === 'Misha')).toBe(true);
  });

  it('ignores a clean record', () => {
    seedHistory([], { Misha: { knownSchemer: 0.1, resume: ['Won without cutting anybody'] } });
    expect(byId('past-known-for-it').weight(HOUSE, ctx())).toBe(0);
  });

  it('happens once a season, not every week', () => {
    seedHistory([], { Misha: { knownSchemer: 0.8, resume: ['Cut three allies'] } });
    byId('past-known-for-it').fire(HOUSE, ctx(), api());
    expect(byId('past-known-for-it').weight(HOUSE, ctx({ week: { num: 5 } }))).toBe(0);
  });
});

// ── AND THE ROOM THAT VOTES ───────────────────────────────────────────────
//
// The jury was the one room that never asked. A juror cut by this finalist in a
// previous summer walked in neutral about them, which is not how anybody works.
describe('the jury does not arrive neutral', () => {
  it('carries an old betrayal into the opening read', async () => {
    const { seedJurorReads, readOf } = await import('../js/bb/jury-sentiment.js');
    const base = () => ({
      episodeHistory: [], popularity: {}, activePlayers: ['Misha', 'Joel'],
      eliminated: ['Jules'], bb: { weeks: [], jurySentiment: {} }, playerStates: {},
    });

    // Same juror, same finalists, once with history and once without.
    setGs({ ...base(), franchiseMeta: null });
    seedJurorReads('Jules', 5);
    const neutral = readOf('Jules', 'Misha');

    setGs({ ...base(), franchiseMeta: { profiles: {}, seededPairs: [
      { a: 'Jules', b: 'Misha', kind: 'betrayal', wronged: true, bondDelta: -3,
        reason: 'Misha betrayed Jules (Season 1)' }] } });
    seedJurorReads('Jules', 5);
    const withPast = readOf('Jules', 'Misha');

    expect(withPast).toBeLessThan(neutral);
    // A thumb on the scale, not the verdict: this season still outweighs it.
    expect(neutral - withPast).toBeLessThan(1.6);
  });

  it('carries an old alliance the other way', async () => {
    const { seedJurorReads, readOf } = await import('../js/bb/jury-sentiment.js');
    setGs({ episodeHistory: [], popularity: {}, activePlayers: ['Misha'],
      eliminated: ['Joel'], bb: { weeks: [], jurySentiment: {} }, playerStates: {},
      franchiseMeta: { profiles: {}, seededPairs: [
        { a: 'Joel', b: 'Misha', kind: 'allies', bondDelta: 2,
          reason: 'Rode together to the end (Season 1)' }] } });
    seedJurorReads('Joel', 5);
    expect(readOf('Joel', 'Misha')).toBeGreaterThan(0);
  });
});

// ── AND WHAT IT COSTS THEM ────────────────────────────────────────────────
//
// A reputation is only a reputation if it costs something. The house shook
// hands with a known ally-cutter exactly as readily as with anybody else.
describe('a reputation costs something at the handshake', () => {
  it('means it less with somebody whose season was televised', async () => {
    const { makeEndgameDeal, sincerityOf } = await import('../js/bb/deals.js');
    const { setPlayers } = await import('../js/core.js');
    const stats = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
      loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };

    const sincerity = profiles => {
      setPlayers([{ name: 'Ada', stats: { ...stats } }, { name: 'Nix', stats: { ...stats } }]);
      setGs({ episodeHistory: [], activePlayers: ['Ada', 'Nix'], eliminated: [], bonds: {},
        bb: { weeks: [], deals: [] }, playerStates: {},
        franchiseMeta: profiles ? { profiles, seededPairs: [] } : null });
      const deal = makeEndgameDeal('Ada', 'Nix', 'final-two', { week: { num: 3 } });
      return sincerityOf(deal, 'Ada');
    };

    const clean = sincerity(null);
    const known = sincerity({ Nix: { knownSchemer: 0.9 } });
    expect(known).toBeLessThan(clean);
  });
});
