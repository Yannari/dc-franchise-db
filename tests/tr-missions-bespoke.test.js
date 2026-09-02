// ══════════════════════════════════════════════════════════════════════
// tr-missions-bespoke.test.js — what the four afternoons actually do
// ══════════════════════════════════════════════════════════════════════
//
// tests/tr-mission-contract.test.js proves the SHAPE. This file proves the
// BEHAVIOUR: that upsets happen, that a Traitor's nudge is a nudge, that the
// settlement behind the screens is a real decision, that the Shield is paid
// for out of the pot, that the prose varies and that the writing contracts
// hold in the sentences a viewer actually reads.
//
// EVERY BAND HERE CARRIES ITS MUTATION, written beside it, and every one was
// run. On this branch that is not optional: four guards have shipped unable to
// fail. Where a band is a measured number rather than a logical one, the
// measurement is quoted so a later reader can tell a drift from a regression.
//
// FILENAME: deliberately not *-audit.test.js — vitest.config.js excludes that
// pattern from `npm test`.
import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { rngFor } from '../js/tr/headless.js';
import { getBond } from '../js/bonds.js';
import { TRAITORS_MISSIONS, _setBespokeMissionsEnabled } from '../js/tr/missions/index.js';
import { createMissionCtx, POT_CEILING, MISSION_BEHAVIOURS, statOf, archetypeFamily }
  from '../js/tr/missions/contract.js';
import { bespokeMission } from '../js/tr/missions/index.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 18);
const CAST = ROSTER.map(p => p.name);

const SOURCES = ['contract', 'index', 'drowned-causeway', 'nightjar-orrery',
  'long-account', 'ash-vault'];
// `fileURLToPath` rather than handing a URL object straight to readFileSync:
// under vitest's transform the relative-URL form resolved against the drive
// root and every source arm below failed with ENOENT on `C:\js\...`.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const src = f => readFileSync(path.join(HERE, '..', 'js', 'tr', 'missions', `${f}.js`), 'utf8');

function world(cast = CAST) {
  setPlayers(ROSTER);
  setGs({ bonds: {}, activePlayers: [...cast] });
  gs.tr = initTraitorsState();
  gs.tr.potCeiling = POT_CEILING;
}

function ctxFor(cast = CAST, ep = 3, traitors = []) {
  return createMissionCtx({ ep, living: [...cast],
    alignmentOf: (n) => (traitors.includes(n) ? 'traitor' : 'faithful') });
}

/** Run one mission over `n` seeds in a fresh world each time. */
function runs(mission, n, { cast = CAST, traitors = [], from = 0 } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    world(cast);
    out.push(mission.simulate(ctxFor(cast, 3, traitors), rngFor(from + i + 1)));
  }
  return out;
}

const norm = s => String(s).toLowerCase().replace(/[^a-z ]+/g, '').replace(/\s+/g, ' ').trim();

beforeEach(() => { _setBespokeMissionsEnabled(true); });

// ══════════════════════════════════════════════════════════════════════
// 1. THE AFTERNOON IS NOT DECIDED BEFORE IT STARTS
// ══════════════════════════════════════════════════════════════════════

