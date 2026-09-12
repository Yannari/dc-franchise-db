// ══════════════════════════════════════════════════════════════════════
// dr-critiques.test.js — the panel disagrees, and reactions cost something
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { critiqueLines, runReactions, whoShouldGoHome, rateAQueen } from '../js/dr/critiques.js';
import { JUDGES } from '../js/dr/data/judges.js';
import { rngFor } from '../js/dr/rng.js';
import { initDragState } from '../js/dr/state.js';
import { runDragWeek } from '../js/dr/week.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const mk = (name, stats = {}) => ({
  name, archetype: 'hero', stats: { ...Object.fromEntries(STATS.map(k => [k, 5])), ...stats },
  drag: { acting: 5, comedy: 5, dance: 5, design: 5, runway: 5, lipsync: 5, singing: 5 },
});
const NAMES = ['Ada', 'Bee', 'Cleo', 'Dot'];
const players = Object.fromEntries(NAMES.map(n => [n, mk(n)]));
const call = { win: ['Ada'], high: ['Bee'], safe: [], low: ['Cleo'], bottom: ['Dot'] };
const entries = NAMES.map((n, i) => ({
  name: n, style: 'comedy', perf: 9 - i * 2, runway: 5 + i, risk: 0.5, polish: 5,
}));

describe('critiqueLines', () => {
  const panel = JUDGES.slice(0, 3);
  // Judge two ranks the room in the opposite order to the other two.
  const views = Object.fromEntries(panel.map((j, k) => [j.id,
    NAMES.map((n, i) => ({ name: n, view: (k === 1 ? i : 3 - i) * 2, rank: i + 1 }))]));

  it('gives one line per judge per queen on the stage', () => {
    const lines = critiqueLines({ panel, views, call, entries, rng: rngFor(1) });
    expect(lines.length).toBe(panel.length * 4);
    for (const l of lines) {
      expect(['praise', 'mixed', 'pan']).toContain(l.tone);
      expect(l.judgeName, 'a critique with no judge name').toBeTruthy();
      expect(l.reasons.length).toBeGreaterThan(0);
    }
  });

  it('THE PANEL DISAGREES, because tone comes from each judge view', () => {
    // The bug this replaced: tone was read off the CALL, so every judge said
    // the same thing and the panel might as well have been one person.
    const lines = critiqueLines({ panel, views, call, entries, rng: rngFor(1) });
    const aboutAda = lines.filter(l => l.queen === 'Ada');
    const tones = new Set(aboutAda.map(l => l.tone));
    expect(tones.size, 'every judge said the same thing about her').toBeGreaterThan(1);
  });

  it('a judge never cites a term she does not care about', () => {
    // A panel where everybody mentions everything has no personalities in it.
    const lines = critiqueLines({ panel, views, call, entries, rng: rngFor(1) });
    for (const l of lines) {
      const j = panel.find(x => x.id === l.judge);
      for (const r of l.reasons) {
        expect(j.taste[r], `${j.id} cited ${r} and weights it ${j.taste[r]}`)
          .toBeGreaterThanOrEqual(0.1);
      }
    }
  });
});

describe('runReactions', () => {
  it('a reaction now COSTS something', () => {
    const { events } = runReactions({
      reactions: { Ada: 'joy', Bee: 'crash-out', Cleo: 'idgaf' }, state: {},
    });
    const by = Object.fromEntries(events.map(e => [e.players[0], e]));
    expect(by.Ada.pop.Ada).toBeGreaterThan(0);
    expect(by.Bee.pop.Bee).toBeLessThan(0);
    expect(by.Cleo.pop.Cleo).toBeLessThan(0);
    expect(by.Bee.state['crashedOut:Bee']).toBe(true);
  });

  it('blowing up at the panel is the only one the judges carry into next week', () => {
    const state = { memory: { rupaul: {}, michelle: {} } };
    runReactions({ reactions: { Ada: 'blow-up' }, state });
    expect(state.memory.rupaul.Ada).toBeLessThan(0);
    expect(state.memory.michelle.Ada).toBeLessThan(0);

    const other = { memory: { rupaul: {} } };
    runReactions({ reactions: { Ada: 'crash-out' }, state: other });
    expect(other.memory.rupaul.Ada, 'a crash-out should not follow her').toBeUndefined();
  });

  it('does not invent a consequence for a reaction that has none', () => {
    // Sadness moves no number, and manufacturing one so it can be an "event"
    // would be the cosmetic problem in reverse.
    const { events } = runReactions({ reactions: { Ada: 'sadness' }, state: {} });
    expect(events).toEqual([]);
  });
});

