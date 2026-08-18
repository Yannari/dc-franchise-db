// What happened to a character between seasons — the accrued third of the data
// model. Design: docs/superpowers/specs/2026-08-18-life-layer-design.md
//
// This file guards the vocabulary and the replay, because those are the two
// things that are expensive to be wrong about: events accrue forever, and a
// page that derives "are they together" from them must never disagree with
// itself.
//
// Two bugs were found by hand-writing nine events, before any generator
// existed, and both are pinned below. That was the entire point of building the
// shape first.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  KINDS, TRACKS, SIGNIFICANCE, kindOf, significanceOf, isTerminal,
  needsApproval, lineFor, deriveState, approvedFor, stateOf, involves, order,
} from '../js/life-events.js';

const ev = (o) => ({ status: 'approved', seq: 1, ...o });

describe('the vocabulary', () => {
  it('has a unique key for every kind', () => {
    const keys = KINDS.map(k => k.key);
    expect(new Set(keys).size, 'two kinds share a key').toBe(keys.length);
  });

  it('uses only declared tracks and significances', () => {
    for (const k of KINDS) {
      expect(TRACKS[k.track], `${k.key} has unknown track ${k.track}`).toBeTruthy();
      expect(SIGNIFICANCE).toContain(k.sig);
    }
  });

  it('gives every two-person kind a sentence that takes two names', () => {
    for (const k of KINDS.filter(x => x.whom)) {
      expect(k.line.length, `${k.key} is marked whom:true but its line takes one name`).toBe(2);
    }
  });

  it('covers all four tracks the author asked for', () => {
    const tracks = new Set(KINDS.map(k => k.track));
    for (const t of ['relationship', 'family', 'career', 'education', 'home', 'public', 'health']) {
      expect(tracks, `no kinds on the ${t} track`).toContain(t);
    }
  });

  it('marks the irreversible ones terminal', () => {
    expect(isTerminal('death')).toBe(true);
    expect(isTerminal('left-franchise')).toBe(true);
    expect(isTerminal('divorced'), 'a divorce is reversible in the sense that matters').toBe(false);
  });

  it('does not call a breakup a divorce', () => {
    // Different kinds, and a page must not print one for the other.
    expect(lineFor(ev({ player: 'a', whom: 'b', kind: 'broke-up' }))).toMatch(/broke up/);
    expect(lineFor(ev({ player: 'a', whom: 'b', kind: 'divorced' }))).toMatch(/divorced/);
  });

  it('survives a kind the vocabulary no longer knows', () => {
    expect(kindOf('nonsense')).toBeNull();
    expect(lineFor(ev({ player: 'a', kind: 'nonsense' }))).toBe('');
    expect(significanceOf('nonsense')).toBe('notable');
  });
});

// ── the first bug the hand-written events found ──
//
// Written per-player, a relationship produced TWO rows, only one of which had
// been written — so Alejandro was "living together with Lindsay" while Lindsay
// was "dating Alejandro". One fact, two answers, which is the trap the module
// header warns about, reached in nine events.
describe('a two-person event is ONE event', () => {
  const log = [
    ev({ player: 'alejandro', whom: 'lindsay', kind: 'dating', seq: 1 }),
    ev({ player: 'alejandro', whom: 'lindsay', kind: 'moved-in', seq: 2 }),
  ];

  it('appears on both pages', () => {
    expect(approvedFor('alejandro', log)).toHaveLength(2);
    expect(approvedFor('lindsay', log), 'the other half of the couple sees nothing')
      .toHaveLength(2);
    expect(involves(log[0], 'lindsay')).toBe(true);
  });

  it('leaves both of them in the SAME state', () => {
    const a = stateOf('alejandro', log);
    const b = stateOf('lindsay', log);
    expect(a.relationship.stage).toBe('living-together');
    expect(b.relationship.stage, 'the two sides disagree about one relationship')
      .toBe('living-together');
    expect(a.relationship.with).toBe('lindsay');
    expect(b.relationship.with, 'a character is in a relationship with themselves')
      .toBe('alejandro');
  });

  it('is phrased from the side of whoever is reading', () => {
    const names = { alejandro: 'Alejandro', lindsay: 'Lindsay' };
    expect(lineFor(log[1], names, 'alejandro')).toBe('Alejandro and Lindsay moved in together.');
    expect(lineFor(log[1], names, 'lindsay')).toBe('Lindsay and Alejandro moved in together.');
  });
});

// ── the second bug ──
//
// `seq` is per-player, so a shared event carries the numbering of whichever
// side it was written from. Sorting on it alone listed Lindsay's life as
// td-8, td-13, td-8, td-13. The season is the spine; seq only breaks ties.
describe('events are ordered by the franchise calendar', () => {
  const rank = new Map([['td-8', 20233], ['td-13', 20261]]);
  const log = [
    ev({ player: 'lindsay', kind: 'graduated', afterSeason: 'td-13', seq: 2 }),
    ev({ player: 'alejandro', whom: 'lindsay', kind: 'went-public', afterSeason: 'td-8', seq: 3 }),
    ev({ player: 'alejandro', whom: 'lindsay', kind: 'dating', afterSeason: 'td-8', seq: 1 }),
  ];

  it('sorts by season first, then by seq', () => {
    expect(approvedFor('lindsay', log, { seasonRank: rank }).map(e => e.kind))
      .toEqual(['dating', 'went-public', 'graduated']);
  });

  it('sorts an event pinned to an unplaced season last, not first', () => {
    const withOrphan = [...log, ev({ player: 'lindsay', kind: 'moved', afterSeason: 'td-99', seq: 0 })];
    expect(approvedFor('lindsay', withOrphan, { seasonRank: rank }).at(-1).kind).toBe('moved');
  });

  it('falls back to seq when no calendar is supplied', () => {
    expect([...log].sort(order(null)).map(e => e.seq)).toEqual([1, 2, 3]);
  });
});

