// Alliances that change shape on The Challenge (alliances.js allianceShifts): a member walks away, or walks away
// for a friend the group is coming for, or defects to another group; two groups merge against a bigger one; a
// group gone cold ends by agreement. The user, 2026-10-16: "do we have alliance removal, one person deciding to
// remove themselves, or they get removed, or an alliance dissolving altogether, and all the variants?"
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { chLedgerRecord } from '../js/ch/ledger-record.js';
import { challengeCast } from './helpers/ch-cast.js';

let runs;
beforeAll(() => {
  runs = Array.from({ length: 24 }, (_, i) => i + 1).map(seed => {
    const { cast, names, background } = challengeCast(24, seed);
    setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed, options: {} });
    airSeason(r.state);
    return { r, record: chLedgerRecord(r.state, r) };
  });
});

const kindOf = s => (s.kind === 'alliance-leave' || s.kind === 'alliance-end' ? `${s.kind}.${s.data.why}` : s.kind);

describe('The Challenge: alliances that change shape', () => {
  it('every way a group changes happens somewhere in two dozen seasons', () => {
    const seen = new Set(runs.flatMap(({ r }) => r.state.scenes.map(kindOf)));
    for (const k of ['alliance-leave.walked', 'alliance-leave.walked-friend', 'alliance-leave.defected', 'alliance-switch',
      'alliance-merge', 'alliance-end.drifted', 'alliance-leave.pushed-out', 'alliance-leave.cut-loose', 'alliance-leave.exposed',
      'alliance-end.betrayal', 'alliance-end.numbers', 'alliance-end.final']) expect(seen.has(k), k).toBe(true);
  });

  it('nobody is taken back into a group they left', () => {
    for (const { r } of runs) for (const al of r.state.alliances) {
      for (const n of al.former || []) {
        if (!r.state.active.includes(n) && !r.state.cast.includes(n)) continue;
        const left = r.state.scenes.find(s => s.kind === 'alliance-leave' && s.who[0] === n && s.data.alliance === al.id);
        if (!left) continue;
        const back = r.state.scenes.find(s => (s.kind === 'alliance-grow' || s.kind === 'alliance-switch') && s.who[1] === n && s.data.alliance === al.id && s.id > left.id);
        expect(back, `${n} back in ${al.name}`).toBeUndefined();
      }
    }
  });

  it('a defector is in the new group, and the ledger counts it as a betrayal of the old leader', () => {
    let n = 0;
    for (const { r, record } of runs) for (const s of r.state.scenes.filter(x => x.kind === 'alliance-leave' && x.data.why === 'defected')) {
      n++;
      const join = r.state.scenes.find(x => x.kind === 'alliance-switch' && x.who[1] === s.who[0] && x.id > s.id);
      expect(join, `${s.who[0]} joined nowhere`).toBeTruthy();
      expect(join.data.from).toBe(s.data.name);
      expect(record.players[s.who[0]].betrayed).toContain(s.who[1]);
    }
    expect(n).toBeGreaterThan(0);
  });

  it('a merge folds one group into the other: ended as merged, its people in the one that kept its name', () => {
    let n = 0;
    for (const { r } of runs) for (const s of r.state.scenes.filter(x => x.kind === 'alliance-merge')) {
      n++;
      const keep = r.state.alliances.find(a => a.id === s.data.alliance);
      const fold = r.state.alliances.find(a => a.name === s.data.from && a.why === 'merged');
      expect(fold, s.data.from).toBeTruthy();
      expect(fold.into).toBe(keep.id);
      expect(fold.ended).toBe(true);
    }
    expect(n).toBeGreaterThan(0);
  });

  it('the new scenes air with every name filled', () => {
    const kinds = new Set();
    for (const { r } of runs) for (const e of r.state.episodes) for (const a of e.aired || []) {
      const k = a.scene ? kindOf(a.scene) : a.kind;
      if (!/walked|defected|alliance-switch|alliance-merge|drifted/.test(k)) continue;
      kinds.add(k);
      const text = (a.script?.lines || []).map(l => l.text).join(' ');
      expect(text, k).not.toMatch(/\{\w+(\.\w+)?\}|undefined/);
      expect(text.length, k).toBeGreaterThan(40);
    }
    expect(kinds.size).toBeGreaterThanOrEqual(5);
  });
});
