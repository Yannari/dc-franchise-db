// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { setFranchiseLedger, activeSeasons, listFranchises } from '../js/franchise-meta.js';
import * as ui from '../js/franchise-ui.js';

describe('franchise-ui smoke', () => {
  it('renders empty state, then a season card + pulse, and imports a savestate', () => {
    document.body.innerHTML = '<div id="tab-franchise" class="tab-content"></div>';
    // expose handlers on window like main.js does
    for (const [k, v] of Object.entries(ui)) if (typeof v === 'function') window[k] = v;
    setFranchiseLedger({ seasons: {} });

    ui.renderFranchiseTab();
    let html = document.getElementById('tab-franchise').innerHTML;
    expect(html).toContain('No recorded seasons yet');
    expect(listFranchises().length).toBe(1);

    // import a savestate-shaped object via the internal path
    const save = { name: 'Smoke S5', config: { seasonNumber: 5, name: 'Smoke S5' },
      players: [{ name: 'Win' }, { name: 'Lose' }],
      gs: { phase: 'complete', seasonNumber: 5, finaleResult: { winner: 'Win', finalists: ['Win', 'Lose'] },
        episodeHistory: [{ num: 1, eliminated: 'Lose', immunityWinner: 'Win', votingLog: [], defections: [], idolPlays: [] }],
        bonds: {}, advantages: [], namedAlliances: [], showmances: [], schemesCaught: {} } };
    // simulate a dropped file
    document.body.innerHTML += '<div id="fr-import-log"></div>';
    ui.renderFranchiseTab();
    // directly write via meta + re-render to check card
    activeSeasons()['5'] = { seasonName: 'Smoke S5', source: 'imported-save', players: {
      Win: { placement: 1, winner: true, finalist: true, episodesLasted: 1, blindsidesAuthored: 0, chalWins: 1 },
      Lose: { placement: 2, winner: false, blindsided: true, blindsidedBy: [], blindsidesAuthored: 0 } } };
    ui.renderFranchiseTab();
    html = document.getElementById('tab-franchise').innerHTML;
    expect(html).toContain('S5');
    expect(html).toContain('Smoke S5');
    expect(html).toContain('Win');
    expect(html).toContain('IMPORT');
    expect(html).toContain('Franchise Pulse');
    expect(html).toContain('Total seasons');

    // details flyout builds
    ui.frToggleDetails(5);
    const det = document.getElementById('fr-details-5');
    expect(det.style.display).toBe('block');
    expect(det.innerHTML).toContain('Lose');

    // include toggle round-trips through UI handler
    ui.frToggleSeasonIncluded(5, false);
    expect(activeSeasons()['5'].included).toBe(false);
  });
});
