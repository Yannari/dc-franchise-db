// A Secret Story season, chosen as its own show (no Big Brother theme picked),
// plays to a winner on the house engine and exports as ss-1.
// Spec: docs/superpowers/specs/2026-10-27-secret-story-show-design.md
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale, isBigBrotherSeason } from '../js/bb-run.js';
import { currentTheme } from '../js/bb/themes.js';
import { buildBigBrotherSeasonDocument } from '../js/stats-export.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater'][i % 6] }));

function play(seed = 7) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '',
    twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined });
  withSeededRandom(seed, () => {
    let n = 0;
    while ((gs.activePlayers || []).length > 3 && n < 20) { if (!simulateBBEpisode()) break; n++; }
    runBBFinale();
  });
}

describe('a Secret Story season', () => {
  play();

  it('runs on the house engine and wears its own descriptor', () => {
    expect(isBigBrotherSeason()).toBe(true);
    expect(currentTheme()?.id).toBe('secret-story');
  });

  it('plays the hunt and lets the public crown the winner', () => {
    expect(gs.bb.secretStory?.secrets?.length).toBeGreaterThan(0);
    expect(gs.bb.finale?.winner).toBeTruthy();
    expect(gs.bb.finale?.jury).toEqual([]);
  });

  it('exports as ss-1 with every housemate\'s hunt', () => {
    const doc = buildBigBrotherSeasonDocument(1);
    expect(doc.format).toBe('secret-story');
    expect(doc.seasonId).toBe('ss-1');
    expect(doc.jurySize).toBe(0);
    expect(doc.secrets.length).toBe(gs.bb.secretStory.secrets.length);
    for (const p of doc.placements) expect(p.ss, p.name).toBeTruthy();
    expect(doc.finalVote.length).toBeGreaterThan(1);
    expect(doc.winner.vote).toMatch(/%/);
  });
});

describe('night one, cast from the screen', () => {
  it('gives every housemate a personal secret from the pool when nobody chose', () => {
    play(8);
    const s = gs.bb.secretStory;
    expect(s.secrets.every(x => x.kind === 'personal' && x.source === 'pool')).toBe(true);
    expect(s.secrets.flatMap(x => x.holders).sort()).toEqual([...NAMES].sort());
    expect(new Set(s.secrets.map(x => x.poolId)).size).toBe(s.secrets.length);
    expect(['gendered', 'mixed']).toContain(s.rule);
    expect(Array.isArray(s.recognitions)).toBe(true);
    expect(['loft', 'chalet', 'campus', 'arena', 'crystal', 'labyrinth']).toContain(s.houseTheme);
  });

  it('keeps what the cast screen chose, a shared real tie included', () => {
    seasonConfig.ssSecrets = {
      Bowie: { source: 'own', kind: 'job', text: 'I trained dolphins', clues: ['a whistle'], tells: ['claps like a seal'], difficulty: 0.5 },
      Chase: { source: 'history', kind: 'family', text: 'We are brother and sister', pair: 'Ripper', clues: ['x'], tells: ['y'], difficulty: 0.5 },
    };
    seasonConfig.ssNominations = 'mixed';
    const keep = seasonConfig.ssSecrets;
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', ssSecrets: keep, ssNominations: 'mixed' });
    withSeededRandom(2, () => { simulateBBEpisode(); });
    const s = gs.bb.secretStory;
    expect(s.secrets.find(x => x.holders.includes('Bowie'))).toMatchObject({ text: 'I trained dolphins', source: 'own' });
    expect(s.secrets.find(x => x.holders.includes('Chase'))).toMatchObject({ holders: ['Chase', 'Ripper'], kind: 'real-pair' });
    expect(s.rule).toBe('mixed');
    delete seasonConfig.ssSecrets; delete seasonConfig.ssNominations;
  });
});