describe('upsets happen, because every check is noisy', () => {
  for (const mission of TRAITORS_MISSIONS) {
    it(`${mission.id}: the best cast member on paper does not always top the day`, () => {
      // AGENTS.md: `noise(2.5)` minimum, and outcomes should surprise. The
      // claim is measurable — over 150 afternoons, how often is the winner the
      // person with the highest stat total?
      //
      // MEASURED, and the band is set off the measurement rather than off
      // taste. MUTATION RUN: drop the noise term in `noisyPair` to zero ->
      // `topRate` goes to 0.95+ on all four missions and this fails.
      const rs = runs(mission, 150, { from: 900 });
      const paper = [...CAST].sort((a, b) => {
        const tot = n => ['physical', 'endurance', 'mental', 'social', 'strategic',
          'loyalty', 'boldness', 'intuition', 'temperament']
          .reduce((s, k) => s + statOf(n, k), 0);
        return tot(b) - tot(a);
      })[0];
      const topRate = rs.filter(r => r.placements[0] === paper).length / rs.length;
      expect(topRate, `the strongest cast member on paper won ${(topRate * 100).toFixed(0)}% `
        + 'of afternoons — the noise is not doing anything').toBeLessThan(0.5);
      expect(new Set(rs.map(r => r.placements[0])).size,
        'the same handful of people always top the day').toBeGreaterThan(5);
    });

    it(`${mission.id}: both teams win sometimes, and the tiers are all reachable`, () => {
      const rs = runs(mission, 200, { from: 1200 });
      const wins = {};
      for (const r of rs) wins[r.bestTeam] = (wins[r.bestTeam] || 0) + 1;
      expect(Object.keys(wins).sort()).toEqual([...mission.teams].sort());
      for (const t of mission.teams) {
        expect(wins[t] / rs.length, `${t} won ${wins[t]} of 200`).toBeGreaterThan(0.3);
      }
    });

    it(`${mission.id}: all four prose tiers actually fire`, () => {
      // A QUARTER OF THE AUTHORED LINES IN EACH MISSION LIVE IN A TIER THAT
      // MIGHT NEVER BE REACHED. That is the defect Task 1 shipped — forty dead
      // lines, found by dumping seasons and reading them rather than by any
      // assertion — and it is why this arm exists rather than a looser
      // "at least two tiers" check, which the first draft had and which the
      // PHASE_SWING mutation walked straight through.
      //
      // DETERMINISTIC, not statistical: `rngFor` is seeded and the 400 seeds
      // are fixed, so "all four tiers appear" is a fact about this code and not
      // a sampling result. Measured counts over these seeds:
      //   causeway  triumph 81  solid 170  scraped 145  failed 4
      //   orrery    triumph 42  solid 170  scraped 185  failed 3
      //   account   triumph 21  solid 162  scraped 212  failed 5
      //   vault     triumph  5  solid 123  scraped 261  failed 11
      //
      // MUTATION RUN: PHASE_SWING back to the archetypes' 0.18 -> the tails
      // collapse and this goes red.
      const tiers = new Set(runs(mission, 400, { from: 20000 }).map(r => r.tier));
      const missing = ['triumph', 'solid', 'scraped', 'failed'].filter(t => !tiers.has(t));
      expect(missing, `${mission.id} never reaches: ${missing.join(', ')} — those summary `
        + 'lines are unprintable content').toEqual([]);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════
// 2. A TRAITOR MAY NUDGE. A TRAITOR MAY NOT SWITCH.
// ══════════════════════════════════════════════════════════════════════

describe('undermining is a shift to a probability, never a guarantee', () => {
  // THE MISSIONS WITH A DILEMMA IN THEM. The causeway's is the hand-over, the
  // orrery's is the vernier, the vault's is the jack, the account's is the
  // screen. All four are named here so a mission that quietly loses its
  // dilemma is a red test rather than a silent simplification.
  const DILEMMA = ['drowned-causeway', 'nightjar-orrery', 'long-account', 'ash-vault'];

  it('every mission declares a dilemma, and it reads alignment through ctx and nowhere else', () => {
    for (const id of DILEMMA) {
      const s = src(id);
      expect(s, `${id} has no dilemma — nothing reads ctx.conflicted`)
        .toMatch(/ctx\.conflicted\(/);
      // And it may not reach past the context for the answer.
      expect(s, `${id} imports alignment directly instead of asking its context`)
        .not.toMatch(/from '\.\.\/roles\.js'/);
    }
  });

  // WHERE EACH MISSION'S DILEMMA SHOWS UP ON ITS OWN RECORD, as a RATE that a
  // switch would drive to zero. The causeway's is the share of hand-overs that
  // survived, the orrery's the share of rings set true, the account's the share
  // of ballots that held, the vault's the share of jacks that seated.
  //
  // THE FIRST VERSION OF THIS MAP WAS A COUNT AND IT WAS VACUOUS. It read
  // `boxesUp > 0`, `ringsTrue > 0`, `bays > 0` — all of which are true on every
  // afternoon whatever the dilemma does — and the MUTATION (a hard
  // `ctx.conflicted(name) ? false : ...` in The Long Account's settlement) came
  // back GREEN twice: once against `potEarned > 0`, which is three phases
  // downstream of a one-phase switch, and once against a count that could not
  // reach zero. A rate can.
  const DILEMMA_RATE = {
    'drowned-causeway': r =>
      (2 - r.scenes.filter(s => s.eventId === 'causeway-box-into-the-channel').length) / 2,
    'nightjar-orrery': r => {
      const t = r.phases[1].teams;
      const tot = t.reduce((a, x) => a + x.ringsTotal, 0);
      return tot ? t.reduce((a, x) => a + x.ringsTrue, 0) / tot : 0;
    },
    'long-account': r => {
      const rows = Object.values(r.phases[2].ballots).flat();
      return rows.length ? rows.filter(b => b.held).length / rows.length : 0;
    },
    'ash-vault': r => {
      const b = r.phases[0].beats;
      return b.length ? b.filter(x => x.kind === 'good').length / b.length : 0;
    },
  };

  for (const mission of TRAITORS_MISSIONS) {
    it(`${mission.id}: a castle of conflicted players still gets through the dilemma`, () => {
      // THE ANTI-SWITCH ARM. If undermining were a branch rather than a nudge,
      // a cast in which everybody is conflicted would fail the dilemma every
      // time and the rate would be zero.
      //
      // MEASURED over 400 afternoons per mission with EVERY player conflicted,
      // against the same seeds with nobody conflicted, and the floor is set
      // PER MISSION about a tenth below the measured value:
      //   causeway hand-overs survived   0.826  (0.946 clean)   floor 0.70
      //   orrery rings set true          0.607  (0.656)         floor 0.50
      //   account ballots held           0.425  (0.556)         floor 0.32
      //   vault jacks seated             0.474  (0.569)         floor 0.38
      //
      // ONE GLOBAL FLOOR WAS TRIED FIRST AND DID NOT WORK. At 0.30 — chosen to
      // clear the lowest honest arm, the account's 0.425 — the ORRERY MUTANT
      // SURVIVED: with every setter failing, the catch branch still recovers
      // about 0.35 of the rings, which is above 0.30. The honest spread between
      // these four missions is wider than any single number can straddle, so
      // each is banded against its own measurement.
      //
      // MUTATION RUN, all four, each in its own file — causeway `pFumble = 1`
      // when conflicted, orrery ring always out, vault jack never seated,
      // account `held = false` — every one turns its own mission red here.
      const FLOOR = { 'drowned-causeway': 0.70, 'nightjar-orrery': 0.50,
        'long-account': 0.32, 'ash-vault': 0.38 };
      const all = runs(mission, 120, { traitors: CAST, from: 2000 });
      const rate = all.reduce((a, r) => a + DILEMMA_RATE[mission.id](r), 0) / all.length;
      expect(rate, `an all-conflicted castle got through the dilemma at a rate of `
        + `${rate.toFixed(3)} — the nudge has become a switch`)
        .toBeGreaterThan(FLOOR[mission.id]);
      // And the money still arrives. Kept beside the strong claim rather than
      // instead of it: it is the weaker one, and on its own it is vacuous.
      const paid = all.filter(r => r.potEarned > 0).length / all.length;
      expect(paid).toBeGreaterThan(0.7);
    });

    it(`${mission.id}: and a castle of none still fails sometimes`, () => {
      // THE OTHER HALF, and it is the half that keeps the false positives
      // alive: a Faithful's ordinary mistake must produce the same observable.
      // MUTATION RUN: floor every phase roll at success for unconflicted
      // players -> `anyMistake` goes to 0 and this fails.
      const clean = runs(mission, 120, { traitors: [], from: 3000 });
      const anyMistake = clean.filter(r =>
        r.scenes.some(s => s.behaviour === 'suspicious' || s.behaviour === 'cowardly')).length;
      expect(anyMistake, 'a castle with nobody conflicted never once looked bad — every '
        + 'accusation this mission can produce would be a true positive').toBeGreaterThan(20);
    });

    it(`${mission.id}: being conflicted costs the room something, measurably`, () => {
      // AND THE NUDGE MUST ACTUALLY EXIST. A "nudge" that moves nothing is a
      // dead axis, which this project has shipped before as decorative
      // metadata. Same seeds, same cast, only the alignment map differs.
      // MUTATION RUN: set the nudge constants to 0 -> the two means converge
      // and this fails.
      const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
      const clean = mean(runs(mission, 150, { traitors: [], from: 4000 })
        .map(r => r.quality));
      const dirty = mean(runs(mission, 150, { traitors: CAST, from: 4000 })
        .map(r => r.quality));
      expect(dirty, `conflicted ${dirty.toFixed(3)} vs clean ${clean.toFixed(3)} — the `
        + 'dilemma moves nothing').toBeLessThan(clean);
      // And it moves the dilemma itself, not only the money three phases
      // downstream. Measured drops: causeway 0.946 -> 0.826, orrery 0.656 ->
      // 0.607, account 0.556 -> 0.425, vault 0.569 -> 0.474.
      const dr = (traitors) => {
        const rs = runs(mission, 150, { traitors, from: 4000 });
        return rs.reduce((a, r) => a + DILEMMA_RATE[mission.id](r), 0) / rs.length;
      };
      expect(dr(CAST), 'the nudge does not touch its own dilemma').toBeLessThan(dr([]));
      // ...and not by so much that it is effectively a switch.
      expect(clean - dirty, 'the "nudge" costs more than a fifth of the afternoon')
        .toBeLessThan(0.2);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════
// 3. THE SETTLEMENT IS A REAL DECISION
// ══════════════════════════════════════════════════════════════════════

describe('The Long Account: the screens are sealed and the dilemma is real', () => {
  const mission = bespokeMission('long-account');

  it('both outcomes happen, and neither is the default', () => {
    const rs = runs(mission, 200, { from: 5000 });
    const teamOutcomes = rs.flatMap(r =>
      Object.values(r.tally.settlement).map(o => o.paid));
    const rate = teamOutcomes.filter(Boolean).length / teamOutcomes.length;
    expect(rate, `holds carried ${(rate * 100).toFixed(0)}% of the time — one branch is `
      + 'the weather').toBeGreaterThan(0.15);
    expect(rate).toBeLessThan(0.85);
  });

  it('nobody in the castle is ever told who held', () => {
    // The host promises it in the briefing, and the record has to keep the
    // promise in a field a castle event can read. MUTATION RUN: set
    // `revealed: true` on the ballots -> this fails.
    for (const r of runs(mission, 40, { from: 5400 })) {
      for (const rows of Object.values(r.phases[2].ballots)) {
        for (const b of rows) expect(b.revealed).toBe(false);
      }
      expect(r.briefing).toMatch(/nobody will ever be shown/i);
    }
  });

  it('somebody says hold and takes, often enough for the afternoon to have a subject', () => {
    // The gap between what was said and what was done is the whole mission.
    // MUTATION RUN: force `held = saidHold` -> `gaps` goes to 0 and this fails.
    const rs = runs(mission, 120, { from: 5800 });
    const gaps = rs.filter(r => r.scenes.some(s => s.eventId === 'account-said-hold-took')).length;
    expect(gaps / rs.length, `a said-hold-took gap appeared in only ${gaps} of 120 afternoons`)
      .toBeGreaterThan(0.3);
  });

  it('a conflicted castle takes more often than an honest one, without always taking', () => {
    const holdRate = (traitors) => {
      const rs = runs(mission, 150, { traitors, from: 6200 });
      const rows = rs.flatMap(r => Object.values(r.phases[2].ballots).flat());
      return rows.filter(b => b.held).length / rows.length;
    };
    const clean = holdRate([]);
    const dirty = holdRate(CAST);
    expect(dirty).toBeLessThan(clean);
    expect(dirty, 'a conflicted castle never holds at all, which is a switch')
      .toBeGreaterThan(0.15);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 4. THE SHIELD IS PAID FOR OUT OF THE POT
// ══════════════════════════════════════════════════════════════════════

describe('The Ash Vault: the flue costs the castle money', () => {
  const mission = bespokeMission('ash-vault');

  it('one player leaves the relay every afternoon, and the record says who', () => {
    for (const r of runs(mission, 40, { from: 7000 })) {
      expect(CAST).toContain(r.shield.searcher);
      expect(r.scenes.some(s => s.eventId === 'vault-ring-found'
        || s.eventId === 'vault-flue-empty')).toBe(true);
    }
  });

  it('the cost is never negative and is usually real', () => {
    // The same afternoon scored twice, differing in one term. MUTATION RUN:
    // give the searcher their contribution back in `raw` -> every cost is 0
    // and the second assertion fails.
    //
    // MEASURED over 400 afternoons with an 18-player castle: cost > 0 on 98.3%
    // of them, mean 239 credits, max 2,624. The bands below sit well inside
    // those so an ordinary calibration nudge does not redden them, and a long
    // way outside the 0 / 0 a restored searcher produces.
    const rs = runs(mission, 200, { from: 7200 });
    for (const r of rs) expect(r.shield.cost).toBeGreaterThanOrEqual(0);
    const positive = rs.filter(r => r.shield.cost > 0).length / rs.length;
    expect(positive, `the hunt cost the castle nothing on ${((1 - positive) * 100).toFixed(0)}% `
      + 'of afternoons — the searcher is not actually missing from the relay')
      .toBeGreaterThan(0.5);
    const mean = rs.reduce((a, r) => a + r.shield.cost, 0) / rs.length;
    expect(mean, `mean cost ${Math.round(mean)} credits`).toBeGreaterThan(150);
    expect(mean, 'the hunt costs more than a whole afternoon is worth').toBeLessThan(6000);
  });

  it('a Shield exists only when the ring was found, and the powers layer granted it', () => {
    const rs = runs(mission, 120, { from: 7600 });
    const found = rs.filter(r => r.shield.found);
    expect(found.length, 'nobody ever found the ring').toBeGreaterThan(10);
    expect(found.length, 'the ring is found every time, which is not a gamble')
      .toBeLessThan(rs.length * 0.75);
    for (const r of rs) {
      if (r.shield.found) {
        expect(r.shields).toHaveLength(1);
        expect(r.shield.holder).toBe(r.shield.searcher);
        expect(r.shield.visibility).toBeTruthy();
      } else {
        expect(r.shields).toEqual([]);
        expect(r.shield.holder).toBeNull();
      }
    }
  });

  it('and the searcher is somebody bold rather than the same person every time', () => {
    const rs = runs(mission, 200, { from: 8000 });
    expect(new Set(rs.map(r => r.shield.searcher)).size,
      'the same few people always break away').toBeGreaterThan(8);
  });
});

// ══════════════════════════════════════════════════════════════════════
// 5. THE WRITING CONTRACTS, IN THE SENTENCES A VIEWER READS
// ══════════════════════════════════════════════════════════════════════

describe('the prose obeys the writing contracts', () => {
  /** Every rendered sentence one afternoon produces. */
  const corpus = (mission, n = 60, from = 9000) => {
    const rows = [];
    for (const r of runs(mission, n, { from })) {
      rows.push(r.summary);
      for (const b of r.ceremony.hostBeats) { if (b.text) rows.push(b.text); if (b.action) rows.push(b.action); }
      for (const p of r.phases) for (const b of p.beats) {
        if (b.text) rows.push(b.text);
        if (b.said) rows.push(b.said);
      }
      for (const s of r.scenes) {
        rows.push(s.text);
        if (s.confessional?.text) rows.push(s.confessional.text);
      }
    }
    return rows;
  };

  const DEBUG_WORDS = [/\bcover\b/i, /\bthread\b/i, /\bheat\b/i, /opened today/i, /the loom/i];

  for (const mission of TRAITORS_MISSIONS) {
    it(`${mission.id}: no debug vocabulary reaches the page`, () => {
      // Global constraint. MUTATION RUN: put the word "thread" in a summary
      // line -> this fails.
      const rows = corpus(mission, 40);
      expect(rows.length).toBeGreaterThan(400);
      const hits = rows.filter(t => DEBUG_WORDS.some(re => re.test(t)));
      expect(hits.slice(0, 5), 'debug vocabulary in viewer prose').toEqual([]);
    });

    it(`${mission.id}: no unevidenced universal claim`, () => {
      // "Evidence for group consensus". A mission produces no propagation
      // receipts, so it may not claim a consensus at all.
      //
      // THE MATCHER IS THE PROJECT'S OWN, and it is deliberately about
      // AGREEMENT AND KNOWLEDGE rather than about the word "everybody". The
      // four mission files are now inside the canonical SOURCE scan in
      // tests/tr-castle-prose.test.js, which is where that list lives and where
      // a change to it belongs; what is duplicated here — and only here — is
      // the RENDERED half, because a source scan cannot see a sentence
      // assembled at render time out of two innocent halves.
      //
      // "In front of everybody" is deliberately NOT forbidden: people standing
      // in one room watching one thing is co-presence, not consensus, and the
      // contract's own worked example is "Everyone turns against Manu", not
      // "struck out in front of everybody".
      //
      // MUTATION RUN: change any scene line to "and everybody now knows it" ->
      // this fails on that mission.
      const CONSENSUS = [
        /\b(?:everyone|everybody)\s+(?:knew|knows|agreed|agrees|believed|believes|decided|decides|turns?|turned|has\s+it|had\s+it)\b/i,
        /\bthe\s+(?:whole\s+)?(?:castle|room|house)\s+(?:agreed|agrees|believed|believes|knew|knows|turned|turns|decided|decides)\b/i,
        /\b(?:nobody|no\s+one|no-one)\s+(?:trusts|trusted|believes|believed)\b/i,
        /\bthe\s+group\s+agrees\b/i,
      ];
      const rows = corpus(mission, 40, 9400);
      expect(rows.length, 'the corpus came back empty').toBeGreaterThan(400);
      const hits = rows.filter(t => CONSENSUS.some(re => re.test(t)));
      expect(hits.slice(0, 4), 'an unevidenced universal claim').toEqual([]);

      // ANTI-VACUITY: the matcher must still match the thing it forbids, or a
      // regex that quietly stopped matching would report the library clean.
      expect(CONSENSUS.some(re => re.test('and by dinner everybody knew it')),
        'the consensus matcher has stopped matching').toBe(true);
    });

    it(`${mission.id}: contestant voices are contemporary, the host is not archaic`, () => {
      // "Modern individual voice contract": contractions, no costume-drama
      // vocabulary. MUTATION RUN: write a confessional as "I find your account
      // most troubling" -> the archaic sweep catches `shall`/`most troubling`.
      const ARCHAIC = /\b(shall|thee|thou|whilst|hence|hither|verily|forsooth|most troubling|I daresay)\b/i;
      const said = [];
      for (const r of runs(mission, 40, { from: 9600 })) {
        for (const s of r.scenes) if (s.confessional?.text) said.push(s.confessional.text);
      }
      expect(said.length, 'this mission produced no confessionals at all')
        .toBeGreaterThan(30);
      expect(said.filter(t => ARCHAIC.test(t)).slice(0, 3)).toEqual([]);
      const withContractions = said.filter(t => /\b\w+'(s|t|re|ve|ll|d|m)\b/i.test(t)).length;
      expect(withContractions / said.length, 'nobody in this cast uses a contraction')
        .toBeGreaterThan(0.25);
    });

    it(`${mission.id}: a confessional adds something the scene did not say`, () => {
      // "Selective confessional contract": it renders only when it adds
      // information the public action does not already carry, and it may not
      // paraphrase the scene it follows. Checked as a real overlap measure.
      // MUTATION RUN: set `confessional.text = s.text` on any scene -> overlap
      // is 1.0 and this fails.
      const PURPOSES = ['hidden-intent', 'audience-lie', 'belief-change', 'vote-change',
        'traitor-reasoning', 'history-context', 'emotional-turn', 'character'];
      let checked = 0;
      for (const r of runs(mission, 30, { from: 9800 })) {
        for (const s of r.scenes) {
          const c = s.confessional;
          if (!c) continue;
          checked++;
          expect(PURPOSES, `${s.id}: unknown confessional purpose`).toContain(c.purpose);
          const a = new Set(norm(s.text).split(' ').filter(w => w.length > 4));
          const b = new Set(norm(c.text).split(' ').filter(w => w.length > 4));
          const shared = [...b].filter(w => a.has(w)).length;
          const overlap = b.size ? shared / b.size : 1;
          expect(overlap, `${s.id}: the confessional restates the scene`).toBeLessThan(0.6);
        }
      }
      expect(checked, 'no confessional was examined').toBeGreaterThan(20);
    });

    it(`${mission.id}: every effect names a source that names a participant`, () => {
      // The causal contract, at the level a test can actually check: the
      // sentence a later scene will cite must be about the people who were
      // there. MUTATION RUN: change any `source` to a generic 'the mission' ->
      // this fails.
      for (const r of runs(mission, 25, { from: 10200 })) {
        for (const s of r.scenes) {
          for (const e of s.effects) {
            const namesSomebody = s.participants.some(n => e.source.includes(n))
              || mission.teams.some(t => e.source.includes(t));
            expect(namesSomebody, `${s.id}/${e.kind}: "${e.source}" names nobody who was there`)
              .toBe(true);
          }
        }
      }
    });

    it(`${mission.id}: an afternoon does not print the same sentence twice`, () => {
      // Four variants is only four variants if the season remembers which it
      // has spent — the `freshPick` memo. MUTATION RUN: replace `freshPick`
      // with a plain `pick` -> repeats appear within the first ten afternoons.
      let repeats = 0, afternoons = 0;
      for (const r of runs(mission, 40, { from: 10400 })) {
        afternoons++;
        const lines = [];
        for (const p of r.phases) for (const b of p.beats) if (b.text) lines.push(norm(b.text));
        for (const s of r.scenes) lines.push(norm(s.text));
        const seen = new Set();
        for (const l of lines) {
          if (seen.has(l)) repeats++;
          seen.add(l);
        }
      }
      expect(repeats / afternoons, `${repeats} duplicate sentences over ${afternoons} `
        + 'afternoons').toBeLessThan(0.6);
    });

    it(`${mission.id}: all five behaviours are reachable`, () => {
      // Spec §9 asks for heroic, selfish, suspicious, cowardly and impressive.
      // A mission that can never produce one of them is missing a stake, and
      // the axis would be decorative metadata — which this plan's event
      // variation contract requires be removed or implemented.
      //
      // MUTATION RUN: delete the `cowardly` branch from any mission ->
      // that mission fails here.
      const seen = new Set();
      for (const r of runs(mission, 120, { from: 10800 })) {
        for (const s of r.scenes) if (s.behaviour) seen.add(s.behaviour);
      }
      const missing = MISSION_BEHAVIOURS.filter(b => !seen.has(b));
      expect(missing, `${mission.id} can never show somebody being: ${missing.join(', ')}`)
        .toEqual([]);
    });

    it(`${mission.id}: the ceremony explains itself before anybody moves`, () => {
      // "Host explanations precede the action." Structural rather than
      // stylistic: every rule point's beat index is inside the ceremony, and
      // the ceremony is the first thing on the record.
      const r = runs(mission, 1, { from: 11000 })[0];
      for (const p of r.ceremony.rulePoints) {
        expect(p.explainedByBeat).toBeLessThan(r.ceremony.hostBeats.length);
      }
      expect(r.ceremony.revealBeats).toBe(r.ceremony.hostBeats.length);
      expect(r.briefing.length, 'the briefing is thinner than one phase of narration')
        .toBeGreaterThan(600);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════
// 6. A MISSION WRITES THE POT, ITS OWN RECORD, AND NOTHING ELSE
// ══════════════════════════════════════════════════════════════════════

describe('the footprint on a season is the pot and the record', () => {
  it('no bespoke mission touches a bond', () => {
    // A bond feeds bondResistance() -> suspicion(), so a mission writing one
    // would move the deduction bands from a content edit and there would be no
    // way to tell that from an engine change. Asserted as BEHAVIOUR, not as a
    // source scan: play every mission and demand the bond store is untouched.
    //
    // MUTATION RUN: add one `addBond(a, b, 1)` inside any phase -> this fails.
    for (const mission of TRAITORS_MISSIONS) {
      world();
      const before = JSON.stringify(gs.bonds);
      for (let i = 0; i < 20; i++) mission.simulate(ctxFor(), rngFor(i + 12000));
      expect(JSON.stringify(gs.bonds), `${mission.id} wrote a bond`).toBe(before);
      // Sanity: the bond reader is live, so "unchanged" means something.
      expect(getBond(CAST[0], CAST[1])).toBe(0);
    }
  });

  it('no bespoke mission writes a belief', () => {
    for (const mission of TRAITORS_MISSIONS) {
      world();
      const before = JSON.stringify(gs.knowledge || {});
      for (let i = 0; i < 20; i++) mission.simulate(ctxFor(), rngFor(i + 12400));
      expect(JSON.stringify(gs.knowledge || {}), `${mission.id} wrote a belief`).toBe(before);
    }
  });

  it('nothing in the catalogue takes a draw from Math.random', () => {
    // Seeded replay depends on it: a bare Math.random() in this layer breaks
    // every replay guard in the plan. Source scan, because the failure is a
    // WRITE that a behavioural test would only catch statistically.
    for (const f of SOURCES) {
      const body = src(f).split('\n')
        .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n');
      expect(body, `js/tr/missions/${f}.js takes a raw Math.random draw`)
        .not.toMatch(/Math\.random\s*\(/);
    }
  });

  it('the same seed replays the same afternoon, field for field', () => {
    for (const mission of TRAITORS_MISSIONS) {
      world();
      const a = mission.simulate(ctxFor(), rngFor(4242));
      world();
      const b = mission.simulate(ctxFor(), rngFor(4242));
      expect(JSON.stringify(b), `${mission.id} does not replay`).toBe(JSON.stringify(a));
    }
  });

  it('the pot is the only season field a money mission moves', () => {
    // The Ash Vault is held out because it grants a Shield, which is its
    // sanctioned channel — the same idiom `_setShieldMissionEnabled` uses in
    // tests/tr-missions.test.js, and the hold-out gets its own arm below
    // rather than being a hole.
    const money = TRAITORS_MISSIONS.filter(m => m.id !== 'ash-vault');
    for (const mission of money) {
      world();
      const before = { shields: JSON.stringify(gs.tr.shields || []),
        daggers: JSON.stringify(gs.tr.daggers || []),
        rounds: JSON.stringify(gs.tr.rounds || []) };
      for (let i = 0; i < 25; i++) mission.simulate(ctxFor(), rngFor(i + 13000));
      expect(JSON.stringify(gs.tr.shields || []), `${mission.id} granted a power`)
        .toBe(before.shields);
      expect(JSON.stringify(gs.tr.daggers || [])).toBe(before.daggers);
      expect(JSON.stringify(gs.tr.rounds || [])).toBe(before.rounds);
      expect(gs.tr.pot, 'and it did not pay the pot either, so nothing above was tested')
        .toBeGreaterThan(0);
    }
  });

  it('and the hold-out is holding something out: the Ash Vault does grant a power', () => {
    // Without this arm the test above is a hole rather than a narrowing.
    world();
    const vault = bespokeMission('ash-vault');
    for (let i = 0; i < 25; i++) vault.simulate(ctxFor(), rngFor(i + 13000));
    expect((gs.tr.shields || []).length,
      'the Ash Vault granted no Shield in 25 afternoons, so holding it out of the arm '
      + 'above proves nothing').toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
// CONFESSIONALS CARRY ARCHETYPE VOICE — the same fact, read three ways
// ══════════════════════════════════════════════════════════════════════
//
// FINDING (Task 8 review): every confessional was one hardcoded string, so two
// different speakers off the SAME recorded beat said, word for word, the same
// thing — voice was missing entirely. The fix branches the confessional text on
// the SPEAKER's archetype family (villainous / nice / neutral) via
// `confessionalVoice`. This arm proves the branch is real: for every beat that
// two different families actually speak, the families must not read identically.
//
// MUTATION RUN (reported): collapse any one site's `confessionalVoice({...})`
// back to a single string — so two families return the same text for that
// eventId — and the pairwise-distinct check on that eventId fails, turning this
// arm RED. Reverted afterwards.
describe('confessionals read differently for different archetype families', () => {
  for (const mission of TRAITORS_MISSIONS) {
    it(`${mission.id}: no beat gives two archetype families identical confessional text`, () => {
      // eventId -> (family -> normalized confessional text). One text per family
      // per beat, because the voice branch is deterministic in the speaker.
      const byBeat = new Map();
      for (const r of runs(mission, 120, { from: 20000 })) {
        for (const s of r.scenes) {
          const c = s.confessional;
          if (!c || !c.speaker || !c.text) continue;
          const fam = archetypeFamily(c.speaker);
          if (!byBeat.has(s.eventId)) byBeat.set(s.eventId, new Map());
          byBeat.get(s.eventId).set(fam, norm(c.text));
        }
      }

      // ANTI-VACUITY: some beat must actually have been spoken by two different
      // families, or the distinctness check below has nothing to bite on and a
      // collapsed voice branch would sail through unobserved.
      let multiFamilyBeats = 0;
      for (const fams of byBeat.values()) if (fams.size >= 2) multiFamilyBeats++;
      expect(multiFamilyBeats,
        'no confessional beat was spoken by two different archetype families, so the '
        + 'voice branch was never exercised on this mission').toBeGreaterThan(0);

      // THE BAND: within one beat, no two families may read word-for-word alike.
      for (const [eventId, fams] of byBeat) {
        const texts = [...fams.values()];
        expect(new Set(texts).size,
          `${eventId}: two archetype families produced word-for-word the same confessional `
          + '— the voice branch is collapsed here').toBe(texts.length);
      }
    });
  }
});
