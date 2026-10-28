// The Voice's rules (part 2 design §3): the commandments, the breaks, the price.
import { describe, it, expect } from 'vitest';
import { COMMANDMENTS, COMMANDMENTS_REVIVAL, weeklyRuleBreaks, revealOwnSecret, dOfficeFor, extraVotesFor } from '../js/ss/voice.js';
import { openKitties, balance, actualTotal, expectedTotal } from '../js/ss/kitty.js';
import { secretOf } from '../js/ss/hunt.js';
import { seededRandom } from './helpers/rng.js';

const S = (holders, text) => ({ id: `s-${holders.join('-')}`, holders, text, kind: 'personal', secretKind: 'past', clues: ['a key', 'an old photo', 'the word "before"'], tells: ['x'], difficulty: 0.5, found: false });
function fresh() {
  const names = ['Ana', 'Ben', 'Cy', 'Di', 'Ed', 'Fi'];
  const state = { secrets: [S(['Ana'], 'I escaped from a cult'), S(['Ben'], 'I was born in a prison'), S(['Cy', 'Di'], 'We are twins'), S(['Ed'], 'I lived in my car'), S(['Fi'], 'I am a medium')] };
  openKitties(state, names);
  return { state, names };
}
// Consecutive small seeds give a clustered first draw; spread them and warm up.
const rngFor = seed => { const r = seededRandom((seed * 2654435761) % 2147483647); r(); r(); return r; };
const ctx = (over = {}, seed = 1) => ({ rng: rngFor(seed), week: 3, stat: (n, k) => over[n]?.[k] ?? 5 });

describe('the commandments', () => {
  it('are ten, in both eras, and both forbid revealing your secret', () => {
    expect(COMMANDMENTS).toHaveLength(10);
    expect(COMMANDMENTS_REVIVAL).toHaveLength(10);
    for (const list of [COMMANDMENTS, COMMANDMENTS_REVIVAL]) expect(list.some(c => /reveal your secret/.test(c))).toBe(true);
  });
});

describe('revealing your own secret', () => {
  it('costs the whole kitty and a nomination d\'office, for every holder', () => {
    const { state } = fresh();
    const r = revealOwnSecret(state, ctx(), 'Cy');
    expect(r.holders).toEqual(['Cy', 'Di']);
    expect(balance(state, 'Cy')).toBe(0);
    expect(balance(state, 'Di')).toBe(0);
    expect(dOfficeFor(state, 4).sort()).toEqual(['Cy', 'Di']);
    expect(secretOf(state, 'Di').found).toBe(true);
    expect(actualTotal(state)).toBe(expectedTotal(state));
  });
});

describe('the week\'s breaks', () => {
  it('come from behaviour: a hothead breaks rules far more often than a calm strategist', () => {
    let hot = 0, calm = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const a = fresh(); const b = fresh();
      hot += weeklyRuleBreaks(a.state, ctx({ Ana: { temperament: 1, boldness: 9, strategic: 2 } }, seed), { house: ['Ana'] }).length;
      calm += weeklyRuleBreaks(b.state, ctx({ Ana: { temperament: 9, boldness: 3, strategic: 9 } }, seed), { house: ['Ana'] }).length;
    }
    expect(hot).toBeGreaterThan(calm * 3);
  });
  it('slip more at a party', () => {
    let party = 0, quiet = 0;
    // One long stream per condition: the LCG's draws across consecutive seeds are correlated.
    const rp = rngFor(11), rq = rngFor(23);
    for (let i = 0; i < 4000; i++) {
      const a = fresh(); const b = fresh();
      party += weeklyRuleBreaks(a.state, { rng: rp, week: 3, stat: () => 5 }, { house: ['Ana'], party: true }).filter(x => x.commandment === 8).length;
      quiet += weeklyRuleBreaks(b.state, { rng: rq, week: 3, stat: () => 5 }, { house: ['Ana'] }).filter(x => x.commandment === 8).length;
    }
    expect(party).toBeGreaterThan(quiet * 1.5);
  });
  it('every break has a consequence the nominations or the kitty can read', () => {
    for (let seed = 1; seed <= 400; seed++) {
      const { state, names } = fresh();
      for (const act of weeklyRuleBreaks(state, ctx({ Ana: { temperament: 1, boldness: 9, strategic: 1 } }, seed), { house: names })) {
        expect(act.beats?.length).toBeGreaterThan(0);
        const visible = act.punishment === 'hot-water' || act.punishment === 'no-shopping' || act.punishment === 'fine' ? true
          : dOfficeFor(state, 4).length + Object.keys(extraVotesFor(state, 4)).length > 0;
        expect(visible, JSON.stringify(act)).toBe(true);
      }
    }
  });
});
