import { beforeEach, describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { ACCESS_PROFILES, availableLocations, buildCampAccessSchedule, campKnowledgeContacts, currentCampAccessEpisode, findConversationAccess, locationIsOpen } from '../js/camp-access.js';
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

  it('limits knowledge contacts to people who physically shared a window', () => {
    gs._campAccessThisEp = { setting:'survival-island', phases:{
      'post:merge': [{ id:'scramble', assignments:[
        { locationId:'beach', players:['Alice', 'Bob'] },
        { locationId:'jungle-trail', players:['Carol', 'Dana'] },
      ] }],
    } };
    gs.namedAlliances = [{ name:'AB', active:true, members:['Alice', 'Bob', 'Carol'] }];
    const contacts = campKnowledgeContacts('Alice', 'post');
    expect(contacts.allies).toEqual(['Bob']);
    expect(contacts.others).not.toContain('Carol');
    expect(contacts.others).not.toContain('Dana');
  });

  it('never seats more players in a location than its capacity', () => {
    seedGame(Array.from({ length: 14 }, (_, i) => `P${i + 1}`));
    seasonConfig.setting = 'hosted-camp';
    gs.isMerged = true;
    const ep = { num: 5 };
    buildCampAccessSchedule(ep, 'post', () => 0.4);
    const caps = new Map(ACCESS_PROFILES['hosted-camp'].map(l => [l.id, l.capacity]));
    Object.values(ep.campAccess.phases).forEach(windows => windows.forEach(w => w.assignments.forEach(a => {
      expect(a.players.length).toBeLessThanOrEqual(caps.get(a.locationId));
    })));
  });

  it('spreads a downtime window across multiple real locations', () => {
    seedGame(Array.from({ length: 9 }, (_, i) => `P${i + 1}`));
    seasonConfig.setting = 'survival-island';
    gs.isMerged = true;
    const ep = { num: 5 };
    buildCampAccessSchedule(ep, 'post', () => 0.5);
    const scramble = ep.campAccess.phases[`post:${gs.mergeName || 'merge'}`].find(w => w.privacyNeed === 'mixed');
    expect(scramble.assignments.length).toBeGreaterThan(1);   // not everyone piled into one spot
  });

  it('falls back to reachable when the requested phase was never scheduled', () => {
    seasonConfig.setting = 'survival-island';
    gs.isMerged = true;
    const ep = { num: 5 };
    buildCampAccessSchedule(ep, 'pre', () => 0.3);            // only the pre schedule exists
    const access = findConversationAccess(ep, 'Alice', 'Bob', { phase: 'post', privacy: 0.45 });
    expect(access.possible).toBe(true);
    expect(access.reason).toBe('no-phase-schedule');
  });

  it('prefers a genuine private spot over stepping aside in the open', () => {
    seasonConfig.setting = 'survival-island';
    gs.isMerged = true;
    const ep = { num: 5, campAccess: { setting: 'survival-island', groups: {}, phases: {
      'post:merge': [{ id: 'scramble', label: 'Scramble', privacyNeed: 'mixed', assignments: [
        { locationId: 'campfire', players: ['Alice', 'Bob', 'Carol', 'Dana'] },  // public, low privacy
        { locationId: 'jungle-trail', players: ['Alice', 'Bob'] },               // real private spot
      ] }],
    } } };
    const access = findConversationAccess(ep, 'Alice', 'Bob', { phase: 'post', privacy: 0.45 });
    expect(access.locationId).toBe('jungle-trail');
    expect(access.pullAside).toBe(false);
  });

  it('ignores a schedule left over from an earlier episode', () => {
    gs.episode = 8;
    gs._campAccessThisEp = { setting: 'survival-island', epNum: 3, phases: {
      'post:merge': [{ id: 'scramble', assignments: [{ locationId: 'beach', players: ['Alice', 'Bob'] }] }],
    } };
    expect(currentCampAccessEpisode()).toBeNull();
    expect(campKnowledgeContacts('Alice', 'post').others).not.toContain('Bob');
    gs._campAccessThisEp.epNum = 8;                            // stamped for the current episode
    expect(currentCampAccessEpisode()).not.toBeNull();
  });
});
