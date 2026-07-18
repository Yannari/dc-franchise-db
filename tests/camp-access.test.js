import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { ACCESS_PROFILES, availableLocations, buildCampAccessSchedule, findConversationAccess, locationIsOpen } from '../js/camp-access.js';
import { seedGame } from './helpers/setup.js';

describe('venue-aware camp access', () => {
  beforeEach(() => seedGame(['Alice', 'Bob', 'Carol', 'Dana']));

  it('uses Stawaki-safe everyday locations and never invents generic carnival facilities', () => {
    seasonConfig.setting = 'carnival';
    const locations = availableLocations({ num:2 });
    const ids = locations.map(l => l.id);
    const labels = locations.map(l => l.label.toLowerCase()).join(' ');
    expect(ids).toContain('campsite');
    expect(ids).toContain('midway');
    expect(labels).not.toMatch(/kitchen|water well|soda fountain|funhouse/);
    expect(ids).not.toContain('haunted-mansion');
  });

  it('opens a canon attraction only when its episode explicitly does so', () => {
    seasonConfig.setting = 'carnival';
    expect(availableLocations({}).some(l => l.id === 'haunted-mansion')).toBe(false);
    expect(availableLocations({ isHauntedHouse:true }).some(l => l.id === 'haunted-mansion')).toBe(true);
  });

  it('keeps franchise profiles separate', () => {
    seasonConfig.setting = 'world-tour';
    const ids = availableLocations({}).map(l => l.id);
    expect(ids).toContain('economy');
    expect(ids).not.toContain('midway');
    expect(ids).not.toContain('water-source');
  });

  it('builds windows and returns concrete access rather than assuming everyone can talk privately', () => {
    seasonConfig.setting = 'survival-island';
    gs.isMerged = true;
    const ep = { num:5 };
    buildCampAccessSchedule(ep, 'post', () => 0.25);
    const access = findConversationAccess(ep, 'Alice', 'Bob', { phase:'post', privacy:0.6 });
    expect(access.possible).toBe(true);
    expect(access.location).toBeTruthy();
    expect(access.windowLabel).toBeTruthy();
    expect(Array.isArray(access.nearby)).toBe(true);
  });

  it('does not open restricted locations without the matching context', () => {
    seasonConfig.setting = 'world-tour';
    const cargo = ACCESS_PROFILES['world-tour'].find(l => l.id === 'cargo-hold');
    expect(locationIsOpen(cargo, {}, {})).toBe(false);
    expect(locationIsOpen(cargo, {}, { allowRestricted:true })).toBe(true);
  });
});
