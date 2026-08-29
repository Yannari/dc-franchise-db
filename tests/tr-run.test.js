// ══════════════════════════════════════════════════════════════════════
// tr-run.test.js — the castle is REACHABLE, which is the whole of Task 7
// ══════════════════════════════════════════════════════════════════════
//
// Everything the castle needed existed before this: an engine that plays a
// season, an export, seven screens and a transcript. None of it could be
// started from the page. That is this project's signature bug class wearing
// its largest possible size — a whole show written, tested and unreachable —
// and every guard in this file is a guard on reachability rather than on
// behaviour.
//
// FOUR THINGS ARE INVISIBLE BY LOOKING AT THE SCREEN and are asserted here:
//
//   1. THE FLAG. `formatIsRunnable('traitors')` gates the setup screen, Quick
//      Setup's "not wired" badge and the run tab. It reads `window._trRunnable`
//      and only js/tr-run.js sets it — so importing that module IS the wiring,
//      and a refactor that drops the import silently un-ships the show.
//   2. THE ENDGAME SURVIVES THE QUEUE. `playTraitorsSeason` attaches
//      `tr.endgame` to the LAST row AFTER every row is written, not inside
//      `_recordEpisode`. Any path that hands rows to the UI one at a time can
//      therefore lose the season's ending and nothing on screen would say so.
//   3. BOTH DOORS REACH THE TIMELINE. This is the only show with two ways out.
//      `getEpisodeEliminations` knew every Total Drama shape and none of the
//      castle's, so a night that removed two people reported one.
//   4. NO OTHER SHOW'S WORDS ON THE CASTLE'S CARDS. The episode card asked a
//      castle for its Immunity and its Tribal.
//
// FILENAME: deliberately not `*-audit.test.js` (excluded from `npm test`) and
// not in vitest.slow.js. Collection verified with `npx vitest list`.
import { afterAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gs as gsRef, setGs, setPlayers, players, seasonConfig, relationships,
  gsCheckpoints, repairGsSets, TWIST_CATALOG, formatIsRunnable, defaultConfig } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { isTraitorsSeason, simulateTraitorsEpisode, traitorsEpisodesLeft } from '../js/tr-run.js';
import { getEpisodeEliminations, renderEpisodeHistory, renderEpisodeView } from '../js/run-ui.js';
import { exitVerbs } from '../js/shows.js';
import { TRAITORS_SCREENS } from '../js/vp-tr/screens.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);

// run-ui.js reads most of its world as bare globals, exactly the way main.js
// wires it in a browser. Same set-up as tests/bb-replay-episode.test.js, and
// the same reason: `gs` in particular has to be a real setter or the module's
// own reassignment goes nowhere.
const STUBBED = ['players', 'seasonConfig', 'relationships', 'pStats', 'pronouns',
  'ordinal', 'getBond', 'getPerceivedBond', 'bKey', 'bondLabel', 'romanticCompat',
  'TWIST_CATALOG', 'gsCheckpoints', 'repairGsSets', 'updatePopularity',
  'saveGameState', 'renderRunTab', '_idbDelete', '_idbPut', '_autoRevealSpoiler',
  'viewingEpNum', 'isBigBrotherSeason', 'houseIsAtFinale', 'tribeColor'];
const priorGlobals = new Map();
let gsDescribed = false;

function castle(cfg = {}, seed = null) {
  for (const k of STUBBED) if (!priorGlobals.has(k)) priorGlobals.set(k, globalThis[k]);
  if (!gsDescribed) {
    Object.defineProperty(globalThis, 'gs', {
      configurable: true, get: () => gsRef, set: v => setGs(v),
    });
    gsDescribed = true;
  }
  setPlayers(ROSTER.map(p => ({ ...p })));
  Object.assign(globalThis, { players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG,
    gsCheckpoints, repairGsSets,
    updatePopularity: () => {}, saveGameState: () => {}, renderRunTab: () => {},
    _idbDelete: () => {}, _idbPut: () => {}, _autoRevealSpoiler: () => {},
    viewingEpNum: null, isBigBrotherSeason: () => false,
    houseIsAtFinale: () => false, tribeColor: () => '#fff',
  });
  Object.assign(seasonConfig, defaultConfig(), { format: 'traitors', traitorCount: 3,
    trPotCeiling: 120000, ...cfg });
  setGs({ initialized: true, bonds: {}, activePlayers: players.map(p => p.name),
    episodeHistory: [], episode: 0, phase: 'pre-merge' });
  // THE SEED IS FIXED HERE AND THE RUN MODULE'S OWN IS NOT USED. `_seed()`
  // draws from Math.random so that two seasons of the same show differ, which
  // is right for a viewer and wrong for a guard: an arm that needs a night
  // removing two people, or an offer, passes or fails on the draw. Set on the
  // state exactly as the run module would have set it, so the path under test
  // is unchanged.
  if (seed != null) gsRef._trSeed = seed;
  return gsRef;
}

