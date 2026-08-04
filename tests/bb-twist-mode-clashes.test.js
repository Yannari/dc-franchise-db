// A twist can clash with the SEASON, not just with another twist.
//
// `incompatible` on a catalog entry only ever understood other twist cards, so
// a card that cannot share a week with a standing season rule had nowhere to
// say so. Scheduling the Battle of the Block on a Block Buster season gave no
// warning at all: the designer accepted it, and days of simulated season later
// the engine quietly stood the Battle down.
//
// SEASON_MODES makes modes first-class. Declaring `incompatibleModes` on a
// card is the whole of the work — the Format Designer and the quick-setup
// validator both read it with no further wiring, which is the point.
import { describe, expect, it } from 'vitest';
import { TWIST_CATALOG, SEASON_MODES, activeSeasonModes, twistModeClashes } from '../js/core.js';

const card = id => TWIST_CATALOG.find(t => t.id === id);

describe('season modes as a twist compatibility axis', () => {
  it('reads which modes a season has switched on', () => {
    expect([...activeSeasonModes({ bbSafetyMode: 'off', bbHaveNots: 'twist' })]).toEqual([]);
    expect([...activeSeasonModes({ bbSafetyMode: 'block-buster' })]).toContain('block-buster');
    expect([...activeSeasonModes({ bbHaveNots: 'every-week' })]).toContain('have-nots-every-week');
  });

  it('the Battle of the Block declares the clash the engine already enforces', () => {
    const botb = card('bb-battle-of-the-block');
    expect(botb, 'the twist is not in the catalog').toBeTruthy();
    expect(botb.incompatibleModes, 'the clash is not declared').toContain('block-buster');

    // Named, so the warning can be read by a person.
    const clashes = twistModeClashes(botb, { bbSafetyMode: 'block-buster' });
    expect(clashes).toEqual(['the Block Buster']);
    expect(twistModeClashes(botb, { bbSafetyMode: 'off' })).toEqual([]);
  });

  it('says nothing about twists that have no mode clash', () => {
    for (const id of ['bb-diamond-veto', 'bb-pandoras-box', 'bb-battle-back']) {
      expect(twistModeClashes(card(id), { bbSafetyMode: 'block-buster' }), `${id} flagged`).toEqual([]);
    }
  });

  it('every declared mode actually exists', () => {
    // A typo in `incompatibleModes` would silently never fire, which is the
    // exact failure this whole mechanism was built to stop.
    const unknown = [];
    for (const t of TWIST_CATALOG) {
      for (const mode of t.incompatibleModes || []) {
        if (!SEASON_MODES[mode]) unknown.push(`${t.id} -> ${mode}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it('every mode can be evaluated against an empty config without throwing', () => {
    expect(() => activeSeasonModes({})).not.toThrow();
    expect(() => activeSeasonModes(undefined)).not.toThrow();
  });
});
