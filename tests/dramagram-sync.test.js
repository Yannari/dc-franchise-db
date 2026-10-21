// dramagram-sync.test.js — a season's photos reach the cast's Dramagram (the user, 2026-10-21: "can u
// automatically put those pics in their dramagram same for returnees avatar if they get one").
import { describe, expect, it } from 'vitest';
import { photosToSync, SLOT_MOOD } from '../js/dramagram-sync.js';

const playersDb = { players: [
  { id: 'lila', name: 'Lila', seasonDetails: [{ seasonId: 'ci-1', avatarFile: 'lila.png' }] },
  { id: 'hector', name: 'Hector', seasonDetails: [{ seasonId: 'ci-1', avatarFile: 'hector.png' }] },
  { id: 'courtney', name: 'Courtney', seasonDetails: [{ seasonId: '1', avatarFile: 'courtney.png' }, { seasonId: 'ci-2', avatarFile: 'courtney-ci.png' }] },
] };

describe('what goes to Dramagram', () => {
  it('a player\'s own Circle photos, each with its mood; a catfish keeps only the real one', () => {
    const plan = photosToSync({ cast: ['Lila', 'Hector'], seasonId: 'ci-1', playersDb,
      ciPhotos: { Lila: { throwback: 'photo:a1', naughty: 'photo:a2' }, Hector: { means: 'photo:b1', real: 'photo:b2' } },
      dealt: { Hector: { mode: 'catfish' } } });
    expect(plan.map(p => [p.slug, p.kind, p.mood])).toEqual([['lila', 'throwback', 'nostalgic'], ['lila', 'naughty', 'flirty'], ['hector', 'real', null]]);
  });
  it('a catfish\'s Circle profile goes up as a look back, never a Catfish face from the roster', () => {
    const pool = [{ id: 'p1', face: 'photo:n1', photos: { throwback: 'photo:n2' } }, { id: 'face:Courtney', fromRoster: 'Courtney', face: 'portrait:Courtney' }];
    const plan = photosToSync({ cast: ['Hector', 'Lila'], seasonId: 'ci-1', playersDb, pool,
      dealt: { Hector: { mode: 'catfish', personaId: 'p1' }, Lila: { mode: 'catfish', personaId: 'face:Courtney' } } });
    expect(plan.map(p => [p.slug, p.kind, p.mood])).toEqual([['hector', 'persona-profile', 'nostalgic'], ['hector', 'persona-throwback', 'nostalgic']]);
  });
  it('a returnee\'s portrait only when no earlier season used it, and never twice', () => {
    const portraitOf = n => ({ Courtney: { file: 'courtney-ci.png', url: 'assets/avatars/courtney-ci.png' }, Lila: { file: 'lila.png', url: 'assets/avatars/lila.png' } })[n];
    const plan = photosToSync({ cast: ['Courtney', 'Lila'], seasonId: 'ci-2', playersDb, portraitOf });
    expect(plan.map(p => [p.slug, p.kind])).toEqual([['courtney', 'avatar']]);
    expect(photosToSync({ cast: ['Courtney'], seasonId: 'ci-2', playersDb, portraitOf, synced: new Set([plan[0].key]) })).toEqual([]);
    // a first season is not a return
    expect(photosToSync({ cast: ['Lila'], seasonId: 'ci-1', playersDb, portraitOf })).toEqual([]);
  });
  it('every mood is one Dramagram knows', () => {
    const MOODS = ['low', 'sharp', 'flex', 'soft', 'flirty', 'chaos', 'nostalgic'];
    for (const m of Object.values(SLOT_MOOD)) if (m) expect(MOODS).toContain(m);
  });
});
