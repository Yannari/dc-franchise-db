// The house events of the two season modes (events.js, 2026-10-17: "we need events for both modes"): each fires, each
// aired one is written, and each one's consequence is real (a coup changes the captain, a promise weighs on the money).
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { keepTerms } from '../js/ch/share-keep.js';
import { challengeCast } from './helpers/ch-cast.js';

const PAIR_KINDS = ['pair-train', 'pair-money-talk', 'pair-coach', 'pair-pact', 'pair-mock', 'pair-homesick', 'pair-tempt'];
const TEAM_KINDS = ['team-strategy', 'team-coup', 'team-weak-link', 'team-trash-talk', 'team-celebrate', 'team-leak', 'team-enemy-love', 'team-new-blood', 'team-carry'];

function play(seed, options) {
  const { cast, names, background } = challengeCast(24, seed);
  setPlayers(cast);
  const r = playChallengeSeason({ cast: names, background, seed, options });
  airSeason(r.state);
  return r;
}

describe('the season modes have a house life of their own', () => {
  let pairs, teams;
  beforeAll(() => {
    pairs = [[3, 'rivals'], [8, 'ties'], [5, 'pick'], [11, 'rivals']].map(([s, pairing]) => play(s, { pairs: { pairing } }));
    teams = [[3, 'shows'], [8, 'draft'], [11, 'champions'], [6, 'vets']].map(([s, teaming]) => play(s, { teams: { teaming, count: 2, end: 'breakup' } }));
  });

  it('every new event fires in its own mode, and never in the other', () => {
    const kinds = list => new Set(list.flatMap(r => r.state.scenes.map(s => s.kind)));
    const p = kinds(pairs), t = kinds(teams);
    for (const k of PAIR_KINDS) { expect(p.has(k), k).toBe(true); expect(t.has(k), `${k} in a Teams season`).toBe(false); }
    for (const k of TEAM_KINDS) { expect(t.has(k), k).toBe(true); expect(p.has(k), `${k} in a Pairs season`).toBe(false); }
  });

  it('every one of them that airs is written', () => {
    for (const r of [...pairs, ...teams]) for (const e of r.episodes) for (const a of e.aired || []) {
      if (![...PAIR_KINDS, ...TEAM_KINDS, 'volunteer-in'].includes(a.kind)) continue;
      expect(a.script?.lines?.length, `seed ${r.state.seed} ep${e.ep} ${a.kind}`).toBeGreaterThan(0);
    }
  });

  it('a coup that takes changes the team\'s captain', () => {
    let coups = 0, checked = 0;
    for (const r of teams) for (const s of r.state.scenes.filter(x => x.kind === 'team-coup' && x.data.takes)) {
      coups++;
      // the captain as that episode ended (Intel's snapshot) is the one who came for it, unless they left that week
      const e = r.episodes.find(x => x.ep === s.ep);
      const t = (e?.intel?.end?.teams || []).find(x => x.name === s.data.team);
      if (t && t.members.includes(s.who[0])) { expect(t.captain, `seed ${r.state.seed} ep${s.ep}`).toBe(s.who[0]); checked++; }
    }
    expect(coups).toBeGreaterThan(0);
    expect(checked).toBeGreaterThan(0);
  });

  it('a promise to share weighs against keeping the money', () => {
    const r = pairs[0];
    const p = r.state.pairs?.[0] || { a: r.state.cast[0], b: r.state.cast[1] };
    const without = keepTerms(r.state, p.a, p.b, p).vow;
    r.state.shareVows = { [p.a]: p.b };
    expect(keepTerms(r.state, p.a, p.b, p).vow).toBeLessThan(without);
  });
});
