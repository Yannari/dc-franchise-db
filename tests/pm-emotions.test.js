import { beforeEach, describe, expect, it } from 'vitest';
import { setGs, setPlayers } from '../js/core.js';
import { setRelationshipDimension } from '../js/relationships.js';
import { streamFor } from '../js/dr/rng.js';
import { syncLadder, believeStep } from '../js/pm/ladder.js';
import { attachment, attachmentLabel, emo, jealousyHit, jealousyOutlet, tickEmotions, breakHeart,
  rebounding, walkRisk, effectiveTemperament } from '../js/pm/emotions.js';

const P = (name, gender, archetype, stats = {}) => ({ name, gender, sexuality: 'straight', archetype, intent: 'love',
  stats: { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5, ...stats } });
let state;
beforeEach(() => {
  const cast = [P('Anx', 'f', 'underdog', { loyalty: 9, temperament: 2 }), P('Sec', 'f', 'hero', { loyalty: 6, temperament: 9 }),
    P('Avo', 'f', 'mastermind', { loyalty: 1, strategic: 9, temperament: 6 }), P('M1', 'm', 'floater'), P('M2', 'm', 'floater'),
    P('M3', 'm', 'floater'), P('R', 'f', 'floater')];
  setPlayers(cast);
  setGs({ bonds: {}, relationshipDimensions: {} });
  state = { day: 5, villa: cast.map(p => p.name), profiles: Object.fromEntries(cast.map(p => [p.name, p])),
    couples: [['Anx', 'M1'], ['Sec', 'M2'], ['Avo', 'M3']], shows: {}, believes: {} };
  syncLadder(state);
  for (const [f, m] of state.couples) { setRelationshipDimension(f, m, 'attraction', 8); setRelationshipDimension(f, m, 'love', 7); }
});

describe('attachment, from the stats', () => {
  it('reads anxious, secure and avoidant', () => {
    expect(attachmentLabel(state.profiles.Anx)).toBe('anxious');
    expect(attachmentLabel(state.profiles.Sec)).toBe('secure');
    expect(attachmentLabel(state.profiles.Avo)).toBe('avoidant');
    expect(attachment(state.profiles.Anx).anxiety).toBeGreaterThan(attachment(state.profiles.Sec).anxiety);
  });
});

describe('jealousy, the way the research found it', () => {
  it('before a threat is confirmed, the anxious feel it far more than the secure', () => {
    const anx = jealousyHit(state, 'Anx', 'M1', 'R', 4, { confirmed: false });
    const sec = jealousyHit(state, 'Sec', 'M2', 'R', 4, { confirmed: false });
    expect(anx).toBeGreaterThan(sec * 2);
  });
  it('once confirmed, the secure feel it fully', () => {
    const before = jealousyHit(state, 'Sec', 'M2', 'R', 4, { confirmed: false });
    const after = jealousyHit(state, 'Sec', 'M2', 'R', 4, { confirmed: true });
    expect(after).toBeGreaterThan(before * 2);
  });
  it('the rung you believe you are on scales it', () => {
    believeStep(state, 'Anx', 'M1', 'open');
    const open = jealousyHit(state, 'Anx', 'M1', 'R', 4, { confirmed: true });
    believeStep(state, 'Anx', 'M1', 'official');
    expect(jealousyHit(state, 'Anx', 'M1', 'R', 4, { confirmed: true })).toBeGreaterThan(open);
  });
  it('avoidant islanders retaliate more, anxious ones seek reassurance more', () => {
    const count = (who, kind) => { let n = 0; for (let i = 0; i < 200; i++) if (jealousyOutlet(state, who, streamFor(i * 7919 + 13, 'o')) === kind) n++; return n; };
    expect(count('Avo', 'retaliate')).toBeGreaterThan(count('Anx', 'retaliate'));
    expect(count('Anx', 'reassure')).toBeGreaterThan(count('Avo', 'reassure'));
  });
});

describe('the days wear on them', () => {
  it('stress rises through a season and lowers effective temperament', () => {
    const t0 = effectiveTemperament(state, 'Sec');
    for (let d = 0; d < 30; d++) tickEmotions(state);
    expect(emo(state, 'Sec').stress).toBeGreaterThan(5);
    expect(effectiveTemperament(state, 'Sec')).toBeLessThan(t0);
  });
  it('a single islander gets lonely; jealousy fades', () => {
    state.couples = state.couples.filter(c => !c.includes('R'));
    jealousyHit(state, 'Anx', 'M1', 'R', 6, { confirmed: true });
    for (let d = 0; d < 6; d++) tickEmotions(state);
    expect(emo(state, 'R').loneliness).toBeGreaterThan(4);
    expect(emo(state, 'Anx').jealousy.R || 0).toBeLessThan(1);
  });
  it('heartbreak with the ex cracking on nearby is a walk risk; it makes a rebound likely', () => {
    breakHeart(state, 'R', 'M1', 9);
    expect(rebounding(state, 'R')).toBe(true);
    const w = walkRisk(state, 'R');
    expect(w.cause).toBe('heartbreak');
    expect(w.p).toBeGreaterThan(0);
  });
});
