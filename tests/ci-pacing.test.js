// ci-pacing.test.js — the rhythm of a season, like the show (user, 2026-09-30:
// "an elimination one episode, a rating a different episode"). US 1: 12
// episodes, 8 blockings; US 2: 13 episodes, 7. The ratings END an episode
// ("the top two will become Influencers…"); the Hangout, the blocking, the
// visit and the goodbye video OPEN the next one. An instant block is the
// exception: the lowest-rated is blocked on the spot (US 1 Ep 9).
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { rosterCast, circleSetup } from './helpers/ci-cast.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

function season(seed, options = {}) {
  const cast = rosterCast(13, seed); setPlayers(cast);
  const names = cast.map(p => p.name);
  return playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed, options });
}
const kinds = row => row.ci.aired.map(a => a.kind);
const BLOCKING = ['hangout', 'blocking', 'save', 'plead', 'vote', 'statement', 'antivirus', 'no-block'];

describe('the ratings end one episode, the blocking opens the next', () => {
  for (const seed of [1, 2, 3]) {
    it(`season ${seed}`, () => {
      const { rows, state } = season(seed);
      const nights = state.schedule.filter(d => d.block && d.night?.format !== 'instant');
      expect(nights.length).toBeGreaterThan(4);
      for (const d of nights) {
        const row = rows[d.day - 1], next = rows[d.day];
        // the ratings close the episode: nothing after them but their results
        const k = kinds(row);
        expect(k, `day ${d.day}`).toContain('ratings');
        const after = k.slice(k.lastIndexOf('ratings') + 1);
        expect(after.filter(x => BLOCKING.includes(x)), `day ${d.day} after ratings`).toEqual([]);
        // its own blocking is not in it: an exit here belongs to yesterday's night
        if (!state.schedule[d.day - 2]?.block) expect(row.exits.filter(e => e.channel !== 'clone'), `day ${d.day} exits`).toEqual([]);
        // the next episode opens with that night: its Hangout or blocking comes before any private chat
        const nk = kinds(next);
        const firstBlock = nk.findIndex(x => BLOCKING.includes(x));
        const firstChat = nk.indexOf('chat');
        expect(firstBlock, `day ${d.day + 1}`).toBeGreaterThanOrEqual(0);
        if (firstChat >= 0) expect(firstBlock).toBeLessThan(firstChat);
      }
    });
  }

  it('the goodbye video plays in the episode of the blocking, after the visit', () => {
    const { rows } = season(2);
    for (const row of rows) {
      const k = kinds(row);
      if (!row.exits.length || !k.includes('visit')) continue;
      expect(k.indexOf('goodbye'), `day ${row.day}`).toBeGreaterThan(k.indexOf('visit'));
    }
  });

  it('the season still blocks everybody it has to, and ends with five', () => {
    for (const seed of [1, 2, 3]) {
      const { state } = season(seed);
      expect(state.active).toHaveLength(5);
    }
  });

  it('an instant block happens on the spot, in the ratings episode', () => {
    const { rows, state } = season(4, { bookings: { rating4: 'ci-instant-block' } });
    const d = state.schedule.find(x => x.slot === 'rating4');
    if (d?.night?.format !== 'instant') return;   // the booking fell back
    expect(rows[d.day - 1].exits.length).toBeGreaterThan(0);
  });
});

describe('the rhythm is not the same every season', () => {
  it('ratings nights land on different days across seasons, and some seasons have a quiet episode (US 2: 3, 5, 9)', () => {
    const shapes = new Set();
    let quietSeasons = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const { state } = season(seed);
      shapes.add(state.schedule.filter(d => d.block).map(d => d.day).join(','));
      const quiet = state.schedule.filter((d, i) => !d.block && !d.final && !d.finale && !state.schedule[i - 1]?.block && d.day > 1);
      if (quiet.length) quietSeasons++;
    }
    expect(shapes.size).toBeGreaterThan(2);
    expect(quietSeasons).toBeGreaterThan(0);
    expect(quietSeasons).toBeLessThan(8);   // US 1 had none
  });
});

describe('the host opens the episode on the cliffhanger, and says good morning after the night', () => {
  const NIGHT = ['hangout', 'blocking', 'save', 'plead', 'vote', 'offer', 'visit', 'antivirus', 'no-block'];
  it('a day that opens on last night: host.cold.night first; the morning cold comes after the night, never before a blocking', () => {
    for (const seed of [1, 2, 3]) {
      const { rows } = season(seed);
      for (const row of rows.slice(1)) {
        const aired = row.ci.aired;
        if (!NIGHT.includes(aired[0]?.kind)) continue;
        expect(aired[0].script.blocks[0].key, `day ${row.day}`).toBe('host.cold.night');
        const firstMorning = aired.findIndex(a => !NIGHT.includes(a.kind));
        aired.forEach((a, i) => {
          const colds = a.script.blocks.filter(b => /^host\.cold\.(blocking|quiet|arrival)$/.test(b.key));
          if (i < firstMorning) expect(colds, `day ${row.day} scene ${i}`).toEqual([]);
        });
        if (firstMorning > 0) expect(aired[firstMorning].script.blocks[0].key, `day ${row.day}`).toMatch(/^host\.cold\.(blocking|quiet)$/);
      }
    }
  });
});