/**
 * Play the whole thing through the UI's own entry point.
 *
 * SEVERAL SEASONS, not one. A castle season is nine to twelve nights and the
 * rarer branches — an offer, a night that removes two — fire a handful of
 * times across one of them and sometimes not at all. Plan 8 measured the same
 * thing for the refused ultimatum: four seeds is not enough for a rare branch.
 */
const SEEDS = [11, 23, 37, 41, 59];
function airWholeSeason(seed = SEEDS[0], cfg) {
  castle(cfg, seed);
  const aired = [];
  for (let i = 0; i < 60; i++) {
    const row = simulateTraitorsEpisode();
    if (!row) break;
    aired.push(row);
  }
  return aired;
}
/** Every night of every seeded season, each season played once. */
function airEverySeason() {
  return SEEDS.map(s => airWholeSeason(s));
}

afterAll(() => {
  for (const k of STUBBED) {
    if (priorGlobals.has(k)) globalThis[k] = priorGlobals.get(k);
    else delete globalThis[k];
  }
  delete globalThis.gs;
});

// ── GUARD 1: THE SHOW CAN BE STARTED AT ALL ───────────────────────────
describe('the castle is startable from the page', () => {
  it('importing the run module is what makes the show runnable', () => {
    // Not "the flag is true" — the claim is that THIS module is what sets it,
    // because that is the fact a refactor breaks. The setup screen's warning,
    // Quick Setup's badge and the run tab all read `formatIsRunnable`.
    expect(typeof window, 'no window: the flag has nowhere to live').toBe('object');
    expect(window._trRunnable, 'js/tr-run.js did not arm the run loop').toBe(true);
    expect(formatIsRunnable({ format: 'traitors' })).toBe(true);
    // and the gate really is a gate, or the arm above proves nothing
    window._trRunnable = false;
    expect(formatIsRunnable({ format: 'traitors' })).toBe(false);
    window._trRunnable = true;
    expect(formatIsRunnable({ format: 'traitors' })).toBe(true);
  });

  it('and the run loop knows a castle when it sees one', () => {
    castle();
    expect(isTraitorsSeason()).toBe(true);
    seasonConfig.format = 'total-drama';
    expect(isTraitorsSeason(), 'every season is a castle').toBe(false);
    seasonConfig.format = 'big-brother';
    expect(isTraitorsSeason()).toBe(false);
  });
});

// ── GUARD 2: A SEASON PLAYS, AND ENDS ─────────────────────────────────
describe('a castle season plays from the run loop and ends', () => {
  it('airs every night the engine wrote, in order, once each', () => {
    const aired = airWholeSeason();
    expect(aired.length, 'the run loop produced no episodes at all')
      .toBeGreaterThan(5);
    expect(gsRef.episodeHistory.length).toBe(aired.length);
    // In order and once each: a queue that re-shifted or skipped would still
    // produce "some episodes".
    expect(aired.map(r => r.num)).toEqual(aired.map((_, i) => i + 1));
    expect(new Set(aired.map(r => r.num)).size).toBe(aired.length);
    for (const row of aired) expect(row.format).toBe('traitors');
    // and it STOPS, rather than running to the 60 the loop allows
    expect(gsRef.phase).toBe('complete');
    expect(traitorsEpisodesLeft()).toBe(0);
    expect(simulateTraitorsEpisode(), 'a finished season aired another night')
      .toBe(null);
  });

  it('the ending survives the queue, which is where it could be lost', () => {
    // `tr.endgame` is attached to the last row AFTER every row is written —
    // not inside `_recordEpisode` — so a run path that rebuilds or re-derives
    // history hands the viewer a season that simply stops. Nothing on screen
    // would say so: every other night looks exactly right.
    let checked = 0;
    for (const aired of airEverySeason()) {
      const last = aired[aired.length - 1];
      expect(last.tr.endgame, 'the season aired without its ending').toBeTruthy();
      expect(last.tr.endgame.asks.length, 'an endgame with no question in it')
        .toBeGreaterThan(0);
      // and on the LAST row only, or "the endgame is on a row" is satisfied by
      // any row and the placement is not being checked at all.
      const carriers = aired.filter(r => r.tr.endgame);
      expect(carriers.length, 'more than one row carries the phase').toBe(1);
      expect(carriers[0]).toBe(last);
      checked++;
    }
    expect(checked, 'no season was played').toBe(SEEDS.length);
  });

  it('and the room on screen is the room the row recorded', () => {
    const aired = airWholeSeason();
    for (const row of aired) {
      expect(Array.isArray(row.tr.living)).toBe(true);
    }
    expect(gsRef.activePlayers).toEqual(aired[aired.length - 1].tr.living);
    expect(gsRef.activePlayers.length, 'nobody survived, or nobody left')
      .toBeGreaterThan(0);
    expect(gsRef.activePlayers.length).toBeLessThan(ROSTER.length);
  });
});

