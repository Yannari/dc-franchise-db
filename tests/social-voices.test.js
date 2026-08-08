// Two strategists agreeing about a nomination should not sound alike.
//
// Spreading the LENSES fixed what hosts say. It did nothing for how they say
// it, because a lens is a read on the game and a voice is a person. There are
// 183 canonical profiles and twelve on a panel, so hand-writing pools per host
// is hundreds that never fire — delivery generalises where opinion does not.
//
// The trap this has to stay out of is the one the design brief named: a trait
// that decorates a generic sentence is worse than no trait, because you get a
// nervous host who analyses exactly like the deadpan one, plus a tic.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import {
  DELIVERY, TRAIT_TAKES, VOICE_OVERRIDE, assignTraits, traitRanking,
} from '../js/social/voices.js';

const PROFILES = JSON.parse(fs.readFileSync('voice-profiles.json', 'utf8')).profiles;
const host = (slug, voice, name = slug) => ({ slug, name, voice });

describe('deriving a voice from what the profile says', () => {
  it('reads the delivery clause, which is where the profiles put it', () => {
    // "Silky, flattering speech that hides a knife." — Alejandro's own profile.
    expect(traitRanking(PROFILES.Alejandro, 'Alejandro')[0]).toBe('manipulative');
    // "Cruel, vain mean-girl twin" comes out boastful rather than blunt, and
    // that is the deriver working: `vain` matches 9 profiles and `bossy` 43, so
    // vanity is the more distinguishing fact about her. The first draft of this
    // test asserted blunt and was simply wrong about which signal is rarer.
    expect(traitRanking('Cruel, vain mean-girl twin. Sharp, dismissive put-downs.')[0])
      .toBe('boastful');
  });

  it('takes the RAREST marker, not the first one declared', () => {
    // The whole balance rests on this. `warm` matches 82 of 183 descriptions
    // and `mystical` matches 5, so a profile hitting both is far better
    // evidence of mystical. First-match ordering put 82 hosts on `warm`.
    const both = 'A kind, gentle soul with a cosmic aura about her.';
    expect(traitRanking(both)[0]).toBe('mystical');
    expect(traitRanking(both)).toContain('warm');
  });

  it('gives nobody a voice when the profile does not describe one', () => {
    // A wrong voice is louder than no voice: an unvoiced host falls back to the
    // lens and general pools and simply sounds like an analyst, which is fine.
    expect(traitRanking('Season 4 contestant.')).toEqual([]);
    expect(assignTraits([host('x', 'Season 4 contestant.')]).get('x')).toBe(null);
  });

  it('lets a named character override the derivation', () => {
    // The handful whose whole appeal is HOW they talk should not be averaged
    // into a category with forty other people.
    for (const [name, trait] of Object.entries(VOICE_OVERRIDE)) {
      expect(traitRanking(PROFILES[name] || '', name)[0], `${name} lost their voice`)
        .toBe(trait);
    }
  });
});

describe('no trait may swallow the panel', () => {
  it('caps a voice at what it has words for', () => {
    // The lens bug, available again under a new name: eight hosts sharing five
    // sentences. The cap comes from the pool, so writing more widens it.
    const panel = Array.from({ length: 20 }, (_, i) =>
      host(`w${i}`, 'A kind, warm, supportive presence.'));
    const counts = new Map();
    for (const t of assignTraits(panel).values()) counts.set(t, (counts.get(t) || 0) + 1);
    for (const [trait, kinds] of Object.entries(TRAIT_TAKES)) {
      const lines = Object.values(kinds).reduce((n, arr) => n + arr.length, 0);
      expect(counts.get(trait) ?? 0, `${trait} oversubscribed for ${lines} lines`)
        .toBeLessThanOrEqual(Math.max(1, Math.round(lines / 8)));
    }
  });

  it('spreads the real cast rather than the sample', () => {
    // A deriver that only balances tonight's twelve is balancing nothing.
    const all = Object.entries(PROFILES).map(([name, desc], i) =>
      host(`p${i}`, desc, name));
    const counts = new Map();
    for (const t of assignTraits(all).values()) {
      if (t) counts.set(t, (counts.get(t) || 0) + 1);
    }
    expect(counts.size, 'the cast collapsed onto a handful of voices')
      .toBeGreaterThanOrEqual(8);
  });

  it('does not hand a rare voice to somebody with a weaker claim', () => {
    const panel = [
      host('vague', 'A kind and gentle dreamer.'),
      host('real', PROFILES.Dawn || 'Mystical, spiritual aura reader.', 'Dawn'),
    ];
    expect(assignTraits(panel).get('real')).toBe('mystical');
  });
});

