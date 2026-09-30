// ci-photos.test.js — the Photos panel's rules (Plan 4b, mockup v3 approved
// 2026-09-30). Slots are per PERSON, never per episode, so nothing reveals who
// wins a game or who is blocked; every empty slot falls back, so a season
// never waits on art.
import { describe, expect, it } from 'vitest';
import { KINDS, slotsFor, photoFor, promptForSlot, parseDrop, packPhotos, unpackPhotos } from '../js/ci/photos.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';

const sienna = { ...DEFAULT_POOL.find(p => p.id === 'ci-sienna'), face: 'photo:a1', photos: { naughty: 'photo:n1' } };
const cfg = { ciPool: [sienna], ciPhotos: { Beth: { means: 'photo:m1' }, Heather: { real: 'photo:r1' } } };

describe('which slots each person has', () => {
  it('a persona: what the room sees, never a "real me"', () => {
    expect(slotsFor({ persona: sienna })).toEqual(['profile', 'earned', 'means', 'naughty', 'nice', 'throwback', 'childhood']);
  });
  it('a player: the same, and who they really are', () => {
    expect(slotsFor({ player: 'Beth' })).toEqual([...KINDS.filter(k => k !== 'real'), 'real']);
  });
  it('once dealt, a player behind a persona keeps only the real one (the persona has the rest)', () => {
    expect(slotsFor({ player: 'Heather' }, { Heather: { mode: 'catfish' } })).toEqual(['real']);
    expect(slotsFor({ player: 'Beth' }, { Beth: { mode: 'honest' } })).toHaveLength(8);
  });
});

describe('an empty slot falls back', () => {
  it('a persona: its own photo, then its profile photo, then nothing (the screens show the initial)', () => {
    expect(photoFor({ persona: sienna }, 'naughty', cfg)).toEqual({ face: 'photo:n1', own: true });
    expect(photoFor({ persona: sienna }, 'earned', cfg)).toEqual({ face: 'photo:a1', own: false });
    expect(photoFor({ persona: sienna }, 'nice', cfg)).toEqual({ face: null, own: false });
    expect(photoFor({ persona: { ...sienna, face: null } }, 'profile', cfg)).toEqual({ face: null, own: false });
  });
  it('a player: their own photo, then the profile photo, then their portrait', () => {
    expect(photoFor({ player: 'Beth' }, 'means', cfg)).toEqual({ face: 'photo:m1', own: true });
    expect(photoFor({ player: 'Beth' }, 'earned', cfg)).toEqual({ face: 'portrait:Beth', own: false });
    expect(photoFor({ player: 'Heather' }, 'real', cfg)).toEqual({ face: 'photo:r1', own: true });
    expect(photoFor({ player: 'Beth' }, 'real', cfg)).toEqual({ face: 'portrait:Beth', own: false });
    expect(photoFor({ player: 'Beth' }, 'naughty', cfg)).toEqual({ face: null, own: false });
  });
});

describe('the prompt for each slot', () => {
  it('a persona slot is built from its picks, and says what the photo is for', () => {
    const p = promptForSlot({ persona: sienna }, 'naughty');
    expect(p).toMatch(/^Sienna, 25/);
    expect(p).toMatch(/long blond hair/);
    expect(p).toMatch(/cheeky|playful/);
    expect(promptForSlot({ persona: sienna }, 'earned')).toMatch(/same face/);
  });
  it('a player slot keeps them looking like themselves', () => {
    expect(promptForSlot({ player: 'Beth', age: 22 }, 'childhood')).toMatch(/^Beth.*child/i);
    expect(promptForSlot({ player: 'Beth' }, 'real')).toMatch(/Beth/);
  });
  it('every kind has words for both', () => {
    for (const k of KINDS) {
      if (k !== 'real') expect(promptForSlot({ persona: sienna }, k)).not.toMatch(/undefined/);
      expect(promptForSlot({ player: 'Beth' }, k)).not.toMatch(/undefined/);
    }
  });
});

describe('a batch drop sorts itself by file name', () => {
  const people = { personas: [sienna, DEFAULT_POOL.find(p => p.id === 'ci-david')], players: ['Beth', 'Anne Maria', 'Heather'] };
  it('name-kind finds its slot, any case, any separator, any image type', () => {
    expect(parseDrop('sienna-naughty.png', people)).toEqual({ persona: 'ci-sienna', kind: 'naughty' });
    expect(parseDrop('Beth_Childhood.JPG', people)).toEqual({ player: 'Beth', kind: 'childhood' });
    expect(parseDrop('anne-maria-real.webp', people)).toEqual({ player: 'Anne Maria', kind: 'real' });
    expect(parseDrop('07-david-profile.png', people)).toEqual({ persona: 'ci-david', kind: 'profile' });
  });
  it('a word for a kind the real show uses works too', () => {
    expect(parseDrop('beth-baby.png', people)?.kind).toBe('childhood');
    expect(parseDrop('beth-this-is-me.png', people)?.kind).toBe('means');
    expect(parseDrop('heather-goodbye.png', people)?.kind).toBe('real');
  });
  it('anything it cannot place goes to the tray (null)', () => {
    expect(parseDrop('IMG_2231.png', people)).toBeNull();
    expect(parseDrop('sienna.png', people)).toBeNull();
    expect(parseDrop('nobody-naughty.png', people)).toBeNull();
  });
  it('a name that is both a persona and a player means the persona only when the player has no such slot', () => {
    const both = { personas: [{ ...sienna, handle: 'Beth', id: 'p-beth' }], players: ['Beth'] };
    expect(parseDrop('beth-real.png', both)).toEqual({ player: 'Beth', kind: 'real' });
  });
});

describe('a season pack', () => {
  it('carries the pool, the players\' photos and every image, and comes back the same', async () => {
    const images = { a1: 'data:image/jpeg;base64,AAA', n1: 'data:image/jpeg;base64,BBB', m1: 'data:x', r1: 'data:y' };
    const pack = await packPhotos(cfg, id => images[id]);
    expect(pack.format).toBe('the-circle-photos');
    expect(Object.keys(pack.images).sort()).toEqual(['a1', 'm1', 'n1', 'r1']);
    const got = await unpackPhotos(JSON.parse(JSON.stringify(pack)));
    expect(got.ciPool[0].photos.naughty).toBe('photo:n1');
    expect(got.ciPhotos.Beth.means).toBe('photo:m1');
    expect(got.images.n1).toBe(images.n1);
  });
  it('refuses a file that is not a pack, in words', async () => {
    await expect(unpackPhotos({ hello: 1 })).rejects.toThrow(/not a Circle photo pack/);
  });
});
