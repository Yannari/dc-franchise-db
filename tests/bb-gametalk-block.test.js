// The Block Buster talk names the block as it stands when the talk airs. The Block Buster is
// played after the veto, so the block it is played for includes the veto's replacement; before
// the veto meeting the three on the block are the three the HOH named. The user, 2026-10-24,
// on a talk aired before the veto: "Then Ben and the other one are in the chairs" — "ben wasnt
// nominated yet the veto and the replacement wasnt there yet so its a bit of a spoil".
import { describe, expect, it } from 'vitest';
import { gs, seasonConfig } from '../js/core.js';
import { gameTalkFor, hohWeekFor } from '../js/bb/story/gametalk.js';
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

  // the user, 2026-10-24: Vlad, who had just won the veto, said "I'm scared of the Block Buster... if I lose it,
  // it's my fault": a nominee who wins the veto takes themselves off at the meeting
  it('between the veto and the meeting, never casts the veto winner as one of the three', () => {
    const week = setup();
    week.vetoWinner = 'Nom2';
    const talk = gameTalkFor(week, ctxOf(week), { hoh: true, noms: true, veto: true, cer: false, safety: false }, new Set(), null);
    expect(JSON.stringify(talk.filter(t => /^bb\./.test(t.kind)).map(t => t.who))).not.toContain('"Nom2"');
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

// read 2026-10-25: Axel nominated Beth, made a deal with her, saved her with his own veto, and the
// replacement went home; the next morning he said "my whole HOH was about getting Beth out" and that
// Beth "knows I tried"
describe('the morning after, for an HOH who took the target down', () => {
  const lastWeek = (holder, saved) => ({ num: 1, hoh: 'Hoh', evicted: 'Nom2', plan: { target: 'Tgt', pawn: 'Nom2', nominees: ['Tgt', 'Nom2'], structure: 'target-pawn' },
    acts: [{ type: 'nominations', target: 'Tgt', nominees: ['Tgt', 'Nom2'] }, { type: 'veto-ceremony', used: true, holder, saved, replacement: 'Ben' }] });
  const morning = prev => {
    setup();
    gs.bb.weeks = [prev];
    const week = { num: 2, houseAtStart: NAMES.filter(n => n !== 'Nom2'), acts: [] };
    return hohWeekFor(week, { present: NAMES.filter(n => n !== 'Nom2'), stretch: 0 }, { hoh: false }, new Set(), 'Nom2').map(t => t.kind);
  };
  it('calls it a change of plan when the HOH used the veto on the target', () => {
    const kinds = morning(lastWeek('Hoh', 'Tgt'));
    expect(kinds).toContain('hohweek.verdict.changed');
    expect(kinds).not.toContain('hohweek.verdict.missed');
    expect(kinds).not.toContain('hohweek.verdict.pawn');
  });
  it('still calls it a backfire when somebody else saved the target', () => {
    expect(morning(lastWeek('Ann', 'Tgt'))).toContain('hohweek.verdict.pawn');
  });
});
