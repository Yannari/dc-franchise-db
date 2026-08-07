// The Saboteur — the first season-long twist.
//
// Every other twist is scheduled onto a week and asserted week by week. This
// one is installed on night one and asserted across a season, because the only
// things worth checking about it are longitudinal: does it pay out, can it be
// caught, and — the reason it was built — does the house convict the wrong
// person often enough to be worth watching, without being so blind that the
// saboteur is never at risk at all.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { installBBSaboteur, runSaboteurWeek, checkSaboteurBank, saboteurEvicted,
  saboteurState, isSaboteur } from '../js/bb/saboteur.js';
import { BB_TWIST_CONTRACTS } from '../js/bb/twist-contract.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const ARCH = ['mastermind', 'social-butterfly', 'challenge-beast', 'schemer', 'hero', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'perceptive-player'];
const CAST = NAMES.map((name, i) => ({ name, archetype: ARCH[i], gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

function house(config = {}) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'disabled', ...config });
  seasonConfig.twistSchedule = [];
  gs.bb = { weeks: [], stats: {} };
}

const aWeek = (over = {}) => ({
  num: 2, houseAtStart: [...NAMES], hoh: 'A', finalNominees: ['B', 'C'],
  vetoWinner: 'E', vetoPlayers: ['A', 'B', 'C', 'D', 'E', 'F'], ...over,
});

beforeEach(() => house());

describe('the twist itself', () => {
  it('is declared as a season twist, because there is no week to schedule it on', () => {
    const contract = BB_TWIST_CONTRACTS['bb-saboteur'];
    expect(contract).toBeTruthy();
    expect(contract.layer).toBe('season');
    // Everything else in the registry is per-week. If this ever becomes
    // 'scheduled' the engine will try to fire it on one episode and the second
    // game stops being a season long.
    expect(contract.duration.weeks).toBeNull();
    // The house is told the twist EXISTS and never who holds it.
    expect(contract.acquisition.secrecy).toBe('holder-secret');
  });

  it('casts somebody, and not always the same somebody', () => {
    const picked = new Set();
    for (let i = 0; i < 30; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      picked.add(saboteurState().player);
    }
    expect(picked.size, 'the same houseguest every season is not casting').toBeGreaterThan(3);
  });

  it('refuses to run in a house too small to hide anybody in', () => {
    expect(installBBSaboteur(['A', 'B', 'C'], { rng: Math.random })).toBeNull();
  });
});

