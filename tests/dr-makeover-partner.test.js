// ══════════════════════════════════════════════════════════════════════
// dr-makeover-partner.test.js — the partner can have his own morning
// ══════════════════════════════════════════════════════════════════════
//
// `ease` used to be a flat handicap and nothing else: a partner graded three
// cost his queen the same fraction of a point every single week, silently,
// with no day behind it. It is worth about a point across a cohort's range —
// measured, two thirds of what her own runway is worth — but a point of
// arithmetic is not a man who will not put the heels on.
//
// He can fight it now, weighted by his grade, and the picker says which
// cohorts contain somebody capable of it.

import { describe, expect, it } from 'vitest';
import { PARTNER_COHORTS, cohortDifficulty, cohortLabel } from '../js/dr/chal/makeover.js';
import { GUEST_POOLS } from '../js/dr/data/partners.js';
import { MAXI_EVENTS } from '../js/dr/data/maxi-events.js';
import { renderMaxiEventScenes } from '../js/dr/stage.js';
import { runMaxi } from '../js/dr/maxi.js';
import { maxiById } from '../js/dr/data/challenges.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot', 'Eve', 'Fay', 'Gia', 'Hal'];
const CRAFT = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];

const mk = (n, seed) => {
  const r = rngFor(seed);
  const drag = Object.fromEntries(CRAFT.map(k => [k, 3 + Math.round(r() * 6)]));
  const stats = Object.fromEntries(STATS.map(k => [k, 3 + Math.round(r() * 6)]));
  return { name: n, slug: n.toLowerCase(), archetype: 'hero', stats, drag };
};

/* SPREAD SEEDS, NOT CONSECUTIVE ONES. The generator's first draw is linear in
   its seed, so seasons seeded 1..n agree with each other far more than two
   real seasons do — the documented trap that once reported a live event as
   unreachable. */
function makeover(pool, seed) {
  const players = Object.fromEntries(NAMES.map((q, i) => [q, mk(q, seed * 100 + i)]));
  const res = runMaxi({
    living: NAMES, players, maxi: maxiById('makeover'), rng: rngFor(seed * 7919 + 13),
    state: { record: Object.fromEntries(NAMES.map(q => [q, []])), flags: {}, out: [] },
    bond: () => 0, addBond: () => {}, popDelta: () => {}, miniWinner: 'Ada',
    mini: null, cfg: { makeoverPool: pool },
  });
  return { res, players };
}

function nights(pool, n = 250) {
  const rows = [];
  const perNight = [];
  for (let s = 1; s <= n; s++) {
    const { res, players } = makeover(pool, s);
    perNight.push((res.events || []).filter(e => e.type === 'partner-fought-it').length);
    for (const q of NAMES) {
      const p = res.performances?.[q];
      const pick = res.assignment?.picks?.[q];
      if (!p || !pick?.partner) continue;
      rows.push({ q, perf: p.perf, ease: pick.partner.ease, ...p.detail,
        social: players[q].stats.social });
    }
  }
  return { rows, perNight };
}

const mean = v => v.reduce((a, b) => a + b, 0) / v.length;

describe('how hard a cohort is', () => {
  it('is measured off the pool, never typed', () => {
    for (const key of Object.keys(GUEST_POOLS)) {
      const d = cohortDifficulty(key);
      const ease = GUEST_POOLS[key].map(p => p.ease);
      expect(d.lo, key).toBe(Math.min(...ease));
      expect(d.hi, key).toBe(Math.max(...ease));
      expect(cohortLabel(key)).toContain(`${d.lo}–${d.hi}`);
    }
  });

  it('says "varies" for the two cohorts graded at run time', () => {
    /* `eliminated` is graded on the runway of whoever has gone home and
       `alumni` on how bold the other show's players are. Neither has an
       honest number before the season is played, and a made-up one on a
       control is worse than none. */
    for (const key of ['eliminated', 'alumni']) {
      expect(cohortDifficulty(key), key).toBe(null);
      expect(cohortLabel(key), key).toContain('varies');
    }
  });

  it('gives every cohort in the picker a label', () => {
    for (const c of PARTNER_COHORTS) {
      const label = cohortLabel(c);
      expect(label, c).toContain(c.replace(/-/g, ' '));
      expect(label, `${c} says nothing about difficulty`)
        .toMatch(/gentle|fair|rough|brutal|varies/);
    }
  });

  it('does not call a cohort brutal for its one bad day', () => {
    /* `loved-ones` runs 3 to 10. Keyed on the worst draw alone it came out
       "brutal", which is one extreme standing in for a cohort — so the word
       is the average and the numbers beside it are the worst draw. */
    expect(cohortDifficulty('loved-ones').lo).toBeLessThan(4);
    expect(cohortDifficulty('loved-ones').word).not.toBe('brutal');
    expect(cohortDifficulty('superfans').word).toBe('gentle');
    expect(cohortDifficulty('veterans').word).toBe('rough');
  });
});

