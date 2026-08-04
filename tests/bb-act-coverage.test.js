// Nothing the engine does may go untranscribed.
//
// The format has TWO transcript writers — text-backlog.js for the in-app
// summary and bb-run.js summariseWeek for everything the tests can reach —
// plus the visual player. Every slice has to remember all three, and the
// failure mode is silent: a new act type simply falls through the switch and
// the week reads as if it never happened. That has bitten this project once
// per slice for eleven slices.
//
// So this test does not check any particular twist. It plays real weeks with
// every twist the designer can schedule, collects the act types the engine
// ACTUALLY emitted, and asserts each one is handled by both writers. When a
// twelfth slice forgets a transcript, this fails with the act's name in it.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { rpBuildBBAppStore } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const src = rel => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn', 'Ennui', 'Sky'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'perceptive-player', 'chaos-agent', 'challenge-beast', 'strategist'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ARCH[i] === 'strategist' ? 'mastermind' : ARCH[i],
}));

function house(twists = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = twists.map(type => ({ episode: 1, type }));
}

/** The `case 'x':` labels inside one switch-bearing region of a file. */
function casesIn(text, startMarker) {
  const from = text.indexOf(startMarker);
  if (from < 0) return new Set();
  const slice = text.slice(from);
  return new Set([...slice.matchAll(/case '([a-z0-9-]+)'/g)].map(m => m[1]));
}

// Acts the writers deliberately fold into other prose rather than giving a
// heading of their own. Each one is a decision, not an omission.
const FOLDED = new Set([
  'house',        // ambient house events — rendered inside the act they sit in
  'power',        // the private power ledger; the Debug panel owns it
  'power-played', // narrated by the ceremony the power fired at
  'target',       // a private read, never public
  'safety',       // folded into the nomination/veto prose
  'generic-result', // a competition with no signature screen
  'tiebreaker',
  'arena',
  'departure',
  'instant-eviction',
  'have-nots',
  'roadkill-win',  // the memory record, not the act
]);

describe('every act the engine emits reaches both transcripts', () => {
  it('has no act type that falls silently through the switch', () => {
    // Every BB twist the Format Designer can schedule, one per attempt, plus a
    // handful of combinations — enough to exercise each twist's acts at least
    // once without running a full matrix.
    const bbTwists = TWIST_CATALOG.filter(t => t.format === 'big-brother').map(t => t.id);
    const seen = new Set();

    for (const twist of bbTwists) {
      for (let seed = 1; seed <= 3; seed++) {
        house([twist]);
        try {
          const ep = withSeededRandom(seed * 17, () => simulateBBEpisode());
          for (const act of ep.acts || []) if (act?.type) seen.add(act.type);
        } catch { /* an incompatible schedule is not this test's problem */ }
      }
    }
    // And a plain week, which emits the base-game acts.
    for (let seed = 1; seed <= 3; seed++) {
      house();
      const ep = withSeededRandom(seed * 31, () => simulateBBEpisode());
      for (const act of ep.acts || []) if (act?.type) seen.add(act.type);
    }

    expect(seen.size, 'no acts were collected — the harness is broken').toBeGreaterThan(8);

    const runText = src('../js/bb-run.js');
    const backlogText = src('../js/text-backlog.js');
    const vpText = src('../js/vp-screens.js');

    const runCases = casesIn(runText, 'export function summariseWeek');
    // The backlog's BB switch and the VP's screen switch both live inside
    // much larger files, so anchor on the `switch (act.type)` that opens each
    // one — anchoring on a case mid-switch silently drops every case above it.
    const backlogCases = casesIn(backlogText, 'switch (act.type)');
    const vpCases = casesIn(vpText, 'switch (act.type)');

    const missingRun = [];
    const missingBacklog = [];
    for (const type of [...seen].sort()) {
      if (FOLDED.has(type)) continue;
      if (!runCases.has(type)) missingRun.push(type);
      if (!backlogCases.has(type)) missingBacklog.push(type);
    }

    expect(missingRun,
      `these acts are emitted but summariseWeek (bb-run.js) never writes them: ${missingRun.join(', ')}`)
      .toEqual([]);
    expect(missingBacklog,
      `these acts are emitted but the text backlog (text-backlog.js) never writes them: ${missingBacklog.join(', ')}`)
      .toEqual([]);

    // The VP is allowed to be sparser — plenty of acts are prose rather than a
    // screen — but the twist acts that carry a built screen must be registered.
    const mustDraw = ['temptation', 'bonus-life', 'pandoras-box', 'battle-back',
      'roadkill', 'app-store', 'diamond-detonation', 'battle-of-the-block'];
    for (const type of mustDraw) {
      if (!seen.has(type)) continue;
      expect(vpCases.has(type), `${type} has no screen registered in buildVPScreens`).toBe(true);
    }
  });

  it('writing the App Store transcript did not leak who won', () => {
    // The grants are holder-secret. Adding the missing transcript is only
    // correct if it withholds the same thing the feeds do — the reveal belongs
    // to the night the power fires. The Debug panel owns the truth.
    let ep = null;
    for (let seed = 1; seed <= 30 && !ep; seed++) {
      house(['bb-app-store']);
      const played = withSeededRandom(seed * 13, () => simulateBBEpisode());
      if ((played.acts || []).some(a => a.type === 'app-store')) ep = played;
    }
    expect(ep, 'no App Store week in 30 seeds').toBeTruthy();
    const act = ep.acts.find(a => a.type === 'app-store');
    expect(act.winners.length, 'nobody won anything').toBeGreaterThan(0);

    const text = summariseWeek(gs.bb.weeks[gs.bb.weeks.length - 1]);
    expect(text).toMatch(/THE APP STORE/);
    // Only the App Store's own section — the winners are houseguests and turn
    // up all over the rest of the week for perfectly innocent reasons.
    // Anchor on the act's own block, not the twist ANNOUNCEMENT that also
    // carries the name "The App Store" and is followed by reaction beats
    // naming half the house.
    const lines = text.split('\n');
    const from = lines.findIndex((l, i) =>
      l.trim() === 'THE APP STORE' && (lines[i + 1] || '').includes('On the shelf'));
    expect(from, 'the App Store act wrote no block of its own').toBeGreaterThan(-1);
    const section = lines.slice(from, from + 4).join('\n');

    const html = rpBuildBBAppStore(ep, act);
    for (const w of act.winners) {
      expect(section, `${w.name} was named in the transcript`).not.toContain(w.name);
      expect(html, `${w.name} was named on the screen`).not.toContain(w.name);
    }
  });
});