describe('the constructions are sentences, not decorations', () => {
  const kinds = new Set(Object.values(TRAIT_TAKES).flatMap(k => Object.keys(k)));

  it('covers every event kind for every voice it claims', () => {
    // A voice with a hole in it snaps back to the general analyst on exactly
    // the night it most needs to sound like itself.
    for (const [trait, byKind] of Object.entries(TRAIT_TAKES)) {
      for (const kind of kinds) {
        expect(byKind[kind]?.length, `${trait} has nothing for ${kind}`)
          .toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('renders without leaving a slot behind', () => {
    const w = { challenge: 'challenge', vote: 'vote', home: 'camp' };
    for (const [trait, byKind] of Object.entries(TRAIT_TAKES)) {
      for (const [kind, pool] of Object.entries(byKind)) {
        for (const fn of pool) {
          const text = fn({ s: 'Ted', w, k: kind });
          expect(typeof text, `${trait}/${kind} did not return a string`).toBe('string');
          expect(text, `${trait}/${kind} leaked a slot`).not.toMatch(/\{\w+\}/);
          // A floor, not a style rule. It exists to catch a construction that
          // returned nothing usable; `streetwise` says "Earned. Next." and
          // means it, and a terseness budget set by the longest voice would
          // quietly forbid the shortest one from existing.
          expect(text.trim().length, `${trait}/${kind} produced almost nothing`)
            .toBeGreaterThan(10);
        }
      }
    }
  });

  it('gives each voice its own rhythm, not the same sentence in a hat', () => {
    // The measurable version of "not a prefix on generic analysis": deadpan
    // people stop talking and theatrical ones do not, so the two voices should
    // not average out to the same length.
    const avg = trait => {
      const all = Object.values(TRAIT_TAKES[trait]).flat();
      const w = { challenge: 'challenge', vote: 'vote', home: 'camp' };
      return all.reduce((n, fn) => n + fn({ s: 'Ted', w, k: '' }).length, 0) / all.length;
    };
    expect(avg('deadpan')).toBeLessThan(avg('formal'));
    expect(avg('deadpan')).toBeLessThan(avg('theatrical'));
  });
});

describe('the markers stay honest', () => {
  it('records how many profiles each one matches', () => {
    // The count IS the weight. A stale one silently unbalances the deriver, so
    // it is checked against the file rather than trusted.
    for (const [trait, [re, claimed]] of Object.entries(DELIVERY)) {
      const actual = Object.values(PROFILES)
        .filter(d => re.test(String(d).toLowerCase())).length;
      expect(actual, `${trait} claims ${claimed} matches, measures ${actual}`)
        .toBe(claimed);
    }
  });
});

describe('alumni who talk rather than write', () => {
  // Measured across all 890 lines the room can produce: 73% were two or more
  // sentences, 39% opened with a declarative "The/That/It/Nobody", and FIVE PER
  // CENT used a contraction. That last figure is the whole register in one
  // number — "it is not naive, it is expensive" is written English and nobody
  // types it into a chat.
  //
  // Fixed in the SOURCE, not at render. A post-processing humaniser was tried
  // on the episode writer and rejected, correctly: it makes one voice wearing
  // tics rather than different people, and the file stops saying what the room
  // says.
  const w = { challenge: 'challenge', vote: 'vote', home: 'camp',
    onDanger: 'in the crosshairs', danger: 'the crosshairs', Danger: 'The crosshairs',
    nominated: 'took votes', nominee: 'the one taking votes', pawn: 'a spare vote',
    Pawn: 'A spare vote', ceremony: 'the ceremony', Ceremony: 'The ceremony',
    jury: 'the jury', safe: 'safe' };
  const CONTRACTED = /['’](s|t|re|ve|ll|m|d)\b/;
  const STIFF_ON_PURPOSE = ['formal', 'boastful', 'sarcastic'];
  const linesOf = trait => Object.values(TRAIT_TAKES[trait])
    .flat().map(fn => fn({ s: 'Ted', w, k: 'x' }));
  const rate = trait => {
    const l = linesOf(trait);
    return l.filter(x => CONTRACTED.test(x)).length / l.length;
  };

  it('speaks in contractions almost everywhere', () => {
    for (const trait of Object.keys(TRAIT_TAKES)) {
      if (STIFF_ON_PURPOSE.includes(trait)) continue;
      expect(rate(trait), `${trait} still writes like an essay`).toBeGreaterThan(0.2);
    }
  });

  it('keeps the voices that should stay buttoned up', () => {
    // Characterisation, not an oversight. `formal` builds a case and would say
    // "I would resist the word betrayal". `boastful` is performing, and
    // performance is uncontracted. `sarcastic` measured 17% and I nearly
    // "fixed" it — then read the lines: "A stunning turn of events, if you had
    // somehow avoided watching any of the previous three episodes." The full
    // forms ARE the joke. Loosening that voice would flatten it.
    for (const trait of STIFF_ON_PURPOSE) {
      expect(rate(trait), `${trait} loosened`).toBeLessThan(0.25);
    }
  });

  it('does not use the literary possessive', () => {
    // "I've watched it three times" is perfect aspect and right. "I've nothing
    // kind to say" is a novel, and the contraction pass produced four of them.
    for (const trait of Object.keys(TRAIT_TAKES)) {
      for (const line of linesOf(trait)) {
        expect(line, `${trait}: ${line}`)
          .not.toMatch(/I've (nothing|opinions|goosebumps|their|a |an |the )/);
      }
    }
  });
});
