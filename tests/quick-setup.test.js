import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';

// ── CSS-gate regression pins (LEARNED GOTCHAS from items 5/10) ─────────────
describe('quick-setup CSS tab gating', () => {
  const src = readFileSync('js/quick-setup.js', 'utf8'); // vitest cwd = repo root

  it('only forces display while the setup tab is ACTIVE (no ungated ID rule)', () => {
    // A bare `#tab-setup.quick-setup-active { display:block }` outranks the global
    // `.tab-content { display:none }` and bleeds onto every tab.
    expect(src).not.toMatch(/#tab-setup\.quick-setup-active\s*\{\s*display/);
    expect(src).toMatch(/#tab-setup\.tab-content\.active\.quick-setup-active\s*\{\s*display:\s*block/);
  });

  it('keeps the quick body hidden in Advanced mode via [hidden]', () => {
    // An author display rule overrides [hidden]'s UA display:none — without the
    // explicit rule the body would stay visible over the legacy panels.
    expect(src).toMatch(/\.qs-body\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  });

  it('never stacks the quick panel when the takeover class is absent', () => {
    expect(src).toMatch(/#tab-setup:not\(\.quick-setup-active\)\s+#quick-setup\s*\{\s*display:\s*none\s*!important/);
  });
});

import {
  clamp, blueprintFor, validateQuickSetup, seedChaosTwists, presetConfigFor, renderQuickSetup,
} from '../js/quick-setup.js';
import { TWIST_CATALOG } from '../js/core.js';

// ── helpers ────────────────────────────────────────────────────────────
function makePlayers(n, tribes = null) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ id: 'p' + i, name: 'P' + i, tribe: tribes ? tribes[i % tribes.length] : '' });
  }
  return out;
}
// A fully-valid config + cast of size N split into `teams` even tribes.
function validSetup(N = 12, teams = 2) {
  const tribeNames = Array.from({ length: teams }, (_, i) => 'T' + i);
  const players = [];
  for (let i = 0; i < N; i++) players.push({ id: 'p' + i, name: 'P' + i, tribe: tribeNames[i % teams] });
  const config = { teams, mergeAt: 8, jurySize: 7, finaleSize: 3, finaleFormat: 'traditional', twistSchedule: [] };
  return { config, players };
}

// ── clamp ──────────────────────────────────────────────────────────────
describe('clamp', () => {
  it('bounds within range', () => {
    expect(clamp(5, 1, 10)).toBe(5);
    expect(clamp(-3, 1, 10)).toBe(1);
    expect(clamp(99, 1, 10)).toBe(10);
  });
});

// ── blueprintFor ───────────────────────────────────────────────────────
describe('blueprintFor', () => {
  it('produces the players → tribes → merge → jury → finale segments', () => {
    const segs = blueprintFor({ teams: 2, mergeAt: 12, jurySize: 9, finaleSize: 3, finaleFormat: 'traditional' }, 18);
    const labels = segs.map(s => s.label);
    expect(labels[0]).toBe('18 players');
    expect(labels).toContain('2 tribes');
    expect(labels).toContain('merge at 12');
    expect(labels).toContain('jury of 9');
    expect(labels.some(l => l.startsWith('Final 3'))).toBe(true);
    expect(segs.every(s => s.ok)).toBe(true);
  });

  it('flags an invalid merge segment with a reason', () => {
    // merge 12 with only 10 players → merge >= cast size
    const segs = blueprintFor({ teams: 2, mergeAt: 12, jurySize: 7, finaleSize: 3 }, 10);
    const merge = segs.find(s => s.label === 'merge at 12');
    expect(merge.ok).toBe(false);
    expect(merge.why).toBeTruthy();
  });

  it('flags a jury that cannot fit', () => {
    const segs = blueprintFor({ teams: 2, mergeAt: 8, jurySize: 9, finaleSize: 3 }, 10);
    const jury = segs.find(s => s.label === 'jury of 9');
    expect(jury.ok).toBe(false); // 9 + 3 = 12 > 10
  });

  it('inserts a swap segment when a tribe-swap twist is scheduled', () => {
    const segs = blueprintFor({ teams: 2, mergeAt: 8, jurySize: 7, finaleSize: 3,
      twistSchedule: [{ episode: 4, type: 'tribe-swap' }] }, 12);
    expect(segs.some(s => s.label === 'swap at ep 4')).toBe(true);
  });

  it('shows "no jury" for jury-less finale formats', () => {
    const segs = blueprintFor({ teams: 2, mergeAt: 8, jurySize: 9, finaleSize: 3, finaleFormat: 'hawaiian-punch' }, 10);
    expect(segs.some(s => s.label === 'no jury')).toBe(true);
  });
});

