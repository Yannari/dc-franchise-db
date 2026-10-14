// The eviction, before it happens (js/bb/story/votetalk.js): every week airs the plan, the vote that
// nearly went the other way, and the one going home, and every one of them is TRUE of the ballots.
// The read of 2026-10-13 found a 5-3 eviction with no plan, no swing and no campaign on screen.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];

function season(seed, weeks) {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] })), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
  const eps = [];
  for (let w = 0; w < weeks; w++) eps.push(JSON.parse(JSON.stringify(withSeededRandom(seed * 100 + w, () => simulateBBEpisode()))));
  return eps;
}
const EPS = [...season(4242, 6), ...season(777, 6)];

describe('the vote talk', () => {
  const weeks = EPS.map(ep => {
    const ev = (ep.acts || []).find(a => a.type === 'eviction');
    const talk = (ep.acts || []).flatMap(a => a.scenes || []).filter(sc => String(sc.step || '').startsWith('vote.'));
    return { ep, ev, talk };
  }).filter(w => w.ev && (w.ev.ballots || []).length >= 2 && w.ev.evicted);

  it('airs the plan and the one going home, every week with a real vote', () => {
    expect(weeks.length).toBeGreaterThan(6);
    for (const { ep, ev, talk } of weeks) {
      expect(talk.some(sc => sc.step.startsWith('vote.read.')), `week ${ep.num}: no read`).toBe(true);
      const against = ev.ballots.filter(b => b.evict === ev.evicted).length;
      if (against >= 2) expect(talk.some(sc => sc.step.startsWith('vote.plan.')), `week ${ep.num}: no plan`).toBe(true);
    }
  });

  it('is true of the ballots: the plan is two of the votes against, the read is the one going', () => {
    for (const { ev, talk } of weeks) {
      const out = ev.evicted;
      const against = new Set(ev.ballots.filter(b => b.evict === out).map(b => b.voter));
      for (const sc of talk) {
        if (sc.step.startsWith('vote.plan.')) for (const n of sc.cast) expect(against.has(n), `${sc.step}: ${n} did not vote ${out} out`).toBe(true);
        if (sc.step.startsWith('vote.read.')) expect(sc.cast[0]).toBe(out);
        if (sc.step === 'vote.swing.yes') {
          const b = ev.ballots.find(x => x.voter === sc.cast[0]);
          expect(b?.evict).toBe(out);
          expect(b?.changedBy).toBe(sc.cast[1]);
        }
      }
    }
  });

  it('says plainly, on every line, who it is about', () => {
    for (const { talk } of weeks) for (const sc of talk) for (const l of sc.lines) {
      expect(l.text, sc.step).not.toMatch(/\{\w+(\.\w+)?\}/);
      if (l.kind === 'say') expect(sc.cast, `${sc.step}: ${l.by}`).toContain(l.by);
    }
  });
});
