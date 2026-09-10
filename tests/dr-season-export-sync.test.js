// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-season-export-sync.test.js — a drag season can be synced into the
// Control Room
// ══════════════════════════════════════════════════════════════════════
//
// Reported from the live site: "Sync Simulator" on current-season.html
// answered "Direct access is unavailable here. Choose the JSON made by
// Simulator → Export Season." for Drag Race season 1, and the file it then
// asked for did not work either.
//
// Neither half of that message was true. current-season.html keeps only
// episodes with a non-empty `summaryText`, and drag-race is the one format
// that never writes the field: Total Drama writes it in episode.js, Big
// Brother in bb-run.js, and js/dr-run.js has no such line. Every drag episode
// was filtered out, the importer threw "no episodes", and a catch-all reported
// that as an access problem.
//
// THE TRANSCRIPT WAS NEVER MISSING -- generateSummaryText has dispatched
// drag-race to generateDragSummaryText for as long as the show has existed,
// and produces 50-80KB an episode. It was simply never carried anywhere the
// Control Room could read it.
//
// It is derived at EXPORT rather than stored on the row on purpose. See
// _fillTranscriptsForExport in js/cast-ui.js: `_saveEpisodeCheckpoint`
// deep-clones the whole gs once per episode, so a transcript on the row is
// re-copied into every later checkpoint.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import * as core from '../js/core.js';
import { generateSummaryText } from '../js/text-backlog.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const DRAG = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
const CAST = Array.from({ length: 12 }, (_, i) => ({
  name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'f', archetype: 'wildcard', age: 25,
  stats: Object.fromEntries(STATS.map((s, j) => [s, 3 + ((i * 7 + j * 3) % 7)])),
  drag: Object.fromEntries(DRAG.map((s, j) => [s, 3 + ((i * 5 + j * 4) % 7)])),
}));

/** current-season.html's filter, copied exactly. If it changes there, this
 *  test is measuring something the Control Room no longer does. */
const importerKeeps = payload => {
  const state = payload?.gs?.episodeHistory ? payload.gs : payload;
  const rows = Array.isArray(state?.episodeHistory) ? state.episodeHistory : [];
  return rows.filter(ep => Number(ep?.num) > 0 && String(ep?.summaryText || '').trim());
};

describe('a drag season exported for the Control Room', () => {
  let dr; let castUi;

  beforeEach(async () => {
    core.setPlayers(CAST.map(p => ({ ...p })));
    core.setSeasonConfig({
      ...core.defaultConfig(), format: 'drag-race', seasonNumber: 1,
      drFinale: 'top4', drSchedule: [], twistSchedule: [],
    });
    core.setGs({ episodeHistory: [], eliminated: [], popularity: {}, phase: 'stage', _drSeed: 4711 });
    dr = await import('../js/dr-run.js');
    castUi = await import('../js/cast-ui.js');
    /* js/cast-ui.js reaches these off the global scope rather than importing
       them -- js/main.js is what puts them there in the app (see the module
       pattern note in CLAUDE.md), so a test that loads cast-ui.js directly has
       to stand in for main.js. `gs`, `players` and the rest are the same deal. */
    globalThis.gs = core.gs;
    globalThis.players = core.players;
    globalThis.relationships = [];
    globalThis.preGameAlliances = [];
    globalThis.seasonConfig = core.seasonConfig;
    globalThis.prepGsForSave = core.prepGsForSave;
    globalThis.repairGsSets = core.repairGsSets;
    globalThis.generateSummaryText = generateSummaryText;
  });

  it('writes the night in words the moment it airs', () => {
    /* THE ORIGINAL REPORT, in the user's words: "no transcript/text-backlog
       get printed after an episode" and the copy button "says nothing to
       copy". Both are this field being absent -- _freshTranscript in
       run-ui.js returns `epRecord?.summaryText || ''`, so a drag episode
       had nothing to show and nothing to copy, and the Control Room's sync
       read the same empty field.

       Measured before the fix: 0 of 3 episodes had one. */
    for (let i = 0; i < 3; i++) dr.simulateDragEpisode();
    for (const row of core.gs.episodeHistory) {
      expect(String(row.summaryText || '').length,
        `episode ${row.num} aired with no transcript`).toBeGreaterThan(1000);
    }
    expect(importerKeeps({ gs: core.gs }).length).toBe(3);
  });

  it('says what happened on that night, not a header and nothing else', () => {
    /* A transcript that is only its own title bar would satisfy the length
       check above and still print as an empty episode. This asks for the
       parts of a drag night that cannot be faked by chrome. */
    for (let i = 0; i < 2; i++) dr.simulateDragEpisode();
    const text = core.gs.episodeHistory[1].summaryText;
    expect(text).toContain('DRAG RACE — EPISODE 2');
    for (const q of ['Q1', 'Q2']) expect(text).toContain(q);
    const bodyLines = text.split(String.fromCharCode(10)).filter(l => l.trim());
    expect(bodyLines.length, 'the transcript is a header with no body')
      .toBeGreaterThan(40);
  });

  it('exports every simulated episode with a transcript the importer keeps', () => {
    for (let i = 0; i < 3; i++) dr.simulateDragEpisode();
    const data = castUi._buildSeasonSaveData();
    expect(data.type).toBe('season-save');
    const kept = importerKeeps(data);
    expect(kept.length, 'the Control Room would import no episodes').toBe(3);
    for (const ep of kept) expect(ep.summaryText.length).toBeGreaterThan(200);
  });

  it('leaves the live gs exactly as lean as it was', () => {
    /* The reason this is not the bb-run.js pattern. If the fix ever starts
       writing back into gs, a twelve-episode season pays for it twelve times
       over in checkpoints. */
    for (let i = 0; i < 3; i++) dr.simulateDragEpisode();
    const before = JSON.stringify(core.gs).length;
    castUi._buildSeasonSaveData();
    /* The export must not ADD to the live state -- it fills its own copy.
       NOT byte-exact: `_buildSeasonSaveData` has always run gs through
       prepGsForSave/repairGsSets, and the repair half creates any SET_FIELDS
       entry the state was missing, about 440 bytes of `"field":{}` on a fresh
       season and nothing to do with transcripts. What must not happen is
       growth on the order of one, which is 40-80KB. */
    expect(JSON.stringify(core.gs).length - before).toBeLessThan(2000);
  });

  it('fills a season that was already played before the fix existed', () => {
    // The user's case: Drag Race season 1 is on disk with no transcripts, and
    // a write-on-air fix would never reach it. Deriving at export does.
    for (let i = 0; i < 3; i++) dr.simulateDragEpisode();
    // A season on disk from before the air-time write: the rows are there and
    // the transcripts are not. The export has to fill them anyway, because
    // this is the only season the user actually has.
    const stale = JSON.parse(JSON.stringify(core.gs));
    for (const row of stale.episodeHistory) { delete row.summaryText; delete row.textV; }
    core.setGs(stale);
    globalThis.gs = core.gs;
    expect(importerKeeps({ gs: stale }).length).toBe(0);
    expect(importerKeeps(castUi._buildSeasonSaveData()).length).toBe(3);
  });
});


