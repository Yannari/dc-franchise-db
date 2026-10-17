// @vitest-environment jsdom
// Intel after the merge has no teams (the user, 2026-10-17: "the intel doesn't update at the merge to show them without a
// team, for example in the relationships tab"). The merge episode started with teams (tribesAtStart) and Intel read them.
import { describe, it, expect } from 'vitest';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { intelHtml } from '../js/vp-td-ep/stage.js';

describe('Intel at the merge', () => {
  it('shows the merge episode as one camp, not the old teams', () => {
    seededRun(() => runOneSeason({ romance: 'enabled' }), 77);
    window.gs = core.gs; globalThis.gs = core.gs;
    const ep = core.gs.episodeHistory.find(e => e.isMerge);
    expect(ep).toBeTruthy();
    const old = (ep.tribesAtStart || []).map(t => t.name);
    expect(old.length).toBeGreaterThan(1);
    for (const tab of ['people', 'powers']) {
      const html = intelHtml({ ep: ep.num, kind: 'camp', steps: [] }, { step: {}, side: [], idx: 0 }, tab, false);
      for (const name of old) expect(html.includes(`<small>${name}</small>`) || html.includes(`<b style="display:block">${name}</b>`), `${tab} still sorts by ${name}`).toBe(false);
    }
  }, 600000);
});

describe('Intel alliances', () => {
  it('shows a broken-up alliance in the episode it ended, and not after', () => {
    let checked = 0;
    for (const seed of [77, 78, 79]) {
      seededRun(() => runOneSeason({ romance: 'enabled' }), seed);
      window.gs = core.gs; globalThis.gs = core.gs;
      const hist = core.gs.episodeHistory;
      for (const ep of hist) {
        const prev = hist.find(e => e.num === ep.num - 1);
        const was = new Set((prev?.gsSnapshot?.dissolvedAlliances || []).map(a => a.name));
        const html = intelHtml({ ep: ep.num, kind: 'camp', steps: [] }, { step: {}, side: [], idx: 0 }, 'allies', false);
        for (const a of ep.gsSnapshot?.dissolvedAlliances || []) {
          const shown = html.includes(`<b>${a.name}</b> <span class="chip">broken up</span>`);
          if (was.has(a.name)) { expect(shown, `ep${ep.num}: ${a.name} broke up before and is still listed`).toBe(false); checked++; }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  }, 600000);
});
