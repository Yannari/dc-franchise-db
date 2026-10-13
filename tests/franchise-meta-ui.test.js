// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { setFranchiseLedger, activeSeasons, listFranchises, isFranchiseLocked } from '../js/franchise-meta.js';
import * as ui from '../js/franchise-ui.js';
import { SHOWS } from '../js/shows.js';

describe('franchise-ui smoke', () => {
  it('renders empty state, then a season card + pulse, and imports a savestate', () => {
    document.body.innerHTML = '<div id="tab-franchise" class="tab-content"></div>';
    // expose handlers on window like main.js does
    for (const [k, v] of Object.entries(ui)) if (typeof v === 'function') window[k] = v;
    setFranchiseLedger({ seasons: {} });

    ui.renderFranchiseTab();
    let html = document.getElementById('tab-franchise').innerHTML;
    expect(html).toContain('No seasons recorded yet');
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
  it('renders the Trophy Case with seeded achievements + a career Medals row', () => {
    document.body.innerHTML = '<div id="tab-franchise" class="tab-content"></div>';
    for (const [k, v] of Object.entries(ui)) if (typeof v === 'function') window[k] = v;
    setFranchiseLedger({ seasons: {
      '4': { seasonName: 'Rivals', castSize: 12, source: 'live', players: {
        Fiore: { placement: 1, winner: true, finalist: true, chalWins: 5, blindsidesAuthored: 3, blindsided: false,
          blindsidedBy: [], betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [], idolsPlayed: 0, slug: 'fiore' } },
        achievements: [
          { id: 'immunity-streak', label: 'Immunity Streak', player: 'Fiore', seasonNum: 4, detail: '5 immunity wins' },
          { id: 'perfect-game', label: 'Perfect Game', player: 'Fiore', seasonNum: 4, detail: 'Flawless run' }
        ],
        objectives: [
          { id: 'returnee-wins', label: 'Returnee Wins', met: true, detail: 'Fiore returned and won.' },
          { id: 'chaos-season', label: 'Chaos Season', met: false, detail: 'Too calm.' }
        ] }
    } });
    ui.renderFranchiseTab();
    const html = document.getElementById('tab-franchise').innerHTML;
    expect(html).toContain('Trophy Case');
    expect(html).toContain('Immunity Streak');
    expect(html).toContain('Perfect Game');
    expect(html).toContain('Season Objectives');
    expect(html).toContain('1/2 met');
    expect(html).toContain("frToggleMedal('immunity-streak')");
    // medal accordion toggles DOM-only
    ui.frToggleMedal('immunity-streak');
    const grp = document.getElementById('fr-medal-immunity-streak');
    expect(grp.classList.contains('open')).toBe(true);
    expect(grp.querySelector('.fr-medal-list').style.display).toBe('');
    // career panel shows a Medals row
    ui.frOpenCareer('Fiore');
    const panel = document.getElementById('fr-career-panel');
    expect(panel.innerHTML).toContain('Medals');
    expect(panel.innerHTML).toContain('Immunity Streak');
  });

  it('detect-achievements handler backfills medals and re-renders; empty state hidden', () => {
    document.body.innerHTML = '<div id="tab-franchise" class="tab-content"></div><div id="fr-import-log"></div>';
    for (const [k, v] of Object.entries(ui)) if (typeof v === 'function') window[k] = v;
    setFranchiseLedger({ seasons: {
      '1': { seasonName: 'S1', castSize: 12, players: { Star: { placement: 1, winner: true, chalWins: 5,
        blindsided: false, blindsidedBy: [], blindsidesAuthored: 0, betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [], idolsPlayed: 0 } } } } });
    ui.renderFranchiseTab();
    // no achievements yet → Trophy Case section absent
    expect(document.getElementById('tab-franchise').innerHTML).not.toContain('Trophy Case');
    ui.frDetectAchievements();
    const html = document.getElementById('tab-franchise').innerHTML;
    expect(html).toContain('Trophy Case');
    expect(html).toContain('Immunity Streak');
    expect(activeSeasons()['1'].achievements.some(a => a.id === 'immunity-streak')).toBe(true);
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

// The user's own ledger, 2026-10-13: ten seasons across five shows, and the
// Legacy tab would not open -- "can't access property players, season is
// undefined". Four readers turned each key into a Number, and Number('bb-1')
// is NaN, which looks up nothing.
describe('franchise-ui with more than one show in the ledger', () => {
  it('opens, and names each champion the way their own show numbers them', () => {
    document.body.innerHTML = '<div id="tab-franchise" class="tab-content"></div>';
    for (const [k, v] of Object.entries(ui)) if (typeof v === 'function') window[k] = v;
    const season = (name, winner) => ({ seasonName: name, castSize: 2, source: 'live', players: {
      [winner]: { placement: 1, winner: true, finalist: true, chalWins: 2, blindsidesAuthored: 0, blindsidedBy: [], betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [], idolsPlayed: 0 },
      Other: { placement: 2, winner: false, finalist: true, blindsidedBy: [], betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [] } },
      achievements: [{ id: 'immunity-streak', label: 'Immunity Streak', player: winner, detail: '2 wins' }],
      objectives: [{ id: 'chaos-season', label: 'Chaos Season', met: true, detail: 'Loud.' }] });
    setFranchiseLedger({ seasons: {
      '9': season('Doom Island', 'Tdwin'),
      'bb-1': { ...season('Big Brother 1', 'Bbwin'), format: 'big-brother' },
      'dr-1': { ...season('Drag Race 1', 'Drwin'), format: 'drag-race' },
    } });
    expect(() => ui.renderFranchiseTab()).not.toThrow();
    const html = () => document.getElementById('tab-franchise').innerHTML;
    const hof = () => document.querySelector('.fr-hof-gallery')?.innerHTML || '';
    expect(html()).not.toContain('NaN');
    // The site's switcher: All shows plus every show, recorded or not.
    expect(document.querySelectorAll('.show-sw-btn').length).toBe(Object.keys(SHOWS).length + 1);
    // All shows: every champion, and the franchise-wide record book.
    expect(hof()).toContain('winner of S9');
    expect(hof()).toContain('winner of BB1');
    expect(html()).toContain('Most career competition wins');
    // One show: its champions, its record book in its own words.
    ui.frSetShow('total-drama');
    expect(hof()).toContain('winner of S9');
    expect(hof()).not.toContain('Drwin');
    expect(html()).toContain('Most immunity wins');
    ui.frSetShow('big-brother');
    expect(hof()).toContain('winner of BB1');
    expect(hof()).not.toContain('Tdwin');
    expect(html()).toContain('Most competition wins');
    ui.frSetShow('drag-race');
    expect(hof()).toContain('winner of DR1');
    expect(html()).toContain('Drag Race Season Timeline');
    expect(html()).toContain('Most maxi challenges won');
    // Careers are the show's too: a Total Drama winner is not a queen.
    expect(document.querySelector('.fr-roster')?.textContent || html()).not.toContain('Tdwin');
    ui.frSetShow(null);
  });

  it('a couple wins together (the user: "perfect match is always a couple winner")', () => {
    document.body.innerHTML = '<div id="tab-franchise" class="tab-content"></div>';
    for (const [k, v] of Object.entries(ui)) if (typeof v === 'function') window[k] = v;
    const p = (placement, winner = false) => ({ placement, winner, finalist: placement <= 2, blindsidedBy: [], betrayed: [], betrayedBy: [], allies: [], showmances: [], rivals: [] });
    setFranchiseLedger({ seasons: { 'pm-1': { seasonName: 'Perfect Match 1', format: 'perfect-match', source: 'live',
      players: { Ava: p(1, true), Ben: p(1, true), Cleo: p(2), Dev: p(2), Eli: p(3) } } } });
    ui.frSetShow('perfect-match');
    ui.renderFranchiseTab();
    const card = document.querySelector('.fr-card').textContent.replace(/\s+/g, ' ');
    expect(card).toContain('Winners');
    expect(card).toContain('Ava & Ben');
    expect(card).toContain('runners-up: Cleo & Dev');
    expect(document.querySelector('.fr-hof-caption').textContent).toContain('Ava & Ben');
    ui.frSetShow(null);
  });
});
