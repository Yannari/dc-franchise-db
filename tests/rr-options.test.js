// @vitest-environment jsdom
// rr-options.test.js — the race's Surprise twists switch is on the page, on this show alone, and survives a save; and a
// save never drops what the Season Timeline pinned. Found 2026-10-20: saveConfig rebuilds the config and carried none
// of the race's pins, so changing any setting wiped every pinned place and leg kind.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { configScopeFor } from '../js/quick-setup.js';
import { saveConfig, renderConfig } from '../js/cast-ui.js';

const HTML = readFileSync('simulator.html', 'utf8');
const IDS = ['cfg-rr-surprises', 'sec-rr-divider', 'sec-rr-options', 'rr-options-body'];

function page() {
  const start = HTML.indexOf('<div class="divider" id="sec-rr-divider">');
  const end = HTML.indexOf('<!-- /rr-options -->');
  document.body.innerHTML = HTML.slice(start, end);
  window.ADVANTAGES = []; window.ADV_SOURCE_LABELS = {};
}

describe('the race options', () => {
  it('are drawn on the race alone, and every one exists on the page', () => {
    const rr = configScopeFor('ridonculous-race');
    for (const id of IDS) { expect([...rr.fields, ...rr.sections], id).toContain(id); expect(HTML, id).toContain(`id="${id}"`); }
    for (const fmt of ['total-drama', 'big-brother', 'the-circle', 'the-challenge']) {
      const s = configScopeFor(fmt);
      for (const id of IDS) expect([...s.fields, ...s.sections], `${fmt}:${id}`).not.toContain(id);
    }
  });

  it('reads the switch off the page, and puts it back on a load', () => {
    page();
    window.seasonConfig = { format: 'ridonculous-race' };
    document.getElementById('cfg-rr-surprises').checked = false;
    saveConfig();
    expect(window.seasonConfig.rrSurprises).toBe(false);
    window.seasonConfig = { format: 'ridonculous-race', rrSurprises: true };
    try { renderConfig(); } catch { /* other shows' panels are not on this page */ }
    expect(document.getElementById('cfg-rr-surprises').checked).toBe(true);
  });

  it("never drops the Season Timeline's pins: a leg's place, kind and twist", () => {
    page();
    const pins = { rrRoutePins: { 3: 'coast-palace' }, rrLegKinds: { 4: 'non' }, rrTwistPins: { 5: 'yield', 6: 'none' }, rrNonElimShare: 0.5 };
    window.seasonConfig = { format: 'ridonculous-race', ...pins };
    saveConfig();
    expect(window.seasonConfig).toMatchObject(pins);
  });
});
