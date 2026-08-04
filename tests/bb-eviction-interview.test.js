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

function seeded(seed) {
  let x = seed >>> 0;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
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
    expect(interview.parting.length).toBeGreaterThan(20);
  });

  it('falls back to the balanced host style for unknown saved values', () => {
    seasonConfig.bbHostStyle = 'retired-style';
    const interview = generateBBEvictionInterview({ eliminated: 'Vera' }, weekFor(), () => 0.3);
    expect(interview.hostStyle).toBe('balanced');
    expect(interview.hostProfile).toBe(BB_HOST_STYLES.balanced);
  });

  it('changes the substance of answers for opposite stats within one archetype', () => {
    const corpusForLoyalty = loyalty => {
      seedGame([
        { name: 'Vera', archetype: 'floater', stats: {
          physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5,
          loyalty, boldness: 5, intuition: 5, temperament: 5,
        } },
        { name: 'Ari', archetype: 'floater' },
        { name: 'Bo', archetype: 'floater' },
        { name: 'Cy', archetype: 'floater' },
      ], { namedAlliances: [{ name: 'Final Four', members: ['Vera', 'Ari'], dissolved: false }] });
      const week = weekFor();
      return Array.from({ length: 40 }, (_, i) =>
        generateBBEvictionInterview({ eliminated: 'Vera' }, week, seeded(i + 1)))
        .flatMap(iv => iv.questions.map(q => q.a)).join(' ');
    };

    const loyal = corpusForLoyalty(9);
    const disloyal = corpusForLoyalty(2);
    expect(loyal).toMatch(/gave them my word|promised to protect|would've kept Ari/i);
    expect(disloyal).toMatch(/changed sides|deal I needed|would've voted (him|her|them) out/i);
    expect(loyal).not.toBe(disloyal);
  });
});
