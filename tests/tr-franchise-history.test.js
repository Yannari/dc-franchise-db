// Reputation is a fact about the LEDGER. Returning is a fact about the CASTING.
//
// `isReturnee` has safely meant both at once for fifteen seasons, because on
// Total Drama and Big Brother a returnee is the only person with a past worth
// carrying. The Traitors breaks the coincidence from both ends: every player
// has history, and nobody is returning to THIS show. Under the old gate a
// crossover cast needed twenty boxes ticked to switch on a system that can
// already read the ledger — and the day one was missed, that player walked in
// with no reputation, no grudges, and nothing on screen said so.
//
// The split: `hasFranchiseHistory(name)` is derived from the appearance ledger
// and gates REPUTATION. `isReturnee` keeps its per-season casting meaning and
// still gates ART. This file asserts the two no longer move together on The
// Traitors, and that they still agree on the other two shows.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setFranchiseLedger, setSeasonIncluded,
  buildFranchiseMeta, hasFranchiseHistory } from '../js/franchise-meta.js';
import { ensurePortraitSelection } from '../js/players.js';
import { setPortraitCatalog } from '../js/avatar-registry.js';

// Two prior seasons, one Total Drama and one Big Brother, so the cast below
// really is a CROSSOVER cast rather than one show's alumni wearing a new label.
function seedLedger() {
  const mk = over => ({ placement: 0, winner: false, finalist: false, episodesLasted: 10,
    blindsided: false, blindsidedBy: [], blindsidesAuthored: 0, idolsFound: 0, idolsPlayed: 0,
    idoledOut: false, betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [],
    chalWins: 0, schemesCaught: 0, ...over });
  setFranchiseLedger({ seasons: {
    '12': { seasonName: 'S12', players: {
      // Fiore knifed Thom on the way to the title. That is the grudge.
      'Fiore': mk({ placement: 1, winner: true, finalist: true, blindsidesAuthored: 2,
        idolsFound: 1, idolsPlayed: 1, betrayed: ['Thom'], allies: ['MacArthur'],
        chalWins: 4, schemesCaught: 1 }),
      'Thom': mk({ placement: 5, blindsided: true, blindsidedBy: ['Fiore'], idoledOut: true,
        betrayedBy: ['Fiore'] }),
      'MacArthur': mk({ placement: 3, finalist: true, blindsidesAuthored: 1, allies: ['Fiore'], chalWins: 2 }),
    } },
    'bb-1': { seasonName: 'BB1', format: 'big-brother', players: {
      'Ireland': mk({ placement: 2, finalist: true, chalWins: 3 }),
    } },
  } });
}

// Nobody on this cast is flagged. On The Traitors nobody IS returning.
const TR_CAST = [
  { name: 'Fiore', isReturnee: false },
  { name: 'Thom', isReturnee: false },
  { name: 'MacArthur', isReturnee: false },
  { name: 'Ireland', isReturnee: false },
  { name: 'Rookie', isReturnee: false },   // no ledger row at all
];

const trCfg = () => ({ franchiseMeta: true, format: 'traitors' });

beforeEach(() => { seedLedger(); window._trRunnable = true; });
afterEach(() => { delete window._trRunnable; });

describe('hasFranchiseHistory — the derived predicate', () => {
  it('reads the ledger, not the checkbox', () => {
    expect(hasFranchiseHistory('Fiore')).toBe(true);
    expect(hasFranchiseHistory('Ireland')).toBe(true);   // history on another show still counts
    expect(hasFranchiseHistory('Rookie')).toBe(false);
    expect(hasFranchiseHistory('')).toBe(false);
    expect(hasFranchiseHistory(undefined)).toBe(false);
    // ANTI-VACUITY: a predicate that answered the same thing for everybody
    // would pass every arm below without measuring anything.
    const answers = new Set(['Fiore', 'Ireland', 'Rookie'].map(n => hasFranchiseHistory(n)));
    expect(answers.size, 'hasFranchiseHistory is constant — it measures nothing').toBe(2);
  });

  it('follows the ledger when a season is excluded, and back when it returns', () => {
    setSeasonIncluded('12', false);
    expect(hasFranchiseHistory('Thom')).toBe(false);     // his only season is out
    expect(hasFranchiseHistory('Ireland')).toBe(true);   // hers is not
    setSeasonIncluded('12', true);
    expect(hasFranchiseHistory('Thom')).toBe(true);
  });
});

