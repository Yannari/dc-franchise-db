// The veto meeting, read in the holder's own voice. The user, 2026-10-26, on a Head of Household who won the
// veto: "Nina has nominated Angelica, Vlad and Alexander for eviction" — "nina won the veto why is she not
// talking like its her own nomination". A holder who is the HOH says "I have nominated", and never asks
// themselves to name a replacement.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];

function meetings() {
  const out = [];
  for (const seed of [11, 23, 47, 91, 133, 207]) {
    seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] })), { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [];
    for (let w = 0; w < 7; w++) {
      const ep = JSON.parse(JSON.stringify(withSeededRandom(seed * 10 + w, () => simulateBBEpisode())));
      const cer = (ep.acts || []).find(a => a?.type === 'veto-ceremony');
      const screen = bbWeekSteps(ep).find(s => s.id === 'bb-cer-v');
      if (cer && screen) out.push({ ep, cer, screen });
    }
  }
  return out;
}
const ALL = meetings();

describe('the veto meeting', () => {
  it('has meetings to read, some held by the Head of Household', () => {
    expect(ALL.length).toBeGreaterThan(10);
    expect(ALL.some(m => m.cer.holder === (m.cer.chairAuthority || m.ep.hoh))).toBe(true);
  });

  it('has a Head of Household holder talk about their own nominations', () => {
    for (const { ep, cer, screen } of ALL.filter(m => m.cer.holder && m.cer.holder === (m.cer.chairAuthority || m.ep.hoh))) {
      const said = screen.steps.filter(s => s.by === cer.holder).map(s => s.t).join(' ');
      expect(said, `week ${ep.num}`).toMatch(/I have nominated/);
      expect(said, `week ${ep.num}`).not.toContain(`${cer.holder} has nominated`);
      expect(said, `week ${ep.num}`).not.toContain(`${cer.holder}, since I have just vetoed`);
    }
  });

  it('still names the Head of Household when somebody else holds it', () => {
    for (const { ep, cer, screen } of ALL.filter(m => m.cer.holder && m.cer.holder !== (m.cer.chairAuthority || m.ep.hoh))) {
      expect(screen.steps.map(s => s.t).join(' '), `week ${ep.num}`).toContain(`${cer.chairAuthority || ep.hoh} has nominated`);
    }
  });
});
