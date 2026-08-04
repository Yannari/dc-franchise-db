import { beforeEach, describe, expect, it } from 'vitest';
import { defaultConfig, seasonConfig } from '../js/core.js';
import { BB_HOST_STYLES, generateBBEvictionInterview } from '../js/bb-aftermath.js';
import { seedGame } from './helpers/setup.js';

function weekFor(evictee = 'Vera') {
  const voters = ['Ari', 'Bo', 'Cy'];
  return {
    num: 4,
    houseAtStart: [evictee, ...voters],
    hoh: 'Ari',
    votes: { [evictee]: 3, Bo: 0 },
    ballots: voters.map(voter => ({ voter, evict: evictee, changed: false, lied: false })),
    acts: [],
    voteOperation: { plans: [{ target: evictee, organizer: 'Ari', alliance: 'The Three', expected: 3, majority: 2 }] },
  };
}

describe('Big Brother eviction interview personalities', () => {
  beforeEach(() => {
    Object.assign(seasonConfig, defaultConfig(), {
      format: 'big-brother', bbEvictionInterview: 'enabled', host: 'Mara',
      bbHostStyle: 'balanced', jurySize: 7,
    });
    seedGame([
      { name: 'Vera', archetype: 'villain', stats: { temperament: 3, strategic: 8, social: 6 } },
      { name: 'Ari', archetype: 'mastermind' },
      { name: 'Bo', archetype: 'hero' },
      { name: 'Cy', archetype: 'floater' },
    ]);
  });

  it('uses a focused host profile rather than contestant stats', () => {
    expect(Object.keys(BB_HOST_STYLES)).toEqual(['balanced', 'warm', 'incisive', 'playful']);
    for (const profile of Object.values(BB_HOST_STYLES)) {
      expect(Object.keys(profile).sort()).toEqual(['humour', 'label', 'pressure', 'warmth']);
      expect(profile).not.toHaveProperty('physical');
      expect(profile).not.toHaveProperty('strategic');
    }
  });

  it('changes the interviewer voice while preserving the customized name', () => {
    const ep = { eliminated: 'Vera' };
    seasonConfig.bbHostStyle = 'warm';
    const warm = generateBBEvictionInterview(ep, weekFor(), () => 0.1);
    seasonConfig.bbHostStyle = 'incisive';
    const incisive = generateBBEvictionInterview(ep, weekFor(), () => 0.1);

    expect(warm.host).toBe('Mara');
    expect(incisive.host).toBe('Mara');
    expect(warm.hostStyle).toBe('warm');
    expect(incisive.hostStyle).toBe('incisive');
    expect(warm.questions[0].q).not.toBe(incisive.questions[0].q);
    expect(warm.hostLines.truth).not.toBe(incisive.hostLines.truth);
  });

  it('gives the evictee an archetype-driven voice and a fuller interview', () => {
    const interview = generateBBEvictionInterview({ eliminated: 'Vera' }, weekFor(), () => 0.2);
    expect(interview.evicteeVoice).toBe('defiant');
    expect(interview.questions.length).toBeGreaterThanOrEqual(4);
    expect(interview.questions.some(q => q.personality === 'defiant')).toBe(true);
    expect(interview.parting).toMatch(/jury|last word|house|peace|quiet/i);
  });

  it('falls back to the balanced host style for unknown saved values', () => {
    seasonConfig.bbHostStyle = 'retired-style';
    const interview = generateBBEvictionInterview({ eliminated: 'Vera' }, weekFor(), () => 0.3);
    expect(interview.hostStyle).toBe('balanced');
    expect(interview.hostProfile).toBe(BB_HOST_STYLES.balanced);
  });
});
