// ties.test.js — family & ties on the character (js/ties.js), read by every
// show through core.js kinshipBetween / kinshipPairs.
// User (2026-09-30): "do derived family, and married is the starting point".
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { tieBetween, tiesOf, tiesAmong, allTies } from '../js/ties.js';
import '../js/ties-kin.js';
import { kinshipBetween, kinshipPairs, relationships, setPlayers } from '../js/core.js';

// Rosa is Mateo's mother and Luis's wife; Carmen is Rosa's sister and Nico's
// mother; Abuela is Rosa's mother. Nobody typed: Carmen is Mateo's aunt, Nico
// is Mateo's cousin, Abuela is Mateo's grandmother, Luis and Carmen are in-laws.
const ROSTER = [
  { name: 'Rosa', ties: [{ name: 'Mateo', kin: 'parent-child', role: 'parent' }, { name: 'Luis', kin: 'married' }, { name: 'Carmen', kin: 'siblings' }] },
  { name: 'Carmen', ties: [{ name: 'Nico', kin: 'parent-child', role: 'parent' }] },
  { name: 'Abuela', ties: [{ name: 'Rosa', kin: 'parent-child', role: 'parent' }] },
  { name: 'Mateo' }, { name: 'Luis' }, { name: 'Nico' }, { name: 'Zed' },
];

describe('a tie is read both ways', () => {
  it('set on Rosa, Mateo sees it too, with the direction flipped', () => {
    expect(tieBetween('Rosa', 'Mateo', ROSTER)).toMatchObject({ kin: 'parent-child', roleA: 'parent', derived: false });
    expect(tieBetween('Mateo', 'Rosa', ROSTER)).toMatchObject({ kin: 'parent-child', roleA: 'child', derived: false });
    expect(tiesOf('Luis', ROSTER).filter(t => !t.derived)).toEqual([{ name: 'Rosa', kin: 'married', derived: false }]);
    // and the family he married into, worked out
    expect(tiesOf('Luis', ROSTER).filter(t => t.derived).map(t => `${t.name}:${t.kin}`).sort()).toEqual(['Abuela:in-laws', 'Carmen:in-laws']);
  });
  it('people with no tie have none', () => {
    expect(tieBetween('Zed', 'Rosa', ROSTER)).toBeNull();
  });
});

describe('the family nobody typed is worked out', () => {
  it('a parent\'s sibling is an aunt, and her child a cousin', () => {
    expect(tieBetween('Carmen', 'Mateo', ROSTER)).toMatchObject({ kin: 'aunt-uncle', roleA: 'elder', derived: true });
    expect(tieBetween('Mateo', 'Nico', ROSTER)).toMatchObject({ kin: 'cousins', derived: true });
  });
  it('a parent\'s parent is a grandparent; a parent\'s sibling shares the grandparent', () => {
    expect(tieBetween('Abuela', 'Mateo', ROSTER)).toMatchObject({ kin: 'grandparent', roleA: 'grandparent', derived: true });
    expect(tieBetween('Abuela', 'Carmen', ROSTER)).toMatchObject({ kin: 'parent-child', roleA: 'parent', derived: true });
    expect(tieBetween('Nico', 'Abuela', ROSTER)).toMatchObject({ kin: 'grandparent', roleA: 'grandchild', derived: true });
  });
  it('a spouse\'s sibling is an in-law', () => {
    expect(tieBetween('Luis', 'Carmen', ROSTER)).toMatchObject({ kin: 'in-laws', derived: true });
  });
  it('a married couple is not made each other\'s anything else, and nobody becomes their own relative', () => {
    expect(tieBetween('Rosa', 'Luis', ROSTER).kin).toBe('married');
    for (const e of allTies(ROSTER).values()) expect(e.a).not.toBe(e.b);
  });
  it('what was typed beats what would be worked out', () => {
    const r = [...ROSTER.map(c => ({ ...c })), { name: 'X', ties: [] }];
    r[3] = { name: 'Mateo', ties: [{ name: 'Nico', kin: 'best-friends' }] };   // typed: best friends
    expect(tieBetween('Mateo', 'Nico', r)).toMatchObject({ kin: 'best-friends', derived: false });
  });
});

