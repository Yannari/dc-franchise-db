// ══════════════════════════════════════════════════════════════════════
// dr-mini-lipsync-voices.test.js — the contract for the mini and lip sync
// ══════════════════════════════════════════════════════════════════════
//
// Run this while filling js/dr/data/mini-voices.js and
// js/dr/data/lipsync-voices.js. It reports what is still unwritten and
// rejects anything that breaks a rule.
//
// Two rules live here and nowhere else in the show:
//
//   THE VARIANT FLOOR IS NOT FOUR. `mini-attempt` fires once per living
//   queen, thirteen times in a premiere, and the middle tier takes about
//   forty per cent of them. Four variants cannot cover five queens and the
//   dump that built these files printed one line twice in a single mini.
//
//   {b} IS EARNED. Three of the seven minis are a queen doing a bit ABOUT
//   another queen. Those may name her; the four that are one queen alone in
//   front of the room may not, because there is nobody to name and the
//   placeholder would render as an empty string.
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  MINI_VOICES, MINI_TIER_IDS, MINI_VARIANTS,
  miniVoice, miniLinesFor, miniNamesOther, lineOf,
  unwrittenMiniVoices, miniVoiceTierCount,
} from '../js/dr/data/mini-voices.js';
import {
  LIPSYNC_TEMPOS, LIPSYNC_HOOKS, LIPSYNC_TIER_IDS,
  tempoLinesFor, hookLinesFor,
  unwrittenLipsyncVoices, lipsyncVoiceTierCount,
} from '../js/dr/data/lipsync-voices.js';
import { MINI_TYPES } from '../js/dr/data/minis.js';
import { MAXI_TYPES } from '../js/dr/data/challenges.js';
import { MAXI_PERFORMANCE } from '../js/dr/data/maxi-performance.js';
import {
  PICK_VOICES, WALKTHROUGH_VOICES, MAXI_VARIANTS,
  pickKindFor, unwrittenMaxiVoices, maxiVoiceTierCount,
} from '../js/dr/data/maxi-voices.js';
import { SONGS } from '../js/dr/data/songs.js';
import { JUDGES } from '../js/dr/data/judges.js';
import {
  CRITIQUE_REASONS, CRITIQUE_BIAS, DIMENSIONS, DIRECTIONS, CRITIQUE_VARIANTS,
  BIAS_SPEAKS, biasLinesFor, unwrittenCritiqueVoices, critiqueVoiceTierCount,
  CRITIQUE_CHALLENGE, reasonLinesFor,
} from '../js/dr/data/critique-voices.js';
import {
  ADVOCACY, HOST_CALL, TASTE_IDS, DELIBERATION_VARIANTS,
  divergentTastes, unwrittenDeliberationVoices, deliberationTierCount,
} from '../js/dr/data/deliberation-voices.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

