// The last three days, and the three parts they lead into.
//
// Two things are worth pinning here. The memory wall must be about THIS season
// — a scene that could be pasted into any other season is the failure mode, and
// it is invisible unless you check the names against the ledger. And the three
// parts must be three SCREENS: they were merged behind an id guard for a long
// time, which is exactly the kind of thing that quietly comes back.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBSeason } from '../js/bb/week.js';
import { runBBFinale } from '../js/bb-run.js';
import { buildVPScreens } from '../js/vp-screens.js';
import { finaleHouseLines } from '../js/bb/finale-house.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i], stats: spread(i + 1),
}));
const seededRng = (seed = 5) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

function playSeason(seed) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.popularity = {}; gs.showmances = []; gs.romanticSparks = []; gs.episodeHistory = [];
  Object.assign(seasonConfig, { format: 'big-brother', romance: 'enabled',
    finaleSize: 3, jurySize: 7, twistSchedule: [] });
  simulateBBSeason({ rng: seededRng(seed) });
  return runBBFinale();
}

describe('the final three', () => {
  beforeEach(() => { /* each test plays its own season */ });

  it('runs before anything is played for', () => {
    const ep = playSeason(7);
    const types = (ep.acts || []).map(a => a.type);
    expect(types).toContain('finale-house');
    // It is about Part Three, so it cannot happen after it.
    expect(types.indexOf('finale-house')).toBeLessThan(types.indexOf('final-hoh-part'));
  });

  it('remembers THIS season and not a generic one', () => {
    const ep = playSeason(7);
    const act = (ep.acts || []).find(a => a.type === 'finale-house');
    const wall = (act.acts || []).find(a => a.title === 'The Memory Wall');
    expect(wall).toBeTruthy();
    const text = wall.beats.map(b => b.text).join(' ');
    // Every name it uses has to be somebody who actually played.
    const evicted = (gs.bb.weeks || []).map(w => w.evicted).filter(Boolean);
    expect(evicted.some(name => text.includes(name))).toBe(true);
    // And it must not spend two beats on the same week.
    const weeksCited = [...text.matchAll(/week (\d+)/gi)].map(m => m[1]);
    expect(new Set(weeksCited).size).toBe(weeksCited.length);
  });

  it('revises by a continuous figure, not a coin flip', () => {
    const ep = playSeason(7);
    const act = (ep.acts || []).find(a => a.type === 'finale-house');
    const values = Object.values(act.study || {});
    expect(values.length).toBeGreaterThan(1);
    for (const v of values) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
    // Different people revise different amounts.
    expect(new Set(values).size).toBeGreaterThan(1);
    // And it is published for the quiz to read.
    expect(gs.bb.finaleStudy).toEqual(act.study);
  });

  it('reaches the transcript', () => {
    const ep = playSeason(7);
    expect(ep.summaryText).toContain('THE FINAL THREE');
    expect(ep.summaryText).toContain('THE MEMORY WALL');
    expect(ep.summaryText).toMatch(/Revision: /);
    const act = (ep.acts || []).find(a => a.type === 'finale-house');
    const lines = [];
    finaleHouseLines(act, l => lines.push(l));
    expect(lines.length).toBeGreaterThan(6);
  });
});

describe('the three parts', () => {
  it('each get their own screen', () => {
    const ep = playSeason(7);
    const labels = (buildVPScreens(ep) || []).map(s => s.label);
    expect(labels).toContain('The Final Three');
    expect(labels).toContain('Part 1 · Endurance');
    expect(labels).toContain('Part 2 · Skill');
    expect(labels).toContain('Part 3 · The Jury Quiz');
    // In order, and before the vote.
    expect(labels.indexOf('Part 1 · Endurance')).toBeLessThan(labels.indexOf('Part 2 · Skill'));
    expect(labels.indexOf('Part 2 · Skill')).toBeLessThan(labels.indexOf('Part 3 · The Jury Quiz'));
    expect(labels.indexOf('Part 3 · The Jury Quiz')).toBeLessThan(labels.indexOf('The Jury Vote'));
  });

  it('draws each part rather than listing it', () => {
    const ep = playSeason(7);
    const screens = buildVPScreens(ep) || [];
    for (const label of ['Part 1 · Endurance', 'Part 2 · Skill', 'Part 3 · The Jury Quiz']) {
      const html = screens.find(s => s.label === label).html;
      expect(html.length, `${label} is empty`).toBeGreaterThan(400);
      expect(html).not.toContain('undefined');
    }
  });
});