describe('every show reads them through core.js', () => {
  const before = [...relationships];
  beforeEach(() => {
    globalThis.window = { FRANCHISE_ROSTER: ROSTER };
    relationships.length = 0;
    setPlayers(['Rosa', 'Mateo', 'Carmen', 'Zed'].map(name => ({ name })));
  });
  afterEach(() => {
    relationships.length = 0; relationships.push(...before);
    setPlayers([]);
    delete globalThis.window;
  });
  it('kinshipBetween answers from the profiles when the tab says nothing', () => {
    expect(kinshipBetween('Rosa', 'Mateo')).toBe('parent-child');
    expect(kinshipBetween('Mateo', 'Carmen')).toBe('aunt-uncle');
    expect(kinshipBetween('Zed', 'Rosa')).toBe('none');
  });
  it('a kin typed on the season\'s tab wins: siblings can be estranged this time', () => {
    relationships.push({ id: 't', a: 'Carmen', b: 'Rosa', kin: 'estranged', type: 'rivals', bond: -3 });
    expect(kinshipBetween('Rosa', 'Carmen')).toBe('estranged');
    expect(kinshipPairs().filter(p => [p.a, p.b].sort().join() === 'Carmen,Rosa')).toHaveLength(1);
  });
  it('a row with only a feeling still takes its kin from the profiles', () => {
    relationships.push({ id: 'f', a: 'Rosa', b: 'Mateo', type: 'neutral', bond: 2 });
    expect(kinshipBetween('Rosa', 'Mateo')).toBe('parent-child');
  });
  it('kinshipPairs lists the profile ties among THIS cast only, marked as such', () => {
    const pairs = kinshipPairs();
    const keys = pairs.map(p => [p.a, p.b].sort().join('|')).sort();
    expect(keys).toEqual(['Carmen|Mateo', 'Carmen|Rosa', 'Mateo|Rosa']);   // not Luis, Nico, Abuela: not cast
    expect(pairs.every(p => p.fromProfile)).toBe(true);
    expect(pairs.find(p => p.kin === 'aunt-uncle').derived).toBe(true);
    expect(kinshipPairs('siblings').map(p => p.kin)).toEqual(['siblings']);
  });
  it('with no roster ties, kinship is exactly what the tab says (nothing changes for old seasons)', () => {
    globalThis.window = { FRANCHISE_ROSTER: [{ name: 'Rosa' }, { name: 'Mateo' }] };
    expect(kinshipPairs()).toEqual([]);
    expect(kinshipBetween('Rosa', 'Mateo')).toBe('none');
  });
});

describe('tiesAmong', () => {
  it('returns typed and worked-out ties between the named people', () => {
    expect(tiesAmong(['Mateo', 'Nico', 'Zed'], ROSTER).map(e => e.kin)).toEqual(['cousins']);
  });
});

describe('married is the starting point (life after the show)', async () => {
  const { stateOf, needsApproval } = await import('../js/life-events.js');
  const { relationshipStatus } = await import('../js/dramagram.js');
  const { useRoster, startingCouple } = await import('../js/ties.js');
  const R = [
    { name: 'Rosa', slug: 'rosa', ties: [{ name: 'Luis', kin: 'married' }, { name: 'Mateo', kin: 'parent-child', role: 'parent' }] },
    { name: 'Luis', slug: 'luis' }, { name: 'Mateo', slug: 'mateo' },
    { name: 'Ana', slug: 'ana', ties: [{ name: 'Ben', kin: 'dating' }, { name: 'Cy', kin: 'engaged' }] },
    { name: 'Ben', slug: 'ben' }, { name: 'Cy', slug: 'cy' },
  ];
  beforeEach(() => useRoster(R));
  afterEach(() => useRoster(null));

  it('a married tie starts both of them married, with no wedding in the log', () => {
    expect(stateOf('rosa', []).relationship).toEqual({ stage: 'married', with: 'luis' });
    expect(stateOf('luis', []).relationship).toEqual({ stage: 'married', with: 'rosa' });
  });
  it('Dramagram shows the couple chip, and only the couple: family is not a relationship status', () => {
    expect(relationshipStatus('rosa', { names: { luis: 'Luis' } }).label).toBe('Married to Luis');
    expect(relationshipStatus('mateo', {}).stage).toBe('single');
  });
  it('the life layer has the last word: a divorce in the log ends it', () => {
    const ev = [{ kind: 'divorced', player: 'rosa', whom: 'luis', status: 'approved', afterSeason: 'td-1', seq: 1 }];
    expect(stateOf('rosa', ev).relationship.stage).toBe('single');
    expect(stateOf('luis', ev).relationship.stage).toBe('single');
  });
  it('a divorce always asks, whatever the policy says', () => {
    expect(needsApproval({ kind: 'divorced' }, { policy: { major: 'auto', notable: 'auto', minor: 'auto' } })).toBe(true);
    expect(needsApproval({ kind: 'moved-in' }, { policy: { notable: 'auto', major: 'auto' } })).toBe(false);
  });
  it('the closest tie wins when two were typed (engaged over dating)', () => {
    expect(startingCouple('Ana', R)).toMatchObject({ kin: 'engaged', withName: 'Cy' });
    expect(stateOf('ana', []).relationship).toEqual({ stage: 'engaged', with: 'cy' });
  });
  it('nobody is worked out into a couple; people with no tie start single', () => {
    expect(stateOf('mateo', []).relationship.stage).toBe('single');
    expect(stateOf('ben', []).relationship.stage).toBe('dating');   // typed, from Ana's side
  });
});

