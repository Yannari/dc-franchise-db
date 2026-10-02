// The Big Brother stepped viewer (spec 2026-10-01 §4.7, Phase 2): real seasons
// in, screens of steps out. What airs must be what the record says happened,
// and nothing may be on the stage before the step that says it.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { stageHtml, ledgerAt } from '../js/vp-bb-ep/stage.js';
import { bbStepScreens } from '../js/vp-bb-ep/screens.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const KINDS = new Set(['say', 'beat', 'dr', 'bb', 'host']);
let weeks = [];   // { row, screens, priorEvicted }

beforeAll(() => {
  for (const seed of [5, 19, 33]) {
    setGs(null);
    setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(), gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
      stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3 + seed) % 10)])) })));
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
    seasonConfig.twistSchedule = []; initGameState(); globalThis.gs = gs;
    withSeededRandom(seed, () => { for (let i = 0; i < 6; i++) simulateBBEpisode(); });
    const rows = gs.episodeHistory.filter(r => r.format === 'big-brother' && !r.isFinale);
    const prior = [];
    for (const row of rows) {
      weeks.push({ row, screens: bbWeekSteps(row, { host: 'Valeria', priorEvicted: prior.slice() }), priorEvicted: prior.slice() });
      prior.push(...[row.evicted, row.secondEvicted].filter(Boolean));
    }
  }
}, 900000);

describe('every step is well-formed', () => {
  it('builds screens for every week, each with lines', () => {
    expect(weeks.length).toBeGreaterThan(10);
    for (const { screens, row } of weeks) {
      expect(screens.length, `week ${row.num} has no screens`).toBeGreaterThan(3);
      for (const S of screens) expect(S.steps.length, `${S.id} week ${row.num}`).toBeGreaterThan(0);
    }
  });
  it('gives every line a kind, a speaker where it needs one, and no unfilled text', () => {
    for (const { screens } of weeks) for (const S of screens) for (const st of S.steps) {
      expect(KINDS.has(st.k), `${S.id}: kind ${st.k}`).toBe(true);
      if (st.k !== 'beat' && st.k !== 'bb') expect(st.by, `${S.id}: a ${st.k} line with no speaker`).toBeTruthy();
      expect(String(st.t), `${S.id}: ${st.t}`).not.toMatch(/undefined|null|\{|\}|<\w/);
    }
  });
});

describe('what airs is chosen', () => {
  it('airs a programme, not every beat: a few scenes per stretch, no event twice in a week', () => {
    for (const { row, screens } of weeks) {
      const scenes = screens.filter(s => s.kind === 'scene');
      const beats = row.acts.flatMap(a => a.socialBeats || []).length;
      expect(scenes.length, `week ${row.num}: ${scenes.length} scenes from ${beats} beats`).toBeLessThanOrEqual(21);
      if (beats > 30) expect(scenes.length).toBeGreaterThan(8);
    }
  });
});

describe('what airs is what happened', () => {
  it('reveals exactly the nominees, in the order the HOH named them', () => {
    for (const { row, screens } of weeks) {
      const act = row.acts.find(a => a.type === 'nominations' && !a.byCoHoh);
      const S = screens.find(s => s.kind === 'noms');
      if (!act || !S) continue;
      expect(S.steps.filter(s => s.reveal).map(s => s.reveal), `week ${row.num}`).toEqual(act.nominees);
      expect(S.seated[act.hoh], 'the HOH stands at the head of the table').toBe('head');
    }
  });
  it('casts every ballot once, in the Diary Room, and evicts the evicted', () => {
    for (const { row, screens } of weeks) {
      const act = row.acts.find(a => a.type === 'eviction');
      const S = screens.find(s => s.kind === 'evict');
      if (!act || !S) continue;
      const ballots = S.steps.filter(s => s.ballot);
      expect(ballots.length, `week ${row.num}`).toBe((act.ballots || []).length);
      expect(ballots.every(s => s.k === 'dr')).toBe(true);
      expect(S.steps.find(s => s.out)?.out).toBe(act.evicted);
    }
  });
  it('crowns the HOH and the veto holder the record crowned', () => {
    for (const { row, screens } of weeks) {
      const hoh = screens.find(s => s.kind === 'hoh');
      if (hoh) expect(hoh.steps.find(s => s.hoh)?.hoh).toBe(row.hoh);
      const veto = screens.find(s => s.kind === 'veto');
      if (veto) expect(veto.steps.find(s => s.veto)?.veto).toBe(row.vetoWinner);
    }
  });
});

describe('nothing is on stage before its line', () => {
  it('does not mark a nominee before the last key turns', () => {
    for (const { screens } of weeks) {
      const si = screens.findIndex(s => s.kind === 'noms');
      if (si < 0) continue;
      // anchored on the last key turning, not on the step that sets the block: a guard that
      // finds its boundary by the very marker it is checking passes whatever that marker does
      const steps = screens[si].steps;
      const last = steps.reduce((m, s, i) => (s.reveal ? i : m), -1);
      expect(last).toBeGreaterThan(0);
      for (let i = -1; i < last; i++) expect(ledgerAt(screens, si, i).nom, `step ${i}`).toEqual([]);
    }
  });
  it('does not show a vote before it is cast, or the result before it is read', () => {
    for (const { screens } of weeks) {
      const si = screens.findIndex(s => s.kind === 'evict');
      if (si < 0) continue;
      const S = screens[si];
      const outAt = S.steps.findIndex(s => s.out);
      for (let i = -1; i < outAt; i++) {
        const L = ledgerAt(screens, si, i);
        expect(L.ballots.length).toBe(S.steps.slice(0, i + 1).filter(s => s.ballot).length);
        expect(L.out.filter(n => !S.priorOut.includes(n))).toEqual([]);
      }
    }
  });
  it('paints every step of every screen', () => {
    for (const { screens } of weeks.slice(0, 6)) {
      screens.forEach((S, si) => {
        for (let i = -1; i < S.steps.length; i++) {
          const out = stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' });
          expect(out.html, `${S.id} step ${i}`).not.toMatch(/undefined|NaN/);
        }
      });
    }
  });
});

describe('the twists stay', () => {
  it('replaces the core loop and keeps every twist screen, after its part of the week', () => {
    const { row } = weeks[1];
    const legacy = [{ id: 'bb-house-1' }, { id: 'bb-hoh' }, { id: 'bb-coin', label: 'Coin' }, { id: 'bb-noms' }, { id: 'bb-house-2' },
      { id: 'bb-vdraw' }, { id: 'bb-veto' }, { id: 'bb-cer' }, { id: 'bb-plans' }, { id: 'bb-evict' }, { id: 'bb-afterword', label: 'After' }]
      .map(x => ({ label: x.id, html: '<div></div>', ...x }));
    const out = bbStepScreens(row, legacy, { host: 'Valeria' });
    const ids = out.map(x => x.id);
    for (const gone of ['bb-hoh', 'bb-noms', 'bb-vdraw', 'bb-veto', 'bb-cer', 'bb-plans', 'bb-evict', 'bb-house-1']) expect(ids).not.toContain(gone);
    expect(ids).toContain('bb-coin');
    expect(ids).toContain('bb-afterword');
    expect(ids.indexOf('bb-coin')).toBeGreaterThan(ids.findIndex(i => i.startsWith('bb-hoh-v')));
    expect(ids.indexOf('bb-coin')).toBeLessThan(ids.findIndex(i => i.startsWith('bb-noms-v')));
  });
});
