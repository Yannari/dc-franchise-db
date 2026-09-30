// @vitest-environment jsdom
// ci-cast-ui.test.js — the Circle view in the Casting Room (Plan 4 Tasks 6-7,
// mockup v3 approved 2026-09-30). Every control writes the setup the engine
// reads (seasonConfig.ciSetup, seasonConfig.ciPool); nothing is free text the
// simulator cannot read except names, hometowns and an optional bio.
import { beforeEach, describe, expect, it } from 'vitest';
import { renderCircleCastSetup } from '../js/ci-cast-ui.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';
import { putPhoto, photoURL, _memoryPhotos } from '../js/ci/photo-store.js';
import { makePlayers } from './helpers/ci-cast.js';

const root = () => document.getElementById('sec-ci-cast');
const click = sel => { const el = root().querySelector(sel); if (!el) throw new Error(`no ${sel}`); el.click(); };
const change = (sel, value) => {
  const el = root().querySelector(sel); if (!el) throw new Error(`no ${sel}`);
  el.value = value; el.dispatchEvent(new Event('change', { bubbles: true }));
};
const setup = n => window.seasonConfig.ciSetup?.[n] || {};
// The plan shows one player at a time: open them first.
const open = n => { const b = root().querySelector(`[data-act="plan-who"][data-v="${n}"]`); if (b) b.click(); };

beforeEach(() => {
  document.body.innerHTML = '<section id="sec-ci-cast"></section>';
  window.seasonConfig = { format: 'the-circle', ciSetup: {} };
  window.players = makePlayers(6);
  window.gs = null;
  window.saveConfig = () => {};
  _memoryPhotos();
  window._ciSub = null; window._ciEditing = null; window._ciPlanWho = null; window._ciPlanTab = null; window._ciPlanOverview = false;
  renderCircleCastSetup();
});

describe('the Profile Plan', () => {
  it('one player at a time: a face per player, one card, waiting for the deal', () => {
    expect(root().querySelectorAll('.ci-ph-who')).toHaveLength(6);
    expect(root().querySelectorAll('.ci-row')).toHaveLength(1);
    expect(root().querySelector('.ci-row .ci-draw').textContent).toMatch(/waiting for episode 1/i);
  });

  it('every pin writes the setup the engine reads', () => {
    open('P01'); click('.ci-row[data-name="P01"] [data-act="catfish"][data-v="never"]');
    open('P01'); click('.ci-row[data-name="P01"] [data-act="mode"][data-v="edited"]');
    open('P01'); click('.ci-row[data-name="P01"] [data-act="role"][data-v="newcomer"]');
    open('P01'); click('.ci-row[data-name="P01"] [data-act="rep"][data-v="villain"]');
    open('P01'); click('.ci-row[data-name="P01"] [data-act="jobCost"][data-v="1"]');
    open('P01'); change('.ci-row[data-name="P01"] [data-field="age"]', '44');
    open('P01'); change('.ci-row[data-name="P01"] [data-field="job"]', 'welder');
    expect(setup('P01')).toMatchObject({ catfish: 'never', mode: 'edited', role: 'newcomer', rep: 'villain', jobCost: 1, age: 44, job: 'welder' });
    // and the row shows it
    expect(root().querySelector('.ci-row[data-name="P01"] [data-act="catfish"][data-v="never"]').classList.contains('on')).toBe(true);
  });

  it('Decide clears a pin rather than writing "decide"', () => {
    open('P02'); click('.ci-row[data-name="P02"] [data-act="catfish"][data-v="always"]');
    open('P02'); click('.ci-row[data-name="P02"] [data-act="catfish"][data-v=""]');
    expect(setup('P02').catfish).toBeUndefined();
  });

  it('Decide / Yes / No, and which persona only under Decide or Yes', () => {
    const row = '.ci-row[data-name="P03"]';
    open('P03');
    expect(root().querySelector(`${row} [data-field="persona"]`)).toBeTruthy();       // Decide
    click(`${row} [data-act="catfish"][data-v="always"]`);
    change(`${row} [data-field="persona"]`, 'ci-david');
    expect(setup('P03')).toMatchObject({ catfish: 'always', persona: 'ci-david' });
    click(`${row} [data-act="catfish"][data-v="never"]`);
    expect(root().querySelector(`${row} [data-field="persona"]`)).toBeNull();          // No: no persona to pick
    expect([...root().querySelectorAll(`${row} [data-act="catfish"]`)].map(b => b.textContent)).toEqual(['Decide', 'Yes', 'No']);
  });

  it('"Already famous?" says what it means, and Auto follows their past seasons', () => {
    const row = '.ci-row[data-name="P01"]';
    expect(root().querySelector(row).textContent).toMatch(/Already famous\?/);
    expect([...root().querySelectorAll(`${row} [data-act="rep"]`)].map(b => b.textContent)).toEqual(expect.arrayContaining(['Nobody', 'Known', 'A big threat', 'A villain']));
    expect(root().querySelector(`${row} .ci-rep-auto`).textContent).toMatch(/Auto/);
  });

  it('before the season starts, the card says so in plain words', () => {
    expect(root().querySelector('.ci-row .ci-draw').textContent).toMatch(/Waiting for episode 1/i);
  });

  it('once dealt, each card says what the player got and why', () => {
    window.gs = { ci: { dealt: {
      P01: { mode: 'catfish', personaId: 'ci-sienna', reason: 'strategic', edits: [], shown: { name: 'Sienna', age: 25, job: 'bartender' }, with: [] },
      P02: { mode: 'edited', personaId: null, reason: null, edits: ['job'], shown: { name: 'P02', age: 30, job: 'personal trainer' }, with: [] },
    }, unused: DEFAULT_POOL.slice(1).map(p => p.id) } };
    renderCircleCastSetup();
    expect(root().querySelector('.ci-row[data-name="P01"] .ci-draw').textContent).toMatch(/plays as.*Sienna, 25.*Strategic: a different face/is);
    // the faces say it at a glance
    expect(root().querySelector('[data-act="plan-who"][data-v="P01"] .ci-badge').textContent).toBe('as Sienna');
    expect(root().querySelector('[data-act="plan-who"][data-v="P02"] .ci-badge').textContent).toBe('edited');
    open('P02');
    expect(root().querySelector('.ci-row[data-name="P02"] .ci-draw').textContent).toMatch(/edited/i);
    window._ciSub = 'pool'; renderCircleCastSetup();
    expect(root().querySelector('.ci-pool-count').textContent).toMatch(/1 of 8/);
    expect(root().querySelector('.ci-pc[data-id="ci-sienna"] .ci-tag').textContent).toBe('P01');
  });
});