const _text = v => (typeof v === 'object' && v && v.line) ? v.line : String(v);
function tooSimilar(x, y) {
  const words = t => new Set(_text(t).toLowerCase().match(/[a-z']+/g) || []);
  const a = words(x);
  const b = words(y);
  if (!a.size || !b.size) return false;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size) > 0.6;
}

const miniWritten = MINI_VOICES.flatMap(m => m.tiers
  .filter(t => t.lines.length).map(t => ({ pool: 'mini', key: m.id, t, m })));
const lsWritten = [
  ...LIPSYNC_TEMPOS.flatMap(v => v.tiers.map(t => ({ pool: 'tempo', key: v.tempo, t }))),
  ...LIPSYNC_HOOKS.flatMap(v => v.tiers.map(t => ({ pool: 'hook', key: v.hook, t }))),
].filter(x => x.t.lines.length);

describe('the mini schema', () => {
  it('covers every mini in the catalogue, and agrees with it on the cast', () => {
    /* THE TWO FILES MUST NOT DRIFT. `cast` here mirrors `interaction` in
       minis.js and decides whether {b} is legal — if a mini were retyped from
       solo to targets in one file and not the other, a written pool would
       either lose the target it was written around or gain a placeholder that
       renders empty. */
    for (const m of MINI_TYPES) {
      const v = miniVoice(m.id);
      expect(v, `mini "${m.id}" has no voice`).toBeTruthy();
      expect(v.cast, `"${m.id}" is ${m.interaction} in minis.js and ${v.cast} here`)
        .toBe(m.interaction);
      expect(v.name, `"${m.id}" is named differently in the two files`).toBe(m.name);
      expect(v.tiers.map(t => t.id).slice(1, 4), `${m.id} attempt tiers`).toEqual(MINI_TIER_IDS);
      expect(v.note, `${m.id} has no note for the writer`).toBeTruthy();
      for (const t of v.tiers) expect(t.note, `${m.id}/${t.id} has no note`).toBeTruthy();
    }
    expect(MINI_VOICES.length, 'a voice exists for a mini that does not')
      .toBe(MINI_TYPES.length);
  });

  it('asks the middle tier for more lines than the rest', () => {
    // The tiers split the field 30/40/30, so the middle one is asked for the
    // most distinct lines in one episode and needs the deepest pool.
    expect(MINI_VARIANTS.decent).toBeGreaterThan(MINI_VARIANTS.nailed);
    expect(MINI_VARIANTS.nailed, 'an attempt tier needs more than the usual four')
      .toBeGreaterThan(4);
    expect(MINI_VARIANTS.flat).toBeGreaterThan(4);
  });

  it('hands back null for an unwritten mini rather than a placeholder', () => {
    expect(miniLinesFor('not-a-mini', 'decent')).toBeNull();
    expect(miniLinesFor('dance-off', 'not-a-tier')).toBeNull();
    expect(miniNamesOther('dance-off'), 'a dance-off is one queen alone').toBe(false);
    expect(miniNamesOther('reading'), 'a read is aimed at somebody').toBe(true);
    expect(miniNamesOther('wig-swap'), 'a wig swap has a partner').toBe(true);
    expect(miniNamesOther('not-a-mini')).toBe(false);
  });
});

describe('the lip sync schema', () => {
  it('covers every tempo and every hook a song can carry', () => {
    // A tag on a song with no pool behind it is a lip sync that silently
    // falls back to the generic beat, which is the bug these files close.
    const tempos = LIPSYNC_TEMPOS.map(v => v.tempo);
    const hooks = LIPSYNC_HOOKS.map(v => v.hook);
    for (const s of SONGS) {
      expect(tempos, `"${s.title}" is ${s.tempo}, which has no pool`).toContain(s.tempo);
      expect(hooks, `"${s.title}" has hook ${s.hook}, which has no pool`).toContain(s.hook);
    }
    for (const v of LIPSYNC_TEMPOS) {
      expect(v.tiers.map(t => t.id), `tempo:${v.tempo}`).toEqual(LIPSYNC_TIER_IDS);
    }
    for (const v of LIPSYNC_HOOKS) {
      expect(v.tiers.map(t => t.id), `hook:${v.hook}`).toEqual(['nailed', 'missed']);
    }
  });

  it('hands back null for an unwritten tempo rather than a placeholder', () => {
    expect(tempoLinesFor('not-a-tempo', 'legendary')).toBeNull();
    expect(tempoLinesFor('ballad', 'not-a-tier')).toBeNull();
    expect(hookLinesFor('not-a-hook', 'nailed')).toBeNull();
  });
});

describe('the lines', () => {
  it('names the other queen only where there is one', () => {
    for (const { key, t, m } of miniWritten) {
      for (const l of t.lines) {
        const text = lineOf(l);
        if (m.cast === 'solo') {
          expect(text, `mini:${key}/${t.id} is a solo mini but names a second queen`)
            .not.toMatch(/\{b\}/);
        }
        const bad = text.match(/\{(?!a\}|b\}|c\})[^}]*\}/);
        expect(bad, `mini:${key}/${t.id} uses unknown placeholder ${bad?.[0]}`).toBeNull();
      }
    }
    for (const m of MINI_VOICES) {
      if (m.cast === 'solo') continue;
      const body = m.tiers.filter(t => t.id !== 'announce' && t.lines.length);
      if (!body.length) continue;
      const uses = body.some(t => t.lines.some(l => /\{b\}/.test(lineOf(l))));
      expect(uses, `mini:${m.id} is a ${m.cast} mini and never names the other queen`)
        .toBe(true);
    }
  });

  it('keeps the song title out of everything but the lip sync', () => {
    for (const { key, t } of miniWritten) {
      for (const l of t.lines) {
        expect(lineOf(l), `mini:${key}/${t.id} names a song`).not.toMatch(/\{s\}/);
      }
    }
    for (const { pool, key, t } of lsWritten) {
      for (const l of t.lines) {
        const bad = l.match(/\{(?!a\}|s\})[^}]*\}/);
        expect(bad, `${pool}:${key}/${t.id} uses unknown placeholder ${bad?.[0]}`).toBeNull();
      }
    }
  });

  it('meets the variant floor, which is higher for a mini attempt', () => {
    for (const { key, t } of miniWritten) {
      const need = MINI_VARIANTS[t.id] || 4;
      expect(t.lines.length, `mini:${key}/${t.id} has ${t.lines.length}, needs ${need}`)
        .toBeGreaterThanOrEqual(need);
    }
    for (const { pool, key, t } of lsWritten) {
      expect(t.lines.length, `${pool}:${key}/${t.id} has ${t.lines.length}`)
        .toBeGreaterThanOrEqual(4);
    }
  });

  it('writes four genuinely different variants, not one reworded', () => {
    for (const { pool, key, t } of [...miniWritten, ...lsWritten]) {
      expect(new Set(t.lines).size, `${pool}:${key}/${t.id} repeats a line`)
        .toBe(t.lines.length);
      for (let i = 0; i < t.lines.length; i++) {
        for (let k = i + 1; k < t.lines.length; k++) {
          expect(tooSimilar(t.lines[i], t.lines[k]),
            `${pool}:${key}/${t.id}: variants ${i + 1} and ${k + 1} are the same line reworded`)
            .toBe(false);
        }
      }
    }
  });

  it('speaks this show and no other, and writes prose', () => {
    for (const { pool, key, t } of [...miniWritten, ...lsWritten]) {
      for (const l of t.lines) {
        const text = lineOf(l);
        const bad = foreignWordsIn(text, 'drag-race');
        expect(bad, `${pool}:${key}/${t.id} says "${bad[0]}", which belongs to another show`)
          .toEqual([]);
        expect(text.length, `${pool}:${key}/${t.id} has a one-liner`).toBeGreaterThan(60);
      }
    }
  });
});

