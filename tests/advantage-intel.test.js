import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { allianceIdolRead, assessIdolExposure, idolIntelFor, pruneIdolIntel, recordIdolIntel } from '../js/advantage-intel.js';
import { seedGame } from './helpers/setup.js';

describe('player-specific advantage intelligence', () => {
  beforeEach(() => {
    seedGame([{ name:'A', stats:{ strategic:8, intuition:8 } }, { name:'B' }, { name:'C' }, { name:'Holder' }], { episode:5 });
    gs.advantages = [{ holder:'Holder', type:'idol', foundEp:5 }];
    gs.advantageIntel = {};
    gs.knownIdolHoldersThisEp = new Set();
    gs.knownIdolHoldersPersistent = new Set();
  });

  it('keeps private idol knowledge inside the informed group', () => {
    recordIdolIntel('A', 'Holder', { source:'snooping', confidence:0.95, truth:'confirmed' });
    expect(allianceIdolRead('Holder', ['A','B'])).toMatchObject({ confirmed:true, confirmedBy:['A'] });
    expect(allianceIdolRead('Holder', ['B','C'])).toMatchObject({ confirmed:false, suspected:false });
  });

  it('decays old rumors below actionable confidence', () => {
    recordIdolIntel('A', 'Holder', { source:'rumor', confidence:0.6, truth:'unknown', ep:1 });
    expect(idolIntelFor('Holder', ['A'])[0].effectiveConfidence).toBeLessThan(0.55);
    expect(allianceIdolRead('Holder', ['A']).suspected).toBe(false);
  });

  it('removes stale intel after the idol leaves play', () => {
    recordIdolIntel('A', 'Holder', { confidence:1, truth:'confirmed' });
    gs.advantages = [];
    pruneIdolIntel();
    expect(gs.advantageIntel['idol:Holder']).toBeUndefined();
  });

  it('lets a holder notice a strong private exposure signal', () => {
    recordIdolIntel('A', 'Holder', { confidence:1, truth:'confirmed' });
    recordIdolIntel('B', 'Holder', { confidence:.9, truth:'confirmed' });
    const read = assessIdolExposure('Holder', ['A','B','C','Holder'], () => 0);
    expect(read.notices).toBe(true);
    expect(read.informedPlayers).toEqual(['A','B']);
  });

  it('allows paranoia to create a false exposure read', () => {
    gs.playerStates = { Holder:{ emotional:'paranoid' } };
    const read = assessIdolExposure('Holder', ['A','B','Holder'], () => 0);
    expect(read).toMatchObject({ notices:true, falseAlarm:true, mode:'panic' });
  });
});
