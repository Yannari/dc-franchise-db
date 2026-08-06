// The house has no merge, so the timeline stopped claiming it has one.
//
// buildEpisodeMap is shared with Total Drama and hands every season a
// pre-merge/post-merge split, which meant a Big Brother season got a green
// MERGE card on a week where nothing merges — there are no tribes to dissolve.
// The date a house actually turns on is the jury opening: the night the person
// evicted stops going home and starts deciding who wins.
//
// That week is not configured anywhere, it is DERIVED — the jury is the last
// `jurySize` people out and the houseguest cut at the final three is one of
// them, so it opens with jurySize + 2 still in the house. houseStructure() in
// bb-run.js already did that arithmetic for the season-shape panel; the
// timeline and the slider now agree with it.
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { seasonFormat, selectedEpisodes } from '../js/core.js';
import { renderTimeline, updateSlider, buildEpisodeMap } from '../js/run-ui.js';
import { renderQuickSetup, qsStep, qsOnFormatChange } from '../js/quick-setup.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn', 'Ennui', 'Sky'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind', 'social-butterfly', 'hero', 'showmancer'][i % 4],
}));

/** run-ui.js reads all of this as bare globals, the catalogue included. */
function season(cfg = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG,
    seasonFormat, selectedEpisodes });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    mergeAt: 12, teams: 2, bbHaveNots: 'off', bbSafetyMode: 'off', ...cfg });
  seasonConfig.twistSchedule = [];
}

/** The designer's markup, reduced to the parts these two features touch. */
function dom() {
  document.body.innerHTML = `
    <div id="fd-timeline"></div>
    <label><span id="jury-label">Council Size</span>: <strong id="jury-display">9</strong>
      Members<span id="jury-note"></span></label>
    <input type="range" id="cfg-jury" value="7">`;
}

beforeEach(() => { season(); dom(); });

// This file leaves a Big Brother season standing in shared module state, and
// vitest reuses a worker across files.
afterAll(() => {
  seasonConfig.twistSchedule = [];
  delete seasonConfig.format;
});

describe('the week the jury opens', () => {
  it('is marked on the timeline, and the merge card is not', () => {
    renderTimeline();
    const html = document.getElementById('fd-timeline').innerHTML;

    // jurySize 7 → the first juror is evicted with 9 in the house.
    expect(html, 'the jury never opened on the timeline').toContain('JURY · 9 left');
    expect(html, 'a house has no tribes to merge').not.toContain('MERGE');
  });

  it('moves when the jury size does', () => {
    season({ jurySize: 9 });
    renderTimeline();
    expect(document.getElementById('fd-timeline').innerHTML).toContain('JURY · 11 left');
  });

  it('marks nothing when the season is played without a jury', () => {
    season({ jurySize: 0 });
    renderTimeline();
    const html = document.getElementById('fd-timeline').innerHTML;
    expect(html).not.toContain('JURY');
    expect(html).not.toContain('MERGE');
  });

  it('leaves Total Drama its merge', () => {
    // The whole point of doing this by format: a camp DOES merge, and the card
    // that says so must survive.
    season({ format: 'total-drama' });
    renderTimeline();
    const html = document.getElementById('fd-timeline').innerHTML;
    expect(html, 'the merge card was taken from the show that has one').toContain('MERGE');
    expect(html).not.toContain('JURY ·');
  });

  it('never lands on a week the projection does not have', () => {
    // Guards the arithmetic against buildEpisodeMap rather than restating it:
    // if the two ever disagree the marker silently stops appearing, which is
    // exactly the failure that is hard to notice.
    const opensAt = seasonConfig.jurySize + 2;
    expect(buildEpisodeMap().some(e => e.active === opensAt)).toBe(true);
  });
});

