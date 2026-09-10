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

  it('has no transcript on the row — the condition being worked around', () => {
    /* THE CONTROL ARM. If drag-race ever starts writing summaryText at air
       time, the export fix below becomes untestable by this file: it would
       pass whether or not it ran. Then the checkpoint cost is back and this
       test is where that gets noticed. */
    for (let i = 0; i < 3; i++) dr.simulateDragEpisode();
    for (const row of core.gs.episodeHistory) {
      expect(String(row.summaryText || '')).toBe('');
    }
    expect(importerKeeps({ gs: core.gs }).length).toBe(0);
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
    /* NOT byte-exact, and the reason matters. `_buildSeasonSaveData` has
       always run gs through prepGsForSave/repairGsSets, and the repair half
       creates any SET_FIELDS entry the state was missing -- about 440 bytes of
       `"field":{}` on a fresh season, unrelated to this change. What must not
       happen is growth on the order of a transcript, which is 50-80KB each. */
    expect(JSON.stringify(core.gs).length - before).toBeLessThan(2000);
    for (const row of core.gs.episodeHistory) {
      expect(String(row.summaryText || '')).toBe('');
    }
  });

  it('fills a season that was already played before the fix existed', () => {
    // The user's case: Drag Race season 1 is on disk with no transcripts, and
    // a write-on-air fix would never reach it. Deriving at export does.
    for (let i = 0; i < 3; i++) dr.simulateDragEpisode();
    const stale = JSON.parse(JSON.stringify(core.gs));   // what is stored today
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
    expect(html).toContain('onclick="exportSeasonJson()');
    // "Export Season" in the sidebar is the publish pipeline and stays that way.
    expect(html).toContain('>Export Season</button>');
    expect(read('js/run-ui.js')).toContain('onclick="exportSeasonJson()"');
  });

  it('leaves the publish pipeline calls alone', () => {
    // run-ui passes a status callback to those two; that is stats-export's
    // signature, and repointing them would have broken the publish flow.
    const runUi = read('js/run-ui.js');
    expect((runUi.match(/window\.exportSeason\(/g) || []).length).toBe(2);
  });
});
