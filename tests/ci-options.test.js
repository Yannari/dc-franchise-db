// @vitest-environment jsdom
// ci-options.test.js — the Circle's season options (Plan 4 Task 4, spec §19.2).
// Every control is one the engine reads, is drawn on this show alone, and
// survives a save; and a save never drops the Profile Plan or the Pool.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { configScopeFor } from '../js/quick-setup.js';
import { saveConfig, renderConfig } from '../js/cast-ui.js';

const HTML = readFileSync('simulator.html', 'utf8');
const CONTROLS = ['cfg-ci-days', 'cfg-ci-finalists', 'cfg-ci-newcomer-rule', 'cfg-ci-pick-by', 'cfg-ci-ai'];
const SECTIONS = ['sec-ci-divider', 'sec-ci-options', 'ci-options-body'];

describe('scoped to the Circle', () => {
  it('draws its own options, and every one exists on the page', () => {
    const ci = configScopeFor('the-circle');
    const scoped = [...ci.fields, ...ci.sections];
    for (const id of [...CONTROLS, ...SECTIONS]) { expect(scoped, id).toContain(id); expect(HTML, id).toContain(`id="${id}"`); }
  });

  it("and a Circle season is not shown the villa's option cards", () => {
    // "Night one" and "The final" were drawn on every show: their selects
    // were scoped, the cards around them were not. Found on the page.
    expect(configScopeFor('perfect-match').sections).toContain('sec-pm-season');
    for (const fmt of ['the-circle', 'total-drama', 'big-brother', 'traitors', 'drag-race']) {
      expect(configScopeFor(fmt).sections, fmt).not.toContain('sec-pm-season');
    }
  });

  it("nor the drag save: the All Stars switch must not re-show it on another show", async () => {
    // drVerdictUI showed grp-dr-save whenever All Stars was off, on any show,
    // after the scope had hidden it. Found on the page.
    const { drVerdictUI } = await import('../js/cast-ui.js');
    document.body.innerHTML = '<div id="grp-dr-save" style="display:none"></div><select id="cfg-dr-all-stars"><option value="off" selected>off</option></select>';
    window.seasonConfig = { format: 'the-circle' };
    drVerdictUI();
    expect(document.getElementById('grp-dr-save').style.display).toBe('none');
    window.seasonConfig = { format: 'drag-race' };
    drVerdictUI();
    expect(document.getElementById('grp-dr-save').style.display).toBe('');
  });

  it('no other show is asked them', () => {
    for (const fmt of ['total-drama', 'big-brother', 'traitors', 'drag-race', 'perfect-match']) {
      const s = configScopeFor(fmt);
      for (const id of [...CONTROLS, ...SECTIONS]) expect([...s.fields, ...s.sections], `${fmt}:${id}`).not.toContain(id);
    }
  });
});

function page() {
  const start = HTML.indexOf('<div class="divider" id="sec-ci-divider">');
  const end = HTML.indexOf('<!-- /ci-options -->');
  document.body.innerHTML = HTML.slice(start, end);
  // Globals main.js puts on window, which saveConfig reads for other shows.
  window.ADVANTAGES = []; window.ADV_SOURCE_LABELS = {};
}

describe('a save keeps what the Circle was given', () => {
  it('reads the five options off the page', () => {
    page();
    window.seasonConfig = { format: 'the-circle' };
    document.getElementById('cfg-ci-days').value = '14';
    document.getElementById('cfg-ci-finalists').value = '4';
    document.getElementById('cfg-ci-newcomer-rule').value = 'none';
    document.getElementById('cfg-ci-pick-by').value = 'random';
    document.getElementById('cfg-ci-ai').checked = true;
    saveConfig();
    expect(window.seasonConfig).toMatchObject({ ciDays: 14, ciFinalists: 4, ciNewcomerRule: 'none', ciPickBy: 'random', ciAI: true });
  });

  it('an empty Days box is automatic, and the defaults are the US show', () => {
    page();
    window.seasonConfig = { format: 'the-circle' };
    saveConfig();
    expect(window.seasonConfig).toMatchObject({ ciDays: null, ciFinalists: 5, ciNewcomerRule: 'rate-not-rated', ciPickBy: 'stats', ciAI: false });
  });

  it('never drops the Profile Plan or the Catfish Pool (they are edited elsewhere)', () => {
    page();
    const ciSetup = { Ann: { role: 'newcomer', catfish: 'never' } };
    const ciPool = [{ id: 'mine', handle: 'Rae' }];
    window.seasonConfig = { format: 'the-circle', ciSetup, ciPool };
    saveConfig();
    expect(window.seasonConfig.ciSetup).toEqual(ciSetup);
    expect(window.seasonConfig.ciPool).toEqual(ciPool);
    // An unwritten pool stays unwritten (the default pool plays), not [].
    window.seasonConfig = { format: 'the-circle' };
    saveConfig();
    expect(window.seasonConfig.ciPool).toBeUndefined();
  });

  it('a loaded season puts its options back on the page', () => {
    page();
    window.seasonConfig = { format: 'the-circle', ciDays: 12, ciFinalists: 4, ciNewcomerRule: 'full', ciPickBy: 'random', ciAI: true };
    try { renderConfig(); } catch { /* other shows' panels are not on this page */ }
    expect(document.getElementById('cfg-ci-days').value).toBe('12');
    expect(document.getElementById('cfg-ci-finalists').value).toBe('4');
    expect(document.getElementById('cfg-ci-newcomer-rule').value).toBe('full');
    expect(document.getElementById('cfg-ci-pick-by').value).toBe('random');
    expect(document.getElementById('cfg-ci-ai').checked).toBe(true);
  });
});