describe('what the win is worth', () => {
  it('reads as a noun in the sentence it is dropped into, for every real value', () => {
    /* THE BUG THIS EXISTS FOR. js/vp-dr/challenge.js drops this into "Whoever
       takes it takes ${prize}." and "She takes ${prize}." — and `captain`
       read "she picks the teams", a whole clause, so every captaincy mini
       rendered "Whoever takes it takes she picks the teams."
       The same map had drifted off the data underneath it: it carried
       `immunity` and `advantage`, which nothing in minis.js has ever set,
       and was missing `pick-order` and `prize`, which it uses — so a
       pick-order mini drew the raw slug on the card. */
    const src = fs.readFileSync('js/vp-dr/challenge.js', 'utf8');
    const block = src.slice(src.indexOf('const BUYS = {'));
    const map = block.slice(0, block.indexOf('};'));
    const keys = [...map.matchAll(/^\s*'?([a-z-]+)'?:/gm)].map(x => x[1]);
    const real = [...new Set(MINI_TYPES.map(m => m.buys))];

    for (const b of real) expect(keys, `nothing renders buys "${b}"`).toContain(b);
    for (const k of keys) {
      expect(real, `the map renders "${k}", which no mini buys`).toContain(k);
    }
    // A noun phrase, not a clause: no verb-subject opening.
    for (const line of map.split(/\r?\n/)) {
      const m = line.match(/:\s*'([^']+)'/);
      if (!m) continue;
      expect(m[1], `"${m[1]}" is a clause, and it is dropped after "She takes"`)
        .not.toMatch(/^(she|he|they|it|you)\b/i);
    }
  });
});

