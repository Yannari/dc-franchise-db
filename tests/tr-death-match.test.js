// ══════════════════════════════════════════════════════════════════════
// tests/tr-death-match.test.js — four chairs, eight cards
// ══════════════════════════════════════════════════════════════════════
//
// The twist is off by default and the night is PINNED in every arm here, for
// `tests/tr-banish-or-murder.test.js`'s reason: what is being measured is what
// the game does, not how often the catalogue offers it.
//
// THE ONE NUMBER THE WHOLE TWIST TURNS ON is the last arm in the first block:
// the pact argues about a name and then gets that name roughly a quarter of the
// time. Every other murder in this engine is a decision; this one is a decision
// followed by a card game that does not care, and if that rate ever drifts up
// toward one the twist has quietly become an ordinary night with a longer scene
// in front of it.
//
// A SHIELD IS NOT SWEPT FOR HERE. The block path is the same five lines every
// other variant has (`isShielded` -> spend -> record -> return with
// `victim: null`), it sits below the game rather than inside it, and a sweep
// that waits for a shielded player to also lose a card game measures the
// shield's distribution rather than this file's. The unit arms below assert the
// game; tests/tr-murder.test.js asserts the block.
import { describe, expect, it } from 'vitest';
import { gs, setGs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { rpBuildConclave } from '../js/vp-tr/conclave.js';
import { alignmentAt } from '../js/tr/roles.js';
import { buildDeathMatch, playDeathMatch, VARIANT_LINES, variantEvidence }
  from '../js/tr/murder-variants.js';
import { resetKnowledge, recordFact } from '../js/knowledge.js';
import { alignmentFactId } from '../js/tr/roles.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);
const NIGHTS = { 4: 'death-match', 6: 'death-match' };

function play(seed, schedule = NIGHTS) {
  setPlayers(ROSTER);
  setGs({});
  playTraitorsSeason({ cast: CAST, traitorCount: 3, seed, murderSchedule: schedule });
  return (gs.tr?.rounds || []).filter(r => r.variant === 'death-match');
}

/**
 * Every death match across `n` seeds, with its episode row beside it.
 *
 * ALIGNMENT IS READ INSIDE THE LOOP, while the season it belongs to is still
 * the live `gs` — the trap `tests/tr-banish-or-murder.test.js` documents at
 * length, where sixty rounds were collected and then season sixty was asked
 * about season one's people.
 */
function sweep(n) {
  const out = [];
  for (let seed = 1; seed <= n; seed++) {
    for (const round of play(seed)) {
      const ep = (gs.episodeHistory || []).find(e => Number(e.num) === round.ep) || null;
      const d = round.variantData;
      out.push({ seed, round, ep, d,
        traitorSeated: (d.players || []).filter(x => alignmentAt(x, round.ep) === 'traitor') });
    }
  }
  return out;
}

describe('the death match', () => {
  it('is off unless the author asks for it', () => {
    setPlayers(ROSTER);
    setGs({});
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: 6 });
    expect((gs.tr?.rounds || []).some(r => r.variant === 'death-match')).toBe(false);
  });

  it('seats exactly four, the argued name among them, nobody twice', () => {
    const runs = sweep(12);
    expect(runs.length).toBeGreaterThan(12);
    for (const { d, round } of runs) {
      expect(d.players.length).toBe(4);
      expect(new Set(d.players).size).toBe(4);
      expect(d.players).toContain(d.aim);
      // Everybody seated was in the castle at the time.
      for (const n of d.players) expect((round.living || d.players)).toContain(n);
    }
  });

  it('empties exactly one chair, and it is the chair the engine killed', () => {
    for (const { d, round } of sweep(12)) {
      expect(d.rounds.length).toBe(3);
      expect(d.safe.length).toBe(3);
      expect(d.safe).not.toContain(d.loser);
      expect(d.finalists.length).toBe(2);
      expect(d.finalists).toContain(d.loser);
      expect(d.finalists).toContain(d.winner);
      expect(round.murdered || round.murderTarget).toBe(d.loser);
      // The last round says how many cards were still face down. The show's
      // own number, and the caption prints it.
      expect(d.rounds[2].toGo).toBeGreaterThan(0);
      expect(d.rounds[2].toGo).toBeLessThanOrEqual(7);
    }
  });

  // ── THE RULE, AND IT IS THE WHOLE TWIST ──────────────────────────────
  it('gives the pact the name it argued for about a quarter of the time', () => {
    const runs = sweep(50);
    const kinds = {};
    for (const { d } of runs) kinds[d.kind] = (kinds[d.kind] || 0) + 1;
    const n = runs.length;
    expect(n).toBeGreaterThan(50);
    // FOUR CHAIRS IS FOUR CHAIRS. A small skill term moves it a little (the
    // sharp survive the draws marginally more often, which cuts both ways for
    // the target), and nothing else may.
    expect(kinds.aimed / n, 'the cards are agreeing with the pact too often')
      .toBeLessThan(0.4);
    expect(kinds.aimed / n, 'the pact never gets the name it wanted')
      .toBeGreaterThan(0.1);
    // The common case is the interesting one and it must stay common.
    expect(kinds.missed / n).toBeGreaterThan(0.5);
    // And the pact loses a member to its own cover often enough to matter and
    // rarely enough to be a disaster when it happens.
    expect(kinds.fellow || 0).toBeGreaterThan(0);
    expect((kinds.fellow || 0) / n).toBeLessThan(0.2);
  });

  it('seats a cloak for cover sometimes, and it costs them when it goes wrong', () => {
    const runs = sweep(40);
    const covered = runs.filter(r => r.d.cover);
    expect(covered.length / runs.length, 'the pact never seats its own').toBeGreaterThan(0.1);
    expect(covered.length / runs.length, 'the pact seats its own every time').toBeLessThan(0.55);
    for (const { d, traitorSeated } of covered) {
      expect(traitorSeated).toContain(d.cover);
    }
    // A fellow can only lose a chair the pact gave them.
    for (const { d } of runs.filter(r => r.d.kind === 'fellow')) {
      expect(d.cover).toBe(d.loser);
    }
  });

  it('writes a grudge against the decider when the cards take one of their own', () => {
    let checked = 0;
    for (const { d, round, seed } of sweep(40)) {
      if (d.kind !== 'fellow') continue;
      play(seed);
      const rows = (gs.tr.conclaveTension || []).filter(t => t.ep === round.ep && t.forced);
      // WHO IS LEFT TO MIND. The grudge is written by every surviving Traitor
      // EXCEPT the one who signed for the night, so a pact of two that loses a
      // member to its own cover has nobody to write it — the decider is the
      // only one still standing. That is not a missing consequence, it is a
      // pact of one, and an arm that demanded a row here would have been
      // demanding the engine invent a grudge-holder.
      for (const r of rows) expect(r.target).toBe(d.loser);
      if (rows.length) checked++;
    }
    expect(checked, 'no pact big enough to resent it in 40 seeds').toBeGreaterThan(0);
  });

  // ── THE PROSE, AND THE FACT IT ASSERTS ───────────────────────────────
  it('takes its sentence from the pool that matches what happened', () => {
    const seen = new Set();
    for (const { d, round } of sweep(40)) {
      expect(round.variantLineKey).toBe('death-match-' + d.kind);
      expect(VARIANT_LINES[round.variantLineKey]).toContain(
        // The rendered line came out of that pool, with names filled in — the
        // check tests/tr-murder.test.js makes for every other variant, and for
        // the reason `variantLine`'s docstring gives: a key nobody honours is
        // a label, not a guard.
        VARIANT_LINES[round.variantLineKey].find(t => {
          const rx = new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\\\{victim\\\}/g, '.+').replace(/\\\{winner\\\}/g, '.+') + '$');
          return rx.test(round.variantLine);
        }));
      seen.add(round.variantLineKey);
    }
    // All three pools are reached, which is the thing that stops one of them
    // being written, registered and never printed.
    expect([...seen].sort()).toEqual(
      ['death-match-aimed', 'death-match-fellow', 'death-match-missed']);
  });

  // ── THE EVIDENCE ─────────────────────────────────────────────────────
  // A UNIT ARM, AND ON PURPOSE — `tests/tr-banish-or-murder.test.js` documents
  // the reason at length. `variantEvidence`'s return value is not logged
  // anywhere (headless.js calls it for its effect on the knowledge store), and
  // `learn` keeps the source that CREATED a belief, so reading a finished
  // season's beliefs back would test the ORDER of the season rather than this
  // channel. This calls it on a world of its own.
  it('makes the room suspect the other chair, and only the other chair', () => {
    setPlayers(ROSTER);
    setGs({ activePlayers: CAST.slice(0, 8), bonds: {} });
    const [w, x, y, z, ...rest] = CAST.slice(0, 8);
    gs.tr = {
      alignment: {},
      blockedMurders: [],
      rounds: [{
        ep: 4, variant: 'death-match', murdered: x, murderTarget: x,
        variantData: { players: [w, x, y, z], safe: [y, z, w], finalists: [w, x],
          winner: w, loser: x, kind: 'missed', aim: y, cover: null,
          rounds: [{ players: [w, x, y, z], won: y }, { players: [w, x, z], won: z },
            { players: [w, x], won: w, toGo: 3 }] },
      }],
    };
    resetKnowledge();
    for (const n of CAST.slice(0, 8)) {
      recordFact({ type: 'alignment', subject: n, truth: n === w, ep: 1 });
    }
    // The victim is gone by the morning the room talks about it.
    gs.activePlayers = [w, y, z, ...rest];
    const formed = variantEvidence(5, () => 0);
    expect(formed.length, 'nobody in the room learned anything').toBeGreaterThan(0);
    for (const f of formed) {
      expect(f.kind).toBe('won-the-death-match');
      // ONLY THE OTHER CHAIR. Three of the four lived; "was in the game" is the
      // most public set in the format and the least informative, and a channel
      // that indicted all three would be a machine for suspecting Faithfuls.
      expect(f.subject).toBe(w);
    }
    const held = Object.values((gs.knowledge || {})[alignmentFactId(w)]?.beliefs || {})
      .filter(b => String(b.source || '').includes('drew the life card'));
    expect(held.length).toBeGreaterThan(0);
    for (const b of held) {
      // The cheapest channel in the file, and under the alignment ceiling every
      // belief in the game is clamped to.
      expect(b.confidence).toBeLessThanOrEqual(0.26 + 1e-9);
    }
    for (const n of [y, z]) {
      expect((gs.knowledge || {})[alignmentFactId(n)]?.beliefs || {}).toEqual({});
    }
  });

  // ── THE SCREEN ───────────────────────────────────────────────────────
  it('draws the summons, the rounds, the circle and who the cards took', () => {
    const runs = sweep(30);
    for (const kind of ['aimed', 'missed', 'fellow']) {
      const hit = runs.find(r => r.d.kind === kind);
      expect(hit, `no ${kind} night in 30 seeds`).toBeTruthy();
      play(hit.seed);
      const row = (gs.episodeHistory || []).find(e => Number(e.num) === hit.round.ep);
      const html = rpBuildConclave(row, 'audience');
      expect(html).toContain('Four Chairs');
      expect(html).toContain('The Circle');
      expect(html).toContain('dm-stage');
      // The stage walks with the beats: the last beat has to be the last step,
      // or the table is still dealing while the wax is going on the letter.
      expect(html).toContain('data-stage="6"');
      expect(html).toContain(kind === 'aimed' ? 'The Cards Agree'
        : kind === 'fellow' ? 'One of Their Own' : 'The Cards Decide');
      // AND THE NIGHT'S OWN NUMBERING. Three cards were inserted before the
      // wax on this night; a wax card still labelled VIII would be the eighth
      // of eleven.
      expect(html).toContain('XI. The wax');
      expect(html).not.toContain('VIII. The wax');
    }
  });

  it('never prints an alignment beside a chair', () => {
    for (const { seed, round, d } of sweep(10)) {
      play(seed);
      const row = (gs.episodeHistory || []).find(e => Number(e.num) === round.ep);
      const html = rpBuildConclave(row, 'audience');
      const card = html.slice(html.indexOf('Four Chairs'), html.indexOf('Four Chairs') + 4000);
      for (const n of d.players) {
        if (alignmentAt(n, round.ep) !== 'traitor') continue;
        expect(new RegExp(n + '[^<]{0,80}(Traitor|traitor)').test(card),
          `${n} is named as a Traitor on the summons card`).toBe(false);
      }
    }
  });

  // ── THE PIECES, ON THEIR OWN ─────────────────────────────────────────
  it('the game is decided by the cards and barely at all by the player', () => {
    // A unit arm over the pure function: the same four people, played across
    // 200 different nights, must not produce one reliable survivor. A version
    // where the sharp player lives is a version where the pact can aim after
    // all, which is the twist gone.
    setPlayers(ROSTER);
    setGs({ activePlayers: CAST.slice(0, 8), bonds: {} });
    const four = CAST.slice(0, 4);
    const lost = {};
    for (let ep = 1; ep <= 200; ep++) {
      const g = playDeathMatch(ep, four);
      lost[g.loser] = (lost[g.loser] || 0) + 1;
      expect(four).toContain(g.loser);
      expect(g.safe).toHaveLength(3);
    }
    const share = four.map(n => (lost[n] || 0) / 200);
    expect(Math.max(...share), 'somebody is losing this game far too often')
      .toBeLessThan(0.4);
    expect(Math.min(...share), 'somebody effectively cannot lose this game')
      .toBeGreaterThan(0.12);
  });

  it('never seats a name it was not given', () => {
    setPlayers(ROSTER);
    setGs({ activePlayers: CAST.slice(0, 9), bonds: {} });
    gs.tr = { rounds: [], alignment: {} };
    for (let ep = 2; ep <= 40; ep++) {
      const { players, cover } = buildDeathMatch(ep, CAST[0], [CAST[1]]);
      expect(players).toHaveLength(4);
      expect(players).toContain(CAST[0]);
      for (const n of players) expect(CAST.slice(0, 9)).toContain(n);
      if (cover) expect(cover).toBe(CAST[1]);
    }
  });
});
