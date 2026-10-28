// The secret of the house, the semi-final unveiling, the final week and the cheque (part 2 design §18).
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { expectedTotal, actualTotal } from '../js/ss/kitty.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'hothead'][i % 7] }));

describe('the end of a Secret Story season', () => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSecretRoom: 'off', ssSignature: undefined });
  withSeededRandom(9, () => { let n = 0; while ((gs.activePlayers || []).length > 3 && n < 24) { if (!simulateBBEpisode()) break; n++; } runBBFinale(); });
  const st = gs.bb.secretStory;
  const rows = gs.episodeHistory;
  const fin = rows.find(r => r.isFinale);

  it('the secret of the house is hidden all season, clued, and settled in the semi-final week', () => {
    expect(st.houseSecret?.riddle).toBeTruthy();
    expect(rows.some(r => (r.acts || []).some(a => a.type === 'ss-house-secret'))).toBe(true);
    expect(rows.some(r => (r.acts || []).some(a => a.type === 'ss-house-secret-end'))).toBe(true);
  });
  it('the semi prime closes the hunt and unveils what was kept, paid', () => {
    expect(st.huntClosed).toBe(true);
    const semiRow = rows.find(r => (r.acts || []).some(a => a.type === 'ss-prime' && a.segments.some(s => s.kind === 'unveil')));
    expect(semiRow).toBeTruthy();
    const after = rows.filter(r => r.num > semiRow.num);
    for (const r of after) expect((r.acts || []).some(a => a.type === 'ss-buzz')).toBe(false);
    expect(actualTotal(st)).toBe(expectedTotal(st));
  });
  it('the final week brings the eliminated back, tells each journey, and pays the cheque', () => {
    expect(fin.acts.some(a => a.type === 'ss-returns')).toBe(true);
    expect(fin.acts.some(a => a.type === 'ss-journeys')).toBe(true);
    expect(gs.bb.finale.cheque).toBe(100000);
    const text = bbWeekSteps(fin, { host: 'Josh' }).flatMap(s => s.steps.map(x => x.t)).join(' ');
    expect(text).toMatch(/\$100,000/);
    const bad = text.match(/.{0,90}(undefined|NaN|houseguest|Head of Household|jury).{0,60}/gi) || [];
    expect(bad).toEqual([]);
  });
});