describe('the partner can fight it', () => {
  const hard = nights('seniors');
  const soft = nights('superfans');
  const rate = r => r.rows.filter(x => x.partnerFought).length / r.rows.length;

  it('happens, and more often to somebody handed a hard partner', () => {
    expect(rate(hard), 'nobody ever fought it on the hardest cohort')
      .toBeGreaterThan(0.05);
    expect(rate(hard)).toBeGreaterThan(rate(soft) * 1.4);
  });

  it('scales with his grade rather than switching on at one', () => {
    /* Proportional, never a threshold — the franchise rule. A nine can still
       have a bad morning and a three can still surprise everybody. */
    const byEase = {};
    for (const r of hard.rows) {
      (byEase[r.ease] ||= [0, 0]);
      byEase[r.ease][1]++;
      if (r.partnerFought) byEase[r.ease][0]++;
    }
    const grades = Object.keys(byEase).map(Number).sort((a, b) => a - b);
    const pct = g => byEase[g][0] / byEase[g][1];
    expect(pct(grades[0]), 'the hardest grade fights no more than the easiest')
      .toBeGreaterThan(pct(grades[grades.length - 1]));
    expect(pct(grades[grades.length - 1]), 'an easy partner can never have a bad day')
      .toBeGreaterThan(0);
  });

  it('costs her, and the card can say so without any prose', () => {
    /* An unwritten pool renders no scene, so a score a point down would have
       had nothing on the screen explaining it. The flag rides on the
       performance detail, which the card reads directly. */
    const fought = hard.rows.filter(r => r.partnerFought);
    expect(fought.length).toBeGreaterThan(20);
    for (const r of fought) expect(r.partnerCost).toBeGreaterThan(0);
    const plain = hard.rows.filter(r => !r.partnerFought && !r.partnerTook);
    expect(mean(fought.map(r => r.perf)), 'fighting him cost her nothing')
      .toBeLessThan(mean(plain.map(r => r.perf)) - 0.3);
  });

  it('never lands on more than two queens in one night', () => {
    /* The same rule the pointed pairing and the roast keep. A room where half
       the partners are a disaster is not a harder challenge, it is a
       different show. */
    expect(Math.max(...hard.perNight)).toBeLessThanOrEqual(2);
  });

  it('is not only a punishment — he can be better than his grade', () => {
    const took = soft.rows.filter(r => r.partnerTook);
    expect(took.length).toBeGreaterThan(10);
    const plain = soft.rows.filter(r => !r.partnerTook && !r.partnerFought);
    expect(mean(took.map(r => r.perf))).toBeGreaterThan(mean(plain.map(r => r.perf)));
  });

  it('lets her talk him round, and only then does her social matter', () => {
    /* Talking somebody into a corset is the whole job on this night, so her
       social carries it — but ONLY on the mornings he fights, which is what
       makes it a mitigation rather than a stat quietly added to the
       challenge's blend. */
    const cor = (a, b) => {
      const ma = mean(a); const mb = mean(b);
      let n = 0; let da = 0; let db = 0;
      for (let i = 0; i < a.length; i++) {
        n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2;
      }
      return n / Math.sqrt(da * db);
    };
    const r = rows => cor(rows.map(x => x.social), rows.map(x => x.perf));
    const fought = hard.rows.filter(x => x.partnerFought);
    const rest = hard.rows.filter(x => !x.partnerFought);
    expect(r(fought), 'her social did not help when he fought').toBeGreaterThan(r(rest));
  });

  it('never blames her for the gap he made', () => {
    /* `dressed-herself-better` reads a gap between her look and his as
       selfishness and docks her two popularity for it. Caught by printing an
       episode: a card that said "he fought it − 1.5" and then accused her of
       the gap he had just made. */
    for (let s = 1; s <= 120; s++) {
      const { res } = makeover('seniors', s);
      const blamed = new Set((res.events || [])
        .filter(e => e.type === 'dressed-herself-better').flatMap(e => e.players));
      for (const [q, p] of Object.entries(res.performances || {})) {
        if (!p.detail?.partnerFought) continue;
        expect(blamed.has(q), `seed ${s}: ${q} was read for a gap her partner made`)
          .toBe(false);
      }
    }
  });
});

describe('and it happens where it happens', () => {
  /* `from` does two jobs — it names the screen for the three generic families
     and the CHALLENGE THAT OWNS the event for the twenty named after one — so
     for a makeover event it can only answer the second, and the maxi's step
     was the default. All four of the makeover's events were therefore stamped
     `maxi-main`: the mini winner handing the room out, drawn half an episode
     after she did it, and a partner refusing the heels drawn on the card for
     the runway he refused them before.
     `at` is the answer, and this is measured by rendering rather than by
     reading the field back. */
  const at = id => {
    const spec = MAXI_EVENTS.find(e => e.id === id);
    const had = spec.lines.slice();
    // An event with no prose emits no scene, so it is given one for the ask.
    spec.lines = ['{a} did a thing.'];
    const [sc] = renderMaxiEventScenes([{ type: id, players: ['Ada', 'Bee'] }],
      { step: 'maxi-main', rng: () => 0.5, family: 'makeover' });
    spec.lines = had;
    return sc?.step;
  };

  it('puts the morning in the werk room', () => {
    expect(at('partner-fought-it')).toBe('prep');
    expect(at('partner-took-to-it')).toBe('prep');
  });

  it('puts the pairing on the line-up, where the room watched her do it', () => {
    expect(at('handed-the-hardest')).toBe('choice');
    expect(at('paired-them-well')).toBe('choice');
  });

  it('leaves the finished pair on the main stage', () => {
    // This one IS a verdict on the two looks, so the runway is right for it.
    expect(at('dressed-herself-better')).toBe('maxi-main');
  });

  it('has not broken the three families that route off `from`', () => {
    expect(at('walkthrough')).toBe('prep');
  });
});