describe('The Traitors: history without the checkbox', () => {
  it('gives an unflagged crossover cast profiles, reputation and grudges', () => {
    const meta = buildFranchiseMeta(TR_CAST, trCfg());
    expect(meta, 'a whole crossover cast got nothing').not.toBeNull();
    // Reputation.
    expect(meta.profiles['Fiore'].repScore).toBeGreaterThan(0.5);
    expect(meta.profiles['Fiore'].resume.length).toBeGreaterThan(0);
    expect(meta.profiles['Fiore'].knownSchemer).toBeGreaterThan(0);
    expect(meta.profiles['Thom'].blindsideWariness).toBeGreaterThan(0);
    expect(meta.profiles['Thom'].idolParanoia).toBeGreaterThan(0);
    expect(meta.profiles['Ireland'].seasonsPlayed).toBe(1);
    // Grudges — Fiore cut Thom, and the wronged side carries the heavier bond.
    const betrayal = meta.seededPairs.filter(p => p.kind === 'betrayal');
    expect(betrayal.length, 'no grudge seeded from a betrayal in the ledger').toBeGreaterThan(0);
    const wronged = betrayal.find(p => p.a === 'Thom' && p.b === 'Fiore');
    expect(wronged.bondDelta).toBeLessThan(0);
    // COVERAGE FLOOR at the decision point: every profile here was handed out
    // to somebody the old gate would have skipped. If the fixture ever gains a
    // flagged player this number must be re-derived, not relaxed.
    expect(Object.keys(meta.profiles).length).toBe(4);
    expect(TR_CAST.filter(p => p.isReturnee).length, 'fixture no longer tests the unflagged case').toBe(0);
  });

  it('does not invent a past for a player who has none', () => {
    const meta = buildFranchiseMeta(TR_CAST, trCfg());
    expect(meta.profiles['Rookie']).toBeUndefined();
    // …and ticking the box does not conjure one either.
    const flagged = buildFranchiseMeta([{ name: 'Fiore', isReturnee: false },
      { name: 'Rookie', isReturnee: true }], trCfg());
    expect(flagged.profiles['Rookie'], 'a flagged player with no ledger row gained a profile').toBeUndefined();
  });

  it('still refuses the ledger when the engine is not wired', () => {
    // A format is stamped on the config long before its engine exists, and the
    // run loop falls through to Total Drama for anything it does not know. A
    // season stamped `traitors` and pressed Run IS a Total Drama season, and
    // handing it the ledger gave every veteran in it reputation nobody asked
    // for. The split must not reopen that door.
    delete window._trRunnable;
    expect(buildFranchiseMeta(TR_CAST, trCfg())).toBeNull();
  });

  it('leaves the portrait alone — history is not a costume', () => {
    // The other half of the overload. Having a past must NOT swap the
    // portrait, and since the catalog landed neither does RETURNING: the
    // season picks a look, and the two checkboxes decide nothing about art.
    setPortraitCatalog({ schemaVersion: 1, players: { fiore: {
      defaults: { global: 'base' },
      portraits: [
        { id: 'base', show: 'global', label: 'Profile default', file: 'fiore.png' },
        { id: 'tr-castle', show: 'traitors', label: 'Castle', file: 'fiore-tr.png' },
      ] } } }, ['fiore.png', 'fiore-tr.png']);
    expect(hasFranchiseHistory('Fiore')).toBe(true);
    const picked = { name: 'Fiore', slug: 'fiore', avatarId: 'base', avatarFile: 'fiore.png' };
    for (const returning of [false, true, false]) {
      picked.isReturnee = returning;
      ensurePortraitSelection(picked, 'traitors');
      expect(picked.avatarFile, 'a checkbox moved the portrait').toBe('fiore.png');
    }
  });
});

describe('the other two shows are unaffected', () => {
  // Their returnees have history, so the predicate should AGREE with the flag.
  // Verified rather than assumed.
  for (const format of ['total-drama', 'big-brother']) {
    it(format + ': the checkbox still decides, and history alone does not', () => {
      const cast = [
        { name: 'Fiore', isReturnee: true },     // flagged, has history   → profile
        { name: 'Thom', isReturnee: false },     // unflagged, has history → NO profile
        { name: 'Rookie', isReturnee: true },    // flagged, no history    → NO profile
      ];
      const meta = buildFranchiseMeta(cast, { franchiseMeta: true, format });
      expect(Object.keys(meta.profiles).sort()).toEqual(['Fiore']);
      // COVERAGE FLOOR: the three classes above must all be present, or this
      // arm passes without ever exercising the disagreement it is guarding.
      expect(cast.filter(p => p.isReturnee && hasFranchiseHistory(p.name)).length).toBe(1);
      expect(cast.filter(p => !p.isReturnee && hasFranchiseHistory(p.name)).length).toBe(1);
      expect(cast.filter(p => p.isReturnee && !hasFranchiseHistory(p.name)).length).toBe(1);
    });
  }
});
