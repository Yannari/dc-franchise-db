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

beforeEach(() => {
  document.body.innerHTML = '<section id="sec-ci-cast"></section>';
  window.seasonConfig = { format: 'the-circle', ciSetup: {} };
  window.players = makePlayers(6);
  window.gs = null;
  window.saveConfig = () => {};
  _memoryPhotos();
  renderCircleCastSetup();
});

describe('the Profile Plan', () => {
  it('draws one row per player, each waiting for the deal', () => {
    expect(root().querySelectorAll('.ci-row')).toHaveLength(6);
    expect(root().querySelector('.ci-row .ci-draw').textContent).toMatch(/not dealt yet/i);
  });

  it('every pin writes the setup the engine reads', () => {
    click('.ci-row[data-name="P01"] [data-act="catfish"][data-v="never"]');
    click('.ci-row[data-name="P01"] [data-act="mode"][data-v="edited"]');
    click('.ci-row[data-name="P01"] [data-act="role"][data-v="newcomer"]');
    click('.ci-row[data-name="P01"] [data-act="rep"][data-v="villain"]');
    click('.ci-row[data-name="P01"] [data-act="jobCost"][data-v="1"]');
    change('.ci-row[data-name="P01"] [data-field="age"]', '44');
    change('.ci-row[data-name="P01"] [data-field="job"]', 'welder');
    expect(setup('P01')).toMatchObject({ catfish: 'never', mode: 'edited', role: 'newcomer', rep: 'villain', jobCost: 1, age: 44, job: 'welder' });
    // and the row shows it
    expect(root().querySelector('.ci-row[data-name="P01"] [data-act="catfish"][data-v="never"]').classList.contains('on')).toBe(true);
  });

  it('Decide clears a pin rather than writing "decide"', () => {
    click('.ci-row[data-name="P02"] [data-act="catfish"][data-v="always"]');
    click('.ci-row[data-name="P02"] [data-act="catfish"][data-v=""]');
    expect(setup('P02').catfish).toBeUndefined();
  });

  it('a pin to a persona names one from the pool', () => {
    change('.ci-row[data-name="P03"] [data-field="catfish"]', 'ci-david');
    expect(setup('P03').catfish).toBe('ci-david');
  });

  it('once dealt, each card says what the player got and why', () => {
    window.gs = { ci: { dealt: {
      P01: { mode: 'catfish', personaId: 'ci-sienna', reason: 'strategic', edits: [], shown: { name: 'Sienna', age: 25, job: 'bartender' }, with: [] },
      P02: { mode: 'edited', personaId: null, reason: null, edits: ['job'], shown: { name: 'P02', age: 30, job: 'personal trainer' }, with: [] },
    }, unused: DEFAULT_POOL.slice(1).map(p => p.id) } };
    renderCircleCastSetup();
    expect(root().querySelector('.ci-row[data-name="P01"] .ci-draw').textContent).toMatch(/plays as.*Sienna, 25.*Strategic: a different face/is);
    expect(root().querySelector('.ci-row[data-name="P02"] .ci-draw').textContent).toMatch(/edited/i);
    expect(root().querySelector('.ci-pool-count').textContent).toMatch(/1 of 8/);
    expect(root().querySelector('.ci-pc[data-id="ci-sienna"] .ci-tag').textContent).toBe('P01');
  });
});

describe('the Catfish Pool', () => {
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
    change('.ci-row[data-name="P03"] [data-field="catfish"]', 'ci-david');
    click('.ci-pc[data-id="ci-david"] [data-act="del"]');
    expect(setup('P03').catfish).toBeUndefined();
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
