// A backdoor is told between the nomination ceremony and the veto competition, and only then. The user,
// 2026-10-24, on "Can you keep a secret? Michele goes up after the veto" airing once Michele had won the veto:
// "this should only be before veto and after hoh and nomination ceremony".
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { backdoorWindow } from '../js/bb/story/director.js';
import { STORY_POOLS } from '../js/bb/story/lines/index.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Beth', 'Owen'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'hero', 'floater'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const weeks = [];

beforeAll(() => {
  for (const seed of [3, 8, 21]) {
    setGs(null);
    setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(), gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
      stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3 + seed) % 10)])) })));
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1, theme: 'none' });
    seasonConfig.twistSchedule = []; initGameState(); globalThis.gs = gs;
    withSeededRandom(seed, () => { for (let i = 0; i < 6; i++) simulateBBEpisode(); });
    weeks.push(...JSON.parse(JSON.stringify(gs.episodeHistory.filter(r => r.format === 'big-brother'))));
  }
}, 900000);

describe('the backdoor, told', () => {
  it('waits for the nominations, airs before the veto, and is gone once the veto is played', () => {
    expect(backdoorWindow({ hoh: true, noms: false, veto: false })).toBe('wait');
    expect(backdoorWindow({ hoh: true, noms: true, veto: false })).toBe('open');
    expect(backdoorWindow({ hoh: true, noms: true, veto: true, cer: false })).toBe('gone');
    expect(backdoorWindow({ hoh: true, noms: true, veto: true, cer: true })).toBe('gone');
  });

  it('never says who might play or win the veto once it has been played', () => {
    for (const e of STORY_POOLS['story.target.backdoor.any']) {
      const said = e.turns.map(t => t.say || t.dr || t.beat || '').join(' ');
      if (/play(s)? veto|win it|gets? picked|if you play/i.test(said)) expect(e.presumes || [], e.id).toContain('preveto');
    }
  });

  it('in real seasons: a told backdoor sits between the ceremony and the veto, and the HOH plans it before the ceremony', () => {
    let plans = 0;
    for (const row of weeks) {
      const acts = row.acts || [];
      const noms = acts.findIndex(a => a?.type === 'nominations');
      const veto = acts.findIndex(a => a?.type === 'veto');
      acts.forEach((a, i) => {
        for (const sc of a?.scenes || []) {
          if (sc.type === 'target' && sc.step === 'backdoor') {
            expect(noms >= 0 && i >= noms, `week ${row.num}: ${sc.lineId} before the nominations`).toBe(true);
            expect(veto < 0 || i < veto, `week ${row.num}: ${sc.lineId} after the veto`).toBe(true);
          }
          if (/^hohweek\.plan3?\.backdoor$/.test(String(sc.step))) {
            plans++;
            expect(noms < 0 || i < noms, `week ${row.num}: the HOH's plan after the ceremony`).toBe(true);
          }
        }
      });
    }
    expect(plans).toBeGreaterThan(0);
  });
});
