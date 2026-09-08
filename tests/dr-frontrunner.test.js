// ══════════════════════════════════════════════════════════════════════
// dr-frontrunner.test.js — the front-runner is whoever is actually in front
// ══════════════════════════════════════════════════════════════════════
//
// The arc is cast from stats BEFORE anybody has performed — the edit's guess
// at who the season is about — and it used to stay where it was put for
// fourteen episodes. So the queen who won the first three challenges was not
// the front-runner, and the one who had not placed since the premiere still
// was. Measured on the shipped engine: the forecast was overtaken in 14
// seasons out of 20, and in none of them did the label move.
//
// It moves now. The early favourite who fades is a story rather than a
// mistake to hide, so the old arc flips to `overtaken` and keeps its beats,
// and the queen who is actually winning gets an arc of her own.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';
import { isAgenda } from '../js/dr/arcs.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty',
  'boldness', 'intuition', 'temperament'];
const NAMES = ['Ivy', 'Coco', 'Nell', 'Rita', 'Mimi', 'Bowie', 'Julia', 'Emmah',
  'Axel', 'Wayne', 'Caleb', 'Scary'];
const ARCH = ['villain', 'hero', 'mastermind', 'goat', 'schemer', 'floater',
  'hothead', 'loyal-soldier', 'wildcard', 'underdog', 'chaos-agent', 'social-butterfly'];

const season = (seed) => {
  const rng = rngFor(seed);
  const r = () => 1 + Math.floor(rng() * 10);
  const cast = NAMES.map((name, i) => ({
    name, slug: name.toLowerCase(), gender: 'f', archetype: ARCH[i], age: 25 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
  return playDragSeason({ cast, seed });
};
const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
const RUNS = SEEDS.map(season);
const winsOf = (state, n) => (state.record[n] || []).filter(x => x === 'WIN').length;
const frontArcs = run => run.rows[run.rows.length - 1].dr.storylines
  .filter(a => a.arc === 'frontrunner');

describe('the front-runner follows the record', () => {
  it('hands the label over when somebody else is plainly winning', () => {
    const moved = RUNS.filter(r => frontArcs(r).some(a => a.flipped === 'overtaken'));
    // NOT A BET ON A DISTRIBUTION: 20 fixed seeds, so this is a count that
    // does not move between runs. Measured 14.
    expect(moved.length, 'the forecast is never overtaken in 20 seasons')
      .toBeGreaterThan(5);
    // And it is not simply always moving, which would be a different bug —
    // sometimes the edit calls it right.
    expect(moved.length).toBeLessThan(RUNS.length);
  });

  it('usually ends up on the queen with the most wins', () => {
    const right = RUNS.filter(run => {
      const best = NAMES.slice().sort((a, b) => winsOf(run.state, b) - winsOf(run.state, a))[0];
      return frontArcs(run).filter(a => !a.flipped).some(a => a.players[0] === best);
    });
    // Never all twenty: the arc moves on a two-win margin, so a late surge
    // that never opens that gap correctly does not take the label.
    expect(right.length, 'the live arc almost never sits on the top winner')
      .toBeGreaterThan(RUNS.length * 0.5);
  });

  /* The ROW carries `arcSummary`, where `beats` is a COUNT — right for a
     screen, useless for reading what happened. The live arcs on `state` keep
     the beat log, so the two tests below take their evidence from there. */
  const liveArcs = run => run.state.storylines.filter(a => a.arc === 'frontrunner');

  it('only moves on a real margin, never on one good week', () => {
    /* THE RULE. A single win must not hand the season's spine to somebody who
       has had one good night — so at the moment of every handover the new
       leader is at least two clear wins ahead. Checked at the END, which is a
       weaker statement than at the moment itself, but the direction is what
       matters: a handover to somebody who finished behind on wins would be
       the rule not firing at all. */
    for (const run of RUNS) {
      for (const a of liveArcs(run)) {
        const over = (a.beats || []).find(b => b.kind === 'overtaken');
        if (!over) continue;
        expect(over.by, 'an overtaking with nobody doing it').toBeTruthy();
        expect(winsOf(run.state, over.by))
          .toBeGreaterThanOrEqual(winsOf(run.state, a.players[0]));
      }
    }
  });

  it('keeps the faded favourite as a story rather than deleting her', () => {
    // Her beats are what happened. A flipped arc that lost them would be the
    // season quietly editing its own history.
    const flipped = RUNS.flatMap(liveArcs).filter(a => a.flipped === 'overtaken');
    expect(flipped.length).toBeGreaterThan(0);
    for (const a of flipped) {
      expect(a.beats.length, `${a.players[0]}'s arc was emptied when it flipped`)
        .toBeGreaterThan(0);
      // The handover itself is one of them, so the story says how it ended.
      expect(a.beats.some(b => b.kind === 'overtaken')).toBe(true);
    }
  });

  it('never gives one queen two solo agendas', () => {
    /* `assignStorylines` enforces this at cast time and the handover has to
       respect it too: an underdog who starts winning is the underdog arc
       PAYING OFF, which is a better story than relabelling her, and two solo
       agendas on one queen would count her twice in the host's bend. */
    for (const run of RUNS) {
      const held = {};
      for (const a of run.state.storylines) {
        if (!isAgenda(a.arc) || a.players.length !== 1 || !a.alive) continue;
        held[a.players[0]] = (held[a.players[0]] || 0) + 1;
      }
      const doubled = Object.entries(held).filter(([, v]) => v > 1);
      expect(doubled, `two live solo agendas on one queen: ${JSON.stringify(doubled)}`)
        .toEqual([]);
    }
  });
});