describe('only approved events are canon', () => {
  const log = [
    ev({ player: 'a', whom: 'b', kind: 'wedding', seq: 1 }),
    ev({ player: 'a', whom: 'b', kind: 'divorced', seq: 2, status: 'proposed' }),
  ];

  it('a proposal does not change what a page says', () => {
    expect(approvedFor('a', log)).toHaveLength(1);
    expect(stateOf('a', log).relationship.stage, 'an unapproved divorce ended the marriage')
      .toBe('married');
  });

  it('and does change it once approved', () => {
    const approved = log.map(e => ({ ...e, status: 'approved' }));
    expect(stateOf('a', approved).relationship.stage).toBe('single');
    expect(stateOf('a', approved).relationship.with).toBeNull();
  });
});

describe('replaying a life', () => {
  it('walks the whole relationship track, including backwards', () => {
    const track = ['dating', 'went-public', 'moved-in', 'engaged', 'wedding', 'separated', 'divorced'];
    const log = track.map((kind, i) => ev({ player: 'a', whom: 'b', kind, seq: i + 1 }));
    expect(deriveState(log).relationship.stage).toBe('single');
    expect(deriveState(log.slice(0, 5)).relationship.stage).toBe('married');
  });

  it('counts children', () => {
    const log = [ev({ player: 'a', kind: 'birth', seq: 1 }), ev({ player: 'a', kind: 'birth', seq: 2 })];
    expect(deriveState(log).children).toBe(2);
  });

  it('closes the education track rather than treating a diploma as a one-off', () => {
    expect(deriveState([ev({ player: 'a', kind: 'enrolled' })]).education.stage).toBe('studying');
    expect(deriveState([
      ev({ player: 'a', kind: 'enrolled', seq: 1 }),
      ev({ player: 'a', kind: 'graduated', seq: 2 }),
    ]).education.stage).toBe('graduated');
  });

  it('stops at a terminal event', () => {
    // Nothing that happens after somebody dies is a fact about their life, and
    // an ordering slip must not be able to resurrect them.
    const log = [
      ev({ player: 'a', kind: 'death', seq: 1 }),
      ev({ player: 'a', whom: 'b', kind: 'wedding', seq: 2 }),
    ];
    const st = deriveState(log);
    expect(st.terminal).toBe('death');
    expect(st.relationship.stage, 'married after dying').toBe('single');
  });

  it('survives an empty or junk log', () => {
    expect(deriveState([]).relationship.stage).toBe('single');
    expect(deriveState([null, {}, { kind: 'nope', status: 'approved' }]).terminal).toBeNull();
    expect(approvedFor('a', [])).toEqual([]);
  });
});

describe('what may arrive without being looked at', () => {
  const policy = { minor: 'auto', notable: 'auto', major: 'ask' };

  it('lets a minor event through and holds a major one', () => {
    expect(needsApproval({ kind: 'new-job' }, { policy })).toBe(false);
    expect(needsApproval({ kind: 'wedding' }, { policy })).toBe(true);
  });

  it('always asks about the irreversible, whatever the policy says', () => {
    const allAuto = { minor: 'auto', notable: 'auto', major: 'auto' };
    expect(needsApproval({ kind: 'death' }, { policy: allAuto }),
      'a death slipped through on a policy set months ago').toBe(true);
    expect(needsApproval({ kind: 'left-franchise' }, { policy: allAuto })).toBe(true);
  });

  it('always asks when it contradicts something authored', () => {
    expect(needsApproval({ kind: 'new-job' }, { policy, contradictsAuthored: true })).toBe(true);
  });

  it('asks by default when no policy is set', () => {
    expect(needsApproval({ kind: 'new-job' })).toBe(true);
  });
});

describe('the stored log', () => {
  const doc = JSON.parse(readFileSync('life_events.json', 'utf8'));

  it('uses only kinds the vocabulary knows', () => {
    const bad = doc.events.filter(e => !kindOf(e.kind)).map(e => e.kind);
    expect([...new Set(bad)], 'an event kind nothing can render').toEqual([]);
  });

  it('gives every two-person event somebody to be about', () => {
    const orphan = doc.events.filter(e => kindOf(e.kind)?.whom && !e.whom).map(e => e.kind);
    expect(orphan, 'a two-person event with only one person in it').toEqual([]);
  });

  it('has a status on every row', () => {
    const bad = doc.events.filter(e => !['approved', 'proposed'].includes(e.status));
    expect(bad, 'an event that is neither canon nor a proposal').toEqual([]);
  });

  it('pins every event to a season the calendar knows', () => {
    const seasons = new Set(JSON.parse(readFileSync('seasons_database.json', 'utf8'))
      .seasons.map(s => s.seasonId));
    const bad = doc.events.filter(e => e.afterSeason && !seasons.has(e.afterSeason));
    expect(bad.map(e => e.afterSeason), 'an event after a season that does not exist').toEqual([]);
  });

  it('never stores both halves of one two-person event', () => {
    // The bug this whole module header is about. Same kind, same pair, same
    // season, written twice.
    const seen = new Set();
    const dupes = [];
    for (const e of doc.events) {
      if (!kindOf(e.kind)?.whom) continue;
      const pair = [e.player, e.whom].sort().join('|');
      const k = `${pair}|${e.kind}|${e.afterSeason}`;
      if (seen.has(k)) dupes.push(k);
      seen.add(k);
    }
    expect(dupes, 'one fact stored twice').toEqual([]);
  });
});
