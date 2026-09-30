import { describe, expect, it, beforeEach } from 'vitest';
import { setGs } from '../js/core.js';
import { streamFor } from '../js/dr/rng.js';
import { newState } from '../js/ci/state.js';
import { truthOf, medianAge, catfishMotive, reasonFor, drawPersonas, buildProfiles, MOTIVE_LINE, EDIT_LINE } from '../js/ci/profiles.js';
import { makePlayers, makePool } from './helpers/ci-cast.js';

beforeEach(() => setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] }));
const truths = (n, seed, setup = {}) => makePlayers(n, seed).map(p => truthOf(p, setup[p.name] || {}));
// The first seed whose cast has a player between the edit line and the persona
// line (the motive weights are calibrated, so no fixed seed is safe).
function castWithBetween(n = 12) {
  for (let seed = 1; seed < 200; seed++) {
    const t = truths(n, seed), med = medianAge(t);
    if (t.some(x => { const m = catfishMotive(x, med); return m >= EDIT_LINE && m < MOTIVE_LINE; })) return { t, seed };
  }
  throw new Error('no cast with a player between the lines');
}

describe('the catfish motive', () => {
  it('rises with strategy, boldness and costly facts, and falls with loyalty', () => {
    const base = { name: 'X', gender: 'f', archetype: 'floater', age: 25, alum: false, rep: null, jobCost: 0,
      stats: { strategic: 5, boldness: 5, loyalty: 5 } };
    const m = catfishMotive(base, 25);
    expect(catfishMotive({ ...base, stats: { ...base.stats, strategic: 9 } }, 25)).toBeGreaterThan(m);
    expect(catfishMotive({ ...base, stats: { ...base.stats, loyalty: 9 } }, 25)).toBeLessThan(m);
    expect(catfishMotive({ ...base, age: 54 }, 25)).toBeGreaterThan(m);
    expect(catfishMotive({ ...base, alum: true, rep: 'villain' }, 25)).toBeGreaterThan(m);
  });

  it('never gives a nice archetype a strategic reason', () => {
    const hero = { archetype: 'hero', stats: { strategic: 9, loyalty: 1 } };
    const villain = { archetype: 'villain', stats: { strategic: 9, loyalty: 1 } };
    expect(reasonFor(hero, { reasons: ['strategic'] })).toBeNull();
    expect(reasonFor(hero, { reasons: ['strategic', 'protective'] })).toBe('protective');
    expect(reasonFor(villain, { reasons: ['strategic'] })).toBe('strategic');
  });
});

describe('drawing from the Catfish Pool', () => {
  it('an empty pool gives no catfish, and the motivated play Edited instead', () => {
    const t = truths(12, 4);
    const d = drawPersonas(t, [], streamFor(4, 'pool'), 'stats');
    expect(Object.keys(d.assigned)).toHaveLength(0);
    const median = medianAge(t);
    const wanting = t.filter(x => catfishMotive(x, median) >= EDIT_LINE).map(x => x.name);
    expect(d.edited.sort()).toEqual(wanting.sort());
  });

  it('a player with a reason to hide something, but not enough to be somebody else, edits instead', () => {
    // Real US 1: Alana played herself and kept quiet about modelling.
    expect(EDIT_LINE).toBeLessThan(MOTIVE_LINE);
    const { t, seed } = castWithBetween();
    const median = medianAge(t);
    const d = drawPersonas(t, makePool(20, seed), streamFor(seed, 'pool'), 'stats');
    const between = t.filter(x => { const m = catfishMotive(x, median); return m >= EDIT_LINE && m < MOTIVE_LINE; });
    expect(between.length).toBeGreaterThan(0);
    for (const x of between) {
      expect(d.assigned[x.name], x.name).toBeUndefined();
      expect(d.edited, x.name).toContain(x.name);
    }
  });

  it('a big pool leaves personas unused', () => {
    const t = truths(10, 5);
    const pool = makePool(20, 5);
    const d = drawPersonas(t, pool, streamFor(5, 'pool'), 'stats');
    expect(d.unused.length).toBeGreaterThan(0);
    expect(Object.keys(d.assigned).length + d.unused.length).toBe(20);
  });

  it('honours pins, ignores a pin to a persona that does not exist, and never catfishes a Never', () => {
    const players = makePlayers(8, 6);
    const [a, b, c] = players.map(p => p.name);
    const setup = { [a]: { catfish: 'persona-2' }, [b]: { catfish: 'persona-99' }, [c]: { catfish: 'never' } };
    const t = players.map(p => truthOf(p, setup[p.name] || {}));
    const d = drawPersonas(t, makePool(6, 6), streamFor(6, 'pool'), 'stats');
    expect(d.assigned[a].personaId).toBe('persona-2');
    expect(d.assigned[c]).toBeUndefined();
    expect(Object.values(d.assigned).filter(x => x.personaId === 'persona-99')).toHaveLength(0);
  });

  it('random mode uses some personas and not others', () => {
    let used = 0, runs = 0;
    for (let s = 1; s <= 20; s++) {
      const d = drawPersonas(truths(10, s), makePool(10, s), streamFor(s * 7919, 'pool'), 'random');
      used += Object.keys(d.assigned).length; runs++;
    }
    const mean = used / runs;
    expect(mean).toBeGreaterThan(2);
    expect(mean).toBeLessThan(8);
  });

  it('bios do not move the draw', () => {
    const t = truths(12, 8);
    const pool = makePool(8, 8);
    const d1 = drawPersonas(t, pool, streamFor(8, 'pool'), 'stats');
    const d2 = drawPersonas(t, pool.map(p => ({ ...p, bio: 'a completely different bio' })), streamFor(8, 'pool'), 'stats');
    expect(d2.assigned).toEqual(d1.assigned);
  });
});

