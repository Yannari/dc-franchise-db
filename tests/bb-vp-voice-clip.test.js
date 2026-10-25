// The house's own voices play their clip when their line comes up (the user, 2026-10-25: "i still cant hear the
// mastermind voice is called The Mastermind"). The clip was only ever asked for on a line the stage types out; Big
// Brother and a season's voice speak from their own panel, so theirs never played.
import { describe, expect, it, beforeAll, vi } from 'vitest';

const asked = [];
vi.mock('../js/vp-bb-ep/voicing.js', async orig => ({
  ...(await orig()),
  bbVoiceLine: (ep, st) => { asked.push(st); return true; },
}));

const core = await import('../js/core.js');
const { seasonConfig, relationships, setPlayers, setGs } = core;
const { pStats, pronouns, ordinal, romanticCompat } = await import('../js/players.js');
const { getBond, getPerceivedBond, bKey, bondLabel } = await import('../js/bonds.js');
const { initGameState } = await import('../js/savestate.js');
const { simulateBBEpisode } = await import('../js/bb-run.js');
const { bbStepScreens, bbxJump } = await import('../js/vp-bb-ep/screens.js');
const { withSeededRandom } = await import('./helpers/rng.js');

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Beth', 'Owen', 'Jo', 'Lindsay'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
let row;

beforeAll(() => {
  setGs(null);
  setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(), gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: 'floater',
    stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3) % 10)])) })));
  Object.assign(globalThis, { gs: core.gs, players: core.players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', seasonNumber: 1, theme: 'summer-of-mystery', themeArcStamped: '' });
  seasonConfig.twistSchedule = []; initGameState(); globalThis.gs = core.gs; globalThis.players = core.players;
  withSeededRandom(5, () => simulateBBEpisode());
  row = core.gs.episodeHistory.find(r => r.format === 'big-brother');
  globalThis._bbxFast = true; window._bbxFast = true;
}, 600000);

describe('a voiced line from the house', () => {
  it('asks for the clip of The Mastermind and of Big Brother when their line comes up', () => {
    const out = bbStepScreens(row, [], { host: 'Valeria' });
    const box = document.body.appendChild(document.createElement('div'));
    box.id = 'vp-screen-content';
    const kinds = new Set();
    for (const s of out) {
      if (typeof s.html !== 'string' || !s.html.includes('class="bbx"')) continue;
      box.innerHTML = s.html;
      const uid = box.querySelector('.bbx[data-uid]')?.dataset.uid;
      const R = window._bbx[uid];
      if (!R || R.map) continue;
      R.screens[R.si].steps.forEach((st, i) => {
        if (st.k !== 'voice' && st.k !== 'bb') return;
        asked.length = 0;
        bbxJump(uid, i + 1);
        expect(asked.map(x => x.t), `${s.id} step ${i}`).toContain(st.t);
        kinds.add(st.k === 'voice' ? st.by : 'Big Brother');
      });
    }
    expect([...kinds]).toContain('The Mastermind');
  });
});
