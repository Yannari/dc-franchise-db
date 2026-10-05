// The Big Brother stepped viewer (spec 2026-10-01 §4.7, Phase 2): real seasons
// in, screens of steps out. What airs must be what the record says happened,
// and nothing may be on the stage before the step that says it.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode, runBBFinale } from '../js/bb-run.js';
import { bbWeekSteps, conversationsOf, withSetups } from '../js/vp-bb-ep/steps.js';
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
  it('airs a programme, not every beat: a few scenes per stretch, no event twice in a week (the Scenes view)', () => {
    for (const { row } of weeks) {
      const scenes = bbWeekSteps(row, { houseLife: 'scenes' }).filter(s => s.kind === 'scene');
      const beats = row.acts.flatMap(a => a.socialBeats || []).length;
      expect(scenes.length, `week ${row.num}: ${scenes.length} scenes from ${beats} beats`).toBeLessThanOrEqual(21);
      if (beats > 30) expect(scenes.length).toBeGreaterThan(8);
    }
  });

  it('airs house life as one segment per stretch, with no beat twice and nobody staged who does not speak', () => {
    for (const { row } of weeks) {
      const screens = bbWeekSteps(row, { houseLife: 'segments' });
      const segs = screens.filter(s => s.kind === 'houselife');
      expect(segs.length, `week ${row.num}`).toBeGreaterThan(2);
      expect(segs.length).toBeLessThanOrEqual(7);
      // between two ceremonies there is never more than one House Life screen
      screens.forEach((s, i) => { if (s.kind === 'houselife') expect(screens[i + 1]?.kind).not.toBe('houselife'); });
      // a line spoken out loud is spoken by somebody on stage at that moment
      for (const S of segs) {
        let cast = new Set((S.cast || []).map(c => c[0]));
        for (const st of S.steps) {
          if (st.scene) cast = new Set(st.scene.cast.map(c => c[0]));
          if (st.k === 'say' && st.by) expect(cast.has(st.by), `${st.by} speaks off stage: ${st.t}`).toBe(true);
        }
      }
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
    const legacy = [{ id: 'bb-house-1' }, { id: 'bb-hoh' }, { id: 'bb-hacker', label: 'Hacker' }, { id: 'bb-noms' }, { id: 'bb-house-2' },
      { id: 'bb-vdraw' }, { id: 'bb-veto' }, { id: 'bb-cer' }, { id: 'bb-plans' }, { id: 'bb-evict' }, { id: 'bb-afterword', label: 'After' }]
      .map(x => ({ label: x.id, html: '<div></div>', ...x }));
    const out = bbStepScreens(row, legacy, { host: 'Valeria' });
    const ids = out.map(x => x.id);
    expect(ids).not.toContain('bb-plans');
    // the core screens are the stepped ones now, under the classic ids
    for (const id of ['bb-noms', 'bb-cer', 'bb-evict']) expect(out.find(x => x.id === id)?.html, id).toContain('class="bbx"');
    // a competition plays its own themed board (here the fixture's), in the stepped screen's slot
    for (const id of ['bb-hoh', 'bb-veto']) expect(out.find(x => x.id === id)?.html, id).toBe('<div></div>');
    // House Life stays: the classic feed is the week's record, every beat and the powers band
    expect(ids).toContain('bb-house-1');
    // (a twist that still keeps its classic screen; the Coin has a stepped set of its own now)
    expect(ids).toContain('bb-hacker');
    expect(ids).toContain('bb-afterword');
    expect(ids.indexOf('bb-hacker')).toBeGreaterThan(ids.indexOf('bb-hoh'));
    expect(ids.indexOf('bb-hacker')).toBeLessThan(ids.indexOf('bb-noms'));
  });
});

// ── finale night ───────────────────────────────────────────────────────
describe('finale night is in the viewer too', () => {
  let fin = null, screens = [];
  beforeAll(() => {
    setGs(null);
    const CAST10 = NAMES.slice(0, 10);
    setPlayers(CAST10.map((name, i) => ({ name, slug: name.toLowerCase(), gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
      stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3 + 5) % 10)])) })));
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 5, bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
    seasonConfig.twistSchedule = []; initGameState(); globalThis.gs = gs;
    withSeededRandom(5, () => { for (let i = 0; i < 12 && gs.activePlayers.length > 3; i++) simulateBBEpisode(); runBBFinale(); });
    fin = gs.episodeHistory.find(r => r.isFinale);
    screens = bbWeekSteps(fin, { host: 'Valeria' });
  }, 900000);

  it('plays the whole night as steps: the three parts, the cut, the jury, the winner', () => {
    expect(fin).toBeTruthy();
    const kinds = screens.map(s => s.kind);
    expect(kinds.filter(k => k === 'final-part')).toHaveLength(3);
    for (const k of ['brief', 'final-cut', 'jury-q', 'closing', 'jury-vote', 'afp']) expect(kinds, k).toContain(k);
  });
  it('crowns the winner the record crowned, after every juror has voted', () => {
    const S = screens.find(s => s.kind === 'jury-vote');
    const crown = S.steps.findIndex(s => s.winner);
    expect(S.steps[crown].winner).toBe(fin.winner);
    expect(S.steps.slice(0, crown).filter(s => s.juryVote).length).toBe((fin.acts.find(a => a.type === 'jury-vote').reasoning || []).length);
  });
  it('evicts the one the final HOH cut', () => {
    const S = screens.find(s => s.kind === 'final-cut');
    expect(S.steps.find(s => s.out)?.out).toBe(fin.cut || fin.acts.find(a => a.type === 'final-cut').cut);
  });
  it('paints every step', () => {
    screens.forEach((S, si) => { for (let i = -1; i < S.steps.length; i++) expect(stageHtml(screens, si, i, true, { season: 'default', host: 'Valeria' }).html).not.toMatch(/undefined|NaN/); });
  });
});

describe('House Life makes sense in order', () => {
  const talk = (a, b, extra = {}) => ({ players: [a, b], lines: [{ by: a, kind: 'say', text: 'hi' }, { by: b, kind: 'say', text: 'hey' }], ...extra });
  const dr = (by, about, extra = {}) => ({ players: [by, ...about], lines: [{ by, kind: 'dr', text: 'aside' }], ...extra });

  it('airs a Diary Room aside only beside the people it is about', () => {
    // the user's day 1: an alliance talk with a Diary Room line about a kiss with somebody else
    const alliance = talk('Axel', 'Bowie');
    const kiss = dr('Axel', ['Ripper']);
    const cs = conversationsOf([alliance, kiss]);
    expect(cs.find(c => c.beats.includes(alliance)).beats).not.toContain(kiss);
    expect(cs.find(c => c.beats.includes(kiss)).diary).toBe(true);
    // ...and one that IS about them stays in their conversation, after the talk
    const about = dr('Axel', ['Bowie']);
    const cs2 = conversationsOf([about, alliance]);
    expect(cs2).toHaveLength(1);
    expect(cs2[0].beats).toEqual([alliance, about]);
  });

  it('brings the setup of a payoff with it, in order', () => {
    const formed = talk('Axel', 'Bowie', { allianceId: 'a1', eventId: 'f' });
    const other = talk('Zee', 'Chase', { eventId: 'o' });
    const named = talk('Axel', 'Bowie', { allianceId: 'a1', eventId: 'n' });
    expect(withSetups([named], [formed, other, named], new Set())).toEqual([formed, named]);
  });
});
