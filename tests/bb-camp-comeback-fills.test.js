// Camp Comeback has to reach four and open the door.
//
// The contract says `duration: { weeks: 4 }` and the card says "the next four
// houseguests evicted". `bbTwistsForWeek` says neither — it matches a twist to
// a week by exact episode number and knows nothing about duration — so a Camp
// Comeback booked on one week was active on that week and nowhere else. One
// camper arrived, the camp never reached four, and the comeback competition
// never ran.
//
// Reported from a real season: "1 of 4, and no mention of it after". The
// timeline's own projection was right all along and expected a returning
// houseguest four evictions later, which is the other half of the same report
// — the schedule added a player the engine never sent back.
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { campers, CAMP_SIZE } from '../js/bb/camp-comeback.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const ROSTER = JSON.parse(readFileSync(resolve(process.cwd(), 'franchise_roster.json'), 'utf8'));
const POOL = (Array.isArray(ROSTER) ? ROSTER : ROSTER.players || Object.values(ROSTER)[0])
  .filter(p => p?.stats && p.name);
const CAST = Array.from({ length: 16 }, (_, i) => POOL[(i * 11 + 3) % POOL.length])
  .map(p => ({ name: p.name, archetype: p.archetype || 'floater', gender: p.gender || 'm',
    sexuality: p.sexuality || 'straight', stats: { ...p.stats } }));

function seat() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  // Booked ONCE, on week 3, exactly as a theme or a user places it.
  seasonConfig.twistSchedule = [{ id: 'cc-1', episode: 3, type: 'bb-camp-comeback' }];
}

describe('Camp Comeback', () => {
  beforeEach(seat);

  it('fills to four from one booking, then opens the door', () => {
    // The camp reaching four and the door opening happen inside the SAME
    // episode, so `campers()` is never observable at four from out here — the
    // durable record is `gs.bb.camp`, which keeps every camper who ever
    // arrived, flagged returned or gone.
    let returned = null;
    const counts = [];
    for (let ep = 0; ep < 9; ep++) {
      const e = withSeededRandom(7000 + ep * 31, () => simulateBBEpisode());
      if (!e) break;
      const w = gs.bb.weeks[gs.bb.weeks.length - 1];
      counts.push(`w${w?.num}:${campers().length}`);

      if (w?.returnedHouseguest) returned = w.returnedHouseguest;
      if (returned) break;
    }
    expect((gs.bb.camp || []).length,
      `the camp never reached ${CAMP_SIZE} — ${counts.join(' ')}`).toBe(CAMP_SIZE);
    expect(returned, `nobody ever came back — ${counts.join(' ')}`).toBeTruthy();
    // The returnee is playing again, and is off the eliminated list.
    expect(gs.activePlayers).toContain(returned);
    expect(gs.eliminated).not.toContain(returned);
    // And the camp is closed: the losers are gone, so a later eviction does
    // not quietly reopen it.
    expect(campers()).toHaveLength(0);
  });

  it('does not reopen once it has run', () => {
    let returned = null;
    for (let ep = 0; ep < 9 && !returned; ep++) {
      const e = withSeededRandom(7000 + ep * 31, () => simulateBBEpisode());
      if (!e) break;
      returned = gs.bb.weeks[gs.bb.weeks.length - 1]?.returnedHouseguest || null;
    }
    expect(returned).toBeTruthy();
    // Play on. Nobody else should be sent to a camp that has closed.
    for (let ep = 0; ep < 3; ep++) {
      const e = withSeededRandom(9100 + ep * 17, () => simulateBBEpisode());
      if (!e) break;
      expect(campers(), 'the camp reopened after the comeback').toHaveLength(0);
    }
  });
});
