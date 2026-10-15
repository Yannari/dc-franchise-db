// ══════════════════════════════════════════════════════════════════════
// bb-intel-live — the Intel drawer knows only what the viewer has reached
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-15: "do the intel update live, cause I got an alliance in the intel before the
// alliance actually formed". Each screen carried the snapshot from the END of its stretch, so the
// first scene of a stretch already listed the pact made in its last one. Now a screen shows the house
// from before its stretch until it has played out, and an alliance made inside it appears once a line
// has said its name.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { ledgerAt } from '../js/vp-bb-ep/stage.js';
import { weekAt } from '../js/vp-bb-ep/intel.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];

seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i] })), { episode: 0, eliminated: [], namedAlliances: [] });
Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
const eps = [];
for (let w = 0; w < 4; w++) {
  eps.push(JSON.parse(JSON.stringify(withSeededRandom(5150 * 100 + w, () => simulateBBEpisode()))));
  // the app keeps the house as each week ends on the history row (bb-run.js gsSnapshot); the drawer reads it
  const E = gs.episodeHistory.find(e => +e.num === +eps.at(-1).num);
  if (E && !E.gsSnapshot) E.gsSnapshot = JSON.parse(JSON.stringify({ activePlayers: gs.activePlayers, bonds: gs.bonds, showmances: gs.showmances,
    romanticSparks: gs.romanticSparks, sideDeals: gs.sideDeals, namedAlliances: (gs.namedAlliances || []).filter(a => a.active !== false && !a.dissolved) }));
}

const atOf = (S, idx) => ({ start: S.snapStart || null, atEnd: idx >= S.steps.length - 1 });
const names = W => (W?.alliances || []).map(a => a.name).sort();

describe('the Intel drawer, step by step', () => {
  it('never lists an alliance the viewer has not been shown', () => {
    let checked = 0, early = 0;
    for (const row of eps) {
      const screens = bbWeekSteps(row);
      const formedThisWeek = new Set((row.acts || []).flatMap(a => (a.socialBeats || []).filter(b => b.newAlliance).map(b => b.allianceName || b.newAlliance?.name)).filter(Boolean));
      screens.forEach((S, si) => {
        if (!S.snap) return;
        for (let idx = 0; idx < S.steps.length; idx++) {
          const L = ledgerAt(screens, si, idx);
          const W = weekAt(row.num, S.snap, L.out, { ...atOf(S, idx), said: L.said });
          if (!W?.live) continue;
          for (const a of W.alliances) {
            if (!formedThisWeek.has(a.name)) continue;
            checked++;
            const told = L.said.some(t => t.includes(a.name)) || atOf(S, idx).atEnd || (S.snapStart?.alliances || []).some(x => x.name === a.name);
            if (!told) early++;
            expect(told, `week ${row.num} screen ${si} step ${idx}: ${a.name} listed before it was formed on screen`).toBe(true);
          }
        }
      });
    }
    expect(early).toBe(0);
    expect(checked, 'no alliance formed in these weeks was ever listed: the test checked nothing').toBeGreaterThan(0);
  });

  it('shows the alliance once the screen that formed it has played out', () => {
    const row = eps.find(r => (r.acts || []).some(a => (a.socialBeats || []).some(b => b.newAlliance)));
    if (!row) return;
    const screens = bbWeekSteps(row);
    const last = screens.length - 1;
    const S = screens[last];
    const L = ledgerAt(screens, last, S.steps.length - 1);
    const W = weekAt(row.num, S.snap, L.out, { ...atOf(S, S.steps.length - 1), said: L.said });
    expect(names(W).length).toBeGreaterThan(0);
  });
});
