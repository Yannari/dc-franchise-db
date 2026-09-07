// ══════════════════════════════════════════════════════════════════════
// dr-critiques.test.js — the panel disagrees, and reactions cost something
// ══════════════════════════════════════════════════════════════════════
import { describe, expect, it } from 'vitest';
import { critiqueLines, runReactions, whoShouldGoHome, rateAQueen } from '../js/dr/critiques.js';
import { JUDGES } from '../js/dr/data/judges.js';
import { rngFor } from '../js/dr/rng.js';

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

  it('everybody names somebody', () => {
    const { votes } = whoShouldGoHome({ living: NAMES, players, bond, state: {}, rng: rngFor(1) });
    expect(Object.keys(votes).length).toBe(4);
    for (const t of Object.values(votes)) expect(NAMES).toContain(t);
    expect(votes.Ada, 'she should name the one she likes least').toBe('Dot');
  });

  it('a loyal queen in the bottom names herself', () => {
    const p = { ...players, Cleo: mk('Cleo', { loyalty: 10 }) };
    const state = { record: { Cleo: ['SAFE', 'BTM'] } };
    const out = whoShouldGoHome({ living: NAMES, players: p, bond, state, rng: rngFor(1) });
    expect(out.votes.Cleo).toBe('Cleo');
    expect(out.events.find(e => e.type === 'named-herself').pop.Cleo).toBeGreaterThan(0);
  });

  it('a schemer names the biggest threat instead of her enemy', () => {
    const p = { ...players, Ada: mk('Ada', { strategic: 9, loyalty: 2 }) };
    const state = { record: { Bee: ['WIN', 'WIN', 'HIGH'], Dot: [] } };
    const out = whoShouldGoHome({ living: NAMES, players: p, bond, state, rng: rngFor(1) });
    // Bee is her closest friend AND the biggest threat. The schemer says Bee.
    expect(out.votes.Ada).toBe('Bee');
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