describe('the house is not asked for tribes it does not have', () => {
  // Quick Setup is the DEFAULT view, and its Structure card was Total Drama's
  // whole: a Big Brother season was offered starting tribes, a merge point, a
  // finale size fixed at three by the format, and a "Council". The one number
  // a house actually owns is the jury.
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = `
      <div id="tab-setup" class="tab-content active">
        <div class="setup-panel active-panel" id="setup-panel-basics">LEGACY</div>
        <input id="cfg-name" value="Test Season">
        <input id="cfg-season-number" value="7">
        <select id="cfg-format"><option value="total-drama">TD</option><option value="big-brother">BB</option></select>
        <select id="cfg-host"><option value="Chris">Chris</option><option value="Don">Don</option></select>
        <select id="cfg-setting"><option value="hosted-camp">Camp</option><option value="bb-house">House</option></select>
        <input id="cfg-teams" type="range" min="1" max="6" value="2">
        <input id="cfg-merge" type="range" min="4" max="22" value="12">
        <input id="cfg-jury" type="range" min="3" max="15" value="7">
        <input id="cfg-finale" type="range" min="2" max="4" value="3">
        <select id="cfg-finale-format"><option value="traditional">Trad</option></select>
        <input id="cfg-days" value="39">
      </div>`;
    window._qsMode = undefined; window._qsPreset = undefined;
    window._quickSetupDisabled = false;
    window.seasonConfig = { teams: 2, mergeAt: 12, jurySize: 7, finaleSize: 3,
      finaleFormat: 'traditional', name: 'Test Season', seasonNumber: 7, days: 39,
      twistSchedule: [] };
    window.players = CAST.map((c, i) => ({ id: 'p' + i, name: c.name }));
    window.gs = null;
  });

  const steppers = () => [...document.querySelectorAll('.qs-steppers > *')]
    .map(s => s.textContent.replace(/\s+/g, ' ').trim());

  it('asks a camp for its four numbers', () => {
    document.getElementById('cfg-format').value = 'total-drama';
    renderQuickSetup();
    expect(steppers()).toHaveLength(4);
    expect(steppers().join(' ')).toMatch(/Starting tribes/);
    expect(document.getElementById('qs-housenote')).toBeNull();
  });

  it('asks a house for one, and says what it buys', () => {
    document.getElementById('cfg-format').value = 'big-brother';
    window.seasonConfig.format = 'big-brother';
    renderQuickSetup();

    expect(steppers(), 'the house was asked for tribes, a merge or a finale size').toHaveLength(1);
    expect(steppers()[0]).toMatch(/Jury size/);
    expect(document.getElementById('qs-housenote').textContent)
      .toMatch(/jury opens with 9 houseguests left/);
    expect(document.querySelector('.qs-cast-word').textContent).toBe('houseguests cast');
  });

  it('moves the date as the number moves, without a tab switch', () => {
    document.getElementById('cfg-format').value = 'big-brother';
    window.seasonConfig.format = 'big-brother';
    window.saveConfig = () => {};
    renderQuickSetup();
    qsStep('jury', 2);
    expect(document.getElementById('qs-housenote').textContent)
      .toMatch(/jury opens with 11 houseguests left/);
  });

  it('says so when the cast cannot seat the jury', () => {
    document.getElementById('cfg-format').value = 'big-brother';
    window.seasonConfig.format = 'big-brother';
    window.seasonConfig.jurySize = 15;
    document.getElementById('cfg-jury').value = '15';
    renderQuickSetup();
    const note = document.getElementById('qs-housenote');
    expect(note.textContent).toMatch(/needs 17 houseguests and only 16 are cast/);
    expect(note.classList.contains('bad')).toBe(true);
  });

  it('swaps the card back when the show is switched on the panel', () => {
    // The card is built per show but was only ever rebuilt when the tab was
    // opened, so switching show while sitting on Quick Setup left the previous
    // show's questions on screen.
    window.saveConfig = () => {};
    document.getElementById('cfg-format').value = 'big-brother';
    window.seasonConfig.format = 'big-brother';
    renderQuickSetup();
    expect(steppers()).toHaveLength(1);

    document.getElementById('cfg-format').value = 'total-drama';
    window.seasonConfig.format = 'total-drama';
    qsOnFormatChange();
    expect(steppers(), 'a camp was still being asked only for a jury').toHaveLength(4);
    expect(document.getElementById('qs-housenote')).toBeNull();
  });
});

describe('the slider says which show it belongs to', () => {
  it('calls it a jury in the house, and reads back when it opens', () => {
    updateSlider('jury');
    expect(document.getElementById('jury-label').textContent).toBe('Jury Size');
    expect(document.getElementById('jury-note').textContent).toContain('jury opens at 9 left');
  });

  it('calls it a Council in Total Drama, and says nothing else', () => {
    season({ format: 'total-drama' });
    updateSlider('jury');
    expect(document.getElementById('jury-label').textContent).toBe('Council Size');
    expect(document.getElementById('jury-note').textContent).toBe('');
  });

  it('says so when the cast cannot seat the jury being asked for', () => {
    // 16 cast, so a jury of 15 would need 17 in the house. The blueprint panel
    // says this too, but the number is chosen HERE.
    document.getElementById('cfg-jury').value = '15';
    updateSlider('jury');
    const note = document.getElementById('jury-note');
    expect(note.textContent).toContain('needs 17 houseguests, 16 cast');
    expect(note.classList.contains('bad')).toBe(true);
  });
});
