// "The veto came off the wall and Dylon used it, which means he is now a
// person who makes moves." Dylon did not use it.
//
// Nothing recorded what the veto did, so four separate readers worked it out
// by diffing initialNominees against finalNominees: a name left the block, so
// the veto took it off. Two mechanics break that. A Coup d'Etat replaces both
// nominees outright, and a detonated Diamond Power of Veto takes somebody down
// on its own holder's authority — neither has anything to do with whoever won
// the veto, who on those weeks gets publicly credited with a move they refused
// to make, loses bond with the HOH for it, and is remembered as having crossed
// them.
import { describe, expect, it } from 'vitest';
import { actFacts } from '../js/bb-events/_read.js';

const WEEK = {
  initialNominees: ['Aaron', 'Emmah'],
  finalNominees: ['Chase', 'Millie'],
  vetoWinner: 'Dylon',
};

describe('a block that moved is not proof the veto moved it', () => {
  it('credits nobody when the Coup replaced the block and the veto went unused', () => {
    const facts = actFacts({ week: { ...WEEK, vetoUsed: false, vetoSaved: null,
      coup: { holder: 'Nico', removed: ['Aaron', 'Emmah'] } } });
    expect(facts.saved, 'the veto was credited with the Coup\'s work').toBeNull();
    expect(facts.used).toBe(false);
  });

  it('credits nobody when a Diamond took somebody down', () => {
    const facts = actFacts({ week: {
      initialNominees: ['Aaron', 'Emmah'], finalNominees: ['Aaron', 'Chase'],
      vetoWinner: 'Dylon', vetoUsed: false, vetoSaved: null,
      diamondDetonation: { holder: 'Nico', saved: 'Emmah', replacement: 'Chase' } } });
    expect(facts.saved).toBeNull();
    expect(facts.used).toBe(false);
  });

  it('still reads a veto that WAS used', () => {
    const facts = actFacts({ week: {
      initialNominees: ['Aaron', 'Emmah'], finalNominees: ['Aaron', 'Chase'],
      vetoWinner: 'Dylon', vetoUsed: true, vetoSaved: 'Emmah', vetoReplacement: 'Chase' } });
    expect(facts.saved).toBe('Emmah');
    expect(facts.replacement).toBe('Chase');
    expect(facts.used).toBe(true);
  });

  it('trusts the ceremony over the block, even when they disagree', () => {
    // Both happened: the veto saved Emmah AND a Coup rewrote the block after.
    // The diff would name Aaron, who nobody saved.
    const facts = actFacts({ week: { ...WEEK, vetoUsed: true, vetoSaved: 'Emmah',
      vetoReplacement: 'Chase', coup: { holder: 'Nico', removed: ['Aaron'] } } });
    expect(facts.saved).toBe('Emmah');
  });

  it('falls back to the diff for a week with no veto ceremony recorded', () => {
    // An older save, or a week the ceremony never ran on.
    const facts = actFacts({ week: {
      initialNominees: ['Aaron', 'Emmah'], finalNominees: ['Aaron', 'Chase'] } });
    expect(facts.saved).toBe('Emmah');
  });

  it('excludes the Coup from that fallback too', () => {
    const facts = actFacts({ week: { ...WEEK,
      coup: { holder: 'Nico', removed: ['Aaron', 'Emmah'] } } });
    expect(facts.saved, 'an unrecorded week made the same mistake').toBeNull();
  });

  it('lets an explicit ctx override everything, as the ceremony passes it', () => {
    const facts = actFacts({ saved: 'Emmah', week: { ...WEEK, vetoUsed: false } });
    expect(facts.saved).toBe('Emmah');
  });
});

describe('the fallout event cannot fire on a veto nobody used', () => {
  it('refuses the week that produced the complaint', async () => {
    const mod = await import('../js/bb-events/power.js');
    const list = mod.POWER_EVENTS || mod.default || [];
    const ev = (Array.isArray(list) ? list : Object.values(list))
      .find(e => e?.id === 'power-veto-fallout');
    expect(ev, 'power-veto-fallout is not in the exported list').toBeTruthy();
    const ctx = { week: { ...WEEK, vetoUsed: false, vetoSaved: null,
      coup: { holder: 'Nico', removed: ['Aaron', 'Emmah'] } },
      vetoWinner: 'Dylon', hoh: 'Nico', act: 'eviction' };
    expect(ev.weight(['Dylon', 'Nico', 'Chase', 'Millie', 'Aaron', 'Emmah'], ctx)).toBe(0);
  });
});