describe('who should go home', () => {
  const bonds = { 'Ada|Bee': 8, 'Ada|Dot': -8 };
  const bond = (a, b) => bonds[[a, b].sort().join('|')] || 0;

  /* ── A VOTE IS A NAME AND A REASON ──
     These three used to assert the old design: a schemer named the biggest
     threat, everybody else named the lowest bond, and a loyal queen in the
     bottom always named herself. That was two reasons and a certainty.

     The real show gives a small vocabulary of reasons -- 129 answers counted
     off the fandom's own Contestant/Choice/Reason table by
     tools/dr-real-who-should-go.py -- of which "her performance in the
     challenge" is the commonest, "she is my biggest competition" is about a
     fifth, and naming yourself is 3%. The reason is drawn first and the name
     follows from it. */
  it('everybody names somebody, and says what it is about', () => {
    const { votes } = whoShouldGoHome({ living: NAMES, players, bond, state: {}, rng: rngFor(1) });
    expect(Object.keys(votes).length).toBe(4);
    for (const v of Object.values(votes)) {
      expect(NAMES, 'named somebody who is not in the room').toContain(v.target);
      expect(v.reason, `${v.target} was named for no stated reason`).toBeTruthy();
    }
  });

  it('names the biggest threat when that is the reason', () => {
    // Bee has the record. When a queen answers on competition, it is Bee --
    // and it is one reason among several rather than a schemer's rule.
    const state = { record: { Bee: ['WIN', 'WIN', 'HIGH'], Dot: [], Ada: [], Cleo: [] } };
    let sawThreat = false;
    for (let seed = 1; seed < 60; seed++) {
      const out = whoShouldGoHome({ living: NAMES, players, bond, state, rng: rngFor(seed) });
      for (const [voter, v] of Object.entries(out.votes)) {
        if (v.reason !== 'threat') continue;
        // Bee cannot name herself, so when SHE answers on competition she
        // names the best of the rest. Everybody else names Bee.
        if (voter === 'Bee') continue;
        sawThreat = true;
        expect(v.target, 'answered on competition and did not name the front-runner')
          .toBe('Bee');
      }
    }
    expect(sawThreat, 'nobody ever answers on competition').toBe(true);
  });

  it('lets a loyal queen name herself, and keeps it rare', () => {
    /* 4 of 129 on the real show. It used to fire every time a loyal queen was
       in the bottom, which is most weeks for somebody. */
    const p = { ...players, Cleo: mk('Cleo', { loyalty: 10 }) };
    const state = { record: { Cleo: ['SAFE', 'BTM'] } };
    let herself = 0;
    const runs = 80;
    for (let seed = 1; seed <= runs; seed++) {
      const out = whoShouldGoHome({ living: NAMES, players: p, bond, state, rng: rngFor(seed) });
      if (out.votes.Cleo?.target === 'Cleo') {
        herself++;
        expect(out.votes.Cleo.reason).toBe('herself');
        expect(out.events.find(e => e.type === 'named-herself').pop.Cleo)
          .toBeGreaterThan(0);
      }
    }
    expect(herself, 'a loyal queen in the bottom never names herself')
      .toBeGreaterThan(0);
    expect(herself / runs, 'she falls on her sword every single week')
      .toBeLessThan(0.5);
  });

  it('naming a friend costs the namer; every naming costs a bond', () => {
    const p = { ...players, Ada: mk('Ada', { strategic: 9, loyalty: 2 }) };
    const state = { record: { Bee: ['WIN', 'WIN'], Dot: [] } };
    const out = whoShouldGoHome({ living: NAMES, players: p, bond, state, rng: rngFor(1) });
    const friendly = out.events.find(e => e.players[0] === 'Ada' && e.players[1] === 'Bee');
    expect(friendly.pop.Ada, 'naming a friend should cost her').toBeLessThan(0);
    for (const e of out.events.filter(x => x.type === 'named-her')) {
      expect(e.bond[0][2]).toBeLessThan(0);
    }
  });
});

