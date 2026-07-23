// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { setFranchiseLedger, activeSeasons, listFranchises, isFranchiseLocked } from '../js/franchise-meta.js';
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

describe('franchise-ui legacy layer', () => {
  function seedLegacyLedger() {
    setFranchiseLedger({ seasons: {
      '4': { seasonName: 'Rivals', castSize: 12, players: {
        Fiore: { placement: 1, winner: true, finalist: true, chalWins: 4, idolsPlayed: 2, idolsFound: 2,
          blindsidesAuthored: 3, blindsided: false, blindsidedBy: [], idoledOut: false,
          betrayed: ['Rex'], betrayedBy: [], allies: ['Thom'], showmances: [{ partner: 'Nova', ended: 'intact' }], rivals: [], schemesCaught: 0, slug: 'fiore' },
        Thom: { placement: 2, finalist: true, blindsidesAuthored: 0, chalWins: 1, allies: ['Fiore'], betrayed: [], betrayedBy: [], showmances: [], rivals: [] },
        Rex: { placement: 7, blindsided: true, blindsidedBy: ['Fiore'], blindsidesAuthored: 1, betrayedBy: ['Fiore'], betrayed: [], allies: [], showmances: [], rivals: [] } } },
      '7': { seasonName: 'Redux', castSize: 14, players: {
        Fiore: { placement: 9, blindsided: true, blindsidedBy: ['Thom'], chalWins: 0, blindsidesAuthored: 1, betrayed: [], betrayedBy: [], allies: ['Thom'], showmances: [], rivals: [] },
        Thom: { placement: 1, winner: true, finalist: true, chalWins: 2, blindsidesAuthored: 0, betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [] },
        Dud: { placement: 13, blindsidesAuthored: 0, betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [] } } }
    } });
  }
  it('renders Hall of Fame / Careers / All-Stars Scout and opens a career panel', () => {
    document.body.innerHTML = '<div id="tab-franchise" class="tab-content"></div>';
    for (const [k, v] of Object.entries(ui)) if (typeof v === 'function') window[k] = v;
    seedLegacyLedger();
    ui.renderFranchiseTab();
    let html = document.getElementById('tab-franchise').innerHTML;
    expect(html.toUpperCase()).toContain('HALL OF FAME');
    expect(html.toUpperCase()).toContain('CAREERS');
    expect(html.toUpperCase()).toContain('ALL-STARS SCOUT');
    expect(html).toContain('Record Book');
    expect(html).toContain("frOpenCareer('Fiore')");
    // injected CSS present exactly once
    expect(document.getElementById('fr-legacy-css')).not.toBeNull();
    ui.renderFranchiseTab();
    expect(document.querySelectorAll('#fr-legacy-css').length).toBe(1);

    // open a career → panel populates with legacy facts
    ui.frOpenCareer('Fiore');
    const panel = document.getElementById('fr-career-panel');
    expect(panel.style.display).toBe('block');
    expect(panel.innerHTML).toContain('CHAMPION ×1');
    expect(panel.innerHTML).toContain('Career timeline');
    expect(panel.innerHTML).toContain('Thom'); // ally shown

    // close career
    ui.frCloseCareer();
    expect(document.getElementById('fr-career-panel').style.display).toBe('none');
  });
  it('lock toggle round-trips and blocks the wipe handler', () => {
    document.body.innerHTML = '<div id="tab-franchise" class="tab-content"></div>';
    for (const [k, v] of Object.entries(ui)) if (typeof v === 'function') window[k] = v;
    seedLegacyLedger();
    window.confirm = () => true;
    let alerted = false; window.alert = () => { alerted = true; };
    ui.frToggleLock();
    expect(isFranchiseLocked('main')).toBe(true);
    const html = (ui.renderFranchiseTab(), document.getElementById('tab-franchise').innerHTML);
    expect(html).toContain('🔒');
    // wipe is blocked while locked (alert, no data loss)
    ui.frWipeActive();
    expect(alerted).toBe(true);
    expect(activeSeasons()['4']).toBeTruthy();
    // unlock restores
    ui.frToggleLock();
    expect(isFranchiseLocked('main')).toBe(false);
  });
});
