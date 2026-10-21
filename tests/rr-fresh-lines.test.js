// The first hour of the race: nothing has happened yet. The user's Home City transcript (2026-10-21) had, at 07:00,
// "Your GUT has been WRONG every SINGLE day of this RACE!", "Because our cab broke down", "Nice of you to finally show
// up" and "We passed you an hour ago", and the size-up "you're the ones who sang on the bus". A line that needs time
// behind it waits for the race to have some (write.js talksHistory).
import { describe, it, expect, beforeAll } from 'vitest';
import { airSeason } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';
import { POOLS } from '../js/rr/script/lines/index.js';
import { talksHistory } from '../js/rr/script/write.js';

// phrases that only work once the race has been going a while (written out here, not imported: the test is of what
// airs, whatever the writer's own list says)
const HISTORY = [/(?<!since )yesterday/i, /every (single )?day/i, /\b(an hour|hours|ages) ago\b/i, /for ages\b/i, /finally (show|turn)/i,
  /broke down/i, /\bthe bus\b|\bmost buses\b/i, /last (night|time|leg|week)\b/i, /we passed you/i,
  /all (week|race long)/i, /\bso far ahead\b/i, /\bagain\b.*\b(lost|wrong|late|last)\b/i];
const FRESH = 60;

const found = [];
beforeAll(() => {
  for (const seed of [8, 13, 21, 34, 55, 89]) for (const vets of [false, true]) {
    const { cast, teams } = raceCast(12, seed);
    if (vets) for (const t of teams) { t.rel = 'reality-vets'; t.identity = null; t.name = `${t.a} & ${t.b}`; }
    setPlayers(cast);
    const res = playRaceSeason({ teams, seed });
    const ep = airSeason(res)[0];
    for (const s of ep.segments) {
      if ((s.t ?? 0) >= FRESH || ['team-intro', 'don-narrate', 'don-opener'].includes(s.kind)) continue;
      for (const l of s.lines || []) if (HISTORY.some(re => re.test(l.text))) found.push(`${s.lineId}: ${l.text}`);
    }
  }
}, 600000);

describe('rr lines: the first hour of the race', () => {
  it('never talks about a race that has not happened yet', () => {
    expect([...new Set(found)]).toEqual([]);
  });
  it('knows the lines from the user\'s Home City transcript for what they are', () => {
    const byText = t => Object.values(POOLS).flat().find(e => (e.turns || []).some(x => [x.say, x.conf, x.beat].includes(t)));
    for (const t of ['Your GUT has been WRONG every SINGLE day of this RACE!', 'Because our cab broke down.', 'Nice of you to finally show up.']) {
      const e = byText(t);
      if (e) expect(talksHistory(e), t).toBe(true);
    }
  });
});
