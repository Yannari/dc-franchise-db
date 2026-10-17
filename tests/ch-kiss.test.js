// The drunk kiss at the night out, and what it costs (ch/party.js nightDrama 5, kissFallout). The user,
// 2026-10-16: "drunk romance, a kiss at the night out, and cheating drama, you kissed my boyfriend, like Jersey Shore".
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeCast } from './helpers/ch-cast.js';

let runs;
beforeAll(() => {
  runs = Array.from({ length: 30 }, (_, i) => i + 1).map(seed => {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed, options: {} });
    airSeason(r.state);
    return r;
  });
}, 600000);

describe('The Challenge: the drunk kiss', () => {
  it('every kiss is on screen before anybody talks about it', async () => {
    // a scene of two confessionals about a kiss nobody saw aired at a night out (the user, 2026-10-17: "what are
    // these referring to, no setup, no dialogue, no animation"): a beat with the kiss in it, which the viewer acts
    const { POOLS } = await import('../js/ch/script/lines/index.js');
    for (const [k, list] of Object.entries(POOLS)) {
      if (!k.startsWith('party-kiss.')) continue;
      for (const e of list) {
        const first = e.turns.findIndex(t => t.beat && /\bkiss(es|ing)?\b/i.test(t.beat));
        expect(first, `${e.id}: no beat shows the kiss`).toBeGreaterThanOrEqual(0);
        expect(e.turns.slice(0, first).some(t => t.conf), `${e.id}: a confessional before the kiss`).toBe(false);
      }
    }
  });

  it('kisses happen at night outs, some of them by somebody taken, and every one airs', () => {
    let all = 0, cheats = 0, aired = 0;
    for (const r of runs) {
      const kisses = r.state.scenes.filter(s => s.kind === 'party-kiss');
      all += kisses.length; cheats += kisses.filter(s => s.data.partner || s.data.home).length;
      aired += r.state.episodes.flatMap(e => e.aired || []).filter(a => a.kind === 'party-kiss').length;
      for (const s of kisses) expect(s.spot).toBe('party');
    }
    expect(all).toBeGreaterThan(10);
    expect(cheats).toBeGreaterThan(0);
    expect(aired).toBe(all);
  });

  it('a caught kiss or a told one costs the kisser and the one kissed, and can end the couple', () => {
    let n = 0;
    for (const r of runs) for (const s of r.state.scenes.filter(x => x.kind === 'kiss-fallout' || (x.kind === 'party-kiss' && x.data.caught))) {
      n++;
      const [p, b, a] = s.kind === 'kiss-fallout' ? s.who : [s.who[2], s.who[1], s.who[0]];
      const couple = r.state.couples.find(c => (c.a === a && c.b === p) || (c.a === p && c.b === a));
      if (s.data.ended) { expect(couple.ended).toBeTruthy(); expect(couple.why).toBe('kiss'); }
      expect(p && b && a).toBeTruthy();
    }
    expect(n).toBeGreaterThan(0);
  });

  it('the scenes print every name', () => {
    for (const r of runs) for (const e of r.state.episodes) for (const a of e.aired || []) {
      if (a.kind !== 'party-kiss' && a.kind !== 'kiss-fallout') continue;
      expect((a.script?.lines || []).map(l => l.text).join(' ')).not.toMatch(/\{\w+(\.\w+)?\}|undefined/);
    }
  });
});
