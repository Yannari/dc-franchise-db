// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repairGsSets, prepGsForSave } from '../js/core.js';
import { buildSeasonHubModel, buildSeasonOverviewModel, buildSeasonRetrospectiveModel } from '../js/run-ui.js';
import { buildAIContextText, exportAIContextPDF, exportStatisticsPDF, exportSummaryPDF } from '../js/stats-export.js';

const cast = [
  { name:'Legacy A', slug:'legacy-a' },
  { name:'Legacy B', slug:'legacy-b' },
  { name:'Legacy C', slug:'legacy-c' },
];

describe('game-first redesign compatibility', () => {
  it('renders a sparse pre-redesign season without requiring new UI fields', () => {
    const legacy = {
      initialized:true, episode:1, phase:'pre-merge', isMerged:false,
      activePlayers:['Legacy A','Legacy B'], eliminated:['Legacy C'],
      tribes:[{ name:'Old Tribe', members:['Legacy A','Legacy B'] }],
      bonds:{ 'Legacy A||Legacy B':2 },
      episodeHistory:[{
        num:1, eliminated:'Legacy C', votes:{ 'Legacy C':2 },
        votingLog:[{ voter:'Legacy A', voted:'Legacy C' }, { voter:'Legacy B', voted:'Legacy C' }],
        summaryText:'A legacy episode summary.',
      }],
      legacyPrivatePayload:{ untouched:true },
    };
    repairGsSets(legacy);

    expect(() => buildSeasonHubModel(legacy, { name:'Legacy', setting:'hosted-camp' }, cast)).not.toThrow();
    expect(() => buildSeasonOverviewModel(legacy, cast)).not.toThrow();
    const overview = buildSeasonOverviewModel(legacy, cast);
    expect(overview.active).toEqual(['Legacy A','Legacy B']);
    expect(legacy.legacyPrivatePayload).toEqual({ untouched:true });
    expect(legacy.socialStatus).toBeUndefined();
  });

  it('builds a sparse legacy finale and does not invent missing outcomes', () => {
    const legacyFinale = {
      initialized:true, episode:2, phase:'complete', activePlayers:['Legacy A','Legacy B'],
      eliminated:['Legacy C'], jury:[], tribes:[], bonds:{},
      finaleResult:{ winner:'Legacy A', finalists:['Legacy A','Legacy B'], votes:null, finalChallenge:true },
      episodeHistory:[
        { num:1, eliminated:'Legacy C', votes:{ 'Legacy C':2 }, votingLog:[], summaryText:'Episode one.' },
        { num:2, isFinale:true, winner:'Legacy A', finaleFinalists:['Legacy A','Legacy B'], votes:{}, votingLog:[], summaryText:'Finale.' },
      ],
    };

    const model = buildSeasonRetrospectiveModel(legacyFinale, cast);
    expect(model.winner).toBe('Legacy A');
    expect(model.voteTotal).toBe(0);
    expect(model.juryReasoning).toEqual([]);
    expect(model.placements.map(row => row.name)).toEqual(['Legacy A','Legacy B','Legacy C']);
  });

  it('preserves unknown simulation and Debug data through JSON serialization', () => {
    const legacy = {
      episode:4, activePlayers:['Legacy A'], episodeHistory:[],
      knownIdolHoldersPersistent:new Set(['Legacy A']),
      privateDebugTruth:{ target:'Legacy B', confidence:.73, nested:{ source:'legacy' } },
      futureField:{ version:99 },
    };
    prepGsForSave(legacy);
    const loaded = JSON.parse(JSON.stringify(legacy));
    repairGsSets(loaded);

    expect(loaded.knownIdolHoldersPersistent).toBeInstanceOf(Set);
    expect(loaded.knownIdolHoldersPersistent.has('Legacy A')).toBe(true);
    expect(loaded.privateDebugTruth).toEqual({ target:'Legacy B', confidence:.73, nested:{ source:'legacy' } });
    expect(loaded.futureField).toEqual({ version:99 });
  });

  it('keeps JSON/PDF and AI-context export entry points available', () => {
    const castUi = readFileSync(join(process.cwd(), 'js', 'cast-ui.js'), 'utf8');
    expect(castUi).toContain('export function _buildSeasonSaveData');
    expect(castUi).toContain("type: 'season-save'");
    expect(castUi).toContain('gs: JSON.parse(JSON.stringify(gs))');
    expect(typeof buildAIContextText).toBe('function');
    expect(typeof exportAIContextPDF).toBe('function');
    expect(typeof exportStatisticsPDF).toBe('function');
    expect(typeof exportSummaryPDF).toBe('function');
  });

  it('preserves simulator → current-season → Worker payload contracts', () => {
    const currentSeason = readFileSync(join(process.cwd(), 'current-season.html'), 'utf8');
    const worker = readFileSync(join(process.cwd(), 'worker-episode-live.js'), 'utf8');

    expect(currentSeason).toContain('function _simulatedEpisodeRows(payload)');
    expect(currentSeason).toContain('payload?.gs?.episodeHistory ? payload.gs : payload');
    expect(currentSeason).toContain("mode: 'enhance'");
    expect(currentSeason).toContain("mode: 'episode'");
    expect(currentSeason).toContain('seasonSetting: seasonSetting');
    expect(worker).toContain('mode === "episode"');
    expect(worker).toContain('mode === "enhance"');
    expect(worker).toContain('previousEpisodes');
    expect(worker).toContain('seasonSetting');
  });

  it('keeps the Visual Player Debug rebuild path accessible', () => {
    const simulator = readFileSync(join(process.cwd(), 'simulator.html'), 'utf8');
    expect(simulator).toContain("localStorage.getItem('vp_debug')");
    expect(simulator).toContain('title="Toggle Debug Screen"');
    expect(simulator).toContain('buildVPScreens(ep);renderVPScreen();');
  });
});
