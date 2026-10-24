// Secret Story as a Big Brother mode (user, 2026-10-24: "end it with secret story theme").
// The format's rules, held: no Head of Household nominating and no veto, Diary Room
// nominations one sex against the other, the public evicts and crowns, secrets with a kitty
// and a buzzer whose money only ever changes hands, and no secret that is invented biography.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { BB_THEMES } from '../js/bb/themes.js';
import { KITTY_START } from '../js/bb/secret-story.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Beth', 'Owen'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain'][i % 7] }));

function season(theme = 'secret-story', seed = 5) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, theme, twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined });
  const eps = [];
  withSeededRandom(seed, () => {
    let n = 0;
    while ((gs.activePlayers || []).length > 3 && n < 20) { const ep = simulateBBEpisode(); if (!ep) break; eps.push(JSON.parse(JSON.stringify(ep))); n++; }
    runBBFinale();
  });
  return { eps, fin: gs.episodeHistory[gs.episodeHistory.length - 1] };
}

describe('Secret Story', () => {
  it('is a theme that switches the mode on, and nothing else does', () => {
    expect(BB_THEMES['secret-story'].seasonKnobs.bbSecretStory).toBe('on');
    for (const [id, t] of Object.entries(BB_THEMES)) if (id !== 'secret-story') expect(t.seasonKnobs?.bbSecretStory, id).toBeFalsy();
  });

  it('plays a whole season by its own rules', () => {
    const { eps, fin } = season();
    const acts = eps.flatMap(e => e.acts || []);
    // no veto, ever
    expect(acts.some(a => a.type === 'veto' || a.type === 'veto-ceremony'), 'a veto was played').toBe(false);
    // every week's block came out of the Diary Room, and the public evicted
    for (const ep of eps) {
      const noms = (ep.acts || []).find(a => a.type === 'nominations');
      expect(noms?.secretStory, `week ${ep.num}: the nominations were not the house's`).toBeTruthy();
      const ev = (ep.acts || []).find(a => a.type === 'eviction');
      expect(ev?.ssPublic?.evicted, `week ${ep.num}: the public did not evict`).toBe(ev?.evicted);
      expect(Object.values(ev.votes || {}).every(v => !v), 'the house voted').toBe(true);
      expect(ev.ballots || [], 'the house cast ballots').toEqual([]);
    }
    // secrets on night one, and only real ones or roles from The Voice
    const given = acts.find(a => a.type === 'ss-secrets');
    expect(given).toBeTruthy();
    for (const s of given.secrets) expect(['real-pair', 'real-career', 'voice-pair', 'voice-mission']).toContain(s.kind);
    // money only changes hands: the kitties always add up to what the house walked in with
    const k = gs.bb.secretStory.kitty;
    expect(Object.values(k).reduce((a, b) => a + b, 0)).toBe(KITTY_START * NAMES.length);
    // the public crowns the winner
    const fv = (fin.acts || []).find(a => a.type === 'ss-final-vote');
    expect(fv?.winner).toBe(fin.winner);
    expect(fin.jury).toEqual([]);
  });

  it('airs on the stepped stage without a Head of Household or a veto screen', () => {
    const { eps, fin } = season('secret-story', 9);
    for (const ep of [...eps, fin]) {
      const screens = bbWeekSteps(ep);
      for (const s of screens) {
        expect(s.kind, `week ${ep.num}`).not.toBe('veto');
        expect(s.kind).not.toBe('hohroom');
        for (const st of s.steps || []) expect(String(st.t || '')).not.toMatch(/undefined|NaN|\bHOH\b|Head of Household/);
      }
    }
  });

  it('leaves an ordinary season untouched', () => {
    const { eps } = season('none', 5);
    const acts = eps.flatMap(e => e.acts || []);
    expect(acts.some(a => String(a.type).startsWith('ss-'))).toBe(false);
    expect(gs.bb.secretStory).toBeFalsy();
  });
});
