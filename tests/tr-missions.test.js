// ══════════════════════════════════════════════════════════════════════
// tr-missions.test.js — the money, and the three things it must never buy
// ══════════════════════════════════════════════════════════════════════
//
// Spec 7.2: a mission pays a SHARED POT and nothing else. The pot has a
// ceiling and seasons are meant to fall short of it, because the sting of the
// format is a Faithful grinding all season for money two murderers will walk
// off with — and that sting only exists while the pot is a gamble rather than
// a formality with a fixed payout.
//
// The three guards, in the order they matter:
//
//   1. A MISSION BUYS NOTHING BUT MONEY. Every season below is played TWICE,
//      missions on and missions off, and the banishment/murder/recruitment log
//      must come back bit-identical. This is the honest form of "missions never
//      grant immunity": not a scan for a field called `immunity`, but proof
//      that removing missions entirely does not change one thing about who
//      lived, who died and who the room banished. A shield, a save, a nudge to
//      a ballot, a belief — any of them breaks it.
//   2. THE CEILING IS REAL. Asserted over a population, and asserted at the
//      boundary with a mission that wins more than the headroom left.
//   3. NO BELIEFS AT ALL. `learn` is spied for every importer in this file's
//      graph and not one call may originate in js/tr/missions.js, plus a
//      source scan so it fails at the moment the import is typed. A later task
//      adds ONE archetype that emits `deduced`/`rumor` evidence and will have
//      to narrow guard 3 deliberately, which is the point of writing it as a
//      rule rather than as a hope.
//
// FILENAME: deliberately not *-audit.test.js — vitest.config.js excludes that
// pattern from `npm test`. Collection verified by running `npx vitest list`.
import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The spy is GATED, and the gate is not a nicety. Capturing a stack on every
// learn() call across the ~400 seasons this file plays costs about two
// minutes of wall clock and grows an array of several hundred thousand
// strings; only the belief guard needs the stacks, so only it turns capture
// on. Left ungated this file was 150s on its own.
const { learnStacks, capture } = vi.hoisted(() => ({ learnStacks: [], capture: { on: false } }));

vi.mock('../js/knowledge.js', async (importOriginal) => {
  const orig = await importOriginal();
  return {
    ...orig,
    learn: (...args) => {
      if (capture.on) learnStacks.push(new Error('learn-call-site').stack || '');
      return orig.learn(...args);
    },
  };
});

import { gs, setGs, setPlayers } from '../js/core.js';
import { initTraitorsState } from '../js/tr/state.js';
import { playTraitorsSeason, rngFor } from '../js/tr/headless.js';
import { runMission, POT_CEILING, MISSION_IDS, _setMissionsEnabled } from '../js/tr/missions.js';
import roster from '../franchise_roster.json';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

/** A roster of the same twenty people with every stat pinned. For the scaling arm. */
function flatRoster(v) {
  return ROSTER.map(p => ({ ...p, stats: Object.fromEntries(
    Object.keys(p.stats || {}).length
      ? Object.keys(p.stats).map(k => [k, v])
      : ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty',
        'boldness', 'intuition', 'temperament'].map(k => [k, v]),
  ) }));
}

/** A bare world with a living cast, for running one mission in isolation. */
function soloWorld() {
  setGs({ bonds: {}, activePlayers: [...CAST] });
  gs.tr = initTraitorsState();
  gs.tr.potCeiling = POT_CEILING;
}

function seasons(n, opts = {}) {
  setPlayers(ROSTER);
  return Array.from({ length: n }, (_, i) =>
    playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i + 1, ...opts }));
}

