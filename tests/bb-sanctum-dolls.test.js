// The Sanctum's nominations are voodoo dolls on the table, on screen as well as in the words: no key box, no
// NOMINATIONS screen (the user, 2026-10-31: "they should really use doll for the nominations like asked in the sanctum").
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];

function sanctumRow(seed = 606) {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] })), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', theme: '' });
  seasonConfig.twistSchedule = [{ id: 's1', episode: 4, type: 'bb-sanctum-week' }];
  seasonConfig.themeArcStamped = '';
  setGs({ ...gs, bb: null });
  let row = null;
  withSeededRandom(seed, () => {
    for (let i = 0; i < 8 && !row; i++) {
      const ep = simulateBBEpisode();
      if (!ep) break;
      if ((ep.acts || []).some(a => a?.type === 'eviction' && a.publicVote)) row = JSON.parse(JSON.stringify(ep));
    }
  });
  return row;
}

describe('the Sanctum nominations', () => {
  it('sets a doll of each nominee on the table, with no key box and no nomination screen', () => {
    const row = sanctumRow();
    expect(row, 'the Sanctum week never played').toBeTruthy();
    const screens = bbWeekSteps(row);
    const at = screens.findIndex(S => S.id === 'bb-noms-v');
    expect(at).toBeGreaterThanOrEqual(0);
    const S = screens[at];
    expect(S.sanctum).toBe(true);
    expect(S.room).toBe('The Sanctum');
    // the step the last doll goes down on
    const last = S.steps.findLastIndex(st => st.reveal);
    const html = stageHtml(screens, at, last, true, { season: 'default', host: 'Valeria' }).html;
    const placed = S.steps.filter(st => st.reveal).map(st => st.reveal);
    expect(placed.length).toBeGreaterThanOrEqual(2);
    expect((html.match(/class="ndoll /g) || []).length).toBe(placed.length);
    for (const n of placed) expect(html).toContain(`<b>${n}</b>`);
    expect(html).not.toMatch(/class="nomscreen|class="nkeys/);
    expect(html).not.toMatch(/undefined|NaN/);
  });
});
