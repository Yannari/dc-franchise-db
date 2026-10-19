// @vitest-environment jsdom
// ci-photos-ui.test.js — the Photos tab (Plan 4b, mockup v3 approved
// 2026-09-30): one person at a time, the show's own look, every slot writes
// where the screens will read it.
import { beforeEach, describe, expect, it } from 'vitest';
import { renderCircleCastSetup } from '../js/ci-cast-ui.js';
import { ciDropFiles, ciExportPack, ciImportPack } from '../js/ci-photos-ui.js';
import { _memoryPhotos, photoURL } from '../js/ci/photo-store.js';
import { makePlayers } from './helpers/ci-cast.js';
import { setPlayers } from '../js/core.js';

const root = () => document.getElementById('sec-ci-cast');
const $ = s => root().querySelector(s);
const click = s => { const el = $(s); if (!el) throw new Error(`no ${s}`); el.click(); };

beforeEach(() => {
  document.body.innerHTML = '<section id="sec-ci-cast"></section>';
  window.seasonConfig = { format: 'the-circle', ciSetup: {} };
  window.players = makePlayers(5);
  window.gs = null;
  window.saveConfig = () => {};
  window._ciSub = null; window._ciPhotoTab = null; window._ciPhotoWho = null; window._ciPhotoKind = null; window._ciTray = [];
  _memoryPhotos();
  renderCircleCastSetup();
});

describe('three tabs in the Circle view', () => {
  it('opens on the Profile Plan; the Photos tab shows the show\'s own panel', () => {
    expect($('.ci-row')).toBeTruthy();
    click('[data-act="sub"][data-v="photos"]');
    expect($('.ci-row')).toBeNull();
    expect($('.ci-photos').textContent).toMatch(/THE CIRCLE/);
    expect($('.ci-photos').textContent).toMatch(/PHOTOS/);
  });
});