describe('building profiles', () => {
  it('gives catfish the persona\'s face and facts, unique handles, and a gap', () => {
    const s = newState(3);
    const players = makePlayers(10, 3);
    const t = players.map(p => truthOf(p, {}));
    const pool = makePool(10, 3);
    const d = drawPersonas(t, pool, streamFor(3, 'pool'), 'stats');
    const handles = buildProfiles(s, t, d, pool, streamFor(3, 'profiles'));
    expect(new Set(handles).size).toBe(handles.length);
    for (const [name, { personaId }] of Object.entries(d.assigned)) {
      const p = s.profiles[s.handleOf[name]];
      const persona = pool.find(x => x.id === personaId);
      expect(p.mode).toBe('catfish');
      expect(p.shown).toMatchObject({ name: persona.handle, age: persona.age, face: persona.face });
      expect(p.gap).toBeGreaterThan(0);
    }
    const honest = Object.values(s.profiles).filter(p => p.mode === 'honest');
    for (const p of honest) expect(p.gap).toBe(0);
    expect(s.unused).toEqual(d.unused);
  });

  it('puts two partners on one shared profile', () => {
    const s = newState(2);
    const players = makePlayers(6, 2);
    const [a, b] = players.map(p => p.name);
    const t = players.map(p => truthOf(p, p.name === a ? { partner: b } : p.name === b ? { partner: a } : {}));
    const d = drawPersonas(t, [], streamFor(2, 'pool'), 'stats');
    buildProfiles(s, t, d, [], streamFor(2, 'profiles'));
    expect(s.handleOf[a]).toBe(s.handleOf[b]);
    expect(s.profiles[s.handleOf[a]]).toMatchObject({ mode: 'shared', players: [a, b] });
    expect(Object.keys(s.profiles)).toHaveLength(5);
  });

  it('never hands the second partner a persona of their own, and keeps the pair\'s persona', () => {
    const players = makePlayers(6, 2);
    const [a, b] = players.map(p => p.name);
    const setup = { [a]: { partner: b, catfish: 'persona-1' }, [b]: { partner: a, catfish: 'always' } };
    const t = players.map(p => truthOf(p, setup[p.name] || {}));
    const pool = makePool(4, 2);
    const d = drawPersonas(t, pool, streamFor(2, 'pool'), 'stats');
    expect(d.assigned[b]).toBeUndefined();
    expect(d.edited).not.toContain(b);
    expect(Object.keys(d.assigned).length + d.unused.length).toBe(4);   // nothing lost
    const s = newState(2);
    buildProfiles(s, t, d, pool, streamFor(2, 'profiles'));
    const p = s.profiles[s.handleOf[a]];
    expect(p).toMatchObject({ mode: 'catfish', shared: true, players: [a, b], personaId: 'persona-1' });
  });
});

