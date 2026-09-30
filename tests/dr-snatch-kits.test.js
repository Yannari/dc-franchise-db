// ══════════════════════════════════════════════════════════════════════
// dr-snatch-kits.test.js — every celebrity on the desk has something to say
// ══════════════════════════════════════════════════════════════════════
//
// The old screen drew each answer from one generic pool keyed on how well she
// did, so nobody ever answered the question on the card and nobody sounded
// like the person she was doing. Every character now has a kit
// (js/dr/data/snatch-kits) and the engine picks from it.
import { describe, expect, it } from 'vitest';
import { SNATCH_KITS, kitFor } from '../js/dr/data/snatch-kits/index.js';
import { SNATCH_CHARACTERS } from '../js/dr/data/snatch-characters.js';
import { SNATCH_QUESTIONS, quoteLine } from '../js/dr/data/snatch-script.js';
import { perform } from '../js/dr/chal/snatch-game.js';
import { rngFor } from '../js/dr/rng.js';
import { foreignWordsIn } from './helpers/show-vocabulary.js';

describe('the kits', () => {
  it('cover every character, with an answer to every card', () => {
    for (const c of SNATCH_CHARACTERS) {
      const k = kitFor(c.id);
      expect(k, `${c.id} has no kit`).toBeTruthy();
      for (const q of SNATCH_QUESTIONS) {
        const a = k.a?.[q.id];
        expect(a, `${c.id} has no answer to "${q.text}"`).toBeTruthy();
        expect(a[0].length, `${c.id}/${q.id}: the card is a speech, not a card`).toBeLessThanOrEqual(64);
        expect(a[1].length, `${c.id}/${q.id}: nothing said`).toBeGreaterThan(20);
      }
      expect(k.intro.length, c.id).toBeGreaterThanOrEqual(2);
      expect(k.heckle.length, c.id).toBeGreaterThanOrEqual(2);
      for (const h of k.heckle) expect(h, `${c.id}: a heckle aimed at nobody`).toContain('{b}');
    }
    expect(Object.keys(SNATCH_KITS).length).toBe(SNATCH_CHARACTERS.length);
  });

  it('has a catchphrase that can be SAID — the flat answers quote it', () => {
    for (const [id, k] of Object.entries(SNATCH_KITS)) {
      expect(k.catch, id).toBeTruthy();
      expect(k.catch, `${id}: the catchphrase is a stage direction`).not.toMatch(/^\[/);
    }
  });

  it("speaks this show's words only", () => {
    for (const [id, k] of Object.entries(SNATCH_KITS)) {
      const all = [k.catch, ...k.intro, ...k.heckle, ...Object.values(k.a).flat()].join(' ');
      expect(foreignWordsIn(all, 'drag-race'), id).toEqual([]);
    }
  });

  it('keeps stage directions outside the quotation marks', () => {
    expect(quoteLine('[Very slowly.] Hi, Ru. [She waves.] Bye.')).toBe('[Very slowly.] "Hi, Ru." [She waves.] "Bye."');
  });
});

describe('the taping reads from them', () => {
  const players = Object.fromEntries(['A', 'B', 'C', 'D', 'E', 'F'].map((n, i) => [n, {
    name: n, archetype: i % 2 ? 'villain' : 'hero',
    stats: { boldness: 6, strategic: 6, loyalty: 3 },
    drag: { comedy: 3 + i, acting: 3 + i, style: 'camp', dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 },
  }]));
  const ids = ['cher', 'dolly-parton', 'bjork', 'cardi-b', 'joan-rivers', 'gordon-ramsay'];
  const order = Object.keys(players);
  const picks = Object.fromEntries(order.map((n, i) => [n, { choice: ids[i], penalty: 0 }]));

  it('gives a queen who lands it her celebrity\'s own answer to THIS card', () => {
    let good = 0;
    for (let s = 1; s <= 12; s++) {
      const d = perform({ living: order, players, assignment: { order, picks }, prep: {}, rng: rngFor(s * 7919 + 13), bond: () => 0, cfg: {} })
        .scenes[0].data;
      for (const r of d.rounds) {
        for (const a of r.answers) {
          if (a.tier !== 'kill' && a.tier !== 'laugh') continue;
          good += 1;
          expect(a.card).toBe(kitFor(a.characterId).a[r.qid][0]);
        }
      }
    }
    expect(good).toBeGreaterThan(10);
  });

  it('scores her on what AIRED: the intro and every answer she was shown giving', () => {
    /* She won the week with the lowest laughs on the screen, because the panel
       averaged six rounds and the screen showed two of them. */
    for (let s = 1; s <= 8; s++) {
      const out = perform({ living: order, players, assignment: { order, picks }, prep: {}, rng: rngFor(s * 7919 + 13), bond: () => 0, cfg: {} });
      const d = out.scenes[0].data;
      for (const n of order) {
        const shown = [d.intros.find(i => i.name === n)]
          .concat(d.rounds.flatMap(r => r.answers.filter(a => a.name === n)));
        const aired = out.performances[n].detail.aired;
        expect(aired.length, n).toBe(shown.length);
        const mean = aired.reduce((t, x) => t + x, 0) / aired.length;
        expect(out.performances[n].perf).toBeCloseTo(mean, 1);
      }
    }
  });

  it('gives a queen who is flat or dying the obvious answer, never a kit joke', () => {
    for (let s = 1; s <= 12; s++) {
      const d = perform({ living: order, players, assignment: { order, picks }, prep: {}, rng: rngFor(s * 7919 + 13), bond: () => 0, cfg: {} })
        .scenes[0].data;
      for (const r of d.rounds) {
        const q = SNATCH_QUESTIONS.find(x => x.id === r.qid);
        for (const a of r.answers) {
          if (a.tier === 'flat' || a.tier === 'bomb') expect(q.obvious, `${a.characterId}: "${a.card}"`).toContain(a.card);
        }
        // And a match is only ever the obvious answer the player wrote down.
        for (const m of r.reveal.matches) expect(r.answers.find(a => a.name === m).card).toBe(r.reveal.card);
      }
    }
  });
});
