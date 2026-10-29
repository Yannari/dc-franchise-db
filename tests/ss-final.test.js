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
  it('the semi prime doubles a kept secret\'s kitty and validates every kitty in the house', () => {
    const semi = rows.flatMap(r => (r.acts || []).filter(a => a.type === 'ss-prime')).flatMap(a => a.segments).find(s => s.kind === 'unveil');
    expect(st.kittyValidated?.amounts).toBeTruthy();
    expect(semi.validated.length).toBeGreaterThan(0);
    for (const u of semi.list) for (const p of u.paid) expect(p.after - p.before).toBe(Math.max(p.before, 10000));
    // a validated kitty never ends below what was validated
    for (const [n, v] of Object.entries(st.kittyValidated.amounts)) if (gs.activePlayers.includes(n)) expect(Number(st.kitty[n])).toBeGreaterThanOrEqual(v);
    const text = bbWeekSteps(rows.find(r => (r.acts || []).some(a => a.type === 'ss-prime' && a.segments.includes(semi))), { host: 'Josh' }).flatMap(s => s.steps).map(x => x.t).join(' ');
    expect(text).toMatch(/your kitties are validated/);
  });
  it('the final week brings every eliminated housemate back for one last party', () => {
    const party = fin.acts.find(a => a.type === 'ss-returns');
    expect([...party.guests].sort()).toEqual(gs.eliminated.filter(n => !party.finalists.includes(n)).sort());
    expect(party.moments.some(m => m.kind === 'support')).toBe(true);
    const scr = bbWeekSteps(fin, { host: 'Josh' }).find(s => s.id === 'bb-ss-returns-v');
    expect(scr.title).toBe('The Last Party');
    const said = scr.steps.map(x => x.t).join(' ');
    // every moment the engine paid for is on the screen
    for (const m of party.moments.filter(m => m.kind !== 'support')) expect(said).toContain(m.who);
  });
  it('the final week brings the eliminated back, tells each journey, and pays the cheque', () => {
    expect(fin.acts.some(a => a.type === 'ss-returns')).toBe(true);
    expect(fin.acts.some(a => a.type === 'ss-journeys')).toBe(true);
    expect(gs.bb.finale.cheque).toBe(100000);
    const text = bbWeekSteps(fin, { host: 'Josh' }).flatMap(s => s.steps.map(x => x.t)).join(' ');
    expect(text).toMatch(/\$100,000/);
    const bad = text.match(/.{0,90}(\bundefined\b|\bNaN\b|houseguest|Head of Household|jury).{0,60}/gi) || [];
    expect(bad).toEqual([]);
  });
});
