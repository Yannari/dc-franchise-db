// @vitest-environment jsdom
//
// A coach is at camp. That sounds too obvious to test, and it is exactly what
// shipped broken: coaches were excluded from `gs.activePlayers` (correct — they
// never compete or vote) AND from `tribe.members` (wrong — that array doubles
// as "who is physically here"). Every camp screen read the second array, so a
// coach appeared in none of the 110 camp event types, none of the relationship
// summaries, and none of the prose the season generated about their own tribe.
//
// These tests pin the split: eligibility keeps excluding coaches, presence
// does not.
import { describe, expect, it, beforeEach } from 'vitest';
import * as core from '../js/core.js';
import { campRoster, coachVoteReason, addCoach } from '../js/coaches.js';
import { runHeadlessSeason } from './helpers/coach-season.js';

beforeEach(() => {
  core.setGs({ ...core.gs, coaches: [], coachTraining: {}, bonds: {}, tribes: [] });
});

describe('campRoster separates presence from eligibility', () => {
  it('adds the tribe’s coaches to the contestant list', () => {
    core.gs.tribes = [{ name: 'Moto', members: ['A', 'B'] }];
    addCoach({ name: 'Bowie', tribe: 'Moto' });
    expect(campRoster('Moto', ['A', 'B'])).toEqual(['A', 'B', 'Bowie']);
  });

  it('never adds a coach twice, even if one is already in the list', () => {
    core.gs.tribes = [{ name: 'Moto', members: ['A', 'Bowie'] }];
    addCoach({ name: 'Bowie', tribe: 'Moto' });
    expect(campRoster('Moto', ['A', 'Bowie'])).toEqual(['A', 'Bowie']);
  });

  it('leaves another tribe’s coach out', () => {
    core.gs.tribes = [{ name: 'Moto', members: ['A'] }, { name: 'Ravu', members: ['B'] }];
    addCoach({ name: 'Bowie', tribe: 'Ravu' });
    expect(campRoster('Moto', ['A'])).toEqual(['A']);
  });

  it('falls back to gs.tribes when no member list is passed', () => {
    core.gs.tribes = [{ name: 'Moto', members: ['A', 'B'] }];
    addCoach({ name: 'Bowie', tribe: 'Moto' });
    expect(campRoster('Moto')).toEqual(['A', 'B', 'Bowie']);
  });
});

describe('coachVoteReason explains the vote in the coach’s own vocabulary', () => {
  it('leads with favouritism when the voter was never trained', () => {
    addCoach({ name: 'Bowie', tribe: 'Moto' });
    core.gs.coachTraining = { Bowie: { A: { social: 1 } } };
    const r = coachVoteReason('Bowie', 'B');
    expect(r).toBeTruthy();
    expect(r.toLowerCase()).toContain('coach');
    expect(r).toContain('B');
  });

  it('always names the coach as a coach, whichever driver wins', () => {
    addCoach({ name: 'Bowie', tribe: 'Moto', stars: 5 });
    // No training at all — falls through to the cheap-cut reason.
    expect(coachVoteReason('Bowie', 'B').toLowerCase()).toContain('coach');
  });

  it('returns null for somebody who is not a coach', () => {
    expect(coachVoteReason('Nobody', 'B')).toBe(null);
  });

  it('is deterministic, so a replay quotes what the transcript quoted', () => {
    addCoach({ name: 'Bowie', tribe: 'Moto' });
    core.gs.coachTraining = { Bowie: { A: { social: 1 } } };
    expect(coachVoteReason('Bowie', 'B')).toBe(coachVoteReason('Bowie', 'B'));
  });
});

describe('a coach is visible in a real season', () => {
  it('appears in ordinary camp events, not only coach-specific ones', async () => {
    const { episodes, coachNames } = await runHeadlessSeason({
      twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
    });
    const generic = [];
    for (const e of episodes) {
      for (const phases of Object.values(e.ep.campEvents || {})) {
        for (const phase of ['pre', 'post']) {
          for (const ev of (phases?.[phase] || [])) {
            if (!/^coach/.test(ev.type) && (ev.players || []).some(n => coachNames.includes(n))) {
              generic.push(ev.type);
            }
          }
        }
      }
    }
    expect(generic.length, 'a coach never turned up in a single ordinary camp event').toBeGreaterThan(0);
    expect(new Set(generic).size, 'a coach should reach a variety of event types').toBeGreaterThan(1);
  }, 240000);

  it('gets at most one passed-over notice per episode, naming every coach who skipped them', async () => {
    const { episodes } = await runHeadlessSeason({
      twist: 'coaches', coachesPerTribe: 2, castSize: 16, mergeAt: 10,
    });
    for (const e of episodes) {
      const seen = new Set();
      for (const phases of Object.values(e.ep.campEvents || {})) {
        for (const phase of ['pre', 'post']) {
          for (const ev of (phases?.[phase] || [])) {
            if (ev.type !== 'coachPassedOverNotices') continue;
            const contestant = ev.players[0];
            expect(seen.has(contestant),
              `${contestant} got two passed-over notices in episode ${e.num} — one per coach is the doubling that made the board unreadable`).toBe(false);
            seen.add(contestant);
          }
        }
      }
    }
  }, 240000);
});
