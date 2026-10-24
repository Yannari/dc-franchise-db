// ChatAlumni seats a show's own alumni first (user, 2026-10-24: "chatalumni
// should always prioritize alumni from their respective show ... cross alumni
// intershow its just in case we dont have enough alumni").
import { describe, expect, it } from 'vitest';
import { seasonPanel, episodeSpeakers, PANEL_FILL } from '../js/social/hosts.js';

const host = (name, native, fameScore) => ({ name, slug: name.toLowerCase(), native, fameScore, lastSeason: 1, wins: 0, expertise: [], shows: [] });

describe('the alumni room', () => {
  it('seats every alumnus of the show before a far more famous visitor', () => {
    const hosts = [host('Star', false, 99), ...Array.from({ length: 9 }, (_, i) => host(`Home${i}`, true, 5 + i))];
    const panel = seasonPanel(hosts, { size: 12 });
    expect(panel.every(h => h.native)).toBe(true);
    expect(panel).toHaveLength(9);
  });
  it('brings visitors in only to make up a room that can talk', () => {
    const hosts = [host('Star', false, 99), host('Other', false, 50), host('Third', false, 40), ...Array.from({ length: 5 }, (_, i) => host(`Home${i}`, true, 5))];
    const panel = seasonPanel(hosts, { size: 12 });
    expect(panel.slice(0, 5).every(h => h.native)).toBe(true);
    expect(panel).toHaveLength(PANEL_FILL);
    expect(panel.slice(5).map(h => h.name)).toEqual(['Star', 'Other']);
  });
  it('a new show with no alumni still gets a room', () => {
    const hosts = Array.from({ length: 10 }, (_, i) => host(`Visitor${i}`, false, 10 - i));
    expect(seasonPanel(hosts, { size: 12 })).toHaveLength(PANEL_FILL);
  });
  it('lets the show\'s own alumni speak first on the night', () => {
    const panel = [host('Visitor', false, 99), ...Array.from({ length: 6 }, (_, i) => host(`Home${i}`, true, 1))];
    const speakers = episodeSpeakers(panel, [{ kind: 'eviction' }], { episode: 3 });
    expect(speakers.slice(0, 2).every(h => h.native)).toBe(true);
  });
});
