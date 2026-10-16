// A reason said out loud at the vote claims only what was true of the name at that vote (vote.js houseVote `on`,
// facts.js proven / neverIn / richest). The threat reason can come from how strong somebody looks with no wins at
// all; a floater can have been in the Arena once; second-richest is not "the biggest bank in here".
import { describe, it, expect, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeCast } from './helpers/ch-cast.js';

const CLAIMS = [
  [/never been in|Zero trips to the Arena|haven't been in yet|Everybody else has had to fight|watched everybody else go in|earned their spot in that Arena/, 'neverIn'],
  [/winning too much|dailies you've won|The numbers don't lie|prove it again/, 'proven'],
  [/biggest bank|the most money|richest person|Biggest bank/, 'richest'],
];

describe('reasons said at the vote', () => {
  const ballots = [];
  beforeAll(() => {
    for (const seed of [621, 622, 623, 624]) {
      const { cast, names, background } = challengeCast(24, seed);
      setPlayers(cast);
      const r = playChallengeSeason({ cast: names, background, seed });
      airSeason(r.state);
      for (const e of r.episodes) {
        const cast = (e.votes || []).flatMap(v => v.ballots || []);
        for (const a of e.aired || []) for (const c of a.ceremony || []) {
          if (c.kind !== 'ballot' || !c.script) continue;
          const b = cast.find(x => x.voter === c.voter && x.target === c.target);
          ballots.push({ on: b?.on || {}, text: c.script.lines.filter(l => l.by === c.voter).map(l => l.text).join(' '), who: `${c.voter} > ${c.target}` });
        }
      }
    }
  });

  it('reads enough ballots to mean something', () => {
    expect(ballots.length).toBeGreaterThan(200);
    // and the claim lines still air when they are true (a guard that never sees one proves nothing)
    expect(ballots.filter(b => CLAIMS.some(([rx]) => rx.test(b.text))).length).toBeGreaterThan(5);
  });

  it('claims a record only when the record is there', () => {
    const bad = [];
    for (const b of ballots) for (const [rx, fact] of CLAIMS) if (rx.test(b.text) && !b.on[fact]) bad.push(`${b.who} (${fact} false): ${b.text}`);
    expect(bad).toEqual([]);
  });
});
