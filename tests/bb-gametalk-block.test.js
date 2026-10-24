// The Block Buster talk names the block as it stands when the talk airs. The Block Buster is
// played after the veto, so the block it is played for includes the veto's replacement; before
// the veto meeting the three on the block are the three the HOH named. The user, 2026-10-24,
// on a talk aired before the veto: "Then Ben and the other one are in the chairs" — "ben wasnt
// nominated yet the veto and the replacement wasnt there yet so its a bit of a spoil".
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { gameTalkFor } from '../js/bb/story/gametalk.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Hoh', 'Pal', 'Tgt', 'Nom2', 'Nom3', 'Ben', 'Ann', 'Joe'];

function setup() {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: 'floater' })), { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7 });
  gs.bb = { ...(gs.bb || {}), seasonSalt: 7, weeks: [], stats: {} };
  // Nom3 used the veto; Ben went up in Nom3's place, and the Block Buster is played for Tgt, Nom2, Ben
  const week = { num: 2, safetyMode: 'block-buster', houseAtStart: [...NAMES], hoh: 'Hoh',
    initialNominees: ['Tgt', 'Nom2', 'Nom3'], blockBeforeSafety: ['Tgt', 'Nom2', 'Ben'],
    acts: [{ type: 'nominations', target: 'Tgt', nominees: ['Tgt', 'Nom2', 'Nom3'] }] };
  return week;
}
const ctxOf = week => ({ present: [...NAMES], hoh: 'Hoh', nominees: [...week.initialNominees], stretch: 1 });

describe('the Block Buster talk before and after the veto', () => {
  it('before the veto meeting, talks about the three the HOH named, not the replacement', () => {
    const week = setup();
    const talk = gameTalkFor(week, ctxOf(week), { hoh: true, noms: true, veto: false, cer: false, safety: false }, new Set(), null);
    const hoh = talk.find(t => t.kind === 'bb.hoh');
    expect(hoh).toBeTruthy();
    expect(week.initialNominees).toContain(hoh.who.c);
    expect(week.initialNominees).toContain(hoh.who.d);
    for (const t of talk.filter(t => t.kind === 'bb.nominee' || t.kind === 'veto.hope')) {
      expect(week.initialNominees, t.kind).toContain(t.who.a);
    }
    expect(JSON.stringify(talk.map(t => t.who))).not.toContain('"Ben"');
  });

  it('after the veto meeting, talks about the block the Block Buster is played for', () => {
    const week = setup();
    const after = { ...ctxOf(week), nominees: [...week.blockBeforeSafety] };
    const talk = gameTalkFor(week, after, { hoh: true, noms: true, veto: true, cer: true, safety: false }, new Set(), null);
    const hoh = talk.find(t => t.kind === 'bb.hoh');
    expect(hoh).toBeTruthy();
    expect(week.blockBeforeSafety).toContain(hoh.who.d);
    expect(hoh.who.d).not.toBe('Nom3');
  });
});