// ── validateQuickSetup ─────────────────────────────────────────────────
describe('validateQuickSetup', () => {
  const row = (rows, key) => rows.find(r => r.key === key);

  it('a fully valid setup returns all-ok', () => {
    const { config, players } = validSetup(12, 2);
    const rows = validateQuickSetup(config, players);
    expect(rows.every(r => r.ok)).toBe(true);
  });

  it('cast rule fires when too few players', () => {
    const rows = validateQuickSetup({ teams: 1, mergeAt: 5, jurySize: 5, finaleSize: 3 }, makePlayers(3));
    expect(row(rows, 'cast').ok).toBe(false);
    expect(row(rows, 'cast').msg).toMatch(/at least 4/);
  });

  it('cast rule fires when cast smaller than finaleSize + 2', () => {
    const rows = validateQuickSetup({ teams: 1, mergeAt: 4, jurySize: 3, finaleSize: 4 }, makePlayers(5));
    expect(row(rows, 'cast').ok).toBe(false);
  });

  it('tribes rule fires on unassigned players', () => {
    const players = makePlayers(8); // no tribes
    const rows = validateQuickSetup({ teams: 2, mergeAt: 6, jurySize: 5, finaleSize: 3 }, players);
    expect(row(rows, 'tribes').ok).toBe(false);
    expect(row(rows, 'tribes').msg).toMatch(/not assigned/);
  });

  it('tribes rule fires when tribe count mismatches teams', () => {
    const players = makePlayers(9, ['A', 'B', 'C']); // 3 tribes but teams=2
    const rows = validateQuickSetup({ teams: 2, mergeAt: 6, jurySize: 5, finaleSize: 3 }, players);
    expect(row(rows, 'tribes').ok).toBe(false);
  });

  it('tribes rule passes on an even, complete split', () => {
    const players = makePlayers(8, ['A', 'B']);
    const rows = validateQuickSetup({ teams: 2, mergeAt: 6, jurySize: 5, finaleSize: 3 }, players);
    expect(row(rows, 'tribes').ok).toBe(true);
  });

  it('merge rule fires when merge >= cast size', () => {
    const players = makePlayers(10, ['A', 'B']);
    const rows = validateQuickSetup({ teams: 2, mergeAt: 12, jurySize: 5, finaleSize: 3 }, players);
    expect(row(rows, 'merge').ok).toBe(false);
    expect(row(rows, 'merge').msg).toMatch(/lower it/);
  });

  it('merge rule fires when merge too close to finale', () => {
    const players = makePlayers(10, ['A', 'B']);
    const rows = validateQuickSetup({ teams: 2, mergeAt: 4, jurySize: 5, finaleSize: 3 }, players);
    expect(row(rows, 'merge').ok).toBe(false); // mergeAt 4 not > finaleSize+1 (4)
  });

  it('jury rule fires when jury + finale exceed cast', () => {
    const players = makePlayers(10, ['A', 'B']);
    const rows = validateQuickSetup({ teams: 2, mergeAt: 8, jurySize: 9, finaleSize: 3 }, players);
    expect(row(rows, 'jury').ok).toBe(false);
  });

  it('jury rule is skipped for jury-less formats', () => {
    const players = makePlayers(10, ['A', 'B']);
    const rows = validateQuickSetup({ teams: 2, mergeAt: 8, jurySize: 99, finaleSize: 3, finaleFormat: 'final-challenge' }, players);
    expect(row(rows, 'jury').ok).toBe(true);
  });

  it('twists rule fires on incompatible pair sharing an episode', () => {
    // find a real incompatible pair from the catalog
    const withInc = TWIST_CATALOG.find(t => (t.incompatible || []).length);
    const other = withInc.incompatible[0];
    const players = makePlayers(12, ['A', 'B']);
    const rows = validateQuickSetup({
      teams: 2, mergeAt: 8, jurySize: 7, finaleSize: 3,
      twistSchedule: [{ episode: 9, type: withInc.id }, { episode: 9, type: other }],
    }, players);
    expect(row(rows, 'twists').ok).toBe(false);
    expect(row(rows, 'twists').msg).toMatch(/can't both run/);
  });

  it('twists rule fires on a pre-merge twist scheduled after the merge', () => {
    const preMerge = TWIST_CATALOG.find(t => t.phase === 'pre-merge');
    const players = makePlayers(14, ['A', 'B']); // preMergeEps = 14 - 8 = 6
    const rows = validateQuickSetup({
      teams: 2, mergeAt: 8, jurySize: 7, finaleSize: 3,
      twistSchedule: [{ episode: 10, type: preMerge.id }],
    }, players);
    expect(row(rows, 'twists').ok).toBe(false);
    expect(row(rows, 'twists').msg).toMatch(/pre-merge only/);
  });

  it('twists rule fires on a schedule beyond plausible season length', () => {
    const anyTwist = TWIST_CATALOG.find(t => t.phase === 'any');
    const players = makePlayers(10, ['A', 'B']); // maxEp = 10 - 3 + 3 = 10
    const rows = validateQuickSetup({
      teams: 2, mergeAt: 8, jurySize: 5, finaleSize: 3,
      twistSchedule: [{ episode: 30, type: anyTwist.id }],
    }, players);
    expect(row(rows, 'twists').ok).toBe(false);
  });

  it('returning-player twist is a warn row, never a blocker', () => {
    const players = makePlayers(12, ['A', 'B']);
    const rows = validateQuickSetup({
      teams: 2, mergeAt: 8, jurySize: 7, finaleSize: 3,
      twistSchedule: [{ episode: 5, type: 'returning-player' }],
    }, players);
    const ret = row(rows, 'returning');
    expect(ret).toBeTruthy();
    expect(ret.ok).toBe(true);
    expect(ret.warn).toBe(true);
    expect(rows.every(r => r.ok)).toBe(true); // still all-ok overall
  });
});

// ── seedChaosTwists ────────────────────────────────────────────────────
describe('seedChaosTwists', () => {
  const catById = id => TWIST_CATALOG.find(t => t.id === id);

  // deterministic rng cycling through a fixed sequence
  function seq(values) { let i = 0; return () => values[(i++) % values.length]; }

  it('returns 3-4 entries', () => {
    for (let trial = 0; trial < 40; trial++) {
      const out = seedChaosTwists(18, 10);
      expect(out.length).toBeGreaterThanOrEqual(3);
      expect(out.length).toBeLessThanOrEqual(4);
    }
  });

  it('never places two twists on the same episode (so incompatible pairs cannot collide)', () => {
    for (let trial = 0; trial < 50; trial++) {
      const out = seedChaosTwists(20, 12);
      const eps = out.map(t => t.episode);
      expect(new Set(eps).size).toBe(eps.length);
    }
  });

  it('respects phase boundaries relative to the merge', () => {
    for (let trial = 0; trial < 50; trial++) {
      const N = 18, mergeAt = 10;
      const preMergeEps = Math.max(1, N - mergeAt);
      const out = seedChaosTwists(N, mergeAt);
      out.forEach(t => {
        const cat = catById(t.type);
        if (cat.phase === 'pre-merge') expect(t.episode).toBeLessThanOrEqual(preMergeEps);
        if (cat.phase === 'post-merge') expect(t.episode).toBeGreaterThan(preMergeEps);
      });
    }
  });

  it('is deterministic under an injected rng', () => {
    const a = seedChaosTwists(16, 9, seq([0.1, 0.4, 0.7, 0.2, 0.9, 0.5]));
    const b = seedChaosTwists(16, 9, seq([0.1, 0.4, 0.7, 0.2, 0.9, 0.5]));
    expect(a).toEqual(b);
  });

  it('every seeded entry references a real catalog twist', () => {
    seedChaosTwists(22, 13).forEach(t => expect(catById(t.type)).toBeTruthy());
  });
});

// ── presetConfigFor (math + clamps) ────────────────────────────────────
describe('presetConfigFor', () => {
  it('Total Drama clamps mergeAt/jury at N=10', () => {
    const { config } = presetConfigFor('total-drama', 10);
    expect(config.teams).toBe(2);
    expect(config.mergeAt).toBe(6);       // ceil(10*0.55)=6
    expect(config.jurySize).toBe(6);      // clamp(10-6+2,5,9)=6
    expect(config.finaleSize).toBe(2);
    expect(config.finaleFormat).toBe('traditional');
    expect(config.days).toBe(39);
  });

  it('Total Drama clamps jury to 9 at N=22', () => {
    const { config } = presetConfigFor('total-drama', 22);
    expect(config.mergeAt).toBe(13);      // ceil(22*0.55)=13
    expect(config.jurySize).toBe(9);      // clamp(22-13+2=11,5,9)=9
  });

  it('Survivor uses 3 tribes at N>=18 and fire-making (F4 lock)', () => {
    const { config } = presetConfigFor('survivor', 18);
    expect(config.teams).toBe(3);
    expect(config.finaleFormat).toBe('fire-making');
    expect(config.finaleSize).toBe(4);
    expect(config.shotInDark).toBe(true);
    expect(config.idolRehide).toBe(true);
  });

  it('Survivor uses 2 tribes and clamps jury at N=10', () => {
    const { config } = presetConfigFor('survivor', 10);
    expect(config.teams).toBe(2);
    expect(config.jurySize).toBe(6);      // clamp(9,3,10-4=6)=6
  });

  it('Survivor jury clamps to 9 at N=22', () => {
    const { config } = presetConfigFor('survivor', 22);
    expect(config.jurySize).toBe(9);      // clamp(9,3,18)=9
  });

  it('Disventure enables Rescue Island with reentry at the merge', () => {
    const { config } = presetConfigFor('disventure', 16);
    expect(config.ri).toBe(true);
    expect(config.riReentryAt).toBe(config.mergeAt);
    expect(config.setting).toBe('carnival');
    expect(config.journey).toBe(true);
  });

  it('Chaos seeds compatible twists + turns on mole', () => {
    const { config, twists } = presetConfigFor('chaos', 18);
    expect(config.mole).toBe('1-random');
    expect(config.qem).toBe(true);
    expect(Array.isArray(twists)).toBe(true);
    expect(twists.length).toBeGreaterThanOrEqual(3);
  });

  it('Custom applies no changes', () => {
    const { config, twists } = presetConfigFor('custom', 14);
    expect(config).toEqual({});
    expect(twists).toBe(null);
  });
});

// ── jsdom smoke: render + takeover + toggle + escape hatch ──────────────
describe('renderQuickSetup (jsdom smoke)', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = `
      <div id="tab-setup" class="tab-content active">
        <div class="setup-subnav"><button>Season Setup</button></div>
        <div class="setup-panel active-panel" id="setup-panel-basics">LEGACY</div>
        <input id="cfg-name" value="Test Season">
        <input id="cfg-season-number" value="7">
        <select id="cfg-host"><option value="Chris">Chris</option><option value="Chef">Chef</option></select>
        <select id="cfg-setting"><option value="hosted-camp">Camp</option><option value="carnival">Carnival</option></select>
        <input id="cfg-teams" type="range" min="1" max="6" value="2">
        <input id="cfg-merge" type="range" min="4" max="22" value="8">
        <input id="cfg-jury" type="range" min="3" max="15" value="7">
        <input id="cfg-finale" type="range" min="2" max="4" value="3">
        <select id="cfg-finale-format"><option value="traditional">Trad</option><option value="fire-making">Fire</option></select>
        <input id="cfg-days" value="39">
      </div>`;
    window._qsMode = undefined;
    window._qsPreset = undefined;
    window._quickSetupDisabled = false;
    window.seasonConfig = { teams: 2, mergeAt: 8, jurySize: 7, finaleSize: 3, finaleFormat: 'traditional', name: 'Test Season', seasonNumber: 7, days: 39, twistSchedule: [] };
    window.players = [];
    window.gs = null;
  });

  it('renders the quick panel and hides legacy in Quick mode', () => {
    renderQuickSetup();
    const tab = document.getElementById('tab-setup');
    expect(document.getElementById('quick-setup')).toBeTruthy();
    expect(tab.classList.contains('quick-setup-active')).toBe(true);
    expect(tab.classList.contains('qs-hide-legacy')).toBe(true);
    expect(document.getElementById('qs-body').hidden).toBe(false);
    // header + at least one preset card + start button present
    expect(document.querySelector('.qs-title')).toBeTruthy();
    expect(document.getElementById('qs-preset-survivor')).toBeTruthy();
    expect(document.querySelector('.qs-start')).toBeTruthy();
  });

  it('Advanced mode reveals legacy and hides the quick body', () => {
    renderQuickSetup();
    window.qsSetMode('advanced');
    const tab = document.getElementById('tab-setup');
    expect(tab.classList.contains('quick-setup-active')).toBe(true); // still takes over the surface
    expect(tab.classList.contains('qs-hide-legacy')).toBe(false);    // legacy visible
    expect(document.getElementById('qs-body').hidden).toBe(true);
    // the mode toggle itself is still present so the user can switch back
    expect(document.querySelector('.qs-modetoggle')).toBeTruthy();
  });

  it('the escape hatch removes the takeover and leaves legacy usable', () => {
    renderQuickSetup();
    window._quickSetupDisabled = true;
    renderQuickSetup();
    const tab = document.getElementById('tab-setup');
    expect(document.getElementById('quick-setup')).toBe(null);
    expect(tab.classList.contains('quick-setup-active')).toBe(false);
    expect(tab.classList.contains('qs-hide-legacy')).toBe(false);
    expect(document.getElementById('setup-panel-basics').textContent).toBe('LEGACY');
  });

  it('a valid config enables Start; an impossible one disables it', () => {
    window.players = Array.from({ length: 8 }, (_, i) => ({ id: 'p' + i, name: 'P' + i, tribe: i % 2 ? 'A' : 'B' }));
    window.seasonConfig.mergeAt = 6; // valid: 6 < 8 players, 6 > finaleSize+1
    window.seasonConfig.jurySize = 5; // 5 + 3 <= 8
    renderQuickSetup();
    expect(document.getElementById('qs-start-btn')?.disabled).toBe(false);

    window.seasonConfig.mergeAt = 20; // impossible for 8 players
    renderQuickSetup();
    expect(document.getElementById('qs-start-btn')?.disabled).toBe(true);
  });
});
