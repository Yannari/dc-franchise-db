// How fast a relationship can move.
//
// A stretch of house life runs twenty to thirty beats, so a pair that keeps
// coming up can accumulate the entire scale in one morning. A measured week
// one had two strangers reach +10.0 — inseparable — before the first
// competition, on a screen headed "opening positions". No relationship moves
// at that pace, and it made the panel read as nonsense beside the events that
// supposedly caused it.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks',
  'Emmah','Millie','Caleb','Wayne','Raj','Julia','Priya','MK','Damien'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind','hero','floater','villain','schemer','goat','hothead'][i % 7] }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 9, twistSchedule: [],
    bbSafetyMode: 'off', bbHaveNots: 'every-week', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
}

describe('relationships move at a plausible pace', () => {
  it('nobody becomes inseparable in a single stretch of week one', () => {
    reset();
    const ep = simulateBBEpisode();
    const opening = ep.openingState?.bonds || {};
    const firstStretch = (ep.acts || []).find(a => a.type === 'house')?.state?.bonds || {};
    for (const [key, value] of Object.entries(firstStretch)) {
      const jump = Math.abs((Number(value) || 0) - (Number(opening[key]) || 0));
      expect(jump, `${key.replace('||', ' & ')} moved ${jump.toFixed(1)} in one stretch`)
        .toBeLessThanOrEqual(2.6);
    }
  });

  it('still lets a real bond build across a season', () => {
    reset();
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 12) { if (!simulateBBEpisode()) break; }
    const top = Math.max(0, ...Object.values(gs.bonds || {}).map(v => Math.abs(Number(v) || 0)));
    // Capped per stretch, not per season: people should still end up close.
    expect(top, 'the cap flattened the whole season').toBeGreaterThan(5);
  });
});

describe('the transcript carries the week', () => {
  it('writes every beat the episode produced', () => {
    reset();
    const ep = simulateBBEpisode();
    const beats = (ep.acts || []).reduce((n, a) => n + (a.socialBeats || []).length, 0);
    const text = generateBBSummaryText(ep);
    const written = (text.match(/^\s+\[[A-Z]/gm) || []).length;
    expect(beats).toBeGreaterThan(40);
    // Allow a small margin for beats whose badge is not upper-case.
    expect(written, `${beats} beats produced, ${written} written`).toBeGreaterThanOrEqual(beats - 5);
  });

  it('explains the vote as well as reporting it', () => {
    reset();
    let ep = null;
    for (let i = 0; i < 2; i++) ep = simulateBBEpisode();
    const text = generateBBSummaryText(ep);
    expect(text).toMatch(/The numbers: \d+ of \d+ decides it\./);
    expect(text).toContain('LIVE EVICTION');
    // The screen and the transcript should not be two different accounts.
    expect(text).toMatch(/How the plans changed:|promised .* and cast it|went with .* onto/);
  });
});