describe('what is left to write', () => {
  it('reports the gap rather than hiding it', () => {
    const m = unwrittenMiniVoices();
    const l = unwrittenLipsyncVoices();
    // eslint-disable-next-line no-console
    console.log(`mini: ${miniVoiceTierCount() - m.length} of ${miniVoiceTierCount()} tiers.`
      + `\n  ${m.join(', ')}`
      + `\nlip sync: ${lipsyncVoiceTierCount() - l.length} of ${lipsyncVoiceTierCount()} tiers.`
      + `\n  ${l.join(', ')}`);
    expect(Array.isArray(m)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// And the maxi's own two, which live in js/dr/data/maxi-voices.js.
// ══════════════════════════════════════════════════════════════════════
describe('the maxi draft and walkthrough', () => {
  const mxWritten = [
    // Keyed by kind AND tier: "pick:slots" alone does not say which of the
    // four tiers the duplicate is in, which is the first thing you need.
    ...PICK_VOICES.flatMap(k => k.tiers.map(t => ({ pool: 'pick', key: `${k.kind}/${t.id}`, t }))),
    ...WALKTHROUGH_VOICES.map(w => ({
      pool: 'walkthrough', key: w.family, t: { id: 'note', lines: w.lines },
    })),
  ].filter(x => x.t.lines.length);

  it('files every challenge that hands anything out', () => {
    for (const c of MAXI_TYPES) {
      const k = pickKindFor(c.id);
      if (c.assignment === 'none') {
        expect(k, `"${c.id}" hands out nothing but resolves to "${k}"`).toBeNull();
        continue;
      }
      expect(k, `"${c.id}" drafts something and has no pick kind`).toBeTruthy();
      expect(PICK_VOICES.map(x => x.kind), `"${c.id}" resolves to a kind with no pool`)
        .toContain(k);
    }
  });

  it('carries a walkthrough note for every performance family', () => {
    // Same anti-drift rule as the brief: a family added to maxi-performance.js
    // and not here silently takes the fallback, which is the one pool that
    // cannot say what the work is.
    const mine = WALKTHROUGH_VOICES.map(w => w.family);
    for (const f of MAXI_PERFORMANCE) {
      expect(mine, `family "${f.family}" has no walkthrough note`).toContain(f.family);
    }
    expect(new Set(mine).size, 'a family is listed twice').toBe(mine.length);
  });

  it('names what she picked, which is the whole point of the pick pool', () => {
    /* THE MEASUREMENT. Eleven pick cards on one Snatch Game said "the pick",
       "it" and "this one" over a night where the thing picked is a person she
       has to be for six questions. A written tier that never reaches for {d}
       has been written as the beat it was already. */
    for (const k of PICK_VOICES) {
      const written = k.tiers.filter(t => t.lines.length);
      if (!written.length) continue;
      for (const t of written) {
        const uses = t.lines.filter(l => /\{d\}/.test(l)).length;
        expect(uses, `pick:${k.kind}/${t.id} never says what she got`).toBeGreaterThan(0);
      }
    }
  });

  it('meets the variant floor, which is higher for a beat that fires per queen', () => {
    for (const { pool, key, t } of mxWritten) {
      const need = pool === 'walkthrough' ? MAXI_VARIANTS.walkthrough : (MAXI_VARIANTS[t.id] || 4);
      expect(t.lines.length, `${pool}:${key}/${t.id} has ${t.lines.length}, needs ${need}`)
        .toBeGreaterThanOrEqual(need);
    }
  });

  it('writes distinct prose in this show and no other', () => {
    for (const { pool, key, t } of mxWritten) {
      expect(new Set(t.lines).size, `${pool}:${key} repeats a line`).toBe(t.lines.length);
      for (let i = 0; i < t.lines.length; i++) {
        for (let j = i + 1; j < t.lines.length; j++) {
          expect(tooSimilar(t.lines[i], t.lines[j]),
            `${pool}:${key}: variants ${i + 1} and ${j + 1} are the same line reworded`).toBe(false);
        }
      }
      for (const l of t.lines) {
        const bad = foreignWordsIn(l, 'drag-race');
        expect(bad, `${pool}:${key} says "${bad[0]}", which belongs to another show`).toEqual([]);
        expect(l.length, `${pool}:${key} has a one-liner`).toBeGreaterThan(60);
        const ph = l.match(/\{(?!a\}|c\}|d\})[^}]*\}/);
        expect(ph, `${pool}:${key} uses unknown placeholder ${ph?.[0]}`).toBeNull();
      }
    }
  });

  it('reports the gap rather than hiding it', () => {
    const left = unwrittenMaxiVoices();
    // eslint-disable-next-line no-console
    console.log(`maxi: ${maxiVoiceTierCount() - left.length} of ${maxiVoiceTierCount()} tiers.`
      + `\n  ${left.join(', ')}`);
    expect(Array.isArray(left)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// And the deliberation, in js/dr/data/deliberation-voices.js.
// ══════════════════════════════════════════════════════════════════════
describe('the deliberation', () => {
  const dWritten = [
    ...ADVOCACY.flatMap(a => a.tiers.map(t => ({ pool: 'advocacy', key: a.taste, t }))),
    ...HOST_CALL.map(h => ({ pool: 'host', key: h.id, t: { id: h.id, lines: h.lines } })),
  ].filter(x => x.t.lines.length);

  it('has a pool for every dimension a judge can be watching', () => {
    const mine = ADVOCACY.map(a => a.taste);
    for (const k of TASTE_IDS) expect(mine, `no advocacy pool for "${k}"`).toContain(k);
    for (const j of JUDGES) {
      const keys = Object.keys(j.taste || {});
      for (const k of keys) expect(TASTE_IDS, `judge "${j.id}" weighs "${k}"`).toContain(k);
    }
  });

  it('makes two judges argue from different premises, not the same one', () => {
    /* THE BUG THIS EXISTS FOR. Giving each judge her own largest weight
       produced "Michelle defends Q10 on the challenge, RuPaul buries Q10 on
       the challenge" — because RuPaul is 0.45 there and Michelle 0.40, so the
       biggest number is the same one for both and the scene printed two
       people agreeing about the premise while disagreeing about nothing.
       The argument is the dimension they are furthest APART on. */
    const ru = JUDGES.find(j => j.id === 'rupaul');
    const mi = JUDGES.find(j => j.id === 'michelle');
    const d = divergentTastes(mi, ru);
    expect(d.forTaste, 'the two sides argue from the same place')
      .not.toBe(d.againstTaste);

    // And it holds across the whole panel, not just that pair.
    let same = 0;
    let pairs = 0;
    for (const a of JUDGES) {
      for (const b of JUDGES) {
        if (a.id === b.id) continue;
        pairs++;
        const x = divergentTastes(a, b);
        if (x.forTaste === x.againstTaste) same++;
      }
    }
    expect(same / pairs, 'most of the panel argues from one premise')
      .toBeLessThan(0.2);
  });

  it('does not name a queen in the call where there is not one', () => {
    // `stood-by` is the host leaving the board alone: no queen was moved, so
    // {a} would render as an empty string.
    const stood = HOST_CALL.find(h => h.id === 'stood-by');
    for (const l of stood.lines) {
      expect(l, 'host:stood-by names a queen, and none was moved').not.toMatch(/\{a\}/);
    }
  });

  it('meets the variant floor and writes distinct prose', () => {
    for (const { pool, key, t } of dWritten) {
      const need = pool === 'host'
        ? DELIBERATION_VARIANTS.host : DELIBERATION_VARIANTS.advocacy;
      expect(t.lines.length, `${pool}:${key} has ${t.lines.length}, needs ${need}`)
        .toBeGreaterThanOrEqual(need);
      expect(new Set(t.lines).size, `${pool}:${key} repeats a line`).toBe(t.lines.length);
      for (let i = 0; i < t.lines.length; i++) {
        for (let j = i + 1; j < t.lines.length; j++) {
          expect(tooSimilar(t.lines[i], t.lines[j]),
            `${pool}:${key}: variants ${i + 1} and ${j + 1} are the same line reworded`).toBe(false);
        }
      }
      for (const l of t.lines) {
        const bad = foreignWordsIn(l, 'drag-race');
        expect(bad, `${pool}:${key} says "${bad[0]}", which belongs to another show`).toEqual([]);
        expect(l.length, `${pool}:${key} has a one-liner`).toBeGreaterThan(60);
        const ph = l.match(/\{(?!a\}|j\}|e\})[^}]*\}/);
        expect(ph, `${pool}:${key} uses unknown placeholder ${ph?.[0]}`).toBeNull();
        // Only the advocacy pool has a second judge to point at.
        if (pool === 'host') {
          expect(l, `host:${key} names a judge, and the host is the one speaking`)
            .not.toMatch(/\{[je]\}/);
        }
      }
    }
  });

  it('reports the gap rather than hiding it', () => {
    const left = unwrittenDeliberationVoices();
    // eslint-disable-next-line no-console
    console.log(`deliberation: ${deliberationTierCount() - left.length} of `
      + `${deliberationTierCount()} tiers.\n  ${left.join(', ')}`);
    expect(Array.isArray(left)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// And the critiques, in js/dr/data/critique-voices.js.
// ══════════════════════════════════════════════════════════════════════
describe('the critique reasoning', () => {
  const cWritten = [
    ...CRITIQUE_REASONS.flatMap(d => d.tiers.map(t => ({ pool: 'reason', key: `${d.dimension}/${t.id}`, t }))),
    ...CRITIQUE_BIAS.map(b => ({ pool: 'bias', key: b.id, t: { id: b.id, lines: b.lines } })),
  ].filter(x => x.t.lines.length);

  it('has the words that belong to this challenge, for every family', () => {
    /* THE JUDGE VARIED AND THE CHALLENGE DID NOT. One `challenge` pool for the
       whole season meant the same praise printed over a makeover, a Snatch
       Game and a Rusical — so Michelle could not say she does not see the
       family resemblance, because no critique knew it was a makeover. */
    const mine = CRITIQUE_CHALLENGE.map(c => c.family);
    for (const f of MAXI_PERFORMANCE) {
      expect(mine, `family "${f.family}" has a performance pool but no critique`)
        .toContain(f.family);
    }
    expect(mine, 'there is no fallback family').toContain('generic');
    for (const c of CRITIQUE_CHALLENGE) {
      expect(c.tiers.map(t => t.id), `challenge:${c.family}`).toEqual(DIRECTIONS);
      expect(c.note, `challenge:${c.family} has no note`).toBeTruthy();
    }
  });

  it('takes the family for the challenge dimension and ignores it elsewhere', () => {
    const written = CRITIQUE_CHALLENGE.find(c => c.tiers.some(t => t.lines.length));
    if (written) {
      expect(reasonLinesFor('challenge', 'fault', written.family))
        .not.toBe(reasonLinesFor('challenge', 'fault', null));
    }
    // A garment is a garment whatever the challenge was, so the other three
    // dimensions do not vary with the night and must not pretend to.
    expect(reasonLinesFor('runway', 'fault', 'makeover'))
      .toBe(reasonLinesFor('runway', 'fault', null));
    expect(reasonLinesFor('polish', 'praise', 'ball'))
      .toBe(reasonLinesFor('polish', 'praise', null));
  });

  it('covers every dimension a judge can be weighing', () => {
    const mine = CRITIQUE_REASONS.map(d => d.dimension);
    for (const k of DIMENSIONS) expect(mine, `no reason pool for "${k}"`).toContain(k);
    for (const j of JUDGES) {
      for (const k of Object.keys(j.taste || {})) {
        expect(DIMENSIONS, `judge "${j.id}" weighs "${k}", which has no pool`).toContain(k);
      }
    }
    for (const d of CRITIQUE_REASONS) {
      expect(d.tiers.map(t => t.id), `reason:${d.dimension}`).toEqual(DIRECTIONS);
    }
  });

  it('stays quiet about a bias too small to be the reason', () => {
    /* A LEAN IS A TILT, NOT A VERDICT. styleBias is worth a fraction of a
       point on purpose, and announcing it every week would turn each judge
       into one joke about one kind of drag. */
    expect(biasLinesFor(0)).toBeNull();
    expect(biasLinesFor(0.2)).toBeNull();
    expect(biasLinesFor(-0.2)).toBeNull();
    // And the strong authored ones do speak: Law is -0.2 on camp, +0.6 on
    // fashion, so the file has to have an opinion about the big ones.
    const law = JUDGES.find(j => j.id === 'law');
    const strong = Object.values(law.styleBias).filter(v => Math.abs(v) >= BIAS_SPEAKS);
    expect(strong.length, 'no judge has a lean strong enough to ever speak').toBeGreaterThan(0);
  });

  it('uses the judge’s own words for what she cannot forgive', () => {
    /* {p} AND {o} ARE THE VOICE. Every judge has an authored petPeeve and
       softSpot and no critique had ever read either of them — which is why a
       pan from Michelle and a pan from Ross were the same paragraph. A fault
       tier that never reaches for {p} has been written as a narrator. */
    for (const d of CRITIQUE_REASONS) {
      const fault = d.tiers.find(t => t.id === 'fault');
      const praise = d.tiers.find(t => t.id === 'praise');
      if (fault.lines.length) {
        expect(fault.lines.some(l => /\{p\}/.test(l)),
          `reason:${d.dimension}/fault never names what this judge cannot forgive`).toBe(true);
      }
      if (praise.lines.length) {
        expect(praise.lines.some(l => /\{o\}/.test(l)),
          `reason:${d.dimension}/praise never names what this judge is looking for`).toBe(true);
      }
    }
    for (const j of JUDGES) {
      expect(j.petPeeve, `judge "${j.id}" has no pet peeve for {p}`).toBeTruthy();
      expect(j.softSpot, `judge "${j.id}" has no soft spot for {o}`).toBeTruthy();
    }
  });

  it('keeps the style name to the bias clause', () => {
    for (const { pool, key, t } of cWritten) {
      for (const l of t.lines) {
        if (pool !== 'bias') {
          expect(l, `${pool}:${key} names her style, which is the bias clause's job`)
            .not.toMatch(/\{y\}/);
        }
        const bad = l.match(/\{(?!a\}|j\}|p\}|o\}|y\})[^}]*\}/);
        expect(bad, `${pool}:${key} uses unknown placeholder ${bad?.[0]}`).toBeNull();
      }
    }
  });

  it('meets the variant floor and writes distinct prose', () => {
    for (const { pool, key, t } of cWritten) {
      const need = pool === 'bias' ? 4 : CRITIQUE_VARIANTS;
      expect(t.lines.length, `${pool}:${key} has ${t.lines.length}, needs ${need}`)
        .toBeGreaterThanOrEqual(need);
      expect(new Set(t.lines).size, `${pool}:${key} repeats a line`).toBe(t.lines.length);
      for (let i = 0; i < t.lines.length; i++) {
        for (let k = i + 1; k < t.lines.length; k++) {
          expect(tooSimilar(t.lines[i], t.lines[k]),
            `${pool}:${key}: variants ${i + 1} and ${k + 1} are the same line reworded`).toBe(false);
        }
      }
      for (const l of t.lines) {
        const bad = foreignWordsIn(l, 'drag-race');
        expect(bad, `${pool}:${key} says "${bad[0]}", which belongs to another show`).toEqual([]);
        expect(l.length, `${pool}:${key} has a one-liner`).toBeGreaterThan(60);
      }
    }
  });

  it('reports the gap rather than hiding it', () => {
    const left = unwrittenCritiqueVoices();
    // eslint-disable-next-line no-console
    console.log(`critiques: ${critiqueVoiceTierCount() - left.length} of `
      + `${critiqueVoiceTierCount()} tiers.\n  ${left.join(', ')}`);
    expect(Array.isArray(left)).toBe(true);
  });
});