describe('one person at a time', () => {
  beforeEach(() => click('[data-act="sub"][data-v="photos"]'));

  it('personas first: the rail is the pool, the stage the first persona', () => {
    expect(root().querySelectorAll('.ci-ph-who')).toHaveLength(8);
    expect($('.ci-ph-card .ci-ph-nm').textContent).toBe('Kayla');
    expect(root().querySelectorAll('.ci-ph-slot')).toHaveLength(7);
  });

  it('players: every player, eight slots each until the deal says otherwise', () => {
    click('[data-act="ph-tab"][data-v="players"]');
    expect(root().querySelectorAll('.ci-ph-who')).toHaveLength(5);
    expect(root().querySelectorAll('.ci-ph-slot')).toHaveLength(8);
    window.gs = { ci: { dealt: { P01: { mode: 'catfish' } } } };
    renderCircleCastSetup();
    expect(root().querySelectorAll('.ci-ph-slot')).toHaveLength(1);
    expect($('.ci-ph-slot').textContent).toMatch(/Real me/);
  });

  it('picking a slot tells the Circle what to do, and gives its prompt', () => {
    click('[data-act="ph-who"][data-v="ci-sienna"]');
    click('[data-act="ph-slot"][data-v="naughty"]');
    expect($('.ci-ph-cmd').textContent).toMatch(/Circle, upload Sienna's naughty/);
    expect($('.ci-ph-txt').dataset.full).toMatch(/^Sienna, 25/);
    expect($('.ci-ph-when').textContent).toMatch(/Two Faced/);
  });

  it('a photo lands where the screens read it: a persona\'s in the pool, a player\'s in ciPhotos', () => {
    window.ciSetSlotPhoto({ persona: 'ci-sienna' }, 'naughty', 'n1');
    window.ciSetSlotPhoto({ persona: 'ci-sienna' }, 'profile', 'p1');
    const s = window.seasonConfig.ciPool.find(p => p.id === 'ci-sienna');
    expect(s.photos.naughty).toBe('photo:n1');
    expect(s.face).toBe('photo:p1');
    window.ciSetSlotPhoto({ player: 'P02' }, 'real', 'r1');
    expect(window.seasonConfig.ciPhotos.P02.real).toBe('photo:r1');
    // and the count moves
    expect($('.ci-ph-count').textContent).toMatch(/^3 /);
  });

  it('delete empties the slot and it falls back again', () => {
    window.ciSetSlotPhoto({ persona: 'ci-kayla' }, 'earned', 'e1');
    click('[data-act="ph-slot"][data-v="earned"]');
    click('[data-act="ph-del"]');
    expect(window.seasonConfig.ciPool.find(p => p.id === 'ci-kayla').photos.earned).toBeUndefined();
  });
});

describe('a batch drop', () => {
  it('named files find their slot; the rest wait in the tray; an ALERT! says so', async () => {
    click('[data-act="sub"][data-v="photos"]');
    await ciDropFiles([{ name: 'kayla-naughty.png', dataUrl: 'data:a' }, { name: 'P03-childhood.jpg', dataUrl: 'data:b' }, { name: 'IMG_0042.png', dataUrl: 'data:c' }]);
    expect(window.seasonConfig.ciPool.find(p => p.id === 'ci-kayla').photos.naughty).toMatch(/^photo:/);
    expect(window.seasonConfig.ciPhotos.P03.childhood).toMatch(/^photo:/);
    expect(window._ciTray).toHaveLength(1);
    expect($('.ci-ph-alert').textContent).toMatch(/ALERT!.*2 photos found their slots.*1 is waiting in the tray/s);
  });

  it('a tray photo goes where you put it', async () => {
    click('[data-act="sub"][data-v="photos"]');
    await ciDropFiles([{ name: 'IMG_0042.png', dataUrl: 'data:c' }]);
    click('[data-act="ph-tray"][data-v="0"]');
    click('[data-act="ph-slot"][data-v="nice"]');
    expect(window.seasonConfig.ciPool.find(p => p.id === 'ci-kayla').photos.nice).toMatch(/^photo:/);
    expect(window._ciTray).toHaveLength(0);
  });
});

describe('a season pack', () => {
  it('export, then import on a fresh browser, gives the same faces', async () => {
    window.ciSetSlotPhoto({ persona: 'ci-sienna' }, 'profile', 'p1');
    const { putPhotoWithId } = await import('../js/ci/photo-store.js');
    await putPhotoWithId('p1', 'data:image/png;base64,QQ');
    const pack = await ciExportPack();
    _memoryPhotos();
    window.seasonConfig = { format: 'the-circle', ciSetup: {} };
    await ciImportPack(JSON.parse(JSON.stringify(pack)));
    expect(window.seasonConfig.ciPool.find(p => p.id === 'ci-sienna').face).toBe('photo:p1');
    expect(await photoURL('photo:p1')).toBe('data:image/png;base64,QQ');
  });
});

import { vi } from 'vitest';
describe('the cloud, like the character gallery', () => {
  it('says where the photos are, and backs them up with the studio token', async () => {
    click('[data-act="sub"][data-v="photos"]');
    expect($('.ci-ph-cloud').textContent).toMatch(/only in this browser/i);
    window.ciSetSlotPhoto({ persona: 'ci-sienna' }, 'profile', 'aaaa1111');
    const { putPhotoWithId } = await import('../js/ci/photo-store.js');
    await putPhotoWithId('aaaa1111', 'data:image/jpeg;base64,QUFB');
    localStorage.setItem('studio_api_token', 'secret');
    const puts = [];
    vi.stubGlobal('fetch', async (u, o = {}) => {
      if (String(u).includes('/api/gallery/circle-photos')) return new Response(JSON.stringify({ ok: true, images: [] }));
      puts.push(o.method); return new Response(JSON.stringify({ ok: true }));
    });
    await window.ciBackUpPhotos();
    expect(puts).toEqual(['PUT']);
    expect($('.ci-ph-alert').textContent).toMatch(/1 photo backed up to the cloud/);
    expect($('.ci-ph-cloud').textContent).toMatch(/cloud/i);
    vi.unstubAllGlobals();
    localStorage.removeItem('studio_api_token');
  });
});

const withFace = () => { const list = [...makePlayers(3), { name: 'Ella', gender: 'f', stats: {}, tribe: 'Catfish faces' }]; window.players = list; setPlayers(list); };
// 2026-10-19, the user: "Circle, send it doesn't work, only for catfish".
describe('a photo goes where the screen says, for everyone', () => {
  beforeEach(() => click('[data-act="sub"][data-v="photos"]'));

  it('a catfish player has only Real me: a slot picked on somebody else does not follow them', () => {
    click('[data-act="ph-slot"][data-v="naughty"]');            // a persona's slot
    window.gs = { ci: { dealt: { P01: { mode: 'catfish', shown: { name: 'Kayla' } } } } };
    click('[data-act="ph-tab"][data-v="players"]');
    window.ciSetSlotPhoto({ player: 'P01' }, 'real', 'r1');
    renderCircleCastSetup();
    expect($('.ci-ph-slot.sel').textContent).toMatch(/Real me/);
    // Delete acts on the slot on screen, not on "naughty".
    click('[data-act="ph-del"]');
    expect(window.seasonConfig.ciPhotos.P01.real).toBeUndefined();
  });

  it('a Catfish face (a real character) keeps their photos under their name', () => {
    withFace();
    renderCircleCastSetup();
    expect($('.ci-ph-card .ci-ph-nm').textContent).toBe('Ella');
    window.ciSetSlotPhoto({ persona: 'face:Ella' }, 'profile', 'e1');
    expect(window.seasonConfig.ciPhotos.Ella.profile).toBe('photo:e1');
    expect($('.ci-ph-cst').textContent).toMatch(/^1 of/);
    // and writing it did not turn the faces-only pool into the default one
    expect(window.seasonConfig.ciPool).toBeUndefined();
    setPlayers([]);
  });

  it('+ New persona in a faces-only pool adds one persona, not the eight stock ones too', () => {
    withFace();
    window._ciSub = 'pool';
    renderCircleCastSetup();
    click('[data-act="new"]');
    expect(window.seasonConfig.ciPool.map(p => p.handle)).toEqual(['New persona']);
    setPlayers([]);
  });
});