describe('the mode pin on the Profile Plan (spec 4.2: honest, polished, edited)', () => {
  const median = t => medianAge(t);
  it('Edited always edits, even a player with no reason to', () => {
    const t = truths(12, 4);
    const calm = t.find(x => catfishMotive(x, median(t)) < EDIT_LINE);
    calm.mode = 'edited';
    const d = drawPersonas(t, makePool(20, 4), streamFor(4, 'pool'), 'stats');
    expect(d.edited).toContain(calm.name);
    expect(d.assigned[calm.name]).toBeUndefined();
  });

  it('Honest never edits, however much they have to hide', () => {
    const { t, seed } = castWithBetween();
    const keen = t.filter(x => { const m = catfishMotive(x, median(t)); return m >= EDIT_LINE && m < MOTIVE_LINE; })[0];
    keen.mode = 'honest';
    const d = drawPersonas(t, makePool(20, seed), streamFor(seed, 'pool'), 'stats');
    expect(d.edited).not.toContain(keen.name);
  });

  it('Never means never a persona: a player with a reason still hides one fact', () => {
    const t = truths(12, 4);
    const keen = t.filter(x => catfishMotive(x, median(t)) >= EDIT_LINE)[0];
    keen.catfish = 'never';
    const d = drawPersonas(t, makePool(20, 4), streamFor(4, 'pool'), 'stats');
    expect(d.assigned[keen.name]).toBeUndefined();
    expect(d.edited).toContain(keen.name);
  });

  it('the pin reaches the profile: Polished and Honest are shown as asked', () => {
    const players = makePlayers(8, 6);
    const setup = { [players[0].name]: { mode: 'polished', catfish: 'never' }, [players[1].name]: { mode: 'honest', catfish: 'never' } };
    const t = players.map(p => truthOf(p, setup[p.name] || {}));
    const state = newState(6);
    const d = drawPersonas(t, [], streamFor(6, 'pool'), 'stats');
    buildProfiles(state, t, d, [], streamFor(6, 'profiles'));
    const modeOf = n => state.profiles[state.handleOf[n]].mode;
    expect(modeOf(players[0].name)).toBe('polished');
    expect(modeOf(players[1].name)).toBe('honest');
  });
});

describe('the Profile Plan starts from Create Character', () => {
  const base = { name: 'Gwen', gender: 'f', archetype: 'loner', stats: { strategic: 5 } };
  it('occupation, hometown and age come from the character; the plan overrides them', () => {
    const t = truthOf({ ...base, age: 26, occupation: 'Student', hometown: 'Toronto, Ontario' });
    expect(t).toMatchObject({ age: 26, job: 'student', hometown: 'Toronto, Ontario' });
    const o = truthOf({ ...base, age: 26, occupation: 'Student', hometown: 'Toronto' }, { age: 31, job: 'nurse', hometown: 'Ottawa' });
    expect(o).toMatchObject({ age: 31, job: 'nurse', hometown: 'Ottawa' });
  });
  it('a birthdate with no age gives the age', () => {
    const t = truthOf({ ...base, birthdate: '1988-03-02' });
    expect(t.age).toBeGreaterThanOrEqual(37);
    expect(t.age).toBeLessThanOrEqual(39);
  });
  it('nothing on the character: the same as before', () => {
    expect(truthOf(base)).toMatchObject({ age: 25, job: null, hometown: null });
  });
});

describe('plays as someone else: Decide / Yes / No, and which persona', () => {
  const pool = () => makePool(8, 11);
  it('Yes with a persona takes that persona', () => {
    const players = makePlayers(8, 6);
    const t = players.map((p, i) => truthOf(p, i === 0 ? { catfish: 'always', persona: 'persona-3' } : {}));
    const d = drawPersonas(t, pool(), streamFor(6, 'pool'), 'stats');
    expect(d.assigned[players[0].name]?.personaId).toBe('persona-3');
  });
  it('Decide with a persona: if the motive says they catfish, it is that persona', () => {
    for (let seed = 1; seed < 40; seed++) {
      const players = makePlayers(12, seed);
      const med = medianAge(players.map(p => truthOf(p)));
      const keen = players.find(p => catfishMotive(truthOf(p), med) >= MOTIVE_LINE);
      if (!keen) continue;
      const t = players.map(p => truthOf(p, p === keen ? { persona: 'persona-8' } : {}));
      const d = drawPersonas(t, pool(), streamFor(seed, 'pool'), 'stats');
      if (!d.assigned[keen.name]) continue;
      expect(d.assigned[keen.name].personaId).toBe('persona-8');
      return;
    }
    throw new Error('no cast with a keen player');
  });
  it('an older saved pin (a persona id as catfish) still reads as Yes with that persona', () => {
    const t = truthOf(makePlayers(1, 1)[0], { catfish: 'persona-2' });
    expect(t).toMatchObject({ catfish: 'always', persona: 'persona-2' });
  });
});

describe('already famous? how the room might already know them', () => {
  const p = { name: 'X', gender: 'f', archetype: 'floater', age: 25, stats: { strategic: 5, boldness: 5, loyalty: 5 } };
  it('the more famous, the more reason to hide: nobody < known < a big threat < a villain', () => {
    const m = rep => catfishMotive(truthOf(p, rep ? { rep } : {}), 25);
    expect(m('none')).toBeLessThan(m('known'));
    expect(m('known')).toBeLessThan(m('threat'));
    expect(m('threat')).toBeLessThan(m('villain'));
  });
  it('left alone, it follows what the season hands in from their past (autoRep), else returnee or not', () => {
    expect(truthOf(p, { autoRep: 'threat' }).rep).toBe('threat');
    expect(truthOf({ ...p, isReturnee: true }).rep).toBe('known');
    expect(truthOf(p).rep).toBe('none');
    expect(truthOf(p, { autoRep: 'villain', rep: 'none' }).rep).toBe('none');
  });
});
