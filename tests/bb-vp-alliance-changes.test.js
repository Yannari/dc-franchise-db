// Every change to who is in an alliance reaches the stepped viewer as a card: a recruit in the week it
// happened, a member thrown out after a vote and an alliance that vote ended in the week after (the
// vote has been read out by then). The user, 2026-10-24: "we dont see alliance event in the stepped
// viewer when someone get added or remove to an alliance". Measured before the fix: 16 of 27 recruits
// in two seasons had no card, and a dissolved alliance never had one.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { stageHtml } from '../js/vp-bb-ep/stage.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Beth', 'Owen'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard', 'hero', 'floater'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const WEEKS = [];   // { row, screens, recruits }

beforeAll(() => {
  for (const seed of [3, 8]) {
    setGs(null);
    setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(), gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
      stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3 + seed) % 10)])) })));
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1, theme: 'none' });
    seasonConfig.twistSchedule = []; initGameState(); globalThis.gs = gs;
    withSeededRandom(seed, () => { for (let i = 0; i < 7; i++) simulateBBEpisode(); });
    for (const row of gs.episodeHistory.filter(r => r.format === 'big-brother')) {
      const recruits = (gs.namedAlliances || []).flatMap(a => (a.history || []).filter(h => h.type === 'recruited' && h.week === row.num).map(h => [a.name, h.member]));
      WEEKS.push({ row: JSON.parse(JSON.stringify(row)), screens: bbWeekSteps(row, { houseLife: 'segments' }), recruits });
    }
  }
}, 900000);

const cardsOf = screens => screens.flatMap(S => (S.steps || []).flatMap(s => [s.card, s.scene?.title].filter(c => c && typeof c === 'object')));

describe('alliance membership on the stepped stage', () => {
  it('shows every recruit joining, in the week it happened', () => {
    let n = 0;
    for (const { row, screens, recruits } of WEEKS) {
      const cards = cardsOf(screens);
      for (const [name, who] of recruits) {
        n++;
        expect(cards.some(c => c.kind === 'joined' && c.name === name && (c.members || []).includes(who)), `week ${row.num}: ${who} into ${name}`).toBe(true);
      }
    }
    expect(n).toBeGreaterThan(10);
  });

  it('shows, the week after the vote, who was thrown out and which alliance it ended', () => {
    let n = 0;
    for (const { row, screens } of WEEKS) {
      const cards = cardsOf(screens);
      for (const d of (row.allianceDepartures || []).filter(x => x.carried)) {
        n++;
        expect(cards.some(c => c.kind === 'out' && c.name === d.alliance && c.members.includes(d.player)), `week ${row.num}: ${d.player} out of ${d.alliance}`).toBe(true);
      }
      for (const d of (row.allianceDissolved || []).filter(x => x.carried)) {
        n++;
        expect(cards.some(c => c.kind === 'ended' && c.name === d.name), `week ${row.num}: ${d.name} ended`).toBe(true);
      }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('draws the cards on the stage', () => {
    for (const { screens } of WEEKS) screens.forEach((S, si) => S.steps.forEach((st, i) => {
      if (st.card?.kind !== 'ended' && st.card?.kind !== 'joined') return;
      const html = stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html;
      expect(html).toContain(`alcard ${st.card.kind}`);
      expect(html).not.toMatch(/undefined|NaN/);
    }));
  });
});
