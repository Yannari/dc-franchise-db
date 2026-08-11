// "I made a pre-alliance but don't see it in the VP."
//
// The engine was fine — a pre-game alliance set before initGameState survives
// the whole season and shows up in the blocs and the alliance board. The hole
// was in front of it: initGameState copies preGameAlliances into the game, and
// it runs ONCE, only when there is no game state at all. Open the Run tab,
// then add an alliance, and it went to local storage and stopped there. It was
// not in the season, so it was not in the viewing party, and nothing said so.
//
// The other silent failure: an alliance naming somebody who is not in the cast
// was dropped whole, with no warning. Rename one houseguest and a three-person
// alliance stops existing.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs,
  setPreGameAlliances } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState, applyPreAlliances, buildPreAlliances } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { listBlocs } from '../js/bb/blocs.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee',
  'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
  'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead',
  'wildcard', 'chaos-agent', 'perceptive-player'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

const FOUNDERS = { id: 'x1', name: 'The Founders',
  members: ['Bowie', 'Chase', 'Ripper'], permanence: 'permanent' };

function cast() {
  setGs(null);
  setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(),
    gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
    stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3) % 10)])) })));
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats,
    pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
  seasonConfig.twistSchedule = [];
}

beforeEach(() => { setPreGameAlliances([]); cast(); });

describe('a pre-game alliance set before the season starts', () => {
  it('is in the game the moment it begins', () => {
    setPreGameAlliances([FOUNDERS]);
    initGameState();
    globalThis.gs = gs;
    const found = (gs.namedAlliances || []).find(a => a.name === 'The Founders');
    expect(found, 'it never reached gs.namedAlliances').toBeTruthy();
    expect(found.members).toEqual(['Bowie', 'Chase', 'Ripper']);
    expect(found.preGame).toBe(true);
  });

  it('survives the season and reaches the screens', () => {
    setPreGameAlliances([FOUNDERS]);
    initGameState();
    globalThis.gs = gs;
    withSeededRandom(11, () => { for (let i = 0; i < 2; i++) simulateBBEpisode(); });
    expect((gs.namedAlliances || []).some(a => a.name === 'The Founders')).toBe(true);
    // The blocs are what the house status screen and the alliance board draw.
    expect(listBlocs().map(b => b.label)).toContain('The Founders');
  });
});

describe('one added after the Run tab has been opened', () => {
  it('reaches a season that exists but has not played a week', () => {
    // The exact reported case. gs already exists, so initGameState will never
    // run again, and nothing else was copying them across.
    initGameState();
    globalThis.gs = gs;
    expect((gs.namedAlliances || []).some(a => a.name === 'The Founders')).toBe(false);

    setPreGameAlliances([FOUNDERS]);
    const res = applyPreAlliances();
    expect(res.applied).toBe(1);
    expect(res.started).toBe(false);
    expect((gs.namedAlliances || []).some(a => a.name === 'The Founders')).toBe(true);
  });

  it('does not back-date itself into a season already in progress', () => {
    initGameState();
    globalThis.gs = gs;
    withSeededRandom(11, () => simulateBBEpisode());
    setPreGameAlliances([FOUNDERS]);
    const res = applyPreAlliances();
    expect(res.started, 'it rewrote a week that had already been played').toBe(true);
    expect(res.applied).toBe(0);
    expect((gs.namedAlliances || []).some(a => a.name === 'The Founders')).toBe(false);
  });

  it('leaves alliances the house formed on its own alone', () => {
    initGameState();
    globalThis.gs = gs;
    gs.namedAlliances = [{ id: 'live1', name: 'The Real One',
      members: ['Jo', 'Dawn'], active: true }];
    setPreGameAlliances([FOUNDERS]);
    applyPreAlliances();
    const names = (gs.namedAlliances || []).map(a => a.name);
    expect(names).toContain('The Real One');
    expect(names).toContain('The Founders');
  });

  it('does not duplicate itself when applied twice', () => {
    initGameState();
    globalThis.gs = gs;
    setPreGameAlliances([FOUNDERS]);
    applyPreAlliances();
    applyPreAlliances();
    expect((gs.namedAlliances || []).filter(a => a.name === 'The Founders')).toHaveLength(1);
  });
});

describe('an alliance naming somebody who is not in the cast', () => {
  it('is reported rather than dropped in silence', () => {
    setPreGameAlliances([{ id: 'x2', name: 'The Ghosts',
      members: ['Bowie', 'Someone Who Left'], permanence: 'normal' }]);
    const built = buildPreAlliances();
    expect(built).toHaveLength(0);
    expect(buildPreAlliances.dropped).toEqual([
      { name: 'The Ghosts', missing: ['Someone Who Left'] },
    ]);
  });

  it('does not take the valid ones down with it', () => {
    setPreGameAlliances([
      { id: 'x2', name: 'The Ghosts', members: ['Bowie', 'Nobody'], permanence: 'normal' },
      FOUNDERS,
    ]);
    expect(buildPreAlliances().map(a => a.name)).toEqual(['The Founders']);
  });
});