// ══════════════════════════════════════════════════════════════════════
// And the button that makes the file has to still exist
// ══════════════════════════════════════════════════════════════════════
//
// The fix above is only reachable through a download button, and there wasn't
// one. js/stats-export.js exports `exportSeason` -- the pipeline that publishes
// a FINISHED season -- and js/cast-ui.js exported a different `exportSeason`
// that downloads the JSON at whatever episode the season has reached. js/main.js
// copies every module's functions onto `window` in list order and statsExportMod
// comes after castUiMod, so the download one was overwritten and unreachable.
//
// Both the Season menu's "Export JSON" and the hub's "Export" beside "Save" ran
// the publish flow. A season still airing could not produce a file at all --
// which is the only thing a cross-origin sync can use, because IndexedDB does
// not cross from localhost to the published site.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(join(root, f), 'utf8');

describe('the two exports keep their own names', () => {
  it('does not let stats-export overwrite the JSON download on window', async () => {
    const castUi = await import('../js/cast-ui.js');
    const stats = await import('../js/stats-export.js');
    const shared = Object.keys(castUi)
      .filter(k => typeof castUi[k] === 'function'
        && typeof stats[k] === 'function');
    expect(shared,
      'these names collide, and js/main.js puts stats-export on window last')
      .toEqual([]);
  });

  it('keeps the download under the name the buttons call', async () => {
    const castUi = await import('../js/cast-ui.js');
    expect(typeof castUi.exportSeasonJson).toBe('function');
    // The control arm for the collision test above: if this ever goes back to
    // `exportSeason`, the shared-names check is what fails first.
    expect(castUi.exportSeason).toBeUndefined();
  });

  it('wires the mid-season buttons to the download, not to the publish', () => {
    const html = read('simulator.html');
    // The handler is guarded now — a page running cached older JS says so
    // instead of doing nothing — so this asserts the CALL, not the whole
    // attribute, and that it is not the publish pipeline.
    expect(html).toContain('exportSeasonJson()');
    // "Export Season" in the sidebar is the publish pipeline and stays that way.
    expect(html).toContain('>Export Season</button>');
    expect(read('js/run-ui.js')).toContain('exportSeasonJson()');
  });

  it('leaves the publish pipeline calls alone', () => {
    // run-ui passes a status callback to those two; that is stats-export's
    // signature, and repointing them would have broken the publish flow.
    const runUi = read('js/run-ui.js');
    expect((runUi.match(/window\.exportSeason\(/g) || []).length).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════
// And a season played before any of this still gets its words back
// ══════════════════════════════════════════════════════════════════════
//
// The air-time write above only reaches episodes aired after it. The season
// the user actually has was played without it, so the transcript pane has to
// fill one in when it finds none -- which is what run-ui.js's _freshTranscript
// already did for the castle and for the house, and never did here.
describe('the transcript pane on a season that stored none', () => {
  it('regenerates for a drag row instead of showing nothing to copy', () => {
    const src = read('js/run-ui.js');
    const body = src.slice(src.indexOf('function _freshTranscript'));
    const head = body.slice(0, body.indexOf('return epRecord'));
    expect(head, '_freshTranscript no longer regenerates for drag rows')
      .toContain('_isDragRow(epRecord)');
    // The regenerate condition has to include "there is no text at all",
    // not only "the writer version moved" — a stored-nothing season has no
    // textV either, but a version-only check would still be true here, so
    // this asserts the missing-text arm explicitly.
    expect(head).toContain('!epRecord.summaryText');
    expect(src).toContain("const _isDragRow = ep => !!ep && ep.format === DRAG_FORMAT");
    expect(src).toContain('DRAG_FORMAT } from ');
  });
});
