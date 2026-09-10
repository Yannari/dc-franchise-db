// @vitest-environment jsdom
// ══════════════════════════════════════════════════════════════════════
// dr-rigga.test.js — the night the show looks rigged
// ══════════════════════════════════════════════════════════════════════
//
// `trackPull` normally pushes a repeat winner DOWN: the host lifts the queen
// who needs a moment, and somebody who won last week does not. That brake is
// what keeps the top queen's share of maxi wins where it is.
//
// The exception is the specific night the real show gets accused of rigging,
// and it is not a favourite being saved from the bottom — it is a favourite
// taking a win the room can see somebody else earned. The brake comes off,
// still inside the host's existing two-place allowance, and it costs her.
import { describe, expect, it } from 'vitest';
import { playDragSeason } from '../js/dr/season.js';
import { rngFor } from '../js/dr/rng.js';

const STATS = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const ARCH = ['villain','hero','floater','wildcard','goat','schemer','social-butterfly','mastermind','underdog','perceptive-player'];
const cast = (n, seed) => {
  const rng = rngFor(seed); const r = () => 1 + Math.floor(rng() * 10);
  return Array.from({ length: n }, (_, i) => ({
    name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', archetype: ARCH[i % ARCH.length], age: 21 + i,
    stats: Object.fromEntries(STATS.map(k => [k, r()])),
    drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
  }));
};
const season = s => playDragSeason({ cast: cast(12, 400 + s), seed: s, config: { drFinale: 'top4' } });

/* A seed that fires. It is a FIXTURE, not a fact about the mechanic: adding
   the watchability ledger moved every season, so seed 5 stopped firing and
   these tests went red for the right reason. The message on the first
   assertion says how to replace it. Firing seeds at the time of writing:
   16, 32, 47, 48, 52, 61, 71, 76, 78, 81 -- about 13% of seasons. */
const FIRING_SEED = 16;

describe('a host overrule the room can see', () => {
  it('gives the win to the favourite over the queen the panel put first', () => {
    const row = season(FIRING_SEED).rows.find(r => r.dr?.rigga);
    expect(row, `seed ${FIRING_SEED} no longer fires — run the audit and pick another`).toBeTruthy();
    const g = row.dr.rigga;
    // The two halves that make it a robbery rather than a close call.
    expect(row.dr.panel.ranking[0].name).toBe(g.over);
    expect(row.dr.call.win).toContain(g.queen);
    expect(g.queen).not.toBe(g.over);
  });

  it('says it out loud, in this universe words', () => {
    /* A bend nobody can see is a number moving; the accusation IS the event.
       And the fandom's name for this night is built on a real person's, which
       this universe does not do — see the note on `robbed` in js/dr/arcs.js. */
    const row = season(FIRING_SEED).rows.find(r => r.dr?.rigga);
    const sc = (row.dr.scenes || []).find(x => x.kind === 'host-overrule');
    expect(sc, 'the overrule reached no screen').toBeTruthy();
    expect(sc.text.length).toBeGreaterThan(40);
    expect(sc.text).toContain(row.dr.rigga.over);
    expect(sc.text).toContain(row.dr.rigga.queen);
    expect(sc.text).not.toMatch(/rigga|rigor/i);
  });

  it('costs her, and pays the queen she passed', () => {
    // Popularity feeds star (js/dr/state.js), so this is the feedback that
    // stops the mechanic pointing at the same queen for the rest of the run.
    const rows = season(FIRING_SEED).rows;
    const i = rows.findIndex(r => r.dr?.rigga);
    const g = rows[i].dr.rigga;
    const before = rows[i - 1].dr.popularity;
    const after = rows[i].dr.popularity;
    expect(after[g.over] - before[g.over], 'the robbed queen was not adopted')
      .toBeGreaterThan(0);
    expect(after[g.queen] - before[g.queen])
      .toBeLessThan(after[g.over] - before[g.over]);
  });

  it('happens at most once a season', () => {
    let seasons = 0; let fired = 0; let twice = 0;
    for (let s = 0; s < 60; s++) {
      const out = season(s); seasons++;
      const hits = out.rows.filter(r => r.dr?.rigga).length;
      if (hits) fired++;
      if (hits > 1) twice++;
    }
    expect(twice, 'the once-a-season cap leaked').toBe(0);
    // Rare, and REACHABLE — the first build of this fired 0% of the time
    // across 500 seasons because one gate could not be satisfied.
    expect(fired, 'the overrule has become unreachable again').toBeGreaterThan(0);
    expect(fired / seasons, 'the host is bending every other season').toBeLessThan(0.3);
  });

  it('is null on an ordinary night — the control arm', () => {
    const rows = season(FIRING_SEED).rows;
    const ordinary = rows.filter(r => r.dr && !r.dr.rigga);
    expect(ordinary.length).toBeGreaterThan(5);
    for (const r of ordinary) expect(r.dr.rigga ?? null).toBe(null);
  });
});
