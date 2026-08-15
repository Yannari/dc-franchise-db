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
import { rpBuildBBAppStore, rpBuildBBDebug, buildVPScreens } from '../js/vp-screens.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { awardWeeklyBucks, credit } from '../js/bb/bb-bucks.js';
import { themeById } from '../js/bb/themes.js';
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

// `theme` is explicit — and defaults to 'none' — because this helper is the
// guard's whole view of the game. It never set the field at all, so the season
// ran unthemed, `theme-beat` never entered the `seen` set, and the guard passed
// OVER the act rather than proving it was handled. This project has shipped
// allowlist-shaped guards that were green about things they never looked at
// (five twists drew nothing under the VP allowlist); a helper that silently
// omits a season option is the same failure wearing different clothes.
function house(twists = [], { theme = 'none' } = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', theme });
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

// Acts that live on the EPISODE and never on a week. summariseWeek takes a
// week, so it could not write these if it wanted to — a branch for one there
// reads as coverage and can never fire. The in-app backlog is built from the
// episode and does write them in full, which is what the per-twist tests
// assert. Verified by construction: bb-run builds this straight into ep.acts
// and neither half-week is ever handed it.
const EPISODE_ONLY = new Set(['split-house']);

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

    // ── and a THEMED week ──
    //
    // A theme books its own twists and its antagonist emits an act type no
    // unthemed season can ever produce. Without this pass the season above ran
    // with no theme, `theme-beat` never reached `seen`, and this guard was
    // green about an act it had never once looked at — the same shape of hole
    // the VP allowlist had. Asserted by name rather than left to the loop,
    // because a pass that silently stops emitting proves nothing.
    for (let seed = 1; seed <= 3; seed++) {
      house([], { theme: 'summer-of-temptation' });
      const ep = withSeededRandom(seed * 23, () => simulateBBEpisode());
      for (const act of ep.acts || []) if (act?.type) seen.add(act.type);
    }
    expect([...seen], 'the themed pass emitted no antagonist act').toContain('theme-beat');

    // ── High Roller's ──
    //
    // The money theme emits an act no other season can (`bb-bucks`), so it gets
    // a pass of its own rather than riding on the temptation one. The theme id
    // is not REGISTERED yet — that lands with the theme itself — so until it
    // does, `seasonConfig.theme` resolves to nothing and this pass plays an
    // ordinary week and adds nothing new. It is written now, and armed by
    // `themeById`, so the day the theme is registered this loop starts feeding
    // `bb-bucks` into the checks below instead of somebody having to remember
    // to come back and add it. The assertion is conditional on registration and
    // not on emission: a registered theme that stops paying fails here.
    for (let seed = 1; seed <= 3; seed++) {
      house([], { theme: 'high-rollers' });
      const ep = withSeededRandom(seed * 29, () => simulateBBEpisode());
      for (const act of ep.acts || []) if (act?.type) seen.add(act.type);
    }
    if (themeById('high-rollers')) {
      expect([...seen], "the High Roller's pass emitted no payout").toContain('bb-bucks');
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
      if (!runCases.has(type) && !EPISODE_ONLY.has(type)) missingRun.push(type);
      if (!backlogCases.has(type)) missingBacklog.push(type);
    }

    expect(missingRun,
      `these acts are emitted but summariseWeek (bb-run.js) never writes them: ${missingRun.join(', ')}`)
      .toEqual([]);
    expect(missingBacklog,
      `these acts are emitted but the text backlog (text-backlog.js) never writes them: ${missingBacklog.join(', ')}`)
      .toEqual([]);

    // ── the VP ──
    //
    // This used to be an ALLOWLIST of eight act types that must draw, which is
    // the wrong shape for a guard: it only catches the twists somebody
    // remembered to add to it. Five twists shipped text-only underneath it —
    // the Coin, America's Nominee, the Care Package, the Safety Suite and the
    // Halting Hex all reached both transcripts and drew nothing, and the test
    // stayed green because none of them were on the list.
    //
    // So it is a DENYLIST now. Every act the engine emits must have a screen
    // unless it is named here with a reason, which means a new twist fails
    // this test by default instead of passing by omission.
    const PROSE_ONLY = new Map([
      ['safety', 'folded into the nomination and veto prose'],
      ['have-nots', 'drawn, but only when the twist is on — see its own case'],
      ['generic-result', 'a competition with no signature screen of its own'],
      ['tiebreaker', 'read out inside the eviction screen'],
      ['arena', 'drawn by the Block Buster screens, not by act type'],
      ['roadkill-win', 'the memory record, not an act with a scene in it'],
      ['power-expired', 'a note to the VIEWER that a power died unspent — the house is '
        + 'never told, so there is no scene to draw, only a line in the transcripts'],
      ['temptation-curse', 'drawn on the nomination ceremony as the chair nobody filled — '
        + 'the curse has no scene of its own, it IS that third key turning'],
    ]);
    const undrawn = [...seen].sort()
      .filter(type => !vpCases.has(type) && !PROSE_ONLY.has(type) && !FOLDED.has(type));
    expect(undrawn,
      `these acts are emitted but buildVPScreens draws nothing for them: ${undrawn.join(', ')}`)
      .toEqual([]);
    // Every twist in the catalogue, three seeds each, plus three plain weeks —
    // so this grows with the catalogue and blew the default 90s budget the
    // moment it reached fifteen twists. It is slow because it is thorough, not
    // because anything is wrong.
  }, 300000);

  // The payout, in all three writers — and the ledger in none of them.
  //
  // The loop above cannot exercise this yet: the `high-rollers` theme is not
  // registered, so no season emits the act. Rather than leave the three cases
  // unverified until it is, the act is built by its own module — the same
  // function the week calls, so the same shape — dropped onto a REAL week, and
  // each writer is asked to write it.
  it("writes the High Roller's payout in both transcripts and on screen", () => {
    house([], { theme: 'high-rollers' });
    const ep = withSeededRandom(11, () => simulateBBEpisode());
    const week = gs.bb.weeks[gs.bb.weeks.length - 1];

    const already = (ep.acts || []).find(a => a.type === 'bb-bucks');
    const act = already || awardWeeklyBucks({ week, house: gs.activePlayers || [] });
    expect(act, 'the payout act could not be built').toBeTruthy();
    // The week and the episode share one acts array on an ordinary week, so
    // this is guarded — pushing to both put the section into each transcript
    // twice and would have made a duplicate look like coverage.
    if (!already) {
      ep.acts.push(act);
      if (week.acts !== ep.acts) week.acts.push(act);
    }

    // A balance nobody is allowed to print. Distinctive on purpose: if any
    // writer ever reads the ledger instead of the week's payouts, this number
    // turns up in its output.
    for (const name of gs.activePlayers || []) credit(name, 4242);

    const top = act.payouts.filter(p => p.tier === 'top');
    const floor = act.payouts.filter(p => p.tier === 'floor');
    expect(top.length, 'no top tier was paid').toBeGreaterThan(0);

    const runText = summariseWeek(week);
    const backlog = generateBBSummaryText(ep);
    const screen = (buildVPScreens(ep) || []).find(s => s.label === 'The Audience Pays');
    expect(screen, 'buildVPScreens drew nothing for the payout').toBeTruthy();

    for (const [what, text] of [['the run transcript', runText],
      ['the backlog', backlog], ['the screen', screen.html]]) {
      expect(text, `${what} never wrote the payout`).toMatch(/AUDIENCE PAYS/i);
      expect((text.match(/AUDIENCE PAYS/gi) || []).length,
        `${what} wrote the payout more than once`).toBe(1);
      expect(text, `${what} named nobody in the top tier`).toContain(top[0].name);
      // The amount comes off the act rather than being typed here. It was
      // `'100'`, which is a private copy of the tier table: rescaling the tiers
      // in `bb-bucks.js` left this asserting a number the season no longer pays.
      expect(text, `${what} did not print what the top tier was paid`)
        .toContain(String(top[0].amount));
      if (floor.length) expect(text, `${what} dropped the floor tier`).toContain(floor[0].name);
      // THE LEDGER IS PRIVATE. A transcript may say what somebody was PAID
      // this week; it may never say what anybody HAS. The number is checked
      // against the whole output — no part of a week may print it — and the
      // words are checked against the payout's own block, because "the balance
      // of power" is a perfectly innocent phrase elsewhere in a week.
      expect(text, `${what} leaked a balance`).not.toContain('4242');
      const from = text.toUpperCase().indexOf('AUDIENCE PAYS');
      expect(text.slice(from, from + 1400), `${what} named the private number`)
        .not.toMatch(/\bbalances?\b|\bsavings\b|\bin the bank\b/i);
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

describe('the audience standings are reachable in this format', () => {
  it('shows a Fan Pulse panel on the BB debug screen', () => {
    // The ranking existed but only in the Survivor Camp Overview hub, which
    // the Big Brother branch of buildVPScreens never builds — written and
    // unreachable. It matters here because two distributors read popularity:
    // this is the odds board for who gets handed a power.
    house(['bb-app-store']);
    const ep = withSeededRandom(21, () => simulateBBEpisode());
    const html = rpBuildBBDebug(ep);
    expect(html).toMatch(/FAN PULSE/);

    // Everybody still in the house is on it, ranked.
    const pop = ep.popularitySnapshot || ep.gsSnapshot?.popularity || gs.popularity || {};
    const standing = (ep.gsSnapshot?.activePlayers || gs.activePlayers || []);
    expect(standing.length).toBeGreaterThan(0);
    for (const name of standing) {
      expect(html, `${name} is missing from the standings`).toContain(name);
    }

    // Highest popularity is listed first — the panel is a RANKING, not the
    // roster order it was handed.
    const top = [...standing].sort((a, b) => Number(pop[b] || 0) - Number(pop[a] || 0))[0];
    const bottom = [...standing].sort((a, b) => Number(pop[a] || 0) - Number(pop[b] || 0))[0];
    if (Number(pop[top] || 0) !== Number(pop[bottom] || 0)) {
      const panel = html.slice(html.indexOf('FAN PULSE'));
      expect(panel.indexOf(top), 'the standings are not sorted by popularity')
        .toBeLessThan(panel.indexOf(bottom));
    }
  });

  it('a twist reacting to itself does not spawn its own House Life screen', () => {
    // The Hacker and Roadkill emit their blame reaction as a separate post-noms
    // `house` act, which built a second, nearly empty House Life screen right
    // beside the real one — the week looked like it had lost its usual stretch
    // and gained a stub. Twist fallout belongs INSIDE the stretch the house was
    // already having.
    let plain = null, hacked = null;
    for (let seed = 1; seed <= 30 && !hacked; seed++) {
      house(['bb-hacker']);
      const ep = withSeededRandom(seed * 11, () => simulateBBEpisode());
      const blame = (ep.acts || []).filter(a => a.type === 'house' && a.hackerBlame);
      if (blame.length) hacked = { ep, blame };
    }
    expect(hacked, 'no hacked week in 30 seeds').toBeTruthy();

    house();
    const plainEp = withSeededRandom(11, () => simulateBBEpisode());
    plain = (buildVPScreens(plainEp) || []).filter(s => s.label === 'House Life').length;

    const hackedScreens = buildVPScreens(hacked.ep) || [];
    const hackedCount = hackedScreens.filter(s => s.label === 'House Life').length;
    expect(hackedCount, 'the hacker added a House Life screen of its own').toBe(plain);

    // ...and the blame beat is still on screen, folded into the real stretch.
    const beatText = hacked.blame.flatMap(a => a.socialBeats || [])
      .map(b => b.text).find(Boolean);
    if (beatText) {
      const all = hackedScreens.map(s => s.html || '').join('');
      expect(all, 'folding the blame act dropped its narration')
        .toContain(beatText.slice(0, 40));
    }
  });

  it('respects the season switch that turns fan sentiment off', () => {
    house();
    const ep = withSeededRandom(21, () => simulateBBEpisode());
    seasonConfig.popularityEnabled = false;
    const html = rpBuildBBDebug(ep);
    seasonConfig.popularityEnabled = true;
    expect(html).not.toMatch(/FAN PULSE/);
  });
});
