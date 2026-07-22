import { describe, it, expect } from 'vitest';
import { franchiseLedger, setFranchiseLedger, META_WEIGHTS } from '../js/franchise-meta.js';

describe('franchise-meta skeleton', () => {
  it('exposes an empty ledger and weights', () => {
    expect(franchiseLedger).toEqual({ seasons: {} });
    expect(META_WEIGHTS.repThreatFactor).toBeGreaterThan(0);
  });
  it('setFranchiseLedger replaces the ledger', () => {
    setFranchiseLedger({ seasons: { '10': { seasonName: 'X', players: {} } } });
    expect(franchiseLedger.seasons['10'].seasonName).toBe('X');
    setFranchiseLedger({ seasons: {} });
  });
});
