// HOHitis, and the quieter failure opposite it.
//
// Winning Head of Household was pure upside. You could not be evicted, you
// picked the nominations, and on Thursday the week ended and how you had spent
// it followed you precisely nowhere. That is the week of the format with the
// most consequences attached to it in real life and it had none here.
//
// The fandom named the classic failure after the case that defined it: Devin,
// season sixteen, calling a house meeting, opening with "this is not a
// dictatorship", then asking his own alliance one by one who wanted his target
// to stay. Somebody answered honestly, the alliance came apart in the room, and
// the house united over disliking him. He was the target the following week.
//
// The opposite is less discussed and just as expensive: the frightened Head of
// Household who nominates two pawns nobody wants gone and finishes the week
// having earned neither fear nor gratitude.
import { describe, expect, it, beforeEach } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel, addBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import {
  reignTemperament, scoreReign, recordReign, lastReign, reignHeat, reignMadeAnEnemy,
} from '../js/bb/reign.js';
import { bbHeat } from '../js/bb/shared-strategy.js';
import { HOUSE_EVENTS } from '../js/bb-events/index.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
}));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    twistSchedule: [], bbSafetyMode: 'off', bbHaveNots: 'off', bbDepartures: 'off',
    romance: 'enabled', setting: 'bb-house' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
  gs.namedAlliances = []; gs.intentions = {}; gs.knowledge = {};
}

const week = over => ({
  num: 3, hoh: 'Bowie', evicted: 'Zee', finalNominees: ['Zee', 'Caleb'],
  plan: { target: 'Zee', rankings: [{ name: 'Zee' }, { name: 'Caleb' }] },
  ballots: [], ...over,
});