// ── GUARD 3: EVERY FIELD THE SCREENS READ IS ON EVERY ROW ─────────────
describe('every row the run loop airs carries what the screens read', () => {
  it('the whole record, on every night, including the two Task 4 added', () => {
    const all = airEverySeason().flat();
    expect(all.length, 'no season was played').toBeGreaterThan(40);
    let missions = 0; let offers = 0; let conclaves = 0;
    for (const row of all) {
      for (const key of ['ep', 'cast', 'living', 'goneBefore', 'powers', 'dawn',
        'pot', 'potCeiling']) {
        expect(row.tr[key], `ep ${row.num}: tr.${key} is missing`).toBeDefined();
      }
      // `mission` and `recruitment` are legitimately null on plenty of rows —
      // what must never happen is the KEY being absent, because a screen
      // registered off `!!r.tr.mission` cannot tell "no afternoon" from "the
      // field was never written".
      expect('mission' in row.tr, `ep ${row.num}: tr.mission was never written`).toBe(true);
      expect('recruitment' in row.tr, `ep ${row.num}: tr.recruitment was never written`).toBe(true);
      if (row.tr.mission) missions++;
      if (row.tr.recruitment) offers++;
      if (row.tr.conclave) conclaves++;
    }
    // Counted before anything is concluded from them: a coverage claim over a
    // season where none of these ever fired is a claim about nothing.
    expect(missions, 'no afternoon ran in any season').toBeGreaterThan(20);
    expect(conclaves, 'the pact never met').toBeGreaterThan(15);
    // The offer is the rare one and is measured rather than assumed: it needs
    // the room to have banished a Traitor first, so it fires a handful of
    // times across five seasons and never at all across some single ones.
    expect(offers, 'no offer was ever made').toBeGreaterThan(0);
  });

  it('and exactly one thing in this repo writes a castle row', () => {
    // The brief's "add the fields to every episodeHistory.push" is discharged
    // by there being ONE. Twenty pushes exist across episode.js, bb-run.js and
    // finale.js and not one of them can produce a Traitors row, so the field
    // set cannot drift between writers — but only while that stays true.
    const files = ['js/episode.js', 'js/bb-run.js', 'js/finale.js', 'js/tr/headless.js',
      'js/savestate.js', 'js/run-ui.js', 'js/tr-run.js'];
    const writers = [];
    for (const f of files) {
      const src = readFileSync(new URL('../' + f, import.meta.url), 'utf8');
      if (/format:\s*'traitors'/.test(src)) writers.push(f);
    }
    expect(writers, 'a second module now stamps a castle row').toEqual(['js/tr/headless.js']);
  });
});

// ── GUARD 4: BOTH DOORS REACH THE TIMELINE ────────────────────────────
describe('the timeline reports both of the show\'s doors', () => {
  it('a night that removes two people reports two', () => {
    const doubles = airEverySeason().flat().filter(r => (r.exits || []).length > 1);
    expect(doubles.length, 'no night removed two people, so nothing was checked')
      .toBeGreaterThan(15);
    for (const row of doubles) {
      const said = getEpisodeEliminations(row);
      for (const x of row.exits) {
        expect(said, `ep ${row.num}: ${x.name} left by the ${x.channel} door and the timeline lost them`)
          .toContain(x.name);
      }
      expect(said.length).toBe(new Set(row.exits.map(x => x.name)).size);
    }
  });

  it('and a murder is never reported as a vote', () => {
    const [banishWord, murderWord] = exitVerbs('traitors');
    expect(banishWord).not.toBe(murderWord);
    let murders = 0;
    for (const row of airEverySeason().flat()) {
      for (const x of (row.exits || [])) {
        if (x.channel === 'murder') { murders++; expect(x.verb).toBe(murderWord); }
        if (x.channel === 'banishment') expect(x.verb).toBe(banishWord);
        // `eliminated` is the public vote alone and must stay that way: nine
        // readers in this repo mean the vote by it.
        if (x.channel === 'murder') expect(row.eliminated).not.toBe(x.name);
      }
    }
    expect(murders, 'nobody was murdered in any season').toBeGreaterThan(15);
  });

  it('and the other two shows answer exactly what they answered before', () => {
    // THE SHARED HELPER IS THE RISK. `getEpisodeEliminations` is read by the
    // hub card, the season timeline and the episode trail on all three shows,
    // and the castle's arm was added to it. These rows are the shapes the
    // other two actually write — a pre-merge camp night, a double boot, a
    // house week, a Split House week whose `evicted` is an OBJECT under
    // `splitHouse` — and the answers are the ones the helper gave before the
    // castle existed.
    const cases = [
      ['a camp night', { num: 3, eliminated: 'Beth' }, ['Beth']],
      ['a double boot', { num: 6, eliminated: 'Beth', firstEliminated: 'Brick' },
        ['Brick', 'Beth']],
      ['a multi-tribal', { num: 4, multiTribalElims: ['Amy', 'Axel'], eliminated: 'Amy' },
        ['Amy', 'Axel']],
      ['a house week',
        { num: 5, format: 'big-brother', isBigBrother: true, eliminated: 'Bowie' },
        ['Bowie']],
      ['a double eviction',
        { num: 8, format: 'big-brother', eliminated: 'Bowie', alsoEliminated: 'Chase' },
        ['Bowie', 'Chase']],
      ['a Split House week', {
        num: 7, format: 'big-brother', eliminated: 'Bowie',
        // The shape that would have printed [object Object]: `evicted` here is
        // a map of HOH to evictee, not a name.
        splitHouse: { evicted: { Bowie: 'Chase', Brick: 'Amy' } },
        alsoEliminated: 'Amy',
      }, ['Bowie', 'Amy']],
      ['a night nobody left', { num: 2, eliminated: null }, []],
    ];
    for (const [what, row, want] of cases) {
      const got = getEpisodeEliminations(row);
      expect(got, `${what}: the shared helper changed its answer`).toEqual(want);
      for (const n of got) {
        expect(typeof n, `${what}: a name came back as something other than a string`)
          .toBe('string');
      }
    }
    expect(cases.length).toBe(7);
  });
});

