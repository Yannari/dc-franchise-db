// The week's ceremonies as dialogue (spec 2026-10-01 Phase 4).
//
// The engine decides each ceremony; bb/script/ceremony.js writes what the
// houseguests said at it the moment the act is recorded (act.script), and the
// stepped viewer plays those lines. These tests play real-roster seasons and
// hold the words to the record.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { POOLS } from '../js/bb/script/lines/index.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const R = JSON.parse(readFileSync(resolve(process.cwd(), 'franchise_roster.json'), 'utf8'));
const POOL = (Array.isArray(R) ? R : R.players || Object.values(R)[0]).filter(p => p?.stats && p.name);

function playSeason(seed, shift) {
  const cast = Array.from({ length: 14 }, (_, i) => POOL[(i * 11 + 3 + shift) % POOL.length]).map(p => ({ name: p.name,
    archetype: p.archetype || 'floater', gender: p.gender || 'm', sexuality: p.sexuality || 'straight', stats: { ...p.stats } }));
  seedGame(cast, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7, popularityEnabled: true });
  seasonConfig.twistSchedule = [];
  gs.riPlayers = gs.riPlayers || []; gs.tribes = gs.tribes || [];
  withSeededRandom(seed, () => { for (let w = 0; w < 16 && gs.phase !== 'complete'; w++) simulateBBEpisode(); });
  return (gs.episodeHistory || []).map(ep => JSON.parse(JSON.stringify(ep)));
}
const outcome = eps => eps.map(ep => [ep.hoh, ...(ep.initialNominees || []), ep.vetoWinner, ep.evicted].join('|')).join(' / ');
const partsOf = act => Object.entries(act.script || {}).flatMap(([k, v]) => (Array.isArray(v) ? [[k, v]] : Object.values(v).map(lines => [k, lines])));

let seasons = [];
beforeAll(() => { seasons = [playSeason(4242, 0), playSeason(777, 5)]; }, 900000);

describe('every ceremony is written', () => {
  it('writes each part of the week somewhere in two seasons', () => {
    const seen = new Set();
    for (const eps of seasons) for (const ep of eps) for (const act of ep.acts || []) for (const [k] of partsOf(act)) seen.add(k);
    for (const k of ['hoh', 'noms', 'nomDr', 'veto', 'holderDr', 'pleas', 'renom', 'goodbye']) expect(seen.has(k), `no ${k} was written`).toBe(true);
  });

  it('fills every slot, and only people in the house that week speak', () => {
    for (const eps of seasons) {
      const gone = new Set();
      for (const ep of eps) {
        const house = new Set(ep.houseAtStart || []);
        for (const act of ep.acts || []) {
          for (const [k, lines] of partsOf(act)) {
            for (const l of lines) {
              expect(l.text, `week ${ep.num} ${k}`).not.toMatch(/[{}]|undefined|null/);
              if (!l.by) continue;
              expect(house.has(l.by), `week ${ep.num} ${k}: ${l.by} is not in the house`).toBe(true);
              expect(gone.has(l.by), `week ${ep.num} ${k}: ${l.by} was evicted earlier and still speaks`).toBe(false);
            }
          }
        }
        if (ep.evicted) gone.add(ep.evicted);
      }
    }
  });

  it('gives a nominee one Diary Room at the nominations, not two', () => {
    for (const eps of seasons) for (const ep of eps) {
      const act = (ep.acts || []).find(a => a.type === 'nominations' && a.script);
      if (!act) continue;
      const drs = [...(act.script.noms || []), ...Object.values(act.script.nomDr || {}).flat()].filter(l => l.kind === 'dr').map(l => l.by);
      expect(new Set(drs).size, `week ${ep.num}: ${drs.join(', ')}`).toBe(drs.length);
    }
  });
});

describe('a season does not repeat itself', () => {
  it('keeps repeated ceremony lines under 3% of a season, and nobody says the same line twice', () => {
    for (const eps of seasons) {
      const heard = new Map();
      let lines = 0, repeats = 0;
      for (const ep of eps) for (const act of ep.acts || []) for (const [, ls] of partsOf(act)) for (const l of ls) {
        if (l.kind === 'beat' || l.text.length < 20) continue;
        lines++;
        const by = heard.get(l.text);
        if (by) { repeats++; expect(by.has(l.by), `${l.by} says "${l.text}" twice`).toBe(false); by.add(l.by); }
        else heard.set(l.text, new Set([l.by]));
      }
      expect(lines).toBeGreaterThan(60);
      expect(repeats / lines, `${repeats} of ${lines} lines repeat`).toBeLessThan(0.03);
    }
  });
});

describe('the words have their own dice', () => {
  it('plays the same season with the ceremony lines taken away', () => {
    // Picking a sentence must not move a single draw the engine makes, or
    // writing the words would change who wins the season. With the pools gone
    // nothing is picked at all; the season must come out the same. (Adding a
    // line to a pool does NOT test this: the picker draws once however big
    // the pool is, so that version passed with the engine's own dice.)
    const before = outcome(seasons[0]);
    const taken = Object.keys(POOLS).filter(k => /^(hoh|noms|veto|evict)\./.test(k)).map(k => [k, POOLS[k]]);
    for (const [k] of taken) delete POOLS[k];
    try {
      const after = playSeason(4242, 0);
      expect(after.some(ep => (ep.acts || []).some(a => a.script)), 'the pools were not taken away').toBe(false);
      expect(outcome(after)).toBe(before);
    } finally {
      for (const [k, pool] of taken) POOLS[k] = pool;
    }
  }, 900000);
});

describe('the viewer plays what was written', () => {
  const texts = steps => steps.map(s => s.t);
  it('airs the speech, the pleas and the goodbye in their ceremonies', () => {
    let checked = 0;
    for (const eps of seasons) for (const ep of eps) {
      const screens = bbWeekSteps(ep, { host: 'Valeria' });
      const noms = (ep.acts || []).find(a => a.type === 'nominations' && a.script?.noms);
      const nomScreen = screens.find(S => S.kind === 'noms');
      if (noms && nomScreen) {
        for (const l of noms.script.noms) expect(texts(nomScreen.steps)).toContain(l.text);
        checked++;
      }
      const cer = (ep.acts || []).find(a => a.type === 'veto-ceremony' && a.script?.pleas);
      const cerScreen = screens.find(S => S.kind === 'cer');
      if (cer && cerScreen) for (const lines of Object.values(cer.script.pleas)) for (const l of lines) expect(texts(cerScreen.steps)).toContain(l.text);
      const ev = (ep.acts || []).find(a => a.type === 'eviction' && a.script?.goodbye);
      const evScreen = screens.find(S => S.kind === 'evict');
      if (ev && evScreen) {
        const i = evScreen.steps.findIndex(s => s.out);
        const door = evScreen.steps.findIndex(s => s.exit);
        for (const l of ev.script.goodbye) {
          const at = evScreen.steps.findIndex(s => s.t === l.text);
          expect(at, `week ${ep.num}: goodbye line missing`).toBeGreaterThan(i);
          expect(at, `week ${ep.num}: goodbye after the door closed`).toBeLessThan(door);
        }
      }
    }
    expect(checked).toBeGreaterThan(5);
  });
});
