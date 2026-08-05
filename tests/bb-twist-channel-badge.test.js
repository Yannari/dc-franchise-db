// The channel a twist hands its power out through, on the card.
//
// Eight distributors were all filed under "Advantages", which told you
// nothing: a power you WIN, one a country VOTES you, one you BUY and one you
// have to go and FIND are four different twists wearing one label. The channel
// was only ever visible inside the contract.
//
// It is the axis a season is actually built along — three powers nobody can
// earn plays completely differently from three you compete for — so it is
// surfaced per card.
import { describe, expect, it } from 'vitest';
import { TWIST_CATALOG } from '../js/core.js';
import { ACQUISITION_LABEL, twistChannel, POWER_ACQUISITION_CHANNELS,
  BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { twistChannelBadge } from '../js/bb-run.js';

describe('every channel can be read in words', () => {
  it('labels all eight, so no channel renders as a raw id', () => {
    for (const ch of POWER_ACQUISITION_CHANNELS) {
      const label = ACQUISITION_LABEL[ch];
      expect(label, `${ch} has no label — it would print as a raw id`).toBeTruthy();
      expect(label.tag.length).toBeGreaterThan(2);
      expect(label.hint.length, `${ch} has no explanation`).toBeGreaterThan(10);
    }
  });

  it('says what happens to YOU, not what the machinery does', () => {
    // won / given / found / bought / gambled / offered / drawn — the verb is
    // the difference the house actually feels, and it has to distinguish.
    const verbs = new Set(Object.values(ACQUISITION_LABEL).map(l => l.verb));
    expect(verbs.size, 'the channels collapse into one or two words')
      .toBeGreaterThan(4);
  });
});

describe('the badge on the card', () => {
  it('gives every distributor twist its channel', () => {
    const distributors = Object.keys(BB_TWIST_CONTRACTS)
      .filter(id => BB_TWIST_CONTRACTS[id].acquisition);
    expect(distributors.length, 'no distributors registered').toBeGreaterThan(4);
    for (const id of distributors) {
      const badge = twistChannelBadge(id);
      expect(badge, `${id} hands out a power and shows no channel`).toBeTruthy();
      expect(badge.channel).toBe(twistChannel(id));
      expect(badge.tag).toBeTruthy();
    }
  });

  it('stays silent for a twist that hands out nothing', () => {
    // Have-Nots and the double eviction change the week, not who is holding
    // what. A channel badge on those would be a lie.
    expect(twistChannelBadge('bb-double-eviction')).toBeNull();
    expect(twistChannelBadge('bb-have-nots')).toBeNull();
    expect(twistChannelBadge('not-a-twist-at-all')).toBeNull();
  });

  it('is reachable as a FUNCTION, because window only takes those', () => {
    // main.js copies functions onto window and drops objects, which is exactly
    // how the Pandora's Box cargo dropdown ended up with one item in it. The
    // map is not exported to the designer; this is.
    expect(typeof twistChannelBadge).toBe('function');
  });

  it('covers the BB twists the designer actually lists', () => {
    // A distributor in the catalog with no contract would render bare.
    const listed = TWIST_CATALOG.filter(t => t.format === 'big-brother');
    expect(listed.length).toBeGreaterThan(10);
    const withPower = listed.filter(t => twistChannelBadge(t.id));
    expect(withPower.length, 'no listed twist shows a channel').toBeGreaterThan(4);
  });
});
