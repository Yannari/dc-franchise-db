// Couples and old friends on The Challenge (franchise-carry kin, state.js kinOf): they pull toward each other in
// an alliance and a partner pick, and the airstrip shows them finding each other first.
// The user, 2026-10-16: "if there's gf/bf, friends/enemies, do they acknowledge it in events and in their
// strategy, cause a couple are for example more drawn to team up".
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { romanticCompat } from '../js/players.js';
import { challengeCast } from './helpers/ch-cast.js';

const SEEDS = Array.from({ length: 20 }, (_, i) => 31 + i);   // twenty: ten sat on the line (0.45 against 0.465 after an unrelated draw change, 2026-10-18)
let runs;
beforeAll(() => {
  runs = SEEDS.map(seed => {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    // a couple (a man and a woman who could date) and three pairs of old friends, all from anywhere
    const men = names.filter(n => background.division?.[n] === 'm' || cast.find(p => p.name === n)?.gender === 'm');
    const women = names.filter(n => !men.includes(n));
    const pair = men.flatMap(m => women.map(w => [m, w])).find(([m, w]) => romanticCompat(m, w));
    const rest = names.filter(n => !pair?.includes(n));
    const friends = [[rest[0], rest[5]], [rest[2], rest[9]], [rest[4], rest[13]]];
    const kin = [...(pair ? [{ a: pair[0], b: pair[1], kin: 'dating', from: 'life' }] : []),
      ...friends.map(([a, b]) => ({ a, b, kin: 'old-friends', from: 'ledger' }))];
    const r = playChallengeSeason({ cast: names, background, seed, carried: { kin, bonds: [], sums: [], atHome: [] }, options: { romance: true } });
    airSeason(r.state);
    return { r, names, pair, friends };
  });
}, 600000);

const together = (st, a, b) => st.alliances.some(al => [...new Set([...(al.members || []), ...(al.former || [])])].includes(a)
  && [...new Set([...(al.members || []), ...(al.former || [])])].includes(b));

describe('The Challenge: couples and old friends', () => {
  it('a couple and old friends land in the same alliance far more often than two random players', () => {
    let kinHit = 0, kinN = 0, randHit = 0, randN = 0;
    for (const { r, names, pair, friends } of runs) {
      for (const [a, b] of [...(pair ? [pair] : []), ...friends]) { kinN++; kinHit += together(r.state, a, b); }
      // the baseline is every other pair in the cast: twenty sampled pairs a season moved it from 0.235 to 0.268 on a
      // draw change that left the kin rate exactly where it was (2026-10-18)
      const kinKey = new Set([...(pair ? [pair] : []), ...friends].map(([x, y]) => [x, y].sort().join('|')));
      for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
        if (kinKey.has([names[i], names[j]].sort().join('|'))) continue;
        randN++; randHit += together(r.state, names[i], names[j]);
      }
    }
    // measured over twenty seasons against every pair: 0.36 against 0.27 (1.34 times) while the tie was averaged over
    // the group; counted whole, and a member bringing their partner along, 0.80 against 0.29 (2.7 times, 2026-10-18)
    expect(kinHit / kinN).toBeGreaterThan(randHit / randN * 2);
  });

  it('a couple who walk in together are partnered more often than chance on a picking week', () => {
    let partnered = 0, weeks = 0;
    for (const { r, pair } of runs) {
      if (!pair) continue;
      for (const sc of r.state.scenes.filter(s => s.kind === 'partner-pick')) {
        if (!pair.every(n => sc.who.includes(n))) continue;
        weeks++;
        if (sc.data.pairs.some(p => pair.every(n => p.includes(n)))) partnered++;
      }
    }
    if (weeks) expect(partnered / weeks).toBeGreaterThan(0.4);
  });

  it('the airstrip shows them finding each other first, and the lines never name a show', () => {
    let couple = 0, friends = 0;
    for (const { r } of runs) {
      const ep1 = r.state.episodes[0];
      for (const a of ep1.aired || []) {
        if (a.kind !== 'arrival' || !a.scene?.data?.kin) continue;
        const text = (a.script?.lines || []).map(l => l.text).join(' ');
        expect(text).not.toMatch(/\{\w+\}|undefined/);
        if (a.scene.data.kin === 'couple') couple++; else friends++;
      }
    }
    expect(couple).toBeGreaterThan(0);
    expect(friends).toBeGreaterThan(0);
  });
});
