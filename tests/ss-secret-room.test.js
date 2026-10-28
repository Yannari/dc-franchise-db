// The fake elimination and the secret room (part 2 design §14): the hidden
// housemate is off the house list, never eliminated, and comes back down.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Duncan', 'Gwen'];
const CAST = NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'hothead'][i % 7] }));

describe('the secret room', () => {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSecretRoom: 'on' });
  withSeededRandom(17, () => { let n = 0; while ((gs.activePlayers || []).length > 3 && n < 24) { if (!simulateBBEpisode()) break; n++; } runBBFinale(); });
  const rows = gs.episodeHistory.filter(r => (r.acts || []).length);
  const fakeRow = rows.find(r => r.acts.some(a => a.type === 'ss-after' && a.fake));
  const hidden = fakeRow?.acts.find(a => a.type === 'ss-after' && a.fake)?.evicted;

  it('plays a fake elimination in the middle of the season', () => {
    expect(fakeRow, 'no fake elimination').toBeTruthy();
    expect(fakeRow.num).toBeGreaterThanOrEqual(3);
  });
  it('the hidden housemate is never eliminated, is not in the house the next week, and comes back', () => {
    expect(fakeRow.eliminated || null).toBe(null);
    const next = rows.find(r => r.num === fakeRow.num + 1);
    expect(next.houseAtStart).not.toContain(hidden);
    expect(next.acts.some(a => a.type === 'ss-secret-room' && a.who === hidden), `room acts ${next.acts.filter(a=>a.type.startsWith('ss-')).map(a=>a.type+':'+a.name).join(' ')} hidden ${hidden}`).toBe(true);
    const prime = next.acts.find(a => a.type === 'ss-prime');
    expect(prime.segments.some(s => s.kind === 'return' && s.name === hidden), `segs ${prime.segments.map(s=>s.kind+':'+s.name).join(' ')}`).toBe(true);
    const after = rows.find(r => r.num === fakeRow.num + 2);
    if (after) expect(after.houseAtStart).toContain(hidden);
    // nobody can be nominated while upstairs
    const noms = next.acts.find(a => a.secretStory)?.secretStory?.nominees || [];
    expect(noms).not.toContain(hidden);
  });
  it('comes back with a power: immune next week, and somebody nominated', () => {
    const after = rows.find(r => r.num === fakeRow.num + 2);
    if (!after) return;
    const ss = after.acts.find(a => a.secretStory)?.secretStory;
    expect(ss.immune).toContain(hidden);
    const ret = rows.find(r => r.num === fakeRow.num + 1).acts.find(a => a.type === 'ss-prime').segments.find(s => s.kind === 'return');
    if (ret.target && after.houseAtStart.includes(ret.target)) expect(ss.dOffice).toContain(ret.target);
  });
  it('airs: the twist in the airlock, the week upstairs, the return; the secret is not told', () => {
    const ids = bbWeekSteps(fakeRow, { host: 'Josh' }).map(s => s.id);
    expect(ids.some(i => i.startsWith('bb-ss-secretroom-in'))).toBe(true);
    expect(ids.some(i => i.startsWith('bb-ss-prime-walk'))).toBe(false);
    // (a stay is one or two weeks: js/ss/hidden.js planFakes; the week screen is named for who is up there)
    const nextIds = rows.filter(r => r.num > fakeRow.num && r.num <= fakeRow.num + 2).flatMap(r => bbWeekSteps(r, { host: 'Josh' }).map(s => s.id));
    expect(nextIds.some(i => /^bb-ss-secretroom-(?!in-)/.test(i))).toBe(true);
    expect(nextIds.some(i => i.startsWith('bb-ss-prime-return'))).toBe(true);
    // (told only if they are really eliminated later, never on the fake night)
    expect(gs.bb.secretStory.secrets.find(s => s.holders.includes(hidden)).revealedOnExit ?? null).not.toBe(fakeRow.num);
  });
  it('the season still ends with a winner, and the hidden one is placed once', () => {
    expect(gs.bb.finale?.winner).toBeTruthy();
    expect(gs.eliminated.filter(n => n === hidden).length).toBeLessThanOrEqual(1);
  });
});