describe('the Catfish Pool', () => {
  beforeEach(() => { window._ciSub = 'pool'; renderCircleCastSetup(); });
  it('shows the default pool until the author changes it', () => {
    expect(root().querySelectorAll('.ci-pc')).toHaveLength(DEFAULT_POOL.length);
    expect(window.seasonConfig.ciPool).toBeUndefined();
  });

  it('editing a default persona makes the pool the author\'s, changing only that one', () => {
    click('.ci-pc[data-id="ci-grace"] [data-act="edit"]');
    change('.ci-editor [data-pfield="jobId"]', 'lawyer');
    const pool = window.seasonConfig.ciPool;
    expect(pool).toHaveLength(DEFAULT_POOL.length);
    expect(pool.find(p => p.id === 'ci-grace').jobId).toBe('lawyer');
    expect(pool.find(p => p.id === 'ci-kayla').jobId).toBe('college-student');
    // the editor shows the new way it types
    expect(root().querySelector('.ci-editor .ci-reg').textContent).toBe('FORMAL');
  });

  it('a new persona is whole from the first click, and its bio is written from its picks', () => {
    click('[data-act="new"]');
    const pool = window.seasonConfig.ciPool;
    const p = pool.at(-1);
    expect(pool).toHaveLength(DEFAULT_POOL.length + 1);
    for (const k of ['id', 'handle', 'age', 'gender', 'jobId', 'status', 'reasons', 'details', 'photo']) expect(p[k], k).toBeTruthy();
    expect(root().querySelector('.ci-editor .ci-bio').textContent.length).toBeGreaterThan(10);
    click('.ci-editor [data-act="detail"][data-v="dog"]');
    expect(pool.at(-1).details).toContain('dog');
    expect(root().querySelector('.ci-editor .ci-caught').textContent).toMatch(/the dog/);
  });

  it('duplicate, delete, no catfish, and back to the default', () => {
    click('.ci-pc[data-id="ci-jake"] [data-act="dup"]');
    expect(window.seasonConfig.ciPool).toHaveLength(9);
    click('.ci-pc[data-id="ci-jake"] [data-act="del"]');
    expect(window.seasonConfig.ciPool.some(p => p.id === 'ci-jake')).toBe(false);
    click('[data-act="none"]');
    expect(window.seasonConfig.ciPool).toEqual([]);
    expect(root().querySelectorAll('.ci-pc')).toHaveLength(0);
    click('[data-act="default"]');
    expect(window.seasonConfig.ciPool).toBeUndefined();
  });

  it('a persona pinned by a player cannot vanish silently: deleting it clears the pin', () => {
    window._ciSub = 'plan'; renderCircleCastSetup();
    open('P03'); change('.ci-row[data-name="P03"] [data-field="persona"]', 'ci-david');
    window._ciSub = 'pool'; renderCircleCastSetup();
    click('.ci-pc[data-id="ci-david"] [data-act="del"]');
    expect(setup('P03').persona).toBeUndefined();
  });

  it('your own image: stored, shown on the card, and named on the persona', async () => {
    const id = await putPhoto('data:image/png;base64,AAAA');
    click('.ci-pc[data-id="ci-grace"] [data-act="edit"]');
    window.ciSetPersonaPhoto('ci-grace', id);
    expect(window.seasonConfig.ciPool.find(p => p.id === 'ci-grace').face).toBe(`photo:${id}`);
    expect(await photoURL(`photo:${id}`)).toBe('data:image/png;base64,AAAA');
    expect(root().querySelector('.ci-editor .ci-slot').getAttribute('style')).toContain('data:image/png;base64,AAAA');
    click('.ci-editor [data-act="close"]');
    expect(root().querySelector('.ci-pc[data-id="ci-grace"] .ci-slot').getAttribute('style')).toContain('data:image/png;base64,AAAA');
  });
});