describe('rate a queen', () => {
  const bond = (a, b) => ([a, b].sort().join('|') === 'Ada|Bee' ? 9 : -4);

  it('everybody rates everybody but herself, inside the scale', () => {
    const { grid, mean } = rateAQueen({ living: NAMES, players, bond, state: {}, rng: rngFor(1) });
    for (const n of NAMES) {
      expect(grid[n][n], `${n} rated herself`).toBeUndefined();
      for (const o of NAMES.filter(x => x !== n)) {
        expect(grid[n][o]).toBeGreaterThanOrEqual(1);
        expect(grid[n][o]).toBeLessThanOrEqual(10);
      }
      expect(mean[n]).toBeGreaterThan(0);
    }
  });

  it('a track record moves the room, not only how they feel about her', () => {
    const flat = rateAQueen({ living: NAMES, players, bond: () => 0, state: {}, rng: rngFor(2) });
    const won = rateAQueen({
      living: NAMES, players, bond: () => 0,
      state: { record: { Cleo: ['WIN', 'WIN', 'HIGH'] } }, rng: rngFor(2),
    });
    expect(won.mean.Cleo).toBeGreaterThan(flat.mean.Cleo);
  });

  it('the top and bottom of the room both feel it', () => {
    const { events } = rateAQueen({ living: NAMES, players, bond, state: {}, rng: rngFor(1) });
    const hi = events.find(e => e.type === 'rated-highest');
    const lo = events.find(e => e.type === 'rated-lowest');
    expect(hi.pop[hi.players[0]]).toBeGreaterThan(0);
    expect(lo.pop[lo.players[0]]).toBeLessThan(0);
  });
});

describe('the panel reaches the screen', () => {
  // An integration check, because critiqueLines was computed correctly and
  // narrated by nobody for a whole commit: the renderer was still tiering
  // critiques by the CALL, which is the thing critiqueLines replaced.
  const S = STATS;

  function week(seed) {
    const r0 = rngFor(seed);
    const r = () => 1 + Math.floor(r0() * 10);
    const c = Array.from({ length: 10 }, (_, i) => ({
      name: `Queen${i + 1}`, slug: `q${i}`, gender: 'f',
      archetype: i % 2 ? 'villain' : 'hero', age: 22 + i,
      stats: Object.fromEntries(S.map(k => [k, r()])),
      drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
    }));
    const st = initDragState({ cast: c, seed, rng: rngFor(seed) });
    return runDragWeek(st, {
      num: 5, maxiId: 'acting', miniId: 'reading', rotatingId: 'ross', guest: null,
      songTitle: 'Toxic', judgeWeights: {}, immunity: false, totalEpisodes: 10,
      allowDoubleShantay: false, allowDoubleSashay: false,
    }, {
      rng: rngFor(seed + 500), players: Object.fromEntries(c.map(p => [p.name, p])),
      bond: () => 0, addBond: () => {}, popDelta: () => {},
    });
  }

  it('critiques on the row are narrated, with the judge named', () => {
    const scenes = week(9).dr.scenes.filter(s => s.kind === 'stage:critique');
    expect(scenes.length, 'no critique reached a scene').toBeGreaterThan(3);
    for (const sc of scenes) {
      expect(['praise', 'mixed', 'pan']).toContain(sc.data.tier);
      expect(sc.data.judge, 'a critique with no judge').toBeTruthy();
      expect(sc.text.length).toBeGreaterThan(50);
    }
  });

  it('THE PANEL VISIBLY DISAGREES, on about a quarter of critiqued queens', () => {
    // Measured over 300: 24.7%. The floor guards against the selection rule
    // silently collapsing back to one opinion per queen.
    let queens = 0;
    let split = 0;
    const tones = {};
    for (let s = 0; s < 60; s++) {
      const byQ = {};
      for (const sc of week(s).dr.scenes) {
        if (sc.kind !== 'stage:critique') continue;
        (byQ[sc.data.players[0]] ||= []).push(sc.data.tier);
        tones[sc.data.tier] = (tones[sc.data.tier] || 0) + 1;
      }
      for (const list of Object.values(byQ)) {
        queens++;
        if (new Set(list).size > 1) split++;
      }
    }
    expect(queens).toBeGreaterThan(200);
    expect(split / queens, 'the panel never disagrees').toBeGreaterThan(0.12);
    // And every tone is reachable. Selecting the two most opinionated judges
    // used to make `mixed` nearly impossible by construction.
    for (const t of ['praise', 'mixed', 'pan']) {
      expect(tones[t], `tone "${t}" never fired`).toBeGreaterThan(20);
    }
  });
});