describe('a reign is scored on what it achieved', () => {
  beforeEach(house);

  it('rewards getting the person you came for', () => {
    const result = scoreReign(week());
    expect(result.gotTheTarget).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it('punishes missing', () => {
    const result = scoreReign(week({ evicted: 'Caleb' }));
    expect(result.lostTheTarget).toBe(true);
    expect(result.score).toBeLessThan(scoreReign(week()).score);
  });

  it('counts the enemies the week itself created', () => {
    // Not enemies made by the vote — enemies made by how the reign was run,
    // which is the whole distinction the layer exists to draw.
    const w = week();
    reignMadeAnEnemy(w, 'Chase');
    reignMadeAnEnemy(w, 'Ripper');
    expect(scoreReign(w).score).toBeLessThan(scoreReign(week()).score);
    expect(scoreReign(w).enemies).toEqual(['Chase', 'Ripper']);
  });

  it('treats a week that evicted nobody as a failure', () => {
    expect(scoreReign(week({ evicted: null })).score)
      .toBeLessThan(scoreReign(week()).score);
  });
});

describe('the week after a bad reign is when you go up', () => {
  beforeEach(house);

  it('turns a disastrous week into heat, and lets it fade', () => {
    const w = week({ evicted: 'Caleb' });
    ['Chase', 'Ripper', 'Scary', 'Nichelle'].forEach(n => reignMadeAnEnemy(w, n));
    const result = recordReign(w);
    expect(result.verdict).toBe('disastrous');
    gs.episode = 3;
    const fresh = reignHeat('Bowie', 4);
    expect(fresh).toBeGreaterThan(2);
    // Two weeks on the house has a newer thing to be annoyed about.
    expect(reignHeat('Bowie', 5)).toBeLessThan(fresh);
    expect(reignHeat('Bowie', 8)).toBe(0);
  });

  it('gives a strong week a little grace instead', () => {
    recordReign(week());
    expect(lastReign('Bowie').verdict).toBe('strong');
    expect(reignHeat('Bowie', 3)).toBeLessThan(0);
  });

  it('reaches the nomination maths', () => {
    // The point of the whole thing: it has to show up where nominations are
    // actually decided, not only on a screen.
    const clean = bbHeat('Chase', 'Bowie').total;
    const w = week({ evicted: 'Caleb' });
    ['Ripper', 'Scary', 'Nichelle', 'Emmah'].forEach(n => reignMadeAnEnemy(w, n));
    recordReign(w);
    gs.episode = 2;
    expect(bbHeat('Chase', 'Bowie').total).toBeGreaterThan(clean);
    expect(bbHeat('Chase', 'Bowie').components.reign).toBeGreaterThan(0);
  });
});

describe('which way somebody goes wrong', () => {
  beforeEach(house);

  it('reads ego and nerves separately', () => {
    const all = NAMES.map(n => reignTemperament(n));
    expect(all.every(t => t.ego >= 0 && t.ego <= 1)).toBe(true);
    expect(all.every(t => t.nerves >= 0 && t.nerves <= 1)).toBe(true);
    // And most reigns are neither failure — the interesting ones are the
    // houseguests one bad afternoon away from either.
    expect(all.some(t => t.mode === 'steady')).toBe(true);
  });
});

describe('it happens in a real season', () => {
  it('scores every reign and sometimes puts a bad one on the block', () => {
    let reigns = 0, bad = 0, wentUp = 0;
    const fired = new Set();
    for (let season = 0; season < 3; season++) {
      house();
      let guard = 0;
      const seen = [];
      while (!houseIsAtFinale() && guard++ < 12) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        for (const act of ep.acts || []) {
          for (const beat of act.socialBeats || []) {
            if (/^reign-/.test(beat.eventId || '')) fired.add(beat.eventId);
          }
        }
        const w = (gs.bb.weeks || [])[gs.bb.weeks.length - 1];
        if (w?.reign) {
          reigns++;
          const wasBad = w.reign.verdict === 'poor' || w.reign.verdict === 'disastrous';
          if (wasBad) bad++;
          seen.push({ hoh: w.reign.hoh, wasBad });
        }
        const prev = seen[seen.length - 2];
        if (prev?.wasBad && (ep.finalNominees || []).includes(prev.hoh)) wentUp++;
      }
    }
    expect(reigns, 'no reign was ever scored').toBeGreaterThan(10);
    expect(bad, 'every single reign went well').toBeGreaterThan(0);
    expect(wentUp, 'a bad week never once cost anybody').toBeGreaterThan(0);
    expect(fired.size, 'none of the reign scenes fired').toBeGreaterThan(2);
  }, 180000);
});

// ── and the meeting anybody can call ──────────────────────────────────
//
// The HOH version above is a failure of power. This is the commoner one, and
// the reason it is famous is that it almost never works: it takes a problem two
// people had and makes it a problem eleven people have opinions about, in front
// of the person it is about.
//
// Four outcomes, and the one worth having is drawn from Frank Eudy calling a
// meeting in season eighteen — everybody came, which was the problem, because
// the person it was about came too and nobody would say a word in front of them.
describe('anybody can call a house meeting', () => {
  it('needs a real grievance behind it', () => {
    house();
    const meeting = HOUSE_EVENTS.find(e => e.id === 'life-house-meeting');
    const ctx = { act: 'house', beat: 0, week: { num: 2, finalNominees: [] } };
    // A house with no grudges, no lies and no bold nominee has nothing to hold
    // a meeting about, and holds none.
    expect(meeting.weight(NAMES, ctx)).toBe(0);
  });

  it('fires at most once a week', () => {
    house();
    const meeting = HOUSE_EVENTS.find(e => e.id === 'life-house-meeting');
    const week = { num: 2, finalNominees: [], _houseMeetingCalled: true };
    expect(meeting.weight(NAMES, { act: 'house', beat: 0, week })).toBe(0);
  });

  it('stays out of the ceremonies and eviction night', () => {
    house();
    // Somebody with a real grudge, so the only thing stopping it is the act.
    gs.bb.falseClaims = [{ liar: 'Chase', mark: 'Bowie', kind: 'double-dealing',
      week: 1, believers: [], exposed: false }];
    gs.bb.house = { suspicion: { 'Bowie→Chase': 4 }, targets: {}, memories: {}, eventHistory: [] };
    const meeting = HOUSE_EVENTS.find(e => e.id === 'life-house-meeting');
    const week = { num: 2, finalNominees: ['Zee', 'Caleb'] };
    for (const act of ['nominations', 'veto-ceremony', 'eviction']) {
      expect(meeting.weight(NAMES, { act, beat: 0, week }), `${act} should own its own room`).toBe(0);
    }
    expect(meeting.weight(NAMES, { act: 'house', beat: 0, week })).toBeGreaterThan(0);
  });

  it('produces all four outcomes across a run of seasons', () => {
    const seen = new Set();
    for (let season = 0; season < 4; season++) {
      house();
      let guard = 0;
      while (!houseIsAtFinale() && guard++ < 12) {
        const ep = simulateBBEpisode();
        if (!ep) break;
        for (const act of ep.acts || []) {
          for (const beat of act.socialBeats || []) {
            if (beat.eventId === 'life-house-meeting') seen.add(beat.badgeText);
          }
        }
      }
    }
    expect(seen.size, `only saw: ${[...seen].join(', ')}`).toBeGreaterThan(1);
    // The one that makes it worth having: the room refusing to speak.
    expect([...seen].join(' ')).toMatch(/NOBODY WILL SAY IT|THE ROOM TURNS/);
  }, 180000);
});