describe('the couple walks into every show together', async () => {
  const { lifeSeeds } = await import('../js/life-cast.js');
  const { useRoster } = await import('../js/ties.js');
  const R = [{ name: 'Rosa', slug: 'rosa', ties: [{ name: 'Luis', kin: 'married' }] }, { name: 'Luis', slug: 'luis' }, { name: 'Zed', slug: 'zed' }];
  beforeEach(() => useRoster(R));
  afterEach(() => useRoster(null));
  it('cast together, on an empty life log, they carry in as a married couple', () => {
    const s = lifeSeeds([{ name: 'Rosa', slug: 'rosa' }, { name: 'Luis', slug: 'luis' }], [], []);
    expect(s.showmances).toEqual([expect.objectContaining({ players: ['Rosa', 'Luis'], stage: 'married' })]);
    expect(s.pairs[0]).toMatchObject({ kind: 'life-together' });
    expect(s.pairs[0].bondDelta).toBeGreaterThan(0);
  });
  it('cast alone, the spouse is at home', () => {
    const s = lifeSeeds([{ name: 'Rosa', slug: 'rosa' }, { name: 'Zed', slug: 'zed' }], [], []);
    expect(s.soloPartners).toEqual([expect.objectContaining({ name: 'Rosa', whom: 'luis', stage: 'married' })]);
  });
  it('nobody with no tie carries anything (an empty franchise plays as before)', () => {
    useRoster([]);
    expect(lifeSeeds([{ name: 'Rosa', slug: 'rosa' }, { name: 'Luis', slug: 'luis' }], [], [])).toEqual({ pairs: [], showmances: [], soloPartners: [] });
  });
});

describe('ties start the pair\'s bond on every show', async () => {
  const { buildInitialBonds } = await import('../js/savestate.js');
  const { tieStartBonds } = await import('../js/ties.js');
  const { coupleNow } = await import('../js/ties-kin.js');
  const R = [
    { name: 'Rosa', slug: 'rosa', ties: [{ name: 'Luis', kin: 'married' }, { name: 'Carmen', kin: 'siblings' }, { name: 'Ivy', kin: 'estranged' }] },
    { name: 'Luis', slug: 'luis' }, { name: 'Carmen', slug: 'carmen' }, { name: 'Ivy', slug: 'ivy' }, { name: 'Zed', slug: 'zed' },
  ];
  beforeEach(() => {
    globalThis.window = { FRANCHISE_ROSTER: R, __lifeLog: [] };
    relationships.length = 0;
    setPlayers(R.map(c => ({ name: c.name, slug: c.slug })));
  });
  afterEach(() => { relationships.length = 0; setPlayers([]); delete globalThis.window; });
  const bk = (a, b) => [a, b].sort().join('||');      // bonds.js bKey
  const pk = (a, b) => [a, b].sort().join('|');

  it('Total Drama / Big Brother / Drag Race: sisters start warm, estranged family cold, with nothing typed on the tab', () => {
    const { bonds } = buildInitialBonds();
    expect(bonds[bk('Rosa', 'Carmen')]).toBeGreaterThan(3);
    expect(bonds[bk('Rosa', 'Ivy')]).toBeLessThan(0);
    expect(bonds[bk('Rosa', 'Zed')]).toBeUndefined();
  });
  it('a married couple is NOT paid here (the life layer carries them in, bond and showmance)', () => {
    expect(buildInitialBonds().bonds[bk('Rosa', 'Luis')]).toBeUndefined();
  });
  it('a feeling typed on the tab keeps its bond; the kin still comes from the profile', () => {
    relationships.push({ id: 'x', a: 'Rosa', b: 'Carmen', type: 'rivals', bond: -4 });
    const { bonds, bondLean } = buildInitialBonds();
    expect(bonds[bk('Rosa', 'Carmen')]).toBe(-4);
    expect(Object.keys(bondLean).some(k => k.includes('Rosa') && k.includes('Carmen'))).toBe(true);
  });
  it('The Traitors: ties plus whatever the franchise carried, clamped', () => {
    const out = tieStartBonds(['Rosa', 'Carmen', 'Luis'], kinshipPairs(), [{ a: 'Rosa', b: 'Carmen', delta: -4 }]);
    expect(out.find(x => pk(x.a, x.b) === pk('Rosa', 'Carmen')).delta).toBe(2);       // 6 sisters - 4 betrayal
    expect(out.find(x => pk(x.a, x.b) === pk('Rosa', 'Luis'))).toBeUndefined();         // the couple is life's
  });
  it('a couple\'s tie is only where they started: divorced since reads exes, wed since reads married', () => {
    expect(coupleNow('Rosa', 'Luis', 'married', [])).toBe('married');
    expect(coupleNow('Rosa', 'Luis', 'married', [{ kind: 'divorced', player: 'rosa', whom: 'luis', status: 'approved', afterSeason: 'x', seq: 1 }])).toBe('exes');
    expect(kinshipBetween('Rosa', 'Luis')).toBe('married');
    window.__lifeLog = [{ kind: 'divorced', player: 'luis', whom: 'rosa', status: 'approved', afterSeason: 'x', seq: 1 }];
    expect(kinshipBetween('Rosa', 'Luis')).toBe('exes');
    expect(kinshipBetween('Rosa', 'Carmen')).toBe('siblings');   // blood never changes
  });
  it('a log that has one of them with somebody else, and never ended THIS couple, is not a break-up', () => {
    const log = [{ kind: 'dating', player: 'rosa', whom: 'zed', status: 'approved', afterSeason: 'x', seq: 1 }];
    expect(coupleNow('Rosa', 'Luis', 'married', log)).toBe('married');
  });
});
