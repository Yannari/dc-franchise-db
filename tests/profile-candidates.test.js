// Two sources, one preview. The rule that matters: where two sources disagree
// the reader chooses, because "reviewed" and "fresh" are both legitimate
// answers and neither this code nor a button label can know which one is
// wanted for a given field.
import { describe, expect, it } from 'vitest';
import { applyCandidateSelection, diffProfileCandidates } from '../js/profile-import.js';

const draft = (over = {}) => ({
  slug: 'leshawna', name: 'Leshawna', occupation: '', hometown: '', personality: '',
  ...over,
});
const roster = (over = {}) => ({
  slug: 'leshawna', occupation: 'Hair stylist',
  profileSources: { occupation: [{ label: 'Continuity bible', kind: 'simulator-continuity' }] },
  ...over,
});
const wiki = (over = {}) => ({
  slug: 'leshawna', occupation: 'Beautician', hometown: 'Toronto',
  profileSources: {
    occupation: [{ label: 'Total Drama Wiki', kind: 'source-canon', quote: 'works as a beautician' }],
    hometown: [{ label: 'Read from the article', kind: 'interpretation' }],
  },
  ...over,
});

const src = (origin, label, profile) => ({ origin, label, profile });
const rowFor = (rows, key) => rows.find(r => r.key === key);

describe('merging what two sources offer', () => {
  it('puts both answers on one row when they disagree', () => {
    const rows = diffProfileCandidates(draft(), [
      src('roster', 'Saved profile', roster()),
      src('wiki', 'Total Drama Wiki', wiki()),
    ]);
    const occ = rowFor(rows, 'occupation');
    expect(occ.candidates).toHaveLength(2);
    expect(occ.candidates.map(c => c.value)).toEqual(['Hair stylist', 'Beautician']);
    expect(occ.candidates.map(c => c.origin)).toEqual(['roster', 'wiki']);
  });

  it('collapses two sources that say the same thing', () => {
    const rows = diffProfileCandidates(draft(), [
      src('roster', 'Saved profile', roster()),
      src('wiki', 'Wiki', wiki({ occupation: 'Hair stylist' })),
    ]);
    // Agreement is one option, not a choice between identical twins.
    expect(rowFor(rows, 'occupation').candidates).toHaveLength(1);
  });

  it('offers a field only one source knows about', () => {
    const rows = diffProfileCandidates(draft(), [
      src('roster', 'Saved profile', roster()),
      src('wiki', 'Wiki', wiki()),
    ]);
    const home = rowFor(rows, 'hometown');
    expect(home.candidates).toHaveLength(1);
    expect(home.candidates[0].origin).toBe('wiki');
  });

  it('says nothing about a field the draft already agrees with', () => {
    const rows = diffProfileCandidates(draft({ occupation: 'Hair stylist' }), [
      src('roster', 'Saved profile', roster()),
    ]);
    expect(rowFor(rows, 'occupation')).toBeUndefined();
  });

  it('ignores a source that has the field but leaves it blank', () => {
    const rows = diffProfileCandidates(draft(), [
      src('roster', 'Saved profile', roster({ occupation: '   ' })),
    ]);
    // A published blank is not an offer — it is the absence of one, and
    // proposing it would let an empty roster row wipe authored prose.
    expect(rowFor(rows, 'occupation')).toBeUndefined();
  });
});

describe('what comes ticked', () => {
  it('ticks a field the draft has not filled in', () => {
    const rows = diffProfileCandidates(draft(), [src('wiki', 'Wiki', wiki())]);
    expect(rowFor(rows, 'hometown').selected).toBe(true);
  });

  it('leaves a field the reader already wrote unticked', () => {
    const rows = diffProfileCandidates(
      draft({ personality: 'My own read of her' }),
      [src('wiki', 'Wiki', wiki({ personality: 'A different read' }))]);
    expect(rowFor(rows, 'personality').selected).toBe(false);
  });
});

describe('applying a choice keeps its provenance', () => {
  it('carries the citation of the candidate actually picked', () => {
    const rows = diffProfileCandidates(draft(), [
      src('roster', 'Saved profile', roster()),
      src('wiki', 'Wiki', wiki()),
    ]);
    const occ = rowFor(rows, 'occupation');
    const chosen = occ.candidates.find(c => c.origin === 'wiki');

    const out = applyCandidateSelection(draft(), [
      { key: 'occupation', value: chosen.value, sources: chosen.sources },
    ]);
    expect(out.occupation).toBe('Beautician');
    expect(out.profileSources.occupation[0].kind).toBe('source-canon');
    expect(out.profileSources.occupation[0].quote).toBe('works as a beautician');
  });

  it('carries the other citation when the other one is picked', () => {
    const rows = diffProfileCandidates(draft(), [
      src('roster', 'Saved profile', roster()),
      src('wiki', 'Wiki', wiki()),
    ]);
    const chosen = rowFor(rows, 'occupation').candidates.find(c => c.origin === 'roster');
    const out = applyCandidateSelection(draft(), [
      { key: 'occupation', value: chosen.value, sources: chosen.sources },
    ]);
    expect(out.occupation).toBe('Hair stylist');
    expect(out.profileSources.occupation[0].kind).toBe('simulator-continuity');
  });

  it('leaves every field it was not given alone', () => {
    const before = draft({ personality: 'Mine', hometown: 'Somewhere' });
    const out = applyCandidateSelection(before, [{ key: 'occupation', value: 'Chef', sources: [] }]);
    expect(out.personality).toBe('Mine');
    expect(out.hometown).toBe('Somewhere');
    expect(out.occupation).toBe('Chef');
  });

  it('refuses to merge two different people', () => {
    expect(() => diffProfileCandidates(draft(), [
      src('wiki', 'Wiki', { slug: 'someone-else', occupation: 'Chef' }),
    ])).toThrow(/slug/i);
  });
});