describe('the plan starts from Create Character', () => {
  it('shows the character\'s age, occupation and hometown in grey; typing overrides them', () => {
    window.players = [{ name: 'Gwen', archetype: 'hero', stats: {}, birthdate: '1990-09-21', occupation: 'Student', hometown: 'Toronto, Ontario' }];
    window._ciSub = 'plan'; renderCircleCastSetup();
    const row = '.ci-row[data-name="Gwen"]';
    expect(root().querySelector(`${row} [data-field="job"]`).placeholder).toBe('Student');
    expect(root().querySelector(`${row} [data-field="hometown"]`).placeholder).toBe('Toronto, Ontario');
    expect(Number(root().querySelector(`${row} [data-field="age"]`).placeholder)).toBeGreaterThan(30);
    expect(root().querySelector(`${row} [data-field="job"]`).value).toBe('');
    change(`${row} [data-field="job"]`, 'barista');
    expect(window.seasonConfig.ciSetup.Gwen.job).toBe('barista');
  });
});

describe('the plan reads Create Character from the roster, not the cast copy', () => {
  it('Hasan: the cast entry has none of it; the roster does', () => {
    window.FRANCHISE_ROSTER = [{ name: 'Hasan', slug: 'hasan', age: 25, occupation: 'Criminal law student', hometown: 'Chicago' }];
    window.players = [{ name: 'Hasan', slug: 'hasan', archetype: 'mastermind', stats: {} }];
    window._ciSub = 'plan'; renderCircleCastSetup();
    const row = '.ci-row[data-name="Hasan"]';
    expect(root().querySelector(`${row} [data-field="job"]`).placeholder).toBe('Criminal law student');
    expect(root().querySelector(`${row} [data-field="hometown"]`).placeholder).toBe('Chicago');
    expect(root().querySelector(`${row} [data-field="age"]`).placeholder).toBe('25');
    delete window.FRANCHISE_ROSTER;
  });
});

describe('tabs and the table', () => {
  it('Day 1 and Newcomers filter the faces; a pin shows on the badge', () => {
    click('[data-act="plan-tab"][data-v="newcomer"]');
    const n = root().querySelectorAll('.ci-ph-who').length;
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(6);
    click('[data-act="plan-tab"][data-v="all"]');
    open('P04'); click('.ci-row[data-name="P04"] [data-act="catfish"][data-v="never"]');
    expect(root().querySelector('[data-act="plan-who"][data-v="P04"] .ci-badge').textContent).toBe('1 pinned');
  });
  it('Everyone at a glance: one line per player, and a click opens them', () => {
    click('[data-act="plan-overview"]');
    expect(root().querySelectorAll('.ci-ov tbody tr')).toHaveLength(6);
    expect(root().querySelector('.ci-row')).toBeNull();
    click('.ci-ov tr[data-v="P05"]');
    expect(root().querySelector('.ci-row[data-name="P05"]')).toBeTruthy();
  });
});