describe('missions fund a pot, and fund nothing else', () => {
  it('a season accumulates pot money across rounds, mission by mission', () => {
    const runs = seasons(12);
    for (const s of runs) {
      expect(s.missions.length, 'a season runs a mission a round').toBeGreaterThanOrEqual(3);
      expect(s.pot).toBeGreaterThan(0);

      // The pot IS the missions. Nothing else may ever pay into it.
      const summed = s.missions.reduce((a, m) => a + m.earned, 0);
      expect(summed).toBe(s.pot);

      // And it accumulates in order: each record's potAfter is the running
      // total at the moment it ran, which is what the VP will read back.
      let running = 0;
      for (const m of s.missions) {
        running += m.earned;
        expect(m.potAfter).toBe(running);
        expect(m.earned).toBeGreaterThanOrEqual(0);
      }

      // Teams come out of the LIVING, are disjoint, and cover the field.
      for (const m of s.missions) {
        expect(m.teams).toHaveLength(2);
        const all = m.teams.flatMap(t => t.members);
        expect(new Set(all).size).toBe(all.length);
        expect(m.teams.every(t => t.members.length > 0)).toBe(true);
        expect(all.every(n => CAST.includes(n))).toBe(true);
      }
    }
  });

  it('the pot never exceeds POT_CEILING, and stays well short of it', () => {
    const runs = seasons(200);
    const fr = runs.map(s => s.pot / POT_CEILING).sort((a, b) => a - b);
    expect(fr[fr.length - 1]).toBeLessThanOrEqual(1);

    // WHAT THIS ARM CAN AND CANNOT DO, because the mutation was run and the
    // answer was not the flattering one. Deleting the cap in runMission does
    // NOT turn this assertion red: measured over ten decorrelated 200-season
    // blocks, no season in 2,000 ever earns enough to reach the ceiling in the
    // first place (best 0.861 of it), so there is nothing here for the cap to
    // truncate. The cap's failability lives in the boundary test below, which
    // starts a mission 100 short of the ceiling. This arm's job is the OTHER
    // half of spec 7.2 — that seasons fall short — and that is what it asserts.
    //
    // The two bands are chosen off the block measurements, not off one run:
    //   mean       0.512, sd 0.0071 across ten blocks -> 0.62 is ~15 sd clear
    //   95th pct   0.679, sd 0.011  across ten blocks -> 0.60 is ~7 sd clear
    // The obvious statistic — the block MAXIMUM — was measured first and
    // rejected: 0.807 mean but sd 0.038 with a low block of 0.731, so a
    // threshold anywhere useful is a coin flip on block noise.
    const mean = fr.reduce((a, b) => a + b, 0) / fr.length;
    expect(mean, 'seasons must fall well short of the ceiling on average')
      .toBeLessThan(0.62);
    expect(fr[Math.floor(0.95 * (fr.length - 1))],
      'but the top of the distribution must get within reach of it')
      .toBeGreaterThan(0.60);
    expect(runs.filter(s => s.pot >= POT_CEILING).length,
      'maxing the pot must be rare — measured 0 in 2,000 seasons').toBeLessThanOrEqual(2);
  });

  it('a mission that wins more than the headroom banks only the headroom', () => {
    setPlayers(flatRoster(9));
    soloWorld();
    gs.tr.pot = POT_CEILING - 100;
    const m = runMission(4, rngFor(7));
    expect(m.gross, 'a full-strength cast must out-earn the headroom for this to test anything')
      .toBeGreaterThan(100);
    expect(m.earned).toBe(100);
    expect(gs.tr.pot).toBe(POT_CEILING);
    expect(m.potAfter).toBe(POT_CEILING);

    // And a mission run on a full pot earns nothing at all.
    const after = runMission(5, rngFor(8));
    expect(after.earned).toBe(0);
    expect(gs.tr.pot).toBe(POT_CEILING);
  });

  it('a season does not run the same mission twice in a row, and uses at least three', () => {
    const runs = seasons(30);
    const seen = new Set();
    for (const s of runs) {
      for (let i = 1; i < s.missions.length; i++) {
        expect(s.missions[i].id, `${s.missions[i].id} repeated back to back`)
          .not.toBe(s.missions[i - 1].id);
      }
      s.missions.forEach(m => seen.add(m.id));
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
    expect([...seen].every(id => MISSION_IDS.includes(id))).toBe(true);
  });

  it('earnings scale with how the teams performed', () => {
    // Same seeds, same archetype rotation, same team shuffle — only the stats
    // of the people doing it change. The separation is total rather than
    // statistical (the weakest run of the strong cast beats the strongest run
    // of the weak one by a wide margin), so there is no sampling question to
    // answer here.
    const earn = (v) => {
      setPlayers(flatRoster(v));
      return Array.from({ length: 40 }, (_, i) => {
        soloWorld();
        return runMission(3, rngFor(i + 1)).earned;
      });
    };
    const weak = earn(2), mid = earn(5), strong = earn(9);
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    expect(mean(weak)).toBeLessThan(mean(mid));
    expect(mean(mid)).toBeLessThan(mean(strong));
    expect(Math.max(...weak)).toBeLessThan(Math.min(...strong));
  });
});

describe('a mission grants NOTHING but money', () => {
  it('40 seasons are bit-identical with missions on and missions off', () => {
    // THE IMMUNITY GUARD. If a mission could shield anybody from a murder,
    // save anybody at a table, nudge a ballot or write a single belief, the
    // two arms would diverge somewhere in forty seasons. They may not.
    const project = (s) => s.log.map(r => [
      r.ep, r.banished, r.wasTraitor, r.murdered, r.murderTarget, r.blocked,
      r.executed, r.recruited?.target ?? null, r.recruited?.accepted ?? null,
      // The castle stream too: the mission must not displace a single
      // pickEvent() draw either, which is what its own rng exists for.
      (r.castleEvents || []).map(e => e.id).join(','),
    ].join('|')).join('\n') + `\n${s.winner}|${s.survivors.join(',')}`;

    const on = seasons(40).map(project);
    let off;
    try {
      _setMissionsEnabled(false);
      off = seasons(40).map(project);
    } finally {
      _setMissionsEnabled(true);
    }
    for (let i = 0; i < on.length; i++) {
      expect(off[i], `season ${i + 1} diverged when missions were switched off`).toBe(on[i]);
    }

    // Guard on the guard: the arms must differ in the ONE place they should.
    const potsOn = seasons(5).map(s => s.pot);
    try {
      _setMissionsEnabled(false);
      expect(seasons(5).map(s => s.pot)).toEqual([0, 0, 0, 0, 0]);
    } finally { _setMissionsEnabled(true); }
    expect(potsOn.every(p => p > 0)).toBe(true);
  });

  it('no mission record carries an immunity-shaped field', () => {
    const bad = /immun|shield|protect|save[ds]?$|safe/i;
    const walk = (v, trail) => {
      if (!v || typeof v !== 'object') return;
      for (const k of Object.keys(v)) {
        expect(bad.test(k), `${trail}.${k} looks like immunity`).toBe(false);
        walk(v[k], `${trail}.${k}`);
      }
    };
    seasons(8).forEach(s => s.missions.forEach(m => walk(m, m.id)));
  });
});

describe('missions write ZERO beliefs', () => {
  const BACKSLASH = String.fromCharCode(92);
  const hasMissionFrame = st =>
    st.split(BACKSLASH).join('/').includes('/js/tr/missions.js');

  it('no learn() call in 20 real seasons originates inside js/tr/missions.js', () => {
    const prev = Error.stackTraceLimit;
    Error.stackTraceLimit = 10;
    learnStacks.length = 0;
    capture.on = true;
    try {
      setPlayers(ROSTER);
      for (let i = 1; i <= 20; i++) playTraitorsSeason({ cast: CAST, traitorCount: 3, seed: i });
    } finally { Error.stackTraceLimit = prev; capture.on = false; }

    // Guard on the guard: the spy must be catching the layers that ARE
    // allowed to write beliefs, or its silence about missions means nothing.
    expect(learnStacks.length, 'the learn spy caught nothing at all').toBeGreaterThan(100);
    const leaks = learnStacks.filter(hasMissionFrame);
    expect(leaks.length, leaks[0] || '').toBe(0);
  });

  it('js/tr/missions.js does not import the knowledge layer at all', () => {
    const HERE = path.dirname(fileURLToPath(import.meta.url));
    const src = fs.readFileSync(path.join(HERE, '..', 'js', 'tr', 'missions.js'), 'utf8');
    expect(/knowledge\.js/.test(src), 'missions.js reaches for js/knowledge.js').toBe(false);
  });
});