// ── GUARD 5: THE CASTLE'S CARDS ARE WRITTEN IN THE CASTLE'S WORDS ─────
describe('the run tab does not print another show\'s words over a castle', () => {
  function mountRunTab() {
    document.body.innerHTML = '<div id="ep-history-grid"></div>'
      + '<div id="ep-result-card"></div><textarea id="ep-output-text"></textarea>'
      + '<div id="run-main"></div>';
  }

  it('the episode timeline draws castle badges and no camp vocabulary', () => {
    const aired = airWholeSeason();
    mountRunTab();
    renderEpisodeHistory();
    const html = document.getElementById('ep-history-grid').innerHTML;
    expect(html.length, 'the timeline rendered nothing').toBeGreaterThan(200);
    expect(foreignWordsIn(html, 'traitors'),
      'the castle timeline printed another show\'s vocabulary').toEqual([]);
    // Every badged screen's pill appears on the nights that screen appears on,
    // and on no others — the pills are asked of TRAITORS_SCREENS, so this is
    // also the guard that a NEW screen's pill cannot be forgotten.
    const badged = TRAITORS_SCREENS.filter(s => s.badge);
    expect(badged.length, 'no screen carries a badge').toBeGreaterThan(3);
    const cards = [...document.querySelectorAll('.ep-hist-card')];
    expect(cards.length).toBe(aired.length);
    let pills = 0;
    for (let i = 0; i < aired.length; i++) {
      const text = cards[i].innerText || cards[i].textContent;
      for (const s of badged) {
        const want = s.when(aired[i]);
        expect(text.includes(s.badge.text),
          `ep ${aired[i].num}: "${s.badge.text}" pill ${want ? 'missing' : 'shown'} and the screen is ${want ? 'registered' : 'not'}`)
          .toBe(want);
        if (want) pills++;
      }
    }
    expect(pills, 'not one pill was drawn').toBeGreaterThan(10);
  });

  it('the episode card asks a castle no Total Drama question', () => {
    const aired = airWholeSeason();
    mountRunTab();
    const [banishWord, murderWord] = exitVerbs('traitors');
    let checked = 0;
    for (const row of aired) {
      renderEpisodeView(row);
      const card = document.getElementById('ep-result-card');
      const text = (card.textContent || '').replace(/\s+/g, ' ');
      expect(text.length, `ep ${row.num}: the card is empty`).toBeGreaterThan(20);
      expect(foreignWordsIn(text, 'traitors'),
        `ep ${row.num}: the card printed another show's vocabulary`).toEqual([]);
      // Both doors are named on every card, from the registry, whether or not
      // anybody went through them tonight.
      expect(text.toLowerCase()).toContain(banishWord);
      expect(text.toLowerCase()).toContain(murderWord);
      for (const x of (row.exits || [])) {
        expect(text, `ep ${row.num}: ${x.name} left and the card does not say so`)
          .toContain(x.name);
      }
      checked++;
    }
    expect(checked, 'no card was checked').toBeGreaterThan(5);
  });
});