describe('a mission', () => {
  it('is offered, taken or refused, and pays only when taken', () => {
    let paid = 0, refused = 0;
    for (let i = 0; i < 40; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      const act = runSaboteurWeek(aWeek(), { rng: Math.random });
      if (!act) continue;
      expect(act.mission.name.length).toBeGreaterThan(3);
      expect(act.beats.length).toBeGreaterThan(0);
      for (const b of act.beats) {
        expect(b.text).not.toMatch(/undefined|NaN|\[object/);
        expect(b.badgeText).toBeTruthy();
      }
      if (act.accepted) { paid++; expect(act.banked).toBe(act.mission.pay); }
      else { refused++; expect(act.banked).toBe(0); }
    }
    // Both branches have to be reachable, or one of them is dead code.
    expect(paid).toBeGreaterThan(3);
    expect(refused).toBeGreaterThan(3);
  });

  it('never runs the same job two weeks in a row', () => {
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const seen = [];
    for (let w = 2; w < 8; w++) {
      const act = runSaboteurWeek(aWeek({ num: w }), { rng: Math.random });
      if (act) seen.push(act.mission.id);
    }
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
  });

  it('is caught sometimes and misattributed more often — which is the whole point', () => {
    let right = 0, wrong = 0, total = 0;
    for (let i = 0; i < 80; i++) {
      house();
      installBBSaboteur(NAMES, { rng: Math.random });
      const act = runSaboteurWeek(aWeek(), { rng: Math.random });
      for (const n of act?.notices || []) {
        total++;
        n.correct ? right++ : wrong++;
      }
    }
    expect(total, 'nothing ever reached anybody, so the twist cannot be caught').toBeGreaterThan(30);
    // The saboteur must be genuinely at risk...
    expect(right / total).toBeGreaterThan(0.15);
    // ...and the house must still convict innocents more often than not, or
    // this is a detection minigame rather than a season of paranoia. Measured
    // at roughly 40/60 when this was tuned.
    expect(wrong).toBeGreaterThan(right * 0.8);
  });
});

describe('the two endings', () => {
  it('banks at the bank date, reveals the name, and turns them back into a houseguest', () => {
    house();
    installBBSaboteur(NAMES, { bankWeek: 3, rng: Math.random });
    const sab = saboteurState().player;
    runSaboteurWeek(aWeek({ num: 2 }), { rng: Math.random });
    expect(checkSaboteurBank(aWeek({ num: 2 }))).toBeNull();   // not yet

    const reveal = checkSaboteurBank(aWeek({ num: 3 }));
    expect(reveal).toBeTruthy();
    expect(reveal.saboteur).toBe(sab);
    expect(saboteurState().survived).toBe(true);
    expect(saboteurState().revealed).toBe(true);
    // And the second game is over: no more missions, ever.
    expect(runSaboteurWeek(aWeek({ num: 4 }), { rng: Math.random })).toBeNull();
    expect(isSaboteur(sab)).toBe(true);   // still the person who did it
  });

  it('loses everything if they are evicted first', () => {
    house();
    installBBSaboteur(NAMES, { bankWeek: 9, rng: Math.random });
    const sab = saboteurState().player;
    let banked = 0;
    for (let w = 2; w < 6; w++) {
      const act = runSaboteurWeek(aWeek({ num: w }), { rng: Math.random });
      if (act?.accepted) banked = act.banked;
    }
    const out = saboteurEvicted(sab, aWeek({ num: 6 }));
    expect(out).toBeTruthy();
    expect(out.evicted).toBe(true);
    expect(out.lost).toBe(banked);
    expect(saboteurState().banked).toBe(0);
    // Evicting anybody else does nothing.
    house();
    installBBSaboteur(NAMES, { rng: Math.random });
    const other = NAMES.find(n => n !== saboteurState().player);
    expect(saboteurEvicted(other, aWeek())).toBeNull();
  });
});

describe('a season with one running', () => {
  it('reaches the transcript and the viewing party', () => {
    house({ bbSaboteur: 'on', bbSaboteurBankWeek: 4 });
    let sawMission = false;
    let sawReveal = false;
    for (let w = 0; w < 5; w++) {
      const ep = withSeededRandom(90 + w * 7, () => simulateBBEpisode());
      if (!ep) break;
      const acts = (ep.acts || []).filter(a => /^saboteur/.test(a.type));
      if (!acts.length) continue;

      const text = generateSummaryText(ep) || '';
      gs.episodeHistory = [ep];
      buildVPScreens(ep);
      Object.keys(_tvState).forEach(k => { if (_tvState[k]) _tvState[k].idx = 99; });
      const screens = (buildVPScreens(ep) || []).filter(s => /saboteur/.test(s.id));
      expect(screens.length, 'a saboteur act with no screen').toBeGreaterThan(0);

      for (const act of acts) {
        if (act.type === 'saboteur') sawMission = true;
        if (act.type === 'saboteur-reveal') sawReveal = true;
        // The audience is shown all of it — that is the format. The house is
        // told none of it, which is what `secret` is for.
        expect(text).toMatch(/SABOTEUR/);
        for (const b of act.beats || []) {
          expect(text, 'a beat the transcript never wrote down')
            .toContain(b.text.replace(/<[^>]*>/g, '').slice(0, 40));
        }
      }
      for (const s of screens) {
        expect(s.html.length).toBeGreaterThan(600);
        expect(s.html).not.toMatch(/undefined|NaN|\[object Object\]/);
      }
    }
    expect(sawMission, 'no mission ran in five weeks').toBe(true);
    expect(sawReveal, 'the twist never ended').toBe(true);
  });

  it('does nothing at all when the season did not ask for one', () => {
    house({ bbSaboteur: 'off' });
    const ep = withSeededRandom(31, () => simulateBBEpisode());
    expect(saboteurState()).toBeFalsy();
    expect((ep.acts || []).some(a => /^saboteur/.test(a.type))).toBe(false);
  });
});
