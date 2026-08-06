// The veto variant family — one pipeline, four shapes.
//
// The design point these defend is that the medallion is not one object. It
// can change authority (Diamond), obligation (Forced), count (Double) or
// knowledge (Secret), and every one of those used to be a reason to write
// another ceremony. There is one ceremony reading a profile instead.
//
// So the first test is the one that matters most: a Diamond week resolved
// through the new profile has to behave exactly as it did when `diamond` was a
// boolean computed in place. If that ever fails, the generalisation broke the
// twist it was generalised from.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, TWIST_CATALOG } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, summariseWeek } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { resolveVetoRules, isDiamond } from '../js/bb/veto-rules.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house(twist, weeks = 3) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off' });
  seasonConfig.twistSchedule = Array.from({ length: weeks },
    (_, i) => ({ episode: i + 1, type: twist }));
}

const actOf = (ep, type) => (ep.acts || []).find(a => a.type === type) || null;

function play(twist, weeks = 3, seed = 7) {
  house(twist, weeks);
  const eps = [];
  for (let w = 0; w < weeks; w++) {
    const ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode());
    if (!ep) break;
    eps.push(ep);
  }
  return eps;
}

describe('the veto variants', () => {
  beforeEach(() => house('bb-double-veto'));

  it('resolves one profile instead of four ceremonies', () => {
    // Default: an ordinary medallion.
    const plain = resolveVetoRules({ week: { num: 2 }, vetoWinner: 'Bowie', house: NAMES, hoh: 'Chase' });
    expect(plain.primary).toEqual({ authority: 'hoh', mustUse: false, visibility: 'public' });
    expect(plain.extra).toEqual([]);
    expect(isDiamond(plain)).toBe(false);

    // Authority, obligation and count are separate flags on the same profile.
    const diamond = resolveVetoRules({
      week: { num: 2, twistState: { rules: { replacementAuthority: 'veto-holder' } } },
      vetoWinner: 'Bowie', house: NAMES, hoh: 'Chase',
    });
    expect(isDiamond(diamond)).toBe(true);

    const forced = resolveVetoRules({
      week: { num: 2, twistState: { rules: { vetoMustBeUsed: true } } },
      vetoWinner: 'Bowie', house: NAMES, hoh: 'Chase',
    });
    expect(forced.primary.mustUse).toBe(true);
    expect(isDiamond(forced), 'obligation is not authority').toBe(false);

    const dbl = resolveVetoRules({
      week: { num: 2, twistState: { rules: { doubleVeto: true } } },
      vetoWinner: 'Bowie', placements: ['Bowie', 'Zee', 'Ripper'],
      vetoPlayers: ['Bowie', 'Ripper', 'Zee'], house: NAMES, hoh: 'Chase',
    });
    expect(dbl.extra).toHaveLength(1);
    // Second on the SCOREBOARD, not second in the draw. The draw puts Ripper
    // ahead of Zee and the scoreboard does the opposite; the medallion follows
    // the scoreboard, because coming closest to winning it is the whole claim.
    expect(dbl.extra[0].holder, 'the second medallion did not follow the standings').toBe('Zee');
    expect(dbl.extra[0].holder).not.toBe('Bowie');
  });

  it('leaves the Diamond week behaving exactly as it did', () => {
    // The refactor's only real risk. A Diamond week must still hand the empty
    // chair to the veto holder, through the profile rather than around it.
    const eps = play('bb-diamond-veto', 3, 11);
    const seen = eps.map(e => (gs.bb.weeks || []).find(w => w.num === e.num))
      .filter(w => w && w.vetoDecision);
    expect(seen.length, 'no diamond week ran').toBeGreaterThan(0);
    for (const w of seen) {
      expect(w.vetoRules, 'the week never resolved a veto profile').toBeTruthy();
      expect(w.vetoRules.primary.authority).toBe('veto-holder');
      expect(w.vetoDecision.diamond).toBe(true);
      if (w.vetoDecision.use) {
        expect(w.vetoDecision.chairAuthority,
          'the diamond holder did not own the chair').toBe(w.vetoDecision.holder);
      }
    }
  });

  it('makes the forced veto a decision about who, not whether', () => {
    const eps = play('bb-forced-veto', 3, 23);
    const weeks = eps.map(e => (gs.bb.weeks || []).find(w => w.num === e.num))
      .filter(w => w && w.vetoDecision && w.vetoWinner);
    expect(weeks.length).toBeGreaterThan(0);
    for (const w of weeks) {
      expect(w.vetoRules.primary.mustUse).toBe(true);
      // Used, unless the rules genuinely left nobody to put up in the chair.
      if (!w.vetoDecision.use) {
        expect(w.vetoDecision.reason, 'declined a veto it was not allowed to decline')
          .toBe('no-replacement');
      }
    }
  });

  it('rewrites the block twice when there are two medallions', () => {
    let found = null;
    for (const seed of [7, 19, 31, 44]) {
      for (const ep of play('bb-double-veto', 3, seed)) {
        const act = actOf(ep, 'second-veto');
        if (act?.used) { found = { ep, act }; break; }
      }
      if (found) break;
    }
    expect(found, 'a second medallion was never used in four seeds').toBeTruthy();
    const { ep, act } = found;
    const week = (gs.bb.weeks || []).find(w => w.num === ep.num);
    // The person it saved is off the final block; the replacement is on it.
    expect(week.finalNominees).not.toContain(act.saved);
    expect(week.finalNominees).toContain(act.replacement);
    // The two holders are different people, and neither saved themselves onto
    // the block by accident.
    expect(act.holder).not.toBe(week.vetoDecision.holder);
    expect(act.replacement).not.toBe(act.saved);
  });

  it('never puts back a nominee the first veto took down', () => {
    // The one rule that has to cross between the two medallions.
    for (const seed of [7, 19, 31, 44]) {
      for (const ep of play('bb-double-veto', 3, seed)) {
        const act = actOf(ep, 'second-veto');
        if (!act?.used) continue;
        const week = (gs.bb.weeks || []).find(w => w.num === ep.num);
        const firstSaved = week.vetoDecision?.use ? week.vetoDecision.save : null;
        if (!firstSaved) continue;
        expect(act.replacement,
          `${firstSaved} was saved and then put straight back up`).not.toBe(firstSaved);
        expect(week.finalNominees).not.toContain(firstSaved);
      }
    }
  });

  it('keeps the secret veto secret', () => {
    const c = BB_TWIST_CONTRACTS['bb-secret-veto'];
    expect(c.acquisition.secrecy).toBe('secret');
    expect(c.announcement, 'a veto the house is told about is not a secret one').toBeUndefined();
    for (const seed of [7, 19, 31]) {
      for (const ep of play('bb-secret-veto', 3, seed)) {
        const act = actOf(ep, 'second-veto');
        if (!act) continue;
        expect(act.anonymous).toBe(true);
        // The transcript may say the block changed. It may not say who.
        const week = (gs.bb.weeks || []).find(w => w.num === ep.num);
        const text = summariseWeek(week);
        // The act's OWN lines, not a character window — the social beats
        // attached to this act name half the house for unrelated reasons, and
        // the secret is about attribution, not about the name never appearing.
        const lines = text.split(/\r?\n/);
        const at = lines.findIndex(l => l.trim() === 'THE SECOND MEDALLION');
        if (at < 0) continue;
        const section = lines.slice(at, at + 4).join(' ');
        // Who came DOWN is public — the house watches somebody leave the block,
        // and a holder who saves themselves is still deniable, because anybody
        // could have been the one who saved them. What must never appear is the
        // attribution: no sentence may say this holder used it.
        expect(section, 'the secret holder was named as the hand that did it')
          .not.toContain(`${act.holder} uses it`);
        if (act.used) {
          expect(section, 'an anonymous veto did not say the hand was unknown')
            .toContain('never told whose hand');
        }
      }
    }
  });

  it('is in the catalogue and reaches both transcripts', () => {
    for (const id of ['bb-double-veto', 'bb-secret-veto', 'bb-forced-veto']) {
      expect(TWIST_CATALOG.some(t => t.id === id), `${id} is not in the catalogue`).toBe(true);
      expect(BB_TWIST_CONTRACTS[id], `${id} has no contract`).toBeTruthy();
    }
    let ep = null;
    for (const seed of [7, 19, 31, 44]) {
      ep = play('bb-double-veto', 3, seed).find(e => actOf(e, 'second-veto'));
      if (ep) break;
    }
    expect(ep, 'no second veto in four seeds').toBeTruthy();
    const week = (gs.bb.weeks || []).find(w => w.num === ep.num);
    expect(summariseWeek(week)).toMatch(/THE SECOND VETO|THE SECOND MEDALLION/);
    expect(generateSummaryText(ep)).toMatch(/THE SECOND VETO|THE SECOND MEDALLION/);
  });
});
